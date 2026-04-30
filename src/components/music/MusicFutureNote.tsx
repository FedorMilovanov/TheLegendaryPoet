import { Music } from 'lucide-react';

export default function MusicFutureNote() {
  return (
    <div className="luxury-card mt-12 rounded-xl border border-cyan-400/15 bg-cyan-950/15 p-6">
      <div className="flex items-start gap-4">
        <Music className="mt-1 flex-shrink-0 text-cyan-300" size={24} />
        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">Раздел продолжит расти</h3>
          <p className="text-sm leading-relaxed text-cyan-100/55">
            Со временем здесь появятся новые записи, чтения, музыкальные интерпретации и аккуратно оформленные переходы на полные публикации проекта.
          </p>
        </div>
      </div>
    </div>
  );
}