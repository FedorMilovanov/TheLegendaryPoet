import { Quote } from '../PremiumIcons';

interface AuthorCommentaryProps {
  content: string;
}

export default function AuthorCommentary({ content }: AuthorCommentaryProps) {
  return (
    <div className="luxury-card glow-hover p-10 md:p-12 rounded-[2.5rem] border-l-[6px] border-l-luxury-gold bg-[#0a0a0a] shadow-xl relative overflow-hidden">
      <div className="absolute right-0 bottom-0 text-luxury-gold/5 pointer-events-none translate-x-1/4 translate-y-1/4">
        <Quote size={200} />
      </div>
      <h2 className="text-[10px] font-bold tracking-[0.2em] text-cyan-300 neon-glow-text uppercase mb-6 flex items-center gap-3 relative z-10">
        THE LEGENDARY POET — Авторская ремарка
      </h2>
      <p className="text-xl text-white leading-[1.8] font-light italic relative z-10">
        {content}
      </p>
    </div>
  );
}
