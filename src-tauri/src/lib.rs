pub mod core;
pub mod pal;

use core::build_runner::{BuildOutput, BuildRequest, RunRequest};
use core::config_manager::{GlobalConfig, ProjectConfig};
use core::file_manager::{FileEntry, SearchResult};
use core::lsp_client::{LspManager, LspServerConfig, LspStatus};
use pal::{current_platform, ShellConfig};
use std::sync::Mutex;

pub struct AppState {
    pub editor_state: Mutex<core::editor_state::EditorState>,
    pub lsp_manager: Mutex<LspManager>,
    pub plugin_manager: Mutex<core::plugin_manager::PluginManager>,
}

// --- File Manager commands ---
#[tauri::command]
fn list_dir(path: String) -> Result<Vec<FileEntry>, String> {
    core::file_manager::list_dir(&path)
}

#[tauri::command]
fn file_tree(path: String, max_depth: Option<usize>) -> Result<FileEntry, String> {
    core::file_manager::file_tree(&path, max_depth.unwrap_or(4))
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    core::file_manager::read_file(&path)
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    core::file_manager::write_file(&path, &content)
}

#[tauri::command]
fn create_entry(path: String, is_dir: bool) -> Result<(), String> {
    core::file_manager::create_entry(&path, is_dir)
}

#[tauri::command]
fn delete_entry(path: String) -> Result<(), String> {
    core::file_manager::delete_entry(&path)
}

#[tauri::command]
fn rename_entry(from: String, to: String) -> Result<(), String> {
    core::file_manager::rename_entry(&from, &to)
}

#[tauri::command]
fn search_in_files(root: String, query: String, max_results: Option<usize>) -> Result<Vec<SearchResult>, String> {
    core::file_manager::search_in_files(&root, &query, max_results.unwrap_or(100))
}

// --- Editor State commands ---
#[tauri::command]
fn detect_language(path: String) -> String {
    core::editor_state::detect_language(&path)
}

#[tauri::command]
fn get_recent_files(state: tauri::State<AppState>) -> Vec<String> {
    state.editor_state.lock().unwrap().recent_files().to_vec()
}

// --- Build Runner ---
#[tauri::command]
async fn build_project(req: BuildRequest) -> Result<BuildOutput, String> {
    core::build_runner::execute_build(req).await
}

#[tauri::command]
async fn run_project(req: RunRequest) -> Result<BuildOutput, String> {
    core::build_runner::execute_run(req).await
}

// --- LSP ---
#[tauri::command]
async fn start_lsp(config: LspServerConfig, state: tauri::State<'_, AppState>) -> Result<LspStatus, String> {
    // Spawn without holding the lock across await
    {
        let mgr = state.lsp_manager.lock().unwrap();
        if mgr.status(&config.language).running {
            return Err(format!("LSP for {} already running", config.language));
        }
    }
    // spawn child process
    let status = {
        use tokio::process::Command;
        use std::process::Stdio;
        let mut cmd = Command::new(&config.command);
        cmd.args(&config.args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        let child = cmd.spawn().map_err(|e| format!("failed to spawn {}: {}", config.command, e))?;
        let pid = child.id();
        // insert into manager
        let mut mgr = state.lsp_manager.lock().unwrap();
        mgr.insert_child(config.clone(), child);
        LspStatus {
            language: config.language,
            running: true,
            pid,
        }
    };
    Ok(status)
}

#[tauri::command]
fn stop_lsp(language: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut mgr = state.lsp_manager.lock().unwrap();
    mgr.stop(&language)
}

#[tauri::command]
fn lsp_status(language: String, state: tauri::State<AppState>) -> LspStatus {
    let mgr = state.lsp_manager.lock().unwrap();
    mgr.status(&language)
}

#[tauri::command]
fn is_tool_available(cmd: String) -> bool {
    which::which(&cmd).is_ok()
}

// --- Config ---
#[tauri::command]
fn get_global_config() -> GlobalConfig {
    core::config_manager::load_global_config()
}

#[tauri::command]
fn save_global_config(config: GlobalConfig) -> Result<(), String> {
    core::config_manager::save_global_config(&config)
}

#[tauri::command]
fn get_project_config(project_root: String) -> Option<ProjectConfig> {
    core::config_manager::load_project_config(&project_root)
}

#[tauri::command]
fn save_project_config(project_root: String, config: ProjectConfig) -> Result<(), String> {
    core::config_manager::save_project_config(&project_root, &config)
}

// --- Platform ---
#[tauri::command]
fn get_shell_config() -> ShellConfig {
    current_platform().default_shell()
}

#[tauri::command]
fn platform_name() -> String {
    current_platform().platform_name().to_string()
}

#[tauri::command]
fn open_in_file_manager(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    current_platform()
        .open_in_file_manager(p)
        .map_err(|e| e.to_string())
}

// --- Plugin ---
#[tauri::command]
fn list_plugins(state: tauri::State<AppState>) -> Vec<core::plugin_manager::PluginMetadata> {
    let pm = state.plugin_manager.lock().unwrap();
    pm.list().into_iter().cloned().collect()
}

#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}! Welcome to LiteIDE.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut plugin_manager = core::plugin_manager::PluginManager::new();
    plugin_manager.load_builtin();

    let app_state = AppState {
        editor_state: Mutex::new(core::editor_state::EditorState::new()),
        lsp_manager: Mutex::new(LspManager::new()),
        plugin_manager: Mutex::new(plugin_manager),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            greet,
            list_dir,
            file_tree,
            read_file,
            write_file,
            create_entry,
            delete_entry,
            rename_entry,
            search_in_files,
            detect_language,
            get_recent_files,
            build_project,
            run_project,
            start_lsp,
            stop_lsp,
            lsp_status,
            is_tool_available,
            get_global_config,
            save_global_config,
            get_project_config,
            save_project_config,
            get_shell_config,
            platform_name,
            open_in_file_manager,
            list_plugins
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
