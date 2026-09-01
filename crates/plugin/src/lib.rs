/// plugin — Phase 10: PluginManager + manifest + lifecycle + permission
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub plugin: PluginMeta,
    pub capabilities: PluginCapabilities,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMeta {
    pub id: String,
    pub name: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PluginCapabilities {
    pub languages: bool,
    pub build: bool,
    pub debug: bool,
    pub commands: bool,
}

impl PluginManifest {
    pub fn from_toml(s: &str) -> anyhow::Result<Self> { Ok(toml::from_str(s)?) }
    pub fn to_toml(&self) -> anyhow::Result<String> { Ok(toml::to_string(self)?) }
}

#[derive(Debug, Clone, PartialEq)]
pub enum PluginState {
    Installed,
    Active,
    Inactive,
    Failed(String),
}

pub struct PluginRegistry {
    plugins: HashMap<String, PluginManifest>,
    states: HashMap<String, PluginState>,
}

impl PluginRegistry {
    pub fn new() -> Self { Self { plugins: HashMap::new(), states: HashMap::new() } }
    pub fn register(&mut self, manifest: PluginManifest) -> anyhow::Result<()> {
        let id = manifest.plugin.id.clone();
        if self.plugins.contains_key(&id) { anyhow::bail!("plugin exists: {}", id); }
        self.plugins.insert(id.clone(), manifest);
        self.states.insert(id, PluginState::Installed);
        Ok(())
    }
    pub fn get(&self, id: &str) -> Option<&PluginManifest> { self.plugins.get(id) }
    pub fn list(&self) -> Vec<&PluginManifest> { self.plugins.values().collect() }
    pub fn state(&self, id: &str) -> Option<&PluginState> { self.states.get(id) }
    pub fn set_state(&mut self, id: &str, state: PluginState) { self.states.insert(id.into(), state); }
}

pub struct PluginLoader;
impl PluginLoader {
    pub fn load_from_toml(toml_str: &str) -> anyhow::Result<PluginManifest> { PluginManifest::from_toml(toml_str) }
}

pub struct PluginLifecycle;
impl PluginLifecycle {
    pub fn activate(registry: &mut PluginRegistry, id: &str) -> anyhow::Result<()> {
        if registry.get(id).is_none() { anyhow::bail!("plugin not found: {}", id); }
        registry.set_state(id, PluginState::Active);
        log::info!("activate plugin {}", id);
        Ok(())
    }
    pub fn deactivate(registry: &mut PluginRegistry, id: &str) -> anyhow::Result<()> {
        registry.set_state(id, PluginState::Inactive);
        log::info!("deactivate plugin {}", id);
        Ok(())
    }
}

pub struct PermissionManager {
    allowed: HashMap<String, Vec<String>>, // plugin id -> permissions
}

impl PermissionManager {
    pub fn new() -> Self { Self { allowed: HashMap::new() } }
    pub fn grant(&mut self, plugin: &str, perm: &str) { self.allowed.entry(plugin.into()).or_default().push(perm.into()); }
    pub fn check(&self, plugin: &str, perm: &str) -> bool { self.allowed.get(plugin).map(|v| v.contains(&perm.to_string())).unwrap_or(false) }
}

pub struct PluginManager {
    pub registry: PluginRegistry,
    pub permissions: PermissionManager,
}

impl PluginManager {
    pub fn new() -> Self { Self { registry: PluginRegistry::new(), permissions: PermissionManager::new() } }
}

pub fn init() -> anyhow::Result<()> { log::info!("init plugin"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_manifest() {
        let toml = r#"
[plugin]
id = "quantsmind.language.example"
name = "Example Language"
version = "0.1.0"

[capabilities]
languages = true
build = true
debug = false
commands = true
"#;
        let m = PluginManifest::from_toml(toml).unwrap();
        assert_eq!(m.plugin.id, "quantsmind.language.example");
        assert!(m.capabilities.languages);
    }
    #[test]
    fn test_registry_lifecycle() {
        let mut reg = PluginRegistry::new();
        let m = PluginManifest { plugin: PluginMeta { id: "test".into(), name: "Test".into(), version: "0.1.0".into() }, capabilities: PluginCapabilities { languages: true, ..Default::default() } };
        reg.register(m).unwrap();
        assert_eq!(reg.state("test"), Some(&PluginState::Installed));
        PluginLifecycle::activate(&mut reg, "test").unwrap();
        assert_eq!(reg.state("test"), Some(&PluginState::Active));
    }
}
