import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../../store/editorStore";
import { useFileStore } from "../../store/fileStore";

export default function OutputPanel() {
  const [output, setOutput] = useState("Ready — press Build or Run to see output.");
  const [busy, setBusy] = useState(false);
  const activePath = useEditorStore((s) => s.activePath);
  const rootPath = useFileStore((s) => s.rootPath);

  const build = async () => {
    if (!activePath) return setOutput("No active file to build.");
    const langRes = await invoke<string>("detect_language", { path: activePath });
    setBusy(true);
    setOutput(`Building ${activePath} (${langRes})…\n`);
    try {
      const res = await invoke<{ stdout: string; stderr: string; success: boolean; exit_code: number | null }>("build_project", {
        req: { language: langRes, file: activePath, output: null, extra_args: null, cwd: rootPath },
      });
      setOutput((p) => p + `Exit: ${res.exit_code ?? "?"} Success: ${res.success}\nSTDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr}`);
    } catch (e) {
      setOutput((p) => p + `Error: ${String(e)}`);
    } finally { setBusy(false); }
  };

  const run = async () => {
    if (!activePath) return setOutput("No active file to run.");
    const langRes = await invoke<string>("detect_language", { path: activePath });
    setBusy(true);
    setOutput(`Running ${activePath} (${langRes})…\n`);
    try {
      const res = await invoke<{ stdout: string; stderr: string; success: boolean; exit_code: number | null }>("run_project", {
        req: { language: langRes, file: activePath, cwd: rootPath, args: null },
      });
      setOutput((p) => p + `Exit: ${res.exit_code ?? "?"} Success: ${res.success}\nSTDOUT:\n${res.stdout}\nSTDERR:\n${res.stderr}`);
    } catch (e) {
      setOutput((p) => p + `Error: ${String(e)}`);
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 8, padding: "6px 8px", borderBottom: "1px solid var(--border)" }}>
        <button className="btn btn-small" onClick={build} disabled={busy}>Build</button>
        <button className="btn btn-small" onClick={run} disabled={busy}>Run</button>
        <button className="btn btn-small btn-secondary" onClick={() => setOutput("")}>Clear</button>
      </div>
      <pre style={{ flex: 1, overflow: "auto", padding: 8, fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap", background: "var(--bg)" }}>{output}</pre>
    </div>
  );
}
