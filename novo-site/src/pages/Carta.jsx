import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Quote } from 'lucide-react';

export default function Carta() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="glass-panel p-8 md:p-12 rounded-3xl relative">
        <Quote className="absolute top-6 left-6 w-12 h-12 text-brand-light opacity-50 rotate-180" />
        
        <h2 className="font-serif text-3xl font-bold mb-8 text-center text-gray-800 relative z-10 pt-4">Minha Querida Ana,</h2>
        
        <div className="space-y-6 text-lg text-slate-700 leading-relaxed font-serif relative z-10">
          <p>
            Escrevo isto porque queria criar um espaço que fosse só nosso. Um lugar onde pudesse guardar um bocadinho do que sinto por você, de uma forma que você possa visitar sempre que quiser.
          </p>
          <p>
            Desde que você entrou na minha vida, os dias têm mais cor. Admiro a sua força, o seu sorriso, e a forma como você torna as coisas simples em momentos inesquecíveis.
          </p>
          <p>
            Este site é um pequeno gesto, um reflexo digital do espaço gigante que você ocupa no meu coração. Prometo continuar tentando te fazer feliz, todos os dias.
          </p>
          <p className="pt-8 text-right italic font-semibold text-xl">
            Com todo o meu amor,<br />
            <span className="text-brand">Pablo</span>
          </p>
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