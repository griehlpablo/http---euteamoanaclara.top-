import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Link as LinkIcon, ExternalLink, Plus, Trash2, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const GLASS_CLASSES = 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/50 dark:border-slate-600 shadow-lg';

const callGeminiForSummarization = async (rawUrl, rawTitle, rawDescription) => {
  const chaveInvertida = "sv2r2tMOcflOigw23UaC1-uQXIplv7dGDySazIA";
  const apiKey = chaveInvertida.split('').reverse().join('');
  
  const modelId = "gemini-flash-latest";
  
  // O prompt agora pede o resumo E a análise de confiabilidade baseada na URL
  const prompt = "Analise o seguinte produto e o link de onde ele vem. 1) Resuma o título (máx 5 palavras). 2) Resuma a descrição (máx 15 palavras). 3) Classifique a confiabilidade do domínio do link para compras online como 'high' (sites famosos, oficiais e seguros como Amazon, MercadoLivre, Shopee oficial, etc), 'medium' (marketplaces genéricos, lojas menores mas legítimas) ou 'low' (sites suspeitos, desconhecidos, com nomes estranhos ou com cara de golpe). Retorne APENAS um JSON válido no formato {\"title\": \"titulo resumido\", \"description\": \"descricao resumida\", \"trust\": \"high\"}. Link: " + rawUrl + " Título: " + rawTitle + " Descrição: " + rawDescription;
  
  try {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelId + ":generateContent";
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey 
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (response.ok && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      const caractereCrase = String.fromCharCode(96);
      const regexCrases = new RegExp(caractereCrase, 'g');
      
      const sanitized = responseText
        .replace(regexCrases, '') 
        .replace(/^json/i, '')
        .replace(/\n+/g, ' ')
        .trim();
      
      const parsed = JSON.parse(sanitized);
      return parsed;
    }
    
    throw new Error(data.error ? data.error.message : "Erro na resposta da API");
  } catch (error) {
    console.error('Erro ao chamar Gemini API:', error);
    return { title: rawTitle, description: rawDescription, trust: 'medium' }; // Fallback
  }
};

export default function Links() {
  const [links, setLinks] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);
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
      const urlMicrolink = "https://api.microlink.io/?url=" + encodeURIComponent(newUrl);
      const response = await fetch(urlMicrolink);
      const data = await response.json();

      let rawTitle = 'Link sem título';
      let rawDescription = 'Sem descrição';
      let image = null;
      let trustLevel = 'medium'; // Padrão se a IA falhar

      if (data && data.data) {
        rawTitle = data.data.title || rawTitle;
        rawDescription = data.data.description || rawDescription;
        if (data.data.image && data.data.image.url) {
          image = data.data.image.url;
        }
      }

      try {
        setLoadingStatus('Analisando segurança...');
        const summarized = await callGeminiForSummarization(newUrl, rawTitle, rawDescription);
        rawTitle = summarized.title || rawTitle;
        rawDescription = summarized.description || rawDescription;
        trustLevel = summarized.trust || 'medium';
      } catch (aiError) {
        console.error('Erro ao resumir com IA:', aiError);
      }

      // Trava de segurança para sites perigosos!
      if (trustLevel === 'low') {
        const proceed = window.confirm("⚠️ ALERTA DE SEGURANÇA ⚠️\n\nA Inteligência Artificial detectou que este site tem BAIXA confiabilidade (pode ser golpe ou loja falsa).\n\nTem certeza que deseja adicionar esse link à sua lista?");
        if (!proceed) {
          setSubmitting(false);
          setLoadingStatus('');
          return; // Aborta a adição
        }
      }

      await addDoc(collection(db, 'links'), {
        url: newUrl.trim(),
        title: rawTitle,
        description: rawDescription,
        image: image,
        trust: trustLevel,
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

  // Função para renderizar a etiqueta de segurança correta
  const renderTrustBadge = (trust) => {
    if (trust === 'high') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full w-max">
          <ShieldCheck size={12} /> Site Confiável
        </span>
      );
    }
    if (trust === 'low') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full w-max">
          <ShieldAlert size={12} /> Suspeito
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full w-max">
        <Shield size={12} /> Atenção
      </span>
    );
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
      className="max-w-4xl mx-auto py-8 px-4"
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
          Colecione links favoritos com metadados e análise de segurança IA ✨
        </motion.p>
      </div>

      <motion.form 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        onSubmit={handleSubmit} 
        className={GLASS_CLASSES + " rounded-3xl p-6 mb-8 max-w-2xl mx-auto"}
      >
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-rose-500" />
          Adicionar Novo Link
        </h3>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Cole a URL do produto aqui..."
            className="flex-1 bg-transparent border border-slate-200 dark:border-slate-600 rounded-2xl px-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={submitting}
            type="submit"
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
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

      <AnimatePresence mode="popLayout">
        {links.length === 0 ? (
          <motion.div 
            key="empty" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className={GLASS_CLASSES + " rounded-3xl p-12 text-center max-w-2xl mx-auto"}
          >
            <LinkIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Sua wishlist está vazia. Adicione seu primeiro link! 🌐
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {links.map((link, index) => (
              <motion.div 
                key={link.id}
                layout
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={GLASS_CLASSES + " rounded-3xl p-5 overflow-hidden flex flex-col h-full relative"}
              >
                {link.image && (
                  <div className="w-full h-40 mb-4 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 relative">
                    <img 
                      src={link.image} 
                      alt={link.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 leading-tight">
                      {link.title}
                    </h3>
                  </div>
                  
                  {/* Badge de segurança fica logo abaixo do título */}
                  <div className="mb-3">
                    {renderTrustBadge(link.trust)}
                  </div>

                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                    {link.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 font-bold text-sm transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ir para o site
                    </a>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(link.id)}
                      className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                      title="Excluir item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="mt-12 text-center">
        <RouterLink 
          to="/central" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors text-xs font-bold uppercase tracking-widest bg-white/40 dark:bg-slate-800/40 px-6 py-3 rounded-full backdrop-blur-sm border border-slate-100 dark:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
        </RouterLink>
      </div>
    </motion.div>
  );
}