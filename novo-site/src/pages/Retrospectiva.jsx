import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function Retrospectiva() {
  const [stats, setStats] = useState({ hoursTogether: 0, daysTogether: 0, daysDating: 0, kisses: 0 });

  useEffect(() => {
    // Datas Corretas
    const dateFicaram = new Date(2023, 6, 6); // 06/07/2023
    const dateNamoro = new Date(2023, 8, 23); // 23/09/2023
    
    const updateStats = () => {
      const now = new Date();
      const diffFicaram = now - dateFicaram;
      const diffNamoro = now - dateNamoro;

      const daysTogether = Math.floor(diffFicaram / (1000 * 60 * 60 * 24));
      setStats({
        hoursTogether: Math.floor(diffFicaram / (1000 * 60 * 60)),
        daysTogether: daysTogether,
        daysDating: Math.floor(diffNamoro / (1000 * 60 * 60 * 24)),
        kisses: daysTogether * 10 // Estimativa fofa do seu código original
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-dark p-8 md:p-12 rounded-3xl shadow-2xl text-white">
        <div className="inline-block px-4 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-8 backdrop-blur-md">
          Retrospectiva • Desde 2023
        </div>

        <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">Sua retrospectiva 💕</h2>
        <p className="text-slate-300 mb-10 max-w-lg">Em vez de horas de música, aqui estão as <strong>horas que passamos juntos</strong> desde o primeiro beijo.</p>

        <div className="mb-10">
          <p className="text-sm text-brand-light font-bold uppercase tracking-widest">Horas Juntos</p>
          <div className="text-6xl md:text-8xl font-bold tracking-tighter mt-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-white">
            {stats.hoursTogether.toLocaleString('pt-BR')} <span className="text-3xl text-slate-300">h</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">Como se uma playlist tivesse dado play lá em Julho e nunca parado.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-400 uppercase font-bold">Dias Juntos</p>
            <p className="text-2xl font-bold mt-1">{stats.daysTogether}</p>
            <p className="text-xs text-slate-400 mt-1">Desde 06/07/2023.</p>
          </div>
          <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-400 uppercase font-bold">Dias Namorando</p>
            <p className="text-2xl font-bold mt-1">{stats.daysDating}</p>
            <p className="text-xs text-slate-400 mt-1">Oficializados em 23/09/2023.</p>
          </div>
          <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-slate-400 uppercase font-bold">Beijinhos (Média)</p>
            <p className="text-2xl font-bold mt-1">{stats.kisses.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-slate-400 mt-1">Uns 10 por dia, né?</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}