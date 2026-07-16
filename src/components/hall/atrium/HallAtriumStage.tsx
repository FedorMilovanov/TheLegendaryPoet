import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const HallAtriumScene = lazy(() => import('./HallAtriumScene'));

function webglSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl')),
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

class AtriumErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    // Quiet fallback — museum page still works without WebGL.
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function AtriumFallback({ reason }: { reason: 'loading' | 'unavailable' | 'error' }) {
  const copy =
    reason === 'loading'
      ? 'Собираем свет купола…'
      : reason === 'unavailable'
        ? 'Объём атриума недоступен на этом устройстве или при «уменьшить движение». Кураторские крылья ниже — полная карта зала.'
        : 'Объём атриума временно недоступен. Крылья ниже остаются открыты.';
  return (
    <div className="hall-atrium-stage-fallback" role="status">
      <p>{copy}</p>
    </div>
  );
}

/**
 * Pass 3 stage: lazy-loads the warm R3F atrium only when scrolled into view
 * and the device can handle WebGL. Never imported by the homepage shell.
 */
export default function HallAtriumStage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [userEnabled, setUserEnabled] = useState(false);

  const can3d = useMemo(() => webglSupported() && !prefersReducedMotion(), []);
  const enableDrift = useMemo(() => !prefersReducedMotion(), []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: '80px', threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shouldMount = can3d && inView && userEnabled;

  return (
    <section
      ref={rootRef}
      className="hall-atrium-stage"
      aria-label="Объём центрального атриума"
      data-lenis-prevent={shouldMount ? true : undefined}
    >
      <div className="hall-atrium-stage-head">
        <span className="hall-atrium-stage-kicker">Проход III · Объём</span>
        <h2 className="hall-atrium-stage-title">Взгляд под купол</h2>
        <p className="hall-atrium-stage-note">
          Тёплый ротонда-атриум: пол, купол, четыре арки эпох. Без портретов и без
          «космического» тумана — только камень, золото и свет. Ниши по-прежнему в
          кураторских крыльях ниже.
        </p>
        {can3d && !userEnabled && (
          <button
            type="button"
            className="hall-atrium-stage-cta"
            onClick={() => setUserEnabled(true)}
          >
            Открыть объём атриума
          </button>
        )}
        {!can3d && <AtriumFallback reason="unavailable" />}
      </div>

      {can3d && userEnabled && (
        <div className="hall-atrium-stage-canvas-wrap">
          <AtriumErrorBoundary fallback={<AtriumFallback reason="error" />}>
            {shouldMount ? (
              <Suspense fallback={<AtriumFallback reason="loading" />}>
                <HallAtriumScene enableDrift={enableDrift} />
              </Suspense>
            ) : (
              <AtriumFallback reason="loading" />
            )}
          </AtriumErrorBoundary>
        </div>
      )}
    </section>
  );
}
