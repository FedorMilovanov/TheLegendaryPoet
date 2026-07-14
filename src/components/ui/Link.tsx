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

/**
 * Site-standard internal navigation.
 *
 * Always import `Link`/`NavLink` from THIS module (never from
 * react-router-dom directly) and navigate imperatively via `useAppNavigate`.
 * They enable the View Transitions API on every route change, which powers
 * the site-wide fade-through and the shared-element morphs (poet portraits,
 * essay covers). See src/lib/viewTransition.ts for the engine notes.
 */

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  return <RouterLink viewTransition {...props} ref={ref} />;
});

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(props, ref) {
  return <RouterNavLink viewTransition {...props} ref={ref} />;
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
