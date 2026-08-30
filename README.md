# LiteIDE — Small core, infinite reach

Lightweight, extensible, cross-platform IDE. **Tauri 2 (Rust) + React 18 + Monaco + Zustand + Vite**. Guiding mantra: *Small core, infinite reach*.

[![Build Windows](https://github.com/ajit-ai/LiteIDE/actions/workflows/build-windows.yml/badge.svg)](.github/workflows/build-windows.yml) [![Build Linux](https://github.com/ajit-ai/LiteIDE/actions/workflows/build-linux.yml/badge.svg)](.github/workflows/build-linux.yml) [![Build macOS](https://github.com/ajit-ai/LiteIDE/actions/workflows/build-macos.yml/badge.svg)](.github/workflows/build-macos.yml)

## Supported Languages (v1.0)

| Language | LSP | Compiler / Runner | Build | Run |
|---|---|---|---|---|
| **C** | `clangd` | `gcc`/`clang` auto-detect | `gcc -o {output} {file}` | `./{output}` |
| **C++** | `clangd` | `g++`/`clang++` `-std=c++17` | `g++ -std=c++17 -o {output} {file}` | `./{output}` |
| **Java** | `jdtls` (Eclipse JDT LS) | `javac`/`java` JDK | `javac {file}` / `mvn compile` / `gradle build` hint | `java {MainClass}` |
| **Python** | `pylsp` or `pyright` | `python3`/`python`, `.venv` auto | `python -m py_compile {file}` | `python {file}` |

All four are self-contained plugins under `src/plugins/lang-*` — adding a language = one new plugin, zero core changes (Rule 4).

---

## Platform Support

| OS | Arch | Status | Artifacts | PAL module |
|---|---|---|---|---|
| **Windows 10/11** | x86_64 | ✅ Tier 1 (CI) | NSIS `.exe` + portable `.zip` | `src-tauri/src/pal/windows.rs:10` — PowerShell/cmd, `ReadDirectoryChangesW`, `explorer` |
| **Linux** (Ubuntu 22.04+, Fedora, Arch) | x86_64 | ✅ Tier 1 (CI) | `AppImage` + `.deb` + `.rpm` (`bundle targets: all`) | `pal/linux.rs:10` — `$SHELL`→bash, `inotify`, `xdg-open` |
| **macOS 12+** | x86_64 + arm64 **universal** | ✅ Tier 1 (CI + notarized) | `.dmg` (notarized via `APPLE_*` secrets) | `pal/macos.rs:10` — `$SHELL`→zsh, `FSEvents`, `open` |
| **BSD** (FreeBSD 14+, OpenBSD 7+, NetBSD, DragonFly) | x64/arm64 | ⚠️ Community / Best-effort | Manual `cargo tauri build` → binary/tarball; AppImage not applicable | `pal/bsd.rs:10` — `/bin/sh`, `kqueue`, `xdg-open` |
| **Other POSIX** | — | ⚠️ Fallback | Uses `linux` adapter fallback `pal/mod.rs:54` | — |

> **Will it work on BSD?** Yes — code compiles and runs. BSD uses the `BsdAdapter` (shares Linux/POSIX semantics, `notify` kqueue, shell `xdg-open`). Tauri officially supports Win/Linux/macOS; BSD requires manual build (install `webkit2gtk`/GTK, Rust, Node, `xdg-utils`) and is tested ad-hoc, not CI. No code changes needed — PAL abstracts all OS differences (Rule 5). WebView on BSD uses GTK WebKit same as Linux.

---

## How to Run — Per Platform

### Prerequisites (all)

- **Rust 1.77+** `rustc --version`, **Node 20+** `node --version`, **pnpm 9+** `pnpm --version`
- Language servers/tools on `PATH` (optional but recommended): `clangd`, `pylsp`/`pyright`, `jdtls`, `gcc`, `g++`, `javac`, `python3`

### Windows (PowerShell)

```powershell
# Install Rust (rustup) + Node + pnpm
winget install Rustlang.Rustup Nodejs.NodeJS
npm i -g pnpm

# Clone & run
git clone https://github.com/ajit-ai/LiteIDE.git
cd LiteIDE
pnpm install
pnpm tauri dev          # dev (hot reload, Rust + Vite)
pnpm tauri build        # release → src-tauri/target/release/bundle/nsis/*.exe + *.zip

# Alternative (no Tauri, frontend only)
pnpm dev    # http://localhost:1420
pnpm build  # dist/
pnpm test           # vitest (8 tests)
cargo test --manifest-path src-tauri/Cargo.toml
```

System deps: none extra (WebView2 ships with Win10/11).

### Linux (Ubuntu/Debian — bash)

```bash
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libfuse2 \
  clangd gcc g++ openjdk-21-jdk python3 python3-pip

git clone https://github.com/ajit-ai/LiteIDE.git && cd LiteIDE
pnpm install
pnpm tauri dev
pnpm tauri build   # → AppImage + .deb + .rpm in src-tauri/target/*/release/bundle/
```

Fedora: `sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel`
Arch: `sudo pacman -S webkit2gtk libappindicator-gtk3 librsvg`

### macOS (zsh — Intel & Apple Silicon)

```bash
# Xcode CLT + Rust + Node via Homebrew
xcode-select --install
brew install rust node pnpm

# Language tools (optional)
brew install llvm python@3.11 openjdk@21
# Eclipse JDT LS: brew install jdtls  (or download)

git clone https://github.com/ajit-ai/LiteIDE.git && cd LiteIDE
pnpm install
pnpm tauri dev
pnpm tauri build   # universal .dmg → src-tauri/target/universal-apple-darwin/release/bundle/dmg/
# For notarized release, set APPLE_CERTIFICATE, APPLE_ID, APPLE_PASSWORD, APPLE_TEAM_ID secrets (see build-macos.yml)
```

### BSD (FreeBSD/OpenBSD/NetBSD — sh)

```sh
# FreeBSD 14 example
pkg install rust node npm py311-pnpm webkit2-gtk4 python3 openjdk21 clang

npm i -g pnpm
git clone https://github.com/ajit-ai/LiteIDE.git && cd LiteIDE
pnpm install
pnpm tauri dev      # uses BsdAdapter (kqueue, xdg-open, /bin/sh)
cargo tauri build   # manual binary — AppImage not supported; package via pkg/tar
# Ensure: pkg install xdg-utils  (for open_in_file_manager)
```

OpenBSD/NetBSD similar — install `webkit2-gtk`, Rust via `pkg_add rust`, Node 20+. If WebView missing, fallback to `pnpm dev` (browser) + `cargo run` core.

---

## Design & Architecture

### Stack (mandatory, Section 3)

```
Desktop Shell: Tauri 2.x (Rust + WebView)
Editor:        Monaco 0.52 (via @monaco-editor/react)
UI:            React 18 + TypeScript strict + Zustand
IPC:           Tauri invoke/emit (JSON)
LSP:           stdio (child process per language)
Config:        TOML global + JSON per-project .liteidrc
Build:         Cargo + Vite, pnpm
Tests:         cargo test + Vitest + Testing Library
CI:            GitHub Actions (win/linux/macos)
```

### Layers (Section 5)

```
LAYER 1 UI            src/
  EditorArea      → Monaco, TabBar, split panes (EditorArea.tsx, TabBar.tsx, monaco-config.ts)
  Sidebar         → FileTree (list_dir), SearchPanel (search_in_files)
  BottomPanel     → Terminal (OS shell via PAL), Output (build/run), Problems (LSP diagnostics)
  MenuBar         → native menus via Tauri (MenuBar.tsx:5)
  StatusBar       → lang, cursor (StatusBar.tsx), LSP, theme toggle
  CommandPalette  → Ctrl+Shift+P fuzzy (CommandPalette.tsx)

LAYER 2 Core Engine   src-tauri/src/core/
  file_manager.rs   → open/save/watch, recent, tree (<100ms/10k)
  editor_state.rs   → buffer registry, dirty tracking, detect_language
  lsp_client.rs     → LspManager {start/stop/status}, stdio, which::which
  build_runner.rs   → spawn gcc/g++/javac/python, stream output, kill
  plugin_manager.rs → register, EventBus, builtin 3 plugins
  config_manager.rs → GlobalConfig TOML (~/.config/LiteIDE/config.toml) + ProjectConfig JSON (.liteidrc)

LAYER 3 Plugin System src/plugins/
  plugin-api.ts     → single source of truth (Rule 6). Interfaces:
    LiteIDEPlugin {metadata, activate(api), deactivate()}
    LiteIDEPluginAPI {commands, editor, fs, process, ui, events}
  lang-c-cpp/, lang-java/, lang-python/ → self-contained, Event Bus only (Rule 2)

LAYER 4 PAL           src-tauri/src/pal/
  mod.rs:23 trait PlatformAdapter {default_shell, normalize_path, open_in_file_manager, watch_directory, platform_name}
  windows.rs / linux.rs / macos.rs / bsd.rs  ← all OS code lives here (Rule 5)
  Core NEVER imports plugin or OS APIs directly (Rule 1)
```

### Repo Layout (Section 7)

```
liteide/
├── src-tauri/
│   ├── src/{main.rs, lib.rs, core/*, pal/*}
│   ├── Cargo.toml, tauri.conf.json, capabilities/default.json
├── src/
│   ├── App.tsx, main.tsx, index.css
│   ├── components/{Editor,Sidebar,BottomPanel,StatusBar,CommandPalette,Settings,MenuBar}
│   ├── store/{editorStore,fileStore,pluginStore}
│   ├── plugins/{plugin-api.ts, lang-c-cpp, lang-java, lang-python}
│   ├── test-setup.ts, vite-env.d.ts
├── plugins/           ← external plugin drop (plugin.json manifests)
├── docs/{architecture.md, plugin-api.md, contributing.md, e2e.md}
├── .github/workflows/{build-windows.yml, build-linux.yml, build-macos.yml}
├── package.json, vite.config.ts, tsconfig.json, .liteidrc.example
```

### Extensibility Contract (Section 8 — never break)

1. Core MUST NOT import plugin — plugins register via plugin.json.
2. Plugins communicate ONLY via EventBus (`src/plugins/plugin-api.ts:40`).
3. API is ADDITIVE ONLY — version with optional fields.
4. New language = one new `src/plugins/lang-*/index.ts`, zero `src-tauri/` changes.
5. OS code ONLY in `pal/`.
6. `plugin-api.ts` is single source of truth.

Example (Go):
```ts
// src/plugins/lang-go/index.ts
import type { LiteIDEPlugin } from "../plugin-api";
export default { metadata:{id:"lang-go", languages:["go"]}, activate(api){ api.commands.registerCommand("go.build","Go: Build",()=>api.events.emit("build:build",{language:"go"}))}} as LiteIDEPlugin;
```

### Quality & Performance Gates (Section 10)

- Startup <2s cold, idle <150MB, binary <30MB, LSP <200ms p95, tree <100ms/10k, `cargo clippy -D warnings` clean, `strict` TS zero `any`, >70% core coverage. `vite.config.ts:18` manualChunks: monaco ~3.3MB isolated, react 144KB, index 42KB.

---

## Configuration

- **Global** `~/.config/LiteIDE/config.toml` (or `%APPDATA%\LiteIDE\config.toml` on Win): `theme`, `font_family`, `font_size`, `auto_save_interval`, `keybindings`, `lsp.*`, `recent_projects`
- **Per-project** `.liteidrc` JSON at root: `build_command`, `run_command`, `language`, `env` — edit via Settings UI (MenuBar → Settings) or `.liteidrc.example`

## Keybindings (customizable, persisted in TOML)

`Ctrl+S` save, `Ctrl+Shift+P` palette, `Ctrl+B` build, `Ctrl+R` run, `Ctrl+F` find — edit in `Settings → Keybindings`.

## E2E (Section 9 Step 17)

See `docs/e2e.md` — open folder → edit → save → Build → Run for each language. `pnpm test` + `cargo test` in CI.

## Contributing

See `docs/contributing.md` — keep core small (no built-in Git/Debugger/marketplace/cloud/collab per Section 11).

## License

MIT
