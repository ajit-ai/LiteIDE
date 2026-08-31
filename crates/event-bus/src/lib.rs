/// event-bus — Phase 4: Typed events
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum IDEEvent {
    WorkspaceOpened { path: String },
    WorkspaceClosed,
    FileOpened { uri: String },
    FileSaved { uri: String },
    FileClosed { uri: String },
    BuildStarted { task: String },
    BuildCompleted { task: String },
    BuildFailed { task: String, error: String },
    DebugStarted,
    DebugStopped,
    TerminalCreated { id: String },
    TerminalClosed { id: String },
    LanguageServerStarted { language: String },
    LanguageServerStopped { language: String },
}

pub struct EventBus {
    listeners: HashMap<String, Vec<String>>, // event type -> handler ids (simplified)
}

impl EventBus {
    pub fn new() -> Self { Self { listeners: HashMap::new() } }
    pub fn on(&mut self, event: &str, handler: &str) { self.listeners.entry(event.into()).or_default().push(handler.into()); }
    pub fn emit(&self, event: &IDEEvent) -> Vec<String> {
        let key = match event {
            IDEEvent::WorkspaceOpened{..} => "WorkspaceOpened",
            IDEEvent::WorkspaceClosed => "WorkspaceClosed",
            IDEEvent::FileOpened{..} => "FileOpened",
            IDEEvent::FileSaved{..} => "FileSaved",
            IDEEvent::FileClosed{..} => "FileClosed",
            IDEEvent::BuildStarted{..} => "BuildStarted",
            IDEEvent::BuildCompleted{..} => "BuildCompleted",
            IDEEvent::BuildFailed{..} => "BuildFailed",
            IDEEvent::DebugStarted => "DebugStarted",
            IDEEvent::DebugStopped => "DebugStopped",
            IDEEvent::TerminalCreated{..} => "TerminalCreated",
            IDEEvent::TerminalClosed{..} => "TerminalClosed",
            IDEEvent::LanguageServerStarted{..} => "LanguageServerStarted",
            IDEEvent::LanguageServerStopped{..} => "LanguageServerStopped",
        };
        self.listeners.get(key).cloned().unwrap_or_default()
    }
}

pub fn init() -> anyhow::Result<()> { log::info!("init event-bus"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_emit() {
        let mut bus = EventBus::new();
        bus.on("FileOpened", "handler1");
        let ev = IDEEvent::FileOpened { uri: "file:///a.py".into() };
        let handlers = bus.emit(&ev);
        assert_eq!(handlers, vec!["handler1"]);
    }
}
