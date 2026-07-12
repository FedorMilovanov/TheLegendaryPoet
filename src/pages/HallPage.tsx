import HallOrFallback from '../components/hall/HallOrFallback';
import { useSeo } from '../hooks/useSeo';

/**
 * Dedicated route for the immersive 3D Hall of Poets. It is reached explicitly
 * (nav link / homepage CTA), never forced as the landing hero. The global
 * Header (logo → home, nav) stays on top, so the visitor can always leave.
 */
export default function HallPage() {
  useSeo({
    title: 'Зал Поэтов — THE LEGENDARY POET',
    description: 'Иммерсивный 3D-зал: пройдитесь по мраморному пантеону великих русских поэтов.',
    path: '/hall',
  });

  return (
    <div className="bg-[#020811]">
      <HallOrFallback />
    </div>
  );
}
