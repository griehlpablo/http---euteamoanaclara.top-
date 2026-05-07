import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const glassClasses = 'bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg';
const YOUTUBE_VIDEO_ID = 'TJrY-iqxopY';
const YOUTUBE_PLAYLIST_ID = 'PLEJY-EkTyX3KtW_AyLiRyKA1Y1S-wyLUj';

const Home = () => {
  const [loveValue, setLoveValue] = useState(10);
  const [showProposal, setShowProposal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  const hiddenPlayerContainerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const snapTimerRef = useRef(null);
  const pendingPlayRef = useRef(false);

  useEffect(() => {
    const loadYouTubeIframeApi = () =>
      new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
          resolve(window.YT);
          return;
        }

        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
          const script = document.createElement('script');
          script.id = 'youtube-iframe-api';
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          document.body.appendChild(script);
        }

        window.onYouTubeIframeAPIReady = () => {
          resolve(window.YT);
        };
      });

    let mounted = true;

    const initializePlayer = async () => {
      const YT = await loadYouTubeIframeApi();
      if (!mounted || !hiddenPlayerContainerRef.current) return;

      ytPlayerRef.current = new YT.Player(hiddenPlayerContainerRef.current, {
        height: '180',
        width: '320',
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          listType: 'playlist',
          list: YOUTUBE_PLAYLIST_ID,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!mounted) return;
            setPlayerReady(true);
            const player = event.target;
            const videoDuration = player.getDuration();
            if (!Number.isNaN(videoDuration) && videoDuration > 0) {
              setDuration(videoDuration);
            }
            if (pendingPlayRef.current) {
              player.playVideo();
              pendingPlayRef.current = false;
            }
          },
          onStateChange: (event) => {
            if (!mounted) return;
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(event.target.getDuration());
            } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    initializePlayer();

    return () => {
      mounted = false;
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
      if (snapTimerRef.current) {
        window.clearTimeout(snapTimerRef.current);
      }
      if (ytPlayerRef.current && ytPlayerRef.current.destroy) {
        ytPlayerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!playerReady) return;

    const updateProgress = () => {
      const player = ytPlayerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function' || typeof player.getDuration !== 'function') return;
      const currentTime = player.getCurrentTime();
      const totalDuration = player.getDuration();
      if (totalDuration > 0) {
        setDuration(totalDuration);
        setPlayed(Math.min(1, currentTime / totalDuration));
      }
    };

    if (isPlaying) {
      updateProgress();
      progressTimerRef.current = window.setInterval(updateProgress, 400);
    } else if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, [isPlaying, playerReady]);

  const handleLoveChange = (event) => {
    const value = Number(event.target.value);
    setLoveValue(value);
    if (value < 10) {
      if (snapTimerRef.current) {
        window.clearTimeout(snapTimerRef.current);
      }
      snapTimerRef.current = window.setTimeout(() => {
        setLoveValue(10);
      }, 1000);
    }
  };

  const togglePlay = () => {
    const player = ytPlayerRef.current;
    if (player && typeof player.playVideo === 'function' && typeof player.pauseVideo === 'function') {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } else {
      pendingPlayRef.current = !isPlaying;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (event) => {
    const fraction = parseFloat(event.target.value);
    const player = ytPlayerRef.current;
    setPlayed(fraction);
    if (player && typeof player.seekTo === 'function' && duration > 0) {
      player.seekTo(fraction * duration, true);
    }
  };

  const nextTrack = () => {
    const player = ytPlayerRef.current;
    if (player && typeof player.nextVideo === 'function') {
      player.nextVideo();
      setPlayed(0);
      setIsPlaying(true);
    }
  };

  const prevTrack = () => {
    const player = ytPlayerRef.current;
    if (player && typeof player.previousVideo === 'function') {
      player.previousVideo();
      setPlayed(0);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 text-slate-800 px-4 py-10">
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center">
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-10 rounded-full border-4 border-white/80 shadow-2xl overflow-hidden w-48 h-48 md:w-64 md:h-64"
        >
          <img src="/images/ana_e_eu_zoo.jpg" alt="Casal" className="w-full h-full object-cover" />
        </motion.div>

        <h1 className="font-serif text-5xl md:text-7xl font-bold text-rose-600 mb-10">Meu Amor</h1>

        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2 mb-12">
          <div className={`${glassClasses} p-6 rounded-3xl`}>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Quanto você ama o Pablo?</h3>
            <div className="text-rose-500 font-bold text-4xl mb-5">{loveValue}/10</div>
            <input
              type="range"
              min="0"
              max="10"
              value={loveValue}
              onChange={handleLoveChange}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div className={`${glassClasses} p-6 rounded-3xl relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
            <div className="flex flex-col items-center justify-center h-full">
              <Sparkles className="text-rose-400 mb-3" size={28} />
              <h3 className="font-bold mb-3 text-slate-800 text-lg">Nova Fase Desbloqueada</h3>
              <p className="text-sm text-slate-600 font-medium italic px-2">
                "Sem brigas, sem estresse. Apenas paz, muito amor e nós dois contra o mundo."
              </p>
            </div>
          </div>
        </div>

        <div className={`${glassClasses} p-6 rounded-3xl w-full max-w-3xl shadow-xl`}>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-rose-500 mb-2">Nossa Trilha Sonora 🎵</p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Vinil Personalizado</h2>
            </div>

            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={isPlaying ? { duration: 4, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
              className="relative w-52 h-52 md:w-64 md:h-64 rounded-full border-[10px] border-slate-900 shadow-2xl bg-slate-950 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-full opacity-30 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_35%)]" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,transparent_20%,rgba(255,255,255,0.05)_21%,transparent_22%)]" />
              <div className="absolute inset-0 rounded-full opacity-30 pointer-events-none">
                <svg viewBox="0 0 256 256" className="w-full h-full">
                  <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <circle cx="128" cy="128" r="100" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <circle cx="128" cy="128" r="80" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <circle cx="128" cy="128" r="60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </svg>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-slate-800 shadow-inner">
                  <img src="/images/ana_e_eu_zoo.jpg" alt="Vinil centro" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-rose-500 border-4 border-rose-600 shadow-lg" />
              </div>
            </motion.div>

            <div className="w-full px-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={played}
                onChange={handleSeek}
                className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-500"
                style={{
                  background: `linear-gradient(to right, #fb7185 0%, #fb7185 ${played * 100}%, #e5e7eb ${played * 100}%, #e5e7eb 100%)`,
                }}
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>{formatTime(played * duration)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevTrack}
                className="rounded-full bg-white/80 p-3 shadow-md border border-white/70 text-slate-700"
                aria-label="Previous"
              >
                <SkipBack size={24} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                className="rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white p-5 shadow-xl"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={30} /> : <Play size={30} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextTrack}
                className="rounded-full bg-white/80 p-3 shadow-md border border-white/70 text-slate-700"
                aria-label="Next"
              >
                <SkipForward size={24} />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to="/central"
            className="inline-flex items-center justify-center rounded-full bg-rose-500 px-10 py-4 text-white font-bold shadow-lg hover:bg-rose-600 transition-all"
          >
            Entrar no Nosso Mundo
          </Link>

          <button
            type="button"
            onClick={() => setShowProposal(true)}
            className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-rose-600 font-bold border border-rose-200 shadow-md hover:shadow-lg transition-all"
          >
            Surpresa 💍
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showProposal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white/80 border border-white/60 p-8 shadow-2xl backdrop-blur-xl relative"
            >
              <button
                type="button"
                onClick={() => setShowProposal(false)}
                className="absolute right-6 top-6 text-slate-500 hover:text-rose-500"
                aria-label="Close proposal"
              >
                <X size={24} />
              </button>
              <h2 className="font-serif text-3xl font-bold text-slate-800 mb-4 text-center">
                Meu Amor, quer casar comigo?
              </h2>
              <p className="text-center text-slate-600 italic font-medium">
                Para dividir cada sonho e cada tropeço da vida. Te amo infinitamente.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute -top-[9999px] -left-[9999px] w-[1px] h-[1px] overflow-hidden">
        <div ref={hiddenPlayerContainerRef} />
      </div>
    </div>
  );
};

export default Home;
