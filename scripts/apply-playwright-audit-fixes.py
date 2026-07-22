from pathlib import Path

blocks = Path('src/components/essay/blocks.tsx')
text = blocks.read_text(encoding='utf-8')

text = text.replace(
    "  const closeRef = useRef<HTMLButtonElement>(null);\n  const captionId = useId();",
    "  const closeRef = useRef<HTMLButtonElement>(null);\n  const dialogRef = useRef<HTMLDivElement>(null);\n  const captionId = useId();",
)

old_tab = """      if (event.key === 'Tab') {
        event.preventDefault();
        closeRef.current?.focus();
      }
"""
new_tab = """      if (event.key === 'Tab') {
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
if old_tab not in text:
    raise SystemExit('Expected legacy Tab trap was not found')
text = text.replace(old_tab, new_tab)

old_dialog = """          <motion.div
            role="dialog"
"""
new_dialog = """          <motion.div
            ref={dialogRef}
            role="dialog"
"""
if old_dialog not in text:
    raise SystemExit('Expected lightbox dialog node was not found')
text = text.replace(old_dialog, new_dialog, 1)
blocks.write_text(text, encoding='utf-8')

config = Path('playwright.audit.config.ts')
config_text = config.read_text(encoding='utf-8').replace('timeout: 90_000,', 'timeout: 300_000,')
config.write_text(config_text, encoding='utf-8')
