import React, { useEffect, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import { invoke } from "@tauri-apps/api/core";

export default function StatusBar() {
  const activePath = useEditorStore((s) => s.activePath);
  const tabs = useEditorStore((s) => s.tabs);
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const activeTab = tabs.find((t) => t.path === activePath);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [platform, setPlatform] = useState("");

  useEffect(() => {
    invoke<string>("platform_name").then(setPlatform).catch(() => {});
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setCursor(detail);
    };
    window.addEventListener("cursorChange", handler as EventListener);
    return () => window.removeEventListener("cursorChange", handler as EventListener);
  }, []);

  return (
    <div className="status-bar">
      <span>{platform}</span>
      <span style={{ marginLeft: "auto" }}>{activeTab ? activeTab.language : "plaintext"}</span>
      {activeTab && <span>Ln {cursor.line}, Col {cursor.col}</span>}
      {activeTab && activeTab.dirty && <span>● Modified</span>}
      <span style={{ cursor: "pointer" }} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
        {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
      </span>
      <span>LSP: idle</span>
    </div>
  );
}
