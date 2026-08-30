/// ide-core - QuantsMind IDE (ide-core) - Phase 0
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdeCoreConfig {
    pub enabled: bool,
}

impl Default for IdeCoreConfig {
    fn default() -> Self { Self { enabled: true } }
}

pub fn init() -> anyhow::Result<()> {
    log::info!("init ide-core");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_init() { assert!(init().is_ok()); }
}
