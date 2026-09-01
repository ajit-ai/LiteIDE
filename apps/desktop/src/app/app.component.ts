import { Component, signal, HostListener } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { invoke } from "@tauri-apps/api/core";
import { MonacoEditorComponent } from "./editor/monaco-editor.component";
import { CommandPaletteComponent, Cmd } from "./command-palette/command-palette.component";
import { XtermComponent } from "./terminal/xterm.component";

interface Tab { path: string; name: string; content: string; dirty: boolean; language: string; }

@Component({
  selector: "app-root",
  imports: [RouterOutlet, MonacoEditorComponent, CommandPaletteComponent, XtermComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  greetingMessage = signal("");
  isDark = true;
  sidebarTab: "explorer" | "search" | "sc" | "ext" = "explorer";
  bottomTab: "terminal" | "output" | "problems" | "debug" = "terminal";
  tabs: Tab[] = [];
  activePath: string | null = null;
  workspaceRoot: string | null = null;
  lastBuild: string | null = null;

  shellInfo = "Terminal — xterm.js + PTY — multiple sessions";

  get activeContent() {
    return this.tabs.find((t) => t.path === this.activePath)?.content ?? "";
  }

  get activeLanguage() {
    const t = this.tabs.find((t) => t.path === this.activePath);
    if (!t) return "plaintext";
    const p = t.path.toLowerCase();
    if (p.endsWith(".c")) return "c";
    if (p.endsWith(".cpp") || p.endsWith(".cc") || p.endsWith(".hpp")) return "cpp";
    if (p.endsWith(".java")) return "java";
    if (p.endsWith(".py")) return "python";
    if (p.endsWith(".rs")) return "rust";
    if (p.endsWith(".ts") || p.endsWith(".tsx")) return "typescript";
    if (p.endsWith(".js")) return "javascript";
    return "plaintext";
  }

  constructor() {
    invoke<string>("greet", { name: "QuantsMind" }).then((t) => this.greetingMessage.set(t));
    this.loadPlugins();
  }

  async openFolder() {
    const root = prompt("Workspace root (e.g., C:\\proj):", this.workspaceRoot || "F:\\QuantsMind\\Demo");
    if (!root) return;
    try {
      const ws = await invoke<{ id: string; root: string; name: string }>("open_workspace", { path: root });
      this.workspaceRoot = ws.root;
      this.greetingMessage.set(`Workspace opened: ${ws.name} (.ide/ created)`);
      this.refreshGit();
    } catch (e) {
      this.greetingMessage.set(`Open failed: ${String(e)}`);
    }
  }

  async createFile() {
    if (!this.workspaceRoot) return this.greetingMessage.set("Open folder first");
    const name = prompt("New file (relative to workspace):", "hello.c");
    if (!name) return;
    const full = `${this.workspaceRoot}\\${name}`;
    try { await invoke("create_file", { path: full }); this.greetingMessage.set(`Created ${name}`); } catch (e) { this.greetingMessage.set(String(e)); }
  }

  async createFolder() {
    if (!this.workspaceRoot) return;
    const name = prompt("New folder:", "src");
    if (!name) return;
    try { await invoke("create_dir", { path: `${this.workspaceRoot}\\${name}` }); this.greetingMessage.set(`Folder ${name} created`); } catch (e) { this.greetingMessage.set(String(e)); }
  }

  async renameSelected() {
    if (!this.activePath) return;
    const to = prompt("Rename to:", this.activePath);
    if (!to || to === this.activePath) return;
    try { await invoke("rename_file", { from: this.activePath, to }); this.greetingMessage.set(`Renamed to ${to}`); this.activePath = to; } catch (e) { this.greetingMessage.set(String(e)); }
  }

  async deleteSelected() {
    if (!this.activePath) return;
    if (!confirm(`Delete ${this.activePath}?`)) return;
    try { await invoke("delete_path", { path: this.activePath }); this.closeTab(this.activePath); this.greetingMessage.set(`Deleted ${this.activePath}`); } catch (e) { this.greetingMessage.set(String(e)); }
  }

  openSample(name: string) {
    const content = name.endsWith(".java")
      ? 'public class Hello { public static void main(String[] a){ System.out.println("Java ok"); } }'
      : name.endsWith(".py")
        ? 'print("Python ok")'
        : name.endsWith(".c")
          ? '#include <stdio.h>\nint main(){printf("C ok\\n");}'
          : '#include <iostream>\nint main(){std::cout<<"C++ ok\\n";}';
    const lang = name.endsWith(".java") ? "java" : name.endsWith(".py") ? "python" : name.endsWith(".c") ? "c" : "cpp";
    const path = `/${name}`;
    const existing = this.tabs.find((t) => t.path === path);
    if (!existing) this.tabs.push({ path, name, content, dirty: false, language: lang });
    this.activePath = path;
  }

  async saveActive() {
    const tab = this.tabs.find((t) => t.path === this.activePath);
    if (!tab) return;
    try {
      await invoke("write_file", { path: tab.path, content: tab.content });
      tab.dirty = false;
      this.greetingMessage.set(`Saved ${tab.name}`);
    } catch (e) { this.greetingMessage.set(String(e)); }
  }

  saveAll() {
    this.tabs.forEach((t) => { if (t.dirty) this.saveActive(); });
  }

  closeTab(path: string) {
    this.tabs = this.tabs.filter((t) => t.path !== path);
    if (this.activePath === path) this.activePath = this.tabs[0]?.path ?? null;
  }

  onEdit(e: Event) {
    const v = (e.target as HTMLTextAreaElement).value;
    const t = this.tabs.find((t) => t.path === this.activePath);
    if (t) { t.content = v; t.dirty = true; }
  }

  onMonacoChange(value: string) {
    const t = this.tabs.find((t) => t.path === this.activePath);
    if (t) { t.content = value; t.dirty = true; }
  }

  showHelp() {
    this.greetingMessage.set("Help: File→Open Folder → Edit → Save Ctrl+S → Build Ctrl+B → Run Ctrl+R — docs/help.md");
  }

  async newTerminal() {
    try {
      const sess = await invoke<{ id: string; shell: { name: string; path: string } }>("create_terminal", { shell: null, cwd: this.workspaceRoot });
      this.shellInfo = `Terminal ${sess.id} — ${sess.shell.name} ${sess.shell.path}`;
      this.bottomTab = "terminal";
    } catch (e) {
      this.shellInfo = `New terminal failed: ${String(e)} — xterm.js ready`;
    }
  }

  debugStatus = "Inactive";
  breakpoints: { id: string; uri: string; line: number }[] = [];
  plugins: { plugin: { id: string; name: string; version: string } }[] = [];
  gitIsRepo = false;
  gitBranch: string | null = null;
  gitStatus: { branch: string; changed: string[]; staged: string[]; untracked: string[] } | null = null;

  async loadPlugins() {
    try { this.plugins = await invoke<{ plugin: { id: string; name: string; version: string } }[]>("list_plugins"); } catch { this.plugins = []; }
  }

  async refreshGit() {
    if (!this.workspaceRoot) return;
    try {
      this.gitIsRepo = await invoke<boolean>("git_is_repo", { path: this.workspaceRoot });
      if (this.gitIsRepo) {
        this.gitBranch = await invoke<string>("git_branch", { path: this.workspaceRoot });
        this.gitStatus = await invoke<{ branch: string; changed: string[]; staged: string[]; untracked: string[] }>("git_status", { path: this.workspaceRoot });
      }
    } catch (e) { this.greetingMessage.set(String(e)); }
  }

  async debugStart() {
    try { await invoke("debug_start", { adapter: "gdb" }); this.debugStatus = "Running (gdb)"; } catch (e) { this.debugStatus = String(e); }
  }
  async debugStop() {
    try { await invoke("debug_step_over"); this.debugStatus = "Stopped"; } catch {}
  }
  async debugStep() {
    try { await invoke("debug_step_over"); this.debugStatus = "Step Over"; } catch (e) { this.debugStatus = String(e); }
  }
  async addBreakpoint() {
    if (!this.activePath) return;
    try {
      const bp = await invoke<{ id: string; uri: string; line: number }>("debug_add_breakpoint", { uri: this.activePath, line: 1 });
      this.breakpoints.push(bp);
      this.debugStatus = `Breakpoint ${bp.uri}:${bp.line}`;
    } catch (e) { this.debugStatus = String(e); }
  }

  paletteOpen = false;
  commands: Cmd[] = [];

  async ngOnInitPalette() {
    try { this.commands = await invoke<Cmd[]>("list_commands"); } catch {}
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      this.ngOnInitPalette();
      this.paletteOpen = true;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      this.saveActive();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      this.openFolder();
    }
  }

  async execCommand(id: string) {
    try {
      const res = await invoke<string>("execute_command", { id });
      this.greetingMessage.set(res);
      // also emit typed event for demo
      if (id === "file.save") this.saveActive();
      if (id === "workspace.open") this.openFolder();
    } catch (e) { this.greetingMessage.set(String(e)); }
  }
}
