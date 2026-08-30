pub mod linux;
pub mod macos;
pub mod windows;

use std::path::{Path, PathBuf};

/// Shell configuration returned by PAL.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ShellConfig {
    pub shell: String,
    pub args: Vec<String>,
}

/// File watcher handle - platform-specific.
pub struct FileWatcher {
    // notify watcher stored via Box<dyn Any> to keep platform uniform
    #[allow(dead_code)]
    _inner: Box<dyn Send + Sync>,
}

/// Unified platform abstraction trait.
/// All platform-specific code behind this trait; core modules must not call OS APIs directly.
pub trait PlatformAdapter: Send + Sync {
    /// Default shell for integrated terminal.
    fn default_shell(&self) -> ShellConfig;

    /// Normalize a path string to a PathBuf respecting platform conventions.
    fn normalize_path(&self, path: &str) -> PathBuf;

    /// Open path in native file manager (explorer / finder / xdg-open).
    fn open_in_file_manager(&self, path: &Path) -> anyhow::Result<()>;

    /// Platform name identifier.
    fn platform_name(&self) -> &'static str;
}

/// Detect current platform and return boxed adapter.
pub fn current_platform() -> Box<dyn PlatformAdapter> {
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WindowsAdapter)
    }
    #[cfg(target_os = "linux")]
    {
        Box::new(linux::LinuxAdapter)
    }
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::MacosAdapter)
    }
    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        Box::new(linux::LinuxAdapter)
    }
}
