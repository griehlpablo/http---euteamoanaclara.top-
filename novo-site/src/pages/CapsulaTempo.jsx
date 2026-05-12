import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Lock, Unlock, Send, Calendar } from 'lucide-react';
import { collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const GLASS_CLASSES = 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/50 dark:border-slate-600 shadow-lg';

export default function CapsulaTempo() {
  const [capsulas, setCapsulas] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'capsula'), (snapshot) => {
      const capsulasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCapsulas(capsulasData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !unlockDate) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'capsula'), {
        message: newMessage.trim(),
        unlockDate: new Date(unlockDate).toISOString(),
        createdAt: new Date(),
        unlocked: false
      });
      setNewMessage('');
      setUnlockDate('');
    } catch (error) {
      console.error('Erro ao criar cápsula:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isUnlocked = (capsula) => {
    return new Date() >= new Date(capsula.unlockDate);
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-[60vh] flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Carregando cápsulas...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-4xl mx-auto py-8"
    >
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-2 font-serif"
        >
          ⏰ Cápsula do Tempo
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400"
        >
          Mensagens seladas para serem abertas no futuro 💌
        </motion.p>
      </div>

      {/* Form to create new capsule */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        onSubmit={handleSubmit} 
        className={`${GLASS_CLASSES} rounded-3xl p-6 mb-8`}
      >
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Criar Nova Cápsula</h3>
        
        <div className="space-y-4">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escreva uma mensagem para o futuro..."
            className="w-full bg-transparent border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[120px] resize-none"
            required
          />
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Data para desbloquear
              </label>
              <input
                type="date"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-transparent border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={submitting}
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Criando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Selar Cápsula
              </>
            )}
          </motion.button>
        </div>
      </motion.form>

      {/* Capsules list */}
      <div className="space-y-6">
        {capsulas.map((capsula, index) => {
          const unlocked = isUnlocked(capsula);
          
          return (
            <motion.div 
              key={capsula.id}
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.1 }}
              className={`${GLASS_CLASSES} rounded-3xl p-6 relative overflow-hidden`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${unlocked ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {unlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">
                    Cápsula #{capsula.id.slice(-4)}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(capsula.unlockDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {unlocked ? (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-700">
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {capsula.message}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-700 text-center">
                  <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-amber-700 dark:text-amber-300">
                    Esta cápsula será desbloqueada em {Math.ceil((new Date(capsula.unlockDate) - new Date()) / (1000 * 60 * 60 * 24))} dias
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {capsulas.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}
        >
          <Clock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Nenhuma cápsula criada ainda. Comece escrevendo uma mensagem para o futuro! 📜
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}