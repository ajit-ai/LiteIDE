/**
 * Git Status Plugin — post-v1.0 via plugin-api
 * Uses EventBus + process.spawn to call `git status --porcelain`,
 * and ui.registerPanel to show badges in file tree.
 * No core changes (Rule 4).
 */
import type { LiteIDEPlugin, LiteIDEPluginAPI } from "../plugin-api";

type GitFileStatus = "modified" | "untracked" | "staged" | "deleted" | "clean";

const plugin: LiteIDEPlugin = {
  metadata: {
    id: "git-status",
    name: "Git Status",
    version: "0.1.0",
    languages: [],
    description: "Shows git file status (M/?/A) in file tree via EventBus",
  },
  activate(api: LiteIDEPluginAPI) {
    const statusMap = new Map<string, GitFileStatus>();

    api.commands.registerCommand("git.status", "Git: Show Status", async () => {
      const root = (api as unknown as { _root?: string })._root as string | undefined;
      const cwd = root || ".";
      try {
        const res = await api.process.spawn("git", ["status", "--porcelain"], cwd);
        // parse e.g. " M src/App.tsx\n?? new.txt\nA  staged.txt"
        statusMap.clear();
        for (const line of res.stdout.split("\n")) {
          if (!line.trim()) continue;
          const code = line.slice(0, 2);
          const file = line.slice(3).trim();
          let s: GitFileStatus = "clean";
          if (code.includes("?")) s = "untracked";
          else if (code.includes("M")) s = "modified";
          else if (code.includes("A")) s = "staged";
          else if (code.includes("D")) s = "deleted";
          statusMap.set(file, s);
        }
        api.events.emit("git:status-updated", Object.fromEntries(statusMap));
        api.ui.showNotification(`Git: ${statusMap.size} files`, "info");
      } catch (e) {
        api.ui.showNotification(`Git status failed: ${String(e)}`, "warning");
      }
    });

    api.commands.registerCommand("git.commit", "Git: Commit", async () => {
      const cwd = ".";
      try {
        const res = await api.process.spawn("git", ["commit", "-m", "via LiteIDE"], cwd);
        api.ui.showNotification(res.stdout || "Committed", "info");
        api.events.emit("git:commit", res);
      } catch (e) {
        api.ui.showNotification(`Commit failed: ${String(e)}`, "error");
      }
    });

    // Listen to project open to auto-refresh status
    api.events.on("project:open", (root) => {
      (api as unknown as Record<string, unknown>)._root = root;
      api.commands.executeCommand("git.status");
    });

    // Register a panel placeholder (file tree badges handled via event)
    api.ui.registerPanel("git-status", "Git", () => {
      const el = document.createElement("div");
      el.textContent = "Git status via EventBus — see file tree badges (M/?/A)";
      return el;
    });

    api.events.on("file:open", () => {
      // could annotate file with git status
    });

    console.log("[git-status] activated — use Ctrl+Shift+P Git: Show Status");
  },
  deactivate() {
    console.log("[git-status] deactivated");
  },
};

export default plugin;
