import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation, useOutlet } from 'react-router';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { supportsViewTransitions } from './lib/viewTransition';
import { musicTracks } from './data/poets';
import Header from './components/Header';
import Footer from './components/Footer';
import AmbientBackdrop from './components/AmbientBackdrop';
import CommandPalette from './components/command/CommandPalette';
import CustomCursor from './components/CustomCursor';
import ErrorBoundary from './components/ErrorBoundary';
import SmoothScroll from './components/SmoothScroll';
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

function RouteSettled({ pathname, onSettled, children }: { pathname: string; onSettled: () => void; children: ReactNode }) {
  useEffect(() => {
    const timeout = window.setTimeout(onSettled, 0);
    return () => window.clearTimeout(timeout);
  }, [onSettled, pathname]);
  return <>{children}</>;
}

function RouteContent() {
  const location = useLocation();
  const outlet = useOutlet();
  const renderedPathRef = useRef(location.pathname);
  const shouldFocusOnSettleRef = useRef(false);
  const [announcement, setAnnouncement] = useState('');

  if (renderedPathRef.current !== location.pathname) {
    renderedPathRef.current = location.pathname;
    shouldFocusOnSettleRef.current = true;
  }

  const handleSettled = useCallback(() => {
    setAnnouncement(document.title || 'Страница открыта');
    // The render boundary records every pathname transition, including a
    // return to the URL that opened the session. The first document render is
    // passive, while every real SPA transition owns focus after lazy content
    // has settled.
    if (shouldFocusOnSettleRef.current) {
      shouldFocusOnSettleRef.current = false;
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  const page = (
    <ErrorBoundary resetKey={location.pathname} variant="page">
      <Suspense fallback={<RouteLoadingShell />}>
        <RouteSettled pathname={location.pathname} onSettled={handleSettled}>
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
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
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
      <div className="relative min-h-screen overflow-x-clip bg-[#050505] selection:bg-luxury-gold/30">
        {showIntro && <WipeOverlay />}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-cyan-400 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-black">
          Перейти к содержанию
        </a>
        <AmbientBackdrop />
        <PoetryBackdrop />
        <div className="noise-bg" />
        <CustomCursor />
        <Header />
        <CommandPalette />
        <main id="main-content" tabIndex={-1} className="relative z-10 pb-32 outline-none md:pb-0">
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
  const location = useLocation();
  return (
    <>
      <AnalyticsRouteTracker />
      <ErrorBoundary resetKey={location.pathname}>
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
