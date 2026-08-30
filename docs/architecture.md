# LiteIDE — Lightweight Cross-Platform IDE Architecture

---

## 1. Project Overview

**Name:** LiteIDE  
**Goal:** A small, fast, extensible IDE supporting C, C++, Java, and Python — designed to run natively on Windows, Linux, and macOS, with a plugin-based architecture so new languages and features can be added later without touching the core.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LiteIDE Application                     │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │   UI Layer   │   │  Core Engine │   │  Plugin System   │   │
│  │  (Renderer)  │◄──►│  (Business   │◄──►│  (Extension Bus) │   │
│  │              │   │   Logic)     │   │                  │   │
│  └──────────────┘   └──────────────┘   └──────────────────┘   │
│          │                  │                    │              │
│          ▼                  ▼                    ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Platform Abstraction Layer (PAL)        │  │
│  │          Windows │ Linux │ macOS (via OS APIs)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer-by-Layer Breakdown

### 3.1 UI Layer

**Technology:** Electron (Node.js + Chromium) or Tauri (Rust + WebView)  
> **Recommendation:** Tauri — much smaller binary (~10 MB vs ~150 MB for Electron), uses native OS WebView, better memory profile for a "lite" IDE.

```
UI Layer
├── Editor Area
│   ├── Monaco Editor (VS Code's editor component, embedded via WebView)
│   ├── Tab Manager
│   └── Split Pane Support
├── Sidebar
│   ├── File Explorer
│   ├── Search Panel
│   └── Plugin Panels (extensible slots)
├── Bottom Panel
│   ├── Terminal (embedded shell)
│   ├── Output / Build Log
│   └── Problems / Diagnostics
├── Menu Bar (native OS menus via Tauri APIs)
├── Status Bar
└── Command Palette (Ctrl+Shift+P style)
```

### 3.2 Core Engine

The heart of LiteIDE — stateless, platform-neutral business logic.

```
Core Engine
├── File System Manager
│   ├── Open / Save / Watch (cross-platform via Rust std::fs)
│   └── Recent Files & Projects
├── Editor State Manager
│   ├── Buffer management
│   ├── Undo/Redo stack
│   └── Cursor & Selection state
├── Language Server Client (LSP)
│   ├── Generic LSP protocol handler
│   └── Per-language server spawner
├── Build & Run Manager
│   ├── Task runner (compile, run, debug)
│   └── Process manager (spawn/kill)
├── Plugin Manager
│   ├── Plugin loader / lifecycle
│   ├── Event Bus (pub/sub)
│   └── Plugin API surface
└── Configuration Manager
    ├── Global settings (JSON/TOML)
    └── Per-project settings (.liteidrc)
```

### 3.3 Plugin System

Every language (and future feature) is a **Plugin**. Plugins communicate only through the Event Bus — they never call each other directly.

```
Plugin Interface
├── Metadata        { id, name, version, languages[] }
├── Lifecycle       { activate(), deactivate() }
├── Contributions   { commands[], menus[], keybindings[], panels[] }
└── API access      { vscode-like API via Plugin API surface }

Built-in Plugins (shipped with LiteIDE)
├── lang-c-cpp      → clangd LSP, gcc/g++/clang build, gdb/lldb debug
├── lang-java       → Eclipse JDT LS, javac/javap, JVM launcher
├── lang-python     → Pylsp / Pyright LSP, python3 runner, pip helper
└── terminal        → OS shell integration

Future Plugin Examples
├── lang-go         → gopls LSP
├── lang-rust       → rust-analyzer LSP
├── git-integration → libgit2 bindings
├── docker-runner   → container-based builds
└── ai-assistant    → LLM code completion
```

### 3.4 Platform Abstraction Layer (PAL)

Thin Rust layer that wraps OS-specific calls so the Core Engine stays clean.

| Concern | Windows | Linux | macOS |
|---|---|---|---|
| File paths | `\`, drive letters | `/` | `/` |
| Shell | `cmd.exe` / PowerShell | bash/zsh | zsh |
| Process spawn | `CreateProcess` | `fork+exec` | `fork+exec` |
| File watcher | ReadDirectoryChangesW | inotify | FSEvents |
| Native menus | Win32 | GTK (via Tauri) | NSMenu |
| Font rendering | DirectWrite | FreeType | CoreText |

---

## 4. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| Desktop shell | **Tauri (Rust)** | Small, fast, native, cross-platform |
| Editor widget | **Monaco Editor** | Battle-tested, LSP-ready, feature-rich |
| Core logic | **Rust** | Memory safe, fast, great cross-platform std |
| Plugin runtime | **JavaScript/TypeScript** (WebView) | Familiar, sandboxed, easy to write plugins |
| Language servers | **LSP-compliant servers** | Clangd, JDT-LS, Pylsp (separate processes) |
| Build configs | **TOML** | Simple, human-readable |
| IPC | **Tauri Commands + Events** | Rust ↔ WebView bridge |

---

## 5. Data Flow — Open File & Edit

```
User opens file.c
        │
        ▼
  File Explorer (UI)
  emits: "openFile" event
        │
        ▼
  Core: File System Manager
  reads file → sends content to Editor State Manager
        │
        ▼
  Editor Area (Monaco)
  displays content, sets language mode = "c"
        │
        ▼
  Plugin Manager detects language = "c"
  activates lang-c-cpp plugin (if not already active)
        │
        ▼
  lang-c-cpp spawns clangd LSP server
  (one per workspace, reused)
        │
        ▼
  Monaco ↔ clangd talk LSP protocol
  → Diagnostics, completions, hover, go-to-def all work
```

---

## 6. Data Flow — Build & Run

```
User presses Ctrl+F5
        │
        ▼
  Command Palette / Menu
  fires: "build-and-run" command
        │
        ▼
  Build & Run Manager
  asks active language plugin for build task
        │
  lang-c-cpp returns:
  { cmd: "gcc", args: ["-o", "out", "file.c"] }
        │
        ▼
  Build & Run Manager spawns process
  streams stdout/stderr → Output Panel (UI)
        │
        ▼
  On success: spawns compiled binary
  streams output → Terminal Panel (UI)
```

---

## 7. Directory Structure (Repository Layout)

```
liteside/
├── src-tauri/               ← Rust (Core Engine + PAL)
│   ├── src/
│   │   ├── main.rs
│   │   ├── core/
│   │   │   ├── file_manager.rs
│   │   │   ├── build_runner.rs
│   │   │   ├── lsp_client.rs
│   │   │   └── plugin_manager.rs
│   │   └── pal/
│   │       ├── windows.rs
│   │       ├── linux.rs
│   │       └── macos.rs
│   └── Cargo.toml
│
├── src/                     ← TypeScript/React (UI Layer)
│   ├── App.tsx
│   ├── components/
│   │   ├── Editor/
│   │   ├── Sidebar/
│   │   ├── Terminal/
│   │   ├── OutputPanel/
│   │   └── StatusBar/
│   ├── store/               ← Zustand or Redux state
│   └── plugins/             ← Built-in plugin JS side
│       ├── lang-c-cpp/
│       ├── lang-java/
│       └── lang-python/
│
├── plugins/                 ← External plugin packages
│   └── example-plugin/
│       ├── plugin.json      ← Metadata
│       └── index.js         ← Entry point
│
├── docs/
│   ├── architecture.md
│   └── plugin-api.md
│
└── .liteidrc.example        ← Default project config
```

---

## 8. Plugin API Contract

Every plugin gets a sandboxed API object:

```typescript
interface LiteIDEPluginAPI {
  // Commands
  commands.register(id: string, handler: () => void): void;
  commands.execute(id: string, ...args: any[]): Promise<any>;

  // Editor
  editor.getActiveFile(): FileInfo | null;
  editor.insertText(text: string): void;
  editor.getSelection(): Selection;

  // File System
  fs.readFile(path: string): Promise<string>;
  fs.writeFile(path: string, content: string): Promise<void>;
  fs.watchDirectory(path: string, callback: WatchCallback): Disposable;

  // Terminal / Processes
  process.spawn(cmd: string, args: string[], opts: SpawnOpts): Process;

  // UI Contributions
  ui.registerPanel(id: string, component: PanelComponent): void;
  ui.showNotification(msg: string, level: 'info'|'warn'|'error'): void;

  // Events
  events.on(event: string, handler: (...args:any[]) => void): Disposable;
  events.emit(event: string, ...args: any[]): void;
}
```

---

## 9. Cross-Platform Build & Distribution

```
CI/CD Pipeline (GitHub Actions)
│
├── build-windows  → NSIS installer (.exe)  /  Portable .zip
├── build-linux    → AppImage + .deb + .rpm
└── build-macos    → .dmg (universal: x86_64 + arm64 Apple Silicon)

Tauri handles:
  - Code signing (Windows: Authenticode, macOS: notarization)
  - Auto-updater (Tauri's built-in updater)
  - Single binary output per platform
```

---

## 10. Extensibility Roadmap

| Phase | What gets added | How |
|---|---|---|
| **Now** | C, C++, Java, Python | Built-in plugins, LSP |
| **Phase 2** | Go, Rust, TypeScript | New plugin packages |
| **Phase 2** | Git integration | Plugin using libgit2 |
| **Phase 3** | Remote SSH editing | Plugin with SSH client |
| **Phase 3** | Docker-based builds | Plugin spawning containers |
| **Phase 4** | AI code completion | Plugin calling LLM API |
| **Phase 4** | Collaborative editing | Plugin using CRDTs/WebRTC |

> All phases require **zero changes to the core engine** — only new plugins.

---

## 11. Key Design Decisions & Rationale

| Decision | Alternative | Why this wins |
|---|---|---|
| Tauri over Electron | Electron | 10x smaller binary, native WebView, Rust safety |
| LSP for all languages | Custom parsers | Standard protocol, reuse existing servers |
| Plugin Event Bus | Direct plugin calls | Decoupled, testable, safe sandboxing |
| Monaco over CodeMirror | CodeMirror | Full-featured, VS Code-proven, LSP adapters exist |
| Rust core over Node.js | Node.js backend | Performance, memory safety, no GC pauses |
| TOML config over XML/JSON | JSON | More human-friendly for developer tooling |
