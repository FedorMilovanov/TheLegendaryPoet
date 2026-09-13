import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type HtmlTagDescriptor, type Plugin } from "vite";
import { canonicalRoutePath, canonicalRouteUrl } from './src/routes/publicUrl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SearchVerificationConfig = {
  google?: string;
  bing?: string;
  pinterest?: string;
};

type RouteContractConfig = {
  routes: Array<{ path: string }>;
  redirects: Array<{ from: string; to: string }>;
};

const PRODUCTION_ORIGIN = 'https://thelegendarypoet.ru';
const ROUTE_CONTRACT_PATH = path.join(__dirname, 'src/routes/route-contract.json');
const DISCOVERY_POLICY_PATH = path.join(__dirname, 'src/routes/discovery-policy.json');

function escapeAliasHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function legacyAliasDocumentsPlugin(): Plugin {
  return {
    name: 'legacy-alias-documents',
    apply: 'build',
    closeBundle() {
      const contract = JSON.parse(fs.readFileSync(ROUTE_CONTRACT_PATH, 'utf8')) as RouteContractConfig;
      const discoveryPolicy = JSON.parse(fs.readFileSync(DISCOVERY_POLICY_PATH, 'utf8')) as {
        states: Record<string, { robots: string; canonical: string; ogUrl: string; schema: boolean; title?: string; description?: string }>;
      };
      const redirectPolicy = discoveryPolicy.states.redirect;
      if (!redirectPolicy
        || redirectPolicy.canonical !== 'target'
        || redirectPolicy.ogUrl !== 'none'
        || redirectPolicy.schema !== false) {
        throw new Error('redirect discovery policy is invalid');
      }
      const redirects = contract.redirects ?? [];
      const sources = new Set<string>();
      const canonicalStaticPaths = new Set(
        contract.routes
          .map((route) => route.path)
          .filter((routePath) => routePath.startsWith('/') && !routePath.includes(':') && routePath !== '*'),
      );

      for (const { from, to } of redirects) {
        const safePath = /^\/[a-z0-9][a-z0-9/_-]*$/i;
        if (!safePath.test(from) || !safePath.test(to) || from.includes('//') || to.includes('//')) {
          throw new Error(`legacy alias contains an unsafe path: ${from} -> ${to}`);
        }
        if (from === to) throw new Error(`legacy alias cannot redirect to itself: ${from}`);
        if (sources.has(from)) throw new Error(`duplicate legacy alias source: ${from}`);
        if (canonicalStaticPaths.has(from)) throw new Error(`legacy alias shadows a canonical route: ${from}`);
        sources.add(from);
      }

      for (const { from, to } of redirects) {
        if (sources.has(to)) throw new Error(`legacy alias chains are forbidden: ${from} -> ${to}`);

        const publicTarget = canonicalRoutePath(to);
        const canonicalUrl = canonicalRouteUrl(PRODUCTION_ORIGIN, to);
        const sourceAttr = escapeAliasHtml(from);
        const targetAttr = escapeAliasHtml(publicTarget);
        const canonicalAttr = escapeAliasHtml(canonicalUrl);
        const targetJson = JSON.stringify(publicTarget).replace(/</g, '\\u003c');
        const html = `<!doctype html>
<html lang="ru" data-legacy-alias="${sourceAttr}">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="${escapeAliasHtml(redirectPolicy.description || '')}" />
    <meta name="robots" content="${escapeAliasHtml(redirectPolicy.robots)}" />
    <meta name="googlebot" content="${escapeAliasHtml(redirectPolicy.robots)}" />
    <meta name="tlp-legacy-alias-target" content="${targetAttr}" />
    <link rel="canonical" href="${canonicalAttr}" />
    <meta http-equiv="refresh" content="0;url=${targetAttr}" />
    <title>${escapeAliasHtml(redirectPolicy.title || 'Страница перемещена — THE LEGENDARY POET')}</title>
  </head>
  <body>
    <main>
      <p>Страница перемещена. <a href="${targetAttr}">Перейти к актуальной странице</a>.</p>
    </main>
    <script>window.setTimeout(function () { window.location.replace(${targetJson}); }, 0);</script>
  </body>
</html>
`;

        const outDir = path.join(__dirname, 'dist', from.slice(1));
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'index.html'), html);
      }
    },
  };
}

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

// https://vite.dev/config/
// The production site is served from the root of the custom domain.
// VITE_BASE remains overridable for previews on another path.
// NOTE: a normal multi-file build (no vite-plugin-singlefile) is used so that
// route chunks, deep links and long-term asset caching remain reliable.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [legacyAliasDocumentsPlugin(), searchVerificationPlugin(), react(), tailwindcss()],
  resolve: {
    alias: [
      // Keep Three route-isolated, but expose only the Hall runtime surface to
      // Rollup instead of retaining the full namespace dynamic-import chunk.
      { find: /^three$/, replacement: path.resolve(__dirname, 'src/components/hall-v3/three-runtime.ts') },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
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
