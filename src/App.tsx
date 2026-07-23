import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { supportsViewTransitions } from './lib/viewTransition';
import { hydrateFromRemote } from './utils/communityStore';
import { initAnalytics } from './utils/analytics';
import { musicTracks } from './data/poets';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import HallPage from './pages/HallPage';
import PoetsPage from './pages/PoetsPage';
import PoetDetailPage from './pages/PoetDetailPage';
import RatingsPage from './pages/RatingsPage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import EssayPage from './pages/EssayPage';
import MusicPage from './pages/MusicPage';
import TrackDetailPage from './pages/TrackDetailPage';
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
import GlobalMiniPlayer from './components/music/GlobalMiniPlayer';
import ImmersivePlayer from './components/music/ImmersivePlayer';
import { AudioPlayerProvider } from './components/music/AudioPlayerProvider';
import { useAutoHideChrome } from './hooks/useAutoHideChrome';

const WipeOverlay = () => <motion.div className="page-wipe pointer-events-none fixed inset-0 z-[100] flex items-center justify-center" style={{ originY: 1 }} initial={{ scaleY: 1 }} animate={{ scaleY: 0 }} exit={{ scaleY: 1 }} transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}><motion.div initial={{ opacity: 0, scale: 0.78 }} animate={{ opacity: [0, 1, 1, 0], scale: [0.78, 1, 1, 0.78] }} transition={{ duration: 0.72, times: [0, 0.25, 0.75, 1] }} className="pointer-events-none"><BrandMark size="lg" /></motion.div></motion.div>;
let introPlayed = false;
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const showIntro = useRef(!introPlayed).current;
  useEffect(() => { introPlayed = true; }, []);
  if (supportsViewTransitions) return <>{showIntro && <WipeOverlay />}{children}</>;
  return <><WipeOverlay /><motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}>{children}</motion.div></>;
};
function SiteLayout({ children }: { children: React.ReactNode }) {
  useAutoHideChrome();
  return <SmoothScroll><div className="relative min-h-screen overflow-x-clip bg-[#050505] selection:bg-luxury-gold/30"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-cyan-400 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-black">Перейти к содержанию</a><div className="ambient-glow ambient-glow-1" /><div className="ambient-glow ambient-glow-2" /><div className="ambient-glow ambient-glow-3" /><PoetryBackdrop /><div className="noise-bg" /><CustomCursor /><Header /><CommandPalette /><main id="main-content" className="relative z-10 pb-32 md:pb-0">{supportsViewTransitions ? children : <AnimatePresence mode="wait">{children}</AnimatePresence>}</main><MobileDock /><ScrollToTop /><div className="relative z-10"><Footer /></div></div></SmoothScroll>;
}
function AnimatedRoutes() {
  const location = useLocation();
  return <Routes location={location} key={location.pathname}><Route path="/" element={<SiteLayout><PageWrapper><HomePage /></PageWrapper></SiteLayout>} /><Route path="/hall" element={<SiteLayout><PageWrapper><HallPage /></PageWrapper></SiteLayout>} /><Route path="/poets" element={<SiteLayout><PageWrapper><PoetsPage /></PageWrapper></SiteLayout>} /><Route path="/poets/:id" element={<SiteLayout><PageWrapper><PoetDetailPage /></PageWrapper></SiteLayout>} /><Route path="/ratings" element={<SiteLayout><PageWrapper><RatingsPage /></PageWrapper></SiteLayout>} /><Route path="/articles" element={<SiteLayout><PageWrapper><ArticlesPage /></PageWrapper></SiteLayout>} /><Route path="/essays/:slug" element={<SiteLayout><PageWrapper><EssayPage /></PageWrapper></SiteLayout>} /><Route path="/articles/:id" element={<SiteLayout><PageWrapper><ArticleDetailPage /></PageWrapper></SiteLayout>} /><Route path="/music" element={<SiteLayout><PageWrapper><MusicPage /></PageWrapper></SiteLayout>} /><Route path="/music/:id" element={<SiteLayout><PageWrapper><TrackDetailPage /></PageWrapper></SiteLayout>} /><Route path="/about" element={<SiteLayout><PageWrapper><AboutPage /></PageWrapper></SiteLayout>} /><Route path="/archive" element={<SiteLayout><PageWrapper><MyArchivePage /></PageWrapper></SiteLayout>} /><Route path="*" element={<SiteLayout><PageWrapper><NotFoundPage /></PageWrapper></SiteLayout>} /></Routes>;
}
function RoutedApp() {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}><AnimatedRoutes /><GlobalMiniPlayer /><ImmersivePlayer /></ErrorBoundary>;
}
function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');
  useEffect(() => { void hydrateFromRemote(); initAnalytics(); }, []);
  return <AudioPlayerProvider tracks={musicTracks}><Router basename={basename}><MotionConfig reducedMotion="user"><RoutedApp /></MotionConfig></Router></AudioPlayerProvider>;
}
export default App;
