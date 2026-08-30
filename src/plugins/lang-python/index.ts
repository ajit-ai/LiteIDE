import type { LiteIDEPlugin, LiteIDEPluginAPI } from "../plugin-api";

const plugin: LiteIDEPlugin = {
  metadata: {
    id: "lang-python",
    name: "Python Language Support",
    version: "0.1.0",
    languages: ["python"],
    description: "Pylsp/Pyright + python runner",
  },
  activate(api: LiteIDEPluginAPI) {
    api.commands.registerCommand("python.run", "Python: Run File", async () => {
      const path = api.editor.getActivePath();
      if (!path) return api.ui.showNotification("No active file", "warning");
      api.events.emit("build:run", { language: "python", file: path });
    });
    api.commands.registerCommand("python.build", "Python: Check Syntax", async () => {
      const path = api.editor.getActivePath();
      if (!path) return;
      api.events.emit("build:build", { language: "python", file: path });
    });
    api.events.on("file:open", (path) => {
      if (typeof path === "string" && path.endsWith(".py")) {
        // trigger lsp start via event
        api.events.emit("lsp:start", { language: "python" });
      }
    });
    console.log("[lang-python] activated");
  },
  deactivate() {
    console.log("[lang-python] deactivated");
  },
};

export default plugin;
