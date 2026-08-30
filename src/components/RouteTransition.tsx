import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { ENTER } from '../utils/motion';

interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * Wraps the current, Suspense-resolved route with a light fade/slide-in
 * (see `ENTER` in utils/motion — transform + opacity only, so it never
 * affects layout or causes a jump).
 *
 * Keyed by pathname: each navigation gives this wrapper a new key, so React
 * remounts it and the entrance animation replays on the freshly-rendered
 * page. Lives inside the route-level `<Suspense fallback={<RouteFallback />}>`
 * in App.tsx, so it only mounts once a lazy route has actually resolved —
 * RouteFallback itself is untouched.
 *
 * Skips the animation entirely under `prefers-reduced-motion` (or the app's
 * own motion-preference override), matching every other entrance transition
 * in the app (see RoundCard, modals, drawers).
 */
export default function RouteTransition({ children }: RouteTransitionProps) {
  const { pathname } = useLocation();
  const { reduced } = useReducedMotion();

  return (
    <div key={pathname} className={reduced ? undefined : ENTER}>
      {children}
    </div>
  );
}
