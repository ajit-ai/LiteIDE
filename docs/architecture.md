# LiteIDE Architecture

## Layers

1. **UI Layer** `src/` — React 18 + Monaco + Zustand
   - EditorArea, TabBar, FileTree, SearchPanel, Terminal, OutputPanel, ProblemsPanel, StatusBar, CommandPalette
2. **Core Engine** `src-tauri/src/core/` — Rust
   - file_manager, editor_state, lsp_client, build_runner, plugin_manager, config_manager
3. **Plugin System** `src/plugins/` — TypeScript plugin-api.ts + lang-* plugins
4. **Platform Abstraction Layer** `src-tauri/src/pal/` — windows / linux / macos trait

## IPC

Tauri `invoke` / `emit` via `src-tauri/src/lib.rs` commands.

## LSP

`lsp_client.rs` spawns servers via stdio (clangd, pylsp/pyright, jdtls).

## Config

Global: `~/.config/LiteIDE/config.toml` (TOML) — theme, font, lsp, recent projects
Project: `.liteidrc` (JSON) per project root.

## Extensibility Contract

See Section 8 of master prompt — Rules 1-6 enforced.
