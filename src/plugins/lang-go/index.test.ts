import { describe, it, expect, vi } from "vitest";
import plugin from "./index";
import { EventBus } from "../plugin-api";

describe("lang-go plugin — Go extension via plugin-api (no core changes)", () => {
  it("registers go.build and go.run and emits gopls on .go open", () => {
    const cmds = new Map<string, unknown>();
    const bus = new EventBus();
    const api = {
      commands: { registerCommand: (id: string) => cmds.set(id, true), executeCommand: vi.fn(), listCommands: () => [] },
      editor: { getActivePath: () => "main.go", getContent: () => "", setContent: vi.fn(), getLanguage: () => "go" },
      fs: { readFile: async () => "", writeFile: async () => {}, watchFile: () => {} },
      process: { spawn: async () => ({ stdout: "", stderr: "", code: 0 }), kill: () => {} },
      ui: { showNotification: vi.fn(), registerPanel: vi.fn() },
      events: bus,
    } as unknown as never;
    plugin.activate(api as never);
    expect(cmds.has("go.build")).toBe(true);
    expect(cmds.has("go.run")).toBe(true);
    let lspStarted = false;
    bus.on("lsp:start", (arg) => {
      if ((arg as { language: string }).language === "go") lspStarted = true;
    });
    bus.emit("file:open", "main.go");
    expect(lspStarted).toBe(true);
    expect(plugin.metadata.id).toBe("lang-go");
    expect(plugin.metadata.languages).toContain("go");
  });
});
