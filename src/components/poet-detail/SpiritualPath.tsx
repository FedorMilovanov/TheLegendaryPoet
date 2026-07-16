import { Shield } from '../PremiumIcons';
import { titleCase } from '../../utils/titleCase';

interface SpiritualPathProps {
  content: string;
}

export default function SpiritualPath({ content }: SpiritualPathProps) {
  return (
    <div className="luxury-card glow-hover p-10 md:p-12 rounded-[2.5rem] border border-luxury-gold/30 bg-gradient-to-br from-[#0e0c07] to-[#050505] relative shadow-2xl overflow-hidden">
      <div className="absolute -top-10 -right-10 text-luxury-gold/5 pointer-events-none">
        <Shield size={250} />
      </div>
      <h2 className="text-3xl font-serif font-bold gold-gradient gold-glow-text mb-8 flex items-center gap-3 relative z-10">
        {titleCase('Духовный путь и мировоззрение')}
      </h2>
      <p className="poetry-text text-xl text-luxury-gray-light leading-[1.8] font-light relative z-10">
        {content}
      </p>
    </div>
  );
}
