import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';

const fotos = [
  "/images/ana_e_eu_zoo.jpg",
  "/images/wedding.jpg",
];

export default function Galeria() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-3">
          <ImageIcon className="text-brand" /> As Nossas Memórias
        </h2>
        <p className="text-slate-500 italic">Cada clique, uma história nossa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fotos.map((foto, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-shadow glass-panel p-2"
          >
            <img src={foto} alt={`Nossa memória ${index + 1}`} className="w-full h-64 object-cover rounded-xl hover:scale-105 transition-transform duration-500" />
          </motion.div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-brand group border border-gray-100">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}