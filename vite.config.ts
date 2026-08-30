import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error missing @types/node
import process from "node:process";

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ["monaco-editor"],
          react: ["react", "react-dom", "zustand"],
          tauri: ["@tauri-apps/api", "@tauri-apps/plugin-fs", "@tauri-apps/plugin-dialog", "@tauri-apps/plugin-shell"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test-setup.ts"],
  } as unknown as Record<string, unknown>,
}));
