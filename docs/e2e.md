# E2E Testing — open → edit → build → run per language

## Prerequisites
- gcc/clang, g++, javac/java, python3 on PATH
- `pnpm tauri dev` running

## Manual Steps (UI)
1. Open Folder → select project root
2. Create `test_c.c`, `test_cpp.cpp`, `Main.java`, `test.py`
3. Click file in explorer → edit in Monaco → Ctrl+S
4. Output panel → Build → verify success
5. Run → verify stdout

## CLI smoke (build_runner)

```powershell
# C
"int main(){return 0;}" | Set-Content test_c.c
cargo test --manifest-path src-tauri/Cargo.toml -- build_runner

# Python
python -m py_compile test.py && echo "python ok"

# Java
javac Main.java && java Main
```

## Expected
- C: `gcc -o test_c test_c.c` success
- C++: `g++ -std=c++17 -o test_cpp test_cpp.cpp`
- Java: `javac Main.java` → `java Main`
- Python: `python test.py` prints output in OutputPanel

## Automated frontend tests
`pnpm test` runs Vitest for stores + CommandPalette + plugin EventBus.
`cargo test` covers file_manager, editor_state, lsp, build_runner, config, plugin_manager.
