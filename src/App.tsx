import { lazy, Suspense, useEffect, useRef, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { supportsViewTransitions } from './lib/viewTransition';
import { hydrateFromRemote } from './utils/communityStore';
import { initAnalytics } from './utils/analytics';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CommandPalette from './components/command/CommandPalette';
import CustomCursor from './components/CustomCursor';
import ErrorBoundary from './components/ErrorBoundary';
import SmoothScroll from './components/SmoothScroll';
import PoetryBackdrop from './components/PoetryBackdrop';
import MobileDock from './components/MobileDock';
import ScrollToTop from './components/ScrollToTop';
import BrandMark from './components/BrandMark';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';

// Route-level code splitting: keep the shell + homepage lean. Secondary
// sections download only when first visited. Essay data is especially heavy.
const HallPage = lazy(() => import('./pages/HallPage'));
const PoetsPage = lazy(() => import('./pages/PoetsPage'));
const PoetDetailPage = lazy(() => import('./pages/PoetDetailPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const EssayPage = lazy(() => import('./pages/EssayPage'));
const MusicPage = lazy(() => import('./pages/MusicPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const MyArchivePage = lazy(() => import('./pages/MyArchivePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteFallback() {
  return (
    <div className="flex min-h-[50svh] items-center justify-center" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <BrandMark size="md" />
        <div className="h-px w-16 overflow-hidden rounded-full bg-cyan-400/15">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-400/50" />
        </div>
        <span className="sr-only">Загрузка раздела</span>
      </div>
    </div>
  );
}

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

const PageWrapper = ({ children }: { children: ReactNode }) => {
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

/**
 * Persistent shell: header, footer, scroll, chrome.
 * Mounted once via a layout route so navigation does not remount Lenis,
 * the command palette, or the custom cursor on every page change.
 */
function SiteLayout() {
  useAutoHideChrome();
  const location = useLocation();

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
          <Suspense fallback={<RouteFallback />}>
            {supportsViewTransitions ? (
              <Outlet />
            ) : (
              <AnimatePresence mode="wait">
                <PageWrapper key={location.pathname}>
                  <Outlet />
                </PageWrapper>
              </AnimatePresence>
            )}
          </Suspense>
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

/** Page element with optional one-shot intro (View Transitions path). */
function Page({ children }: { children: ReactNode }) {
  if (supportsViewTransitions) {
    return <PageWrapper>{children}</PageWrapper>;
  }
  return <>{children}</>;
}

function AnimatedRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Page><HomePage /></Page>} />
        <Route path="/hall" element={<Page><HallPage /></Page>} />
        <Route path="/poets" element={<Page><PoetsPage /></Page>} />
        <Route path="/poets/:id" element={<Page><PoetDetailPage /></Page>} />
        <Route path="/articles" element={<Page><ArticlesPage /></Page>} />
        <Route path="/essays/:slug" element={<Page><EssayPage /></Page>} />
        <Route path="/articles/:id" element={<Page><ArticleDetailPage /></Page>} />
        <Route path="/music" element={<Page><MusicPage /></Page>} />
        <Route path="/about" element={<Page><AboutPage /></Page>} />
        <Route path="/archive" element={<Page><MyArchivePage /></Page>} />
        <Route path="*" element={<Page><NotFoundPage /></Page>} />
      </Route>
    </Routes>
  );
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
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

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
