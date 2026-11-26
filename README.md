# Speech to Text - Frontend

React (Vite) app for recording speech and managing saved transcriptions.

## Features

- Record from the microphone and see the text while speaking (partial + final results)
- Language selection: auto detect (works for Hindi + English mixed), English, Hindi and other Indian languages
- Transcription is saved automatically when recording stops
- Dashboard with search, filters, sorting, pagination and stats
- Create, view, edit and delete transcriptions
- Detail page with the original timed segments, copy and download as .txt

## Setup

The backend needs to be running first (see the backend folder).

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

The browser only allows microphone access on `localhost` or over `https`.

## Environment variables

| Variable       | Default                              |
| -------------- | ------------------------------------ |
| `VITE_API_URL` | `http://localhost:4000`              |
| `VITE_WS_URL`  | `ws://localhost:4000/ws/transcribe`  |

## Docker

```bash
docker build -t stt-frontend \
  --build-arg VITE_API_URL=http://localhost:4000 \
  --build-arg VITE_WS_URL=ws://localhost:4000/ws/transcribe .
docker run -p 8080:80 stt-frontend
```

The app is served by nginx at http://localhost:8080

## Structure

```
public/pcm-worklet.js     audio worklet, converts mic input to 16 kHz PCM
src/
  api/                    REST client
  hooks/useTranscriber.js mic capture + websocket handling
  components/             layout, modal, form, pagination, etc.
  pages/                  record, dashboard, detail
```
# SpeechToTextFrontend
