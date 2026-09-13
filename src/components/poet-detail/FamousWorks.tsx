import { Poet } from '../../types/poet';

interface FamousWorksProps {
  works: Poet['famousWorks'];
}

export default function FamousWorks({ works }: FamousWorksProps) {
  return (
    <div className="luxury-card glow-hover rounded-3xl border border-luxury-gold/10 p-8 backdrop-blur-md">
      <h3 className="text-xs font-bold tracking-widest uppercase text-luxury-gold gold-glow-text mb-6 flex items-center gap-2 border-b border-luxury-gold/10 pb-4">
        Известные сочинения
      </h3>
      <div className="flex flex-col gap-3">
        {works.map((work) => (
          <span 
            key={work} 
            className="theme-elevated-surface theme-functional-muted cursor-default rounded-xl border border-luxury-gold/5 px-4 py-3 text-sm font-medium transition-all hover:border-luxury-gold/40 hover:text-luxury-gold hover:shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          >
            {work}
          </span>
        ))}
      </div>
    </div>
  );
}
