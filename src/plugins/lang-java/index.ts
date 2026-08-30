import type { LiteIDEPlugin, LiteIDEPluginAPI } from "../plugin-api";

const plugin: LiteIDEPlugin = {
  metadata: {
    id: "lang-java",
    name: "Java Language Support",
    version: "0.1.0",
    languages: ["java"],
    description: "jdt.ls + javac/java",
  },
  activate(api: LiteIDEPluginAPI) {
    api.commands.registerCommand("java.build", "Java: Compile", async () => {
      const path = api.editor.getActivePath();
      if (!path) return api.ui.showNotification("No active file", "warning");
      api.events.emit("build:build", { language: "java", file: path });
    });
    api.commands.registerCommand("java.run", "Java: Run", async () => {
      const path = api.editor.getActivePath();
      if (!path) return;
      api.events.emit("build:run", { language: "java", file: path });
    });
    api.events.on("file:open", (path) => {
      if (typeof path === "string" && path.endsWith(".java")) {
        api.events.emit("lsp:start", { language: "java" });
      }
    });
    // Detect maven/gradle marker
    api.events.on("project:open", (root) => {
      console.log("[lang-java] project opened", root);
    });
    console.log("[lang-java] activated");
  },
  deactivate() {
    console.log("[lang-java] deactivated");
  },
};

export default plugin;
