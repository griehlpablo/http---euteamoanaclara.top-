import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, X } from 'lucide-react';

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

const Home = () => {
  const [loveValue, setLoveValue] = useState(10);
  const [showProposal, setShowProposal] = useState(false);
  const [perdoou, setPerdoou] = useState(false);

  const handleLoveChange = (e) => {
    setLoveValue(e.target.value);
    if (e.target.value < 10) {
      setTimeout(() => setLoveValue(10), 1000); // Força o 10/10
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[80vh] text-center px-2">
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mb-8 relative">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto">
          <img src="/images/ana_e_eu_zoo.jpg" alt="Ana e Pablo" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4">Ana Clara</h1>
      
      {/* Grid de Interação Profissional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
        <div className={`${glassClasses} p-6 rounded-3xl`}>
          <h3 className="font-bold mb-2">Quanto você ama o Pablo?</h3>
          <div className="text-rose-500 font-bold text-2xl mb-2">{loveValue}/10</div>
          <input type="range" min="0" max="10" value={loveValue} onChange={handleLoveChange} className="w-full accent-rose-500" />
        </div>
        <div className={`${glassClasses} p-6 rounded-3xl flex flex-col justify-center`}>
          <h3 className="font-bold mb-4">Perdoa o Pablo?</h3>
          <div className="flex gap-2">
            <button onClick={() => setPerdoou(true)} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-all">SIM</button>
            <button onClick={() => setPerdoou(true)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold active:scale-95 transition-all text-xs">{perdoou ? 'AGORA É SIM' : 'NÃO'}</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/central" className="bg-rose-500 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
          Entrar no Nosso Mundo <ArrowRight size={20} />
        </Link>
        <button onClick={() => setShowProposal(true)} className="bg-white text-rose-500 border border-rose-200 px-10 py-4 rounded-full font-bold shadow-md hover:shadow-lg transition-all">
          Surpresa 💍
        </button>
      </div>

      <AnimatePresence>
        {showProposal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowProposal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500"><X /></button>
              <h2 className="font-serif text-3xl font-bold mb-4 text-center">Ana, quer casar comigo?</h2>
              <p className="text-slate-600 text-center italic">"Para dividir cada sonho e cada tropeço da vida. Te amo."</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default Home;