/// debug — Phase 9: DAP client + DebugService
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Breakpoint {
    pub id: String,
    pub uri: String,
    pub line: u32,
    pub enabled: bool,
    pub condition: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackFrame {
    pub id: u32,
    pub name: String,
    pub source: String,
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variable {
    pub name: String,
    pub value: String,
    pub ty: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DebugState {
    Inactive,
    Running,
    Paused,
    Stopped,
}

pub struct DapClient {
    next_id: u32,
    pending: HashMap<u32, String>,
    running: bool,
}

impl DapClient {
    pub fn new() -> Self { Self { next_id: 1, pending: HashMap::new(), running: false } }
    pub fn start(&mut self, adapter: &str) -> anyhow::Result<()> {
        log::info!("DAP start adapter {}", adapter);
        self.running = true;
        Ok(())
    }
    pub fn stop(&mut self) -> anyhow::Result<()> { self.running = false; Ok(()) }
    pub fn is_running(&self) -> bool { self.running }
    pub fn request(&mut self, command: &str, args: serde_json::Value) -> anyhow::Result<u32> {
        let id = self.next_id;
        self.next_id += 1;
        let req = serde_json::json!({"seq":id,"type":"request","command":command,"arguments":args});
        self.pending.insert(id, req.to_string());
        log::debug!("DAP request {}: {}", command, req);
        Ok(id)
    }
    pub fn handle_response(&mut self, id: u32, body: serde_json::Value) -> Option<String> { self.pending.remove(&id).map(|_| body.to_string()) }
}

pub struct DebugService {
    pub dap: DapClient,
    pub breakpoints: HashMap<String, Vec<Breakpoint>>,
    pub state: DebugState,
    pub stack: Vec<StackFrame>,
    pub variables: HashMap<String, Vec<Variable>>,
    next_bp_id: u32,
}

impl DebugService {
    pub fn new() -> Self {
        Self { dap: DapClient::new(), breakpoints: HashMap::new(), state: DebugState::Inactive, stack: vec![], variables: HashMap::new(), next_bp_id: 1 }
    }

    pub fn add_breakpoint(&mut self, uri: &str, line: u32) -> Breakpoint {
        let bp = Breakpoint { id: format!("bp-{}", self.next_bp_id), uri: uri.into(), line, enabled: true, condition: None };
        self.next_bp_id += 1;
        self.breakpoints.entry(uri.into()).or_default().push(bp.clone());
        log::info!("breakpoint added {}:{}", uri, line);
        bp
    }

    pub fn remove_breakpoint(&mut self, id: &str) {
        for bps in self.breakpoints.values_mut() { bps.retain(|b| b.id != id); }
    }

    pub fn toggle_breakpoint(&mut self, uri: &str, line: u32) -> Option<Breakpoint> {
        if let Some(bps) = self.breakpoints.get_mut(uri) {
            if let Some(pos) = bps.iter().position(|b| b.line == line) {
                let bp = bps.remove(pos);
                return None;
            }
        }
        Some(self.add_breakpoint(uri, line))
    }

    pub fn start(&mut self, adapter: &str) -> anyhow::Result<()> {
        self.dap.start(adapter)?;
        self.state = DebugState::Running;
        Ok(())
    }

    pub fn stop(&mut self) -> anyhow::Result<()> {
        self.dap.stop()?;
        self.state = DebugState::Stopped;
        Ok(())
    }

    pub fn continue_execution(&mut self) -> anyhow::Result<u32> { self.dap.request("continue", serde_json::json!({})) }
    pub fn pause(&mut self) -> anyhow::Result<u32> { self.dap.request("pause", serde_json::json!({})) }
    pub fn step_over(&mut self) -> anyhow::Result<u32> { self.dap.request("next", serde_json::json!({})) }
    pub fn step_into(&mut self) -> anyhow::Result<u32> { self.dap.request("stepIn", serde_json::json!({})) }
    pub fn step_out(&mut self) -> anyhow::Result<u32> { self.dap.request("stepOut", serde_json::json!({})) }

    pub fn get_breakpoints(&self, uri: &str) -> Vec<&Breakpoint> { self.breakpoints.get(uri).map(|v| v.iter().collect()).unwrap_or_default() }
    pub fn all_breakpoints(&self) -> Vec<&Breakpoint> { self.breakpoints.values().flat_map(|v| v.iter()).collect() }
}

pub fn init() -> anyhow::Result<()> { log::info!("init debug"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_breakpoint() {
        let mut svc = DebugService::new();
        let bp = svc.add_breakpoint("file:///a.c", 10);
        assert_eq!(bp.line, 10);
        assert_eq!(svc.get_breakpoints("file:///a.c").len(), 1);
        svc.remove_breakpoint(&bp.id);
        assert_eq!(svc.get_breakpoints("file:///a.c").len(), 0);
    }
    #[test]
    fn test_dap() {
        let mut svc = DebugService::new();
        svc.start("gdb").unwrap();
        assert!(matches!(svc.state, DebugState::Running));
        svc.stop().unwrap();
        assert!(matches!(svc.state, DebugState::Stopped));
    }
}
