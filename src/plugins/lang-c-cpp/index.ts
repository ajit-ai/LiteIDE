import type { LiteIDEPlugin, LiteIDEPluginAPI } from "../plugin-api";

const plugin: LiteIDEPlugin = {
  metadata: {
    id: "lang-c-cpp",
    name: "C/C++ Language Support",
    version: "0.1.0",
    languages: ["c", "cpp"],
    description: "clangd + gcc/clang",
  },
  activate(api: LiteIDEPluginAPI) {
    api.commands.registerCommand("c-cpp.build", "C/C++: Build File", async () => {
      const path = api.editor.getActivePath();
      if (!path) return api.ui.showNotification("No active file", "warning");
      const lang = path.endsWith(".c") ? "c" : "cpp";
      api.events.emit("build:build", { language: lang, file: path });
    });
    api.commands.registerCommand("c-cpp.run", "C/C++: Build & Run", async () => {
      const path = api.editor.getActivePath();
      if (!path) return;
      const lang = path.endsWith(".c") ? "c" : "cpp";
      api.events.emit("build:build", { language: lang, file: path });
      // run will be triggered after build success via output panel
    });
    api.events.on("file:open", (path) => {
      if (typeof path === "string" && (path.endsWith(".c") || path.endsWith(".cpp") || path.endsWith(".h"))) {
        api.events.emit("lsp:start", { language: "cpp" });
      }
    });
    console.log("[lang-c-cpp] activated");
  },
  deactivate() {
    console.log("[lang-c-cpp] deactivated");
  },
};

export default plugin;
