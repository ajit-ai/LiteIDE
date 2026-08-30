# QuantsMind IDE (QMIDE) — Small Core, Infinite Reach

Lightweight, fast, extensible IDE — **Tauri (Rust) + Angular + Monaco + xterm.js** — runs natively on **Windows / Linux / macOS**.

> **Product Vision:** `SMALL CORE + MODULAR SERVICES + PLUGIN ARCHITECTURE + STANDARD PROTOCOLS` — first build a stable foundation for **C, C++, Java, Python** via **LSP/DAP/JSON-RPC**, then add `Go/Rust/Kotlin`, `Git`, `Docker`, `AI` without redesign.

## Stack (Primary §2)

- **Desktop:** Tauri 2 + Rust backend/core
- **Frontend:** Angular 17 + TypeScript + SCSS + Monaco Editor + xterm.js
- **Protocols:** LSP / DAP / JSON-RPC — no custom parsers for C/C++/Java/Python (reuse `clangd`, `jdtls`, `pylsp`)
- **IPC:** Tauri IPC (Angular ↔ Rust)

## Architecture (§3)

```
QuantsMind IDE
├─ UI Layer (Angular, Monaco, xterm.js) — MenuBar, ActivityBar, Sidebar (Explorer/Search/SC/Extensions), EditorArea (Tabs+Monaco), BottomPanel (Terminal/Output/Problems/Debug Console), StatusBar
├─ Application Bridge (Tauri IPC)
├─ IDE Core (Rust crates: ide-core, workspace, document, filesystem, process, platform, event-bus, command, configuration, language, lsp-client, build, debug, terminal, plugin)
└─ Platform Abstraction (Windows/Linux/macOS) — filesystem, process, shell, env, paths, executable discovery
```

**Core Rules (§4):** UI no business logic → IPC; Language independence via `LanguageProvider`; Build via `BuildProvider`; Debug via generic `DAP`; Platform isolated; Extension-first.

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
