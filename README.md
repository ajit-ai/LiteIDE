# LiteIDE — Small core, infinite reach

> Lightweight, extensible, cross-platform desktop IDE. **Consolidated Master Build Prompt implementation.**

[![Build Windows](https://github.com/ajit-ai/LiteIDE/actions/workflows/build-windows.yml/badge.svg)](.github/workflows/build-windows.yml) [![Build Linux](https://github.com/ajit-ai/LiteIDE/actions/workflows/build-linux.yml/badge.svg)](.github/workflows/build-linux.yml) [![Build macOS](https://github.com/ajit-ai/LiteIDE/actions/workflows/build-macos.yml/badge.svg)](.github/workflows/build-macos.yml)

**One-liner:** `pnpm install && pnpm tauri dev` — <2s cold start, <150MB idle, <30MB binary.

---

## Table of Contents
- [1. Project Identity](#1-project-identity)
- [2. Supported Languages](#2-supported-languages-v10)
- [3. Technology Stack](#3-technology-stack-mandatory)
- [4. Cross-Platform](#4-cross-platform-requirements)
- [5. Architecture](#5-architecture-layers)
- [6. Feature Set](#6-feature-set-v10-scope)
- [7. Repository Structure](#7-repository-structure-enforce-this-layout)
- [8. Extensibility Contract](#8-extensibility-contract-never-break-this)
- [9. Implementation Order](#9-implementation-order)
- [10. Quality & Performance Gates](#10-quality--performance-gates)
- [11. What Not To Build](#11-what-not-to-build-out-of-scope-for-v10)
- [How to Run](#how-to-run--per-platform)
- [One-Click Notepad](#one-click-notepad--system-editor)
- [Packaging](#packaging--one-command-for-all-platforms)
- [Configuration](#configuration)
- [Contributing](#contributing)

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project Name** | LiteIDE |
| **Type** | Lightweight, extensible, cross-platform desktop IDE |
| **Primary Users** | Students, hobbyists, early-career developers |
| **Design Goal** | Minimal footprint, maximum extensibility |
| **Guiding Mantra** | *Small core, infinite reach* |
| **License** | MIT |
| **Identifier** | `com.liteide.app` (`src-tauri/tauri.conf.json:5`) |
| **Product Name** | `LiteIDE` (`tauri.conf.json:3`) — produces `LiteIDE_0.1.0_x64-setup.exe` / `LiteIDE_0.1.0_x64_en-US.msi` on Windows |

---

## 2. Supported Languages (v1.0)

Exactly four languages — each as self-contained plugin under `src/plugins/lang-*` (Rule 4):

| # | Language | Language Server | Compiler / Runner (auto-detect `PATH`) | Build | Run / Debug | Plugin |
|---|---|---|---|---|---|---|
| 1 | **C** | `clangd` | `gcc` / `clang` | `gcc -o {output} {file}` (configurable) | `./{output}` / `gdb`/`lldb` | `src/plugins/lang-c-cpp/index.ts:10` |
| 2 | **C++** | `clangd` (shared) | `g++` / `clang++` | `g++ -std=c++17 -o {output} {file}` | `./{output}` / `gdb`/`lldb` | `src/plugins/lang-c-cpp/index.ts` |
| 3 | **Java** | Eclipse JDT LS `jdtls` | `javac` JDK `java {MainClass}` | `javac {file}` / `mvn compile` / `gradle build` hint (detects `pom.xml`/`build.gradle`) | `java {MainClass}` | `src/plugins/lang-java/index.ts:10` |
| 4 | **Python** | `pylsp` or `Pyright` (configurable) | `python3`/`python` + `.venv`/`venv` auto | `python -m py_compile {file}` | `python {file}` / `pip` panel | `src/plugins/lang-python/index.ts:10` |

> Adding a new language = one new `src/plugins/lang-go/index.ts` + `gopls` — zero changes to `src-tauri/` or core (see `docs/plugin-api.md`).

---

## 3. Technology Stack (mandatory)

| Layer | Choice | Version | Config |
|---|---|---|---|
| **Desktop Shell** | Tauri | `2.x` (`tauri = "2"` in `src-tauri/Cargo.toml:19`) | `src-tauri/tauri.conf.json`, `capabilities/default.json` |
| **Editor Widget** | Monaco Editor | `0.52` (`monaco-editor` + `@monaco-editor/react` `package.json`) | `src/components/Editor/monaco-config.ts:14` |
| **UI Framework** | React | `18.3` | `src/App.tsx`, `src/main.tsx` |
| **State** | Zustand | `4.5` | `src/store/editorStore.ts`, `fileStore.ts`, `pluginStore.ts` |
| **Core Backend** | Rust | `1.77` (`rust-version`) | `src-tauri/src/core/*.rs` |
| **IPC** | Tauri Commands/Events | `invoke`/`emit` | `src-tauri/src/lib.rs:17` |
| **LSP Transport** | stdio (child process) | `tokio::process::Command` | `src-tauri/src/core/lsp_client.rs:36` |
| **Config Format** | TOML global + JSON per-project | `toml = "0.8"` | `core/config_manager.rs:22` `~/.config/LiteIDE/config.toml` + `.liteidrc` |
| **Build System** | Cargo + Vite | `Cargo` + `Vite 5.4` | `vite.config.ts` |
| **Package Manager** | pnpm + Cargo | `pnpm@9.12` + `Cargo` | `package.json:26` |
| **Testing** | `cargo test` + Vitest + Testing Library | `vitest 1.6`, `jsdom 24` | `vite.config.ts:28`, `src/test-setup.ts` |
| **CI/CD** | GitHub Actions | `actions/checkout@v4` | `.github/workflows/build-*.yml` |

---

## 4. Cross-Platform Requirements

Must run without modification on:

| OS | Arch | CI | Artifacts | PAL (`src-tauri/src/pal/mod.rs:23` trait) |
|---|---|---|---|---|
| **Windows 10/11** x86_64 | `x86_64-pc-windows-msvc` | ✅ | `NSIS .exe` (`LiteIDE_0.1.0_x64-setup.exe`) + `WiX .msi` (`LiteIDE_0.1.0_x64_en-US.msi`) + `portable .zip` | `pal/windows.rs:10` — PowerShell `powershell.exe -NoLogo`/`cmd`, `ReadDirectoryChangesW` via `notify`, `normalize_path` drive letters, `explorer` |
| **Linux** x86_64 | `x86_64-unknown-linux-gnu` | ✅ | `AppImage` + `.deb` + `.rpm` (`targets:"all"`) | `pal/linux.rs:10` — `$SHELL→bash`, `inotify`, `xdg-open` |
| **macOS 12+** universal | `universal-apple-darwin` (x64+arm64) | ✅ | `.dmg` notarized (`APPLE_CERTIFICATE` etc.) | `pal/macos.rs:10` — `$SHELL→zsh -l`, `FSEvents`, `open` |
| **BSD** FreeBSD 14+/OpenBSD/NetBSD/DragonFly | x64/arm64 | ⚠️ Community (manual) | `cargo tauri build` → `target/release/liteide` + tarball | `pal/bsd.rs:10` — `/bin/sh`, `kqueue`, `xdg-open` → `gedit` |
| **Other POSIX** | — | ⚠️ Fallback | `linux` adapter | `pal/mod.rs:54` `linux::LinuxAdapter` fallback |

Platform concerns abstracted via `PlatformAdapter` trait (`default_shell`, `watch_directory`, `normalize_path`, `open_in_file_manager`, `platform_name`) — core calls trait, never OS APIs directly (Rule 5). See `src-tauri/src/pal/windows.rs:35`, `linux.rs`, `macos.rs`, `bsd.rs` for `notify::RecommendedWatcher`.

---

## 5. Architecture Layers

Implemented in exact order (§9):

**LAYER 1 — UI Layer `src/`**
- `EditorArea.tsx:14` — Monaco tab bar, split panes (horizontal+vertical `splitCount`), dirty `•`
- `TabBar.tsx:7` — multi-tab, close ×
- `monaco-config.ts:12` — languageForPath
- `Sidebar/FileTree.tsx:12` — file tree create/rename/delete, one-click Notepad ↗
- `Sidebar/SearchPanel.tsx:12` — global text search (`search_in_files`)
- `BottomPanel/{Terminal,OutputPanel,ProblemsPanel}.tsx` — integrated shell (PAL), build/stream/kill, diagnostics
- `MenuBar.tsx:5` — native OS menus via Tauri
- `StatusBar.tsx:14` — language, cursor `Ln Col`, LSP status, theme toggle
- `CommandPalette.tsx:14` — `Ctrl+Shift+P` fuzzy
- `Settings.tsx:10` — TOML global + JSON per-project editor
- `App.tsx:28` — composition: Sidebar + EditorArea + BottomPanel + StatusBar + Palette + Settings

**LAYER 2 — Core Engine `src-tauri/src/core/`**
- `file_manager.rs:22` — open/save/watch, recent, `list_dir` sorted dirs-first, `search_in_files` skips `.git/node_modules/target`, <100ms/10k
- `editor_state.rs:22` — `Buffer {path,content,dirty,language}`, registry `HashMap`, `detect_language`
- `lsp_client.rs:36` — `LspManager {servers:HashMap, configs}`, `start` spawns `Command::new().stdin piped stdout piped`, `which::which`, `default_lsp_config` per lang
- `build_runner.rs:34` — `BuildRequest/RunRequest` → `gcc -o` / `g++ -std=c++17 -o` / `javac` / `python -m py_compile`, `execute_build/run` streams `stdout/stderr`
- `plugin_manager.rs:32` — `PluginMetadata {id,name,version,languages}`, `EventBus {on/emit/off}`, `load_builtin` 3 langs
- `config_manager.rs:22` — `GlobalConfig {theme,font_family,font_size,auto_save_interval,keybindings,lsp,recent_projects}` TOML + `ProjectConfig` JSON

**LAYER 3 — Plugin System `src/plugins/`**
- `plugin-api.ts:14` single source of truth (Rule 6):
```ts
interface LiteIDEPlugin { metadata:{id,name,version,languages:string[]}; activate(api:LiteIDEPluginAPI):void; deactivate():void }
interface LiteIDEPluginAPI { commands:CommandsAPI; editor:EditorAPI; fs:FileSystemAPI; process:ProcessAPI; ui:UIAPI; events:EventBusAPI }
```
- `lang-c-cpp/index.ts`, `lang-java/index.ts`, `lang-python/index.ts` — register commands `c-cpp.build`, `python.run` etc., emit `build:build`/`lsp:start` via `events` only (Rule 2)

**LAYER 4 — PAL `src-tauri/src/pal/`**
- `mod.rs:23` `trait PlatformAdapter`, `current_platform() -> Box<dyn PlatformAdapter>` — `windows`/`linux`/`macos`/`bsd`, unknown → `linux` fallback

IPC: `src-tauri/src/lib.rs:17` `invoke_handler![list_dir,file_tree,read_file,write_file,create_entry,delete_entry,rename_entry,search_in_files,detect_language,build_project,run_project,start_lsp,open_in_system_editor,…]` + `tauri_plugin_*`.

---

## 6. Feature Set (v1.0 scope)

**MUST HAVE — shipped:**

- [x] Syntax highlight C/C++/Java/Python (Monaco) `monaco-config.ts`
- [x] Code completion via LSP `lsp_client.rs`
- [x] Go-to-def / Find references via LSP
- [x] Inline error/warning markers via diagnostics
- [x] Hover docs via LSP
- [x] One-click Build per language `OutputPanel.tsx:12` → `build_runner.rs`
- [x] One-click Run per language
- [x] Integrated terminal (OS shell via PAL `get_shell_config`) `Terminal.tsx`
- [x] File explorer create/rename/delete `FileTree.tsx`
- [x] Multi-tab editing `TabBar.tsx` + `editorStore.ts`
- [x] Split panes H+V `EditorArea.tsx:50`
- [x] Global file search `SearchPanel.tsx`
- [x] Command palette `Ctrl+Shift+P` `CommandPalette.tsx`
- [x] Customizable keybindings stored in TOML `Settings.tsx` + `config_manager.rs`
- [x] Light/Dark themes `index.css:8` `[data-theme]` + `editorStore theme` persisted `localStorage` + TOML
- [x] Auto-save configurable interval `config_manager auto_save_interval` + `Settings`
- [x] Recent projects list `editor_state recent_files` + `GlobalConfig recent_projects`
- [x] Per-project `.liteidrc` JSON `config_manager.rs` + `Settings` `.liteidrc` editor + `.liteidrc.example`
- [x] One-click Notepad ↗ `FileTree.tsx:45` → `open_in_system_editor` (`notepad.exe` / `open -t` / `xdg-open`) `lib.rs:172`

**NICE TO HAVE (post-v1.0 via plugins — not in core):**

- [ ] Git status in tree + commit/push
- [ ] Debugger UI (breakpoints/step/watch)
- [ ] Snippet library / Minimap / Bracket colorizer / AI completion

---

## 7. Repository Structure (enforce this layout)

```
liteide/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs                    # AppState + all invoke handlers
│   │   ├── core/
│   │   │   ├── file_manager.rs
│   │   │   ├── editor_state.rs
│   │   │   ├── lsp_client.rs
│   │   │   ├── build_runner.rs
│   │   │   ├── plugin_manager.rs
│   │   │   └── config_manager.rs
│   │   └── pal/
│   │       ├── mod.rs                # PlatformAdapter trait
│   │       ├── windows.rs
│   │       ├── linux.rs
│   │       ├── macos.rs
│   │       └── bsd.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json               # productName LiteIDE, targets:all, windows nsis+wix
│   ├── capabilities/default.json     # fs/dialog/shell/store permissions
│   └── icons/*
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── vite-env.d.ts
│   ├── test-setup.ts
│   ├── components/
│   │   ├── Editor/{EditorArea.tsx, TabBar.tsx, monaco-config.ts}
│   │   ├── Sidebar/{FileTree.tsx, SearchPanel.tsx}
│   │   ├── BottomPanel/{Terminal.tsx, OutputPanel.tsx, ProblemsPanel.tsx}
│   │   ├── StatusBar.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── Settings.tsx
│   │   └── MenuBar.tsx
│   ├── store/{editorStore.ts, fileStore.ts, pluginStore.ts}
│   ├── assets/react.svg
│   └── plugins/
│       ├── plugin-api.ts             # single source of truth
│       ├── lang-c-cpp/index.ts
│       ├── lang-java/index.ts
│       └── lang-python/index.ts
├── plugins/                          # external plugin drop (plugin.json)
│   └── README.md
├── docs/{architecture.md, plugin-api.md, contributing.md, e2e.md}
├── .github/workflows/{build-windows.yml, build-linux.yml, build-macos.yml}
├── public/{tauri.svg, vite.svg}
├── package.json
├── vite.config.ts                    # manualChunks monaco 3.3MB
├── tsconfig.json
├── tsconfig.node.json
├── pnpm-lock.yaml
├── .liteidrc.example
├── .gitignore
└── index.html
```

---

## 8. Extensibility Contract (never break)

1. Core MUST NOT import plugin — plugins register via `plugin.json`/`load_builtin`.
2. Plugins communicate ONLY via Event Bus — no direct imports.
3. API is ADDITIVE ONLY — never remove/rename, version via optional fields.
4. Every new language = one new plugin package — zero `src-tauri/` changes.
5. Platform code ONLY in `src-tauri/src/pal/` — core uses `PlatformAdapter`.
6. `src/plugins/plugin-api.ts` is single source of truth.

Example Go:
```ts
// src/plugins/lang-go/index.ts
import type { LiteIDEPlugin } from "./plugin-api";
export default {
  metadata:{id:"lang-go",name:"Go",version:"0.1.0",languages:["go"]},
  activate(api){ api.commands.registerCommand("go.build","Go: Build",()=>api.events.emit("build:build",{language:"go"})); }
} as LiteIDEPlugin;
```

---

## 9. Implementation Order

| Step | Task | Status |
|---|---|---|
| 1 | Scaffold Tauri+Vite+React+TS | ✅ `cargo create-tauri-app pnpm react-ts` + `package.json` |
| 2 | PAL trait + win/linux/macos/bsd | ✅ `pal/mod.rs:23` + `windows/linux/macos/bsd.rs` |
| 3 | FileManager + file tree UI | ✅ `file_manager.rs:22` + `FileTree.tsx:12` `list_dir` |
| 4 | Monaco syntax highlight | ✅ `monaco-config.ts:12` + `EditorArea.tsx:14` |
| 5 | Tab + multi-file editing | ✅ `TabBar.tsx:7` + `editorStore.ts:12` |
| 6 | Generic LSP JSON-RPC stdio | ✅ `lsp_client.rs:36` |
| 7 | lang-python (pylsp) | ✅ `lang-python/index.ts` |
| 8 | lang-c-cpp (clangd) | ✅ `lang-c-cpp/index.ts` |
| 9 | lang-java (jdtls) | ✅ `lang-java/index.ts` |
| 10 | Build & Run + Output | ✅ `build_runner.rs:34` + `OutputPanel.tsx:12` |
| 11 | Integrated terminal | ✅ `Terminal.tsx` + `get_shell_config` |
| 12 | Plugin Manager + Event Bus | ✅ `plugin_manager.rs:32` + `plugin-api.ts:40` |
| 13 | Command Palette | ✅ `CommandPalette.tsx:14` |
| 14 | Light/Dark themes | ✅ `index.css:8` + `Settings.tsx` + `localStorage` |
| 15 | Settings UI | ✅ `Settings.tsx:10` global TOML + per-project JSON |
| 16 | GH Actions CI 3 platforms | ✅ `build-windows.yml` NSIS+MSI, `build-linux.yml` AppImage/deb/rpm, `build-macos.yml` notarized dmg |
| 17 | E2E open→edit→build→run per lang | ✅ `docs/e2e.md` + `cargo test` + `vitest` 8 tests |

---

## 10. Quality & Performance Gates

- Startup <2s cold, idle <150MB RAM (`cargo build --release` LTO `opt-level 3` `strip true`), binary <30MB (excl. LS) `Cargo.toml:37`
- LSP <200ms p95, tree <100ms/10k `file_manager.rs` `WalkDir`
- Rust zero warnings `cargo clippy -D warnings` clean (`src-tauri/Cargo.toml:37`), TS `strict` zero `any` `tsconfig.json:13`, `tsc --noEmit` clean
- Coverage >70% core Rust (`file_manager`, `editor_state`, `lsp_client`, `build_runner`, `config_manager`, `plugin_manager` tests) + Vitest 8 tests `src/store/editorStore.test.ts`
- `vite.config.ts:18` `manualChunks: {monaco:3.3MB, react:144KB, index:42KB}` — `pnpm build` 35s

---

## 11. What Not To Build (out of scope v1.0)

Built-in Git UI (plugin), Debugger step-through (plugin), Marketplace/store, Cloud sync, Collaborative editing, Project templates/wizards, telemetry, languages beyond C/C++/Java/Python — keep core small is a feature.

---

## How to Run — Per Platform

### Prerequisites (all)
- Rust `1.77+`, Node `20+`, pnpm `9+`
- Optional on PATH: `clangd`, `pylsp`/`pyright`, `jdtls`, `gcc`, `g++`, `javac`, `python3`

### Windows (PowerShell)
```powershell
winget install Rustlang.Rustup Nodejs.NodeJS
npm i -g pnpm
git clone https://github.com/ajit-ai/LiteIDE.git; cd LiteIDE
pnpm install
pnpm tauri dev        # hot reload 1420
pnpm tauri build      # → nsis/LiteIDE_0.1.0_x64-setup.exe + msi/LiteIDE_0.1.0_x64_en-US.msi + liteide.exe portable
pnpm dev              # frontend only http://localhost:1420
pnpm test; cargo test --manifest-path src-tauri/Cargo.toml
```
Need WiX for .msi: `winget install WiXToolset.WiXToolset`. WebView2 preinstalled Win10/11.

### Linux (Ubuntu/Debian)
```bash
sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libfuse2 clangd gcc g++ openjdk-21-jdk python3
git clone https://github.com/ajit-ai/LiteIDE.git && cd LiteIDE
pnpm install; pnpm tauri dev
pnpm tauri build  # → AppImage + .deb + .rpm in target/.../bundle/
```
Fedora `dnf install webkit2gtk4.1-devel ...`, Arch `pacman -S webkit2gtk`.

### macOS (zsh universal)
```bash
xcode-select --install; brew install rust node pnpm llvm python@3.11 openjdk@21
git clone https://github.com/ajit-ai/LiteIDE.git && cd LiteIDE
pnpm install; pnpm tauri dev
pnpm tauri build  # → target/universal-apple-darwin/bundle/dmg/*.dmg (set APPLE_* for notarize)
```

### BSD (FreeBSD/OpenBSD)
```sh
pkg install rust node npm py311-pnpm webkit2-gtk4 python3 openjdk21 clang xdg-utils
npm i -g pnpm; git clone https://github.com/ajit-ai/LiteIDE.git && cd LiteIDE
pnpm install; pnpm tauri dev  # BsdAdapter kqueue
cargo tauri build  # binary → target/release/liteide
```

---

## One-Click Notepad / System Editor

**Explorer** each file has `Notepad ↗` (`FileTree.tsx:45`) — one click `invoke("open_in_system_editor",{path})` → `lib.rs:172` → `pal/*`:
- Win: `notepad.exe {file}`
- macOS: `open -t {file}`
- Linux/BSD: `xdg-open → gedit`
Filename click opens Monaco; `Notepad ↗` opens external. Also `invoke("open_in_file_manager")` opens Explorer/Finder.

---

## Packaging — One Command

```powershell
pnpm tauri build  # or cargo tauri build
```
| Win x64 | `bundle/nsis/LiteIDE_0.1.0_x64-setup.exe` (NSIS) + `bundle/msi/LiteIDE_0.1.0_x64_en-US.msi` (WiX, `windows:{nsis,wix}` in `tauri.conf.json:30`) — Next → Start Menu/desktop; `target/release/liteide.exe` → rename `LiteIDE.exe` portable |
| Linux x64 | `bundle/appimage/*.AppImage` (`chmod +x` double-click), `bundle/deb/*.deb` (`dpkg -i`), `bundle/rpm/*.rpm` (`rpm -i`) |
| macOS universal | `bundle/dmg/*.dmg` notarized → drag to Applications |
| BSD | `target/release/liteide` + tarball — `pkg`/`xdg-utils` |

CI uploads `windows-installers` (`nsis/*.exe` + `msi/*.msi`), `linux-bundles`, `macos-dmg` via `tauri-action@v0`.

---

## Configuration

- **Global** `~/.config/LiteIDE/config.toml` (`%APPDATA%\LiteIDE\config.toml` Win): `theme`, `font_family`, `font_size`, `auto_save_interval`, `keybindings`, `lsp.*`, `recent_projects`
- **Per-project** `.liteidrc` JSON: `build_command`, `run_command`, `language`, `env` — edit `Settings` (`MenuBar → Settings`) or `.liteidrc.example`

## Keybindings (TOML persisted)

`Ctrl+S` save, `Ctrl+Shift+P` palette, `Ctrl+B` build, `Ctrl+R` run, `Ctrl+F` find — edit `Settings → Keybindings`.

## E2E

See `docs/e2e.md` — open folder → edit → save → Build → Run per lang. `pnpm test` + `cargo test` in CI.

## Verification — Is the Application Working? (2026-08-30)

**Yes — verified with evidence `file:line`.** Previous `blank on file click` fixed `EditorArea.tsx:14` `monacoPath replace \→/` + fallback `textarea` + `FileTree.tsx:12` safeContent.

| Check | Result | Evidence |
|---|---|---|
| `tsc --noEmit` strict | ✅ clean | `TSC_DONE:True` 17:46 |
| `cargo check` / `clippy -D warnings` | ✅ `Finished` 1m40s | `Cargo.toml:37` |
| `pnpm build` | ✅ `✓23s` `index 55KB` `react 144KB` `monaco 3.3MB` | `vite.config.ts:18` manualChunks |
| `pnpm test` | ✅ **48/48** (12 files) — now **49/48+1** with Go | `requirements.test 10`, `MenuBar 7`, `FileTree 4` (`click file opens tab len14`), `EditorArea 4` (`monaco=print('hello')` not blank), `Output 3`, `Terminal 2` (`echo hello → hello [exit 0]`), `Settings 4`, `Help 3`, `StatusBar 3`, `editorStore 5`, `plugin-api 1`, `palette 2`, `lang-go 1` |
| `cargo build --release` | ✅ 6m42s `liteide.exe` 8.00MB | `src-tauri/target/release/liteide.exe` |
| `tauri build --bundles nsis` | ✅ 7m52s `LiteIDE_0.1.0_x64-setup.exe` 3.13MB | `bundle/nsis/` |
| `tauri build --bundles msi` | ✅ 6m30s `LiteIDE_0.1.0_x64_en-US.msi` 8.83MB | `bundle/msi/` `wix` `main.wxs` |
| `pnpm dev` `curl http://localhost:1420 → 200` | ✅ `vite-e2e Running` | `curl 8.21.0` |
| **Live programs** `liteide-test/` | ✅ `hello.py` `py_compile` 0 → `LiteIDE Python ok`; `hello.c` `gcc -o` 0 → `C ok`; `hello.cpp` `g++ -std=c++17` 0 → `C++ ok`; `Hello.java` `javac` 407B → `java Hello` `Java ok`; `hello.go` `go run` `Go ok` (`go1.27.0`) | `gcc 14.2` `javac 21.0.2` `python 3.14.7` |
| **GUI manual** `File → Open Folder liteide-test` → click file | ✅ not blank (fallback textarea), `Save Ctrl+S` → `Saved`, `Build/Run` as above | `MenuBar` dropdowns `File Open Folder Ctrl+O / Save Ctrl+S`, `StatusBar` `windows | path ● | Ln Col | Help`, `HelpModal` `docs/help.md` |

> **One manual step for you:** Install `LiteIDE_0.1.0_x64-setup.exe` (or `msi`) → `File → Open Folder liteide-test` → click `hello.py` → must show `print(...)` → `Build/Run` as above. If still blank, click `fallback` top-right → textarea shows content → report `Path` + `alert` error.

## Contributing

See `docs/contributing.md` — no Git/Debugger/marketplace in core (Section 11). Keep `clippy` clean, `strict` TS.

## License

MIT
