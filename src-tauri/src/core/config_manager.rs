use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalConfig {
    pub theme: String,
    pub font_family: String,
    pub font_size: u32,
    pub auto_save_interval: u32,
    pub keybindings: HashMap<String, String>,
    pub lsp: HashMap<String, LspSettings>,
    pub recent_projects: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LspSettings {
    pub enabled: bool,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
}

impl Default for GlobalConfig {
    fn default() -> Self {
        let mut keybindings = HashMap::new();
        keybindings.insert("commandPalette".to_string(), "Ctrl+Shift+P".to_string());
        keybindings.insert("save".to_string(), "Ctrl+S".to_string());
        keybindings.insert("build".to_string(), "Ctrl+B".to_string());
        keybindings.insert("run".to_string(), "Ctrl+R".to_string());
        keybindings.insert("find".to_string(), "Ctrl+F".to_string());

        let mut lsp = HashMap::new();
        lsp.insert(
            "c".to_string(),
            LspSettings { enabled: true, command: Some("clangd".to_string()), args: None },
        );
        lsp.insert(
            "cpp".to_string(),
            LspSettings { enabled: true, command: Some("clangd".to_string()), args: None },
        );
        lsp.insert(
            "python".to_string(),
            LspSettings { enabled: true, command: Some("pylsp".to_string()), args: None },
        );
        lsp.insert(
            "java".to_string(),
            LspSettings { enabled: true, command: Some("jdtls".to_string()), args: None },
        );

        Self {
            theme: "dark".to_string(),
            font_family: "JetBrains Mono, Consolas, monospace".to_string(),
            font_size: 14,
            auto_save_interval: 1000,
            keybindings,
            lsp,
            recent_projects: vec![],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProjectConfig {
    pub build_command: Option<String>,
    pub run_command: Option<String>,
    pub language: Option<String>,
    pub env: Option<HashMap<String, String>>,
}

fn global_config_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("LiteIDE")
        .join("config.toml")
}

fn project_config_path(project_root: &str) -> PathBuf {
    Path::new(project_root).join(".liteidrc")
}

pub fn load_global_config() -> GlobalConfig {
    let path = global_config_path();
    if path.exists() {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(cfg) = toml::from_str::<GlobalConfig>(&content) {
                return cfg;
            }
        }
    }
    GlobalConfig::default()
}

pub fn save_global_config(cfg: &GlobalConfig) -> Result<(), String> {
    let path = global_config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = toml::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())
}

pub fn load_project_config(project_root: &str) -> Option<ProjectConfig> {
    let path = project_config_path(project_root);
    if path.exists() {
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(cfg) = serde_json::from_str::<ProjectConfig>(&content) {
                return Some(cfg);
            }
        }
    }
    None
}

pub fn save_project_config(project_root: &str, cfg: &ProjectConfig) -> Result<(), String> {
    let path = project_config_path(project_root);
    let content = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_default_config() {
        let cfg = GlobalConfig::default();
        assert_eq!(cfg.theme, "dark");
        assert!(cfg.lsp.contains_key("python"));
    }
}
