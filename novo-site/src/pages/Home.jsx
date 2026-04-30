import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, X } from 'lucide-react';

export default function Home() {
  const [loveValue, setLoveValue] = useState(10);
  const [showProposal, setShowProposal] = useState(false);
  const [perdoou, setPerdoou] = useState(false);

  const handleLoveChange = (e) => {
    setLoveValue(e.target.value);
    if (e.target.value < 10) {
      setTimeout(() => setLoveValue(10), 1000); // Volta pro 10 sozinho
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      
      {/* Imagem Flutuante */}
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mb-8 relative">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-xl">
          <img src="/images/ana_e_eu_zoo.jpg" alt="Ana Clara e Pablo" className="w-full h-full object-cover" />
        </div>
        <div className="absolute -bottom-4 -right-4 bg-white p-3 rounded-full shadow-lg">
          <Heart className="w-8 h-8 text-brand fill-current" />
        </div>
      </motion.div>

      <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 text-gray-800">Ana Clara</h1>
      <p className="text-xl md:text-2xl text-slate-500 italic mb-10 max-w-lg mx-auto">O meu porto seguro, a minha aventura favorita.</p>

      {/* Interações Divertidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="font-bold text-lg mb-2">Quanto você ama o Pablo?</h3>
          <div className="flex justify-between text-brand font-bold text-xl mb-2">
            <span>Nível:</span> <span>{loveValue}/10</span>
          </div>
          <input type="range" min="0" max="10" value={loveValue} onChange={handleLoveChange} className="w-full accent-brand h-2 rounded-lg cursor-pointer" />
          <p className="text-xs text-slate-400 mt-2">Dica: ele merece 10 sempre 😉</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-center">
          <h3 className="font-bold text-lg mb-4">Perdoa o Pablo?</h3>
          <div className="flex gap-4 justify-center">
            <button onClick={() => setPerdoou(true)} className="flex-1 bg-gradient-to-r from-pink-300 to-brand text-white py-2 rounded-xl font-bold hover:shadow-lg transition-all">
              {perdoou ? 'SIM ❤️' : 'SIM'}
            </button>
            <button onClick={() => setPerdoou(true)} className="flex-1 bg-red-100 text-slate-700 py-2 rounded-xl font-bold hover:bg-red-200 transition-all">
              {perdoou ? 'AGORA É SIM ❤️' : 'NÃO'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link to="/central" className="bg-brand text-white px-8 py-4 rounded-full font-semibold tracking-wide hover:bg-brand-dark hover:shadow-xl transition-all flex items-center gap-3">
          <span>Entrar no Nosso Mundo</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
        <button onClick={() => setShowProposal(true)} className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-semibold tracking-wide hover:shadow-md transition-all">
          Surpresa 💌
        </button>
      </div>

      {/* Modal do Pedido */}
      <AnimatePresence>
        {showProposal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white p-8 md:p-12 rounded-3xl max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowProposal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
              <div className="text-center text-4xl mb-4">💍</div>
              <h2 className="font-serif text-3xl font-bold mb-6 text-center text-gray-800">Minha Ana Clara, quer casar comigo?</h2>
              <div className="space-y-4 text-slate-600 text-left font-serif leading-relaxed">
                <p>Amor, a gente briga, discorda, se enrola na vida... mas em todas as versões da minha história, <strong>você</strong> está lá.</p>
                <p>Mesmo nos dias difíceis, é com você que eu quero conversar, rir, dividir o café, o cansaço e os sonhos. Não me imagino num futuro sem você.</p>
                <p className="text-center text-xl font-bold text-brand my-6">Você aceita viver pra sempre comigo?</p>
                <p>Quero caminhar ao seu lado, construir uma casa com a nossa cara, nossas manias e muitos gatinhos. Eu te amo, hoje, amanhã e depois. Para sempre seu,</p>
                <p className="text-right font-bold text-brand pt-4">Pablo 💖</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}