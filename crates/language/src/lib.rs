/// language — Phase 6 Toolchain + Phase 8 LanguageProvider
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

// Keep Toolchain types from Phase 6
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Toolchain {
    pub id: String, pub name: String, pub version: Option<String>, pub path: String, pub platform: String, pub capabilities: Vec<String>,
}
impl Toolchain {
    pub fn new(id: &str, name: &str, path: &str) -> Self { Self { id: id.into(), name: name.into(), version: None, path: path.into(), platform: std::env::consts::OS.into(), capabilities: vec![] } }
}
pub struct ToolchainDetector;
impl ToolchainDetector {
    pub fn which(cmd: &str) -> Option<String> { which::which(cmd).ok().map(|p| p.to_string_lossy().to_string()) }
    pub fn detect_gcc() -> Option<Toolchain> { Self::which("gcc").map(|p| { let mut t=Toolchain::new("gcc","GCC",&p); t.capabilities=vec!["c".into(),"c++".into()]; t }) }
    pub fn detect_clang() -> Option<Toolchain> { Self::which("clang").map(|p| Toolchain::new("clang","Clang",&p)) }
    pub fn detect_msvc() -> Option<Toolchain> { Self::which("cl").map(|p| Toolchain::new("msvc","MSVC",&p)) }
    pub fn detect_jdk() -> Option<Toolchain> { Self::which("javac").map(|p| {let mut t=Toolchain::new("jdk","JDK",&p); t.capabilities=vec!["java".into()]; t}) }
    pub fn detect_python() -> Option<Toolchain> { for cmd in ["python3","python","py"] { if let Some(p)=Self::which(cmd){let mut t=Toolchain::new("python","Python",&p); t.capabilities=vec!["python".into()]; return Some(t);} } None }
    pub fn detect_all() -> Vec<Toolchain> { let mut v=Vec::new(); if let Some(t)=Self::detect_gcc(){v.push(t);} if let Some(t)=Self::detect_clang(){v.push(t);} if let Some(t)=Self::detect_msvc(){v.push(t);} if let Some(t)=Self::detect_jdk(){v.push(t);} if let Some(t)=Self::detect_python(){v.push(t);} v }
}
pub struct ToolchainRegistry { toolchains: HashMap<String, Toolchain>, }
impl ToolchainRegistry {
    pub fn new() -> Self { Self { toolchains: HashMap::new() } }
    pub fn register(&mut self, tc: Toolchain) { self.toolchains.insert(tc.id.clone(), tc); }
    pub fn get(&self, id: &str) -> Option<&Toolchain> { self.toolchains.get(id) }
    pub fn list(&self) -> Vec<&Toolchain> { self.toolchains.values().collect() }
    pub fn detect_and_register_all(&mut self) { for tc in ToolchainDetector::detect_all(){ self.register(tc); } }
}
pub struct ToolchainValidator;
impl ToolchainValidator { pub fn validate(tc: &Toolchain) -> bool { Path::new(&tc.path).exists() } }

// Phase 8: LanguageProvider
pub trait LanguageProvider: Send + Sync {
    fn language_id(&self) -> &str;
    fn file_extensions(&self) -> &[&str];
    fn detect_project(&self, root: &Path) -> bool;
    fn start_language_server(&self) -> anyhow::Result<String>; // returns server id
    fn stop_language_server(&self) -> anyhow::Result<()>;
    fn configuration(&self) -> serde_json::Value;
    fn build_configuration(&self) -> Option<String>;
    fn debug_configuration(&self) -> Option<String>;
}

pub struct CLanguageProvider;
impl LanguageProvider for CLanguageProvider {
    fn language_id(&self) -> &str { "c" }
    fn file_extensions(&self) -> &[&str] { &[".c", ".h"] }
    fn detect_project(&self, root: &Path) -> bool { root.join("CMakeLists.txt").exists() || has_ext(root, &[".c"]) }
    fn start_language_server(&self) -> anyhow::Result<String> { Ok("clangd".into()) }
    fn stop_language_server(&self) -> anyhow::Result<()> { Ok(()) }
    fn configuration(&self) -> serde_json::Value { serde_json::json!({"language":"c","server":"clangd"}) }
    fn build_configuration(&self) -> Option<String> { Some("gcc -o {output} {file}".into()) }
    fn debug_configuration(&self) -> Option<String> { Some("gdb".into()) }
}

pub struct CppLanguageProvider;
impl LanguageProvider for CppLanguageProvider {
    fn language_id(&self) -> &str { "cpp" }
    fn file_extensions(&self) -> &[&str] { &[".cpp",".cc",".cxx",".hpp"] }
    fn detect_project(&self, root: &Path) -> bool { root.join("CMakeLists.txt").exists() || has_ext(root, &[".cpp",".cc"]) }
    fn start_language_server(&self) -> anyhow::Result<String> { Ok("clangd".into()) }
    fn stop_language_server(&self) -> anyhow::Result<()> { Ok(()) }
    fn configuration(&self) -> serde_json::Value { serde_json::json!({"language":"cpp","server":"clangd","std":"c++17"}) }
    fn build_configuration(&self) -> Option<String> { Some("g++ -std=c++17 -o {output} {file}".into()) }
    fn debug_configuration(&self) -> Option<String> { Some("gdb".into()) }
}

pub struct JavaLanguageProvider;
impl LanguageProvider for JavaLanguageProvider {
    fn language_id(&self) -> &str { "java" }
    fn file_extensions(&self) -> &[&str] { &[".java"] }
    fn detect_project(&self, root: &Path) -> bool { root.join("pom.xml").exists() || root.join("build.gradle").exists() || has_ext(root, &[".java"]) }
    fn start_language_server(&self) -> anyhow::Result<String> { Ok("jdtls".into()) }
    fn stop_language_server(&self) -> anyhow::Result<()> { Ok(()) }
    fn configuration(&self) -> serde_json::Value { serde_json::json!({"language":"java","server":"jdtls"}) }
    fn build_configuration(&self) -> Option<String> { Some("javac {file} && java {MainClass}".into()) }
    fn debug_configuration(&self) -> Option<String> { Some("java-debug".into()) }
}

pub struct PythonLanguageProvider;
impl LanguageProvider for PythonLanguageProvider {
    fn language_id(&self) -> &str { "python" }
    fn file_extensions(&self) -> &[&str] { &[".py"] }
    fn detect_project(&self, root: &Path) -> bool { root.join("requirements.txt").exists() || root.join("pyproject.toml").exists() || has_ext(root, &[".py"]) }
    fn start_language_server(&self) -> anyhow::Result<String> { Ok("pylsp".into()) }
    fn stop_language_server(&self) -> anyhow::Result<()> { Ok(()) }
    fn configuration(&self) -> serde_json::Value { serde_json::json!({"language":"python","server":"pylsp","venv":".venv"}) }
    fn build_configuration(&self) -> Option<String> { Some("python {file}".into()) }
    fn debug_configuration(&self) -> Option<String> { Some("debugpy".into()) }
}

fn has_ext(root: &Path, exts: &[&str]) -> bool {
    if let Ok(entries) = std::fs::read_dir(root) {
        for e in entries.flatten() {
            if let Some(name) = e.file_name().to_str() {
                for ext in exts { if name.ends_with(ext) { return true; } }
            }
        }
    }
    false
}

pub fn all_providers() -> Vec<Box<dyn LanguageProvider>> {
    vec![Box::new(CLanguageProvider), Box::new(CppLanguageProvider), Box::new(JavaLanguageProvider), Box::new(PythonLanguageProvider)]
}

pub fn init() -> anyhow::Result<()> { log::info!("init language"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_providers() {
        let providers = all_providers();
        assert_eq!(providers.len(), 4);
        assert_eq!(providers[0].language_id(), "c");
        assert_eq!(providers[2].language_id(), "java");
        assert!(providers[3].file_extensions().contains(&".py"));
    }
    #[test]
    fn test_toolchain() {
        let mut reg = ToolchainRegistry::new();
        reg.register(Toolchain::new("test","Test","/usr/bin/test"));
        assert!(reg.get("test").is_some());
    }
}
