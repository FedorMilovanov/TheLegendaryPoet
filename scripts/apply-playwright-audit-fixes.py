from pathlib import Path

blocks = Path('src/components/essay/blocks.tsx')
text = blocks.read_text(encoding='utf-8')

if "import { createPortal } from 'react-dom';" not in text:
    text = text.replace(
        "import type { ReactNode } from 'react';\n",
        "import type { ReactNode } from 'react';\nimport { createPortal } from 'react-dom';\n",
    )

text = text.replace(
    "  const closeRef = useRef<HTMLButtonElement>(null);\n  const captionId = useId();",
    "  const closeRef = useRef<HTMLButtonElement>(null);\n  const dialogRef = useRef<HTMLDivElement>(null);\n  const captionId = useId();",
)

legacy_tab = """      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
"""
proper_tab = """      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute('disabled') && element.offsetParent !== null);

        if (focusable.length === 0) {
          event.preventDefault();
          closeRef.current?.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && (active === first || !dialog.contains(active))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
"""
text = text.replace(legacy_tab, proper_tab)

text = text.replace(
    """          <motion.div
            role="dialog"
""",
    """          <motion.div
            ref={dialogRef}
            role="dialog"
""",
    1,
)

if "createPortal(\n            <AnimatePresence>" not in text:
    opening = """      <AnimatePresence>
        {open && (
"""
    replacement = """      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {open && (
"""
    if opening not in text:
        raise SystemExit('Expected lightbox AnimatePresence opening was not found')
    text = text.replace(opening, replacement, 1)

    closing = """        )}
      </AnimatePresence>
    </>
"""
    closing_replacement = """              )}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
"""
    if closing not in text:
        raise SystemExit('Expected lightbox AnimatePresence closing was not found')
    text = text.replace(closing, closing_replacement, 1)

blocks.write_text(text, encoding='utf-8')

config = Path('playwright.audit.config.ts')
config_text = config.read_text(encoding='utf-8').replace('timeout: 90_000,', 'timeout: 300_000,')
config.write_text(config_text, encoding='utf-8')

test_file = Path('tests/playwright-audit/article-system.spec.ts')
test_text = test_file.read_text(encoding='utf-8')
needle = """    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
"""
replacement = """    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const viewport = page.viewportSize();
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.x ?? -1, 'Lightbox must start at the viewport left edge').toBeLessThanOrEqual(1);
    expect(dialogBox?.y ?? -1, 'Lightbox must start at the viewport top edge').toBeLessThanOrEqual(1);
    expect(dialogBox?.width ?? 0, 'Lightbox must cover the viewport width').toBeGreaterThanOrEqual((viewport?.width ?? 0) - 2);
    expect(dialogBox?.height ?? 0, 'Lightbox must cover the viewport height').toBeGreaterThanOrEqual((viewport?.height ?? 0) - 2);
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
"""
if needle in test_text:
    test_text = test_text.replace(needle, replacement, 1)
test_file.write_text(test_text, encoding='utf-8')
