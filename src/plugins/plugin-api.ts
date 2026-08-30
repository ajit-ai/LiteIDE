/**
 * LiteIDE Plugin API — single source of truth for plugin contract.
 * ADDITIVE ONLY: once shipped, do not remove or rename.
 * This file is src/plugins/plugin-api.ts per Section 8 RULE 6.
 */

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  languages: string[];
  description?: string;
}

export interface LiteIDEPlugin {
  metadata: PluginMetadata;
  activate(api: LiteIDEPluginAPI): void | Promise<void>;
  deactivate(): void | Promise<void>;
}

// --- Sub-APIs ---
export interface CommandsAPI {
  registerCommand(id: string, label: string, handler: () => void): void;
  executeCommand(id: string): void;
  listCommands(): { id: string; label: string }[];
}

export interface EditorAPI {
  getActivePath(): string | null;
  getContent(path: string): string | null;
  setContent(path: string, content: string): void;
  getLanguage(path: string): string | null;
}

export interface FileSystemAPI {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  watchFile(path: string, callback: (event: string) => void): void;
}

export interface ProcessAPI {
  spawn(command: string, args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; code: number | null }>;
  kill(pid: number): void;
}

export interface UIAPI {
  showNotification(message: string, type?: "info" | "warning" | "error"): void;
  registerPanel(id: string, title: string, render: () => HTMLElement): void;
}

export interface EventBusAPI {
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
}

export interface LiteIDEPluginAPI {
  commands: CommandsAPI;
  editor: EditorAPI;
  fs: FileSystemAPI;
  process: ProcessAPI;
  ui: UIAPI;
  events: EventBusAPI;
}

// Simple in-memory EventBus implementation for frontend
export class EventBus implements EventBusAPI {
  private map = new Map<string, Set<(...args: unknown[]) => void>>();
  on(event: string, handler: (...args: unknown[]) => void) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(handler);
  }
  off(event: string, handler: (...args: unknown[]) => void) {
    this.map.get(event)?.delete(handler);
  }
  emit(event: string, ...args: unknown[]) {
    this.map.get(event)?.forEach((h) => h(...args));
  }
}
