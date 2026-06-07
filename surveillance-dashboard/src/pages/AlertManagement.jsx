// src/pages/AlertManagement.jsx
import React, { useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";
import IncidentModal from "../components/IncidentModal";

const SAMPLE_ALERTS = [
  {
    id: 1,
    type: "Critical",
    title: "Fire Outbreak in Sector 12",
    description: "Major fire reported at residential area near Lake Road.",
    location: "Sector 12, City Center",
    timestamp: "2025-09-15T12:30:00Z",
    status: "Active"
  },
  {
    id: 2,
    type: "Warning",
    title: "Road Accident",
    description: "Two-vehicle collision reported at Highway 7.",
    location: "Highway 7",
    timestamp: "2025-09-15T13:00:00Z",
    status: "Resolved"
  },
  {
    id: 3,
    type: "Information",
    title: "Parade Route Closure",
    description: "Temporary closure for city parade.",
    location: "Downtown",
    timestamp: "2025-09-15T10:10:00Z",
    status: "Active"
  }
];

const TYPE_COLORS = {
  Critical: "#ef4444",
  Warning: "#f59e0b",
  Information: "#60a5fa"
};

export default function AlertManagement() {
  const [alerts, setAlerts] = useState(SAMPLE_ALERTS);
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const metrics = useMemo(() => {
    const total = alerts.length;
    const active = alerts.filter((a) => a.status === "Active").length;
    const resolved = alerts.filter((a) => a.status === "Resolved").length;
    const critical = alerts.filter((a) => a.type === "Critical").length;
    return { total, active, resolved, critical };
  }, [alerts]);

  const pieData = useMemo(() => {
    const bucket = new Map();
    alerts.forEach((a) => bucket.set(a.type, (bucket.get(a.type) || 0) + 1));
    const arr = Array.from(bucket.entries()).map(([name, value]) => ({ name, value }));
    return arr.length ? arr : [{ name: "No Data", value: 1 }];
  }, [alerts]);

  const barData = useMemo(() => {
    const bucket = new Map();
    alerts.forEach((a) => bucket.set(a.location, (bucket.get(a.location) || 0) + 1));
    return Array.from(bucket.entries()).map(([location, count]) => ({ location, count }));
  }, [alerts]);

  const lineData = useMemo(() => {
    const bucket = new Map();
    alerts.forEach((a) => {
      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:00`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return Array.from(bucket.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([time, count]) => ({ time, count }));
  }, [alerts]);

  function viewAlert(a) {
    setSelected(a);
    setIsModalOpen(true);
  }
  function resolveAlert(id) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "Resolved" } : a)));
  }
  function deleteAlert(id) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="title">Advanced Alert Management</div>
        <div className="meta">Manage, analyze, and act on public safety alerts</div>
      </div>

      {/* Summary cards */}
      <div className="grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <div className="card"><div className="small">Total Alerts</div><div style={{ fontSize: 22, fontWeight: 700 }}>{metrics.total}</div></div>
        <div className="card"><div className="small">Active Alerts</div><div style={{ fontSize: 22, fontWeight: 700 }}>{metrics.active}</div></div>
        <div className="card"><div className="small">Resolved Alerts</div><div style={{ fontSize: 22, fontWeight: 700 }}>{metrics.resolved}</div></div>
        <div className="card"><div className="small">Critical Alerts</div><div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>{metrics.critical}</div></div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 120px 1fr 1.2fr 160px 120px 220px", gap: 8, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="small">
          <div>Alert ID</div>
          <div>Type</div>
          <div>Title</div>
          <div>Location</div>
          <div>Time</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        <div>
          {alerts.map((a) => {
            const color = TYPE_COLORS[a.type] || "#9aa8c9";
            return (
              <div key={a.id} className="alert-row" style={{ gridTemplateColumns: "120px 120px 1fr 1.2fr 160px 120px 220px" }}>
                <div>#{String(a.id).padStart(4, "0")}</div>
                <div><span className="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}66` }}>{a.type}</span></div>
                <div>{a.title}</div>
                <div>{a.location}</div>
                <div className="small">{new Date(a.timestamp).toLocaleString()}</div>
                <div style={{ textTransform: "capitalize" }}>{a.status}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary" onClick={() => viewAlert(a)}>View</button>
                  <button className="btn btn-muted" onClick={() => resolveAlert(a.id)}>Resolve</button>
                  <button className="btn btn-danger" onClick={() => deleteAlert(a.id)}>Delete</button>
                </div>
              </div>
            );
          })}
          {alerts.length === 0 && <div className="center" style={{ padding: 16, opacity: 0.7 }}>No alerts</div>}
        </div>
      </div>

      {/* Visualizations */}
      <div className="analytics-grid" style={{ marginTop: 12 }}>
        <div className="card chart-card" style={{ padding: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Alerts by Type</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={70}>
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={TYPE_COLORS[entry.name] || ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444"][idx % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h3 style={{ marginBottom: 8 }}>Alerts by Location</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke="#112233" />
                <XAxis dataKey="location" stroke="#98a0b3" hide={false} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="#98a0b3" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h3 style={{ marginBottom: 8 }}>Alert Trends Over Time</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid stroke="#112233" />
                <XAxis dataKey="time" stroke="#98a0b3" minTickGap={16} />
                <YAxis stroke="#98a0b3" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detail modal reused for quick view */}
      <IncidentModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelected(null); }}
        incident={selected ? {
          id: selected.id,
          type: selected.type,
          title: selected.title,
          description: selected.description,
          timestamp: selected.timestamp,
          location: selected.location,
          status: selected.status,
        } : null}
      />
    </div>
  );
}


