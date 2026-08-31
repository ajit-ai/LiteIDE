import { Component, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { invoke } from "@tauri-apps/api/core";

interface Tab { path: string; name: string; content: string; }

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
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

  get activeContent() {
    return this.tabs.find((t) => t.path === this.activePath)?.content ?? "";
  }

  constructor() {
    invoke<string>("greet", { name: "QuantsMind" }).then((t) => this.greetingMessage.set(t));
  }

  async openFolder() {
    const root = prompt("Workspace root (e.g., C:\\proj):", this.workspaceRoot || "F:\\QuantsMind\\Demo");
    if (!root) return;
    try {
      const ws = await invoke<{ id: string; root: string; name: string }>("open_workspace", { path: root });
      this.workspaceRoot = ws.root;
      this.greetingMessage.set(`Workspace opened: ${ws.name} (.ide/ created)`);
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
    const path = `/${name}`;
    const existing = this.tabs.find((t) => t.path === path);
    if (!existing) this.tabs.push({ path, name, content });
    this.activePath = path;
  }

  closeTab(path: string) {
    this.tabs = this.tabs.filter((t) => t.path !== path);
    if (this.activePath === path) this.activePath = this.tabs[0]?.path ?? null;
  }

  onEdit(e: Event) {
    const v = (e.target as HTMLTextAreaElement).value;
    const t = this.tabs.find((t) => t.path === this.activePath);
    if (t) t.content = v;
  }

  showHelp() {
    this.greetingMessage.set("Help: File→Open Folder → Edit → Save Ctrl+S → Build Ctrl+B → Run Ctrl+R — docs/help.md");
  }
}
