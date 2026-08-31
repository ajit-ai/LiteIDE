/// configuration — Phase 2: Configuration Service (.ide/*.toml)
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalSettings { pub theme: String, pub font_size: u32 }
impl Default for GlobalSettings { fn default()->Self{Self{theme:"dark".into(),font_size:14}} }

pub fn ide_dir(root: &Path) -> PathBuf { root.join(".ide") }
pub fn workspace_toml(root: &Path) -> PathBuf { ide_dir(root).join("workspace.toml") }
pub fn settings_toml(root: &Path) -> PathBuf { ide_dir(root).join("settings.toml") }

pub fn ensure_ide_dir(root: &Path) -> anyhow::Result<()> { std::fs::create_dir_all(ide_dir(root)).map_err(|e|e.into()) }

pub fn init() -> anyhow::Result<()> { log::info!("init configuration"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_ide_dir() {
        let p = Path::new("/tmp/proj");
        let ide = ide_dir(p);
        assert!(ide.ends_with(".ide"));
        assert!(ide.to_string_lossy().contains("proj"));
    }
}
