# Architecture Overview

QuantsMind IDE — SMALL CORE + MODULAR SERVICES + PLUGIN ARCHITECTURE + STANDARD PROTOCOLS

See README.md §3 for high-level diagram and §4-5 for module boundaries.

- UI (Angular) ? Tauri IPC ? IDE Core (Rust crates) ? PAL (Windows/Linux/macOS)
- Dependency direction: UI ? IPC ? Core ? Platform ? OS; Plugins ? EventBus ? Core; No cycles.

