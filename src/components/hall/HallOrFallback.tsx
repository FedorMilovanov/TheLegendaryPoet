import { Component, lazy, ReactNode, Suspense, useMemo } from 'react';
import HeroSection from '../home/HeroSection';

// Code-split the whole 3D stack (three + R3F + drei ≈ 500KB gz) so it is only
// downloaded for visitors who actually get the 3D hall — keeps homepage LCP fast.
const HallOfPoets = lazy(() => import('./HallOfPoets'));

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

  if (!canRender3D) return <HeroSection />;

  return (
    <HallErrorBoundary fallback={<HeroSection />}>
      <Suspense fallback={<HeroSection />}>
        <HallOfPoets />
      </Suspense>
    </HallErrorBoundary>
  );
}
