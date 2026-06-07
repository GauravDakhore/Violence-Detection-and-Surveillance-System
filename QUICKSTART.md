# Quick Start - ML Integration

## What Was Done ✅

Your `modelnew.h5` model has been fully integrated with the surveillance dashboard!

### Files Created/Modified:

1. **Backend**
   - `backend.py` - Flask server with TensorFlow model loading
   - `requirements.txt` - Python dependencies

2. **Frontend**
   - `src/api/mlService.js` - ML communication layer
   - `src/components/CameraCard.jsx` - Updated to send frames & display predictions
   - `src/App.jsx` - ML service initialization

3. **Setup Scripts**
   - `start-all.bat` - Windows setup automation
   - `start-all.sh` - Linux/macOS setup automation
   - `ML-SETUP-GUIDE.md` - Comprehensive documentation

## How to Run 🚀

### Windows
```
1. Double-click: start-all.bat
2. When done, open two terminals:
   Terminal A: python backend.py
   Terminal B: cd surveillance-dashboard && npm run dev
3. Open http://localhost:5173 in your browser
```

### macOS/Linux
```
1. Run: ./start-all.sh
2. When done, open two terminals:
   Terminal A: python backend.py
   Terminal B: cd surveillance-dashboard && npm run dev
3. Open http://localhost:5173 in your browser
```

## What Happens When Running ⚙️

1. **Backend (Python):**
   - Loads `modelnew.h5` using TensorFlow
   - Listens on `http://localhost:3000`
   - Receives frames and runs inference
   - Sends predictions back in real-time

2. **Frontend (React):**
   - Connects to backend via Socket.io
   - Captures frames every 2 seconds from each camera
   - Sends frames to backend for inference
   - Displays "🤖 ML Active" badge
   - Shows prediction scores below video

## Checking if It Works ✓

### Backend Terminal Should Show:
```
✓ Model loaded successfully from modelnew.h5
  Model input shape: (None, 224, 224, 3)
  Model output shape: (None, 1000)

Starting Flask + Socket.io server on http://localhost:3000
```

### Browser Console (F12) Should Show:
```
Model info received: {loaded: true, ...}
```

### File Structure
The model file should be located at:
```
surveillance-dashboard/
├── modelnew.h5          ← Model file here
├── src/
├── package.json
└── ...
```

### Camera Cards Should Show:
- Green badge: "🤖 ML Active"
- Prediction scores at bottom
- Status changing as frames are processed

## Next Steps 🎯

1. **Customize Model Output Display:**
   - Edit `CameraCard.jsx` to show what your model outputs
   - Add bounding boxes, confidence scores, class labels

2. **Integrate with Alerts:**
   - Connect predictions to alert system
   - Trigger alerts on high-confidence detections

3. **Monitor Performance:**
   - Check inference speed in backend logs
   - Adjust frame capture rate if needed

4. **Fine-tune Preprocessing:**
   - Edit `run_inference()` in `backend.py`
   - Adjust for your specific model requirements

## Ports Used 🔌

- **Backend:** `http://localhost:3000` (Flask + Socket.io)
- **Frontend:** `http://localhost:5173` (Vite dev server)
- **Camera Streams:** `http://localhost:5000/video/*`

## Troubleshooting Quick Fixes 🔧

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError: tensorflow` | Run: `pip install tensorflow` |
| Backend won't start | Check if port 3000 is in use |
| No "ML Active" badge | Check browser console for errors (F12) |
| Slow predictions | Increase inference interval in CameraCard.jsx |
| Model not found | Ensure `modelnew.h5` is in root directory |

## Documentation 📚

See `ML-SETUP-GUIDE.md` for:
- Detailed setup instructions
- API reference
- Configuration options
- Advanced customization
- Complete troubleshooting guide

---

**You're all set!** Start the backend and frontend, then check your dashboard. The ML model will automatically process video frames in real-time. 🎉
