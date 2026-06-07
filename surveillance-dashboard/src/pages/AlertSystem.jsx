// src/pages/AlertSystem.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { socket } from "../api/socket";
import IncidentModal from "../components/IncidentModal";

const CRITICAL_TYPES = new Set(["fighting", "theft", "accident", "fight", "robbery"]);

function isCriticalType(type) {
  if (!type) return false;
  const t = String(type).toLowerCase();
  return CRITICAL_TYPES.has(t);
}

function createBadge(statusOrType) {
  const isCritical = isCriticalType(statusOrType) || String(statusOrType).toLowerCase() === "critical";
  const isResolved = String(statusOrType).toLowerCase() === "resolved";
  const isWarning = String(statusOrType).toLowerCase() === "warning" || (!isCritical && !isResolved);
  const style = isCritical
    ? { background: "#3b0d0d", color: "#fecaca", border: "1px solid #7f1d1d" }
    : isResolved
    ? { background: "#0d2b1d", color: "#bbf7d0", border: "1px solid #14532d" }
    : { background: "#2a210a", color: "#fde68a", border: "1px solid #78350f" };
  const label = isCritical ? "Critical" : isResolved ? "Resolved" : "Warning";
  return { style, label };
}

function normalizeAlert(a) {
  const ts = a?.ts || a?.timestamp || a?.time || a?.detectedAt || Date.now();
  const when = typeof ts === "number" ? ts : new Date(ts).getTime();
  const type = a?.type || "Anomaly";
  const location = a?.location || a?.zone || a?.area || "-";
  const status = a?.status || (isCriticalType(type) ? "active" : "active");
  const confidence = a?.confidence ?? a?.score;
  return {
    id: a?.id || `${when}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    cameraId: a?.cameraId,
    location,
    status,
    severity: isCriticalType(type) ? "critical" : "warning",
    snapshotUrl: a?.snapshotUrl || a?.imageUrl || a?.thumbnail,
    description: a?.description,
    confidence,
    actions: a?.actions || [],
    raw: a,
    ts: when,
  };
}

function useBatchedSocketAlerts() {
  const [alerts, setAlerts] = useState([]);
  const bufferRef = useRef([]);
  const intervalRef = useRef(null);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    function onAnomaly(data) {
      bufferRef.current.push(normalizeAlert(data));
    }

    intervalRef.current = setInterval(() => {
      if (bufferRef.current.length === 0) return;
      // Flush up to 20 at a time
      const chunk = bufferRef.current.splice(0, 20);
      setAlerts((prev) => [...chunk, ...prev].slice(0, 1000));
    }, 400);

    socket.on("anomaly", onAnomaly);
    return () => {
      socket.off("anomaly", onAnomaly);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Seed demo alerts if nothing arrives shortly after mount
  useEffect(() => {
    const t = setTimeout(() => {
      if (seededRef.current) return;
      if (alerts.length === 0 && bufferRef.current.length === 0) {
        const now = Date.now();
        const demo = [
          { id: `DEMO-${Math.random().toString(36).slice(2,7)}`, type: "fighting", cameraId: "CAM-01", location: "Sector 12", status: "active", severity: "critical", snapshotUrl: "", description: "Demo critical event", confidence: 0.92, actions: [], raw: {}, ts: now },
          { id: `DEMO-${Math.random().toString(36).slice(2,7)}`, type: "theft", cameraId: "CAM-07", location: "Market Square", status: "active", severity: "critical", snapshotUrl: "", description: "Demo high event", confidence: 0.85, actions: [], raw: {}, ts: now - 60000 },
          { id: `DEMO-${Math.random().toString(36).slice(2,7)}`, type: "suspicious activity", cameraId: "CAM-15", location: "Old Town", status: "active", severity: "warning", snapshotUrl: "", description: "Demo warning", confidence: 0.6, actions: [], raw: {}, ts: now - 120000 }
        ];
        seededRef.current = true;
        setAlerts((prev) => [...demo, ...prev].slice(0, 1000));
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [alerts]);

  return [alerts, setAlerts];
}

function Toast({ item }) {
  const isCritical = item.severity === "critical";
  const badge = createBadge(isCritical ? "critical" : "warning");
  return (
    <div className="toast-item" style={{ ...badge.style }}>
      <div style={{ fontWeight: 600 }}>{item.type}</div>
      <div className="small">{item.cameraId || "-"} • {new Date(item.ts).toLocaleTimeString()}</div>
    </div>
  );
}

export default function AlertSystem() {
  const [allAlerts, setAllAlerts] = useBatchedSocketAlerts();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 30;
  const sentinelRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  // Toast + sound for critical alerts
  useEffect(() => {
    if (allAlerts.length === 0) return;
    const latest = allAlerts[0];
    setToasts((prev) => [{ id: latest.id, ...latest }, ...prev].slice(0, 5));
    if (latest.severity === "critical") {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "square"; o.frequency.value = 880; // A5
        g.gain.setValueAtTime(0.001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.45);
      } catch (_) {}
    }
    const t = setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== latest.id)), 4000);
    return () => clearTimeout(t);
  }, [allAlerts]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) setPage((p) => p + 1);
      });
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
    const to = toDate ? new Date(toDate).getTime() : Infinity;
    return allAlerts.filter((a) => {
      if (a.ts < from || a.ts > to) return false;
      if (typeFilter && String(a.type).toLowerCase() !== typeFilter) return false;
      if (statusFilter && String(a.status).toLowerCase() !== statusFilter) return false;
      if (q) {
        const cam = (a.cameraId || "").toLowerCase();
        const loc = (a.location || "").toLowerCase();
        if (!cam.includes(q) && !loc.includes(q)) return false;
      }
      return true;
    });
  }, [allAlerts, query, typeFilter, statusFilter, fromDate, toDate]);

  const paged = useMemo(() => filtered.slice(0, page * pageSize), [filtered, page]);

  function matchesFilters(a, q, tFilter, sFilter, from, to) {
    if (a.ts < from || a.ts > to) return false;
    if (tFilter && String(a.type).toLowerCase() !== tFilter) return false;
    if (sFilter && String(a.status).toLowerCase() !== sFilter) return false;
    if (q) {
      const cam = (a.cameraId || "").toLowerCase();
      const loc = (a.location || "").toLowerCase();
      const type = (a.type || "").toLowerCase();
      const idStr = String(a.id || "").toLowerCase();
      if (!cam.includes(q) && !loc.includes(q) && !type.includes(q) && !idStr.includes(q)) return false;
    }
    return true;
  }

  function handleSearchClick() {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate).getTime() : -Infinity;
    const to = toDate ? new Date(toDate).getTime() : Infinity;
    const count = allAlerts.reduce((acc, a) => acc + (matchesFilters(a, q, typeFilter, statusFilter, from, to) ? 1 : 0), 0);
    if (count === 0) {
      const now = Date.now();
      const demo = [
        { id: `DEMO-${Math.random().toString(36).slice(2,7)}`, type: "fighting", cameraId: "CAM-01", location: "Sector 12", status: "active", severity: "critical", snapshotUrl: "", description: "Demo critical event", confidence: 0.92, actions: [], raw: {}, ts: now },
        { id: `DEMO-${Math.random().toString(36).slice(2,7)}`, type: "theft", cameraId: "CAM-07", location: "Market Square", status: "active", severity: "critical", snapshotUrl: "", description: "Demo high event", confidence: 0.85, actions: [], raw: {}, ts: now - 60000 },
        { id: `DEMO-${Math.random().toString(36).slice(2,7)}`, type: "suspicious activity", cameraId: "CAM-15", location: "Old Town", status: "active", severity: "warning", snapshotUrl: "", description: "Demo warning", confidence: 0.6, actions: [], raw: {}, ts: now - 120000 }
      ];
      setAllAlerts((prev) => [...demo, ...prev].slice(0, 1000));
    }
    setPage(1);
  }

  function openAlert(a) { setSelected(a); setIsModalOpen(true); }
  function closeAlert() { setIsModalOpen(false); setSelected(null); }

  function markResolved(id) {
    setAllAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a)));
  }
  function escalate(id) {
    setAllAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, actions: [...(a.actions || []), { t: Date.now(), action: "Escalated" }], severity: "critical" } : a)));
  }

  function exportCSV() {
    const headers = ["id","type","timestamp","cameraId","location","status","severity","confidence"];
    const rows = filtered.map((a) => [a.id, a.type, new Date(a.ts).toISOString(), a.cameraId || "", a.location || "", a.status, a.severity, a.confidence ?? ""]); 
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `alerts_${new Date().toISOString().replace(/[:.]/g,"-")}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDFLike() {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const rows = filtered.slice(0, 200).map((a) => `<tr><td>${a.id}</td><td>${a.type}</td><td>${new Date(a.ts).toLocaleString()}</td><td>${a.cameraId||""}</td><td>${a.location||""}</td><td>${a.status}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><title>Alerts Report</title><style>body{font-family:Arial} table{border-collapse:collapse;width:100%} td,th{border:1px solid #ccc;padding:6px} th{background:#eee}</style></head><body><h2>Alerts Report</h2><table><thead><tr><th>ID</th><th>Type</th><th>Time</th><th>Camera</th><th>Location</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div>
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => <Toast key={t.id} item={t} />)}
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr repeat(4, 1fr) auto auto auto", gap: 8, alignItems: "end" }}>
          <div>
            <div className="small">Search</div>
            <input placeholder="Camera ID, Location, Type, or ID" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          </div>
          <div>
            <div className="small">Type</div>
            <select value={typeFilter} onChange={(e) => { setPage(1); setTypeFilter(e.target.value); }}>
              <option value="">All</option>
              <option value="fighting">Fighting</option>
              <option value="theft">Theft</option>
              <option value="accident">Accident</option>
              <option value="suspicious activity">Suspicious Activity</option>
            </select>
          </div>
          <div>
            <div className="small">Status</div>
            <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <div className="small">From</div>
            <input type="datetime-local" placeholder="dd-mm-yyyy --:-- --" title="dd-mm-yyyy --:-- --" value={fromDate} onChange={(e) => { setPage(1); setFromDate(e.target.value); }} />
          </div>
          <div>
            <div className="small">To</div>
            <input type="datetime-local" placeholder="dd-mm-yyyy --:-- --" title="dd-mm-yyyy --:-- --" value={toDate} onChange={(e) => { setPage(1); setToDate(e.target.value); }} />
          </div>
          <button className="btn btn-muted" onClick={() => { setTypeFilter(""); setStatusFilter(""); setFromDate(""); setToDate(""); setQuery(""); setPage(1); }}>Reset</button>
          <button className="btn btn-primary" onClick={handleSearchClick}>Search</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-primary" onClick={exportPDFLike}>Export PDF</button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 100px", gap: 8, padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }} className="small">
          <div>Type</div>
          <div>Time</div>
          <div>Location</div>
          <div>Camera</div>
          <div>Status</div>
        </div>
        <div>
          <div className="small" style={{ padding: "8px 10px", opacity: 0.75 }}>
            Showing {paged.length} of {filtered.length} results{query ? ` for "${query}"` : ""}
          </div>
          {paged.map((a) => {
            const badge = createBadge(a.severity === "critical" ? "critical" : a.status === "resolved" ? "resolved" : "warning");
            return (
              <div key={a.id} className="alert-row" onClick={() => openAlert(a)} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge" style={badge.style}>{a.type}</span>
                  <span className="small" style={{ opacity: 0.8 }}>#{a.id.slice(-6)}</span>
                </div>
                <div className="small">{new Date(a.ts).toLocaleString()}</div>
                <div className="small">{a.location}</div>
                <div className="small">{a.cameraId || "-"}</div>
                <div className="small" style={{ textTransform: "capitalize" }}>{a.status}</div>
              </div>
            );
          })}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {paged.length === 0 && (
            <div className="center" style={{ padding: 20, opacity: 0.7 }}>No alerts</div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <IncidentModal
        isOpen={isModalOpen}
        onClose={closeAlert}
        incident={selected ? {
          id: selected.id,
          type: selected.type,
          snapshotUrl: selected.snapshotUrl,
          timestamp: selected.ts,
          cameraId: selected.cameraId,
          severity: selected.severity,
          description: selected.description,
          involvedIds: selected.raw?.ids || selected.raw?.involvedIds || [],
          confidence: selected.confidence,
          actions: selected.actions,
          location: selected.location,
          status: selected.status,
        } : null}
      />

      {selected && (
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="btn btn-primary" onClick={() => markResolved(selected.id)}>Mark Resolved</button>
          <button className="btn btn-danger" onClick={() => escalate(selected.id)}>Escalate</button>
        </div>
      )}
    </div>
  );
}


