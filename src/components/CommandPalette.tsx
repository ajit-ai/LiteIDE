import React, { useEffect, useMemo, useState } from "react";

export interface Command {
  id: string;
  label: string;
  action: () => void;
}

export default function CommandPalette({ commands, open, onClose }: { commands: Command[]; open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) { setQuery(""); setSelected(0); }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  const execute = (cmd: Command) => {
    cmd.action();
    onClose();
  };

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="command-input"
          placeholder="Type a command…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
            else if (e.key === "Enter") { const cmd = filtered[selected]; if (cmd) execute(cmd); }
            else if (e.key === "Escape") onClose();
          }}
        />
        <div className="command-list">
          {filtered.map((c, i) => (
            <div key={c.id} className={`command-item ${i === selected ? "selected" : ""}`} onClick={() => execute(c)}>
              <div style={{ fontWeight: 500 }}>{c.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{c.id}</div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 12, color: "var(--text-dim)" }}>No commands matching "{query}"</div>}
        </div>
      </div>
    </div>
  );
}
