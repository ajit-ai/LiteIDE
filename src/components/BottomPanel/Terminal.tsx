import React, { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useFileStore } from "../../store/fileStore";

export default function Terminal() {
  const [shell, setShell] = useState("loading…");
  const [log, setLog] = useState("Integrated terminal — type a command and press Enter.\n");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const rootPath = useFileStore((s) => s.rootPath);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    invoke<{ shell: string; args: string[] }>("get_shell_config").then((c) => setShell(`${c.shell} ${c.args.join(" ")}`)).catch(() => setShell("unknown"));
    invoke<string>("platform_name").then((p) => setLog((l) => l + `Platform: ${p}\nShell: ${shell}\nReady — Footer shows file open/close status, Help in status bar.\n`));
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const runCmd = async () => {
    if (!input.trim() || busy) return;
    const cmd = input;
    setInput("");
    setBusy(true);
    setLog((l) => l + `\n$ ${cmd}\n`);
    try {
      const res = await invoke<{ stdout: string; stderr: string; success: boolean; exit_code: number | null }>("execute_shell", { command: cmd, cwd: rootPath || null });
      setLog((l) => l + res.stdout + (res.stderr ? `\n[stderr] ${res.stderr}` : "") + `\n[exit ${res.exit_code ?? "?"} ${res.success ? "ok" : "fail"}]\n`);
    } catch (e) {
      setLog((l) => l + `[error] ${String(e)}\n`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: "monospace", fontSize: 12 }}>
      <div style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-dim)" }}>Shell: {shell} • Use File → Open Folder to set cwd • Build/Run also in Output tab</div>
      <pre ref={logRef} style={{ flex: 1, overflow: "auto", padding: 8, whiteSpace: "pre-wrap", background: "var(--bg)" }}>{log}{busy ? "\n…running…" : ""}</pre>
      <div style={{ display: "flex", gap: 6, padding: 6, borderTop: "1px solid var(--border)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runCmd()} placeholder="e.g. dir / ls, gcc --version, python --version" style={{ flex: 1, padding: "6px 8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 4 }} />
        <button className="btn btn-small" onClick={runCmd} disabled={busy}>{busy ? "…" : "Send"}</button>
        <button className="btn btn-small btn-secondary" onClick={() => setLog("")}>Clear</button>
      </div>
    </div>
  );
}
