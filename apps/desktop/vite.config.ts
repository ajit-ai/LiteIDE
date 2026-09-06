import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      allow: [
        'F:/Codes/Git/Quantsmind-Products/LiteIDE',
        'F:/.pnpm-store',
        'F:/Codes/Git/Quantsmind-Products/LiteIDE/apps/desktop',
        'F:/Codes/Git/Quantsmind-Products/LiteIDE/node_modules',
        'F:/Codes/Git/Quantsmind-Products/LiteIDE/apps/desktop/node_modules'
      ],
      strict: false
    }
  },
  // Monaco worker is CommonJS, allow it
  optimizeDeps: {
    include: ['monaco-editor']
  }
});
