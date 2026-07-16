import { useSeo } from '../hooks/useSeo';
import HallMuseum from '../components/hall/museum/HallMuseum';

/**
 * Hall of Poets v3 — museum vestibule + optional warm R3F atrium (Pass 3).
 *
 * WebGL enters only via lazy() inside HallMuseum → atrium stage → scene,
 * never on the homepage shell. Legacy nave scaffolding is not routed.
 */
export default function HallPage() {
  useSeo({
    title: 'Храм русской поэзии — Зал Поэтов — THE LEGENDARY POET',
    description:
      'Музейный пантеон великих русских поэтов: четыре крыла по эпохам — Золотой век, Серебряный век, советская и современная поэзия. Тёплый атриум под куполом.',
    path: '/hall',
    keywords: 'зал поэтов, храм русской поэзии, музей, Пушкин, Ахматова, пантеон',
  });

  return <HallMuseum />;
}
