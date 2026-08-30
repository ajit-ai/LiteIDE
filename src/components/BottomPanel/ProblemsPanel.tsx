import React from "react";

export default function ProblemsPanel() {
  return (
    <div style={{ padding: 12, color: "var(--text-dim)", fontSize: 12 }}>
      No problems detected. LSP diagnostics will appear here when language servers are running.
      <div style={{ marginTop: 12 }}>
        Ensure clangd / pylsp / jdtls is installed and on PATH. Check Output panel for LSP status.
      </div>
    </div>
  );
}
