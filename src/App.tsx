import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useHref, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { supportsViewTransitions } from './lib/viewTransition';
import { musicTracks } from './data/poets';
import Header from './components/Header';
import Footer from './components/Footer';
import AmbientBackdrop from './components/AmbientBackdrop';
import CommandPalette from './components/command/CommandPalette';
import CustomCursor from './components/CustomCursor';
import ErrorBoundary from './components/ErrorBoundary';
import SmoothScroll, { useRestoreRouteScroll } from './components/SmoothScroll';
import PoetryBackdrop from './components/PoetryBackdrop';
import MobileDock from './components/MobileDock';
import ScrollToTop from './components/ScrollToTop';
import SpectralBrandMark from './components/SpectralBrandMark';
import RouteLoadingShell from './components/RouteLoadingShell';
import AnalyticsConsentBanner, { AnalyticsRouteTracker } from './components/AnalyticsConsent';
import AudioChromeBoundary from './components/music/AudioChromeBoundary';
import GlobalMiniPlayer from './components/music/GlobalMiniPlayer';
import ImmersivePlayer from './components/music/ImmersivePlayer';
import { AudioPlayerProvider, useAudioPlayer } from './components/music/AudioPlayerProvider';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';
import { applicationRoutes, legacyRedirects, NotFoundPage } from './routes/routeModules';
import { observeBrowserAddress } from './utils/browserNavigation';
import { hasSettledPageHead, PAGE_HEAD_AVAILABLE, RouteHeadAddress, syncDiscoveryAddress } from './routes/discoveryHead';
import { ANALYTICS_CONSENT_EVENT, notifyAnalyticsRouteSettled } from './utils/analytics';

const WipeOverlay = () => (
  <motion.div
    className="page-wipe pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
    style={{ originY: 1 }}
    initial={{ scaleY: 1 }}
    animate={{ scaleY: 0 }}
    exit={{ scaleY: 1 }}
    transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
    aria-hidden="true"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.78 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.78, 1, 1, 0.78] }}
      transition={{ duration: 0.72, times: [0, 0.25, 0.75, 1] }}
      className="pointer-events-none"
    >
      <SpectralBrandMark size="lg" variant="primary" interactive={false} priority />
    </motion.div>
  </motion.div>
);

let introPlayed = false;

let settledSequence = 0;

function RouteSettled({ pathname, announce, children }: { pathname: string; announce: (title: string) => void; children: ReactNode }) {
  const href = useHref(pathname);
  useRestoreRouteScroll(pathname);
  useEffect(() => {
    // A token belongs to a committed pathname, not an attempted render.
    // Grant during a transition must not replay the previous page's view;
    // Back can make this same mounted visit eligible again without remounting.
    const navigationToken = `${pathname}:${++settledSequence}`;
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!hasSettledPageHead(href)) return;
        const title = document.title || 'Страница открыта';
        announce(title);
        notifyAnalyticsRouteSettled({ path: pathname, title, navigationToken });
      }, 0);
    };
    schedule();
    window.addEventListener(PAGE_HEAD_AVAILABLE, schedule);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, schedule);
    return () => {
      window.removeEventListener(PAGE_HEAD_AVAILABLE, schedule);
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, schedule);
      window.clearTimeout(timer);
    };
  }, [announce, href, pathname]);
  return <RouteHeadAddress.Provider value={href}>{children}</RouteHeadAddress.Provider>;
}

function RouteContent() {
  const location = useLocation();
  const outlet = useOutlet();
  const [announcement, setAnnouncement] = useState('');

  const page = (
    <ErrorBoundary location={location} variant="page">
      <Suspense fallback={<RouteLoadingShell />}>
        <RouteSettled pathname={location.pathname} announce={setAnnouncement}>
          {outlet}
        </RouteSettled>
      </Suspense>
    </ErrorBoundary>
  );

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      {supportsViewTransitions ? page : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            // Fade the page, not its layout origin: a translated article puts
            // even a correctly restored paragraph below the reading line.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
          >
            {page}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}

function SiteLayout() {
  useAutoHideChrome();
  const showIntro = useRef(!introPlayed).current;
  useEffect(() => { introPlayed = true; }, []);

  return (
    <SmoothScroll>
      <div className="theme-page-surface relative min-h-screen overflow-x-clip selection:bg-luxury-gold/30">
        {showIntro && <WipeOverlay />}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-cyan-400 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-black">
          Перейти к содержанию
        </a>
        <AmbientBackdrop />
        <PoetryBackdrop />
        <CustomCursor />
        <Header />
        <CommandPalette />
        <main id="main-content" tabIndex={-1} className="relative z-10 min-h-screen pb-32 outline-none md:pb-0">
          <RouteContent />
        </main>
        <MobileDock />
        <ScrollToTop />
        <div className="relative z-10"><Footer /></div>
      </div>
    </SmoothScroll>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        {applicationRoutes.map(({ id, path, Component }) => (
          <Route key={id} path={path} element={<Component />} />
        ))}
        {legacyRedirects.map(({ from, to }) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function AudioChrome() {
  const { currentTrack, closePlayer } = useAudioPlayer();
  return (
    <AudioChromeBoundary resetKey={currentTrack?.id ?? 'idle'} onStop={closePlayer}>
      <GlobalMiniPlayer />
      <ImmersivePlayer />
    </AudioChromeBoundary>
  );
}

function RoutedApp() {
  useLayoutEffect(() => observeBrowserAddress(syncDiscoveryAddress), []);
  const location = useLocation();
  return (
    <>
      <AnalyticsRouteTracker />
      <ErrorBoundary location={location}>
        <AppRoutes />
      </ErrorBoundary>
      <AudioChrome />
      <AnalyticsConsentBanner />
    </>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
  return (
    <AudioPlayerProvider tracks={musicTracks}>
      <Router basename={basename}>
        <MotionConfig reducedMotion="user">
          <RoutedApp />
        </MotionConfig>
      </Router>
    </AudioPlayerProvider>
  );
}

export default App;
