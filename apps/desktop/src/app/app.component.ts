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

  openFolder() {
    this.workspaceRoot = "F:\\QuantsMind\\Demo";
    this.greetingMessage.set("Workspace: " + this.workspaceRoot);
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
