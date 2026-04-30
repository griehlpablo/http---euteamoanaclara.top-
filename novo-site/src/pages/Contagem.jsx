import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function Contagem() {
  // AJUSTE A DATA DO NAMORO AQUI. Lembre-se: Mês de Janeiro é 0, Fevereiro é 1...
  const startDate = new Date(2020, 1, 14); 
  
  const [time, setTime] = useState({ anos: 0, meses: 0, dias: 0, horas: '00:00:00' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let diff = now - startDate;
      if (diff < 0) diff = 0;
      
      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const anos = Math.floor(totalDays / 365);
      const diasRestantes = totalDays % 365;
      const meses = Math.floor(diasRestantes / 30);
      const dias = diasRestantes % 30;
      
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

      setTime({ anos, meses, dias, horas: `${h}:${m}:${s}` });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl font-bold mb-4 text-gray-800">A Nossa Contagem</h2>
        <p className="text-slate-500 italic">Desde aquele dia especial...</p>
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-3xl shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
          {[
            { label: 'Anos', value: time.anos },
            { label: 'Meses', value: time.meses },
            { label: 'Dias', value: time.dias },
            { label: 'Tempo', value: time.horas, color: 'text-brand' }
          ].map((item, i) => (
            <div key={i} className="bg-white/80 p-6 rounded-2xl shadow-sm border border-rose-50 hover:border-brand-light transition-colors">
              <span className={`block text-3xl md:text-4xl font-bold mb-2 ${item.color || 'text-gray-800'}`}>
                {item.value}
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 group border border-gray-100">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}