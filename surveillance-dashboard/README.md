# Surveillance Dashboard (React + Vite)

This project is a browser-based surveillance dashboard that renders live camera feeds, real-time analytics, and anomaly alerts. It uses Socket.IO for streaming metadata such as detection boxes and anomaly events.

## Prerequisites

- Node.js 18+
- A running Socket.IO backend that emits `boxes` and `anomaly` events

## Run the frontend

1. Install dependencies:

```bash
npm install
```

2. Configure the Socket.IO endpoint with `VITE_SOCKET_URL` (optional, defaults to `http://localhost:3000`):

```bash
# Windows (Powershell)
$env:VITE_SOCKET_URL="http://localhost:3000"

# macOS/Linux
export VITE_SOCKET_URL="http://localhost:3000"
```

3. Start the dev server:

```bash
npm run dev
```

Open the printed local URL in a browser (e.g., `http://localhost:5173`).

## Socket events

The frontend expects a Socket.IO server and consumes two events: `boxes` and `anomaly`.

### `boxes`

Sent frequently (e.g., per frame) to render detection overlays on camera streams.

Example payload:

```json
{
  "cameraId": "CAM-01",
  "ts": 1716412345678,
  "boxes": [
    { "x": 0.12, "y": 0.28, "w": 0.20, "h": 0.34, "label": "person", "score": 0.93 },
    { "x": 0.55, "y": 0.22, "w": 0.18, "h": 0.30, "label": "bag", "score": 0.81 }
  ]
}
```

Notes:
- `x, y, w, h` are normalized to the frame size (0..1)
- `ts` is a Unix epoch (ms)

### `anomaly`

Represents a higher-level incident. Used by Alerts and Analytics, and can be opened in a modal for details.

Example payload:

```json
{
  "id": "INC-1024",
  "type": "Unauthorized Access",
  "cameraId": "CAM-07",
  "ts": 1716412399000,
  "severity": "High",
  "snapshotUrl": "https://example.com/snapshots/inc-1024.jpg",
  "ids": ["P-88", "V-212"],
  "extra": { "zone": "Door-3" }
}
```

Accepted/optional fields used by the UI:
- `id` (string)
- `type` (string)
- `cameraId` (string)
- `ts`/`timestamp`/`time`/`detectedAt` (number|string)
- `snapshotUrl`/`imageUrl`/`thumbnail` (string)
- `ids`/`involvedIds`/`participants` (string[])
- Any additional keys are shown under metadata in the incident modal.

## RTSP to HLS for browser playback

Browsers cannot play RTSP directly. Convert RTSP to an HLS stream (MPEG-TS segments with an `.m3u8` playlist) and then play via a video element or a player library.

### Quick approach with FFmpeg

```bash
ffmpeg -rtsp_transport tcp -i rtsp://USER:PASS@HOST:554/stream1 \
  -c:v libx264 -preset veryfast -g 48 -sc_threshold 0 \
  -c:a aac -ar 44100 -b:a 128k \
  -f hls -hls_time 2 -hls_list_size 6 -hls_flags delete_segments+independent_segments \
  -master_pl_name master.m3u8 -hls_segment_type mpegts \
  /var/www/hls/cam01.m3u8
```

Key flags:
- `-rtsp_transport tcp`: more reliable over lossy networks
- `-g 48`: GOP size (for 24 fps ~ 2s)
- `-hls_time 2`: segment duration
- `-hls_list_size 6` and `delete_segments`: rolling window to limit latency and disk usage

Serve the generated `.m3u8` and segment files over HTTP(S) (e.g., Nginx). Point your frontend player to the playlist URL.

### Alternatives

- Use a media server (Wowza, Nimble, Ant Media, OvenMediaEngine) to ingest RTSP and output HLS/DASH/LL-HLS.
- For ultra-low latency, consider WebRTC gateways, but they require different client players and server setup.
