import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { poets } from '../../../data/poets';
import { hallWings, type HallWingId } from '../../../data/hall';
import { poetMuseumMeta } from '../../../data/poetMuseumMeta';
import { useAppNavigate } from '../../ui/Link';
import { scrollToId } from '../../../utils/smoothScroll';
import type { PortalPortraitData } from './PortalPortrait';

const HallAtriumScene = lazy(() => import('./HallAtriumScene'));

/** Max portraits hung per arch (museum density, not a grid). */
const PORTRAITS_PER_ARCH = 2;

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
    /* museum page still works without WebGL */
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

function buildPortraitsByWing(): Record<HallWingId, PortalPortraitData[]> {
  const byId = new Map(poets.map((p) => [p.id, p]));
  const out = {} as Record<HallWingId, PortalPortraitData[]>;
  for (const wing of hallWings) {
    out[wing.id] = wing.poetIds
      .slice(0, PORTRAITS_PER_ARCH)
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        id: p.id,
        name: p.name,
        photo: p.photo,
        years: p.deathYear ? `${p.birthYear}–${p.deathYear}` : `${p.birthYear}–н.в.`,
        // quote available via meta if needed later
        quote: poetMuseumMeta[p.id]?.mainQuote,
      }));
  }
  return out;
}

/**
 * Pass 3–4 stage: lazy R3F atrium with portraits in arches.
 * Navigation callbacks live outside Canvas (Router context does not cross R3F).
 */
export default function HallAtriumStage({
  focusWing,
  onFocusWing,
}: {
  focusWing: HallWingId | null;
  onFocusWing: (id: HallWingId | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [userEnabled, setUserEnabled] = useState(false);
  const navigate = useAppNavigate();

  const can3d = useMemo(() => webglSupported() && !prefersReducedMotion(), []);
  const enableDrift = useMemo(() => !prefersReducedMotion(), []);
  const portraitsByWing = useMemo(() => buildPortraitsByWing(), []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: '100px', threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onOpenPoet = useCallback(
    (poetId: string) => {
      try {
        sessionStorage.setItem('tlp_hall_last_poet', poetId);
      } catch {
        /* private mode */
      }
      navigate(`/poets/${poetId}`);
    },
    [navigate],
  );

  const onEnterWing = useCallback(
    (wingId: HallWingId) => {
      onFocusWing(wingId);
      scrollToId(`wing-${wingId}`);
      requestAnimationFrame(() => {
        document.getElementById(`wing-${wingId}`)?.focus({ preventScroll: true });
      });
    },
    [onFocusWing],
  );

  const onFocusWingScene = useCallback(
    (id: HallWingId | null) => {
      onFocusWing(id);
    },
    [onFocusWing],
  );

  const shouldMount = can3d && inView && userEnabled;

  const hungCount = useMemo(
    () => Object.values(portraitsByWing).reduce((n, list) => n + list.length, 0),
    [portraitsByWing],
  );

  return (
    <section
      ref={rootRef}
      className="hall-atrium-stage"
      aria-label="Объём центрального атриума"
      data-lenis-prevent={shouldMount ? true : undefined}
    >
      <div className="hall-atrium-stage-head">
        <span className="hall-atrium-stage-kicker">Проход III–IV · Объём и ниши</span>
        <h2 className="hall-atrium-stage-title">Под куполом пантеона</h2>
        <p className="hall-atrium-stage-note">
          Ротонда: мраморный пол, купол, четыре арки эпох. В проёмах — портреты из
          кураторской карты ({hungCount} в арках; остальные — в крыльях ниже). Клик по
          портрету открывает досье; клик по арке ведёт к крылу. Без «космического» тумана.
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
        {can3d && userEnabled && focusWing && (
          <button
            type="button"
            className="hall-atrium-stage-cta hall-atrium-stage-cta-ghost"
            onClick={() => onFocusWing(null)}
          >
            Сбросить взгляд камеры
          </button>
        )}
        {!can3d && <AtriumFallback reason="unavailable" />}
      </div>

      {can3d && userEnabled && (
        <div className="hall-atrium-stage-canvas-wrap">
          <AtriumErrorBoundary fallback={<AtriumFallback reason="error" />}>
            {shouldMount ? (
              <Suspense fallback={<AtriumFallback reason="loading" />}>
                <HallAtriumScene
                  enableDrift={enableDrift}
                  focusWing={focusWing}
                  portraitsByWing={portraitsByWing}
                  onFocusWing={onFocusWingScene}
                  onOpenPoet={onOpenPoet}
                  onEnterWing={onEnterWing}
                />
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
