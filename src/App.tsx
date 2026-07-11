import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { hydrateFromRemote } from './utils/communityStore';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import PoetsPage from './pages/PoetsPage';
import PoetDetailPage from './pages/PoetDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import MusicPage from './pages/MusicPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import CommandPalette from './components/command/CommandPalette';
import CustomCursor from './components/CustomCursor';
import SmoothScroll from './components/SmoothScroll';

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <>
    <motion.div
      initial={{ scaleY: 1 }}
      animate={{ scaleY: 0 }}
      exit={{ scaleY: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-luxury-dark-100 origin-bottom pointer-events-none flex items-center justify-center"
    >
      <div className="neon-blue-gradient neon-glow-text font-serif text-4xl tracking-widest uppercase">THE LEGENDARY POET</div>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      {children}
    </motion.div>
  </>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/poets" element={<PageWrapper><PoetsPage /></PageWrapper>} />
        <Route path="/poets/:id" element={<PageWrapper><PoetDetailPage /></PageWrapper>} />
        <Route path="/articles" element={<PageWrapper><ArticlesPage /></PageWrapper>} />
        <Route path="/articles/:id" element={<PageWrapper><ArticleDetailPage /></PageWrapper>} />
        <Route path="/music" element={<PageWrapper><MusicPage /></PageWrapper>} />
        <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
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
        <SmoothScroll>
          <div className="min-h-screen bg-[#050505] selection:bg-luxury-gold/30 relative overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="ambient-glow ambient-glow-1" />
            <div className="ambient-glow ambient-glow-2" />
            <div className="ambient-glow ambient-glow-3" />
            <CustomCursor />
            <Header />
            <CommandPalette />
            <main>
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
        </SmoothScroll>
      </MotionConfig>
    </Router>
  );
}

export default App;
