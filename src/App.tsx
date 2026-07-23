import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { supportsViewTransitions } from './lib/viewTransition';
import { routeLoaders } from './lib/routeModules';
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
import AudioChromeBoundary from './components/music/AudioChromeBoundary';
import GlobalMiniPlayer from './components/music/GlobalMiniPlayer';
import ImmersivePlayer from './components/music/ImmersivePlayer';
import { AudioPlayerProvider, useAudioPlayer } from './components/music/AudioPlayerProvider';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';

// Route code and its large literary datasets are loaded only when requested.
// The persistent shell remains in the entry chunk, so navigation, focus, the
// global audio element and the one Lenis/RAF owner survive route transitions.
const HomePage = lazy(routeLoaders.home);
const HallPage = lazy(routeLoaders.hall);
const PoetsPage = lazy(routeLoaders.poets);
const PoetDetailPage = lazy(routeLoaders.poet);
const RatingsPage = lazy(routeLoaders.ratings);
const ArticlesPage = lazy(routeLoaders.articles);
const ArticleDetailPage = lazy(routeLoaders.article);
const EssayPage = lazy(routeLoaders.essay);
const MusicPage = lazy(routeLoaders.music);
const TrackDetailPage = lazy(routeLoaders.track);
const AboutPage = lazy(routeLoaders.about);
const MyArchivePage = lazy(routeLoaders.archive);
const NotFoundPage = lazy(routeLoaders.notFound);

const WipeOverlay = () => (
  <motion.div
    className="page-wipe pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
    style={{ originY: 1 }}
    initial={{ scaleY: 1 }}
    animate={{ scaleY: 0 }}
    exit={{ scaleY: 1 }}
    transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
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

function RouteFallback() {
  return (
    <div
      className="flex min-h-[70svh] items-center justify-center px-6 pt-28 text-center"
      role="status"
      aria-live="polite"
      aria-label="Загрузка раздела"
    >
      <div className="flex flex-col items-center gap-4 text-luxury-gold/65">
        <BrandMark size="md" />
        <span className="text-[10px] font-bold uppercase tracking-[0.24em]">Открываем раздел</span>
      </div>
    </div>
  );
}

let introPlayed = false;

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const showIntro = useRef(!introPlayed).current;
  useEffect(() => {
    introPlayed = true;
  }, []);

  if (supportsViewTransitions) {
    return (
      <>
        {showIntro && <WipeOverlay />}
        {children}
      </>
    );
  }

  return (
    <>
      <WipeOverlay />
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
      >
        {children}
      </motion.div>
    </>
  );
};

function SiteLayout({ children }: { children: React.ReactNode }) {
  useAutoHideChrome();
  return (
    <SmoothScroll>
      <div className="relative min-h-screen overflow-x-clip bg-[#050505] selection:bg-luxury-gold/30">
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
        <main id="main-content" className="relative z-10 pb-32 md:pb-0">
          {supportsViewTransitions ? children : <AnimatePresence mode="wait">{children}</AnimatePresence>}
        </main>
        <MobileDock />
        <ScrollToTop />
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </SmoothScroll>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const routes = (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
      <Route path="/hall" element={<PageWrapper><HallPage /></PageWrapper>} />
      <Route path="/poets" element={<PageWrapper><PoetsPage /></PageWrapper>} />
      <Route path="/poets/:id" element={<PageWrapper><PoetDetailPage /></PageWrapper>} />
      <Route path="/ratings" element={<PageWrapper><RatingsPage /></PageWrapper>} />
      <Route path="/articles" element={<PageWrapper><ArticlesPage /></PageWrapper>} />
      <Route path="/essays/:slug" element={<PageWrapper><EssayPage /></PageWrapper>} />
      <Route path="/articles/:id" element={<PageWrapper><ArticleDetailPage /></PageWrapper>} />
      <Route path="/music" element={<PageWrapper><MusicPage /></PageWrapper>} />
      <Route path="/music/:id" element={<PageWrapper><TrackDetailPage /></PageWrapper>} />
      <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
      <Route path="/archive" element={<PageWrapper><MyArchivePage /></PageWrapper>} />
      <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
    </Routes>
  );

  return (
    <SiteLayout>
      <Suspense fallback={<RouteFallback />}>{routes}</Suspense>
    </SiteLayout>
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
        <AnimatedRoutes />
      </ErrorBoundary>
      <AudioChrome />
    </>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  useEffect(() => {
    void hydrateFromRemote();
    initAnalytics();
  }, []);

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
