use super::{PlatformAdapter, ShellConfig};
use std::path::{Path, PathBuf};

pub struct MacosAdapter;

impl PlatformAdapter for MacosAdapter {
    fn default_shell(&self) -> ShellConfig {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
        ShellConfig {
            shell,
            args: vec!["-l".to_string()],
        }
    }

    fn normalize_path(&self, path: &str) -> PathBuf {
        PathBuf::from(path)
    }

    fn open_in_file_manager(&self, path: &Path) -> anyhow::Result<()> {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map(|_| ())
            .map_err(|e| anyhow::anyhow!("failed to open Finder: {}", e))
    }

    fn platform_name(&self) -> &'static str {
        "macos"
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
