import type { LanguageProvider } from "../../crates/language/src/lib";
// Go provider via gopls
export const GoProvider = {
  language_id: "go",
  file_extensions: [".go"],
  start_language_server: () => "gopls",
  build: (file: string) => `go build -o \${file.replace(".go","")} \${file}`,
  run: (file: string) => `go run \${file}`,
};
