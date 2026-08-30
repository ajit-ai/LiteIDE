/// event-bus - QuantsMind IDE (event-bus) - Phase 0
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventBusConfig {
    pub enabled: bool,
}

impl Default for EventBusConfig {
    fn default() -> Self { Self { enabled: true } }
}

pub fn init() -> anyhow::Result<()> {
    log::info!("init event-bus");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_init() { assert!(init().is_ok()); }
}
