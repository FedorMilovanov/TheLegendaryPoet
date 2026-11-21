// Older engines have the History API but not window.navigation. Do not
// intercept navigation, patch pushState, or invent extra history entries.
export const navigationApi = () => (window as Window & {
  navigation?: EventTarget & { currentEntry: { key: string } | null };
}).navigation;
const BEFORE_APP_NAVIGATION = 'tlp-before-app-navigation';

export function noteAppDeparture() {
  if (!navigationApi()?.currentEntry) window.dispatchEvent(new Event(BEFORE_APP_NAVIGATION));
}

/** Same-document PUSH/REPLACE intentions where there is no Navigation API. */
export function observeFallbackPush(beforePush: (leavesPage: boolean) => void) {
  const onApp = () => beforePush(true);
  const onLink = (event: MouseEvent) => {
    if (event.button || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const link = event.target instanceof Element && event.target.closest<HTMLAnchorElement>('a[href]');
    if (link && (!link.target || link.target === '_self') && link.origin === window.location.origin && !link.hasAttribute('download')) {
      beforePush(link.pathname !== window.location.pathname || link.hash !== window.location.hash);
    }
  };
  document.addEventListener('click', onLink, true);
  window.addEventListener(BEFORE_APP_NAVIGATION, onApp);
  return () => {
    document.removeEventListener('click', onLink, true);
    window.removeEventListener(BEFORE_APP_NAVIGATION, onApp);
  };
}

/** The address bar can change before a suspended route commits, or return to
 * the mounted page without any new React commit. Observe, never intercept. */
export function observeBrowserAddress(sync: () => void) {
  const navigation = navigationApi();
  let timer = 0;
  const stopPush = navigation?.currentEntry ? undefined : observeFallbackPush(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(sync, 0); // after the router's click/push handler
  });
  navigation?.addEventListener('currententrychange', sync);
  window.addEventListener('popstate', sync);
  sync();
  return () => {
    stopPush?.();
    window.clearTimeout(timer);
    navigation?.removeEventListener('currententrychange', sync);
    window.removeEventListener('popstate', sync);
  };
}
