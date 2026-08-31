/// terminal — Phase 5: TerminalService + PTY + ShellDetector
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ShellInfo {
    pub name: String,
    pub path: String,
    pub args: Vec<String>,
}

pub struct ShellDetector;

impl ShellDetector {
    pub fn detect() -> Vec<ShellInfo> {
        // Platform-specific shell detection (§18)
        if cfg!(windows) {
            vec![
                ShellInfo { name: "PowerShell".into(), path: "powershell.exe".into(), args: vec!["-NoLogo".into()] },
                ShellInfo { name: "cmd".into(), path: "cmd.exe".into(), args: vec![] },
                ShellInfo { name: "Git Bash".into(), path: "C:\\Program Files\\Git\\bin\\bash.exe".into(), args: vec![] },
                ShellInfo { name: "WSL".into(), path: "wsl.exe".into(), args: vec![] },
            ]
        } else if cfg!(target_os = "macos") {
            vec![
                ShellInfo { name: "zsh".into(), path: "/bin/zsh".into(), args: vec!["-l".into()] },
                ShellInfo { name: "bash".into(), path: "/bin/bash".into(), args: vec!["-l".into()] },
                ShellInfo { name: "fish".into(), path: "/usr/local/bin/fish".into(), args: vec!["-l".into()] },
            ]
        } else {
            // Linux/BSD
            vec![
                ShellInfo { name: "bash".into(), path: "/bin/bash".into(), args: vec![] },
                ShellInfo { name: "zsh".into(), path: "/bin/zsh".into(), args: vec![] },
                ShellInfo { name: "fish".into(), path: "/usr/bin/fish".into(), args: vec![] },
            ]
        }
    }

    pub fn default_shell() -> ShellInfo {
        Self::detect().into_iter().next().unwrap_or(ShellInfo { name: "sh".into(), path: "/bin/sh".into(), args: vec![] })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalSession {
    pub id: String,
    pub shell: ShellInfo,
    pub cwd: String,
    pub rows: u16,
    pub cols: u16,
}

pub struct PTYManager {
    sessions: HashMap<String, TerminalSession>,
    next_id: u32,
}

impl PTYManager {
    pub fn new() -> Self { Self { sessions: HashMap::new(), next_id: 1 } }
    pub fn create(&mut self, shell: Option<ShellInfo>, cwd: Option<String>) -> TerminalSession {
        let id = format!("term-{}", self.next_id);
        self.next_id += 1;
        let sess = TerminalSession {
            id: id.clone(),
            shell: shell.unwrap_or_else(ShellDetector::default_shell),
            cwd: cwd.unwrap_or_else(|| ".".into()),
            rows: 24,
            cols: 80,
        };
        self.sessions.insert(id, sess.clone());
        log::info!("PTY create {}", sess.id);
        sess
    }
    pub fn get(&self, id: &str) -> Option<&TerminalSession> { self.sessions.get(id) }
    pub fn list(&self) -> Vec<&TerminalSession> { self.sessions.values().collect() }
    pub fn close(&mut self, id: &str) { self.sessions.remove(id); }
    pub fn resize(&mut self, id: &str, rows: u16, cols: u16) {
        if let Some(s) = self.sessions.get_mut(id) { s.rows = rows; s.cols = cols; }
    }
}

pub struct TerminalService {
    pub pty: PTYManager,
}

impl TerminalService {
    pub fn new() -> Self { Self { pty: PTYManager::new() } }
    pub fn new_session(&mut self, shell: Option<ShellInfo>, cwd: Option<String>) -> TerminalSession {
        self.pty.create(shell, cwd)
    }
    pub fn shell_detector(&self) -> Vec<ShellInfo> { ShellDetector::detect() }
}

pub fn init() -> anyhow::Result<()> { log::info!("init terminal"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_shell_detect() {
        let shells = ShellDetector::detect();
        assert!(!shells.is_empty());
        assert!(ShellDetector::default_shell().path.len() > 0);
    }
    #[test]
    fn test_pty_create() {
        let mut m = PTYManager::new();
        let s1 = m.create(None, None);
        let s2 = m.create(None, Some("/tmp".into()));
        assert_ne!(s1.id, s2.id);
        assert_eq!(m.list().len(), 2);
        m.close(&s1.id);
        assert_eq!(m.list().len(), 1);
    }
}
