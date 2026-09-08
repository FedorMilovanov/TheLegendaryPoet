import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  root: __dirname,
  base: '/',
  server: {
    host: '127.0.0.1',
    port: 4174,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  preview: {
    host: '127.0.0.1',
    port: 4174,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    outDir: path.join(repoRoot, 'dist-hall-web-runtime'),
    emptyOutDir: true,
    manifest: true,
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      input: path.join(__dirname, 'index.html'),
    },
  },
});
