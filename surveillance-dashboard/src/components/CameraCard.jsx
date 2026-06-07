// src/components/CameraCard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { subscribeToPredictions, sendFrameForInference } from "../api/mlService";

export default function CameraCard({ camera }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const [boxes, setBoxes] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fsContainerRef = useRef(null);
  const fsCanvasRef = useRef(null);
  const videoRef = useRef(null);
  const inferenceIntervalRef = useRef(null);
  const [mlStatus, setMlStatus] = useState("connecting");
  const [predictions, setPredictions] = useState(null);

  const resizeObserver = useMemo(() => {
    if (typeof ResizeObserver === "undefined") return null;
    return new ResizeObserver(() => {
      syncCanvasSize(containerRef.current, canvasRef.current);
      if (isFullscreen) syncCanvasSize(fsContainerRef.current, fsCanvasRef.current);
    });
  }, [isFullscreen]);

  useEffect(() => {
    if (containerRef.current && resizeObserver) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current && resizeObserver) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [resizeObserver]);
// Listen for traditional boxes (if backend sends them)
    const boxHandler = (payload) => {
      if (!payload || payload.cameraId !== camera.id) return;
      setBoxes(Array.isArray(payload.boxes) ? payload.boxes : []);
    };

    // Subscribe to ML predictions
    const unsubscribe = subscribeToPredictions(camera.id, (prediction) => {
      setMlStatus("ready");
      setPredictions(prediction);
    });

    socket.on("boxes", boxHandler);
    return () => {
      socket.off("boxes", boxHandler);
      unsubscribe();
    };
  }, [camera.id]);

  // Capture and send frames for ML inference
  useEffect(() => {
    if (!videoRef.current) return;

    // Send frames every 2 seconds for inference
    inferenceIntervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.getInternalPlayer()) {
        try {
          const video = videoRef.current.getInternalPlayer();
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = video.videoWidth || 640;
          tempCanvas.height = video.videoHeight || 480;
          const ctx = tempCanvas.getContext("2d");
          ctx.drawImage(video, 0, 0);
          sendFrameForInference(tempCanvas, camera.id, Date.now());
        } catch (error) {
          console.error("Frame capture error:", error);
        }
      }
    }, 2000);

    return () => {
      if (inferenceIntervalRef.current) clearInterval(inferenceIntervalRef.current

    socket.on("boxes", handler);
    return () => {
      sockref={videoRef}
          url={camera.stream}
          playing
          muted
          width="100%"
          height="100%"
          controls={false}
        />

        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

        {/* ML Status Badge */}
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          padding: "4px 12px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          background: mlStatus === "ready" ? "rgba(34, 197, 94, 0.9)" : "rgba(59, 130, 246, 0.9)",
          color: "#fff",
          zIndex: 10
        }}>
          {mlStatus === "ready" ? "🤖 ML Active" : "🔄 ML Loading..."}
        </div>

        {/* ML Predictions Display */}
        {predictions && (
          <div style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            padding: "8px 12px",
            borderRadius: 4,
            fontSize: 11,
            background: "rgba(0, 0, 0, 0.7)",
            color: "#0f0",
            zIndex: 10,
            fontFamily: "monospace"
          }}>
            <div>Predictions:</div>
            <div style={{ marginTop: 4, fontSize: 10 }}>
              {predictions.max_value !== undefined && (
                <div>Max: {(predictions.max_value * 100).toFixed(1)}%</div>
              )}
              {predictions.min_value !== undefined && (
                <div>Min: {(predictions.min_value * 100).toFixed(1)}%</div>
              )}
            </div>
          </div>
        )}
      if (isFullscreen) drawBoxes(fsCanvasRef.current, boxes);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [boxes, isFullscreen]);

  function toggleFullscreen() {
    setIsFullscreen((v) => !v);
    setTimeout(() => {
      syncCanvasSize(fsContainerRef.current, fsCanvasRef.current);
    }, 0);
  }

  return (
    <div className="camera-card card">
      <div className="camera-header">
        <div className="cam-title">{camera.name}</div>
        <div className="cam-id">{camera.id}</div>
        <button className="btn btn-sm" onClick={toggleFullscreen}>Fullscreen</button>
      </div>

      <div className="stream" ref={containerRef} style={{ position: "relative" }}>
        <ReactPlayer
          url={camera.stream}
          playing
          muted
          width="100%"
          height="100%"
          controls={false}
        />

        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
      </div>

      {isFullscreen && (
        <div className="modal-backdrop" onClick={toggleFullscreen} style={backdropStyle}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <strong>{camera.name}</strong> <span style={{ opacity: 0.6 }}>({camera.id})</span>
              </div>
              <button className="btn btn-sm" onClick={toggleFullscreen}>Close</button>
            </div>
            <div ref={fsContainerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
              <ReactPlayer
                url={camera.stream}
                playing
                muted
                width="100%"
                height="100%"
                controls={true}
              />
              <canvas ref={fsCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function syncCanvasSize(containerEl, canvasEl) {
  if (!containerEl || !canvasEl) return;
  const rect = containerEl.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  if (canvasEl.width !== Math.floor(width * dpr) || canvasEl.height !== Math.floor(height * dpr)) {
    canvasEl.width = Math.floor(width * dpr);
    canvasEl.height = Math.floor(height * dpr);
  }
}

function drawBoxes(canvas, boxes) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  if (!boxes || boxes.length === 0) return;
  ctx.save();
  ctx.lineWidth = 2 * dpr;
  ctx.font = `${12 * dpr}px sans-serif`;
  boxes.forEach((b) => {
    const x = (b.x || 0) * width;
    const y = (b.y || 0) * height;
    const w = (b.w || 0) * width;
    const h = (b.h || 0) * height;
    const label = b.label ?? "object";
    const score = typeof b.score === "number" ? ` ${(b.score * 100).toFixed(0)}%` : "";
    ctx.strokeStyle = "#00FF88";
    ctx.fillStyle = "rgba(0,255,136,0.15)";
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.fill();

    const text = `${label}${score}`;
    const textPadding = 4 * dpr;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width + textPadding * 2;
    const textHeight = 16 * dpr + textPadding * 2;
    ctx.fillStyle = "#00FF88";
    ctx.fillRect(x, Math.max(0, y - textHeight), textWidth, textHeight);
    ctx.fillStyle = "#001a12";
    ctx.fillText(text, x + textPadding, Math.max(12 * dpr, y - textHeight + 12 * dpr));
  });
  ctx.restore();
}

const backdropStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  width: "90vw",
  height: "85vh",
  background: "#0a0a0a",
  borderRadius: 8,
  padding: 12,
  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
};
