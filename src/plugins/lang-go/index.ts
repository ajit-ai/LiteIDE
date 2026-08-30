/**
 * Go Language Support — example per Master Prompt Extension
 * Follows plugin contract src/plugins/plugin-api.ts:14 — no core changes (Rule 4)
 */
import type { LiteIDEPlugin, LiteIDEPluginAPI } from "../plugin-api";

const plugin: LiteIDEPlugin = {
  metadata: {
    id: "lang-go",
    name: "Go Language Support",
    version: "0.1.0",
    languages: ["go"],
    description: "gopls + go run/build — example extension, zero core changes",
  },
  activate(api: LiteIDEPluginAPI) {
    api.commands.registerCommand("go.build", "Go: Build File", async () => {
      const path = api.editor.getActivePath();
      if (!path) return api.ui.showNotification("No active file", "warning");
      // Builder: go build -o {output} {file}
      api.events.emit("build:build", { language: "go", file: path, builder: "go build -o {output} {file}" });
      // Also try actual build via process API if go is available
      try {
        const output = path.replace(/\.go$/, "") + (navigator.platform.includes("Win") ? ".exe" : "");
        const res = await api.process.spawn("go", ["build", "-o", output, path]);
        api.ui.showNotification(res.stdout || `Built ${output}`, "info");
        api.events.emit("build:done", res);
      } catch (e) {
        // fallback to generic build via core build_runner if go not on PATH — still emits event
        api.ui.showNotification(`go build failed (is go on PATH?): ${String(e)}`, "warning");
      }
    });

    api.commands.registerCommand("go.run", "Go: Run File", async () => {
      const path = api.editor.getActivePath();
      if (!path) return api.ui.showNotification("No active file", "warning");
      // Runner: go run {file}
      api.events.emit("build:run", { language: "go", file: path, runner: "go run {file}" });
      try {
        const res = await api.process.spawn("go", ["run", path]);
        api.ui.showNotification(res.stdout.slice(0, 200) || "Go run ok", "info");
        api.events.emit("run:done", res);
      } catch (e) {
        api.ui.showNotification(`go run failed: ${String(e)}`, "warning");
      }
    });

    // Auto-start gopls when Go file opened (via EventBus, no core import)
    api.events.on("file:open", (path) => {
      if (typeof path === "string" && path.endsWith(".go")) {
        api.events.emit("lsp:start", { language: "go", server: "gopls", args: [] });
      }
    });

    api.events.on("project:open", (root) => {
      console.log("[lang-go] project opened", root);
    });

    console.log("[lang-go] activated — gopls, go run {file}, go build -o {output} {file}");
  },
  deactivate() {
    console.log("[lang-go] deactivated");
  },
};

export default plugin;
