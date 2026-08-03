import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const srcRoot = join(root, 'src');
const canonicalLink = 'src/components/ui/Link.tsx';
const sourceFiles: string[] = [];

function walk(directory: string): void {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      walk(path);
      continue;
    }
    if (/\.(?:ts|tsx)$/u.test(entry)) sourceFiles.push(path);
  }
}

walk(srcRoot);

const directNavigationNames = /\b(?:Link|NavLink|useNavigate)\b/u;
const ssrRouterNames = /\b(?:createStaticHandler|createStaticRouter|StaticRouterProvider|deserializeErrors)\b/u;
const violations: string[] = [];

for (const absolutePath of sourceFiles) {
  const path = relative(root, absolutePath).replaceAll('\\', '/');
  const text = readFileSync(absolutePath, 'utf8');

  for (const match of text.matchAll(/import\s*\{([\s\S]*?)\}\s*from\s*['"]react-router-dom['"]/gu)) {
    if (path !== canonicalLink && directNavigationNames.test(match[1] ?? '')) {
      violations.push(`${path}: direct Link/NavLink/useNavigate import bypasses ${canonicalLink}`);
    }
  }

  if (ssrRouterNames.test(text)) {
    violations.push(`${path}: server-router hydration API is forbidden in this client-only SPA`);
  }
}

const linkText = readFileSync(join(root, canonicalLink), 'utf8');
for (const marker of [
  "value.includes('\\\\')",
  "value.startsWith('//')",
  'ABSOLUTE_SCHEME_RE.test(value)',
  'assertSafeInternalTo(to)',
]) {
  if (!linkText.includes(marker)) {
    violations.push(`${canonicalLink}: missing fail-closed destination marker ${marker}`);
  }
}

if (violations.length > 0) {
  throw new Error(`Router security boundary failed:\n${violations.map((item) => `- ${item}`).join('\n')}`);
}

console.log(
  `Router security: ${sourceFiles.length} TypeScript files checked; centralized internal links, backslash/protocol rejection, and client-only routing boundary passed.`,
);
