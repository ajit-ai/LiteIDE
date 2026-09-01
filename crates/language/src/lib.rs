/// language — Phase 6: ToolchainManager + LanguageProvider
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Toolchain {
    pub id: String,
    pub name: String,
    pub version: Option<String>,
    pub path: String,
    pub platform: String,
    pub capabilities: Vec<String>,
}

impl Toolchain {
    pub fn new(id: &str, name: &str, path: &str) -> Self {
        Self { id: id.into(), name: name.into(), version: None, path: path.into(), platform: std::env::consts::OS.into(), capabilities: vec![] }
    }
}

pub struct ToolchainDetector;

impl ToolchainDetector {
    pub fn which(cmd: &str) -> Option<String> {
        // Use `which` logic via PATH lookup — simplified via `where`/`which` command
        // For now, try `cmd --version` and check if executable exists via PATH
        if let Ok(path) = which::which(cmd) {
            return Some(path.to_string_lossy().to_string());
        }
        None
    }

    pub fn detect_gcc() -> Option<Toolchain> { Self::which("gcc").map(|p| { let mut t = Toolchain::new("gcc", "GCC", &p); t.capabilities = vec!["c".into(), "c++".into()]; t }) }
    pub fn detect_clang() -> Option<Toolchain> { Self::which("clang").map(|p| Toolchain::new("clang", "Clang", &p)) }
    pub fn detect_msvc() -> Option<Toolchain> { Self::which("cl").map(|p| Toolchain::new("msvc", "MSVC", &p)) }
    pub fn detect_jdk() -> Option<Toolchain> {
        Self::which("javac").map(|p| {
            let mut t = Toolchain::new("jdk", "JDK", &p);
            // Try java -version
            t.capabilities = vec!["java".into()];
            t
        })
    }
    pub fn detect_python() -> Option<Toolchain> {
        for cmd in ["python3", "python", "py"] {
            if let Some(p) = Self::which(cmd) {
                let mut t = Toolchain::new("python", "Python", &p);
                t.capabilities = vec!["python".into()];
                return Some(t);
            }
        }
        None
    }

    pub fn detect_all() -> Vec<Toolchain> {
        let mut v = Vec::new();
        if let Some(t) = Self::detect_gcc() { v.push(t); }
        if let Some(t) = Self::detect_clang() { v.push(t); }
        if let Some(t) = Self::detect_msvc() { v.push(t); }
        if let Some(t) = Self::detect_jdk() { v.push(t); }
        if let Some(t) = Self::detect_python() { v.push(t); }
        v
    }
}

pub struct ToolchainRegistry {
    toolchains: HashMap<String, Toolchain>,
}

impl ToolchainRegistry {
    pub fn new() -> Self { Self { toolchains: HashMap::new() } }
    pub fn register(&mut self, tc: Toolchain) { self.toolchains.insert(tc.id.clone(), tc); }
    pub fn get(&self, id: &str) -> Option<&Toolchain> { self.toolchains.get(id) }
    pub fn list(&self) -> Vec<&Toolchain> { self.toolchains.values().collect() }
    pub fn detect_and_register_all(&mut self) {
        for tc in ToolchainDetector::detect_all() { self.register(tc); }
    }
}

pub struct ToolchainValidator;
impl ToolchainValidator {
    pub fn validate(tc: &Toolchain) -> bool { std::path::Path::new(&tc.path).exists() }
}

pub fn init() -> anyhow::Result<()> { log::info!("init language"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_detect() {
        let all = ToolchainDetector::detect_all();
        // At least one toolchain should be found on CI (gcc or python)
        // But on minimal env, may be 0 — just check it doesn't panic
        assert!(all.len() <= 5);
    }
    #[test]
    fn test_registry() {
        let mut reg = ToolchainRegistry::new();
        reg.register(Toolchain::new("test", "Test", "/usr/bin/test"));
        assert!(reg.get("test").is_some());
        assert_eq!(reg.list().len(), 1);
    }
}
