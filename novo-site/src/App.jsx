import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import OneSignal from 'react-onesignal';

import Navbar from './components/Navbar';
import HeartRain from './components/HeartRain';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Blog from './pages/Blog';
import Central from './pages/Central';
import Contagem from './pages/Contagem';
import AssistenteCasal from './pages/AssistenteCasal';
import Genealogia from './pages/Genealogia';
import Galeria from './pages/Galeria';
import Retrospectiva from './pages/Retrospectiva';
import Satisfacao from './pages/Satisfacao';
import Humor from './pages/Humor';
import Mural from './pages/Mural';
import CapsulaTempo from './pages/CapsulaTempo';
import Cupons from './pages/Cupons';
import BucketList from './pages/BucketList';
import PotePapel from './pages/PotePapel';
import Links from './pages/Links';
import LinhaDoTempo from './pages/LinhaDoTempo';
import QuizCasal from './pages/QuizCasal';
import SurpresaDiaria from './pages/SurpresaDiaria';
import Dieta from './pages/Dieta';
import Gastos from './pages/Gastos';
import { supabase, isSupabaseConfigured } from './supabase';

const REALTIME_ROUTE_TABLES = {
  '/bucketlist': ['bucketlist'],
  '/capsula': ['capsula'],
  '/potepapel': ['potepapel'],
  '/links': ['links'],
  '/mural': ['mural'],
  '/cupons': ['cupons'],
  '/galeria': ['gallery'],
};

function NotFound() {
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/60 bg-white/75 p-8 text-center shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/75">
      <h1 className="font-serif text-3xl font-bold text-slate-800 dark:text-slate-100">Página não encontrada</h1>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">O endereço aberto não corresponde a uma página disponível.</p>
      <Link to="/central" className="mt-5 inline-flex rounded-2xl bg-rose-500 px-5 py-3 font-bold text-white hover:bg-rose-600">
        Voltar para a Central
      </Link>
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [syncVersion, setSyncVersion] = useState(0);

  useEffect(() => {
    const redirect = sessionStorage.getItem('spaRedirect');
    const hashRoute = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '';
    const nextPath = redirect || hashRoute;
    if (!nextPath) return;
    sessionStorage.removeItem('spaRedirect');
    window.history.replaceState(null, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let refreshTimer;
    const channel = supabase
      .channel('site-public-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
          const watchedTables = REALTIME_ROUTE_TABLES[currentPath] || [];
          if (!watchedTables.includes(payload.table)) return;

          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => {
            setSyncVersion((version) => version + 1);
          }, 350);
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Sincronizacao em tempo real indisponivel:', status);
        }
      });

    return () => {
      window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const runOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: '5d8db7f8-b110-42af-a94d-96655cccd6ff',
          allowLocalhostAsSecureOrigin: true,
        });
        OneSignal.Slidedown.promptPush();
      } catch (error) {
        console.error('Erro ao carregar o OneSignal:', error);
      }
    };
    runOneSignal();
  }, []);

  return (
    <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-slate-900 dark:to-slate-950 min-h-screen text-slate-700 dark:text-slate-200 antialiased overflow-x-hidden font-sans relative transition-colors duration-300">
      <HeartRain />
      <Router>
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto relative z-10">
          <Routes key={syncVersion}>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/central" element={<Central />} />
            <Route path="/contagem" element={<Contagem />} />
            <Route path="/assistente" element={<AssistenteCasal />} />
            <Route path="/genealogia" element={<Genealogia />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/retrospectiva" element={<Retrospectiva />} />
            <Route path="/satisfacao" element={<Satisfacao />} />
            <Route path="/humor" element={<Humor />} />
            <Route path="/mural" element={<Mural />} />
            <Route path="/capsula" element={<CapsulaTempo />} />
            <Route path="/cupons" element={<Cupons />} />
            <Route path="/bucketlist" element={<BucketList />} />
            <Route path="/potepapel" element={<PotePapel />} />
            <Route path="/links" element={<Links />} />
            <Route path="/linha-do-tempo" element={<LinhaDoTempo />} />
            <Route path="/quiz" element={<QuizCasal />} />
            <Route path="/surpresa-diaria" element={<SurpresaDiaria />} />
            <Route
              path="/gastos"
              element={
                <ErrorBoundary>
                  <Gastos />
                </ErrorBoundary>
              }
            />
            <Route
              path="/dieta"
              element={
                <ErrorBoundary>
                  <Dieta />
                </ErrorBoundary>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <footer className="mt-10 border-t border-slate-200/70 pt-6 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/blog" className="text-slate-600 transition hover:text-rose-600">
                Blog
              </Link>
              <span className="hidden sm:inline-block">•</span>
              <span>Conteúdo leve, público e amigável para o casal.</span>
            </div>
          </footer>
        </main>
      </Router>
    </div>
  );
}
