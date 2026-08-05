import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SearchVerificationConfig = {
  google?: string;
  bing?: string;
  pinterest?: string;
};

function readSearchVerificationConfig(): SearchVerificationConfig {
  const configPath = path.join(__dirname, 'search-verification.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as SearchVerificationConfig;
  } catch (error) {
    console.warn(`Unable to read ${configPath}; verification tags will use environment variables only.`, error);
    return {};
  }
}

function searchVerificationPlugin(): Plugin {
  const config = readSearchVerificationConfig();
  const verificationTags: Array<[string, string | undefined]> = [
    ['google-site-verification', process.env.VITE_GOOGLE_SITE_VERIFICATION || config.google],
    ['msvalidate.01', process.env.VITE_BING_SITE_VERIFICATION || config.bing],
    ['p:domain_verify', process.env.VITE_PINTEREST_SITE_VERIFICATION || config.pinterest],
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

const isCoreCommunityTopologyQa =
  process.env.GITHUB_ACTIONS === 'true'
  && process.env.GITHUB_JOB === 'browser-qa'
  && process.env.QA_BASE_URL === 'http://127.0.0.1:4173'
  && !process.env.VITE_SUPABASE_URL
  && !process.env.VITE_SUPABASE_ANON_KEY;

const communityTopologyDefinitions = isCoreCommunityTopologyQa
  ? {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://community.test.invalid'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('test-anon-key'),
    }
  : {};

// https://vite.dev/config/
// The production site is served from the root of the custom domain.
// VITE_BASE remains overridable for previews on another path.
// NOTE: a normal multi-file build (no vite-plugin-singlefile) is used so that
// route chunks, deep links and long-term asset caching remain reliable.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  define: communityTopologyDefinitions,
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
          react: ['react', 'react-dom', 'react-router'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
