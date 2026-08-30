use super::{PlatformAdapter, ShellConfig};
use std::path::{Path, PathBuf};

/// BSD adapter — FreeBSD / OpenBSD / NetBSD / DragonFly
/// Reuses Linux POSIX semantics with BSD-specific file manager fallback.
pub struct BsdAdapter;

impl PlatformAdapter for BsdAdapter {
    fn default_shell(&self) -> ShellConfig {
        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
        ShellConfig {
            shell,
            args: vec![],
        }
    }

    fn normalize_path(&self, path: &str) -> PathBuf {
        PathBuf::from(path)
    }

    fn open_in_file_manager(&self, path: &Path) -> anyhow::Result<()> {
        // Try xdg-open (ports), then open
        let candidates = ["xdg-open", "open"];
        for cmd in candidates {
            if std::process::Command::new(cmd).arg(path).spawn().is_ok() {
                return Ok(());
            }
        }
        Err(anyhow::anyhow!("no file manager opener found on BSD (install xdg-utils)"))
    }

    fn platform_name(&self) -> &'static str {
        if cfg!(target_os = "freebsd") {
            "freebsd"
        } else if cfg!(target_os = "openbsd") {
            "openbsd"
        } else if cfg!(target_os = "netbsd") {
            "netbsd"
        } else {
            "bsd"
        }
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
