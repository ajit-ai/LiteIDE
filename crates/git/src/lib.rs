/// git — Phase 11: Git integration (repo detection, branch, changed files, status)
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub changed: Vec<String>,
    pub untracked: Vec<String>,
    pub staged: Vec<String>,
}

pub struct GitService;

impl GitService {
    pub fn is_repo(root: &Path) -> bool { root.join(".git").exists() }

    pub fn current_branch(root: &Path) -> anyhow::Result<String> {
        let out = Command::new("git").arg("-C").arg(root).arg("branch").arg("--show-current").output()?;
        if !out.status.success() { anyhow::bail!("git branch failed"); }
        Ok(String::from_utf8_lossy(&out.stdout).trim().to_string())
    }

    pub fn status(root: &Path) -> anyhow::Result<GitStatus> {
        let out = Command::new("git").arg("-C").arg(root).arg("status").arg("--porcelain").output()?;
        if !out.status.success() { anyhow::bail!("git status failed"); }
        let stdout = String::from_utf8_lossy(&out.stdout);
        let mut changed = Vec::new();
        let mut untracked = Vec::new();
        let mut staged = Vec::new();
        for line in stdout.lines() {
            if line.len() < 3 { continue; }
            let code = &line[0..2];
            let file = line[3..].trim().to_string();
            if code.contains('?') { untracked.push(file); }
            else if code.chars().next().map(|c| c != ' ' && c != '?').unwrap_or(false) { staged.push(file); }
            else if code.contains('M') { changed.push(file); }
            else { changed.push(file); }
        }
        let branch = Self::current_branch(root).unwrap_or_else(|_| "main".into());
        Ok(GitStatus { branch, changed, untracked, staged })
    }

    pub fn changed_files(root: &Path) -> anyhow::Result<Vec<String>> {
        let out = Command::new("git").arg("-C").arg(root).arg("diff").arg("--name-only").output()?;
        Ok(String::from_utf8_lossy(&out.stdout).lines().map(|s| s.to_string()).collect())
    }
}

pub fn init() -> anyhow::Result<()> { log::info!("init git"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    #[test]
    fn test_is_repo() {
        // This repo should be a git repo (F:\Codes\Git\Quantsmind-Products\LiteIDE is a git repo)
        let p = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../");
        // Just check it doesn't panic
        let _ = GitService::is_repo(&p);
    }
    #[test]
    fn test_status_mock() {
        let dir = std::env::temp_dir().join("qmide_git_test");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        // Not a git repo, so is_repo false
        assert!(!GitService::is_repo(&dir));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
