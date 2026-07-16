import { useSeo } from '../hooks/useSeo';
import HallMuseum from '../components/hall/museum/HallMuseum';

/**
 * Hall of Poets v3 — museum vestibule (Pass 1).
 *
 * Intentionally DOM-first: warm pantheon, four era wings, curated niches.
 * The old R3F nave scaffolding under src/components/hall/* is NOT imported —
 * three.js stays out of this route until a dedicated R3F pass lands.
 */
export default function HallPage() {
  useSeo({
    title: 'Храм русской поэзии — Зал Поэтов — THE LEGENDARY POET',
    description:
      'Музейный пантеон великих русских поэтов: четыре крыла по эпохам — Золотой век, Серебряный век, советская и современная поэзия.',
    path: '/hall',
    keywords: 'зал поэтов, храм русской поэзии, музей, Пушкин, Ахматова, пантеон',
  });

  return <HallMuseum />;
}
