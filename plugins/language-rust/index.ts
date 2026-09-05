export const RustProvider = {
  language_id: "rust",
  file_extensions: [".rs"],
  start_language_server: () => "rust-analyzer",
  build: (file: string) => `cargo build`,
  run: (file: string) => `cargo run`,
};
