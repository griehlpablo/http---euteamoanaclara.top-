import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircleHeart } from 'lucide-react';

export default function Mensagens() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-3">
          <MessageCircleHeart className="text-brand" /> Mensagens
        </h2>
        <p className="text-slate-500 italic">Pequenos recados de amor.</p>
      </div>

      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-brand">
          <p className="text-slate-700 italic text-lg">"Você é a melhor parte do meu dia. Sempre."</p>
        </div>
        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-brand-dark">
          <p className="text-slate-700 italic text-lg">"Não importa onde, desde que seja com você."</p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-brand group border border-gray-100">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}