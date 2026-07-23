import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { supportsViewTransitions } from './lib/viewTransition';
import { hydrateFromRemote } from './utils/communityStore';
import { initAnalytics } from './utils/analytics';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HallPage from './pages/HallPage';
import PoetsPage from './pages/PoetsPage';
import PoetDetailPage from './pages/PoetDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import EssayPage from './pages/EssayPage';
import MusicPage from './pages/MusicPage';
import AboutPage from './pages/AboutPage';
import MyArchivePage from './pages/MyArchivePage';
import NotFoundPage from './pages/NotFoundPage';
import CommandPalette from './components/command/CommandPalette';
import CustomCursor from './components/CustomCursor';
import ErrorBoundary from './components/ErrorBoundary';
import SmoothScroll from './components/SmoothScroll';
import PoetryBackdrop from './components/PoetryBackdrop';
import MobileDock from './components/MobileDock';
import ScrollToTop from './components/ScrollToTop';
import BrandMark from './components/BrandMark';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';

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

// With View Transitions the brand wipe plays only once — as the site's opening
// reveal. Route changes are handled by the browser (see lib/viewTransition.ts).
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

  // Fallback for browsers without the View Transitions API: the classic
  // framer wipe + fade on every navigation.
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

/**
 * Persistent application shell.
 *
 * Header, command palette, cursor, ambient layers, footer and the Lenis owner
 * remain mounted while only the route page changes. Recreating the whole shell
 * on every navigation used to restart global listeners and RAF loops, reset
 * modal state and make browser View Transition snapshots less deterministic.
 */
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
          {/* The keyed Routes element gives AnimatePresence one page child at a
              time without unmounting the surrounding application shell. */}
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
      <Route path="/articles" element={<PageWrapper><ArticlesPage /></PageWrapper>} />
      <Route path="/essays/:slug" element={<PageWrapper><EssayPage /></PageWrapper>} />
      <Route path="/articles/:id" element={<PageWrapper><ArticleDetailPage /></PageWrapper>} />
      <Route path="/music" element={<PageWrapper><MusicPage /></PageWrapper>} />
      <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
      <Route path="/archive" element={<PageWrapper><MyArchivePage /></PageWrapper>} />
      <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
    </Routes>
  );

  return <SiteLayout>{routes}</SiteLayout>;
}

function RoutedApp() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <AnimatedRoutes />
    </ErrorBoundary>
  );
}

function App() {
  // Router base so links work under the GitHub Pages sub-path (/TheLegendaryPoet/).
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  // If a shared backend is configured, pull everyone's ratings/comments once.
  // No-op (and no network) when it isn't — the app stays on the local store.
  useEffect(() => {
    void hydrateFromRemote();
    initAnalytics();
  }, []);

  return (
    <Router basename={basename}>
      <MotionConfig reducedMotion="user">
        <RoutedApp />
      </MotionConfig>
    </Router>
  );
}

export default App;
