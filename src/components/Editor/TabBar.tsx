import React from "react";
import { useEditorStore } from "../../store/editorStore";

export default function TabBar() {
  const { tabs, activePath, setActive, closeTab } = useEditorStore();
  if (tabs.length === 0) return null;
  return (
    <div className="tab-bar">
      {tabs.map((t) => {
        const name = t.path.split(/[/\\]/).pop() || t.path;
        const isActive = t.path === activePath;
        return (
          <div
            key={t.path}
            className={`tab ${isActive ? "active" : ""} ${t.dirty ? "dirty" : ""}`}
            onClick={() => setActive(t.path)}
            title={t.path}
          >
            <span>{name}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                closeTab(t.path);
              }}
              style={{ marginLeft: 6, opacity: 0.7 }}
            >
              ×
            </span>
          </div>
        );
      })}
    </div>
  );
}
