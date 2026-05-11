import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Send, Clock, LogOut } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import db from '../firebase';

export default function Mural() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [loading, setLoading] = useState(false);

  // Real-time listener for posts from Firestore
  useEffect(() => {
    if (!currentUser) return; // Only listen when user is selected

    const q = query(collection(db, 'mural'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [currentUser]);

  // Handle publish post
  const handlePublish = async (e) => {
    e.preventDefault();

    if (!newPostText.trim()) {
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'mural'), {
        text: newPostText,
        author: currentUser,
        timestamp: serverTimestamp(),
      });
      setNewPostText('');
    } catch (error) {
      console.error('Erro ao publicar post:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Agora';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('pt-BR');
  };

  // User Selection Screen
  if (!currentUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center px-4"
      >
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-bold text-rose-900 mb-4 font-serif"
          >
            Mural
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-rose-700 mb-12"
          >
            Quem está postando?
          </motion.p>

          <div className="flex gap-8 justify-center flex-wrap">
            {['Pablo', 'Ana Clara'].map((user, index) => (
              <motion.button
                key={user}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentUser(user)}
                className="glass-panel px-12 py-8 rounded-2xl flex flex-col items-center gap-4 cursor-pointer hover:shadow-xl transition-all duration-300 min-w-max"
              >
                <User size={48} className="text-rose-500" />
                <span className="text-2xl font-semibold text-gray-800">{user}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Main Mural with Compose Box and Feed
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-rose-50 to-rose-100 py-8 px-4"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header with User and Logout */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <User size={24} className="text-rose-500" />
            <span className="text-lg font-semibold text-gray-800">
              Postando como: <span className="text-rose-600">{currentUser}</span>
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentUser(null)}
            className="glass-panel px-4 py-2 rounded-lg flex items-center gap-2 text-gray-700 hover:text-rose-600 transition-colors"
          >
            <LogOut size={16} />
            Sair
          </motion.button>
        </motion.div>

        {/* Compose Box */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handlePublish}
          className="glass-panel rounded-2xl p-6 mb-8 shadow-lg"
        >
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="O que está acontecendo?"
            className="w-full bg-transparent text-gray-800 placeholder-gray-500 text-lg resize-none focus:outline-none h-32"
          />
          <div className="flex justify-end mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading || !newPostText.trim()}
              type="submit"
              className="bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-all duration-200"
            >
              <Send size={18} />
              {loading ? 'Publicando...' : 'Publicar'}
            </motion.button>
          </div>
        </motion.form>

        {/* Feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="popLayout">
            {posts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel rounded-2xl p-8 text-center text-gray-600"
              >
                <p className="text-lg">Nenhuma postagem ainda. Seja o primeiro a postar! 💕</p>
              </motion.div>
            ) : (
              posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="glass-panel rounded-2xl p-6 mb-4 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Author and Timestamp */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-full p-2">
                        <User size={16} className="text-white" />
                      </div>
                      <span className="font-semibold text-gray-800">{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <Clock size={14} />
                      {formatTimestamp(post.timestamp)}
                    </div>
                  </div>

                  {/* Post Text */}
                  <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap break-words">
                    {post.text}
                  </p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}