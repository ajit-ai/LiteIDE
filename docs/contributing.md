# Contributing

- Stack: Tauri 2 + React 18 + TS (strict) + Zustand + Monaco + Cargo + Vite + pnpm
- Rust: `cargo test` / `cargo clippy` zero warnings
- Frontend: `pnpm test` (Vitest), `pnpm lint`
- Never import language plugin in core — plugins register via plugin.json + Event Bus
- Platform code only in `src-tauri/src/pal/`
