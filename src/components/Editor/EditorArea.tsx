import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useEditorStore } from "../../store/editorStore";
import { languageForPath, EDITOR_OPTIONS } from "./monaco-config";
import TabBar from "./TabBar";
import { invoke } from "@tauri-apps/api/core";

export default function EditorArea() {
  const { tabs, activePath, updateContent, setActive } = useEditorStore();
  const activeTab = tabs.find((t) => t.path === activePath) || null;
  const saveTimer = useRef<number | null>(null);

  // Auto-save handling via config interval (default 1000ms) — handled by parent polling
  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeTab) {
          invoke("write_file", { path: activeTab.path, content: activeTab.content })
            .then(() => {
              // mark saved
              useEditorStore.getState().markSaved(activeTab.path);
            })
            .catch(console.error);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTab]);

  if (!activeTab) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TabBar />
        <div className="editor-placeholder">
          <div>
            <h3 style={{ marginBottom: 8 }}>No file open</h3>
            <p>Open a file from the explorer or press Ctrl+O to open a folder.</p>
          </div>
        </div>
      </div>
    );
  }

  const splitCount = useEditorStore((s) => s.splitCount);
  const [monacoFailed, setMonacoFailed] = React.useState(false);

  // Normalize Windows backslashes for Monaco model path (prevents blank model)
  const monacoPath = activeTab.path.replace(/\\/g, "/");

  const renderEditor = (keySuffix = "") => {
    // Fallback textarea if Monaco fails (Windows MSI blank fix)
    if (monacoFailed) {
      return (
        <div className="monaco-wrapper" style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: splitCount > 1 ? "1px solid var(--border)" : undefined }}>
          <div style={{ padding: "4px 8px", background: "var(--bg-tab-inactive)", fontSize: 11, color: "var(--text-dim)" }}>{activeTab.path} • {activeTab.language} • fallback editor (Monaco not loaded)</div>
          <textarea
            value={activeTab.content}
            onChange={(e) => updateContent(activeTab.path, e.target.value)}
            style={{ flex: 1, width: "100%", background: "var(--bg)", color: "var(--text)", border: "none", padding: 12, fontFamily: "Consolas, monospace", fontSize: 13, resize: "none", outline: "none" }}
            placeholder="Edit file content here — Ctrl+S to save"
          />
        </div>
      );
    }
    return (
      <div className="monaco-wrapper" style={{ flex: 1, borderRight: splitCount > 1 ? "1px solid var(--border)" : undefined }}>
        <Editor
          key={monacoPath + keySuffix}
          path={monacoPath + keySuffix}
          value={activeTab.content}
          language={languageForPath(activeTab.path)}
          theme={useEditorStore.getState().theme === "dark" ? "vs-dark" : "vs"}
          options={EDITOR_OPTIONS}
          onChange={(val) => {
            if (val !== undefined) updateContent(activeTab.path, val);
            if (saveTimer.current) window.clearTimeout(saveTimer.current);
            saveTimer.current = window.setTimeout(async () => {}, 1000);
          }}
          onMount={(editor) => {
            editor.onDidChangeCursorPosition((e) => {
              const pos = e.position;
              (window as unknown as Record<string, unknown>).__cursor = { line: pos.lineNumber, col: pos.column };
              window.dispatchEvent(new CustomEvent("cursorChange", { detail: { line: pos.lineNumber, col: pos.column } }));
            });
          }}
          onValidate={() => {}}
          loading={<div style={{ padding: 20, color: "var(--text-dim)" }}>Loading editor…</div>}
        />
        {/* Hidden fallback trigger — if Monaco blank, user can click to switch */}
        <div style={{ position: "absolute", top: 4, right: 8, fontSize: 10, opacity: 0.5 }}>
          <span onClick={() => setMonacoFailed(true)} style={{ cursor: "pointer", textDecoration: "underline" }} title="If editor is blank/black, click for fallback">fallback</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TabBar />
      <div style={{ flex: 1, display: "flex", overflow: "hidden", flexDirection: splitCount > 1 ? "row" : "column" }}>
        {renderEditor()}
        {splitCount > 1 && renderEditor("-split2")}
      </div>
    </div>
  );
}
