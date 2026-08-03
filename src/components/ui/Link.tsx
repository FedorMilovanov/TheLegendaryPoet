import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useNavigate,
  useResolvedPath,
  type LinkProps,
  type NavLinkProps,
  type NavigateOptions,
  type To,
} from 'react-router-dom';
import { scheduleRoutePreload } from '../../routes/routeModules';

/**
 * Site-standard internal navigation.
 *
 * Always import `Link`/`NavLink` from THIS module (never from
 * react-router-dom directly) and navigate imperatively via `useAppNavigate`.
 * They enable the View Transitions API on every route change and warm the
 * destination chunk only after deliberate pointer, touch, or keyboard intent.
 */

const ABSOLUTE_SCHEME_RE = /^[a-z][a-z\d+.-]*:/i;

function assertSafeInternalPath(pathname: string): void {
  const value = pathname.trim();
  if (value.includes('\\')) {
    throw new Error('Unsafe internal navigation destination: backslashes are forbidden.');
  }
  if (value.startsWith('//')) {
    throw new Error('Unsafe internal navigation destination: protocol-relative URLs are forbidden.');
  }
  if (ABSOLUTE_SCHEME_RE.test(value)) {
    throw new Error('Unsafe internal navigation destination: absolute URL schemes are forbidden.');
  }
}

export function assertSafeInternalTo(to: To): To {
  if (typeof to === 'string') {
    assertSafeInternalPath(to.split(/[?#]/u, 1)[0] ?? '');
    return to;
  }
  assertSafeInternalPath(to.pathname ?? '');
  return to;
}

function useSafeInternalTo(to: To): To {
  return useMemo(() => assertSafeInternalTo(to), [to]);
}

function useIntentPreload(to: To) {
  const safeTo = useSafeInternalTo(to);
  const resolved = useResolvedPath(safeTo);
  const warmedRef = useRef(false);

  useEffect(() => {
    warmedRef.current = false;
  }, [resolved.pathname]);

  return useCallback(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    scheduleRoutePreload(resolved);
  }, [resolved]);
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, onFocus, onPointerEnter, onTouchStart, ...props },
  ref,
) {
  const safeTo = useSafeInternalTo(to);
  const preload = useIntentPreload(safeTo);
  return (
    <RouterLink
      {...props}
      to={safeTo}
      viewTransition
      ref={ref}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        if (!event.defaultPrevented) preload();
      }}
    />
  );
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, onFocus, onPointerEnter, onTouchStart, ...props },
  ref,
) {
  const safeTo = useSafeInternalTo(to);
  const preload = useIntentPreload(safeTo);
  return (
    <RouterNavLink
      {...props}
      to={safeTo}
      viewTransition
      ref={ref}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        if (!event.defaultPrevented) preload();
      }}
    />
  );
});

/** `useNavigate` with the site's view-transition default baked in. */
export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        navigate(to);
        return;
      }
      navigate(assertSafeInternalTo(to), { viewTransition: true, ...options });
    },
    [navigate],
  );
}
