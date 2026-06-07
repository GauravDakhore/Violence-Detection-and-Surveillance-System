# Violence Detection & Surveillance System

A real-time surveillance dashboard powered by machine learning. Process live camera feeds, detect anomalies, and manage alerts all from one unified interface.

## What This Does

- **Real-time Video Processing** - Stream video feeds directly in your browser
- **ML-Powered Detection** - Uses a trained TensorFlow model to identify incidents
- **Live Alerts** - Get instant notifications when something goes wrong
- **Alert Management** - Review, categorize, and manage incidents as they happen
- **Analytics Dashboard** - Track patterns and trends over time
- **Multi-camera Support** - Handle multiple feeds simultaneously

## Tech Stack

**Backend**
- Flask with Socket.IO for real-time updates
- TensorFlow for model inference
- Python 3.8+

**Frontend**
- React 19 with Vite
- Socket.IO client for live data streaming
- Recharts for analytics visualization

## Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 18+
- Your trained model file (`modelnew.h5`)

### Setup & Run

**Windows:**
```bash
# Run the automated setup (handles dependencies)
start-all.bat

# Then in two separate terminals:
# Terminal 1: Backend
python backend.py

# Terminal 2: Frontend
cd surveillance-dashboard
npm run dev
```

**macOS / Linux:**
```bash
# Run the automated setup
./start-all.sh

# Then in two separate terminals:
# Terminal 1: Backend
python backend.py

# Terminal 2: Frontend
cd surveillance-dashboard
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

```
.
├── backend.py                      # Flask API & ML inference server
├── requirements.txt                # Python dependencies
├── surveillance-dashboard/         # React frontend
│   ├── src/
│   │   ├── components/            # UI components (Camera, Alerts, etc.)
│   │   ├── pages/                 # Main views (Dashboard, AlertSystem)
│   │   ├── api/                   # API & Socket.IO clients
│   │   └── App.jsx                # Main app component
│   ├── package.json
│   └── vite.config.js
├── start-all.bat                  # Windows setup automation
└── start-all.sh                   # Unix setup automation
```

## How It Works

1. **Backend loads your ML model** (`modelnew.h5`) using TensorFlow on startup
2. **Frontend captures video frames** and sends them to the backend
3. **Backend runs inference** and returns predictions in real-time via Socket.IO
4. **Dashboard displays** live detections, anomalies, and generates alerts
5. **Alert system** routes critical incidents to the management interface

## Configuration

### Environment Variables (Frontend)
```bash
VITE_SOCKET_URL=http://localhost:3000  # Backend API endpoint (optional)
```

### Backend Port
The Flask server runs on `http://localhost:3000` by default.

### Frontend Port
The React dev server runs on `http://localhost:5173` by default.

## Features in Detail

### Dashboard
- Live camera grid view
- Real-time detection overlays
- FPS and latency monitoring
- Quick stats at a glance

### Alerts & Incidents
- Automatic alert generation on detection
- Alert history and filtering
- Severity categorization
- Manual review and tagging

### Analytics
- Detection timeline charts
- Incident frequency analysis
- System performance metrics
- Exportable reports

## Dependencies

### Python
See `requirements.txt` - key packages include:
- Flask 3.0.0
- TensorFlow 2.16.1
- OpenCV 4.8.1
- Socket.IO

### JavaScript/Node
Check `surveillance-dashboard/package.json` - includes:
- React 19
- Socket.IO Client
- Recharts
- Vite

## Troubleshooting

**Model won't load?**
- Check that `modelnew.h5` exists in the root directory
- Ensure TensorFlow is properly installed: `pip install tensorflow==2.16.1`

**Frontend can't connect to backend?**
- Make sure backend is running on port 3000: `python backend.py`
- Check your firewall settings
- Verify `VITE_SOCKET_URL` environment variable if behind a proxy

**Dependencies failing?**
- Run the setup scripts (`start-all.bat` or `start-all.sh`)
- Or manually: `pip install -r requirements.txt` + `npm install` in surveillance-dashboard

## Next Steps

- Review `ML-SETUP-GUIDE.md` for detailed ML integration notes
- Check `QUICKSTART.md` for step-by-step getting started
- Customize camera feeds in `src/components/CameraCard.jsx`
- Tune alert thresholds in `src/pages/AlertSystem.jsx`

## License

[Add your license here]

## Questions?

Open an issue if you run into problems or have suggestions!
