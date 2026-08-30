import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useFileStore, FileEntry } from "../../store/fileStore";
import { useEditorStore } from "../../store/editorStore";

function TreeNode({ entry, depth, onSelect }: { entry: FileEntry; depth: number; onSelect: (p: string, isDir: boolean) => void }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [children, setChildren] = useState<FileEntry[] | null>(entry.children || null);
  const isDir = entry.is_dir;

  const toggle = async () => {
    if (!isDir) return onSelect(entry.path, false);
    if (!expanded && !children) {
      try {
        const list = await invoke<FileEntry[]>("list_dir", { path: entry.path });
        setChildren(list);
      } catch (e) {
        console.error(e);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <div>
      <div className="file-entry" style={{ paddingLeft: 8 + depth * 12 }} onClick={toggle} title={entry.path}>
        <span style={{ fontSize: 11 }}>{isDir ? (expanded ? "▼" : "▶") : "•"}</span>
        <span>{entry.name}</span>
      </div>
      {isDir && expanded && children && (
        <div>
          {children.map((c) => (
            <TreeNode key={c.path} entry={c} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileTree() {
  const { rootPath, setRoot, setSelected } = useFileStore();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async (path: string) => {
    setLoading(true);
    try {
      const list = await invoke<FileEntry[]>("list_dir", { path });
      setEntries(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rootPath) load(rootPath);
  }, [rootPath]);

  const openFolder = async () => {
    const selected = await open({ directory: true });
    if (typeof selected === "string") {
      setRoot(selected);
      // add to recent
      try {
        const cfg = await invoke<{ recent_projects: string[] }>("get_global_config");
        // not used yet
      } catch {}
    }
  };

  const handleSelect = async (path: string, isDir: boolean) => {
    setSelected(path);
    if (isDir) return;
    try {
      const content = await invoke<string>("read_file", { path });
      const lang = await invoke<string>("detect_language", { path });
      useEditorStore.getState().openTab({ path, content, dirty: false, language: lang });
      // notify plugins
      window.dispatchEvent(new CustomEvent("file:open", { detail: path }));
    } catch (e) {
      console.error(e);
    }
  };

  const createFile = async () => {
    if (!rootPath) return;
    const name = prompt("New file name (relative to project root):");
    if (!name) return;
    const full = rootPath + "/" + name;
    try {
      await invoke("create_entry", { path: full, isDir: false });
      load(rootPath);
    } catch (e) { alert(String(e)); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ padding: "8px", display: "flex", gap: 6, borderBottom: "1px solid var(--border)" }}>
        <button className="btn btn-small" onClick={openFolder}>Open Folder</button>
        <button className="btn btn-small btn-secondary" onClick={createFile} title="New File">+ File</button>
      </div>
      {rootPath && <div style={{ padding: "6px 8px", fontSize: 11, color: "var(--text-dim)", borderBottom: "1px solid var(--border)" }}>{rootPath}</div>}
      <div className="file-tree">
        {!rootPath && !loading && <div style={{ color: "var(--text-dim)", padding: 8 }}>No folder opened</div>}
        {loading && <div style={{ padding: 8 }}>Loading…</div>}
        {entries.map((e) => (
          <TreeNode key={e.path} entry={e} depth={0} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  );
}
