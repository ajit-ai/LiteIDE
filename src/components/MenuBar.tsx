import React, { useState, useEffect, useRef } from "react";

type MenuHandlers = {
  onOpenFolder: () => void;
  onOpenFile: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onCloseFile: () => void;
  onShowExplorer: () => void;
  onShowSearch: () => void;
  onShowPlugins: () => void;
  onToggleTheme: () => void;
  onSplitH: () => void;
  onSplitV: () => void;
  onCloseSplit: () => void;
  onBuild: () => void;
  onRun: () => void;
  onShowTerminal: () => void;
  onShowOutput: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onPalette: () => void;
};

export default function MenuBar(props: MenuHandlers) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const Item = ({ label, shortcut, onClick }: { label: string; shortcut?: string; onClick: () => void }) => (
    <div
      onClick={() => { onClick(); setOpenMenu(null); }}
      style={{ display: "flex", justifyContent: "space-between", gap: 24, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span>{label}</span>
      {shortcut && <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{shortcut}</span>}
    </div>
  );

  const Menu = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div style={{ position: "relative" }}>
      <span
        onClick={() => setOpenMenu(openMenu === id ? null : id)}
        onMouseEnter={() => openMenu && setOpenMenu(id)}
        style={{ cursor: "pointer", padding: "4px 8px", background: openMenu === id ? "var(--accent)" : "transparent", color: openMenu === id ? "#fff" : "var(--text)", borderRadius: 4 }}
      >
        {label}
      </span>
      {openMenu === id && (
        <div style={{ position: "absolute", top: 24, left: 0, background: "var(--bg-sidebar)", border: "1px solid var(--border)", borderRadius: 4, minWidth: 220, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", padding: "4px 0" }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div ref={ref} style={{ height: 28, display: "flex", alignItems: "center", gap: 2, padding: "0 8px", background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)", fontSize: 12, userSelect: "none" }}>
      <span style={{ fontWeight: 700, marginRight: 8, color: "var(--accent)" }}>LiteIDE</span>

      <Menu id="file" label="File">
        <Item label="Open Folder" shortcut="Ctrl+O" onClick={props.onOpenFolder} />
        <Item label="Open File" onClick={props.onOpenFile} />
        <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
        <Item label="Save" shortcut="Ctrl+S" onClick={props.onSave} />
        <Item label="Save As" onClick={props.onSaveAs} />
        <Item label="Close File" shortcut="Ctrl+W" onClick={props.onCloseFile} />
        <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
        <Item label="Exit" onClick={() => window.close()} />
      </Menu>

      <Menu id="edit" label="Edit">
        <Item label="Undo" shortcut="Ctrl+Z" onClick={() => document.execCommand("undo")} />
        <Item label="Redo" shortcut="Ctrl+Y" onClick={() => document.execCommand("redo")} />
        <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
        <Item label="Cut" shortcut="Ctrl+X" onClick={() => document.execCommand("cut")} />
        <Item label="Copy" shortcut="Ctrl+C" onClick={() => document.execCommand("copy")} />
        <Item label="Paste" shortcut="Ctrl+V" onClick={() => document.execCommand("paste")} />
        <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
        <Item label="Find (Search Panel)" shortcut="Ctrl+F" onClick={props.onShowSearch} />
        <Item label="Save File" shortcut="Ctrl+S" onClick={props.onSave} />
      </Menu>

      <Menu id="view" label="View">
        <Item label="Explorer" onClick={props.onShowExplorer} />
        <Item label="Search" onClick={props.onShowSearch} />
        <Item label="Plugins" onClick={props.onShowPlugins} />
        <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
        <Item label="Toggle Theme" onClick={props.onToggleTheme} />
        <Item label="Command Palette" shortcut="Ctrl+Shift+P" onClick={props.onPalette} />
        <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
        <Item label="Split Horizontal" onClick={props.onSplitH} />
        <Item label="Split Vertical" onClick={props.onSplitV} />
        <Item label="Close Split" onClick={props.onCloseSplit} />
      </Menu>

      <Menu id="run" label="Run">
        <Item label="Build" shortcut="Ctrl+B" onClick={props.onBuild} />
        <Item label="Run" shortcut="Ctrl+R" onClick={props.onRun} />
        <Item label="Show Output" onClick={props.onShowOutput} />
        <Item label="Show Terminal" onClick={props.onShowTerminal} />
      </Menu>

      <span onClick={props.onSettings} style={{ cursor: "pointer", padding: "4px 8px" }}>Settings</span>

      <Menu id="help" label="Help">
        <Item label="About LiteIDE" onClick={props.onHelp} />
        <Item label="Shortcuts Help" shortcut="Ctrl+Shift+P" onClick={props.onPalette} />
        <Item label="Docs (GitHub)" onClick={() => window.open("https://github.com/ajit-ai/LiteIDE", "_blank")} />
      </Menu>

      <span style={{ marginLeft: "auto", color: "var(--text-dim)", fontSize: 11 }}>Small core, infinite reach — C/C++ · Java · Python</span>
    </div>
  );
}
