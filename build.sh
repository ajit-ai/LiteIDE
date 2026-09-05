#!/bin/bash
# QuantsMind IDE — One-Click Build (Linux/macOS/BSD + Windows via pwsh)
# Usage: bash build.sh  or  ./build.sh
set -e
echo "QuantsMind IDE — One-Click Build (Windows/Linux/macOS/BSD)"
echo "1. Rust workspace check..."
cargo check --workspace

echo "2. Angular build..."
(cd apps/desktop && pnpm install && pnpm build)

echo "3. Tauri bundle (all targets for this OS)..."
(cd apps/desktop && pnpm tauri build)

echo "Done — check apps/desktop/src-tauri/target/release/bundle/"
find apps/desktop/src-tauri/target/release/bundle -type f 2>/dev/null | head -20
