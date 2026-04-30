import { Link } from 'react-router-dom';
import { Heart, Music, Music2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
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
        <Link to="/" className="font-serif italic text-xl text-brand-dark flex items-center gap-2">
          A & P <Heart className="w-5 h-5 text-brand fill-current animate-pulse" />
        </Link>
        
        <button 
          onClick={toggleMusic}
          className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-brand-light text-brand-dark' : 'text-slate-500 hover:bg-rose-50'}`}
        >
          {isPlaying ? <Music2 className="w-5 h-5 animate-bounce" /> : <Music className="w-5 h-5" />}
        </button>
      </div>
    </nav>
  );
}