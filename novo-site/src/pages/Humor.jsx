import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export default function Humor() {
  // Exemplo de dados (No futuro, você puxa isso do Firebase igual no projeto original)
  const historico = [
    { data: '12/09', nivel: 5, label: 'Perfeito 💘' },
    { data: '15/09', nivel: 4, label: 'Bonzinho ⭐' },
    { data: '18/09', nivel: 2, label: 'Gelo 🧊' },
    { data: '22/09', nivel: 5, label: 'Perfeito 💘' },
    { data: '25/09', nivel: 5, label: 'Perfeito 💘' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="glass-panel p-8 rounded-3xl">
        <h2 className="font-serif text-3xl font-bold mb-2 text-gray-800 flex items-center gap-3">
          <TrendingUp className="text-brand" /> Histórico de Humor
        </h2>
        <p className="text-slate-500 mb-8">Baseado nos votos do painel de satisfação.</p>

        {/* Gráfico de Barras Responsivo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-inner h-64 flex items-end justify-between gap-2 overflow-x-auto">
          {historico.map((item, index) => (
            <div key={index} className="flex flex-col items-center flex-1 min-w-[40px] group">
              {/* Tooltip (Aparece ao passar o mouse) */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] p-1 rounded mb-2 whitespace-nowrap absolute -mt-8">
                {item.label}
              </div>
              {/* Barra do Gráfico */}
              <motion.div 
                initial={{ height: 0 }} 
                animate={{ height: `${(item.nivel / 5) * 100}%` }} 
                transition={{ duration: 1, delay: index * 0.1 }}
                className="w-full max-w-[30px] bg-gradient-to-t from-brand-light to-brand rounded-t-md"
              />
              <span className="text-xs text-slate-400 mt-2 font-bold">{item.data}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}