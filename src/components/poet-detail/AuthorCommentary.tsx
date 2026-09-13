import { Quote } from 'lucide-react';
import { titleCase } from '../../utils/titleCase';

interface AuthorCommentaryProps {
  content: string;
}

export default function AuthorCommentary({ content }: AuthorCommentaryProps) {
  return (
    <section
      aria-label="Итог"
      className="theme-elevated-surface luxury-card glow-hover relative overflow-hidden rounded-[2.5rem] border-l-[6px] border-l-luxury-gold p-10 shadow-xl md:p-12"
    >
      <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 text-luxury-gold/5">
        <Quote size={200} />
      </div>
      <h2 className="theme-text relative z-10 mb-6 flex items-center gap-3 font-serif text-2xl font-bold md:text-3xl">
        {titleCase('Итог')}
      </h2>
      <p className="theme-text relative z-10 text-xl font-light italic leading-[1.8]">
        {content}
      </p>
    </section>
  );
}
