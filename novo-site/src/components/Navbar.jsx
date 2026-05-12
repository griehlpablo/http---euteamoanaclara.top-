import { Link } from 'react-router-dom';
import { Heart, Music, Music2, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ theme, toggleTheme }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/music/nossa-musica.mp3');
    audioRef.current.loop = true;
  }, []);

  const toggleMusic = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-serif italic text-xl text-brand-dark dark:text-slate-200 flex items-center gap-2">
          A & P <Heart className="w-5 h-5 text-brand fill-current animate-pulse" />
        </Link>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleMusic}
            className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-brand-light text-brand-dark' : 'text-slate-500 hover:bg-rose-50 dark:hover:bg-slate-700'}`}
          >
            {isPlaying ? <Music2 className="w-5 h-5 animate-bounce" /> : <Music className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-slate-700 shadow-sm cursor-pointer"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-slate-600" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-400" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </nav>
  );
}