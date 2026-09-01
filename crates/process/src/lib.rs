/// process — Phase 6: ProcessService
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Child;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessOptions {
    pub cwd: Option<String>,
    pub env: HashMap<String, String>,
    pub shell: bool,
}

impl Default for ProcessOptions {
    fn default() -> Self { Self { cwd: None, env: HashMap::new(), shell: false } }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub id: String,
    pub command: String,
    pub args: Vec<String>,
    pub cwd: Option<String>,
    pub exit_code: Option<i32>,
    pub running: bool,
}

pub struct ProcessService {
    processes: HashMap<String, Child>,
    next_id: u32,
}

impl ProcessService {
    pub fn new() -> Self { Self { processes: HashMap::new(), next_id: 1 } }

    pub fn spawn(&mut self, command: &str, args: &[String], opts: ProcessOptions) -> anyhow::Result<ProcessInfo> {
        let id = format!("proc-{}", self.next_id);
        self.next_id += 1;
        let mut cmd = std::process::Command::new(command);
        cmd.args(args);
        if let Some(cwd) = &opts.cwd { cmd.current_dir(cwd); }
        for (k, v) in &opts.env { cmd.env(k, v); }
        cmd.stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::piped());
        let child = cmd.spawn().map_err(|e| anyhow::anyhow!("spawn {} failed: {}", command, e))?;
        let info = ProcessInfo { id: id.clone(), command: command.into(), args: args.to_vec(), cwd: opts.cwd, exit_code: None, running: true };
        self.processes.insert(id, child);
        log::info!("spawn {} {:?}", command, args);
        Ok(info)
    }

    pub fn kill(&mut self, id: &str) -> anyhow::Result<()> {
        if let Some(mut child) = self.processes.remove(id) {
            let _ = child.kill();
            let _ = child.wait();
            log::info!("kill {}", id);
            Ok(())
        } else { anyhow::bail!("process not found: {}", id) }
    }

    pub fn list(&self) -> Vec<String> { self.processes.keys().cloned().collect() }
    pub fn is_running(&self, id: &str) -> bool { self.processes.contains_key(id) }
}

pub fn init() -> anyhow::Result<()> { log::info!("init process"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_spawn_kill() {
        let mut svc = ProcessService::new();
        // spawn a short-lived process (echo on Windows, true on Unix)
        let cmd = if cfg!(windows) { "cmd" } else { "sh" };
        let args = if cfg!(windows) { vec!["/C".into(), "echo hi".into()] } else { vec!["-c".into(), "echo hi".into()] };
        let info = svc.spawn(cmd, &args, ProcessOptions::default()).unwrap();
        assert!(svc.is_running(&info.id));
        // wait a bit then kill (should already have exited, but kill should not panic)
        std::thread::sleep(std::time::Duration::from_millis(200));
        let _ = svc.kill(&info.id);
    }
}
