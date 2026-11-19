import { navigationApi, observeFallbackPush } from './browserNavigation';
import type { PagePosition } from './readingBookmark';

/** Query parameters are controls on the same page; another fragment is a
 * new reading destination. Always use the browser address for an open dialog. */
export const liveReaderPage = () => window.location.pathname + window.location.hash;

/** Read the live address-bar entry without stamping an unpainted destination. */
export function activeEntryId(): string | undefined {
  return navigationApi()?.currentEntry?.key ?? window.history.state?.key ?? window.history.state?.tlpScrollEntry;
}

export function currentEntryId(routerKey: string) {
  const existing = activeEntryId();
  if (existing) return existing;
  if (routerKey !== 'default') return routerKey;
  // Initial loads and *every* native fragment can all have router key
  // "default". Stamp only an opaque identity, preserving idx/usr and the URL.
  const history = window.history;
  const key = `tlp-${Math.random().toString(36).slice(2)}`;
  try { history.replaceState({ ...(history.state ?? { idx: null }), tlpScrollEntry: key }, ''); }
  catch { return `${routerKey}:${window.location.href}`; }
  return key;
}

/** Take the snapshot before a native jump, a Router commit, or the shorter
 * destination's layout clamps scrollY. Nothing runs per wheel/scroll frame. */
export function observeDepartures(history: ScrollHistory, capture: (visit: ScrollVisit) => PagePosition) {
  const navigation = navigationApi();
  if (navigation?.currentEntry) {
    const before = (event: Event) => {
      history.clearArrivalClaim();
      if (history.current?.id !== navigation.currentEntry?.key) return;
      const { destination } = event as Event & { destination: { url: string } };
      const next = new URL(destination.url, window.location.href);
      history.remember(capture, next.pathname !== window.location.pathname || next.hash !== window.location.hash);
    };
    navigation.addEventListener('navigate', before);
    return () => navigation.removeEventListener('navigate', before);
  }
  const beforePush = (leavesPage: boolean) => {
    history.clearArrivalClaim();
    const current = activeEntryId();
    if (!current || history.current?.id === current) history.remember(capture, leavesPage);
  };
  // popstate exposes the arriving entry. During a quick Back before a lazy
  // page has even painted, don't write the old page over its own bookmark.
  const onPop = () => {
    history.clearArrivalClaim();
    const id = activeEntryId();
    // A newly pushed native hash has no state until the reader stamps it.
    // Its popstate may arrive *after* the UA scrolls. Keep the pre-click
    // bookmark in that case; Back/Forward to a stamped entry still captures.
    if (history.current?.id !== id && (id || !history.current?.departing)) history.remember(capture, true);
  };
  const stopPush = observeFallbackPush(beforePush);
  window.addEventListener('popstate', onPop, true);
  return () => {
    stopPush();
    window.removeEventListener('popstate', onPop, true);
  };
}

export interface ScrollVisit {
  id: string;
  url: string;
  pathname: string;
  hash: string;
  search: string;
  // An abandoned render must not consume another visit’s landmark handoff.
  mainFocusPending: boolean;
  yieldPlacement?: () => void;
  // Eligible for departure capture: placed, passive, or taken over by the reader.
  applied: boolean;
  unavailable?: boolean;
  // A native repeat of the current hash can emit popstate without leaving.
  departing?: boolean;
}

export class ScrollHistory {
  current?: ScrollVisit;
  private positions = new Map<string, { url: string; unavailable?: boolean; position: PagePosition }>();

  // One reader claim until the next navigation, not a second history cache.
  private claimedArrival?: { href: string; entry?: string };

  /** A new dialog owns the live address, even if another surface still
   * holds the physical lock. Only a painted visit can supply a passage. */
  claimForOverlay() {
    const href = window.location.href, entry = activeEntryId();
    this.claimedArrival = { href, entry };
    if (this.current?.url !== href || (entry && this.current.id !== entry)) return false;
    this.current.yieldPlacement?.();
    return true;
  }

  readerOwnsArrival(visit: ScrollVisit) {
    const claim = this.claimedArrival;
    return claim?.href === visit.url && (!claim.entry || claim.entry === visit.id);
  }

  clearArrivalClaim() { this.claimedArrival = undefined; }

  remember(capture: (visit: ScrollVisit) => PagePosition, leavesPage: boolean) {
    const visit = this.current;
    if (!visit?.applied) return;
    visit.departing = leavesPage;
    this.positions.delete(visit.id);
    this.positions.set(visit.id, { url: visit.url, unavailable: visit.unavailable, position: capture(visit) });
    if (this.positions.size > 80) this.positions.delete(this.positions.keys().next().value!);
  }

  position(visit: ScrollVisit) {
    const saved = this.positions.get(visit.id);
    // The same history entry can now paint the chapter. Its old error-card
    // coordinates are not a reading bookmark (nor the reverse).
    return saved?.url === visit.url && saved.unavailable === visit.unavailable ? saved.position : undefined;
  }
}
