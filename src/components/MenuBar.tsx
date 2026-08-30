import React from "react";

export default function MenuBar({ onSettings }: { onSettings: () => void }) {
  return (
    <div style={{ height: 28, display: "flex", alignItems: "center", gap: 4, padding: "0 8px", background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
      <span style={{ fontWeight: 600, marginRight: 12 }}>LiteIDE</span>
      <span style={{ cursor: "pointer", padding: "4px 8px" }} onClick={onSettings}>File</span>
      <span style={{ cursor: "pointer", padding: "4px 8px" }} onClick={onSettings}>Edit</span>
      <span style={{ cursor: "pointer", padding: "4px 8px" }} onClick={onSettings}>View</span>
      <span style={{ cursor: "pointer", padding: "4px 8px" }} onClick={onSettings}>Run</span>
      <span style={{ cursor: "pointer", padding: "4px 8px" }} onClick={onSettings}>Settings</span>
      <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontSize: 11 }}>Small core, infinite reach — C/C++ · Java · Python</span>
    </div>
  );
}
