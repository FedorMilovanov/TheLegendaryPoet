import { forwardRef, useCallback, useEffect, useRef } from 'react';
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

function useIntentPreload(to: To) {
  const resolved = useResolvedPath(to);
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

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({
  onFocus,
  onPointerEnter,
  onTouchStart,
  ...props
}, ref) {
  const preload = useIntentPreload(props.to);
  return (
    <RouterLink
      viewTransition
      {...props}
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

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink({
  onFocus,
  onPointerEnter,
  onTouchStart,
  ...props
}, ref) {
  const preload = useIntentPreload(props.to);
  return (
    <RouterNavLink
      viewTransition
      {...props}
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
      navigate(to, { viewTransition: true, ...options });
    },
    [navigate],
  );
}
