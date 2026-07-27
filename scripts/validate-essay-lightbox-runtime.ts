import fs from 'node:fs';

const source = fs.readFileSync('src/components/essay/blocks.tsx', 'utf8');
const failures: string[] = [];
const expect = (condition: unknown, message: string) => {
  if (!condition) failures.push(message);
};

expect(source.includes("import { useDialogSurface } from '../../hooks/useDialogSurface';"), 'essay lightbox must import the shared dialog lifecycle');
expect(source.includes('useDialogSurface({'), 'essay lightbox must register with the shared overlay stack');
expect(source.includes("label: 'essay-image-lightbox'"), 'essay lightbox must expose a stable overlay label for QA');
expect(source.includes('initialFocusRef: closeRef'), 'essay lightbox must move initial focus to its close control');
expect(source.includes('ref={dialogRef}'), 'essay lightbox must register its concrete dialog root');
expect(source.includes('tabIndex={-1}'), 'essay lightbox dialog must remain focusable as a fallback target');
expect(source.includes('onPointerDown={(event) =>'), 'essay lightbox backdrop dismissal must support pointer and touch input');
expect(!source.includes("document.body.style.overflow = 'hidden'"), 'essay lightbox must not own body locking independently');
expect(!source.includes("window.addEventListener('keydown'"), 'essay lightbox must not compete with the centralized Escape and focus runtime');
expect(!source.includes('requestAnimationFrame(() => triggerRef.current?.focus())'), 'essay lightbox must delegate focus restoration to the shared dialog lifecycle');

if (failures.length > 0) {
  console.error('\nEssay lightbox runtime validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Essay lightbox runtime validation passed: shared stack, focus, Escape, body lock and pointer dismissal are centralized.');
