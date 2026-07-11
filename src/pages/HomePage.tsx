import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import { poets } from '../data/poets';
import PoetCard from '../components/PoetCard';
import MagneticButton from '../components/MagneticButton';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import { useSeo } from '../hooks/useSeo';
import { siteConfig } from '../config/site';

export default function HomePage() {
  const featuredPoets = poets.slice(0, 3);
  useSeo({
    title: 'THE LEGENDARY POET | Поэзия, анализ, история',
    description: siteConfig.description,
    path: '/',
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-luxury-gold/30">
      <HeroSection />
      <StatsSection />

      {/* Featured Poets */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3">
                Лица <span className="neon-blue-gradient neon-glow-text">Эпохи</span>
              </h2>
              <p className="text-cyan-100/50 text-lg">Те, кто менял мир одним словом</p>
            </div>
            <Link to="/poets" className="hidden md:flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-all font-semibold">
              Смотреть всех <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredPoets.map((poet) => (
              <PoetCard key={poet.id} poet={poet} />
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Quote Section */}
      <section className="py-32 relative overflow-hidden bg-gradient-to-b from-[#050505] via-[#0b0a08] to-[#050505]">
        <div className="absolute inset-0 shimmer opacity-20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Quote size={60} className="text-luxury-gold/20 mx-auto mb-8" />
          <blockquote className="text-3xl md:text-4xl font-serif italic text-white mb-8 leading-relaxed tracking-wide">
            "Поэзия — это память языка о человеческой боли, красоте и достоинстве."
          </blockquote>
          <cite className="neon-blue-gradient neon-glow-text font-serif text-lg tracking-wider">— THE LEGENDARY POET</cite>
        </div>
      </section>

      {/* Careful Faith And Culture CTA */}
      <section className="py-24 relative overflow-hidden bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center luxury-card p-12 md:p-16 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#061018] to-[#050505] shadow-2xl">
          <h2 className="text-4xl font-serif font-bold text-white mb-6">
            Вера, культура и <span className="neon-blue-gradient neon-glow-text">трезвая оценка</span>
          </h2>
          <p className="text-xl text-cyan-100/55 mb-10 leading-relaxed font-light">
            Отдельные материалы рассматривают жизнь и тексты поэтов с христианской позиции аккуратно: без натяжек, без объявления поэтов верующими там, где этого не видно, и с ясным комментарием там, где есть прямое богоборчество или очевидные библейские мотивы.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <MagneticButton
              to="/articles"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_26px_rgba(0,212,255,0.35)] hover:scale-[1.02] transition-all"
            >
              Изучить статьи
            </MagneticButton>
          </div>
        </div>
      </section>
    </div>
  );
}
