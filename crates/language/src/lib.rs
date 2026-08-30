/// language - QuantsMind IDE (language) - Phase 0
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageConfig {
    pub enabled: bool,
}

impl Default for LanguageConfig {
    fn default() -> Self { Self { enabled: true } }
}

pub fn init() -> anyhow::Result<()> {
    log::info!("init language");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_init() { assert!(init().is_ok()); }
}
