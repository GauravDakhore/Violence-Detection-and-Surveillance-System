# ML Model Integration - Setup Guide

## Overview
Your `modelnew.h5` model has been integrated into the surveillance dashboard. The system works as follows:

1. **Backend (Python)**: Loads and runs the ML model using TensorFlow
2. **Frontend (React)**: Captures frames from camera feeds and sends them to the backend
3. **Real-time Updates**: Uses Socket.io for real-time prediction results

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           React Surveillance Dashboard                   │
│  - Displays camera feeds                                │
│  - Shows ML predictions in real-time                    │
│  - Captures frames from video streams                   │
└──────────────────┬──────────────────────────────────────┘
                   │ Socket.io Connection (localhost:3000)
                   ↓
┌─────────────────────────────────────────────────────────┐
│         Python ML Backend (Flask + Socket.io)           │
│  - Loads modelnew.h5 model                              │
│  - Receives video frames from frontend                  │
│  - Runs inference using TensorFlow                      │
│  - Returns predictions in real-time                     │
└─────────────────────────────────────────────────────────┘
```

## Installation Steps

### 1. Prerequisites
- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** (optional)

### 2. Quick Setup (Windows)

Double-click `start-all.bat` to automatically:
- Install Python dependencies
- Install Node.js dependencies
- Verify everything is working

### 3. Quick Setup (macOS/Linux)

```bash
chmod +x start-all.sh
./start-all.sh
```

### 4. Manual Setup

#### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt
```

#### Frontend Setup
```bash
cd surveillance-dashboard
npm install
```

## Running the Application

### Option 1: Run Both Services in Separate Terminals

**Terminal 1 - Backend:**
```bash
python backend.py
```
You should see:
```
============================================================
Surveillance Dashboard ML Backend
============================================================
Starting Flask + Socket.io server on http://localhost:3000
============================================================
```

**Terminal 2 - Frontend:**
```bash
cd surveillance-dashboard
npm run dev
```
You should see:
```
  VITE v7.1.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Then open http://localhost:5173/ in your browser.

### Option 2: Use Task Manager (VS Code)

In VS Code, press `Ctrl+Shift+D` and run the predefined tasks:
- "Start ML Backend"
- "Start Dashboard Frontend"

## What the Integration Does

### Frame Capture
- Every 2 seconds, the camera cards capture a frame from the video stream
- Frames are sent to the Python backend via Socket.io

### Inference Processing
- The backend receives the frame and preprocesses it
- The `modelnew.h5` model runs inference
- Predictions are returned to the frontend

### Real-time Display
- Camera cards show an "ML Active" badge when connected
- Predictions are displayed with confidence scores
- Status updates appear in real-time

## Monitoring

### Backend Logs
Watch the Python terminal for:
- ✓ Model loaded successfully
- Frame processing logs
- Prediction results
- Error messages

### Frontend Console
Open Browser DevTools (F12) and check the Console for:
- ML Service initialization
- Frame capture status
- Prediction events
- Socket.io connection status

## Troubleshooting

### Backend Fails to Start
**Problem**: "ModuleNotFoundError: No module named 'tensorflow'"
**Solution**:
```bash
pip install --upgrade tensorflow
```

**Problem**: "Model file not found"
**Solution**: Ensure `modelnew.h5` is in the `surveillance-dashboard/` folder:
```
d:\surveillance-dashboard (1)\
└── surveillance-dashboard\
    └── modelnew.h5
```

### Frontend Doesn't Connect to Backend
**Problem**: "Connection refused on localhost:3000"
**Solution**: 
1. Make sure backend is running: `python backend.py`
2. Check if port 3000 is in use: `netstat -tulpn | grep 3000`
3. Change port in `src/api/socket.js` if needed

### Frames Not Being Sent
**Problem**: "Frame capture error" in console
**Solution**:
1. Check if camera streams are accessible at `http://localhost:5000/video/*`
2. Verify CORS settings in backend.py
3. Check browser console for specific errors

### Model Takes Too Long
**Problem**: Slow predictions
**Solution**:
1. Reduce inference frequency in `CameraCard.jsx` (currently 2000ms)
2. Use smaller image sizes for preprocessing
3. Consider using GPU if available

## Configuration

### Adjust Frame Capture Rate
Edit `src/components/CameraCard.jsx`:
```javascript
// Change from 2000ms (2 seconds)
inferenceIntervalRef.current = setInterval(() => {
  // ...
}, 2000); // Adjust this value
```

### Configure Backend Port
Edit `backend.py`:
```python
socketio.run(app, host='0.0.0.0', port=3000, debug=True)
# Change port from 3000 if needed
```

And update frontend in `src/api/socket.js`:
```javascript
const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
// Change port to match
```

## API Reference

### Socket.io Events

#### Frontend → Backend
- **`frame`**: Send frame for inference
  ```javascript
  {
    image: "base64_encoded_image",
    camera_id: "cam-01",
    timestamp: 1686345000000
  }
  ```

#### Backend → Frontend
- **`prediction`**: Inference results
  ```javascript
  {
    camera_id: "cam-01",
    prediction: [...array...],
    max_value: 0.95,
    min_value: 0.01,
    timestamp: 1686345000000
  }
  ```

- **`model_info`**: Model metadata
  ```javascript
  {
    loaded: true,
    input_shape: "(1, 224, 224, 3)",
    output_shape: "(1, 1000)",
    layers: 152
  }
  ```

### REST API Endpoints

- **`GET /health`**: Check backend status
- **`POST /api/predict`**: Send frame for inference
  - Request: `{ image: "base64", camera_id: "cam-01" }`
  - Response: `{ prediction: [...], max_value: 0.95, ... }`

## Advanced Configuration

### Use GPU Acceleration
```python
# In backend.py, TensorFlow will automatically use GPU if available
import tensorflow as tf
print(f"GPU Available: {tf.config.list_physical_devices('GPU')}")
```

### Custom Preprocessing
Edit the `run_inference()` function in `backend.py` to customize:
- Image resizing
- Normalization
- Data augmentation

### Custom Result Display
Edit `CameraCard.jsx` to show different prediction formats:
- Bounding boxes (object detection)
- Class probabilities (classification)
- Segmentation masks
- Custom visualizations

## Next Steps

1. ✅ Backend running and model loaded
2. ✅ Frontend connected and sending frames
3. 🎯 View predictions in real-time
4. 🔧 Customize UI to show specific model outputs
5. 📊 Integrate with alert system (see `AlertSystem.jsx`)
6. 🚀 Deploy to production

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review browser console (F12)
3. Check Python terminal output
4. Review log files in `logs/` directory (if enabled)

---

**Happy monitoring!** 🎥🤖
