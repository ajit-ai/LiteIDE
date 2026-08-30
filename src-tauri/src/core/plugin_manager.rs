use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadata {
    pub id: String,
    pub name: String,
    pub version: String,
    pub languages: Vec<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub plugins: Vec<PluginMetadata>,
}

/// Simple event bus for plugins (backend side mirrors frontend EventBusAPI).
#[derive(Default)]
pub struct EventBus {
    // event -> listeners (plugin ids)
    listeners: HashMap<String, Vec<String>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self { listeners: HashMap::new() }
    }

    pub fn on(&mut self, event: &str, plugin_id: &str) {
        self.listeners
            .entry(event.to_string())
            .or_default()
            .push(plugin_id.to_string());
    }

    pub fn off(&mut self, event: &str, plugin_id: &str) {
        if let Some(list) = self.listeners.get_mut(event) {
            list.retain(|id| id != plugin_id);
        }
    }

    pub fn emit(&self, event: &str) -> Vec<String> {
        self.listeners.get(event).cloned().unwrap_or_default()
    }
}

pub struct PluginManager {
    pub plugins: HashMap<String, PluginMetadata>,
    pub event_bus: EventBus,
}

impl Default for PluginManager {
    fn default() -> Self {
        Self::new()
    }
}

impl PluginManager {
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
            event_bus: EventBus::new(),
        }
    }

    pub fn register(&mut self, meta: PluginMetadata) -> Result<(), String> {
        if self.plugins.contains_key(&meta.id) {
            return Err(format!("Plugin {} already registered", meta.id));
        }
        self.plugins.insert(meta.id.clone(), meta);
        Ok(())
    }

    pub fn unregister(&mut self, id: &str) -> Result<(), String> {
        self.plugins
            .remove(id)
            .map(|_| ())
            .ok_or_else(|| format!("Plugin {} not found", id))
    }

    pub fn list(&self) -> Vec<&PluginMetadata> {
        self.plugins.values().collect()
    }

    pub fn get(&self, id: &str) -> Option<&PluginMetadata> {
        self.plugins.get(id)
    }

    /// Load built-in plugins manifest.
    pub fn load_builtin(&mut self) {
        let builtin = vec![
            PluginMetadata {
                id: "lang-c-cpp".to_string(),
                name: "C/C++ Language Support".to_string(),
                version: "0.1.0".to_string(),
                languages: vec!["c".to_string(), "cpp".to_string()],
                description: Some("clangd + gcc/clang for C/C++".to_string()),
            },
            PluginMetadata {
                id: "lang-java".to_string(),
                name: "Java Language Support".to_string(),
                version: "0.1.0".to_string(),
                languages: vec!["java".to_string()],
                description: Some("jdt.ls + javac for Java".to_string()),
            },
            PluginMetadata {
                id: "lang-python".to_string(),
                name: "Python Language Support".to_string(),
                version: "0.1.0".to_string(),
                languages: vec!["python".to_string()],
                description: Some("pylsp/pyright + python for Python".to_string()),
            },
        ];
        for p in builtin {
            let _ = self.register(p);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_register() {
        let mut pm = PluginManager::new();
        pm.load_builtin();
        assert_eq!(pm.list().len(), 3);
        assert!(pm.get("lang-python").is_some());
    }
    #[test]
    fn test_event_bus() {
        let mut eb = EventBus::new();
        eb.on("file:open", "lang-python");
        assert_eq!(eb.emit("file:open"), vec!["lang-python"]);
        eb.off("file:open", "lang-python");
        assert!(eb.emit("file:open").is_empty());
    }
}
