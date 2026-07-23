import { Suspense, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { supportsViewTransitions } from './lib/viewTransition';
import { hydrateFromRemote } from './utils/communityStore';
import { initAnalytics } from './utils/analytics';
import { musicTracks } from './data/poets';
import Header from './components/Header';
import Footer from './components/Footer';
import CommandPalette from './components/command/CommandPalette';
import CustomCursor from './components/CustomCursor';
import ErrorBoundary from './components/ErrorBoundary';
import SmoothScroll from './components/SmoothScroll';
import PoetryBackdrop from './components/PoetryBackdrop';
import MobileDock from './components/MobileDock';
import ScrollToTop from './components/ScrollToTop';
import BrandMark from './components/BrandMark';
import RouteLoadingShell from './components/RouteLoadingShell';
import AudioChromeBoundary from './components/music/AudioChromeBoundary';
import GlobalMiniPlayer from './components/music/GlobalMiniPlayer';
import ImmersivePlayer from './components/music/ImmersivePlayer';
import { AudioPlayerProvider, useAudioPlayer } from './components/music/AudioPlayerProvider';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';
import {
  AboutPage,
  ArticleDetailPage,
  ArticlesPage,
  EssayPage,
  HallPage,
  HomePage,
  MusicPage,
  MyArchivePage,
  NotFoundPage,
  PoetDetailPage,
  PoetsPage,
  RatingsPage,
  TrackDetailPage,
} from './routes/routeModules';

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
      <BrandMark size="lg" />
    </motion.div>
  </motion.div>
);

let introPlayed = false;

function RouteContent() {
  const location = useLocation();
  const outlet = useOutlet();
  const firstRouteRef = useRef(true);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const firstRoute = firstRouteRef.current;
    firstRouteRef.current = false;
    const timeout = window.setTimeout(() => {
      setAnnouncement(document.title || 'Страница открыта');
      if (!firstRoute) document.getElementById('main-content')?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [location.pathname]);

  const page = (
    <ErrorBoundary resetKey={location.pathname} variant="page">
      <Suspense fallback={<RouteLoadingShell />}>
        {outlet}
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
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        <div className="ambient-glow ambient-glow-3" />
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
        <Route path="/" element={<HomePage />} />
        <Route path="/hall" element={<HallPage />} />
        <Route path="/poets" element={<PoetsPage />} />
        <Route path="/poets/:id" element={<PoetDetailPage />} />
        <Route path="/ratings" element={<RatingsPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/essays/:slug" element={<EssayPage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/music/:id" element={<TrackDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/archive" element={<MyArchivePage />} />
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
      <ErrorBoundary resetKey={location.pathname}>
        <AppRoutes />
      </ErrorBoundary>
      <AudioChrome />
    </>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
  useEffect(() => { void hydrateFromRemote(); initAnalytics(); }, []);
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
