import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, X, Sparkles, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import ReactPlayer from 'react-player';

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

const Home = () => {
  const [loveValue, setLoveValue] = useState(10);
  const [showProposal, setShowProposal] = useState(false);
  
  // Estados do Player
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [progress, setProgress] = useState(0);

  const handleLoveChange = (e) => {
    setLoveValue(e.target.value);
    if (e.target.value < 10) {
      setTimeout(() => setLoveValue(10), 1000); 
    }
  };

  // Controles do Player
  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleProgress = (state) => {
    setProgress(state.played * 100); // Converte de 0.0~1.0 para 0~100%
  };

  const handleSeek = (e) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
    playerRef.current.seekTo(value / 100, 'fraction');
  };

  const nextTrack = () => {
    const internalPlayer = playerRef.current?.getInternalPlayer();
    if (internalPlayer && internalPlayer.nextVideo) {
      internalPlayer.nextVideo();
    }
  };

  const prevTrack = () => {
    const internalPlayer = playerRef.current?.getInternalPlayer();
    if (internalPlayer && internalPlayer.previousVideo) {
      internalPlayer.previousVideo();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[80vh] text-center px-2">
      
      {/* FOTO DE VOCÊS (Tela Inicial) */}
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mb-8 relative z-50">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto">
          <img src="/images/ana_e_eu_zoo.jpg" alt="Ana e Pablo" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 text-slate-800">Ana Clara</h1>
      
      {/* GRID DE INTERAÇÃO ROMÂNTICA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12 relative z-50">
        
        {/* CARD 1: MEDIDOR DE AMOR */}
        <div className={`${glassClasses} p-6 rounded-3xl flex flex-col justify-center`}>
          <h3 className="font-bold mb-2 text-slate-700">Quanto você ama o Pablo?</h3>
          <div className="text-rose-500 font-bold text-3xl mb-3">{loveValue}/10</div>
          <input 
            type="range" min="0" max="10" 
            value={loveValue} 
            onChange={handleLoveChange} 
            className="w-full accent-rose-500 cursor-pointer" 
          />
        </div>
        
        {/* CARD 2: A NOVA FASE */}
        <div className={`${glassClasses} p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600"></div>
          
          <Sparkles className="text-rose-400 mb-2" size={28} />
          <h3 className="font-bold mb-2 text-slate-800 text-lg">Nova Fase Desbloqueada</h3>
          <p className="text-sm text-slate-600 font-medium italic px-2">
            "Sem brigas, sem estresse. Apenas paz, muito amor e nós dois contra o mundo."
          </p>
        </div>

        {/* CARD 3: NOSSA TRILHA SONORA (CUSTOM PLAYER COM DISCO DE VINIL) */}
        <div className={`${glassClasses} p-5 rounded-3xl col-span-1 md:col-span-2 flex flex-col items-center justify-center`}>
          <h3 className="font-bold mb-4 text-slate-700 text-sm uppercase tracking-widest">Nossa Trilha Sonora 🎵</h3>
          
          <div className="flex flex-col w-full max-w-md bg-white/80 p-5 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              
              {/* VINIL GIRATÓRIO COM A FOTO DE VOCÊS */}
              <div 
                className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-slate-900 shadow-lg flex-shrink-0 bg-slate-900 ${isPlaying ? 'animate-spin' : ''}`} 
                style={{ animationDuration: '4s' }}
              >
                {/* Capa do Vinil */}
                <img src="/images/ana_e_eu_zoo.jpg" alt="Vinil do Casal" className="w-full h-full object-cover opacity-90" />
                {/* Furo do disco e detalhe do centro */}
                <div className="absolute inset-0 m-auto w-5 h-5 bg-slate-100 rounded-full border-2 border-slate-300"></div>
                <div className="absolute inset-0 m-auto w-1 h-1 bg-slate-800 rounded-full"></div>
              </div>
              
              <div className="flex-1 text-left">
                 <p className="font-bold text-slate-800 text-sm md:text-base line-clamp-1">Playlist "iA"</p>
                 <p className="text-xs text-slate-500 font-medium">Pablo & Ana Clara</p>
              </div>
            </div>

            {/* BARRA DE PROGRESSO */}
            <div className="mt-5 w-full">
              <input 
                type="range" min="0" max="100" value={progress} onChange={handleSeek}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* BOTÕES DE CONTROLE */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <button onClick={prevTrack} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                <SkipBack size={24} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="w-14 h-14 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-transform shadow-md cursor-pointer hover:scale-105"
              >
                 {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              
              <button onClick={nextTrack} className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer">
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
          </div>

          {/* O MOTOR DO YOUTUBE (Escondido) */}
          <div className="hidden">
            <ReactPlayer
              ref={playerRef}
              url="https://www.youtube.com/playlist?list=PLEJY-EkTyX3KtW_AyLiRyKA1Y1S-wyLUj"
              playing={isPlaying}
              width="0"
              height="0"
              volume={0.8}
              onProgress={handleProgress}
              config={{
                youtube: {
                  playerVars: { showinfo: 0, controls: 0 }
                }
              }}
            />
          </div>

        </div>

      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex flex-col sm:flex-row gap-4 relative z-50">
        <Link to="/central" className="bg-rose-500 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer">
          Entrar no Nosso Mundo <ArrowRight size={20} />
        </Link>
        <button onClick={() => setShowProposal(true)} className="bg-white text-rose-500 border border-rose-200 px-10 py-4 rounded-full font-bold shadow-md hover:shadow-lg transition-all cursor-pointer">
          Surpresa 💍
        </button>
      </div>

      {/* MODAL DO CASAMENTO */}
      <AnimatePresence>
        {showProposal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setShowProposal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 cursor-pointer">
                <X size={24} />
              </button>
              <h2 className="font-serif text-3xl font-bold mb-4 text-center text-slate-800">Ana, quer casar comigo?</h2>
              <p className="text-slate-600 text-center italic font-medium">"Para dividir cada sonho e cada tropeço da vida. Te amo infinitamente."</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Home;