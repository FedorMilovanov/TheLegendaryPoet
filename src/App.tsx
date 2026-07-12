import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { hydrateFromRemote } from './utils/communityStore';
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

const WipeOverlay = () => (
  <motion.div
    className="page-wipe fixed inset-0 z-[100] flex items-center justify-center"
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

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
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

function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <div className="relative min-h-screen overflow-x-hidden bg-[#050505] selection:bg-luxury-gold/30">
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
          <AnimatePresence mode="wait">{children}</AnimatePresence>
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
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<SiteLayout><PageWrapper><HomePage /></PageWrapper></SiteLayout>} />
      <Route path="/hall" element={<SiteLayout><PageWrapper><HallPage /></PageWrapper></SiteLayout>} />
      <Route path="/poets" element={<SiteLayout><PageWrapper><PoetsPage /></PageWrapper></SiteLayout>} />
      <Route path="/poets/:id" element={<SiteLayout><PageWrapper><PoetDetailPage /></PageWrapper></SiteLayout>} />
      <Route path="/articles" element={<SiteLayout><PageWrapper><ArticlesPage /></PageWrapper></SiteLayout>} />
      <Route path="/essays/:slug" element={<SiteLayout><PageWrapper><EssayPage /></PageWrapper></SiteLayout>} />
      <Route path="/articles/:id" element={<SiteLayout><PageWrapper><ArticleDetailPage /></PageWrapper></SiteLayout>} />
      <Route path="/music" element={<SiteLayout><PageWrapper><MusicPage /></PageWrapper></SiteLayout>} />
      <Route path="/about" element={<SiteLayout><PageWrapper><AboutPage /></PageWrapper></SiteLayout>} />
      <Route path="/archive" element={<SiteLayout><PageWrapper><MyArchivePage /></PageWrapper></SiteLayout>} />
      <Route path="*" element={<SiteLayout><PageWrapper><NotFoundPage /></PageWrapper></SiteLayout>} />
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
  // Router base so links work under the GitHub Pages sub-path (/TheLegendaryPoet/).
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  // If a shared backend is configured, pull everyone's ratings/comments once.
  // No-op (and no network) when it isn't — the app stays on the local store.
  useEffect(() => {
    void hydrateFromRemote();
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
