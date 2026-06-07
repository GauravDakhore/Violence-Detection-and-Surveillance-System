// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import AlertSystem from "./pages/AlertSystem";
import AlertManagement from "./pages/AlertManagement";
import { initMLService } from "./api/mlService";

/* Top navigation */
function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}><path d="M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z"/></svg>
      );
    case "bell":
      return (
        <svg {...common}><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14V11a6 6 0 1 0-12 0v3c0 .53-.21 1.04-.59 1.41L4 17h5"/><path d="M13 21a2 2 0 0 1-2 0"/></svg>
      );
    case "chart":
      return (
        <svg {...common}><path d="M3 3v18h18"/><path d="M7 13l3-3 4 4 5-5"/></svg>
      );
    case "camera":
      return (
        <svg {...common}><rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 10l5-3v10l-5-3"/></svg>
      );
    case "settings":
      return (
        <svg {...common}><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H22a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
      );
    default:
      return null;
  }
}

function TopNav() {
  return (
    <div style={{ background: "#071029", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(90deg,#0ea5e9,#7c3aed)", fontWeight: 700 }}>SS</div>
          <div style={{ color: "#e6eef8", fontWeight: 700, letterSpacing: 0.3 }}>Surveillance</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="text" placeholder="Search cameras, incidents..." style={{ background: "#07112a", border: "1px solid rgba(255,255,255,0.08)", color: "#cfe6ff", padding: "8px 10px", borderRadius: 8, width: 340 }} />
          <button className="nav-btn" title="Alerts"><Icon name="bell" size={16} /></button>
          <button className="nav-btn" title="Analytics"><Icon name="chart" size={16} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#233148", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>G</div>
            <div className="small">Gaurav</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Sidebar navigation (left) */
function Sidebar() {
  const activeStyle = {
    background: "linear-gradient(90deg, rgba(255,255,255,0.02), transparent)",
    borderLeft: "3px solid #2563eb",
    color: "#fff",
  };

  const linkStyle = {
    display: "block",
    padding: "10px 12px",
    borderRadius: 8,
    color: "#cfe6ff",
    textDecoration: "none",
    fontSize: 14
  };

  return (
    <aside style={{ width: 220, padding: 12, position: "sticky", top: 16, alignSelf: "flex-start" }}>
      <div className="card" style={{ padding: 8 }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <NavLink to="/" end style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="dashboard" /> Dashboard</span>
          </NavLink>
          <a href="#cameras" style={linkStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="camera" /> Cameras</span></a>
          <a href="#alert-situation" style={linkStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="bell" /> Alert Situation</span></a>
          <NavLink to="/alert-system" style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="bell" /> Alert System</span>
          </NavLink>
          <NavLink to="/alert-management" style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="chart" /> Alert Management</span>
          </NavLink>
          <NavLink to="/settings" style={({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="settings" /> Settings</span>
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}

/* App layout with sidebar + content area */
export default function App() {
  useEffect(() => {
    // Initialize ML service when app loads
    initMLService();
  }, []);

  return (
    <div>
      <TopNav />

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 1200, width: "100%", display: "flex", gap: 16, padding: "16px", alignItems: "flex-start" }}>
          <Sidebar />

          <div style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/alert-system" element={<AlertSystem />} />
              <Route path="/alert-management" element={<AlertManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
