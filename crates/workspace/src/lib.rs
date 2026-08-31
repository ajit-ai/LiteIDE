/// workspace — Phase 2: WorkspaceManager + .ide/ TOML
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub root: PathBuf,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub id: String,
    pub root: String,
    pub name: String,
}

impl Default for WorkspaceConfig {
    fn default() -> Self { Self { id: "default".into(), root: ".".into(), name: "QuantsMind".into() } }
}

pub struct WorkspaceManager {
    current: Option<Workspace>,
}

impl WorkspaceManager {
    pub fn new() -> Self { Self { current: None } }

    pub fn open(&mut self, root: &Path) -> anyhow::Result<Workspace> {
        if !root.exists() { anyhow::bail!("root does not exist: {}", root.display()); }
        let id = root.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| "workspace".into());
        let ws = Workspace { id: id.clone(), root: root.to_path_buf(), name: id };
        // ensure .ide/ exists with default TOMLs
        let ide = root.join(".ide");
        std::fs::create_dir_all(&ide)?;
        for (name, content) in [
            ("workspace.toml", format!("[workspace]\nid=\"{}\"\nroot=\"{}\"\n", ws.id, ws.root.display())),
            ("settings.toml", "[settings]\ntheme=\"dark\"\n".into()),
            ("tasks.toml", "[tasks]\n# build tasks\n".into()),
            ("launch.toml", "[launch]\n# launch configs\n".into()),
        ] {
            let p = ide.join(name);
            if !p.exists() { std::fs::write(&p, content)?; }
        }
        self.current = Some(ws.clone());
        log::info!("workspace opened {}", ws.root.display());
        Ok(ws)
    }

    pub fn close(&mut self) { self.current = None; }
    pub fn current(&self) -> Option<&Workspace> { self.current.as_ref() }
    pub fn is_open(&self) -> bool { self.current.is_some() }
}

pub fn init() -> anyhow::Result<()> { log::info!("init workspace"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_open_close() {
        let dir = std::env::temp_dir().join("qmide_ws_test");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let mut m = WorkspaceManager::new();
        let ws = m.open(&dir).unwrap();
        assert!(ws.root == dir);
        assert!(m.is_open());
        assert!(dir.join(".ide/workspace.toml").exists());
        m.close();
        assert!(!m.is_open());
        let _ = std::fs::remove_dir_all(&dir);
    }
}
