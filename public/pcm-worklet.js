const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 1600;

class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / TARGET_RATE;
    this.position = 0;
    this.accumulator = 0;
    this.accumulatedCount = 0;
    this.levelSum = 0;
    this.levelCount = 0;
    this.resetBuffer();
    this.port.onmessage = (event) => {
      if (event.data === 'flush') this.flush();
    };
  }

  resetBuffer() {
    this.buffer = new Int16Array(CHUNK_SAMPLES);
    this.offset = 0;
  }

  flush() {
    const rms = this.levelCount > 0 ? Math.sqrt(this.levelSum / this.levelCount) : 0;
    const chunk = this.buffer.slice(0, this.offset);
    this.port.postMessage({ type: 'audio', buffer: chunk.buffer, rms }, [chunk.buffer]);
    this.levelSum = 0;
    this.levelCount = 0;
    this.resetBuffer();
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];

    for (let i = 0; i < channel.length; i += 1) {
      let sample = channel[i];
      if (input.length > 1) {
        sample = 0;
        for (let c = 0; c < input.length; c += 1) sample += input[c][i];
        sample /= input.length;
      }

      this.levelSum += sample * sample;
      this.levelCount += 1;
      this.accumulator += sample;
      this.accumulatedCount += 1;
      this.position += 1;

      if (this.position >= this.ratio) {
        this.position -= this.ratio;
        const value = Math.max(-1, Math.min(1, this.accumulator / this.accumulatedCount));
        this.buffer[this.offset] = value < 0 ? value * 0x8000 : value * 0x7fff;
        this.offset += 1;
        this.accumulator = 0;
        this.accumulatedCount = 0;

        if (this.offset === CHUNK_SAMPLES) this.flush();
      }
    }

    return true;
  }
}

registerProcessor('pcm-processor', PcmProcessor);
