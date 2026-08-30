import React, { useEffect, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { invoke } from "@tauri-apps/api/core";

export default function StatusBar({ onHelp }: { onHelp?: () => void }) {
  const activePath = useEditorStore((s) => s.activePath);
  const tabs = useEditorStore((s) => s.tabs);
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const activeTab = tabs.find((t) => t.path === activePath);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [platform, setPlatform] = useState("");
  const [lsp, setLsp] = useState("idle");

  useEffect(() => {
    invoke<string>("platform_name").then(setPlatform).catch(() => setPlatform("windows"));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setCursor(detail);
    };
    window.addEventListener("cursorChange", handler as EventListener);
    return () => window.removeEventListener("cursorChange", handler as EventListener);
  }, []);

  // poll LSP status for active language
  useEffect(() => {
    if (!activeTab) { setLsp("idle"); return; }
    invoke<{ running: boolean }>("lsp_status", { language: activeTab.language }).then((s) => setLsp(s.running ? "running" : "idle")).catch(() => setLsp("idle"));
  }, [activePath, activeTab?.language]);

  return (
    <div className="status-bar" style={{ justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span title="Platform (PAL)">{platform}</span>
        <span title="Active file">{activeTab ? activeTab.path : "No file open"}{activeTab?.dirty ? " ●" : ""}</span>
        {activeTab && <span>{activeTab.language}</span>}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {activeTab && <span>Ln {cursor.line}, Col {cursor.col}</span>}
        <span title="LSP status">LSP: {lsp}</span>
        <span style={{ cursor: "pointer" }} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle Light/Dark (also Settings)">{theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
        <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={onHelp} title="Help & About">Help</span>
        <span title="Close/About">Footer • {activeTab ? (activeTab.dirty ? "Modified • Save Ctrl+S" : "Saved") : "Open a file → File > Open Folder"}</span>
      </div>
    </div>
  );
}
