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
import HelpModal from "./components/HelpModal";
import { useEditorStore } from "./store/editorStore";
import { useFileStore } from "./store/fileStore";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { EventBus } from "./plugins/plugin-api";
import langPython from "./plugins/lang-python";
import langCCpp from "./plugins/lang-c-cpp";
import langJava from "./plugins/lang-java";
import gitStatus from "./plugins/git-status";
import debuggerPlugin from "./plugins/debugger";

const eventBus = new EventBus();

export default function App() {
  const [sidebarTab, setSidebarTab] = useState<"explorer" | "search" | "plugins">("explorer");
  const [bottomTab, setBottomTab] = useState<"output" | "terminal" | "problems">("output");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [outputMsg, setOutputMsg] = useState<string | null>(null);
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
    gitStatus.activate(api as never);
    debuggerPlugin.activate(api as never);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleOpenFolder();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "w") {
        e.preventDefault();
        handleCloseFile();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Menu handlers
  const handleOpenFolder = async () => {
    const sel = await open({ directory: true });
    if (typeof sel === "string") {
      useFileStore.getState().setRoot(sel);
      eventBus.emit("project:open", sel);
      // persist recent
      try {
        const cfg = await invoke<{ recent_projects: string[] }>("get_global_config");
        const recent = [sel, ...(cfg.recent_projects || []).filter((p: string) => p !== sel)].slice(0, 10);
        await invoke("save_global_config", { config: { ...cfg, recent_projects: recent } });
      } catch {}
    }
  };
  const handleOpenFile = async () => {
    const sel = await open({ multiple: false });
    if (typeof sel === "string") {
      try {
        const content = await invoke<string>("read_file", { path: sel });
        const lang = await invoke<string>("detect_language", { path: sel });
        useEditorStore.getState().openTab({ path: sel, content, dirty: false, language: lang });
        window.dispatchEvent(new CustomEvent("file:open", { detail: sel }));
      } catch (e) { alert(String(e)); }
    }
  };
  const handleSave = async () => {
    const { activePath, tabs, markSaved } = useEditorStore.getState();
    if (!activePath) return alert("No file open");
    const tab = tabs.find((t) => t.path === activePath);
    if (!tab) return;
    try {
      await invoke("write_file", { path: activePath, content: tab.content });
      markSaved(activePath);
    } catch (e) { alert(String(e)); }
  };
  const handleSaveAs = async () => {
    const { activePath, tabs } = useEditorStore.getState();
    if (!activePath) return;
    const tab = tabs.find((t) => t.path === activePath);
    const dest = await save({ defaultPath: activePath });
    if (typeof dest === "string" && tab) {
      await invoke("write_file", { path: dest, content: tab.content });
      const lang = await invoke<string>("detect_language", { path: dest });
      useEditorStore.getState().openTab({ path: dest, content: tab.content, dirty: false, language: lang });
    }
  };
  const handleCloseFile = () => {
    const { activePath, closeTab } = useEditorStore.getState();
    if (activePath) closeTab(activePath);
  };
  const handleBuild = async () => {
    setBottomTab("output");
    const { activePath } = useEditorStore.getState();
    const root = useFileStore.getState().rootPath;
    if (!activePath) { setOutputMsg("No file open — File → Open File"); return; }
    const lang = await invoke<string>("detect_language", { path: activePath });
    setOutputMsg(`Building ${activePath} (${lang})…`);
    try {
      const res = await invoke<{ stdout: string; stderr: string; success: boolean; exit_code: number | null }>("build_project", { req: { language: lang, file: activePath, output: null, extra_args: null, cwd: root } });
      setOutputMsg(`Build ${res.success ? "ok" : "fail"} exit ${res.exit_code ?? "?"} — see Output tab for details`);
      eventBus.emit("build:done", res);
    } catch (e) { setOutputMsg(String(e)); }
    setTimeout(() => setOutputMsg(null), 4000);
  };
  const handleRun = async () => {
    setBottomTab("output");
    const { activePath } = useEditorStore.getState();
    const root = useFileStore.getState().rootPath;
    if (!activePath) { setOutputMsg("No file open"); return; }
    const lang = await invoke<string>("detect_language", { path: activePath });
    setOutputMsg(`Running ${activePath} (${lang})…`);
    try {
      const res = await invoke<{ stdout: string; stderr: string; success: boolean; exit_code: number | null }>("run_project", { req: { language: lang, file: activePath, cwd: root, args: null } });
      setOutputMsg(`Run ${res.success ? "ok" : "fail"}: ${res.stdout.slice(0,120)}`);
      eventBus.emit("run:done", res);
    } catch (e) { setOutputMsg(String(e)); }
    setTimeout(() => setOutputMsg(null), 5000);
  };

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
      <MenuBar
        onOpenFolder={handleOpenFolder}
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onCloseFile={handleCloseFile}
        onShowExplorer={() => setSidebarTab("explorer")}
        onShowSearch={() => setSidebarTab("search")}
        onShowPlugins={() => setSidebarTab("plugins")}
        onToggleTheme={() => useEditorStore.getState().setTheme(theme === "dark" ? "light" : "dark")}
        onSplitH={() => useEditorStore.getState().setSplitCount(2)}
        onSplitV={() => useEditorStore.getState().setSplitCount(2)}
        onCloseSplit={() => useEditorStore.getState().setSplitCount(1)}
        onBuild={handleBuild}
        onRun={handleRun}
        onShowTerminal={() => setBottomTab("terminal")}
        onShowOutput={() => setBottomTab("output")}
        onSettings={() => setSettingsOpen(true)}
        onHelp={() => setHelpOpen(true)}
        onPalette={() => setPaletteOpen(true)}
      />
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
      <StatusBar onHelp={() => setHelpOpen(true)} />
      <CommandPalette commands={commands} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      {outputMsg && <div style={{ position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#fff", padding: "6px 12px", borderRadius: 4, fontSize: 12, zIndex: 500 }}>{outputMsg} <span onClick={() => setOutputMsg(null)} style={{ marginLeft: 8, cursor: "pointer", textDecoration: "underline" }}>×</span></div>}
    </div>
  );
}
