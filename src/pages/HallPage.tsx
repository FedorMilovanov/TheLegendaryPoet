import { HallProductionRuntime } from '../components/hall-v3/HallProductionRuntime';
import { useSeo } from '../hooks/useSeo';

export default function HallPage() {
  useSeo({
    title: 'Зал Поэтов — THE LEGENDARY POET',
    description: 'Иммерсивный браузерный зал русской поэзии: первый H3/R1/L0/UV0 музейный срез с экскурсионной камерой и доступным fallback.',
    path: '/hall',
  });

  return <HallProductionRuntime />;
}
