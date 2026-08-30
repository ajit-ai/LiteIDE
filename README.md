# QuantsMind IDE (QMIDE) — Small Core, Infinite Reach

Lightweight, fast, extensible IDE — **Tauri (Rust) + Angular + Monaco + xterm.js** — runs natively on **Windows / Linux / macOS**.

> **Product Vision:** `SMALL CORE + MODULAR SERVICES + PLUGIN ARCHITECTURE + STANDARD PROTOCOLS` — first build a stable foundation for **C, C++, Java, Python** via **LSP/DAP/JSON-RPC**, then add `Go/Rust/Kotlin`, `Git`, `Docker`, `AI` without redesign.

## Stack (Primary §2)

- **Desktop:** Tauri 2 + Rust backend/core
- **Frontend:** Angular 17 + TypeScript + SCSS + Monaco Editor + xterm.js
- **Protocols:** LSP / DAP / JSON-RPC — no custom parsers for C/C++/Java/Python (reuse `clangd`, `jdtls`, `pylsp`)
- **IPC:** Tauri IPC (Angular ↔ Rust)

## Architecture (§3) — Full Design

```
┌──────────────────────────────────────────────────────┐
│                    QUANTSMIND IDE                    │
├──────────────────────────────────────────────────────┤
│                      UI LAYER                        │
│ Angular + Monaco + xterm.js                          │
│ MenuBar, ActivityBar, Sidebar, EditorArea,           │
│ BottomPanel (Terminal/Output/Problems/Debug),        │
│ StatusBar                                            │
├──────────────────────────────────────────────────────┤
│                   APPLICATION BRIDGE                 │
│ Tauri IPC (Angular ↔ Rust)                           │
├──────────────────────────────────────────────────────┤
│                      IDE CORE                        │
│ workspace, document, filesystem, process, platform,  │
│ event-bus, command, configuration, language,         │
│ lsp-client, build, debug, terminal, plugin           │
├──────────────────────────────────────────────────────┤
│                PLATFORM ABSTRACTION                  │
│ Windows (CreateProcess, ReadDirectoryChangesW,       │
│  DirectWrite) | Linux (fork+exec, inotify, FreeType) │
│  | macOS (fork+exec, FSEvents, CoreText)             │
└──────────────────────────────────────────────────────┘
```

**Core Rules (§4):** UI no business logic → IPC; Language independence `LanguageProvider` (no hard `C`/Java); Build via `BuildProvider` `detect_project/configure/build/clean/run` (CMake/Make/Java/Python); Debug via generic `DAP` (not GDB/LLDB direct); Platform isolated (`filesystem/process/shell/env/paths/executable_discovery`); Extension-first (manifest `plugin.toml` [capabilities] `languages/build/debug`).

**UI Layer (§7):**
```
AppShell
├── MenuBar (native Tauri)
├── ActivityBar
├── Sidebar (Explorer, Search, Source Control, Extensions)
├── EditorArea (EditorTabs + Monaco)
├── BottomPanel (Terminal xterm.js + Output + Problems + Debug Console)
└── StatusBar
```
Dark first, minimal, responsive.

**Core Engine (§5):** 15 crates — `ide-core` (facade), `workspace` (id/root/config/openDocuments/build/launch), `document` (id/uri/language/content/version/dirty/encoding, multi-tab), `filesystem` (open/save/watch), `process` (spawn/kill/stdout/stderr/env/cwd), `platform` (fs/process/shell/env/paths), `event-bus` (typed `WorkspaceOpened`/`FileSaved`/`BuildStarted`/`DebugStopped`/`LanguageServerStarted`), `command` (`workspace.open`/`file.save`/`build.run`/`debug.start`), `configuration` (global TOML + per-project `.ide/`), `language` (`LanguageProvider` `language_id/file_extensions/detect_project/start_server`), `lsp-client` (generic JSON-RPC `LanguageService→LspClient→LSP Process`), `build` (`BuildService→BuildProvider→BuildTask`), `debug` (`Debug UI→DebugService→DAP Client→Debug Adapter`), `terminal` (`TerminalService→PTYManager→ShellDetector` PowerShell/cmd/bash/zsh), `plugin` (`PluginManager→Registry/Loader/Lifecycle/Permission`).

**Plugin System (§21):** `LanguagePlugin/BuildPlugin/DebugPlugin/ThemePlugin` via `PluginAPI`:
```ts
interface LiteIDEPluginAPI {
  commands.register(id, handler); commands.execute(id);
  editor.getActiveFile(); editor.insertText();
  fs.readFile/writeFile/watchDirectory;
  process.spawn(cmd, args, opts);
  ui.registerPanel(id, component); ui.showNotification(msg, level);
  events.on(event, handler); events.emit(event);
}
```
Built-in: `language-c/cpp→clangd`, `language-java→jdtls`, `language-python→pylsp`, `terminal`; Future: `lang-go→gopls`, `lang-rust→rust-analyzer`, `git→libgit2`, `docker`, `ai-assistant` — zero core change.

**PAL (§20):** `PlatformService → filesystem()/process()/shell()/environment()/paths()/executable_discovery()` — Windows `CreateProcess`/`ReadDirectoryChangesW`/`DirectWrite`, Linux `inotify`/`FreeType`, macOS `FSEvents`/`CoreText`.

**Data Flows:**
- *Open File:* `File Explorer → openFile event → File System → Editor State → Monaco (language=c) → PluginManager → lang-c-cpp spawns clangd → LSP diagnostics/completions*
- *Build & Run:* `Ctrl+F5 → build-and-run → Build & Run Manager → ask LanguageProvider → {cmd:"gcc",args:["-o","out","file.c"]} → spawn → stdout/stderr → Output → Terminal`

## Repository Structure (§6)

```
quantsmind-ide/
├── apps/desktop/          # Angular + Tauri (src/ + src-tauri/)
├── crates/                # 15 Rust crates (ide-core, workspace, document, filesystem, process, platform, event-bus, command, configuration, language, lsp-client, build, debug, terminal, plugin)
├── plugins/               # language-c, language-cpp, language-java, language-python
├── packages/              # ui, editor, shared (Angular libs)
├── docs/                  # architecture/, development/, decisions/ (ADRs)
├── tests/                 # unit + integration + cross-platform
├── Cargo.toml             # workspace
└── README.md
```

## Workspace (§8)

Hidden `.ide/` per project:
```
.ide/
├── workspace.toml
├── settings.toml
├── tasks.toml
└── launch.toml
```
TOML — `Workspace {id, root, config, openDocuments, build, launch, extension}`.

## How to Run (Phase 0)

```powershell
# Prerequisites: Rust 1.77+, Node 20+, pnpm 9+, Angular CLI
git clone https://github.com/ajit-ai/LiteIDE.git  # will be quantsmind-ide
cd LiteIDE

# 1. Rust workspace
cargo test --workspace          # 15 crates × test_init
cargo check --workspace

# 2. Desktop (Angular + Tauri)
cd apps/desktop
pnpm install
pnpm dev        # Vite Angular dev
pnpm tauri dev  # Tauri desktop (http://localhost:1420)
pnpm build      # tsc + vite build
pnpm tauri build # → NSIS .exe + MSI, AppImage/.deb/.rpm, .dmg

# 3. Docs
pnpm exec tsc --noEmit
```

## Implementation Phases (§28)

**Phase 0** Architecture Foundation — repo, Cargo/Angular workspace, Tauri, ADRs, CI — **current**
**Phase 1** IDE Shell — Menu, ActivityBar, Sidebar, EditorArea, BottomPanel, StatusBar
**Phase 2** Workspace & Filesystem — open folder, explorer, create/rename/delete, watcher, `.ide/`
**Phase 3** Editor — Monaco open/edit/save tabs dirty highlighting
**Phase 4** Command & Event — registry `workspace.open`, `file.save`, `build.run`, typed `FileOpened`/`BuildStarted`
**Phase 5** Terminal — xterm.js + PTY, `ShellDetector` PowerShell/cmd/bash/zsh
**Phase 6** Process & Toolchain — `ToolchainManager` GCC/Clang/MSVC, JDK, Python venv
**Phase 7** Build — `BuildService` `BuildProvider` `CMake/Make/Java/PythonProvider` `detect_project/configure/build/clean/run`
**Phase 8** Language — `LanguageProvider` + `LspClient` generic `clangd`/`jdtls`/`pylsp` Diagnostics/Completion/Hover/Go-to-def
**Phase 9** Debug — `DAP` client `DebugService` Breakpoints/Step/Variables/Call Stack
**Phase 10** Plugin — manifest `plugin.toml`, `PluginManager` `Registry/Loader/Lifecycle/Permission`
**Phase 11** Source Control — `git` detection branch/changed files

MVP (§29): open folder, browse/create/edit/save, multi-tab, highlight, C/C++ build/run, Python run, Java compile/run, terminal, core independent + abstractions.

## Docs

- `docs/architecture/overview.md` — system, modules, IPC, cross-platform, language/build/debug/plugin
- `docs/decisions/ADR-001-technology-stack.md` … `ADR-004-plugin-architecture.md`
- `docs/development/setup.md` — prerequisites, build, test

## Future (§30)

`Karkain`, `Rust`, `Go`, `Kotlin`, `AI Assistant`, `Remote SSH`, `Docker`, `Collaborative` — all via new plugins, zero core redesign.

## Principles (§31)

Simple before complex, modular before monolithic, stable interfaces before features, reuse standards (LSP/DAP), small MVP, cross-platform, security by default, testable, documented.

---

**Next:** `Phase 0` → `cargo test --workspace` `pnpm tauri dev` → `Phase 1` IDE Shell.
