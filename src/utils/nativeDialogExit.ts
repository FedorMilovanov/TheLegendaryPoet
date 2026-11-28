const ROOT_FADE_MS = 450;

function safeOpacity(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 1;
}

/** The root has one animation owner. Cancel entrance before starting exit,
 * retaining its actual painted opacity for a continuous reversal. */
export function startNativeDialogEntrance(surface: HTMLElement, from = 0) {
  let entrance: Animation | undefined;
  try {
    entrance = surface.animate(
      [{ opacity: safeOpacity(from) }, { opacity: 1 }],
      { duration: ROOT_FADE_MS, easing: 'ease-in-out' },
    );
    // Cancellation on close or unmount is expected.
    void entrance.finished.catch(() => {});
  } catch { /* A visible root remains usable without animation. */ }
  return () => {
    const opacity = safeOpacity(Number.parseFloat(getComputedStyle(surface).opacity));
    entrance?.cancel();
    return opacity;
  };
}

/** Native exit visual owner. Never releases the overlay lease itself. */
export function startNativeDialogExit(
  surface: HTMLElement,
  isCurrent: () => boolean,
  onComplete: () => void,
  from = 1,
) {
  const duration = ROOT_FADE_MS;
  let active = true;
  let settled = false;
  let deadline: number | undefined;
  let exit: Animation | undefined;
  let concealed = false;
  const priorOpacity = surface.style.getPropertyValue('opacity');
  const priorOpacityPriority = surface.style.getPropertyPriority('opacity');

  const complete = () => {
    if (!active || !isCurrent() || settled) return;
    settled = true;
    if (deadline !== undefined) window.clearTimeout(deadline);
    onComplete();
  };
  const conceal = () => {
    // Author-important opacity wins over animation-origin styles. Unlike
    // display:none, this does not eject focus from the retained dialog.
    concealed = true;
    surface.style.setProperty('opacity', '0', 'important');
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') complete();
  };
  const cleanup = () => {
    active = false;
    if (deadline !== undefined) window.clearTimeout(deadline);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    exit?.removeEventListener('finish', complete);
    exit?.cancel();
    if (concealed) {
      if (priorOpacity) surface.style.setProperty('opacity', priorOpacity, priorOpacityPriority);
      else surface.style.removeProperty('opacity');
    }
  };

  try {
    exit = surface.animate(
      [{ opacity: safeOpacity(from) }, { opacity: 0 }],
      { duration, easing: 'ease-in-out', fill: 'forwards' },
    );
  } catch {
    conceal();
    complete();
    return cleanup;
  }
  // Either native completion channel may arrive first. A liveness deadline
  // allows three additional authored durations for delayed delivery. It does
  // not change the normal 450ms fade or unlock a still-painted portal.
  deadline = window.setTimeout(() => {
    if (!active || !isCurrent() || settled) return;
    conceal();
    try { exit?.finish(); } catch { /* terminal visual state is already applied */ }
    complete();
  }, duration * 4);
  exit.addEventListener('finish', complete);
  void exit.finished.then(complete, () => {
    if (!active || !isCurrent() || settled) return;
    // Cancellation can restore the pre-animation opacity. Conceal the still
    // mounted root before requesting its terminal removal, just as on timeout.
    conceal();
    complete();
  });
  document.addEventListener('visibilitychange', onVisibilityChange);
  return cleanup;
}
