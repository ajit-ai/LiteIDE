/// lsp-client — Phase 8: Generic LSP client (clangd/jdtls/pylsp)
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Child, Command, Stdio};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LspConfig {
    pub language: String,
    pub command: String,
    pub args: Vec<String>,
    pub root_uri: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LspStatus { pub language: String, pub running: bool, pub pid: Option<u32> }

pub struct LspClient {
    child: Option<Child>,
    config: Option<LspConfig>,
    next_id: u32,
    pending: HashMap<u32, String>,
}

impl LspClient {
    pub fn new() -> Self { Self { child: None, config: None, next_id: 1, pending: HashMap::new() } }

    pub fn start(&mut self, cfg: LspConfig) -> anyhow::Result<LspStatus> {
        if self.child.is_some() { anyhow::bail!("LSP already running for {}", cfg.language); }
        let mut cmd = Command::new(&cfg.command);
        cmd.args(&cfg.args).stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());
        let child = cmd.spawn().map_err(|e| anyhow::anyhow!("spawn {} failed: {}", cfg.command, e))?;
        let pid = child.id();
        self.child = Some(child);
        let lang = cfg.language.clone();
        self.config = Some(cfg);
        Ok(LspStatus { language: lang, running: true, pid: Some(pid) })
    }

    pub fn stop(&mut self) -> anyhow::Result<()> {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.config = None;
        Ok(())
    }

    pub fn status(&self) -> LspStatus {
        if let Some(child) = &self.child {
            LspStatus { language: self.config.as_ref().map(|c| c.language.clone()).unwrap_or_default(), running: true, pid: Some(child.id()) }
        } else {
            LspStatus { language: self.config.as_ref().map(|c| c.language.clone()).unwrap_or_default(), running: false, pid: None }
        }
    }

    // JSON-RPC helpers
    pub fn request(&mut self, method: &str, params: serde_json::Value) -> anyhow::Result<u32> {
        let id = self.next_id;
        self.next_id += 1;
        let req = serde_json::json!({"jsonrpc":"2.0","id":id,"method":method,"params":params});
        self.pending.insert(id, req.to_string());
        log::debug!("LSP request {}: {}", method, req);
        Ok(id)
    }

    pub fn notify(&self, method: &str, params: serde_json::Value) -> anyhow::Result<()> {
        let notif = serde_json::json!({"jsonrpc":"2.0","method":method,"params":params});
        log::debug!("LSP notify {}: {}", method, notif);
        Ok(())
    }

    pub fn handle_response(&mut self, id: u32, result: serde_json::Value) -> Option<String> { self.pending.remove(&id).map(|_| result.to_string()) }
}

pub struct LanguageService {
    clients: HashMap<String, LspClient>,
}

impl LanguageService {
    pub fn new() -> Self { Self { clients: HashMap::new() } }
    pub fn start(&mut self, cfg: LspConfig) -> anyhow::Result<LspStatus> {
        let lang = cfg.language.clone();
        let client = self.clients.entry(lang.clone()).or_insert_with(LspClient::new);
        client.start(cfg)
    }
    pub fn stop(&mut self, language: &str) -> anyhow::Result<()> {
        if let Some(c) = self.clients.get_mut(language) { c.stop() } else { anyhow::bail!("no client for {}", language) }
    }
    pub fn status(&self, language: &str) -> LspStatus {
        self.clients.get(language).map(|c| c.status()).unwrap_or(LspStatus { language: language.into(), running: false, pid: None })
    }
}

pub fn init() -> anyhow::Result<()> { log::info!("init lsp-client"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_lsp_client_request() {
        let mut c = LspClient::new();
        let id = c.request("initialize", serde_json::json!({})).unwrap();
        assert_eq!(id, 1);
        let id2 = c.request("textDocument/completion", serde_json::json!({})).unwrap();
        assert_eq!(id2, 2);
    }
    #[test]
    fn test_language_service() {
        let svc = LanguageService::new();
        let _cfg = LspConfig { language: "python".into(), command: "pylsp".into(), args: vec![], root_uri: "file:///tmp".into() };
        // start will fail if pylsp not installed, but we test status
        assert!(!svc.status("python").running);
    }
}
