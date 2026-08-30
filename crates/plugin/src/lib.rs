/// plugin - QuantsMind IDE (plugin) - Phase 0
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginConfig {
    pub enabled: bool,
}

impl Default for PluginConfig {
    fn default() -> Self { Self { enabled: true } }
}

pub fn init() -> anyhow::Result<()> {
    log::info!("init plugin");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_init() { assert!(init().is_ok()); }
}
