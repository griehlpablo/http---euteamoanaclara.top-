import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, GitMerge, ScrollText } from 'lucide-react';

export default function Genealogia() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-3">
          <GitMerge className="text-brand" /> As Nossas Raízes
        </h2>
        <p className="text-slate-500 italic">Pesquisa Genealógica e História da Família.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-3xl">
          <ScrollText className="w-8 h-8 text-brand mb-4" />
          <h3 className="font-serif text-2xl font-bold mb-2">Kovalek, Pylypiw & Griehl</h3>
          <p className="text-slate-600 mb-4">
            Registros, documentos de imigrantes e a nossa árvore genealógica. De Hulcze, na Polônia, até os dias de hoje.
          </p>
          <button className="bg-brand-light text-brand-dark px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand hover:text-white transition-colors">
            Ver Documentos
          </button>
        </div>

        <div className="glass-panel p-8 rounded-3xl opacity-70">
          <h3 className="font-serif text-xl font-bold mb-2 text-slate-400">Árvore da Ana</h3>
          <p className="text-slate-500 text-sm">Em construção... Espaço reservado para adicionar os registros e a história da família dela.</p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 border border-slate-100">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}