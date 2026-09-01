/// build — Phase 7: BuildService + BuildProvider
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildTask {
    pub id: String,
    pub command: String,
    pub args: Vec<String>,
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildResult {
    pub task_id: String,
    pub success: bool,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

pub trait BuildProvider: Send + Sync {
    fn name(&self) -> &str;
    fn detect_project(&self, root: &Path) -> bool;
    fn configure(&self, root: &Path) -> anyhow::Result<BuildTask>;
    fn build(&self, root: &Path) -> anyhow::Result<BuildTask>;
    fn clean(&self, root: &Path) -> anyhow::Result<BuildTask>;
    fn run(&self, root: &Path) -> anyhow::Result<BuildTask>;
}

// CMakeProvider
pub struct CMakeProvider;
impl BuildProvider for CMakeProvider {
    fn name(&self) -> &str { "cmake" }
    fn detect_project(&self, root: &Path) -> bool { root.join("CMakeLists.txt").exists() }
    fn configure(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "cmake-configure".into(), command: "cmake".into(), args: vec!["-B".into(), "build".into()], cwd: root.to_string_lossy().to_string() })
    }
    fn build(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "cmake-build".into(), command: "cmake".into(), args: vec!["--build".into(), "build".into()], cwd: root.to_string_lossy().to_string() })
    }
    fn clean(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "cmake-clean".into(), command: "cmake".into(), args: vec!["--build".into(), "build".into(), "--target".into(), "clean".into()], cwd: root.to_string_lossy().to_string() })
    }
    fn run(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "cmake-run".into(), command: "./build/app".into(), args: vec![], cwd: root.to_string_lossy().to_string() })
    }
}

// MakeProvider
pub struct MakeProvider;
impl BuildProvider for MakeProvider {
    fn name(&self) -> &str { "make" }
    fn detect_project(&self, root: &Path) -> bool { root.join("Makefile").exists() || root.join("makefile").exists() }
    fn configure(&self, _root: &Path) -> anyhow::Result<BuildTask> { anyhow::bail!("make no configure") }
    fn build(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "make-build".into(), command: "make".into(), args: vec![], cwd: root.to_string_lossy().to_string() })
    }
    fn clean(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "make-clean".into(), command: "make".into(), args: vec!["clean".into()], cwd: root.to_string_lossy().to_string() })
    }
    fn run(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "make-run".into(), command: "make".into(), args: vec!["run".into()], cwd: root.to_string_lossy().to_string() })
    }
}

// JavaProvider
pub struct JavaProvider;
impl BuildProvider for JavaProvider {
    fn name(&self) -> &str { "java" }
    fn detect_project(&self, root: &Path) -> bool { root.join("pom.xml").exists() || root.join("build.gradle").exists() || root.join("src").join("main").exists() }
    fn configure(&self, _root: &Path) -> anyhow::Result<BuildTask> { anyhow::bail!("java no configure") }
    fn build(&self, root: &Path) -> anyhow::Result<BuildTask> {
        if root.join("pom.xml").exists() {
            Ok(BuildTask { id: "java-build".into(), command: "mvn".into(), args: vec!["compile".into()], cwd: root.to_string_lossy().to_string() })
        } else if root.join("build.gradle").exists() {
            Ok(BuildTask { id: "java-build".into(), command: "gradle".into(), args: vec!["build".into()], cwd: root.to_string_lossy().to_string() })
        } else {
            Ok(BuildTask { id: "java-build".into(), command: "javac".into(), args: vec!["-d".into(), "out".into(), "src/**/*.java".into()], cwd: root.to_string_lossy().to_string() })
        }
    }
    fn clean(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "java-clean".into(), command: "rm".into(), args: vec!["-rf".into(), "out".into()], cwd: root.to_string_lossy().to_string() })
    }
    fn run(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "java-run".into(), command: "java".into(), args: vec!["-cp".into(), "out".into(), "Main".into()], cwd: root.to_string_lossy().to_string() })
    }
}

// PythonProvider
pub struct PythonProvider;
impl BuildProvider for PythonProvider {
    fn name(&self) -> &str { "python" }
    fn detect_project(&self, root: &Path) -> bool { root.join("requirements.txt").exists() || root.join("pyproject.toml").exists() || root.join("main.py").exists() }
    fn configure(&self, _root: &Path) -> anyhow::Result<BuildTask> { anyhow::bail!("python no configure") }
    fn build(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "python-build".into(), command: "python".into(), args: vec!["-m".into(), "py_compile".into(), "main.py".into()], cwd: root.to_string_lossy().to_string() })
    }
    fn clean(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "python-clean".into(), command: "rm".into(), args: vec!["-rf".into(), "__pycache__".into()], cwd: root.to_string_lossy().to_string() })
    }
    fn run(&self, root: &Path) -> anyhow::Result<BuildTask> {
        Ok(BuildTask { id: "python-run".into(), command: "python".into(), args: vec!["main.py".into()], cwd: root.to_string_lossy().to_string() })
    }
}

pub struct BuildService {
    providers: Vec<Box<dyn BuildProvider>>,
}

impl BuildService {
    pub fn new() -> Self {
        Self { providers: vec![Box::new(CMakeProvider), Box::new(MakeProvider), Box::new(JavaProvider), Box::new(PythonProvider)] }
    }
    pub fn detect(&self, root: &Path) -> Option<&dyn BuildProvider> {
        self.providers.iter().find(|p| p.detect_project(root)).map(|p| p.as_ref())
    }
    pub fn list_providers(&self) -> Vec<&str> { self.providers.iter().map(|p| p.name()).collect() }
}

pub fn init() -> anyhow::Result<()> { log::info!("init build"); Ok(()) }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_detect() {
        let svc = BuildService::new();
        assert!(svc.list_providers().contains(&"cmake"));
        assert!(svc.list_providers().contains(&"python"));
        let tmp = std::env::temp_dir();
        // No CMakeLists.txt in temp, so detect should be None or python if main.py exists? Just check it doesn't panic
        let _ = svc.detect(&tmp);
    }
    #[test]
    fn test_python_provider() {
        let p = PythonProvider;
        let tmp = std::env::temp_dir().join("qmide_build_test_py");
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(&tmp).unwrap();
        std::fs::write(tmp.join("main.py"), "print(1)").unwrap();
        assert!(p.detect_project(&tmp));
        let task = p.run(&tmp).unwrap();
        assert_eq!(task.command, "python");
        let _ = std::fs::remove_dir_all(&tmp);
    }
}
