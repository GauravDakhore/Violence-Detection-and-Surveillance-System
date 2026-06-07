// src/components/AlertsPanel.jsx
import React, { useEffect, useState } from "react";
import { socket } from "../api/socket";
import IncidentModal from "./IncidentModal";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.on("connect", () => console.log("socket connected", socket.id));

    socket.on("anomaly", (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
    });

    return () => {
      socket.off("anomaly");
      socket.disconnect();
    };
  }, []);

  function openIncident(incident) {
    setSelected(incident);
    setIsModalOpen(true);
  }

  function closeIncident() {
    setIsModalOpen(false);
    setSelected(null);
  }

  return (
    <div>
      {alerts.length === 0 && <div className="small">No alerts</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.map((a, i) => {
          const when = a.ts || a.timestamp || a.time || a.detectedAt;
          const incident = {
            id: a.id,
            type: a.type || "Anomaly",
            snapshotUrl: a.snapshotUrl || a.imageUrl || a.thumbnail,
            cameraId: a.cameraId,
            timestamp: when,
            severity: a.severity,
            involvedIds: a.ids || a.involvedIds || a.participants,
            ...a
          };
          return (
            <div
              key={i}
              className="alert-item"
              onClick={() => openIncident(incident)}
              style={{ cursor: "pointer" }}
            >
              <div className="top">
                <div className="type">{incident.type}</div>
                <div className="meta small">{incident.cameraId} • {when ? new Date(when).toLocaleString() : "—"}</div>
              </div>

              {incident.snapshotUrl && <img src={incident.snapshotUrl} alt="snap" />}

              <div className="small" style={{ marginTop: 8 }}>
                Involved IDs: {(incident.involvedIds && Array.isArray(incident.involvedIds) ? incident.involvedIds.join(", ") : "—")}
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button className="btn btn-danger" onClick={(e) => e.stopPropagation()}>Acknowledge</button>
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); openIncident(incident); }}>Open</button>
              </div>
            </div>
          );
        })}
      </div>

      <IncidentModal isOpen={isModalOpen} onClose={closeIncident} incident={selected} />
    </div>
  );
}
