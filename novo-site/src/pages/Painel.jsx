import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const levels = [
  { id: 'perfect', label: 'Amorzinho perfeito(a) 💘', color: 'from-pink-400 to-orange-400' },
  { id: 'good', label: 'Muito bonzinho(a) ⭐', color: 'from-blue-400 to-indigo-500' },
  { id: 'chill', label: 'De boa / Chill 😎', color: 'from-teal-400 to-emerald-500' },
  { id: 'ice', label: 'Em gelo fino 🧊', color: 'from-cyan-300 to-blue-400' },
  { id: 'jail', label: 'Cadeia (ai ai ai) ⛓️', color: 'from-slate-700 to-slate-900' }
];

export default function Painel() {
  const [currentUser, setCurrentUser] = useState(null);
  const [scores, setScores] = useState({ pablo: 'perfect', ana: 'perfect' });

  const handleVote = (levelId) => {
    if (!currentUser) return alert("Escolha quem é você primeiro!");
    const target = currentUser === 'pablo' ? 'ana' : 'pablo';
    setScores(prev => ({ ...prev, [target]: levelId }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="glass-panel p-8 rounded-3xl">
        <h2 className="font-serif text-3xl font-bold mb-2 text-gray-800">Satisfação com o Mozão</h2>
        <p className="text-slate-500 mb-8">Vote no comportamento do outro. Suas ações têm consequências!</p>

        <div className="flex gap-4 mb-8 bg-white p-2 rounded-xl border border-slate-100">
          <button onClick={() => setCurrentUser('pablo')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${currentUser === 'pablo' ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Eu sou o Pablo</button>
          <button onClick={() => setCurrentUser('ana')} className={`flex-1 py-2 rounded-lg font-bold transition-all ${currentUser === 'ana' ? 'bg-brand text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Eu sou a Ana</button>
        </div>

        <div className="space-y-3 bg-white rounded-2xl p-4 border border-slate-100">
          {levels.map((level) => (
            <div key={level.id} onClick={() => handleVote(level.id)} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
              <span className="font-medium text-slate-700">{level.label}</span>
              <div className="flex gap-2">
                {scores.pablo === level.id && <span className={`px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${level.color}`}>PABLO</span>}
                {scores.ana === level.id && <span className={`px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${level.color}`}>ANA</span>}
              </div>
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