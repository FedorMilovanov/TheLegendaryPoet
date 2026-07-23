import { forwardRef, useCallback } from 'react';
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useNavigate,
  type LinkProps,
  type NavLinkProps,
  type NavigateOptions,
  type To,
} from 'react-router-dom';
import { preloadRoute } from '../../lib/routeModules';

/**
 * Site-standard internal navigation.
 *
 * Always import `Link`/`NavLink` from THIS module (never from
 * react-router-dom directly) and navigate imperatively via `useAppNavigate`.
 * They enable the View Transitions API on every route change, which powers
 * the site-wide fade-through and the shared-element morphs (poet portraits,
 * essay covers). See src/lib/viewTransition.ts for the engine notes.
 */

function pathnameFromTo(to: To): string | undefined {
  if (typeof to === 'string') return to;
  return to.pathname;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, onPointerEnter, onPointerDown, onFocus, ...props },
  ref,
) {
  const preload = () => {
    const pathname = pathnameFromTo(to);
    if (pathname) void preloadRoute(pathname);
  };

  return (
    <RouterLink
      viewTransition
      {...props}
      to={to}
      ref={ref}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (!event.defaultPrevented) preload();
      }}
    />
  );
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { to, onPointerEnter, onPointerDown, onFocus, ...props },
  ref,
) {
  const preload = () => {
    const pathname = pathnameFromTo(to);
    if (pathname) void preloadRoute(pathname);
  };

  return (
    <RouterNavLink
      viewTransition
      {...props}
      to={to}
      ref={ref}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) preload();
      }}
      onFocus={(event) => {
        onFocus?.(event);
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
      const pathname = pathnameFromTo(to);
      if (pathname) void preloadRoute(pathname);
      navigate(to, { viewTransition: true, ...options });
    },
    [navigate],
  );
}
