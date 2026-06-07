// src/pages/Alerts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { socket } from "../api/socket";
import IncidentModal from "../components/IncidentModal";

const TYPE_OPTIONS = ["fighting", "theft", "accident", "suspicious activity"]; 
const STATUS_OPTIONS = ["active", "resolved", "escalated"]; 
const PIE_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"]; 
const CRITICAL_TYPES = new Set(["fighting", "theft", "accident", "fight", "robbery"]);

function severityOf(alert) {
  if (String(alert.status).toLowerCase() === "resolved") return "resolved";
  const type = String(alert.type || "").toLowerCase();
  if (CRITICAL_TYPES.has(type)) return "critical";
  const conf = Number(alert.confidence ?? alert.score ?? 0);
  if (conf >= 0.8) return "high";
  return "moderate";
}

function badgeStyleFromSeverity(sev) {
  switch (sev) {
    case "critical": return { background: "#3b0d0d", color: "#fecaca", border: "1px solid #7f1d1d" };
    case "high": return { background: "#2a1608", color: "#fdba74", border: "1px solid #7c2d12" };
    case "moderate": return { background: "#2a210a", color: "#fde68a", border: "1px solid #78350f" };
    case "resolved": return { background: "#0d2b1d", color: "#bbf7d0", border: "1px solid #14532d" };
    default: return { background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151" };
  }
}

function normalizeAlert(a) {
  const ts = a?.ts || a?.timestamp || a?.time || a?.detectedAt || Date.now();
  const when = typeof ts === "number" ? ts : new Date(ts).getTime();
  const alert = {
    id: a?.id || `${when}_${Math.random().toString(36).slice(2, 8)}`,
    type: a?.type || "Anomaly",
    timestamp: when,
    cameraId: a?.cameraId || a?.cam || "",
    location: a?.location || a?.zone || a?.area || "",
    confidence: a?.confidence ?? a?.score ?? null,
    status: a?.status || "active",
    snapshotUrl: a?.snapshotUrl || a?.imageUrl || a?.thumbnail,
    raw: a,
  };
  alert.severity = severityOf(alert);
  return alert;
}

function useBatchedAlerts() {
  const [alerts, setAlerts] = useState([]);
  const buf = useRef([]);
  const timer = useRef(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onAnomaly = (data) => { buf.current.push(normalizeAlert(data)); };
    socket.on("anomaly", onAnomaly);
    timer.current = setInterval(() => {
      if (buf.current.length === 0) return;
      const chunk = buf.current.splice(0, 30);
      setAlerts((prev) => [...chunk, ...prev].slice(0, 3000));
    }, 350);
    return () => { socket.off("anomaly", onAnomaly); if (timer.current) clearInterval(timer.current); };
  }, []);

  return [alerts, setAlerts];
}

export default function Alerts() {
  const [alerts, setAlerts] = useBatchedAlerts();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cameraFilter, setCameraFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 40;
  const sentinelRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  // Toast + sound for critical
  useEffect(() => {
    if (alerts.length === 0) return;
    const latest = alerts[0];
    setToasts((prev) => [{ id: latest.id, ...latest }, ...prev].slice(0, 5));
    if (latest.severity === "critical") {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square"; o.frequency.value = 932; // ~A#5
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.55);
      } catch (_) {}
    }
    const t = setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== latest.id)), 4500);
    return () => clearTimeout(t);
  }, [alerts]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setPage((p) => p + 1); });
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cam = cameraFilter.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
    const to = toDate ? new Date(toDate).getTime() : Infinity;
    return alerts.filter((a) => {
      if (a.timestamp < from || a.timestamp > to) return false;
      if (typeFilter && String(a.type).toLowerCase() !== typeFilter) return false;
      if (statusFilter && String(a.status).toLowerCase() !== statusFilter) return false;
      if (cam && String(a.cameraId).toLowerCase() !== cam) return false;
      if (q) {
        const keys = [a.type, a.cameraId, a.location, a.id];
        if (!keys.some((v) => String(v || "").toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [alerts, query, typeFilter, statusFilter, cameraFilter, fromDate, toDate]);

  const paged = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page]);

  // Analytics data
  const lineData = useMemo(() => {
    const bucket = new Map();
    filtered.forEach((a) => {
      const d = new Date(a.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:00`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return Array.from(bucket.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([time, count]) => ({ time, count }));
  }, [filtered]);

  const pieData = useMemo(() => {
    const bucket = new Map();
    filtered.forEach((a) => { const t = String(a.type).toLowerCase(); bucket.set(t, (bucket.get(t)||0)+1); });
    const arr = Array.from(bucket.entries()).map(([name, value]) => ({ name, value }));
    return arr.length ? arr : [{ name: "no events", value: 1 }];
  }, [filtered]);

  const barData = useMemo(() => {
    const bucket = new Map();
    filtered.forEach((a) => { const cam = a.cameraId || "unknown"; bucket.set(cam, (bucket.get(cam)||0)+1); });
    return Array.from(bucket.entries()).sort((a,b)=>b[1]-a[1]).slice(0, 10).map(([camera, count]) => ({ camera, count }));
  }, [filtered]);

  function openAlert(a) { setSelected(a); setIsModalOpen(true); }
  function closeAlert() { setIsModalOpen(false); setSelected(null); }
  function markResolved(id) { setAlerts((prev) => prev.map((x) => x.id === id ? { ...x, status: "resolved", severity: "resolved" } : x)); }
  function escalate(id) { setAlerts((prev) => prev.map((x) => x.id === id ? { ...x, status: "escalated", severity: "critical" } : x)); }
  function notifyAuthorities(id) { setAlerts((prev) => prev.map((x) => x.id === id ? { ...x, notified: true } : x)); alert(`Authorities notified for ${id}`); }

  function exportCSV() {
    const headers = ["id","type","timestamp","cameraId","location","status","severity","confidence"];
    const rows = filtered.map((a) => [a.id, a.type, new Date(a.timestamp).toISOString(), a.cameraId||"", a.location||"", a.status, a.severity, a.confidence ?? ""]);
    const csv = [headers.join(","), ...rows.map((r)=>r.map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `alerts_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const w = window.open("", "_blank", "width=900,height=700"); if (!w) return;
    const rows = filtered.slice(0, 300).map((a) => `<tr><td>${a.id}</td><td>${a.type}</td><td>${new Date(a.timestamp).toLocaleString()}</td><td>${a.cameraId||""}</td><td>${a.location||""}</td><td>${a.status}</td><td>${a.severity}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><title>Alerts Report</title><style>body{font-family:Arial} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ccc;padding:6px} th{background:#eee}</style></head><body><h2>Alerts Report</h2><table><thead><tr><th>ID</th><th>Type</th><th>Time</th><th>Camera</th><th>Location</th><th>Status</th><th>Severity</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); w.focus(); w.print();
  }

  async function exportAnalyticsPNG() {
    const container = document.getElementById("analytics-section");
    if (!container) return;
    const svgs = container.querySelectorAll("svg");
    if (!svgs.length) return;
    // Render all SVG charts onto a single canvas stacked vertically
    const images = await Promise.all(Array.from(svgs).map(async (svg) => {
      const xml = new XMLSerializer().serializeToString(svg);
      const svg64 = window.btoa(unescape(encodeURIComponent(xml)));
      const src = `data:image/svg+xml;base64,${svg64}`;
      const img = new Image();
      img.src = src;
      await new Promise((res) => { img.onload = res; img.onerror = res; });
      return img;
    }));
    const width = Math.max(...images.map((im) => im.width));
    const height = images.reduce((sum, im) => sum + im.height + 16, 0);
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    let y = 0; images.forEach((im) => { ctx.fillStyle = "#0f1724"; ctx.fillRect(0, y, width, im.height); ctx.drawImage(im, 0, y); y += im.height + 16; });
    const url = canvas.toDataURL("image/png"); const a = document.createElement("a"); a.href = url; a.download = `analytics_${Date.now()}.png`; a.click();
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="title">Alerts</div>
        <div className="meta">Real-time incident management with analytics</div>
      </div>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast-item" style={badgeStyleFromSeverity(t.severity)}>
            <div style={{ fontWeight: 600 }}>{t.type}</div>
            <div className="small">{t.cameraId || "-"} • {new Date(t.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div id="analytics-section" className="analytics-grid" style={{ marginBottom: 12 }}>
        <div className="card chart-card">
          <h3 style={{ marginBottom: 8 }}>Alerts Over Time</h3>
          <div style={{ height: 200 }}>
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

        <div className="card chart-card" style={{ padding: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Anomaly Types</h3>
          <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={70}>
                  {pieData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-card">
          <h3 style={{ marginBottom: 8 }}>Top Cameras</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid stroke="#112233" />
                <XAxis dataKey="camera" stroke="#98a0b3" hide={false} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis stroke="#98a0b3" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr auto auto", gap: 8, alignItems: "end" }}>
          <div>
            <div className="small">Search</div>
            <input placeholder="Type, camera, location, ID" value={query} onChange={(e)=>{ setPage(1); setQuery(e.target.value); }} />
          </div>
          <div>
            <div className="small">Type</div>
            <select value={typeFilter} onChange={(e)=>{ setPage(1); setTypeFilter(e.target.value); }}>
              <option value="">All</option>
              {TYPE_OPTIONS.map((t)=>(<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          <div>
            <div className="small">Status</div>
            <select value={statusFilter} onChange={(e)=>{ setPage(1); setStatusFilter(e.target.value); }}>
              <option value="">All</option>
              {STATUS_OPTIONS.map((s)=>(<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div>
            <div className="small">Camera ID</div>
            <input placeholder="CAM-01" value={cameraFilter} onChange={(e)=>{ setPage(1); setCameraFilter(e.target.value); }} />
          </div>
          <div>
            <div className="small">From</div>
            <input type="datetime-local" value={fromDate} onChange={(e)=>{ setPage(1); setFromDate(e.target.value); }} />
          </div>
          <div>
            <div className="small">To</div>
            <input type="datetime-local" value={toDate} onChange={(e)=>{ setPage(1); setToDate(e.target.value); }} />
          </div>
          <button className="btn btn-muted" onClick={()=>{ setQuery(""); setTypeFilter(""); setStatusFilter(""); setCameraFilter(""); setFromDate(""); setToDate(""); setPage(1); }}>Reset</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-primary" onClick={exportPDF}>Export PDF</button>
            <button className="btn btn-primary" onClick={exportAnalyticsPNG}>Export Charts PNG</button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 140px 120px 1fr 1fr 100px", gap: 8, padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="small">
          <div>Type</div>
          <div>Time</div>
          <div>Confidence</div>
          <div>Camera</div>
          <div>Location</div>
          <div>Status</div>
        </div>
        <div>
          {paged.map((a) => {
            const sev = a.severity;
            const badgeStyle = badgeStyleFromSeverity(sev);
            const timeStr = new Date(a.timestamp).toLocaleString();
            return (
              <div key={a.id} className="alert-row" onClick={()=>openAlert(a)} style={{ cursor: "pointer", gridTemplateColumns: "1.2fr 140px 120px 1fr 1fr 100px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={badgeStyle}>{String(a.type)}</span>
                  <span className="small" style={{ opacity: 0.8 }}>#{a.id.slice(-6)}</span>
                </div>
                <div className="small">{timeStr}</div>
                <div className="small">{a.confidence != null ? `${(Number(a.confidence)*100).toFixed(0)}%` : "-"}</div>
                <div className="small">{a.cameraId || "-"}</div>
                <div className="small">{a.location || "-"}</div>
                <div className="small" style={{ textTransform: "capitalize" }}>{a.status}</div>
              </div>
            );
          })}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {paged.length === 0 && (<div className="center" style={{ padding: 20, opacity: 0.7 }}>No alerts</div>)}
        </div>
      </div>

      {/* Detail Modal + Actions */}
      <IncidentModal
        isOpen={isModalOpen}
        onClose={closeAlert}
        incident={selected ? {
          id: selected.id,
          type: selected.type,
          snapshotUrl: selected.snapshotUrl,
          timestamp: selected.timestamp,
          cameraId: selected.cameraId,
          severity: selected.severity,
          description: selected.raw?.description || selected.description,
          involvedIds: selected.raw?.ids || selected.raw?.involvedIds || [],
          confidence: selected.confidence,
          location: selected.location,
          status: selected.status,
          metadata: selected.raw || {},
        } : null}
      />

      {selected && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn btn-primary" onClick={()=>markResolved(selected.id)}>Mark as Resolved</button>
          <button className="btn btn-danger" onClick={()=>escalate(selected.id)}>Escalate</button>
          <button className="btn btn-muted" onClick={()=>notifyAuthorities(selected.id)}>Notify Authorities</button>
        </div>
      )}
    </div>
  );
}
