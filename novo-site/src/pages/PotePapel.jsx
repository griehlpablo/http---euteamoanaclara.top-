import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircleHeart, Plus, Shuffle, Heart } from 'lucide-react';
import { collection, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const GLASS_CLASSES = 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/50 dark:border-slate-600 shadow-lg';

export default function PotePapel() {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'potepapel'), (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setAdding(true);
    try {
      await addDoc(collection(db, 'potepapel'), {
        message: newMessage.trim(),
        createdAt: new Date()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
    } finally {
      setAdding(false);
    }
  };

  const handleRandomMessage = async () => {
    if (messages.length === 0) return;

    const randomIndex = Math.floor(Math.random() * messages.length);
    setCurrentMessage(messages[randomIndex]);
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
          <p className="text-slate-500 dark:text-slate-400">Carregando pote...</p>
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
          💌 Pote de Papel
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400"
        >
          Mensagens doces para alegrar o dia 💕
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Random Message Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.3 }}
          className={`${GLASS_CLASSES} rounded-3xl p-6`}
        >
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-rose-500" />
            Mensagem Aleatória
          </h3>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRandomMessage}
            disabled={messages.length === 0}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg mb-6"
          >
            <Shuffle className="w-5 h-5" />
            Sortear Mensagem
          </motion.button>

          {currentMessage ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-700"
            >
              <Heart className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-center text-lg text-slate-800 dark:text-slate-200 leading-relaxed">
                {currentMessage.message}
              </p>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <MessageCircleHeart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Clique para sortear uma mensagem doce! ✨
              </p>
            </div>
          )}

          <div className="text-center mt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {messages.length} mensagens no pote
            </p>
          </div>
        </motion.div>

        {/* Add Message Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.4 }}
          className={`${GLASS_CLASSES} rounded-3xl p-6`}
        >
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-rose-500" />
            Adicionar Mensagem
          </h3>

          <form onSubmit={handleAddMessage}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escreva uma mensagem doce, motivacional ou engraçada..."
              className="w-full bg-transparent border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[120px] resize-none mb-4"
              required
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={adding}
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Adicionar ao Pote
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}