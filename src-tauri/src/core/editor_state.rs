use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Buffer {
    pub path: String,
    pub content: String,
    pub dirty: bool,
    pub language: String,
}

impl Buffer {
    pub fn new(path: String, content: String) -> Self {
        let language = detect_language(&path);
        Self {
            path,
            content,
            dirty: false,
            language,
        }
    }
}

pub fn detect_language(path: &str) -> String {
    let lower = path.to_lowercase();
    if lower.ends_with(".c") {
        "c".to_string()
    } else if lower.ends_with(".cpp") || lower.ends_with(".cc") || lower.ends_with(".cxx") || lower.ends_with(".hpp") || lower.ends_with(".hh") {
        "cpp".to_string()
    } else if lower.ends_with(".java") {
        "java".to_string()
    } else if lower.ends_with(".py") {
        "python".to_string()
    } else if lower.ends_with(".rs") {
        "rust".to_string()
    } else if lower.ends_with(".js") || lower.ends_with(".ts") || lower.ends_with(".tsx") {
        "typescript".to_string()
    } else if lower.ends_with(".json") {
        "json".to_string()
    } else if lower.ends_with(".toml") {
        "toml".to_string()
    } else if lower.ends_with(".md") {
        "markdown".to_string()
    } else {
        "plaintext".to_string()
    }
}

/// In-memory buffer registry. In Tauri this will be managed via state.
#[derive(Debug, Default)]
pub struct EditorState {
    buffers: HashMap<String, Buffer>,
    recent_files: Vec<String>,
    max_recent: usize,
}

impl EditorState {
    pub fn new() -> Self {
        Self {
            buffers: HashMap::new(),
            recent_files: Vec::new(),
            max_recent: 20,
        }
    }

    pub fn open_buffer(&mut self, path: String, content: String) -> Buffer {
        let buf = Buffer::new(path.clone(), content);
        self.buffers.insert(path.clone(), buf.clone());
        self.touch_recent(path);
        buf
    }

    pub fn get_buffer(&self, path: &str) -> Option<&Buffer> {
        self.buffers.get(path)
    }

    pub fn update_buffer(&mut self, path: &str, content: String) {
        if let Some(buf) = self.buffers.get_mut(path) {
            buf.content = content;
            buf.dirty = true;
        }
    }

    pub fn mark_saved(&mut self, path: &str) {
        if let Some(buf) = self.buffers.get_mut(path) {
            buf.dirty = false;
        }
        self.touch_recent(path.to_string());
    }

    pub fn close_buffer(&mut self, path: &str) -> Option<Buffer> {
        self.buffers.remove(path)
    }

    pub fn all_buffers(&self) -> Vec<&Buffer> {
        self.buffers.values().collect()
    }

    pub fn recent_files(&self) -> &[String] {
        &self.recent_files
    }

    fn touch_recent(&mut self, path: String) {
        self.recent_files.retain(|p| p != &path);
        self.recent_files.insert(0, path);
        if self.recent_files.len() > self.max_recent {
            self.recent_files.truncate(self.max_recent);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_detect_language() {
        assert_eq!(detect_language("main.c"), "c");
        assert_eq!(detect_language("main.cpp"), "cpp");
        assert_eq!(detect_language("Main.java"), "java");
        assert_eq!(detect_language("script.py"), "python");
    }

    #[test]
    fn test_editor_state_dirty() {
        let mut s = EditorState::new();
        s.open_buffer("a.py".to_string(), "print(1)".to_string());
        assert!(!s.get_buffer("a.py").unwrap().dirty);
        s.update_buffer("a.py", "print(2)".to_string());
        assert!(s.get_buffer("a.py").unwrap().dirty);
        s.mark_saved("a.py");
        assert!(!s.get_buffer("a.py").unwrap().dirty);
    }
}
