import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Terminal() {
  const [shell, setShell] = useState("loading…");
  const [log, setLog] = useState("Integrated terminal — OS shell via Tauri shell plugin.\nType commands in the output panel's Build/Run or use external terminal for now.\n");
  const [input, setInput] = useState("");

  useEffect(() => {
    invoke<{ shell: string; args: string[] }>("get_shell_config").then((c) => setShell(`${c.shell} ${c.args.join(" ")}`)).catch(() => setShell("unknown"));
    invoke<string>("platform_name").then((p) => setLog((l) => l + `Platform: ${p}\nShell: ${shell}\n`));
  }, []);

  const runCmd = async () => {
    if (!input.trim()) return;
    setLog((l) => l + `\n$ ${input}\n`);
    setInput("");
    // For MVP, shell execution is via build_runner's Run — we show placeholder
    setLog((l) => l + "(shell execution via Tauri shell plugin coming soon — use Build/Run or external terminal)\n");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", fontFamily: "monospace", fontSize: 12 }}>
      <div style={{ padding: "4px 8px", borderBottom: "1px solid var(--border)", color: "var(--text-dim)" }}>Shell: {shell}</div>
      <pre style={{ flex: 1, overflow: "auto", padding: 8, whiteSpace: "pre-wrap" }}>{log}</pre>
      <div style={{ display: "flex", gap: 6, padding: 6, borderTop: "1px solid var(--border)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runCmd()} placeholder="Type command and press Enter" style={{ flex: 1, padding: "6px 8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 4 }} />
        <button className="btn btn-small" onClick={runCmd}>Send</button>
      </div>
    </div>
  );
}
