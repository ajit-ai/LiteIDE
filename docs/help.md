# LiteIDE — Basic Help

**Welcome to LiteIDE — Small core, infinite reach.** This is the in-IDE **Help** (also via **Help → About** and **StatusBar → Help**).

## 1. First Run (30 seconds)
1. **Open Folder:** `File → Open Folder` (or `Ctrl+O`) → pick `C:\liteide-test` or any project folder. Explorer shows tree (dirs first,▼/▶ to expand).
2. **Create File:** `+ File` button → type `hello.py` (or `hello.c` / `hello.cpp` / `Hello.java`) → Enter.
3. **Edit:** Click file in Explorer → Monaco editor opens (not blank — fallback textarea if needed). Type code → `*` dirty shows in TabBar and StatusBar `● Modified`.
4. **Save:** `File → Save` or `Ctrl+S` → `write_file` → StatusBar `Saved`.
5. **Close:** `File → Close File` or `Ctrl+W` or `×` on tab.

## 2. File Operations
- **Open File:** `File → Open File` → pick any file → opens in new tab (multi-tab). Switch tabs via `TabBar` click.
- **Open in Notepad (one-click):** Each file row has `Notepad ↗` — one click opens `notepad.exe` (Win) / `open -t` (mac) / `xdg-open` (Linux/BSD) without leaving LiteIDE (`src-tauri/src/lib.rs:172`).
- **Open in File Manager:** Right-side `...` or `File → Open in File Manager` → `explorer` / `open` / `xdg-open`.
- **Rename/Delete:** Via explorer context (future) or `Search →` then `Terminal: rm/mv`.
- **Recent:** `File → Open Folder` stores `recent_projects` in `~/.config/LiteIDE/config.toml` (`%APPDATA%` on Win) — visible in `Settings` footer.

## 3. Editing
- **Monaco:** Syntax `C`/`cpp`/`java`/`python` auto-detected (`monaco-config.ts:12`). `Ctrl+Z/Y` Undo/Redo, `Ctrl+X/C/V` Cut/Copy/Paste, `Ctrl+F` Find (opens Search panel).
- **Split:** `View → Split Horizontal/Vertical` (or palette `editor.splitHorizontal`) → 2 panes `splitCount=2` (`EditorArea.tsx:50`), `Close Split` to revert. Good for `hello.c` + `hello.py` side-by-side.
- **Cursor:** `StatusBar` shows `Ln 12, Col 4` (updates via `cursorChange` event from Monaco `onDidChangeCursorPosition`).
- **Language:** StatusBar shows `python`/`c`/`java` from `detect_language` (`editor_state.rs`).

## 4. Build & Run (per language)
- **Output tab:** `BottomPanel → Output` has `Build` / `Run` / `Clear`. Or `Run → Build` (`Ctrl+B`) / `Run → Run` (`Ctrl+R`) from MenuBar — both `invoke("build_project"/"run_project")` via `core/build_runner.rs:34`.
- **C:** `hello.c` → `Build` → `gcc -o hello hello.c` → `Run` → `C ok`
- **C++:** `hello.cpp` → `Build` → `g++ -std=c++17 -o hello_cpp hello.cpp` → `Run` → `C++ ok`
- **Java:** `Hello.java` (`public class Hello`) → `Build` → `javac Hello.java` → `Run` → `java Hello` → `Java ok` (detects `pom.xml`/`build.gradle` hint)
- **Python:** `hello.py` `print("hi")` → `Build` → `python -m py_compile hello.py` → `Run` → `python hello.py` → `LiteIDE Python ok` (auto `.venv` if `venv` folder exists)
- **Errors:** `STDERR` shown in Output `STDERR:` + `Problems` tab (LSP diagnostics).

## 5. Terminal
- `BottomPanel → Terminal` → shows `Shell: powershell.exe -NoLogo` (Win) / `bash` / `zsh` / `sh` (via `pal/mod.rs:23` `default_shell`).
- Type `echo hello` or `dir`/`ls`, `gcc --version`, `python --version` → `Enter` or `Send` → `execute_shell` (`lib.rs:198` `powershell -Command` / `sh -c`) → `stdout` + `[exit 0 ok]`.
- `cwd` = `Open Folder` path (`useFileStore.rootPath`). `Clear` to reset log.

## 6. Search & Palette
- **Search:** `View → Search` or Sidebar `Search` → type `ok` → `invoke("search_in_files",{root,query})` → click result `hello.py:1` → opens file. Skips `.git`/`node_modules`/`target`.
- **Palette:** `Ctrl+Shift+P` or `View → Command Palette` → fuzzy `Build`, `Run`, `Toggle Theme`, `Settings`, plugin commands `python.run` etc. (`plugin-api.ts:40` EventBus).

## 7. Theme & Settings
- **Theme:** `View → Toggle Theme` or `StatusBar 🌙 Dark/☀️ Light` → persists `localStorage liteide-theme` + `~/.config/LiteIDE/config.toml` (`Settings → Appearance`).
- **Settings:** `Settings` or `MenuBar → Settings` → Global `font_family`, `font_size`, `auto_save_interval`, `keybindings` (Ctrl+S etc. editable) → `Save Global (TOML)`; Per-project `.liteidrc` JSON (`build_command`, `run_command`, `language`, `env`) → `Save .liteidrc` in project root (`Settings.tsx:10`).
- **Auto-save:** `auto_save_interval` ms — future debounce save (placeholder).

## 8. Help & Docs
- **Help:** `Help → About LiteIDE` or `StatusBar → Help` → modal with version `0.1.0`, shortcuts, docs link `github.com/ajit-ai/LiteIDE`, `README.md` Sections 1-11.
- **Docs:** `docs/architecture.md`, `docs/plugin-api.md`, `docs/help.md` (this file), `docs/e2e.md` (open→edit→build→run per lang), `docs/contributing.md`.
- **Footer:** StatusBar shows `platform | file path ● | language | Ln Col | LSP:idle/running | Dark/Light | Help | Footer • Saved/Modified` — always visible.

## 9. Shortcuts (customizable via Settings TOML)
| Action | Default |
|---|---|
| Save | `Ctrl+S` |
| Open Folder | `Ctrl+O` |
| Close File | `Ctrl+W` |
| Palette | `Ctrl+Shift+P` |
| Build | `Ctrl+B` |
| Run | `Ctrl+R` |
| Find | `Ctrl+F` |
| Undo/Redo | `Ctrl+Z` / `Ctrl+Y` |

## 10. Troubleshooting
- **Blank editor on click:** Fixed `path.replace(/\\/g,"/")` + fallback textarea + `fallback` link (`EditorArea.tsx:14`). Click `fallback` if Monaco blank. Ensure `read_file` succeeded — check `Output` for `Failed to open` alert.
- **Save not working:** Check `StatusBar` `Modified` → `Save` → `Saved`. File perms? Run `Terminal: ls -l`.
- **Build fail:** `Output STDERR` shows `gcc: command not found` → install `gcc`/`g++`/`javac`/`python` on PATH (`winget`/`apt`/`brew`).
- **LSP idle:** Install `clangd`, `pylsp`, `jdtls` on PATH → `lsp_status` will show `running`.

---

**Need more?** `MenuBar → Help → Docs (GitHub)` or open `README.md` § How to Run per platform (Win `winget`, Linux `apt`, macOS `brew`, BSD `pkg`). MIT.
