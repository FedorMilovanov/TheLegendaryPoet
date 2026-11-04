import { lazy, Suspense } from 'react';

// Keep nested editorial content behind its own code-splitting boundary while
// preserving PoetDetailPage itself as a named dynamic route in the Vite manifest.
const AkhmatovaReadingGuide = lazy(() => import('./AkhmatovaReadingGuide'));

export default function AkhmatovaReadingGuideLoader() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-luxury-gray-light">Загрузка литературного путеводителя…</p>}>
      <AkhmatovaReadingGuide />
    </Suspense>
  );
}
