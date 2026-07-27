import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function searchVerificationPlugin(): Plugin {
  const verificationTags: Array<[string, string | undefined]> = [
    ['google-site-verification', process.env.VITE_GOOGLE_SITE_VERIFICATION],
    ['msvalidate.01', process.env.VITE_BING_SITE_VERIFICATION],
    ['p:domain_verify', process.env.VITE_PINTEREST_SITE_VERIFICATION],
  ];

  return {
    name: 'search-verification-meta',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return verificationTags
          .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
          .map<HtmlTagDescriptor>(([name, content]) => ({
            tag: 'meta',
            attrs: { name, content: content.trim() },
            injectTo: 'head',
          }));
      },
    },
  };
}

// https://vite.dev/config/
// The production site is served from the root of the custom domain.
// VITE_BASE remains overridable for previews on another path.
// NOTE: a normal multi-file build (no vite-plugin-singlefile) is used so that
// route chunks, deep links and long-term asset caching remain reliable.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [searchVerificationPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: 'esnext',
    manifest: true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Framework code changes rarely, so content deploys should not force
        // visitors to download React or the animation runtime again.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
