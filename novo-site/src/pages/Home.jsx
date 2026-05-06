import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import ReactPlayer from 'react-player';

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

const Home = () => {
  const [loveValue, setLoveValue] = useState(10);
  const [showProposal, setShowProposal] = useState(false);
  
  // ==========================================
  // ESTADOS DO PLAYER E DO VINIL
  // ==========================================
  const playerRef = useRef(null);
  const vinylRef = useRef(null);
  const scratchAudioRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false); 
  const [progress, setProgress] = useState(0);
  
  // Estados da Física do Vinil
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastAngleRef = useRef(0);
  const lastSeekTimeRef = useRef(0);

  // Inicializa o som do Scratch
  useEffect(() => {
    scratchAudioRef.current = new Audio('/audio/scratch.mp3');
    scratchAudioRef.current.volume = 0.5; 
    scratchAudioRef.current.loop = true; 
  }, []);

  const handleLoveChange = (e) => {
    setLoveValue(e.target.value);
    if (e.target.value < 10) {
      setTimeout(() => setLoveValue(10), 1000); 
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleProgress = (state) => {
    if (!isDragging) {
      setProgress(state.played * 100); 
    }
  };

  const handleSeek = (e) => {
    const value = parseFloat(e.target.value);
    setProgress(value);
    if (playerRef.current) {
      playerRef.current.seekTo(value / 100, 'fraction');
    }
  };

  const nextTrack = () => {
    const internalPlayer = playerRef.current?.getInternalPlayer();
    if (internalPlayer && internalPlayer.nextVideo) internalPlayer.nextVideo();
  };

  const prevTrack = () => {
    const internalPlayer = playerRef.current?.getInternalPlayer();
    if (internalPlayer && internalPlayer.previousVideo) internalPlayer.previousVideo();
  };

  // ==========================================
  // LÓGICA DO VINIL INTERATIVO (SCRATCH)
  // ==========================================
  
  useEffect(() => {
    let animationFrameId;
    const spin = () => {
      if (isPlaying && !isDragging) {
        setRotation((prev) => (prev + 0.6) % 360); 
      }
      animationFrameId = requestAnimationFrame(spin);
    };
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(spin);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, isDragging]);

  const getAngle = (clientX, clientY) => {
    if (!vinylRef.current) return 0;
    const rect = vinylRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    if (scratchAudioRef.current) {
      scratchAudioRef.current.play().catch(err => console.log('Interação bloqueada', err));
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastAngleRef.current = getAngle(clientX, clientY);
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const currentAngle = getAngle(clientX, clientY);
      
      let delta = currentAngle - lastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      setRotation((prev) => prev + delta);
      lastAngleRef.current = currentAngle;

      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        if (currentTime !== undefined) {
          const now = Date.now();
          if (now - lastSeekTimeRef.current > 150) {
            const newTime = Math.max(0, currentTime + (delta * 0.2)); 
            playerRef.current.seekTo(newTime, 'seconds');
            lastSeekTimeRef.current = now;
          }
        }
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (scratchAudioRef.current) {
        scratchAudioRef.current.pause();
        scratchAudioRef.current.currentTime = 0; 
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[80vh] text-center px-2">
      
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mb-8 relative z-50">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto">
          <img src="/images/ana_e_eu_zoo.jpg" alt="Ana e Pablo" className="w-full h-full object-cover" />
        </div>
      </motion.div>

      <h1 className="font-serif text-5xl md:text-7xl font-bold mb-4 text-slate-800">Ana Clara</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12 relative z-50">
        
        <div className={`${glassClasses} p-6 rounded-3xl flex flex-col justify-center`}>
          <h3 className="font-bold mb-2 text-slate-700">Quanto você ama o Pablo?</h3>
          <div className="text-rose-500 font-bold text-3xl mb-3">{loveValue}/10</div>
          <input type="range" min="0" max="10" value={loveValue} onChange={handleLoveChange} className="w-full accent-rose-500 cursor-pointer" />
        </div>
        
        <div className={`${glassClasses} p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600"></div>
          <Sparkles className="text-rose-400 mb-2" size={28} />
          <h3 className="font-bold mb-2 text-slate-800 text-lg">Nova Fase Desbloqueada</h3>
          <p className="text-sm text-slate-600 font-medium italic px-2">
            "Sem brigas, sem estresse. Apenas paz, muito amor e nós dois contra o mundo."
          </p>
        </div>

        {/* CARD 3: NOSSA TRILHA SONORA */}
        <div className={`${glassClasses} p-6 rounded-3xl col-span-1 md:col-span-2 flex flex-col items-center justify-center relative overflow-hidden`}>
          
          <div className="relative z-10 flex flex-col items-center w-full">
            <h3 className="font-bold mb-6 text-slate-700 text-sm uppercase tracking-widest">Nossa Trilha Sonora 🎵</h3>
            
            <div className="flex flex-col items-center w-full max-w-md bg-white/80 p-6 rounded-3xl shadow-sm border border-slate-100">
              
              <div 
                ref={vinylRef}
                onPointerDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-[6px] border-slate-900 shadow-2xl bg-slate-900 cursor-grab active:cursor-grabbing touch-none mb-6" 
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <img src="/images/ana_e_eu_zoo.jpg" alt="Vinil" className="w-full h-full object-cover opacity-90 pointer-events-none" />
                <div className="absolute inset-0 rounded-full border border-white/10 m-2 pointer-events-none"></div>
                <div className="absolute inset-0 rounded-full border border-white/10 m-6 pointer-events-none"></div>
                <div className="absolute inset-0 rounded-full border border-white/10 m-10 pointer-events-none"></div>
                <div className="absolute inset-0 m-auto w-8 h-8 bg-rose-100 rounded-full border-4 border-slate-300 pointer-events-none flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                </div>
              </div>
              
              <div className="text-center w-full mb-6">
                 <p className="font-bold text-slate-800 text-lg">Playlist "iA"</p>
                 <p className="text-sm text-slate-500 font-medium">Pablo & Ana Clara</p>
              </div>

              <div className="w-full mb-6">
                <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500" />
              </div>

              <div className="flex items-center justify-center gap-8">
                <button onClick={prevTrack} className="text-slate-500 hover:text-rose-500 transition-colors cursor-pointer">
                  <SkipBack size={28} fill="currentColor" />
                </button>
                
                <button 
                  onClick={togglePlay} 
                  className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-transform shadow-lg cursor-pointer hover:scale-105"
                >
                   {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                
                <button onClick={nextTrack} className="text-slate-500 hover:text-rose-500 transition-colors cursor-pointer">
                  <SkipForward size={28} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>

          {/* O MOTOR DO YOUTUBE INVISÍVEL */}
          {/* Fixado no canto, invisível para o usuário, mas visível para o navegador aprovar o play */}
          <div className="fixed top-0 left-0 w-[100px] h-[100px] opacity-0 pointer-events-none -z-50">
            <ReactPlayer
              ref={playerRef}
              url="https://www.youtube.com/watch?v=TJrY-iqxopY&list=PLEJY-EkTyX3KtW_AyLiRyKA1Y1S-wyLUj&index=1"
              playing={isPlaying}
              width="100%"
              height="100%"
              volume={1}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onProgress={handleProgress}
              config={{
                youtube: {
                  playerVars: { 
                    controls: 0, 
                    playsinline: 1,
                    disablekb: 1
                  }
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