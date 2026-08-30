use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProject {
    pub path: String,
    pub last_opened: u64,
}

/// List directory entries (non-recursive, sorted: dirs first).
pub fn list_dir(path: &str) -> Result<Vec<FileEntry>, String> {
    let p = Path::new(path);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    let mut entries: Vec<FileEntry> = std::fs::read_dir(p)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .map(|e| {
            let is_dir = e.file_type().map(|t| t.is_dir()).unwrap_or(false);
            FileEntry {
                name: e.file_name().to_string_lossy().to_string(),
                path: e.path().to_string_lossy().to_string(),
                is_dir,
                children: None,
            }
        })
        .collect();

    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(entries)
}

/// Recursively build file tree with depth limit.
pub fn file_tree(path: &str, max_depth: usize) -> Result<FileEntry, String> {
    let root = Path::new(path);
    if !root.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    Ok(build_tree(root, 0, max_depth))
}

fn build_tree(path: &Path, depth: usize, max_depth: usize) -> FileEntry {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());
    let is_dir = path.is_dir();
    let children = if is_dir && depth < max_depth {
        let mut kids: Vec<FileEntry> = std::fs::read_dir(path)
            .ok()
            .map(|rd| {
                rd.filter_map(|e| e.ok())
                    .map(|e| build_tree(&e.path(), depth + 1, max_depth))
                    .collect()
            })
            .unwrap_or_default();
        kids.sort_by(|a, b| match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });
        Some(kids)
    } else {
        None
    };
    FileEntry {
        name,
        path: path.to_string_lossy().to_string(),
        is_dir,
        children,
    }
}

/// Read file content as string.
pub fn read_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

/// Write file content.
pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(path, content).map_err(|e| e.to_string())
}

/// Create file or directory.
pub fn create_entry(path: &str, is_dir: bool) -> Result<(), String> {
    if is_dir {
        std::fs::create_dir_all(path).map_err(|e| e.to_string())
    } else {
        if let Some(parent) = Path::new(path).parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        std::fs::File::create(path)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}

pub fn delete_entry(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if p.is_dir() {
        std::fs::remove_dir_all(p).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(p).map_err(|e| e.to_string())
    }
}

pub fn rename_entry(from: &str, to: &str) -> Result<(), String> {
    std::fs::rename(from, to).map_err(|e| e.to_string())
}

/// Text search across project (simple grep).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub file: String,
    pub line: usize,
    pub content: String,
}

pub fn search_in_files(root: &str, query: &str, max_results: usize) -> Result<Vec<SearchResult>, String> {
    if query.is_empty() {
        return Ok(vec![]);
    }
    let mut results = Vec::new();
    for entry in WalkDir::new(root)
        .max_depth(12)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        // Skip hidden/binary heavy dirs
        let path_str = entry.path().to_string_lossy().to_string();
        if path_str.contains(".git") || path_str.contains("node_modules") || path_str.contains("target") {
            continue;
        }
        if let Ok(content) = std::fs::read_to_string(entry.path()) {
            for (idx, line) in content.lines().enumerate() {
                if line.contains(query) {
                    results.push(SearchResult {
                        file: path_str.clone(),
                        line: idx + 1,
                        content: line.trim().to_string(),
                    });
                    if results.len() >= max_results {
                        return Ok(results);
                    }
                }
            }
        }
    }
    Ok(results)
}

/// Return normalized absolute path
pub fn normalize_path(path: &str) -> String {
    PathBuf::from(path).to_string_lossy().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_create_and_read() {
        let dir = std::env::temp_dir().join("liteide_test_filemgr");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("hello.txt");
        write_file(file.to_str().unwrap(), "hello world").unwrap();
        let content = read_file(file.to_str().unwrap()).unwrap();
        assert_eq!(content, "hello world");
        let entries = list_dir(dir.to_str().unwrap()).unwrap();
        assert_eq!(entries.len(), 1);
        delete_entry(file.to_str().unwrap()).unwrap();
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_search() {
        let dir = std::env::temp_dir().join("liteide_test_search");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("a.txt");
        write_file(file.to_str().unwrap(), "foo bar\nhello foo\nbaz").unwrap();
        let res = search_in_files(dir.to_str().unwrap(), "foo", 10).unwrap();
        assert_eq!(res.len(), 2);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
