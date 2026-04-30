import { Music } from 'lucide-react';

export default function MusicIntro() {
  return (
    <div className="luxury-card mb-12 rounded-2xl border border-cyan-400/12 bg-[#07111a]/80 p-8">
      <div className="flex items-center gap-6">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-[#08131d] shadow-[0_0_24px_rgba(0,212,255,0.08)]">
          <Music size={40} className="text-cyan-300/40" />
        </div>
        <div className="flex-1">
          <h3 className="mb-2 font-serif text-2xl text-white">Музыкальный раздел</h3>
          <p className="mb-4 text-cyan-100/55">Слушайте опубликованные композиции и переходите к полным записям на каналах проекта.</p>
          <div className="h-1 overflow-hidden rounded-full bg-[#0c1822]">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(0,212,255,0.55)]" />
          </div>
        </div>
      </div>
    </div>
  );
}