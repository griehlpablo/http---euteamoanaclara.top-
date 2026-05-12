import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, LogOut, Heart, Camera, Smile, X } from 'lucide-react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import OneSignal from 'react-onesignal';
import EmojiPicker from 'emoji-picker-react';

// ==========================================
// CONSTANTES
// ==========================================
const GLASS_CLASSES = 'bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg';
const ONESIGNAL_APP_ID = '5d8db7f8-b110-42af-a94d-96655cccd6ff';
const ONESIGNAL_API_KEY = 'j7gz65b2revye5nxv4rpknt7d'; 

// ==========================================
// USER PROFILES
// ==========================================
const USER_PROFILES = {
  '@griehl_': {
    nomeExibicao: 'Pablo',
    color: 'from-blue-500 to-indigo-600',
    initial: 'P',
    foto: '/images/pablo.jpeg'
  },
  '@anakov_': {
    nomeExibicao: 'Ana Clara',
    color: 'from-rose-400 to-rose-600',
    initial: 'A',
    foto: '/images/ana.jpeg' 
  }
};

// ==========================================
// HELPER: Formatar Timestamp
// ==========================================
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Enviando...';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffMinutes < 1440) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// ==========================================
// COMPONENTE: Avatar com Fallback
// ==========================================
function AvatarWithFallback({ userHandle, size = 12 }) {
  let profile = USER_PROFILES[userHandle];
  
  if (!profile) {
    if (userHandle === 'Pablo') profile = USER_PROFILES['@griehl_'];
    else if (userHandle === 'Ana Clara') profile = USER_PROFILES['@anakov_'];
  }

  const sizeClass = `w-${size} h-${size}`;

  if (!profile) {
    return (
      <div 
        className={`${sizeClass} rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
      >
        ?
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClass} relative rounded-full overflow-hidden bg-gradient-to-br ${profile.color} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm`}
    >
      <span className="absolute inset-0 flex items-center justify-center">
        {profile.initial}
      </span>
      {profile.foto && (
        <img 
          src={profile.foto} 
          alt={userHandle} 
          className="absolute inset-0 w-full h-full object-cover z-10" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }} 
        />
      )}
    </div>
  );
}

// ==========================================
// HELPER: Enviar Notificação OneSignal 
// ==========================================
async function notifyPartner(currentUserHandle, messagePreview) {
  const partner = currentUserHandle === '@griehl_' ? '@anakov_' : '@griehl_';
  const currentProfile = USER_PROFILES[currentUserHandle];

  if (!ONESIGNAL_API_KEY) return;

  try {
    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: [partner],
        headings: {
          en: 'Novo Tweet no Mural! ❤️',
          pt: 'Novo Tweet no Mural! ❤️'
        },
        contents: {
          en: `${currentProfile?.nomeExibicao || currentUserHandle} postou: "${messagePreview}"`,
          pt: `${currentProfile?.nomeExibicao || currentUserHandle} postou: "${messagePreview}"`
        }
      })
    });
  } catch (error) {
    console.error('Erro ao enviar notificação via OneSignal:', error);
  }
}

// ==========================================
// COMPONENTE PRINCIPAL: MURAL
// ==========================================
export default function Mural() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Fechar picker de emoji ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // OneSignal Login
  useEffect(() => {
    if (currentUser && OneSignal) {
      try {
        OneSignal.login(currentUser);
      } catch (error) {
        console.error('Erro ao fazer login no OneSignal:', error);
      }
    }
  }, [currentUser]);

  // Limpar URL do preview de imagem
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Buscar posts no Firestore
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'mural'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setPosts(postsData);
      },
      (error) => {
        console.error('Erro ao carregar posts:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Manipular seleção de imagem
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Limpar imagem selecionada
  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Manipular clique no emoji
  const handleEmojiClick = (emojiObject) => {
    setNewPostText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Publicar post
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedImage) return;

    setLoading(true);
    const textToSend = newPostText.trim();
    let imageUrl = null;

    try {
      if (selectedImage) {
        const storageRef = ref(storage, `mural_images/${Date.now()}_${selectedImage.name}`);
        await uploadBytes(storageRef, selectedImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'mural'), {
        text: textToSend,
        author: currentUser,
        imageUrl: imageUrl || null,
        timestamp: serverTimestamp(),
        likes: []
      });

      setNewPostText('');
      clearImage();

      const messagePreview = textToSend.substring(0, 50) || '📸 Imagem enviada';
      await notifyPartner(currentUser, messagePreview);
    } catch (error) {
      console.error('Erro ao publicar post:', error);
      alert('Erro ao publicar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Like
  const toggleLike = async (postId, currentLikes) => {
    if (!currentUser) return;

    const postRef = doc(db, 'mural', postId);
    const likesArray = currentLikes || [];
    const hasLiked = likesArray.includes(currentUser);

    try {
      if (hasLiked) {
        await updateDoc(postRef, { likes: arrayRemove(currentUser) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(currentUser) });
      }
    } catch (error) {
      console.error('Erro ao atualizar curtida:', error);
    }
  };

  // ==========================================
  // TELA 1: SELEÇÃO DE PERFIL
  // ==========================================
  if (!currentUser) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="min-h-[80vh] flex flex-col items-center justify-center px-4"
      >
        <div className="text-center w-full max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="text-5xl md:text-6xl font-bold text-slate-800 mb-2 font-serif"
          >
            Mural
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="text-xl text-slate-500 mb-16 italic"
          >
            Quem está postando agora?
          </motion.p>

          <div className="flex flex-col md:flex-row gap-12 justify-center">
            {Object.entries(USER_PROFILES).map(([handle, profile], index) => (
              <motion.button
                key={handle}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.08, y: -8 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentUser(handle)}
                className="flex flex-col items-center gap-6 cursor-pointer group focus:outline-none"
              >
                <div 
                  className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br ${profile.color} flex items-center justify-center text-white text-5xl font-bold transition-all group-hover:shadow-2xl`}
                >
                  <span className="absolute inset-0 flex items-center justify-center">
                    {profile.initial}
                  </span>
                  {profile.foto && (
                    <img 
                      src={profile.foto} 
                      alt={handle} 
                      className="absolute inset-0 w-full h-full object-cover z-10" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-700 group-hover:text-rose-500 transition-colors">
                    {profile.nomeExibicao}
                  </p>
                  <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
                    {handle}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // TELA 2: TIMELINE (MURAL)
  // ==========================================
  const currentProfile = USER_PROFILES[currentUser];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen bg-gradient-to-br from-rose-50 to-slate-50 py-6 px-4 relative z-40"
    >
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }} 
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <AvatarWithFallback userHandle={currentUser} size={12} />
            <div className="text-left">
              <p className="text-sm text-slate-600">Postando como</p>
              <p className="text-lg font-bold text-slate-800">{currentProfile?.nomeExibicao}</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => setCurrentUser(null)} 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-600 hover:text-rose-500 font-medium text-sm shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100"
          >
            <LogOut size={16} />
            Sair
          </motion.button>
        </motion.div>

        {/* Caixa de Novo Post */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          onSubmit={handlePublish} 
          className={`${GLASS_CLASSES} rounded-3xl p-6 mb-8 flex gap-4`}
        >
          <AvatarWithFallback userHandle={currentUser} size={14} />
          
          <div className="flex-1 flex flex-col relative">
            
            {/* Preview de Imagem (Se existir) */}
            {imagePreview && (
              <div className="relative mb-4 rounded-xl overflow-hidden group shadow-md border border-white/40">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full max-h-64 object-cover rounded-xl" 
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearImage}
                  className="absolute top-3 right-3 p-2 bg-slate-900/60 backdrop-blur-md hover:bg-rose-500 text-white rounded-full transition-colors cursor-pointer shadow-lg"
                >
                  <X size={18} />
                </motion.button>
              </div>
            )}

            {/* Input de Texto */}
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder={`O que está pensando, ${currentProfile?.nomeExibicao}?`}
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-lg resize-none focus:outline-none min-h-[90px] pt-2 leading-relaxed"
            />

            {/* Botões de Ação */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
              <div className="flex gap-3 relative">
                
                {/* Botão Câmera (Glassmorphism) */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center p-2.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/40 text-slate-500 hover:bg-rose-100 hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer shadow-sm"
                  title="Anexar Imagem"
                >
                  <Camera size={22} />
                </motion.button>

                {/* Botão Emoji (Glassmorphism) */}
                <div ref={emojiPickerRef} className="relative">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`flex items-center justify-center p-2.5 rounded-full backdrop-blur-sm border transition-all cursor-pointer shadow-sm ${
                      showEmojiPicker 
                        ? 'bg-rose-100 text-rose-500 border-rose-200' 
                        : 'bg-white/50 border-white/40 text-slate-500 hover:bg-rose-100 hover:text-rose-500 hover:border-rose-200'
                    }`}
                    title="Adicionar Emoji"
                  >
                    <Smile size={22} />
                  </motion.button>

                  {/* Teclado de Emojis Flutuante */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-14 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-100"
                      >
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          theme="light"
                          width={320}
                          height={400}
                          searchDisabled={false}
                          skinTonesDisabled={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Botão Publicar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading || (!newPostText.trim() && !selectedImage)}
                type="submit"
                className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Send size={18} />
                {loading ? 'Enviando...' : 'Publicar'}
              </motion.button>
            </div>
          </div>

          {/* Input oculto para Upload de Arquivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </motion.form>

        {/* Feed de Posts */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {posts.length === 0 ? (
              <motion.div 
                key="empty-state" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}
              >
                <p className="text-lg text-slate-600">
                  Nenhuma postagem ainda. Seja o primeiro a postar! 💕
                </p>
              </motion.div>
            ) : (
              posts.map((post) => {
                const likes = post.likes || [];
                const hasLiked = likes.includes(currentUser);
                const postProfile = USER_PROFILES[post.author];

                return (
                  <motion.div 
                    key={post.id} 
                    layout 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }} 
                    transition={{ duration: 0.3 }} 
                    className={`${GLASS_CLASSES} rounded-3xl p-6 mb-4 hover:shadow-lg transition-shadow`}
                  >
                    <div className="flex gap-4">
                      
                      <AvatarWithFallback userHandle={post.author} size={12} />

                      <div className="flex-1 min-w-0">
                        {/* Header do Post */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-slate-800">
                            {postProfile?.nomeExibicao || post.author}
                          </span>
                          <span className="text-slate-400 text-sm">
                            {postProfile ? post.author : ''}
                          </span>
                          <span className="text-slate-400 text-sm">•</span>
                          <span className="text-slate-500 text-sm">
                            {formatTimestamp(post.timestamp)}
                          </span>
                        </div>

                        {/* Texto do Post */}
                        <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap break-words mb-4">
                          {post.text}
                        </p>

                        {/* Imagem do Post (se houver) */}
                        {post.imageUrl && (
                          <div className="mb-5 rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                            <img
                              src={post.imageUrl}
                              alt="Post"
                              className="w-full max-h-[500px] object-cover"
                            />
                          </div>
                        )}

                        {/* Botão de Curtir */}
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.95 }} 
                          onClick={() => toggleLike(post.id, likes)} 
                          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer font-medium text-sm ${
                            hasLiked 
                              ? 'text-rose-500 bg-rose-50 hover:bg-rose-100' 
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-50'
                          }`}
                        >
                          <Heart size={18} className={hasLiked ? 'fill-rose-500' : ''} />
                          {likes.length > 0 && <span>{likes.length}</span>}
                        </motion.button>
                        
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}