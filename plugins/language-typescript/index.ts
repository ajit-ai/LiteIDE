export const TypeScriptProvider = {
  language_id: "typescript",
  file_extensions: [".ts", ".tsx"],
  start_language_server: () => "typescript-language-server --stdio",
  build: (file: string) => `tsc --noEmit`,
  run: (file: string) => `ts-node ${file}`,
};
