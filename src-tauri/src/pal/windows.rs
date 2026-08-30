use super::{PlatformAdapter, ShellConfig};
use std::path::{Path, PathBuf};

pub struct WindowsAdapter;

impl PlatformAdapter for WindowsAdapter {
    fn default_shell(&self) -> ShellConfig {
        // Prefer PowerShell if available, fallback to cmd.exe
        if Path::new("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe").exists() {
            ShellConfig {
                shell: "powershell.exe".to_string(),
                args: vec!["-NoLogo".to_string()],
            }
        } else {
            ShellConfig {
                shell: "cmd.exe".to_string(),
                args: vec![],
            }
        }
    }

    fn normalize_path(&self, path: &str) -> PathBuf {
        // Handle drive letters and backslash normalization
        let normalized = path.replace('/', "\\");
        PathBuf::from(normalized)
    }

    fn open_in_file_manager(&self, path: &Path) -> anyhow::Result<()> {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map(|_| ())
            .map_err(|e| anyhow::anyhow!("failed to open explorer: {}", e))
    }

    fn platform_name(&self) -> &'static str {
        "windows"
    }
}

/// Windows-specific: ReadDirectoryChangesW is abstracted via `notify` crate.
/// This module re-exports helper to create watcher.
pub fn create_watcher<F>(path: &Path, callback: F) -> anyhow::Result<notify::RecommendedWatcher>
where
    F: Fn(notify::Result<notify::Event>) + Send + 'static,
{
    use notify::Watcher;
    let mut watcher = notify::recommended_watcher(callback)?;
    watcher.watch(path, notify::RecursiveMode::Recursive)?;
    Ok(watcher)
}
