//! Generic LSP client: JSON-RPC over stdio.
//! Spawns language server as child process, handles initialization.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Stdio;
use tokio::process::{Child, Command};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LspServerConfig {
    pub language: String,
    pub command: String,
    pub args: Vec<String>,
    pub root_uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LspStatus {
    pub language: String,
    pub running: bool,
    pub pid: Option<u32>,
}

/// Manages multiple LSP servers (one per language).
pub struct LspManager {
    servers: HashMap<String, Child>,
    configs: HashMap<String, LspServerConfig>,
}

impl Default for LspManager {
    fn default() -> Self {
        Self::new()
    }
}

impl LspManager {
    pub fn new() -> Self {
        Self {
            servers: HashMap::new(),
            configs: HashMap::new(),
        }
    }

    /// Start LSP server for a language.
    pub async fn start(&mut self, config: LspServerConfig) -> Result<LspStatus, String> {
        if self.servers.contains_key(&config.language) {
            return Err(format!("LSP for {} already running", config.language));
        }
        let mut cmd = Command::new(&config.command);
        cmd.args(&config.args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let child = cmd.spawn().map_err(|e| format!("failed to spawn {}: {}", config.command, e))?;
        let pid = child.id();
        self.servers.insert(config.language.clone(), child);
        self.configs.insert(config.language.clone(), config.clone());
        Ok(LspStatus {
            language: config.language,
            running: true,
            pid,
        })
    }

    pub fn insert_child(&mut self, config: LspServerConfig, child: Child) {
        self.configs.insert(config.language.clone(), config.clone());
        self.servers.insert(config.language, child);
    }

    pub fn stop(&mut self, language: &str) -> Result<(), String> {
        if let Some(mut child) = self.servers.remove(language) {
            // Try to kill
            let _ = child.try_wait();
            // On drop, child is killed if still running? We attempt kill via start_kill
            let _ = child.start_kill();
            Ok(())
        } else {
            Err(format!("No LSP running for {}", language))
        }
    }

    pub fn status(&self, language: &str) -> LspStatus {
        if let Some(child) = self.servers.get(language) {
            LspStatus {
                language: language.to_string(),
                running: true,
                pid: child.id(),
            }
        } else {
            LspStatus {
                language: language.to_string(),
                running: false,
                pid: None,
            }
        }
    }

    pub fn all_status(&self) -> Vec<LspStatus> {
        let mut langs = std::collections::HashSet::new();
        for k in self.servers.keys() {
            langs.insert(k.clone());
        }
        for k in self.configs.keys() {
            langs.insert(k.clone());
        }
        langs
            .into_iter()
            .map(|l| self.status(&l))
            .collect()
    }
}

/// Helper: check if command exists on PATH.
pub fn is_command_available(cmd: &str) -> bool {
    which::which(cmd).is_ok()
}

/// Default configs per language.
pub fn default_lsp_config(language: &str, root_uri: &str) -> Option<LspServerConfig> {
    match language {
        "c" | "cpp" => Some(LspServerConfig {
            language: language.to_string(),
            command: "clangd".to_string(),
            args: vec![],
            root_uri: root_uri.to_string(),
        }),
        "python" => {
            // Prefer pylsp, fallback to pyright
            let cmd = if is_command_available("pylsp") {
                "pylsp"
            } else {
                "pyright-langserver"
            };
            let args = if cmd == "pyright-langserver" {
                vec!["--stdio".to_string()]
            } else {
                vec![]
            };
            Some(LspServerConfig {
                language: "python".to_string(),
                command: cmd.to_string(),
                args,
                root_uri: root_uri.to_string(),
            })
        }
        "java" => Some(LspServerConfig {
            language: "java".to_string(),
            command: "jdtls".to_string(),
            args: vec![],
            root_uri: root_uri.to_string(),
        }),
        _ => None,
    }
}
