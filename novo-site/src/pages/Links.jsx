import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Link as LinkIcon, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const genAI = new GoogleGenerativeAI("AIzaSyDGd7vlpIXQu-1CaU32wgiOlfcOMt2r2vs");

const GLASS_CLASSES = 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/50 dark:border-slate-600 shadow-lg';

export default function Links() {
  const [links, setLinks] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'links'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLinks(linksData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setSubmitting(true);
    setLoadingStatus('Buscando link...');

    try {
      // Fetch metadata from Microlink API
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(newUrl)}`);
      const data = await response.json();

      let rawTitle = data.data?.title || 'Link sem título';
      let rawDescription = data.data?.description || 'Sem descrição';
      const image = data.data?.image?.url || null;

      try {
        if (rawTitle || rawDescription) {
          setLoadingStatus('Resumindo com IA...');
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const prompt = `Resuma o seguinte título de produto para ser curto e direto (máx 5 palavras) e a descrição para uma frase curta (máx 15 palavras). Retorne APENAS um JSON válido no formato {"title": "titulo resumido", "description": "descricao resumida"}. Título original: ${rawTitle}. Descrição original: ${rawDescription}`;
          const result = await model.generateContent({ prompt });
          const responseText = result.response.text();

          const sanitized = responseText
            .replace(/```(?:json)?/gi, '')
            .replace(/\n/g, ' ')
            .trim();

          const parsed = JSON.parse(sanitized);
          rawTitle = parsed.title || rawTitle;
          rawDescription = parsed.description || rawDescription;
        }
      } catch (aiError) {
        console.error('Erro ao resumir com IA:', aiError);
      }

      // Save to Firestore
      await addDoc(collection(db, 'links'), {
        url: newUrl.trim(),
        title: rawTitle,
        description: rawDescription,
        image,
        timestamp: serverTimestamp()
      });

      setNewUrl('');
    } catch (error) {
      console.error('Erro ao adicionar link:', error);
      alert('Erro ao adicionar link. Verifique a URL e tente novamente.');
    } finally {
      setSubmitting(false);
      setLoadingStatus('');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'links', id));
    } catch (error) {
      console.error('Erro ao deletar link:', error);
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
          <p className="text-slate-500 dark:text-slate-400">Carregando links...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-2xl mx-auto py-8"
    >
      <div className="text-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-2 font-serif"
        >
          🔗 Smart Wishlist
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400"
        >
          Colecione e organize seus links favoritos com metadados automáticos ✨
        </motion.p>
      </div>

      {/* Form to add new link */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        onSubmit={handleSubmit} 
        className={`${GLASS_CLASSES} rounded-3xl p-6 mb-8`}
      >
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-rose-500" />
          Adicionar Novo Link
        </h3>

        <div className="flex gap-4">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Cole uma URL aqui..."
            className="flex-1 bg-transparent border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={submitting}
            type="submit"
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {loadingStatus || 'Adicionando...'}
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Adicionar
              </>
            )}
          </motion.button>
        </div>
      </motion.form>

      {/* Links list */}
      <AnimatePresence mode="popLayout">
        {links.length === 0 ? (
          <motion.div 
            key="empty" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}
          >
            <LinkIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Sua wishlist está vazia. Adicione seu primeiro link! 🌐
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {links.map((link, index) => (
              <motion.div 
                key={link.id}
                layout
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`${GLASS_CLASSES} rounded-3xl p-6 overflow-hidden`}
              >
                {link.image && (
                  <div className="w-full h-32 mb-4 rounded-2xl overflow-hidden">
                    <img 
                      src={link.image} 
                      alt={link.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2 leading-tight">
                      {link.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                      {link.description}
                    </p>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 font-medium text-sm transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir Link
                    </a>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(link.id)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="mt-12 text-center">
        <RouterLink 
          to="/central" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors text-xs font-bold uppercase tracking-widest bg-white/40 px-6 py-3 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
        </RouterLink>
      </div>
    </motion.div>
  );
}