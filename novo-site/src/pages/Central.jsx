import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MessageSquareHeart, Sparkles, SmilePlus, ArrowLeft } from 'lucide-react';

const cards = [
  { path: "/contagem", icon: Clock, title: "O Nosso Tempo", desc: "A contagem oficial desde o primeiro beijo." },
  { path: "/retrospectiva", icon: Sparkles, title: "Retrospectiva", desc: "Um Spotify Wrapped do nosso amor." },
  { path: "/painel", icon: SmilePlus, title: "Satisfação do Mozão", desc: "Painel de avaliação (cuidado com a cadeia!)." },
  { path: "/mural", icon: MessageSquareHeart, title: "Mural de Recados", desc: "Deixe bilhetes e missões pra gente." }
];

export default function Central() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl font-bold mb-3 text-gray-800">O Nosso Espaço</h2>
        <p className="text-slate-500">Tudo o que construímos, guardado aqui com amor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card, index) => (
          <motion.div key={card.path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Link to={card.path} className="block glass-panel p-8 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300 group h-full">
              <div className="bg-brand-light w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-brand-dark group-hover:scale-110 transition-transform">
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-2">{card.title}</h3>
              <p className="text-slate-500 text-sm mb-4">{card.desc}</p>
              <span className="text-brand font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                Acessar <ArrowLeft className="w-4 h-4 rotate-180" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <Link to="/" className="text-slate-500 hover:text-brand transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    </motion.div>
  );
}