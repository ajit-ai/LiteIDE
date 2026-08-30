import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useFileStore } from "../../store/fileStore";
import { useEditorStore } from "../../store/editorStore";

export default function SearchPanel() {
  const { rootPath } = useFileStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ file: string; line: number; content: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = async () => {
    if (!rootPath || !query) return;
    setSearching(true);
    try {
      const res = await invoke<{ file: string; line: number; content: string }[]>("search_in_files", {
        root: rootPath,
        query,
        maxResults: 100,
      });
      setResults(res);
    } catch (e) { console.error(e); } finally { setSearching(false); }
  };

  const openResult = async (file: string) => {
    try {
      const content = await invoke<string>("read_file", { path: file });
      const lang = await invoke<string>("detect_language", { path: file });
      useEditorStore.getState().openTab({ path: file, content, dirty: false, language: lang });
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Search in files…"
          style={{ flex: 1, padding: "6px 8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 4 }}
        />
        <button className="btn btn-small" onClick={doSearch} disabled={searching}>{searching ? "…" : "Search"}</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
        {results.length === 0 && <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{query ? "No results" : "Enter query and press Enter"}</div>}
        {results.map((r, i) => (
          <div key={i} onClick={() => openResult(r.file)} style={{ padding: "4px 6px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
            <div style={{ color: "var(--accent)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.file}:{r.line}</div>
            <div style={{ color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
