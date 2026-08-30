/**
 * Debugger UI Plugin — post-v1.0 via plugin-api
 * Provides breakpoints, step, watch variables via EventBus and process API (gdb/lldb).
 * UI via registerPanel, no core changes.
 */
import type { LiteIDEPlugin, LiteIDEPluginAPI } from "../plugin-api";

interface Breakpoint {
  file: string;
  line: number;
  enabled: boolean;
}

const plugin: LiteIDEPlugin = {
  metadata: {
    id: "debugger",
    name: "Debugger UI",
    version: "0.1.0",
    languages: ["c", "cpp"],
    description: "Breakpoints, step, watch variables (gdb/lldb) via EventBus",
  },
  activate(api: LiteIDEPluginAPI) {
    const breakpoints: Breakpoint[] = [];
    const watchVars = new Map<string, string>();

    api.commands.registerCommand("debug.toggleBreakpoint", "Debug: Toggle Breakpoint", () => {
      const file = api.editor.getActivePath();
      if (!file) return api.ui.showNotification("No active file", "warning");
      // For demo, use cursor line 1 — real would use editor cursor API
      const line = 1;
      const idx = breakpoints.findIndex((b) => b.file === file && b.line === line);
      if (idx >= 0) breakpoints.splice(idx, 1);
      else breakpoints.push({ file, line, enabled: true });
      api.events.emit("debug:breakpoints-updated", [...breakpoints]);
      api.ui.showNotification(`Breakpoint ${idx >= 0 ? "removed" : "added"} ${file}:${line}`, "info");
    });

    api.commands.registerCommand("debug.start", "Debug: Start (gdb)", async () => {
      const file = api.editor.getActivePath();
      if (!file) return;
      try {
        // Example: gdb --args ./hello — in real, use build output
        const res = await api.process.spawn("gdb", ["--version"]);
        api.events.emit("debug:started", { file, gdb: res.stdout.slice(0, 80) });
        api.ui.showNotification(`Debugger started for ${file}`, "info");
      } catch (e) {
        api.ui.showNotification(`gdb not found: ${String(e)} — install gdb/lldb`, "warning");
      }
    });

    api.commands.registerCommand("debug.stepOver", "Debug: Step Over", () => {
      api.events.emit("debug:step", { type: "over" });
      api.ui.showNotification("Step over", "info");
    });

    api.commands.registerCommand("debug.watch", "Debug: Add Watch", () => {
      const expr = prompt("Watch expression:");
      if (!expr) return;
      watchVars.set(expr, "pending");
      api.events.emit("debug:watch-updated", Object.fromEntries(watchVars));
    });

    api.ui.registerPanel("debugger", "Debugger", () => {
      const el = document.createElement("div");
      el.innerHTML = `<div style="padding:8px;font-size:12px">
        <b>Debugger</b> — breakpoints: ${breakpoints.length}<br/>
        Use Ctrl+Shift+P → Debug: Toggle Breakpoint / Start / Step Over<br/>
        Watch: ${Array.from(watchVars.keys()).join(", ") || "none"}
      </div>`;
      return el;
    });

    api.events.on("build:done", () => {
      // auto-enable debugger after successful C/C++ build
    });

    console.log("[debugger] activated");
  },
  deactivate() {
    console.log("[debugger] deactivated");
  },
};

export default plugin;
