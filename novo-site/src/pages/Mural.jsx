import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Send, Clock, LogOut, Heart } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase'; // Importando o banco de dados que você configurou

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

// Configuração visual dos usuários
const userProfiles = {
  'Pablo': { color: 'from-blue-500 to-indigo-600', initial: 'P' },
  'Ana Clara': { color: 'from-rose-400 to-rose-600', initial: 'A' }
};

export default function Mural() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. OUVINTE DE TEMPO REAL DO FIREBASE
  useEffect(() => {
    if (!currentUser) return; 

    const q = query(collection(db, 'mural'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe(); 
  }, [currentUser]);

  // 2. FUNÇÃO DE PUBLICAR TWEET
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'mural'), {
        text: newPostText,
        author: currentUser,
        timestamp: serverTimestamp(),
        likes: [] // Começa com zero curtidas
      });
      setNewPostText('');
    } catch (error) {
      console.error('Erro ao publicar post:', error);
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNÇÃO DE CURTIR (LIKE)
  const toggleLike = async (postId, currentLikes) => {
    const postRef = doc(db, 'mural', postId);
    const likesArray = currentLikes || [];
    
    try {
      if (likesArray.includes(currentUser)) {
        await updateDoc(postRef, { likes: arrayRemove(currentUser) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(currentUser) });
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
    }
  };

  // 4. FORMATADOR DE DATA/HORA
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Enviando...';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  // ==========================================
  // TELA 1: LOGIN DO CASAL
  // ==========================================
  if (!currentUser) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[80vh] flex flex-col items-center justify-center px-4 relative z-50">
        <div className="text-center w-full max-w-md">
          <h1 className="text-5xl font-bold text-rose-600 mb-2 font-serif">Mural</h1>
          <p className="text-lg text-slate-500 mb-10 italic">O nosso cantinho de pensamentos.</p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {Object.keys(userProfiles).map((user, index) => (
              <motion.button
                key={user}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentUser(user)}
                className={`${glassClasses} flex-1 py-8 rounded-3xl flex flex-col items-center gap-4 cursor-pointer hover:border-rose-300 transition-all`}
              >
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${userProfiles[user].color} flex items-center justify-center shadow-lg text-white text-3xl font-bold`}>
                  {userProfiles[user].initial}
                </div>
                <span className="text-xl font-bold text-slate-800">{user}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // TELA 2: O FEED (TWITTER DO CASAL)
  // ==========================================
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen py-4 relative z-50">
      <div className="max-w-xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 px-2">
          <h1 className="text-3xl font-bold text-slate-800 font-serif">Linha do Tempo</h1>
          <button onClick={() => setCurrentUser(null)} className="text-sm font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors cursor-pointer">
            <LogOut size={16} /> Sair
          </button>
        </div>

        {/* CAIXA DE NOVO TWEET */}
        <div className={`${glassClasses} rounded-3xl p-5 mb-8 flex gap-4`}>
          <div className={`w-12 h-12 shrink-0 rounded-full bg-gradient-to-br ${userProfiles[currentUser].color} flex items-center justify-center shadow-inner text-white font-bold text-lg`}>
            {userProfiles[currentUser].initial}
          </div>
          
          <form onSubmit={handlePublish} className="flex-1 flex flex-col">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="O que você está pensando, amor?"
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-lg resize-none focus:outline-none min-h-[80px] pt-2"
            />
            <div className="flex justify-end mt-2 pt-3 border-t border-slate-100">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading || !newPostText.trim()}
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {loading ? 'Enviando...' : 'Publicar'} <Send size={16} />
              </motion.button>
            </div>
          </form>
        </div>

        {/* FEED DE POSTS */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {posts.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-slate-500 py-10 italic">
                Nenhuma mensagem ainda. Mande o primeiro oi! 💕
              </motion.div>
            ) : (
              posts.map((post) => {
                const isMyPost = post.author === currentUser;
                const likes = post.likes || [];
                const iLiked = likes.includes(currentUser);

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${glassClasses} rounded-3xl p-5 hover:border-rose-200 transition-colors`}
                  >
                    <div className="flex gap-4">
                      {/* Avatar do Autor */}
                      <div className={`w-12 h-12 shrink-0 rounded-full bg-gradient-to-br ${userProfiles[post.author]?.color || 'from-slate-400 to-slate-500'} flex items-center justify-center shadow-sm text-white font-bold text-lg`}>
                        {userProfiles[post.author]?.initial || <User size={20}/>}
                      </div>

                      {/* Conteúdo do Post */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800">{post.author}</span>
                          <span className="text-slate-400 text-sm flex items-center gap-1">
                            • {formatTimestamp(post.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap break-words mb-3">
                          {post.text}
                        </p>

                        {/* Botões de Interação (Like) */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleLike(post.id, likes)}
                            className={`flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer p-1.5 -ml-1.5 rounded-full hover:bg-rose-50 ${iLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
                          >
                            <Heart size={18} className={iLiked ? "fill-rose-500" : ""} />
                            {likes.length > 0 && <span>{likes.length}</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
        
      </div>
    </motion.div>
  );
}