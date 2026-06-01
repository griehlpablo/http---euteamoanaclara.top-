import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, CheckCircle, X } from 'lucide-react';
import { supabase } from '../supabase';

const GLASS_CLASSES = 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/50 dark:border-slate-600 shadow-lg';

export default function Cupons() {
  const [cupons, setCupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('cupons').select('*').order('createdAt', { ascending: false });
      if (error) {
        console.error('Supabase error fetching cupons:', error);
        setLoading(false);
        return;
      }
      if (mounted) setCupons(data || []);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  const handleRedeem = async (cupomId) => {
    try {
      const { error } = await supabase.from('cupons').update({ redeemed: true }).eq('id', cupomId);
      if (error) throw error;
      setCupons(prev => prev.map(c => c.id === cupomId ? { ...c, redeemed: true } : c));
    } catch (error) {
      console.error('Erro ao resgatar cupom:', error);
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
          <p className="text-slate-500 dark:text-slate-400">Carregando cupons...</p>
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
          🎫 Cupons Especiais
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400"
        >
          Recompensas para momentos especiais juntos 💕
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cupons.map((cupom, index) => (
          <motion.div 
            key={cupom.id}
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: index * 0.1 }}
            className={`${GLASS_CLASSES} rounded-3xl p-6 relative overflow-hidden ${
              cupom.redeemed ? 'opacity-60' : 'hover:shadow-xl transition-shadow'
            }`}
          >
            {cupom.redeemed && (
              <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${cupom.redeemed ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">{cupom.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{cupom.description}</p>
              </div>
            </div>

            {!cupom.redeemed && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRedeem(cupom.id)}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg"
              >
                Resgatar 🎉
              </motion.button>
            )}

            {cupom.redeemed && (
              <div className="text-center py-3">
                <p className="text-green-600 font-bold">Resgatado! ✅</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {cupons.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}
        >
          <Ticket className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Nenhum cupom disponível ainda. Em breve teremos surpresas! 🎁
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}