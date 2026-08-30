# LiteIDE — Small core, infinite reach

Lightweight, extensible, cross-platform IDE. Tauri 2 + React 18 + Monaco + Rust + Zustand.

## Supported Languages (v1.0)
- **C** — clangd + gcc/clang, `gcc -o {output} {file}`, gdb/lldb
- **C++** — clangd + g++/clang++, `g++ -std=c++17 -o {output} {file}`
- **Java** — jdt.ls + javac/java, detects `pom.xml`/`build.gradle`
- **Python** — pylsp/pyright + python3, auto .venv, pip panel

## Quick Start
```powershell
pnpm install
pnpm tauri dev      # desktop
pnpm build          # vite
cargo test --manifest-path src-tauri/Cargo.toml
pnpm test           # vitest
```

## Architecture
- UI Layer `src/` — EditorArea/TabBar/FileTree/Search/Terminal/Output/Problems/StatusBar/CommandPalette/Settings/MenuBar
- Core `src-tauri/src/core/` — file_manager, editor_state, lsp_client, build_runner, plugin_manager, config_manager
- PAL `src-tauri/src/pal/` — PlatformAdapter trait (windows/linux/macos)
- Plugins `src/plugins/` — plugin-api.ts + lang-c-cpp, lang-java, lang-python (Event Bus only)

## Keybindings (customizable, stored in TOML)
Ctrl+S save, Ctrl+Shift+P command palette, Ctrl+B build, Ctrl+R run — edit in Settings → Keybindings.

## Config
- Global: `~/.config/LiteIDE/config.toml` (theme, font, keybindings, LSP)
- Project: `.liteidrc` (JSON) per root — see `.liteidrc.example`

## Extensibility
- Rule 4: new language = one plugin package, zero core changes.
- See `docs/plugin-api.md` and `src/plugins/plugin-api.ts` (ADDITIVE ONLY).

## Performance Gates
- Startup <2s, idle <150MB, binary <30MB, LSP <200ms p95, tree <100ms/10k files, clippy clean, strict TS, >70% core coverage.

## CI
- `build-windows.yml` → NSIS .exe + portable .zip
- `build-linux.yml` → AppImage + .deb + .rpm
- `build-macos.yml` → universal .dmg with notarization
