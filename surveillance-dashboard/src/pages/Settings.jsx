// src/pages/Settings.jsx
import React, { useMemo, useState } from "react";

const groupStyle = { display: "grid", gap: 10 };
const gridTwo = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const labelStyle = { fontSize: 12, color: "#9aa8c9" };
const row = { display: "grid", gridTemplateColumns: "220px 1fr", alignItems: "center", gap: 10 };

function Section({ title, desc, children }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        {desc ? <div className="small">{desc}</div> : null}
      </div>
      <div style={groupStyle}>{children}</div>
    </div>
  );
}

export default function Settings() {
  const [state, setState] = useState({
    // User Management
    users: [{ username: "admin", role: "Admin" }, { username: "operator1", role: "Operator" }],
    // System Configuration
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    datetimeFormat: "YYYY-MM-DD HH:mm",
    language: "en",
    layout: "control-center",
    // Camera Management
    newCameraName: "",
    newCameraLocation: "",
    quality: 720,
    fps: 25,
    // Alert Configuration
    alertTypes: { Critical: true, Warning: true, Information: true },
    sensitivity: 70,
    notifyEmail: true,
    notifySms: false,
    notifyInApp: true,
    // Privacy & Security
    twoFactor: false,
    retentionDays: 30,
    // Maintenance
    autoUpdate: true,
  });

  const canSave = useMemo(() => true, [state]);

  function update(partial) { setState((s) => ({ ...s, ...partial })); }
  function addUser() {
    if (!state.newUser) return;
    update({ users: [...state.users, { username: state.newUser, role: "Viewer" }], newUser: "" });
  }
  function removeUser(u) { update({ users: state.users.filter((x) => x.username !== u) }); }

  return (
    <div className="app-container">
      <div className="header">
        <div className="title">Settings</div>
        <div className="meta">Tune your system configuration and policies</div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {/* User Management */}
        <Section title="User Management" desc="Manage users and roles">
          <div style={row}>
            <div style={labelStyle}>Existing Users</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {state.users.map((u) => (
                <span key={u.username} className="badge" style={{ background: "#0e1b2f", border: "1px solid #253454" }}>
                  {u.username} — {u.role}
                  <button className="btn btn-danger" style={{ marginLeft: 8, padding: "2px 6px" }} onClick={() => removeUser(u.username)}>Remove</button>
                </span>
              ))}
            </div>
          </div>
          <div style={row}>
            <div style={labelStyle}>Add User</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="username" value={state.newUser || ""} onChange={(e)=>update({ newUser: e.target.value })} />
              <select value={state.newRole || "Viewer"} onChange={(e)=>update({ newRole: e.target.value })}>
                <option>Admin</option>
                <option>Operator</option>
                <option>Viewer</option>
              </select>
              <button className="btn btn-primary" onClick={addUser}>Add</button>
            </div>
          </div>
        </Section>

        {/* System Configuration */}
        <Section title="System Configuration" desc="Regional and layout preferences">
          <div style={gridTwo}>
            <div style={row}><div style={labelStyle}>Time Zone</div><input value={state.timezone} onChange={(e)=>update({ timezone: e.target.value })} title="e.g. Asia/Kolkata" /></div>
            <div style={row}><div style={labelStyle}>Date/Time Format</div><input value={state.datetimeFormat} onChange={(e)=>update({ datetimeFormat: e.target.value })} title="e.g. DD-MM-YYYY HH:mm"/></div>
            <div style={row}><div style={labelStyle}>Language</div><select value={state.language} onChange={(e)=>update({ language: e.target.value })}><option value="en">English</option><option value="hi">Hindi</option></select></div>
            <div style={row}><div style={labelStyle}>Default Layout</div><select value={state.layout} onChange={(e)=>update({ layout: e.target.value })}><option value="control-center">Control Center</option><option value="compact">Compact</option></select></div>
          </div>
        </Section>

        {/* Camera Management */}
        <Section title="Camera Management" desc="Register and configure camera streams">
          <div style={gridTwo}>
            <div style={row}><div style={labelStyle}>Add Camera Name</div><input placeholder="Cam 07" value={state.newCameraName} onChange={(e)=>update({ newCameraName: e.target.value })} /></div>
            <div style={row}><div style={labelStyle}>Add Camera Location</div><input placeholder="Sector 12" value={state.newCameraLocation} onChange={(e)=>update({ newCameraLocation: e.target.value })} /></div>
            <div style={row}><div style={labelStyle}>Recording Quality</div><input type="number" min={144} max={2160} value={state.quality} onChange={(e)=>update({ quality: Number(e.target.value) })} title="Video vertical resolution (e.g., 720, 1080)" /></div>
            <div style={row}><div style={labelStyle}>Frame Rate</div><input type="number" min={1} max={60} value={state.fps} onChange={(e)=>update({ fps: Number(e.target.value) })} title="Frames per second" /></div>
          </div>
          <div className="small">Note: Camera status monitoring is shown on the Dashboard; offline cameras are highlighted.</div>
        </Section>

        {/* Alert Configuration */}
        <Section title="Alert Configuration" desc="Customize alert types and notifications">
          <div style={gridTwo}>
            <div style={row}><div style={labelStyle}>Alert Types</div>
              <div style={{ display:"flex", gap:10 }}>
                {Object.keys(state.alertTypes).map((k)=> (
                  <label key={k} className="small" style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                    <input type="checkbox" checked={state.alertTypes[k]} onChange={(e)=>update({ alertTypes: { ...state.alertTypes, [k]: e.target.checked } })} /> {k}
                  </label>
                ))}
              </div>
            </div>
            <div style={row}><div style={labelStyle}>Sensitivity</div><input type="range" min={0} max={100} value={state.sensitivity} onChange={(e)=>update({ sensitivity: Number(e.target.value) })} /></div>
            <div style={row}><div style={labelStyle}>Notifications</div>
              <div style={{ display:"flex", gap:10 }}>
                <label className="small"><input type="checkbox" checked={state.notifyEmail} onChange={(e)=>update({ notifyEmail: e.target.checked })}/> Email</label>
                <label className="small"><input type="checkbox" checked={state.notifySms} onChange={(e)=>update({ notifySms: e.target.checked })}/> SMS</label>
                <label className="small"><input type="checkbox" checked={state.notifyInApp} onChange={(e)=>update({ notifyInApp: e.target.checked })}/> In‑app</label>
              </div>
            </div>
          </div>
        </Section>

        {/* Privacy & Security */}
        <Section title="Privacy & Security" desc="Protect accounts and data">
          <div style={gridTwo}>
            <div style={row}><div style={labelStyle}>Two‑Factor Authentication</div><label className="small"><input type="checkbox" checked={state.twoFactor} onChange={(e)=>update({ twoFactor: e.target.checked })}/> Enable 2FA</label></div>
            <div style={row}><div style={labelStyle}>Data Retention (days)</div><input type="number" min={1} max={3650} value={state.retentionDays} onChange={(e)=>update({ retentionDays: Number(e.target.value) })} /></div>
            <div style={row}><div style={labelStyle}>Password Management</div><button className="btn btn-muted">Send Reset Email</button></div>
            <div style={row}><div style={labelStyle}>Access Logs</div><button className="btn btn-primary">View Logs</button></div>
          </div>
        </Section>

        {/* System Maintenance */}
        <Section title="System Maintenance" desc="Backup, updates, and diagnostics">
          <div style={gridTwo}>
            <div style={row}><div style={labelStyle}>Backup/Restore</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary">Backup Now</button>
                <button className="btn btn-muted">Restore…</button>
              </div>
            </div>
            <div style={row}><div style={labelStyle}>Software Updates</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label className="small"><input type="checkbox" checked={state.autoUpdate} onChange={(e)=>update({ autoUpdate: e.target.checked })}/> Auto‑check</label>
                <button className="btn btn-primary">Check Now</button>
              </div>
            </div>
            <div style={row}><div style={labelStyle}>Diagnostics</div><button className="btn btn-muted">Run Health Check</button></div>
          </div>
        </Section>

        {/* Save/Reset */}
        <div className="card" style={{ padding: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-muted" onClick={()=>window.location.reload()}>Reset</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={()=>alert("Settings saved (mock)")}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
