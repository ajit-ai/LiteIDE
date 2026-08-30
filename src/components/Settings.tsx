import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useEditorStore } from "../store/editorStore";
import { useFileStore } from "../store/fileStore";

interface GlobalConfig {
  theme: string;
  font_family: string;
  font_size: number;
  auto_save_interval: number;
  keybindings: Record<string, string>;
  recent_projects: string[];
}

export default function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [cfg, setCfg] = useState<GlobalConfig | null>(null);
  const [projectCfg, setProjectCfg] = useState<{ build_command?: string; run_command?: string; language?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const theme = useEditorStore((s) => s.theme);
  const setTheme = useEditorStore((s) => s.setTheme);
  const rootPath = useFileStore((s) => s.rootPath);

  useEffect(() => {
    if (!open) return;
    invoke<GlobalConfig>("get_global_config").then(setCfg).catch(() => setCfg(null));
    if (rootPath) {
      invoke<{ build_command?: string; run_command?: string; language?: string } | null>("get_project_config", { projectRoot: rootPath })
        .then(setProjectCfg)
        .catch(() => setProjectCfg(null));
    }
  }, [open, rootPath]);

  const saveGlobal = async () => {
    if (!cfg) return;
    setSaving(true);
    try {
      await invoke("save_global_config", { config: { ...cfg, theme } });
      // also persist theme locally
      setTheme(theme);
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  const saveProject = async () => {
    if (!rootPath || !projectCfg) return;
    setSaving(true);
    try {
      await invoke("save_project_config", { projectRoot: rootPath, config: projectCfg });
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-sidebar)",
          border: "1px solid var(--border)",
          width: 640,
          maxHeight: "80vh",
          overflowY: "auto",
          borderRadius: 8,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16 }}>Settings</h2>
          <button className="btn btn-secondary btn-small" onClick={onClose}>Close</button>
        </div>

        {!cfg && <div style={{ color: "var(--text-dim)" }}>Loading config…</div>}

        {cfg && (
          <>
            <section>
              <h3 style={{ fontSize: 13, marginBottom: 8, color: "var(--text-dim)" }}>Appearance</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <label>Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark")} style={{ padding: 6, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4 }}>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
                <label>Font Size</label>
                <input type="number" value={cfg.font_size} onChange={(e) => setCfg({ ...cfg, font_size: parseInt(e.target.value) || 14 })} style={{ width: 70, padding: 6, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4 }} />
                <label>Auto-save (ms)</label>
                <input type="number" value={cfg.auto_save_interval} onChange={(e) => setCfg({ ...cfg, auto_save_interval: parseInt(e.target.value) || 1000 })} style={{ width: 90, padding: 6, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4 }} />
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Font Family</label>
                <input value={cfg.font_family} onChange={(e) => setCfg({ ...cfg, font_family: e.target.value })} style={{ width: "100%", marginTop: 4, padding: 6, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4 }} />
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: 13, marginBottom: 8, color: "var(--text-dim)" }}>Keybindings (customizable, stored in config)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {Object.entries(cfg.keybindings).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ flex: 1, fontSize: 12 }}>{k}</span>
                    <input value={v} onChange={(e) => setCfg({ ...cfg, keybindings: { ...cfg.keybindings, [k]: e.target.value } })} style={{ flex: 1, padding: 4, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12 }} />
                  </div>
                ))}
              </div>
            </section>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-small" onClick={saveGlobal} disabled={saving}>{saving ? "Saving…" : "Save Global (TOML)"}</button>
              <span style={{ fontSize: 11, color: "var(--text-dim)", alignSelf: "center" }}>Saved to {navigator.platform.includes("Win") ? "%APPDATA%/LiteIDE/config.toml" : "~/.config/LiteIDE/config.toml"}</span>
            </div>
          </>
        )}

        <section style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <h3 style={{ fontSize: 13, marginBottom: 8, color: "var(--text-dim)" }}>Per-project (.liteidrc JSON) — {rootPath || "no folder open"}</h3>
          {rootPath ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label>Language <input value={projectCfg?.language || ""} onChange={(e) => setProjectCfg({ ...(projectCfg || {}), language: e.target.value })} placeholder="python / java / cpp" style={{ marginLeft: 8, padding: 6, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4 }} /></label>
                <label>Build Command <input value={projectCfg?.build_command || ""} onChange={(e) => setProjectCfg({ ...(projectCfg || {}), build_command: e.target.value })} placeholder="gcc -o {output} {file}" style={{ width: "100%", marginTop: 4, padding: 6, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4 }} /></label>
                <label>Run Command <input value={projectCfg?.run_command || ""} onChange={(e) => setProjectCfg({ ...(projectCfg || {}), run_command: e.target.value })} placeholder="python {file} / java {MainClass}" style={{ width: "100%", marginTop: 4, padding: 6, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4 }} /></label>
              </div>
              <button className="btn btn-small" style={{ marginTop: 10 }} onClick={saveProject} disabled={saving}>Save .liteidrc</button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Open a folder to edit per-project config.</div>
          )}
        </section>

        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
          Recent projects: {(cfg?.recent_projects || []).join(", ") || "none"}
        </div>
      </div>
    </div>
  );
}
