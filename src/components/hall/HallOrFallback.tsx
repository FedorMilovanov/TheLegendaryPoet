import { Component, lazy, ReactNode, Suspense, useMemo } from 'react';

// NOTE: this wrapper belongs to the deferred 3D Hall rebuild ("Hall v3"). It is
// NOT currently routed — /hall renders the lightweight HallPage placeholder. It
// is kept as scaffolding for the future immersive rebuild.

// Code-split the whole 3D stack (three + R3F + drei ≈ 500KB gz) so it is only
// downloaded for visitors who actually get the 3D hall — keeps homepage LCP fast.
const HallOfPoets = lazy(() => import('./HallOfPoets'));

// Minimal DOM fallback (used when WebGL is unavailable, reduced-motion is set,
// or the 3D scene throws). Self-contained so it has no cross-module deps.
function HallFallback() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#050505] px-6 text-center">
      <p className="max-w-md font-serif text-xl italic text-luxury-gray-light">
        Иммерсивный зал недоступен на этом устройстве.
      </p>
    </div>
  );
}

function webglSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  try {
    return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

/** Catches any runtime error inside the 3D hall and shows the DOM hero instead. */
class HallErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.warn('[Hall] falling back to DOM hero:', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Renders the immersive 3D Hall of Poets when the device can handle it, and the
 * lightweight DOM hero otherwise (no WebGL, reduced-motion preference, or any
 * runtime error in the 3D scene). The DOM hero is also the loading fallback so
 * there is never a blank hero while the 3D chunk streams in.
 */
export default function HallOrFallback() {
  const canRender3D = useMemo(() => webglSupported() && !prefersReducedMotion(), []);

  if (!canRender3D) return <HallFallback />;

  return (
    <HallErrorBoundary fallback={<HallFallback />}>
      <Suspense fallback={<HallFallback />}>
        <HallOfPoets />
      </Suspense>
    </HallErrorBoundary>
  );
}
