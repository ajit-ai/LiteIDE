import React, { useEffect, useState, useMemo } from "react";
import EditorArea from "./components/Editor/EditorArea";
import FileTree from "./components/Sidebar/FileTree";
import SearchPanel from "./components/Sidebar/SearchPanel";
import OutputPanel from "./components/BottomPanel/OutputPanel";
import Terminal from "./components/BottomPanel/Terminal";
import ProblemsPanel from "./components/BottomPanel/ProblemsPanel";
import StatusBar from "./components/StatusBar";
import CommandPalette, { Command } from "./components/CommandPalette";
import Settings from "./components/Settings";
import MenuBar from "./components/MenuBar";
import { useEditorStore } from "./store/editorStore";
import { invoke } from "@tauri-apps/api/core";
import { EventBus } from "./plugins/plugin-api";
import langPython from "./plugins/lang-python";
import langCCpp from "./plugins/lang-c-cpp";
import langJava from "./plugins/lang-java";

const eventBus = new EventBus();

export default function App() {
  const [sidebarTab, setSidebarTab] = useState<"explorer" | "search" | "plugins">("explorer");
  const [bottomTab, setBottomTab] = useState<"output" | "terminal" | "problems">("output");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const theme = useEditorStore((s) => s.theme);

  // Plugin activation (core does not import plugins directly in Rust, but frontend bootstraps built-ins)
  useEffect(() => {
    const api = {
      commands: {
        _cmds: new Map<string, { label: string; handler: () => void }>(),
        registerCommand(id: string, label: string, handler: () => void) { this._cmds.set(id, { label, handler }); },
        executeCommand(id: string) { this._cmds.get(id)?.handler(); },
        listCommands() { return Array.from(this._cmds.entries()).map(([id, v]) => ({ id, label: v.label })); },
      },
      editor: {
        getActivePath: () => useEditorStore.getState().activePath,
        getContent: (p: string) => useEditorStore.getState().tabs.find((t) => t.path === p)?.content ?? null,
        setContent: (p: string, c: string) => useEditorStore.getState().updateContent(p, c),
        getLanguage: (p: string) => useEditorStore.getState().tabs.find((t) => t.path === p)?.language ?? null,
      },
      fs: {
        async readFile(p: string) { return invoke<string>("read_file", { path: p }); },
        async writeFile(p: string, c: string) { return invoke("write_file", { path: p, content: c }); },
        watchFile() {},
      },
      process: {
        async spawn() { return { stdout: "", stderr: "", code: null }; },
        kill() {},
      },
      ui: {
        showNotification(msg: string) { console.log("[UI]", msg); },
        registerPanel() {},
      },
      events: eventBus,
    };
    // Expose commands globally for palette
    (window as unknown as Record<string, unknown>).__commands = api.commands;
    langPython.activate(api as never);
    langCCpp.activate(api as never);
    langJava.activate(api as never);
  }, []);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const commands: Command[] = useMemo(() => {
    const cmds = (window as unknown as Record<string, unknown>).__commands as { _cmds?: Map<string, { label: string; handler: () => void }> } | undefined;
    const base: Command[] = [
      { id: "view.toggleTheme", label: "View: Toggle Theme", action: () => useEditorStore.getState().setTheme(theme === "dark" ? "light" : "dark") },
      { id: "view.settings", label: "Preferences: Open Settings", action: () => setSettingsOpen(true) },
      { id: "file.openFolder", label: "File: Open Folder", action: () => {} },
      { id: "editor.splitHorizontal", label: "Editor: Split Horizontal", action: () => useEditorStore.getState().setSplitCount(2) },
      { id: "editor.splitVertical", label: "Editor: Split Vertical", action: () => useEditorStore.getState().setSplitCount(2) },
      { id: "editor.closeSplit", label: "Editor: Close Split", action: () => useEditorStore.getState().setSplitCount(1) },
    ];
    if (cmds?._cmds) {
      for (const [id, v] of cmds._cmds.entries()) {
        base.push({ id, label: v.label, action: v.handler });
      }
    }
    return base;
  }, [paletteOpen, theme]);

  return (
    <div className="app-root" data-theme={theme}>
      <MenuBar onSettings={() => setSettingsOpen(true)} />
      <div className="app-body">
        <div className="sidebar">
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)" }}>
            <button className="btn-small" style={{ flex: 1, background: sidebarTab === "explorer" ? "var(--accent)" : "transparent", color: sidebarTab === "explorer" ? "#fff" : "var(--text)", border: "none", padding: "8px", cursor: "pointer" }} onClick={() => setSidebarTab("explorer")}>Explorer</button>
            <button className="btn-small" style={{ flex: 1, background: sidebarTab === "search" ? "var(--accent)" : "transparent", color: sidebarTab === "search" ? "#fff" : "var(--text)", border: "none", padding: "8px", cursor: "pointer" }} onClick={() => setSidebarTab("search")}>Search</button>
            <button className="btn-small" style={{ flex: 1, background: sidebarTab === "plugins" ? "var(--accent)" : "transparent", color: sidebarTab === "plugins" ? "#fff" : "var(--text)", border: "none", padding: "8px", cursor: "pointer" }} onClick={() => setSidebarTab("plugins")}>Plugins</button>
          </div>
          {sidebarTab === "explorer" && <FileTree />}
          {sidebarTab === "search" && <SearchPanel />}
          {sidebarTab === "plugins" && <div style={{ padding: 12, color: "var(--text-dim)", fontSize: 12 }}>Plugins: lang-c-cpp, lang-java, lang-python (built-in).<br/>External plugins drop folder: /plugins</div>}
        </div>

        <div className="main-area">
          <EditorArea />
          <div className="bottom-panel">
            <div className="panel-tabs">
              <span className={`panel-tab ${bottomTab === "output" ? "active" : ""}`} onClick={() => setBottomTab("output")}>Output</span>
              <span className={`panel-tab ${bottomTab === "terminal" ? "active" : ""}`} onClick={() => setBottomTab("terminal")}>Terminal</span>
              <span className={`panel-tab ${bottomTab === "problems" ? "active" : ""}`} onClick={() => setBottomTab("problems")}>Problems</span>
              <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontSize: 11, cursor: "pointer" }} onClick={() => setPaletteOpen(true)}>Ctrl+Shift+P</span>
            </div>
            {bottomTab === "output" && <OutputPanel />}
            {bottomTab === "terminal" && <Terminal />}
            {bottomTab === "problems" && <ProblemsPanel />}
          </div>
        </div>
      </div>
      <StatusBar />
      <CommandPalette commands={commands} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
