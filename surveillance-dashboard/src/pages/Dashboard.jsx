// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import "./Dashboard.css";

const MOCK = {
  cameras: [
    { id: 1, name: "Cam 01", location: "Sector 12", status: "Active" },
    { id: 2, name: "Cam 02", location: "Highway 7", status: "Offline" },
    { id: 3, name: "Cam 03", location: "Transit Hub", status: "Active" },
    { id: 4, name: "Cam 04", location: "Old Town", status: "Active" },
    { id: 5, name: "Cam 05", location: "City Center", status: "Active" },
    { id: 6, name: "Cam 06", location: "Harbor", status: "Active" }
  ],
  alerts: [
    { id: 1, type: "Critical", location: "Sector 12", timestamp: "2025-09-15T14:30:00Z" },
    { id: 2, type: "Warning", location: "Highway 7", timestamp: "2025-09-15T15:00:00Z" },
    { id: 3, type: "Information", location: "Transit Hub", timestamp: "2025-09-15T13:20:00Z" },
    { id: 4, type: "Critical", location: "Old Town", timestamp: "2025-09-15T11:45:00Z" }
  ]
};

const TYPE_COLORS = { Critical: "#ef4444", Warning: "#f59e0b", Information: "#60a5fa" };

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("");
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [geo, setGeo] = useState({ lat: null, lng: null, ts: null, error: "" });

  useEffect(() => { document.title = "Surveillance Dashboard"; }, []);

  // Start webcam for the first camera card
  useEffect(() => {
    let stopped = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (stopped) return;
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        // Ignore if user blocks camera
      }
    }
    start();
    return () => {
      stopped = true;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Geolocation once
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeo((g) => ({ ...g, error: "Geolocation not supported" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGeo({ lat: latitude, lng: longitude, ts: Date.now(), error: "" });
      },
      (err) => {
        setGeo((g) => ({ ...g, error: err.message || "Denied" }));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const filteredCameras = useMemo(() => {
    let cams = [...MOCK.cameras];
    if (quickFilter === "active") cams = cams.filter((c) => c.status === "Active");
    if (quickFilter === "offline") cams = cams.filter((c) => c.status === "Offline");
    if (search.trim()) {
      const q = search.toLowerCase();
      cams = cams.filter((c) => `${c.name} ${c.location}`.toLowerCase().includes(q));
    }
    return cams;
  }, [search, quickFilter]);

  const kpis = useMemo(() => {
    // With local webcam enabled for the first card and others forced Offline,
    // the active camera count reflects currently displayed cameras.
    const totalCams = filteredCameras.length > 0 ? 1 : 0;
    const todayStr = new Date().toISOString().slice(0, 10);
    const totalAlertsToday = MOCK.alerts.filter((a) => a.timestamp.slice(0, 10) === todayStr).length;
    const activeIncidents = MOCK.alerts.filter((a) => a.type !== "Information").length;
    const resolvedIncidents = Math.max(0, MOCK.alerts.length - activeIncidents);
    return { totalCams, totalAlertsToday, activeIncidents, resolvedIncidents };
  }, [filteredCameras]);

  const alertRows = useMemo(() => {
    return MOCK.alerts.map((a) => {
      const cam = MOCK.cameras.find((c) => c.location === a.location);
      return {
        id: a.id,
        cameraId: cam ? cam.name : "-",
        type: a.type,
        description: a.description || (a.type === "Critical" ? "Immediate attention required" : a.type === "Warning" ? "Potential issue detected" : "Informational event"),
        location: a.location,
        timestamp: a.timestamp,
        status: a.type === "Critical" ? "Active" : "Pending",
      };
    });
  }, []);

  function callOperator(row) {
    const number = window.prompt("Enter phone number to call:", "100");
    if (!number) return;
    try {
      window.location.href = `tel:${encodeURIComponent(number)}`;
    } catch (_) {
      alert(`Call ${number}`);
    }
  }

  return (
    <div className="dashboard-container">
      {/* Top section row 1 */}
      <div className="dash-top">
        <div className="dash-title">Surveillance Control Center</div>
        <div className="dash-actions">
          <input className="dash-search" placeholder="Search cameras, locations..." value={search} onChange={(e)=>setSearch(e.target.value)} />
          <select className="dash-filter" value={quickFilter} onChange={(e)=>setQuickFilter(e.target.value)}>
            <option value="">All</option>
            <option value="active">Active Cameras</option>
            <option value="offline">Offline Cameras</option>
          </select>
        </div>
      </div>

      {/* Top section row 2 - KPIs */}
      <div className="dash-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Total Cameras Active</div>
          <div className="kpi-value">{kpis.totalCams}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Alerts Today</div>
          <div className="kpi-value">{kpis.totalAlertsToday}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Incidents</div>
          <div className="kpi-value">{kpis.activeIncidents}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Resolved Incidents</div>
          <div className="kpi-value">{kpis.resolvedIncidents}</div>
        </div>
      </div>

      {/* Location/Time */}
      <div className="dash-card" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <div className="small" style={{ opacity: 0.9 }}>Your Location:</div>
        <div className="small">
          {geo.lat != null && geo.lng != null ? (
            <span>{geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</span>
          ) : geo.error ? (
            <span style={{ color: "#fca5a5" }}>{geo.error}</span>
          ) : (
            <span>Fetching…</span>
          )}
        </div>
        <div className="small" style={{ marginLeft: 12 }}>Time:</div>
        <div className="small">{new Date().toLocaleString()}</div>
      </div>

      {/* Middle section - Camera grid */}
      <div id="cameras" className="camera-grid">
        {filteredCameras.map((cam, idx) => {
          const isWebcam = idx === 0; // first card shows local webcam
          const forcedOffline = !isWebcam; // remaining off
          return (
          <div key={cam.id} className={"camera-card dash-card " + (forcedOffline ? "offline" : "") }>
            <div className="camera-header">
              <div className="camera-name">{cam.name}</div>
              <div className="camera-location small">{cam.location}</div>
              <div className={"camera-status " + (forcedOffline ? "offline" : "active")}>{forcedOffline ? "Offline" : "Active"}</div>
            </div>
            <div className="camera-frame">
              {isWebcam ? (
                <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="frame-placeholder">Offline</div>
              )}
            </div>
          </div>
        );})}
      </div>

      {/* Bottom section - Alert Situation */}
      <div id="alert-situation" className="dash-card" style={{ marginTop: 12, padding: 0 }}>
        <div className="chart-title" style={{ padding: "10px 12px" }}>Alert Situation</div>
        <div>
          <div className="small" style={{ display: "grid", gridTemplateColumns: "120px 120px 1.4fr 1.2fr 180px 120px 260px", gap: 8, padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div>Camera ID</div>
            <div>Type</div>
            <div>Description</div>
            <div>Location</div>
            <div>Date & Time</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          {alertRows.map((row) => (
            <div key={row.id} className="alert-row" style={{ gridTemplateColumns: "120px 120px 1.4fr 1.2fr 180px 120px 260px" }}>
              <div>{row.cameraId}</div>
              <div><span className="badge" style={{ background: `${TYPE_COLORS[row.type] || '#98a0b3'}20`, color: TYPE_COLORS[row.type] || '#cfe6ff', border: `1px solid ${(TYPE_COLORS[row.type] || '#98a0b3')}66` }}>{row.type}</span></div>
              <div className="small" style={{ opacity: 0.9 }}>{row.description}</div>
              <div className="small">{row.location}</div>
              <div className="small">{new Date(row.timestamp).toLocaleString()}</div>
              <div style={{ textTransform: "capitalize" }}>{row.status}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={() => callOperator(row)}>Call</button>
              </div>
            </div>
          ))}
          {alertRows.length === 0 && <div className="center" style={{ padding: 14, opacity: 0.7 }}>No situations</div>}
        </div>
      </div>
    </div>
  );
}
