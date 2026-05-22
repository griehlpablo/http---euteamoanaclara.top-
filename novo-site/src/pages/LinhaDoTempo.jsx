import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarHeart, Heart } from 'lucide-react';

const moments = [
  {
    date: '06/07/2023',
    title: 'O dia em que ficamos',
    description: 'O começo daquele frio na barriga que virou casa.',
    emoji: '💞',
  },
  {
    date: '23/09/2023',
    title: 'Início do namoro',
    description: 'O sim que transformou dois caminhos em uma história só.',
    emoji: '💍',
  },
  {
    date: 'Nossa trilha sonora',
    title: 'Músicas que viraram memória',
    description: 'Cada refrão com um pedaço de nós dois guardado dentro.',
    emoji: '🎧',
  },
  {
    date: 'Momentos favoritos',
    title: 'Pequenas cenas gigantes',
    description: 'Risadas, abraços, conversas e todos os instantes que fazem o amor parecer simples.',
    emoji: '📸',
  },
  {
    date: 'Planos para o futuro',
    title: 'O que ainda vamos viver',
    description: 'Viagens, sonhos, domingos tranquilos e uma vida inteira para inventar juntos.',
    emoji: '✨',
  },
];

export default function LinhaDoTempo() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link to="/central" className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-full shadow-md text-rose-500 hover:scale-105 transition-transform">
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-end gap-2">
            Linha do Tempo <CalendarHeart className="text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Os capítulos mais bonitos até aqui.</p>
        </div>
      </div>

      <div className="relative pl-4 sm:pl-8">
        <div className="absolute left-7 sm:left-11 top-0 h-full w-1 rounded-full bg-gradient-to-b from-rose-300 via-pink-200 to-rose-100" />
        <div className="space-y-6">
          {moments.map((moment, index) => (
            <motion.article
              key={moment.title}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              className="relative pl-12"
            >
              <div className="absolute left-0 top-7 w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg ring-8 ring-rose-50 dark:ring-slate-900">
                <Heart className="w-4 h-4 fill-current" />
              </div>
              <div className="bg-white/65 dark:bg-slate-800/65 backdrop-blur-xl border border-white/60 dark:border-slate-700 rounded-[2rem] p-5 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-full sm:w-28 aspect-square rounded-3xl overflow-hidden bg-rose-100 flex items-center justify-center text-4xl shrink-0">
                    {moment.image ? (
                      <img src={moment.image} alt={moment.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>{moment.emoji || '💕'}</span>
                    )}
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-rose-100 text-rose-600 px-3 py-1 text-xs font-bold mb-2">
                      {moment.date}
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {moment.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mt-2">
                      {moment.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
