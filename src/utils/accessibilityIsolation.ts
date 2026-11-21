// Both reading mode and a modal can hide the same shell button's ancestor.
// Restore the author's attributes only when the last reason goes away.
const snapshots = new WeakMap<HTMLElement, { owners: number; inert: boolean; ariaHidden: string | null }>();

export function createIsolationScope() {
  const held = new Set<HTMLElement>();
  return {
    hide(element: HTMLElement) {
      if (held.has(element)) return;
      held.add(element);
      const existing = snapshots.get(element);
      if (existing) { existing.owners++; return; }
      snapshots.set(element, { owners: 1, inert: element.inert, ariaHidden: element.getAttribute('aria-hidden') });
      element.inert = true;
      element.setAttribute('aria-hidden', 'true');
    },
    clear() {
      for (const element of held) {
        const snapshot = snapshots.get(element)!;
        if (--snapshot.owners) continue;
        snapshots.delete(element);
        element.inert = snapshot.inert;
        if (snapshot.ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', snapshot.ariaHidden);
      }
      held.clear();
    },
  };
}
