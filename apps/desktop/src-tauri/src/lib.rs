// QuantsMind IDE — Phase 2: Workspace + Filesystem + Document
use std::path::Path;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    workspace: Mutex<workspace::WorkspaceManager>,
    documents: Mutex<document::DocumentManager>,
    commands: Mutex<command::CommandRegistry>,
    events: Mutex<event_bus::EventBus>,
    terminal: Mutex<terminal::TerminalService>,
    debug: Mutex<debug::DebugService>,
    plugins: Mutex<plugin::PluginManager>,
}

#[tauri::command]
fn greet(name: &str) -> String { format!("Hello, {}! QMIDE greets you!", name) }

#[tauri::command]
fn open_workspace(path: String, state: tauri::State<AppState>) -> Result<workspace::Workspace, String> {
    let mut w = state.workspace.lock().unwrap();
    w.open(Path::new(&path)).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<filesystem::FileEntry>, String> {
    filesystem::list_dir(Path::new(&path)).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(path: String) -> Result<(), String> { filesystem::create_file(Path::new(&path)).map_err(|e| e.to_string()) }

#[tauri::command]
fn create_dir(path: String) -> Result<(), String> { filesystem::create_dir(Path::new(&path)).map_err(|e| e.to_string()) }

#[tauri::command]
fn rename_file(from: String, to: String) -> Result<(), String> { filesystem::rename(Path::new(&from), Path::new(&to)).map_err(|e| e.to_string()) }

#[tauri::command]
fn delete_path(path: String) -> Result<(), String> { filesystem::delete(Path::new(&path)).map_err(|e| e.to_string()) }

#[tauri::command]
fn read_file(path: String) -> Result<String, String> { filesystem::read_to_string(Path::new(&path)).map_err(|e| e.to_string()) }

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> { filesystem::write_string(Path::new(&path), &content).map_err(|e| e.to_string()) }

#[tauri::command]
fn open_document(uri: String, language: String, content: String, state: tauri::State<AppState>) -> Result<document::Document, String> {
    let mut docs = state.documents.lock().unwrap();
    Ok(docs.open(&uri, &language, &content))
}

#[tauri::command]
fn register_command(id: String, title: String, category: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut reg = state.commands.lock().unwrap();
    reg.register(&id, &title, &category).map_err(|e| e.to_string())
}

#[tauri::command]
fn execute_command(id: String, state: tauri::State<AppState>) -> Result<String, String> {
    let reg = state.commands.lock().unwrap();
    reg.execute(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_commands(state: tauri::State<AppState>) -> Vec<command::Command> {
    let reg = state.commands.lock().unwrap();
    reg.list().into_iter().cloned().collect()
}

#[tauri::command]
fn emit_event(event: event_bus::IDEEvent, state: tauri::State<AppState>) -> Vec<String> {
    let bus = state.events.lock().unwrap();
    bus.emit(&event)
}

#[tauri::command]
fn get_shells() -> Vec<terminal::ShellInfo> { terminal::ShellDetector::detect() }

#[tauri::command]
fn create_terminal(shell: Option<terminal::ShellInfo>, cwd: Option<String>, state: tauri::State<AppState>) -> terminal::TerminalSession {
    let mut t = state.terminal.lock().unwrap();
    t.new_session(shell, cwd)
}

#[tauri::command]
fn list_terminals(state: tauri::State<AppState>) -> Vec<terminal::TerminalSession> {
    let t = state.terminal.lock().unwrap();
    t.pty.list().into_iter().cloned().collect()
}

#[tauri::command]
fn debug_add_breakpoint(uri: String, line: u32, state: tauri::State<AppState>) -> debug::Breakpoint {
    let mut d = state.debug.lock().unwrap();
    d.add_breakpoint(&uri, line)
}

#[tauri::command]
fn debug_start(adapter: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut d = state.debug.lock().unwrap();
    d.start(&adapter).map_err(|e| e.to_string())
}

#[tauri::command]
fn debug_step_over(state: tauri::State<AppState>) -> Result<u32, String> {
    let mut d = state.debug.lock().unwrap();
    d.step_over().map_err(|e| e.to_string())
}

#[tauri::command]
fn list_plugins(state: tauri::State<AppState>) -> Vec<plugin::PluginManifest> {
    let p = state.plugins.lock().unwrap();
    p.registry.list().into_iter().cloned().collect()
}

#[tauri::command]
fn register_plugin(toml: String, state: tauri::State<AppState>) -> Result<(), String> {
    let manifest = plugin::PluginLoader::load_from_toml(&toml).map_err(|e| e.to_string())?;
    let mut p = state.plugins.lock().unwrap();
    p.registry.register(manifest).map_err(|e| e.to_string())
}

#[tauri::command]
fn activate_plugin(id: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut p = state.plugins.lock().unwrap();
    plugin::PluginLifecycle::activate(&mut p.registry, &id).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut cmd_reg = command::CommandRegistry::new();
    // Register default commands Phase 4-10
    let _ = cmd_reg.register("workspace.open", "Open Workspace", "workspace");
    let _ = cmd_reg.register("file.save", "Save File", "file");
    let _ = cmd_reg.register("file.saveAll", "Save All", "file");
    let _ = cmd_reg.register("build.run", "Run Build", "build");
    let _ = cmd_reg.register("terminal.new", "New Terminal", "terminal");
    let _ = cmd_reg.register("debug.start", "Start Debugging", "debug");
    let _ = cmd_reg.register("debug.stop", "Stop Debugging", "debug");
    let _ = cmd_reg.register("debug.stepOver", "Step Over", "debug");
    let _ = cmd_reg.register("plugin.list", "List Plugins", "plugin");
    let mut plugin_mgr = plugin::PluginManager::new();
    // Register built-in plugins Phase 10
    for toml in [
        "[plugin]\nid=\"quantsmind.language.c\"\nname=\"C\"\nversion=\"0.1.0\"\n[capabilities]\nlanguages=true\nbuild=true\ndebug=true\ncommands=true\n",
        "[plugin]\nid=\"quantsmind.language.cpp\"\nname=\"C++\"\nversion=\"0.1.0\"\n[capabilities]\nlanguages=true\nbuild=true\ndebug=true\ncommands=true\n",
        "[plugin]\nid=\"quantsmind.language.java\"\nname=\"Java\"\nversion=\"0.1.0\"\n[capabilities]\nlanguages=true\nbuild=true\ndebug=true\ncommands=true\n",
        "[plugin]\nid=\"quantsmind.language.python\"\nname=\"Python\"\nversion=\"0.1.0\"\n[capabilities]\nlanguages=true\nbuild=true\ndebug=false\ncommands=true\n",
    ] {
        if let Ok(m) = plugin::PluginLoader::load_from_toml(toml) {
            let _ = plugin_mgr.registry.register(m);
        }
    }
    let state = AppState {
        workspace: Mutex::new(workspace::WorkspaceManager::new()),
        documents: Mutex::new(document::DocumentManager::new()),
        commands: Mutex::new(cmd_reg),
        events: Mutex::new(event_bus::EventBus::new()),
        terminal: Mutex::new(terminal::TerminalService::new()),
        debug: Mutex::new(debug::DebugService::new()),
        plugins: Mutex::new(plugin_mgr),
    };
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            greet,
            open_workspace,
            list_dir,
            create_file,
            create_dir,
            rename_file,
            delete_path,
            read_file,
            write_file,
            open_document,
            register_command,
            execute_command,
            list_commands,
            emit_event,
            get_shells,
            create_terminal,
            list_terminals,
            debug_add_breakpoint,
            debug_start,
            debug_step_over,
            list_plugins,
            register_plugin,
            activate_plugin
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
