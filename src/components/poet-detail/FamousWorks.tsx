import { Poet } from '../../types/poet';

interface FamousWorksProps {
  works: Poet['famousWorks'];
}

export default function FamousWorks({ works }: FamousWorksProps) {
  return (
    <div className="luxury-card glow-hover p-8 rounded-3xl border border-luxury-gold/10 bg-[#0a0a0a]/80 backdrop-blur-md shadow-black/50">
      <h3 className="text-xs font-bold tracking-widest uppercase text-luxury-gold gold-glow-text mb-6 flex items-center gap-2 border-b border-luxury-gold/10 pb-4">
        Известные сочинения
      </h3>
      <div className="flex flex-col gap-3">
        {works.map((work) => (
          <span 
            key={work} 
            className="px-4 py-3 bg-luxury-dark-200/60 border border-luxury-gold/5 rounded-xl text-sm font-medium text-luxury-gray-light hover:text-luxury-gold hover:border-luxury-gold/40 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all cursor-default"
          >
            {work}
          </span>
        ))}
      </div>
    </div>
  );
}
