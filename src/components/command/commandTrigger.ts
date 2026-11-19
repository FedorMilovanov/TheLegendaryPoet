import type { MouseEvent } from 'react';

/** Both responsive search entry points own their activation even on platforms
 * where tapping a button or invoking it via AT does not give it DOM focus. */
export const commandTriggerProps = {
  type: 'button' as const,
  'data-focus-peer': 'site-search',
  onClick(event: MouseEvent<HTMLButtonElement>) {
    event.currentTarget.focus({ preventScroll: true });
    window.dispatchEvent(new Event('tlp-open-command-palette'));
  },
};
