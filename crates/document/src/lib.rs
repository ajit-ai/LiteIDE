/// document — Phase 2: DocumentManager
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Document {
    pub id: String,
    pub uri: String,
    pub language_id: String,
    pub content: String,
    pub version: u32,
    pub dirty: bool,
    pub encoding: String,
}

impl Document {
    pub fn new(uri: &str, language: &str, content: &str) -> Self {
        Self { id: uri.to_string(), uri: uri.to_string(), language_id: language.into(), content: content.into(), version: 1, dirty: false, encoding: "utf8".into() }
    }
}

pub struct DocumentManager {
    docs: HashMap<String, Document>,
}

impl DocumentManager {
    pub fn new() -> Self { Self { docs: HashMap::new() } }
    pub fn open(&mut self, uri: &str, language: &str, content: &str) -> Document {
        let doc = Document::new(uri, language, content);
        self.docs.insert(uri.into(), doc.clone());
        doc
    }
    pub fn close(&mut self, uri: &str) { self.docs.remove(uri); }
    pub fn get(&self, uri: &str) -> Option<&Document> { self.docs.get(uri) }
    pub fn get_mut(&mut self, uri: &str) -> Option<&mut Document> { self.docs.get_mut(uri) }
    pub fn edit(&mut self, uri: &str, content: &str) {
        if let Some(d)=self.docs.get_mut(uri) { d.content=content.into(); d.version+=1; d.dirty=true; }
    }
    pub fn save(&mut self, uri: &str) { if let Some(d)=self.docs.get_mut(uri){ d.dirty=false; } }
    pub fn is_dirty(&self, uri: &str) -> bool { self.docs.get(uri).map(|d|d.dirty).unwrap_or(false) }
    pub fn all(&self) -> Vec<&Document> { self.docs.values().collect() }
}

pub fn init() -> anyhow::Result<()> { log::info!("init document"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_open_edit_save() {
        let mut m = DocumentManager::new();
        m.open("file:///a.py", "python", "print(1)");
        assert!(!m.is_dirty("file:///a.py"));
        m.edit("file:///a.py", "print(2)");
        assert!(m.is_dirty("file:///a.py"));
        m.save("file:///a.py");
        assert!(!m.is_dirty("file:///a.py"));
    }
}
