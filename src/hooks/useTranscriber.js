import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_URL } from '../config.js';

const MIC_CONSTRAINTS = {
  audio: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

const describeMicError = (error) => {
  if (error?.name === 'NotAllowedError') return 'Microphone permission was denied.';
  if (error?.name === 'NotFoundError') return 'No microphone was found on this device.';
  return error?.message || 'Unable to access the microphone.';
};

export const useTranscriber = () => {
  const [status, setStatus] = useState('idle');
  const [segments, setSegments] = useState([]);
  const [partial, setPartial] = useState('');
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const pendingStartRef = useRef(null);

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const teardownAudio = useCallback(async () => {
    const audio = audioRef.current;
    audioRef.current = null;
    if (!audio) return;
    audio.worklet.port.onmessage = null;
    audio.source.disconnect();
    audio.worklet.disconnect();
    audio.stream.getTracks().forEach((track) => track.stop());
    await audio.context.close().catch(() => {});
    setLevel(0);
  }, []);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState <= WebSocket.OPEN) socket.close();
  }, []);

  const fail = useCallback(
    async (message) => {
      setError(message);
      setStatus('error');
      stopTimer();
      await teardownAudio();
      closeSocket();
    },
    [teardownAudio, closeSocket],
  );

  const startAudio = useCallback(async (stream) => {
    const context = new AudioContext();
    await context.audioWorklet.addModule('/pcm-worklet.js');
    const source = context.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(context, 'pcm-processor');
    const silentSink = context.createGain();
    silentSink.gain.value = 0;

    worklet.port.onmessage = ({ data }) => {
      if (data.type !== 'audio') return;
      setLevel(Math.min(1, data.rms * 6));
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN && data.buffer.byteLength > 0) {
        socket.send(data.buffer);
      }
    };

    source.connect(worklet);
    worklet.connect(silentSink).connect(context.destination);
    audioRef.current = { context, source, worklet, stream };
  }, []);

  const handleMessage = useCallback(
    async (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (message.type) {
        case 'ready':
          socketRef.current?.send(JSON.stringify({ type: 'start', ...pendingStartRef.current.options }));
          break;
        case 'started': {
          const startedAt = Date.now();
          const { stream } = pendingStartRef.current;
          pendingStartRef.current = null;
          try {
            await startAudio(stream);
          } catch {
            stream.getTracks().forEach((track) => track.stop());
            await fail('Could not start audio capture in this browser.');
            break;
          }
          setStatus('recording');
          timerRef.current = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 250);
          break;
        }
        case 'partial':
          setPartial(message.text);
          break;
        case 'final':
          setPartial('');
          if (message.text) {
            setSegments((previous) =>
              [...previous, message].sort((a, b) => a.segmentId - b.segmentId),
            );
          }
          break;
        case 'processing':
          setStatus('processing');
          break;
        case 'saved':
          setResult({ transcription: message.transcription, message: message.message });
          setStatus('done');
          closeSocket();
          break;
        case 'discarded':
          setStatus('idle');
          closeSocket();
          break;
        case 'error':
          if (message.fatal) await fail(message.message);
          else setError(message.message);
          break;
        default:
          break;
      }
    },
    [startAudio, closeSocket, fail],
  );

  const start = useCallback(
    async ({ language, title }) => {
      if (status === 'connecting' || status === 'recording' || status === 'processing') return;

      setError('');
      setSegments([]);
      setPartial('');
      setResult(null);
      setElapsed(0);
      setStatus('connecting');

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
      } catch (micError) {
        await fail(describeMicError(micError));
        return;
      }

      pendingStartRef.current = { stream, options: { language, title } };

      const socket = new WebSocket(WS_URL);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;
      socket.onmessage = handleMessage;
      socket.onerror = () => fail('Could not connect to the transcription server.');
      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
          setStatus((current) =>
            current === 'recording' || current === 'processing' || current === 'connecting' ? 'error' : current,
          );
          setError((current) => current || 'Connection to the transcription server was lost.');
          stopTimer();
          teardownAudio();
        }
        if (pendingStartRef.current) {
          pendingStartRef.current.stream.getTracks().forEach((track) => track.stop());
          pendingStartRef.current = null;
        }
      };
    },
    [status, handleMessage, fail, teardownAudio],
  );

  const finish = useCallback(
    async (type) => {
      const socket = socketRef.current;
      if (!socket || status !== 'recording') return;
      stopTimer();
      audioRef.current?.worklet.port.postMessage('flush');
      await new Promise((resolve) => setTimeout(resolve, 50));
      await teardownAudio();
      setStatus('processing');
      socket.send(JSON.stringify({ type }));
    },
    [status, teardownAudio],
  );

  const stop = useCallback(() => finish('stop'), [finish]);
  const cancel = useCallback(() => finish('cancel'), [finish]);

  const reset = useCallback(() => {
    setStatus('idle');
    setSegments([]);
    setPartial('');
    setResult(null);
    setError('');
    setElapsed(0);
  }, []);

  useEffect(
    () => () => {
      stopTimer();
      teardownAudio();
      closeSocket();
    },
    [teardownAudio, closeSocket],
  );

  return {
    status,
    segments,
    partial,
    level,
    elapsed,
    error,
    result,
    start,
    stop,
    cancel,
    reset,
    transcript: segments.map((segment) => segment.text).join(' '),
  };
};
