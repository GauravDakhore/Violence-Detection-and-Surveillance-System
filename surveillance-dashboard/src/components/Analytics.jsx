// src/components/Analytics.jsx
import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { socket } from "../api/socket";

const PIE_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"];

// Round timestamp to the start of the minute
function floorToMinute(timestampMs) {
  return Math.floor(timestampMs / 60000) * 60000;
}

export default function Analytics() {
  // Array of { minuteStartMs: number, count: number } for last 60 minutes
  const [timeSeries, setTimeSeries] = useState([]);
  // Map of eventType -> count
  const [typeCounts, setTypeCounts] = useState({});

  useEffect(() => {
    if (!socket.connected) socket.connect();

    function onAnomaly(a) {
      const ts = a?.ts || a?.timestamp || a?.time || a?.detectedAt || Date.now();
      const minute = floorToMinute(typeof ts === "number" ? ts : new Date(ts).getTime());
      const type = a?.type || "Anomaly";

      setTimeSeries((prev) => {
        // Update or insert current minute bucket
        let found = false;
        const updated = prev.map((item) => {
          if (item.minuteStartMs === minute) {
            found = true;
            return { ...item, count: item.count + 1 };
          }
          return item;
        });
        const withNew = found ? updated : [...updated, { minuteStartMs: minute, count: 1 }];
        // Keep only last 60 minutes
        const cutoff = Date.now() - 60 * 60000;
        return withNew
          .filter((i) => i.minuteStartMs >= cutoff)
          .sort((a, b) => a.minuteStartMs - b.minuteStartMs)
          .slice(-60);
      });

      setTypeCounts((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    }

    socket.on("anomaly", onAnomaly);
    return () => {
      socket.off("anomaly", onAnomaly);
      socket.disconnect();
    };
  }, []);

  const lineData = useMemo(() => {
    // Ensure we always show up to 60 minutes, even if empty, for smoother charting
    const now = Date.now();
    const start = floorToMinute(now - 59 * 60000);
    const minuteIndex = new Map(timeSeries.map((d) => [d.minuteStartMs, d.count]));
    const data = [];
    for (let i = 0; i < 60; i += 1) {
      const minuteStart = start + i * 60000;
      const label = new Date(minuteStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      data.push({ time: label, events: minuteIndex.get(minuteStart) || 0 });
    }
    return data;
  }, [timeSeries]);

  const pieData = useMemo(() => {
    const entries = Object.entries(typeCounts);
    if (entries.length === 0) return [{ name: "No Events", value: 1 }];
    return entries.map(([name, value]) => ({ name, value }));
  }, [typeCounts]);

  return (
    <div className="analytics-grid">
      <div className="card chart-card">
        <h3 style={{ marginBottom: 8 }}>Events Over Time</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid stroke="#112233" />
              <XAxis dataKey="time" stroke="#98a0b3" minTickGap={20} />
              <YAxis stroke="#98a0b3" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="events" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card chart-card" style={{ padding: 14 }}>
        <h3 style={{ marginBottom: 8 }}>Event Types</h3>
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
    </div>
  );
}
