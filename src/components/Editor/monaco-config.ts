import * as monaco from "monaco-editor";

export function setupMonaco() {
  // Theme setup is handled via editor options; ensure languages are registered
  monaco.languages.getLanguages();
}

export function languageForPath(path: string): string {
  if (path.endsWith(".c")) return "c";
  if (path.endsWith(".cpp") || path.endsWith(".cc") || path.endsWith(".hpp")) return "cpp";
  if (path.endsWith(".java")) return "java";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".rs")) return "rust";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  return "plaintext";
}

export const EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "JetBrains Mono, Cascadia Code, Consolas, monospace",
  scrollBeyondLastLine: false,
  automaticLayout: true,
  wordWrap: "on",
  tabSize: 4,
};
