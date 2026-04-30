import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';

export default function Mural() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Comprar chocolate pra noite do filme", isTask: true, done: false },
    { id: 2, text: "Amo a forma como você sorri de manhã.", isTask: false, done: false }
  ]);
  const [input, setInput] = useState('');
  const [isTask, setIsTask] = useState(false);

  const addMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([{ id: Date.now(), text: input, isTask, done: false }, ...messages]);
    setInput('');
  };

  const toggleTask = (id) => {
    setMessages(messages.map(m => m.id === id ? { ...m, done: !m.done } : m));
  };

  const deleteMessage = (id) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="glass-panel p-8 rounded-3xl">
        <h2 className="font-serif text-3xl font-bold mb-2 text-gray-800">Muralzinho ✍️</h2>
        <p className="text-slate-500 mb-8">Deixem lembretes, missões ou recados fofos.</p>

        <form onSubmit={addMessage} className="flex flex-col gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex: noite do filme, te amo..." className="p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand outline-none" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={isTask} onChange={(e) => setIsTask(e.target.checked)} className="accent-brand w-4 h-4" />
              Isto é uma missão
            </label>
            <button type="submit" className="bg-brand text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-dark flex items-center gap-2">
              <Plus className="w-4 h-4" /> Postar
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-start shadow-sm">
              <div>
                <p className={`text-slate-700 ${msg.done ? 'line-through opacity-50' : ''}`}>{msg.text}</p>
                <span className="text-xs text-slate-400 mt-2 block">{msg.isTask ? '🎯 Missão' : '💌 Recado'}</span>
              </div>
              <div className="flex gap-2">
                {msg.isTask && (
                  <button onClick={() => toggleTask(msg.id)} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold hover:bg-green-200">
                    {msg.done ? 'Desmarcar' : 'Feito'}
                  </button>
                )}
                <button onClick={() => deleteMessage(msg.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold hover:bg-red-100">Apagar</button>
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