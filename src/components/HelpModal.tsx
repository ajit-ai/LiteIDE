import React from "react";

export default function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg-sidebar)", border: "1px solid var(--border)", width: 560, borderRadius: 8, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16 }}>About LiteIDE</h2>
          <button className="btn btn-secondary btn-small" onClick={onClose}>Close</button>
        </div>
        <div style={{ fontSize: 13, lineHeight: "1.5", color: "var(--text)" }}>
          <p><strong>LiteIDE</strong> — Small core, infinite reach.</p>
          <p>Lightweight cross-platform IDE • Tauri 2 + Monaco + React 18</p>
          <p>Version 0.1.0 • MIT • <a href="https://github.com/ajit-ai/LiteIDE" style={{ color: "var(--accent)" }}>github.com/ajit-ai/LiteIDE</a></p>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />
          <p><strong>Supported:</strong> C (clangd/gcc), C++ (clangd/g++), Java (jdtls/javac), Python (pylsp/pyright)</p>
          <p><strong>Shortcuts:</strong> Ctrl+S save • Ctrl+Shift+P palette • Ctrl+B build • Ctrl+R run • Ctrl+F search</p>
          <p><strong>Footer:</strong> Status bar shows language • Ln/Col • dirty • theme • LSP</p>
          <p><strong>Plugins:</strong> src/plugins/plugin-api.ts — additive only, EventBus</p>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />
          <p style={{ fontSize: 11, color: "var(--text-dim)" }}>File → Open Folder/File • Save/Save As • Close • Explorer→Notepad ↗ opens system editor (notepad.exe/open -t/xdg-open)</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-small" onClick={() => window.open("https://github.com/ajit-ai/LiteIDE", "_blank")}>Docs on GitHub</button>
          <button className="btn btn-secondary btn-small" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
