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
        <div style={{ fontSize: 13, lineHeight: "1.5", color: "var(--text)", maxHeight: 320, overflowY: "auto" }}>
          <p><strong>LiteIDE</strong> — Small core, infinite reach.</p>
          <p>Lightweight cross-platform IDE • Tauri 2 + Monaco + React 18 • <a href="https://github.com/ajit-ai/LiteIDE" style={{ color: "var(--accent)" }}>github.com/ajit-ai/LiteIDE</a> • v0.1.0 MIT</p>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />
          <p><strong>Quick Help (also docs/help.md):</strong></p>
          <ol style={{ paddingLeft: 16, margin: "8px 0" }}>
            <li><strong>Open Folder:</strong> File → Open Folder (Ctrl+O) → Explorer tree ▼/▶</li>
            <li><strong>Create/Edit:</strong> + File → hello.py → click file (not blank — fallback textarea if needed) → type → Ctrl+S Save (Footer ● Modified → Saved)</li>
            <li><strong>Build/Run:</strong> Output → Build (gcc/g++/javac) → Run (./hello) — also Run → Build/Run (Ctrl+B/R). See Terminal for echo hello.</li>
            <li><strong>Search/Palette:</strong> View → Search (Ctrl+F) for ok; Ctrl+Shift+P palette.</li>
            <li><strong>Theme/Split:</strong> View → Toggle Theme (🌙/☀️ persists) → Split Horizontal 2 panes.</li>
          </ol>
          <p><strong>Supported:</strong> C (clangd/gcc `gcc -o`), C++ (clangd/g++ -std=c++17), Java (jdtls/javac `java Hello`), Python (pylsp `python hello.py`).</p>
          <p><strong>One-click Notepad:</strong> Explorer `Notepad ↗` → notepad.exe / open -t / xdg-open (lib.rs:172).</p>
          <p><strong>Footer:</strong> StatusBar: platform | path ● | language | Ln Col | LSP:idle | Dark/Light | Help | Footer</p>
          <p style={{ fontSize: 11, color: "var(--text-dim)" }}>Full guide: docs/help.md • Architecture: README §5 • Shortcuts: Ctrl+S/O/W, Ctrl+Shift+P, Ctrl+B/R, Ctrl+F, Ctrl+Z/Y</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-small" onClick={() => window.open("https://github.com/ajit-ai/LiteIDE", "_blank")}>Docs on GitHub</button>
          <button className="btn btn-secondary btn-small" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
