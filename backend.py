"""
Surveillance Dashboard ML Backend - Simplified Flask Version
Loads the modelnew.h5 model and provides inference via REST API
"""

import os
import json
import base64
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
from io import BytesIO
from PIL import Image
import logging
import traceback

# Try different import methods based on available versions
try:
    from tensorflow.keras.models import load_model
    from tensorflow.keras.layers import DepthwiseConv2D
    import tensorflow as tf
    print("✓ Using tensorflow.keras")
except ImportError:
    try:
        from keras.models import load_model
        from keras.layers import DepthwiseConv2D
        import tensorflow as tf
        print("✓ Using keras")
    except ImportError:
        load_model = None
        DepthwiseConv2D = None
        tf = None
        print("✗ Neither tensorflow.keras nor keras available")

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Monkey-patch DepthwiseConv2D to handle 'groups' parameter for compatibility
if DepthwiseConv2D:
    original_init = DepthwiseConv2D.__init__
    def patched_init(self, kernel_size=3, strides=(1, 1), padding='valid', 
                     depth_multiplier=1, data_format=None, activation=None,
                     use_bias=True, depthwise_initializer='glorot_uniform',
                     bias_initializer='zeros', depthwise_regularizer=None,
                     bias_regularizer=None, activity_regularizer=None,
                     depthwise_constraint=None, bias_constraint=None, **kwargs):
        # Remove 'groups' if it exists in kwargs
        kwargs.pop('groups', None)
        original_init(self, kernel_size=kernel_size, strides=strides, 
                     padding=padding, depth_multiplier=depth_multiplier,
                     data_format=data_format, activation=activation,
                     use_bias=use_bias, 
                     depthwise_initializer=depthwise_initializer,
                     bias_initializer=bias_initializer,
                     depthwise_regularizer=depthwise_regularizer,
                     bias_regularizer=bias_regularizer,
                     activity_regularizer=activity_regularizer,
                     depthwise_constraint=depthwise_constraint,
                     bias_constraint=bias_constraint, **kwargs)
    DepthwiseConv2D.__init__ = patched_init

# Load the ML model
MODEL_PATH = "surveillance-dashboard/modelnew.h5"
model = None

try:
    logger.info(f"Loading model from {MODEL_PATH}...")
    model = load_model(MODEL_PATH)
    logger.info(f"✓ Model loaded successfully!")
    logger.info(f"  Input shape: {model.input_shape}")
    logger.info(f"  Output shape: {model.output_shape}")
except Exception as e:
    logger.error(f"✗ Failed to load model: {e}")
    logger.error(traceback.format_exc())

# Model inference function
def run_inference(image_array):
    """Run inference on image and return predictions"""
    if model is None:
        return {"error": "Model not loaded", "success": False}
    
    try:
        # Get model input shape
        input_shape = model.input_shape
        target_height, target_width = input_shape[1], input_shape[2]
        
        logger.info(f"Processing image: {image_array.shape} -> ({target_height}, {target_width})")
        
        # Resize image to match model input
        resized = cv2.resize(image_array, (target_width, target_height))
        
        # Normalize to [0, 1]
        if resized.max() > 1.0:
            resized = resized.astype(np.float32) / 255.0
        else:
            resized = resized.astype(np.float32)
        
        # Handle grayscale images
        if len(resized.shape) == 2:
            resized = np.stack([resized] * 3, axis=-1)
        elif resized.shape[2] == 4:  # RGBA
            resized = resized[:, :, :3]
        
        # Add batch dimension
        batch = np.expand_dims(resized, axis=0)
        logger.info(f"Batch shape: {batch.shape}")
        
        # Run prediction
        prediction = model.predict(batch, verbose=0)
        logger.info(f"Prediction shape: {prediction.shape}")
        
        # Process output
        result = {
            "success": True,
            "prediction": prediction.tolist(),
            "shape": list(prediction.shape),
            "max_value": float(np.max(prediction)),
            "min_value": float(np.min(prediction)),
            "mean_value": float(np.mean(prediction))
        }
        
        logger.info(f"✓ Inference complete. Max: {result['max_value']:.4f}")
        return result
    except Exception as e:
        logger.error(f"Inference error: {e}")
        logger.error(traceback.format_exc())
        return {"error": str(e), "success": False}

# REST API endpoints

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    })

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    return jsonify({
        "loaded": True,
        "input_shape": str(model.input_shape),
        "output_shape": str(model.output_shape),
        "name": model.name,
        "layers": len(model.layers)
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Receive base64 encoded image and return prediction"""
    try:
        data = request.json
        image_data = data.get('image')
        camera_id = data.get('camera_id', 'unknown')
        
        if not image_data:
            return jsonify({"error": "No image provided"}), 400
        
        # Decode base64 image
        try:
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            image_array = np.array(image)
        except Exception as e:
            logger.error(f"Image decode error: {e}")
            return jsonify({"error": f"Invalid image data: {str(e)}"}), 400
        
        logger.info(f"Received frame from {camera_id}, shape: {image_array.shape}")
        
        # Run inference
        result = run_inference(image_array)
        result['camera_id'] = camera_id
        
        if result.get('success'):
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        logger.error(f"Prediction endpoint error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("=" * 70)
    logger.info("Surveillance Dashboard ML Backend")
    logger.info("=" * 70)
    logger.info("Starting Flask server on http://0.0.0.0:3000")
    logger.info("Model endpoint: POST http://localhost:3000/api/predict")
    logger.info("Health check: GET http://localhost:3000/health")
    logger.info("=" * 70)
    app.run(host='0.0.0.0', port=3000, debug=False, threaded=True)

