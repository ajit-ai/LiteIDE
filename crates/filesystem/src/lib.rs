/// filesystem — Phase 2: File System Service + watcher
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

pub fn list_dir(path: &Path) -> anyhow::Result<Vec<FileEntry>> {
    let mut v = Vec::new();
    for e in std::fs::read_dir(path)? {
        let e = e?;
        let ft = e.file_type()?;
        v.push(FileEntry { name: e.file_name().to_string_lossy().to_string(), path: e.path().to_string_lossy().to_string(), is_dir: ft.is_dir() });
    }
    v.sort_by(|a,b| match (a.is_dir,b.is_dir) { (true,false)=>std::cmp::Ordering::Less, (false,true)=>std::cmp::Ordering::Greater, _=>a.name.cmp(&b.name)});
    Ok(v)
}

pub fn create_file(path: &Path) -> anyhow::Result<()> {
    if let Some(p) = path.parent() { std::fs::create_dir_all(p)?; }
    std::fs::File::create(path).map(|_|())?;
    Ok(())
}
pub fn create_dir(path: &Path) -> anyhow::Result<()> { std::fs::create_dir_all(path).map_err(|e| e.into()) }
pub fn rename(from: &Path, to: &Path) -> anyhow::Result<()> { std::fs::rename(from,to).map_err(|e| e.into()) }
pub fn delete(path: &Path) -> anyhow::Result<()> {
    if path.is_dir() { std::fs::remove_dir_all(path)?; } else { std::fs::remove_file(path)?; }
    Ok(())
}
pub fn read_to_string(path: &Path) -> anyhow::Result<String> { Ok(std::fs::read_to_string(path)?) }
pub fn write_string(path: &Path, content: &str) -> anyhow::Result<()> {
    if let Some(p)=path.parent(){ std::fs::create_dir_all(p)?; }
    Ok(std::fs::write(path, content)?)
}

pub fn init() -> anyhow::Result<()> { log::info!("init filesystem"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_create_rename_delete() {
        let dir = std::env::temp_dir().join("qmide_fs_test");
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let f = dir.join("a.txt");
        create_file(&f).unwrap();
        assert!(f.exists());
        let f2 = dir.join("b.txt");
        rename(&f,&f2).unwrap();
        assert!(f2.exists());
        delete(&f2).unwrap();
        assert!(!f2.exists());
        let _ = std::fs::remove_dir_all(&dir);
    }
}
