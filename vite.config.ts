import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
// base: for a GitHub Pages project site the app is served from /<repo>/.
// Override with VITE_BASE=/ for a custom domain or user/org Pages site.
// NOTE: a normal multi-file build (no vite-plugin-singlefile) is used so that
// the base path, router basename and asset URLs all resolve correctly under
// the /<repo>/ sub-path and on deep-link refresh.
export default defineConfig({
  base: process.env.VITE_BASE || '/TheLegendaryPoet/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Long-term caching: framework code changes rarely — split it from
        // app/content code so a content deploy doesn't re-download React,
        // the router or the animation runtime.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
