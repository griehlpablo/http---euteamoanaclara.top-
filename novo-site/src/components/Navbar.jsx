import { Link } from 'react-router-dom';
import { Heart, Music, Music2, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';

export default function Navbar() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const { theme, setTheme } = useContext(ThemeContext);

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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-serif italic text-xl text-brand-dark dark:text-slate-200 flex items-center gap-2">
          A & P <Heart className="w-5 h-5 text-brand fill-current animate-pulse" />
        </Link>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full transition-colors text-slate-500 hover:bg-rose-50 dark:hover:bg-slate-700"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={toggleMusic}
            className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-brand-light text-brand-dark' : 'text-slate-500 hover:bg-rose-50 dark:hover:bg-slate-700'}`}
          >
            {isPlaying ? <Music2 className="w-5 h-5 animate-bounce" /> : <Music className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </nav>
  );
}