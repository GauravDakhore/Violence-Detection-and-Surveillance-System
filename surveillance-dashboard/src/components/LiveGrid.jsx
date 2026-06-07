// src/components/LiveGrid.jsx
import React from "react";
import CameraCard from "./CameraCard";

const cameras = [
  { id: "cam-01", name: "Gate A", stream: "http://localhost:5000/video/1" },
  { id: "cam-02", name: "Gate B", stream: "http://localhost:5000/video/2" },
  { id: "cam-03", name: "Hall", stream: "http://localhost:5000/video/3" },
  { id: "cam-04", name: "Parking", stream: "http://localhost:5000/video/4" },
];

export default function LiveGrid() {
  return (
    <div className="live-grid">
      {cameras.map(cam => (
        <CameraCard key={cam.id} camera={cam} />
      ))}
    </div>
  );
}
