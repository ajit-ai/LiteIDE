use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::process::Command;
use tokio::sync::mpsc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildRequest {
    pub language: String,
    pub file: String,
    pub output: Option<String>,
    pub extra_args: Option<String>,
    pub cwd: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildOutput {
    pub stdout: String,
    pub stderr: String,
    pub success: bool,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunRequest {
    pub language: String,
    pub file: String,
    pub cwd: Option<String>,
    pub args: Option<Vec<String>>,
}

/// Detect compiler/runner availability.
pub fn detect_tool(cmd: &str) -> bool {
    which::which(cmd).is_ok()
}

fn build_command(req: &BuildRequest) -> Result<(String, Vec<String>), String> {
    let cwd = req.cwd.clone().unwrap_or_default();
    let _ = cwd; // reserved for future cwd handling
    match req.language.as_str() {
        "c" => {
            let compiler = if detect_tool("gcc") { "gcc" } else { "clang" };
            let output = req
                .output
                .clone()
                .unwrap_or_else(|| default_output(&req.file));
            let mut args = vec!["-o".to_string(), output, req.file.clone()];
            if let Some(extra) = &req.extra_args {
                args.extend(extra.split_whitespace().map(|s| s.to_string()));
            }
            Ok((compiler.to_string(), args))
        }
        "cpp" | "c++" => {
            let compiler = if detect_tool("g++") { "g++" } else { "clang++" };
            let output = req
                .output
                .clone()
                .unwrap_or_else(|| default_output(&req.file));
            let mut args = vec!["-std=c++17".to_string(), "-o".to_string(), output, req.file.clone()];
            if let Some(extra) = &req.extra_args {
                args.extend(extra.split_whitespace().map(|s| s.to_string()));
            }
            Ok((compiler.to_string(), args))
        }
        "java" => {
            // javac
            let mut args = vec![req.file.clone()];
            if let Some(extra) = &req.extra_args {
                args.extend(extra.split_whitespace().map(|s| s.to_string()));
            }
            Ok(("javac".to_string(), args))
        }
        "python" => {
            // No build step for python, use py_compile check
            Ok(("python".to_string(), vec!["-m".to_string(), "py_compile".to_string(), req.file.clone()]))
        }
        other => Err(format!("Unsupported language for build: {}", other)),
    }
}

fn run_command(req: &RunRequest) -> Result<(String, Vec<String>), String> {
    match req.language.as_str() {
        "c" | "cpp" | "c++" => {
            let exe = default_output(&req.file);
            let exe_path = if cfg!(windows) {
                format!("{}.exe", exe.trim_end_matches(".exe"))
            } else {
                exe
            };
            Ok((exe_path, req.args.clone().unwrap_or_default()))
        }
        "java" => {
            // Derive MainClass from file name
            let path = std::path::Path::new(&req.file);
            let stem = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "Main".to_string());
            // Detect maven/gradle? For now simple java {Class}
            let mut args = vec![stem];
            if let Some(extra) = &req.args {
                args.extend(extra.clone());
            }
            Ok(("java".to_string(), args))
        }
        "python" => {
            let runner = if detect_tool("python3") { "python3" } else { "python" };
            let mut args = vec![req.file.clone()];
            if let Some(extra) = &req.args {
                args.extend(extra.clone());
            }
            Ok((runner.to_string(), args))
        }
        other => Err(format!("Unsupported language for run: {}", other)),
    }
}

fn default_output(file: &str) -> String {
    let p = std::path::Path::new(file);
    let stem = p.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_else(|| "a.out".to_string());
    if cfg!(windows) {
        format!("{}.exe", stem)
    } else {
        stem
    }
}

/// Execute build and return output.
pub async fn execute_build(req: BuildRequest) -> Result<BuildOutput, String> {
    let (cmd, args) = build_command(&req)?;
    let cwd = req.cwd.clone();
    let mut command = Command::new(&cmd);
    command.args(&args).stdout(Stdio::piped()).stderr(Stdio::piped());
    if let Some(dir) = cwd {
        command.current_dir(dir);
    }
    let output = command.output().await.map_err(|e| e.to_string())?;
    Ok(BuildOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        success: output.status.success(),
        exit_code: output.status.code(),
    })
}

pub async fn execute_run(req: RunRequest) -> Result<BuildOutput, String> {
    let (cmd, args) = run_command(&req)?;
    let cwd = req.cwd.clone();
    let mut command = Command::new(&cmd);
    command.args(&args).stdout(Stdio::piped()).stderr(Stdio::piped());
    if let Some(dir) = cwd {
        command.current_dir(dir);
    }
    let output = command.output().await.map_err(|e| e.to_string())?;
    Ok(BuildOutput {
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        success: output.status.success(),
        exit_code: output.status.code(),
    })
}

/// Streaming variant placeholder - will emit events via Tauri channel in future.
#[allow(dead_code)]
pub struct BuildRunner {
    tx: mpsc::Sender<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_build_command_c() {
        let req = BuildRequest {
            language: "c".to_string(),
            file: "main.c".to_string(),
            output: None,
            extra_args: None,
            cwd: None,
        };
        let (cmd, args) = build_command(&req).unwrap();
        assert!(cmd == "gcc" || cmd == "clang");
        assert!(args.contains(&"main.c".to_string()));
    }
    #[test]
    fn test_run_python() {
        let req = RunRequest {
            language: "python".to_string(),
            file: "main.py".to_string(),
            cwd: None,
            args: None,
        };
        let (cmd, _args) = run_command(&req).unwrap();
        assert!(cmd == "python3" || cmd == "python");
    }
}
