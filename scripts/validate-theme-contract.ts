import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const failures: string[] = [];

function requireContains(file: string, snippets: string[]) {
  const source = read(file);
  for (const snippet of snippets) {
    if (!source.includes(snippet)) failures.push(`${file} must contain ${JSON.stringify(snippet)}`);
  }
}

function requireExcludes(file: string, snippets: string[]) {
  const source = read(file);
  for (const snippet of snippets) {
    if (source.includes(snippet)) failures.push(`${file} must not contain legacy theme literal ${JSON.stringify(snippet)}`);
  }
}

requireContains('src/theme.css', [
  '.theme-poem-feature',
  '.theme-modal-surface',
  '.theme-modal-result',
  '.theme-dark-island',
  '.theme-dark-island-text',
]);

requireContains('src/components/PoemOfDay.tsx', [
  'theme-poem-feature',
  'theme-poem-card',
  'theme-poem-divider',
  'theme-poem-text',
]);
requireExcludes('src/components/PoemOfDay.tsx', [
  'from-[#050505]',
  'via-[#0a0a0a]',
  'text-cyan-50/80',
  'bg-[#061018]/40',
]);

requireContains('src/components/command/CommandPalette.tsx', [
  'theme-modal-backdrop',
  'theme-modal-surface',
  'theme-placeholder',
]);
requireExcludes('src/components/command/CommandPalette.tsx', [
  'bg-black/70',
  'bg-[#050b12]/95',
  'text-base text-white',
]);

requireContains('src/components/command/CommandResult.tsx', [
  'data-active={active',
  'theme-modal-result',
  'theme-functional-muted',
]);
requireExcludes('src/components/command/CommandResult.tsx', [
  'bg-black/20',
  'text-lg font-bold text-white',
]);

requireContains('src/pages/PoetDetailPage.tsx', [
  'theme-page-surface',
  'theme-text',
]);
requireContains('src/components/poet-detail/HeroSection.tsx', [
  'theme-dark-island',
  'poet-hero-shade',
  'theme-dark-island-muted',
]);
requireExcludes('src/components/poet-detail/HeroSection.tsx', [
  'from-[#050505]',
  'via-[#050505]/60',
  'text-luxury-gray-light',
]);

requireContains('src/components/music/GlobalMiniPlayer.tsx', [
  'global-audio-mini theme-dark-island',
  'audio-mini-surface',
  'audio-title',
  'audio-control',
]);
requireExcludes('src/components/music/GlobalMiniPlayer.tsx', [
  'bg-[#071018]/95',
  'text-white/42',
  'text-white/38',
  'hover:text-white',
]);

requireContains('src/components/MobileDock.tsx', [
  'ResizeObserver',
  '--tlp-mobile-dock-clearance',
  'publishVisualHeight',
]);
requireContains('src/hooks/useAutoHideChrome.ts', [
  "useLocation",
  'const { pathname } = useLocation()',
  '}, [pathname])',
]);
requireContains('src/audio-player.css', [
  '--tlp-audio-mobile-bottom',
  '--tlp-mobile-dock-clearance',
  'html.global-audio-active .scroll-top-btn',
]);

if (failures.length) {
  console.error('Theme contract validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Theme contract validation passed: semantic light surfaces, explicit dark islands, route-aware chrome and measured mobile geometry are locked.');
