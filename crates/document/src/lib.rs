/// document - QuantsMind IDE (document) - Phase 0
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentConfig {
    pub enabled: bool,
}

impl Default for DocumentConfig {
    fn default() -> Self { Self { enabled: true } }
}

pub fn init() -> anyhow::Result<()> {
    log::info!("init document");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_init() { assert!(init().is_ok()); }
}
