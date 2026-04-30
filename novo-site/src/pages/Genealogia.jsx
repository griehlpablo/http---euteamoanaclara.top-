import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitMerge, ScrollText, Search, ArrowLeft } from 'lucide-react';

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

const Genealogia = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
    <div className="text-center mb-10">
      <h2 className="font-serif text-4xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-3">
        <GitMerge className="text-rose-500" /> Dossiê Genealógico
      </h2>
      <p className="text-slate-500 italic">As origens de Ana Clara</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className={`${glassClasses} p-8 rounded-3xl border-t-4 border-t-amber-700 relative overflow-hidden group`}>
        <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full mb-4">Galícia 🇦🇹</span>
        <h3 className="font-serif text-2xl font-bold mb-2">Linha Kovalek (Kowalyk)</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Família originária de Hulcze. Gregorio Kowalyk e Anna imigraram em 1908 no vapor San Nicolas com os filhos Iwan e Paulo.
        </p>
      </div>
      <div className={`${glassClasses} p-8 rounded-3xl border-t-4 border-t-red-700 relative overflow-hidden`}>
        <span className="inline-block bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full mb-4">Império Russo 🇷🇺</span>
        <h3 className="font-serif text-2xl font-bold mb-2">Linha Veresiuk</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Anton Veretiuk foi soldado da cavalaria do Império Russo. Seu neto Alexandre Veresiuk imigrou de Odessa para Prudentópolis[cite: 5].
        </p>
      </div>
    </div>
    <div className="mt-8 text-center">
      <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-rose-500 font-bold">
        <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
      </Link>
    </div>
  </motion.div>
);
export default Genealogia;