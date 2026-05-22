import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, LockKeyhole, Sparkles } from 'lucide-react';
import { ACCESS_STORAGE_KEY, isValidPin } from '../config/access';

export default function PinGate({ children }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem(ACCESS_STORAGE_KEY) === 'true');

  useEffect(() => {
    const handleLock = () => setUnlocked(false);
    window.addEventListener('site-lock', handleLock);
    return () => window.removeEventListener('site-lock', handleLock);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isValidPin(pin)) {
      localStorage.setItem(ACCESS_STORAGE_KEY, 'true');
      setUnlocked(true);
      setError('');
      return;
    }

    setError('Esse PIN ainda não abriu o portal do amor. Tenta de novo com carinho.');
    setPin('');
  };

  if (unlocked) return children;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[70vh] flex items-center justify-center px-2"
    >
      <div className="w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 shadow-2xl rounded-[2rem] p-6 sm:p-8 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-3xl bg-rose-100 text-rose-500 flex items-center justify-center shadow-inner">
          <LockKeyhole className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Portal Secreto
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Digite o PIN para entrar no cantinho de Pablo e Ana.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="PIN"
            className="w-full rounded-2xl border border-rose-100 bg-white/80 dark:bg-slate-800/80 px-5 py-4 text-center text-2xl tracking-[0.4em] font-bold text-slate-700 dark:text-slate-100 outline-none focus:ring-4 focus:ring-rose-200"
          />
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-rose-500 leading-relaxed">
              {error}
            </motion.p>
          )}
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4 text-white font-bold shadow-lg shadow-rose-200/60 hover:from-rose-600 hover:to-pink-600 transition-all">
            <Heart className="w-5 h-5 fill-current" />
            Desbloquear
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-rose-300 font-bold">
          <Sparkles className="w-3 h-3" />
          Só para quem faz parte dessa história
        </div>
      </div>
    </motion.div>
  );
}
