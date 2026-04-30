import { motion } from 'framer-motion';
import { BookOpen, FileText, Music, Star } from 'lucide-react';
import { poets, musicTracks, articles } from '../../data/poets';

const stats = [
  { icon: BookOpen, label: 'Поэтов в базе', value: poets.length },
  { icon: FileText, label: 'Текстов стихов', value: poets.reduce((acc, p) => acc + p.poems.length, 0) },
  { icon: Music, label: 'Аудио-треков', value: musicTracks.length },
  { icon: Star, label: 'Глубоких статей', value: articles.length },
];

export default function StatsSection() {
  return (
    <section className="py-16 relative z-10 -mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="luxury-card p-8 rounded-2xl text-center border border-cyan-400/10 backdrop-blur-lg bg-[#061018]/60 glow-hover"
            >
              <div className="text-cyan-300 mb-3 flex justify-center drop-shadow-[0_0_10px_rgba(0,212,255,0.35)]">
                <stat.icon size={28} />
              </div>
              <div className="text-4xl font-serif font-bold text-white mb-2">{stat.value}</div>
              <div className="text-xs text-cyan-100/45 tracking-wider uppercase">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
