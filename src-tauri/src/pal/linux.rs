use super::{PlatformAdapter, ShellConfig};
use std::path::{Path, PathBuf};

pub struct LinuxAdapter;

impl PlatformAdapter for LinuxAdapter {
    fn default_shell(&self) -> ShellConfig {
        // Prefer $SHELL, fallback to bash
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());
        ShellConfig {
            shell,
            args: vec![],
        }
    }

    fn normalize_path(&self, path: &str) -> PathBuf {
        PathBuf::from(path)
    }

    fn open_in_file_manager(&self, path: &Path) -> anyhow::Result<()> {
        // Try xdg-open, then nautilus, dolphin
        let result = std::process::Command::new("xdg-open")
            .arg(path)
            .spawn();
        if result.is_ok() {
            return Ok(());
        }
        std::process::Command::new("nautilus")
            .arg(path)
            .spawn()
            .map(|_| ())
            .map_err(|e| anyhow::anyhow!("failed to open file manager: {}", e))
    }

    fn platform_name(&self) -> &'static str {
        "linux"
    }
}

pub fn create_watcher<F>(path: &Path, callback: F) -> anyhow::Result<notify::RecommendedWatcher>
where
    F: Fn(notify::Result<notify::Event>) + Send + 'static,
{
    use notify::Watcher;
    let mut watcher = notify::recommended_watcher(callback)?;
    watcher.watch(path, notify::RecursiveMode::Recursive)?;
    Ok(watcher)
}
