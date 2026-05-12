import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Plus, Check, X, Trash2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const GLASS_CLASSES = 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/50 dark:border-slate-600 shadow-lg';

export default function BucketList() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'bucketlist'), (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      await addDoc(collection(db, 'bucketlist'), {
        text: newItem.trim(),
        completed: false,
        createdAt: new Date()
      });
      setNewItem('');
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  const handleToggleComplete = async (itemId, completed) => {
    try {
      await updateDoc(doc(db, 'bucketlist', itemId), {
        completed: !completed
      });
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'bucketlist', itemId));
    } catch (error) {
      console.error('Erro ao deletar item:', error);
    }
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
          <p className="text-slate-500 dark:text-slate-400">Carregando lista...</p>
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
          📝 Bucket List
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400"
        >
          Nossos sonhos e metas para realizar juntos ✨
        </motion.p>
      </div>

      {/* Form to add new item */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        onSubmit={handleAddItem} 
        className={`${GLASS_CLASSES} rounded-3xl p-6 mb-8`}
      >
        <div className="flex gap-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Adicione um novo sonho ou meta..."
            className="flex-1 bg-transparent border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Adicionar
          </motion.button>
        </div>
      </motion.form>

      {/* Items list */}
      <AnimatePresence mode="popLayout">
        {items.length === 0 ? (
          <motion.div 
            key="empty" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}
          >
            <ListChecks className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Sua lista está vazia. Comece adicionando seus primeiros sonhos! 💭
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`${GLASS_CLASSES} rounded-3xl p-6 flex items-center gap-4 ${
                  item.completed ? 'opacity-75' : ''
                }`}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleToggleComplete(item.id, item.completed)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    item.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-slate-300 dark:border-slate-600 hover:border-rose-500'
                  }`}
                >
                  {item.completed && <Check className="w-4 h-4" />}
                </motion.button>

                <span className={`flex-1 text-lg ${
                  item.completed 
                    ? 'line-through text-slate-500 dark:text-slate-400' 
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {item.text}
                </span>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}