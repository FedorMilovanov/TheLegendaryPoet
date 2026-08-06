import { Scale } from 'lucide-react';
import { titleCase } from '../../utils/titleCase';

interface MoralPortraitProps {
  content: string;
}

export default function MoralPortrait({ content }: MoralPortraitProps) {
  return (
    <section
      aria-label="Характер и поступки"
      className="luxury-card relative overflow-hidden rounded-[2.5rem] border border-red-900/30 bg-gradient-to-br from-[#100808] via-[#0a0606] to-[#050505] p-10 shadow-xl md:p-12"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 text-red-900/10">
        <Scale size={240} />
      </div>
      <div className="relative z-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-700/40 bg-red-950/40 text-red-300/80">
            <Scale size={18} aria-hidden="true" />
          </span>
          <h2 className="font-serif text-2xl font-bold text-white md:text-3xl">
            {titleCase('Характер и поступки')}
          </h2>
        </div>

        <div className="poetry-text space-y-5 text-lg font-light leading-[1.85] text-luxury-gray-light md:text-xl">
          {content
            .split('\n\n')
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </div>
      </div>
    </section>
  );
}
