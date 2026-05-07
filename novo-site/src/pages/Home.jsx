import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles } from 'lucide-react';

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

const Home = () => {
  const [loveValue, setLoveValue] = useState(10);
  const [showProposal, setShowProposal] = useState(false);

  const handleLoveChange = (e) => {
    setLoveValue(e.target.value);
    if (e.target.value < 10) {
      setTimeout(() => setLoveValue(10), 1000); 
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[80vh] text-center px-2">
      
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mb-8 relative z-50">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto">
          <img src="/images/ana_e_eu_zoo.jpg" alt="Casal" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 text-slate-800">Meu Amor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12 relative z-50">
        
        <div className={`${glassClasses} p-6 rounded-3xl flex flex-col justify-center`}>
          <h3 className="font-bold mb-2 text-slate-700">Quanto você ama o Pablo?</h3>
          <div className="text-rose-500 font-bold text-3xl mb-3">{loveValue}/10</div>
          <input type="range" min="0" max="10" value={loveValue} onChange={handleLoveChange} className="w-full accent-rose-500 cursor-pointer" />
        </div>
        
        <div className={`${glassClasses} p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600"></div>
          <Sparkles className="text-rose-400 mb-2" size={28} />
          <h3 className="font-bold mb-2 text-slate-800 text-lg">Nova Fase Desbloqueada</h3>
          <p className="text-sm text-slate-600 font-medium italic px-2">
            "Sem brigas, sem estresse. Apenas paz, muito amor e nós dois contra o mundo."
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 relative z-50">
        <Link to="/central" className="bg-rose-500 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
          Entrar no Nosso Mundo <ArrowRight size={20} />
        </Link>
        <button onClick={() => setShowProposal(true)} className="bg-white text-rose-500 border border-rose-200 px-10 py-4 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer">
          Surpresa 💍
        </button>
      </div>

      <AnimatePresence>
        {showProposal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowProposal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 cursor-pointer">
                <X size={24} />
              </button>
              <h2 className="font-serif text-3xl font-bold mb-4 text-center text-slate-800">Meu Amor, quer casar comigo?</h2>
              <p className="text-slate-600 text-center italic font-medium">"Para dividir cada sonho e cada tropeço da vida. Te amo infinitamente."</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Home;