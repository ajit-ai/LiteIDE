// QuantsMind IDE — Phase 2: Workspace + Filesystem + Document
use std::path::Path;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    workspace: Mutex<workspace::WorkspaceManager>,
    documents: Mutex<document::DocumentManager>,
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = AppState {
        workspace: Mutex::new(workspace::WorkspaceManager::new()),
        documents: Mutex::new(document::DocumentManager::new()),
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
            open_document
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
