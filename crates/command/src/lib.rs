/// command — Phase 4: CommandRegistry
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    pub id: String,
    pub title: String,
    pub category: String,
}

pub struct CommandRegistry {
    commands: HashMap<String, Command>,
}

impl CommandRegistry {
    pub fn new() -> Self { Self { commands: HashMap::new() } }

    pub fn register(&mut self, id: &str, title: &str, category: &str) -> anyhow::Result<()> {
        if self.commands.contains_key(id) { anyhow::bail!("command exists: {}", id); }
        self.commands.insert(id.into(), Command { id: id.into(), title: title.into(), category: category.into() });
        log::info!("register command {}", id);
        Ok(())
    }

    pub fn execute(&self, id: &str) -> anyhow::Result<String> {
        if self.commands.contains_key(id) { Ok(format!("executed {}", id)) } else { anyhow::bail!("unknown command {}", id) }
    }

    pub fn list(&self) -> Vec<&Command> { self.commands.values().collect() }
    pub fn has(&self, id: &str) -> bool { self.commands.contains_key(id) }
}

pub fn init() -> anyhow::Result<()> { log::info!("init command"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_register_execute() {
        let mut r = CommandRegistry::new();
        r.register("workspace.open", "Open Workspace", "workspace").unwrap();
        r.register("file.save", "Save File", "file").unwrap();
        r.register("build.run", "Run Build", "build").unwrap();
        assert!(r.has("file.save"));
        assert_eq!(r.execute("file.save").unwrap(), "executed file.save");
        assert!(r.execute("unknown").is_err());
    }
}
