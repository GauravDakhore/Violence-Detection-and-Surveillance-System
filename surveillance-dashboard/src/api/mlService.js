// src/api/mlService.js

/**
 * ML Service - handles communication with the ML backend via REST API
 */

const ML_BACKEND_URL = "http://localhost:3000";

let modelInfo = null;
let predictionCallbacks = {};

// Initialize ML service
export function initMLService() {
  console.log("📡 Initializing ML Service...");
  getModelInfoFromBackend();
}

/**
 * Register a callback for predictions from a specific camera
 */
export function subscribeToPredictions(cameraId, callback) {
  predictionCallbacks[cameraId] = callback;
  console.log(`✓ Subscribed to predictions for ${cameraId}`);
  return () => {
    delete predictionCallbacks[cameraId];
    console.log(`✗ Unsubscribed from predictions for ${cameraId}`);
  };
}

/**
 * Send frame to backend for inference via REST API
 */
export async function sendFrameForInference(canvasElement, cameraId, timestamp) {
  try {
    if (!canvasElement) {
      console.error("No canvas element provided");
      return;
    }

    const base64Image = canvasElement.toDataURL("image/jpeg", 0.7).split(",")[1];

    const response = await fetch(`${ML_BACKEND_URL}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: base64Image,
        camera_id: cameraId,
        timestamp: timestamp || Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Call registered callback for this camera
    if (predictionCallbacks[cameraId]) {
      predictionCallbacks[cameraId](result);
    }

    return result;
  } catch (error) {
    console.error("Error sending frame for inference:", error);
    return null;
  }
}

/**
 * Get model info from backend
 */
export async function getModelInfoFromBackend() {
  try {
    const response = await fetch(`${ML_BACKEND_URL}/api/model-info`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    modelInfo = await response.json();
    console.log("✓ Model info retrieved:", modelInfo);
    return modelInfo;
  } catch (error) {
    console.error("Failed to get model info:", error);
    return null;
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${ML_BACKEND_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const health = await response.json();
    console.log("✓ Backend health:", health);
    return health;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return null;
  }
}

export default {
  initMLService,
  subscribeToPredictions,
  sendFrameForInference,
  getModelInfoFromBackend,
  checkBackendHealth,
};
