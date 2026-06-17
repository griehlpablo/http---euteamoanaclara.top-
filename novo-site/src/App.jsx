import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import OneSignal from 'react-onesignal';

import Navbar from './components/Navbar';
import HeartRain from './components/HeartRain';
import PinGate from './components/PinGate';
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

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const redirect = sessionStorage.getItem('spaRedirect');
    const hashRoute = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : '';
    const nextPath = redirect || hashRoute;
    if (!nextPath) return;
    sessionStorage.removeItem('spaRedirect');
    window.history.replaceState(null, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, []);

  // Alterna entre os temas
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Aplica a classe 'dark' no elemento raiz (html)
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // OneSignal
  useEffect(() => {
    const runOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "5d8db7f8-b110-42af-a94d-96655cccd6ff", 
          allowLocalhostAsSecureOrigin: true, 
        });
        OneSignal.Slidedown.promptPush(); 
      } catch (error) {
        console.error("Erro ao carregar o OneSignal:", error);
      }
    };
    runOneSignal();
  }, []);

  const protectedPage = (page) => <PinGate>{page}</PinGate>;
  const protectedDieta = (
    <ErrorBoundary>
      {protectedPage(<Dieta />)}
    </ErrorBoundary>
  );

  return (
    <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-slate-900 dark:to-slate-950 min-h-screen text-slate-700 dark:text-slate-200 antialiased overflow-x-hidden font-sans relative transition-colors duration-300">
      <HeartRain />
      <Router>
        {/* Passando o tema e a função para a Navbar */}
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/central" element={protectedPage(<Central />)} />
            <Route path="/contagem" element={protectedPage(<Contagem />)} />
            <Route path="/assistente" element={protectedPage(<AssistenteCasal />)} />
            <Route path="/genealogia" element={protectedPage(<Genealogia />)} />
            <Route path="/galeria" element={protectedPage(<Galeria />)} /> 
            <Route path="/retrospectiva" element={protectedPage(<Retrospectiva />)} />
            <Route path="/satisfacao" element={protectedPage(<Satisfacao />)} />
            <Route path="/humor" element={protectedPage(<Humor />)} />
            <Route path="/mural" element={protectedPage(<Mural />)} />
            <Route path="/capsula" element={protectedPage(<CapsulaTempo />)} />
            <Route path="/cupons" element={protectedPage(<Cupons />)} />
            <Route path="/bucketlist" element={protectedPage(<BucketList />)} />
            <Route path="/potepapel" element={protectedPage(<PotePapel />)} />
            <Route path="/links" element={protectedPage(<Links />)} />
            <Route path="/linha-do-tempo" element={protectedPage(<LinhaDoTempo />)} />
            <Route path="/quiz" element={protectedPage(<QuizCasal />)} />
            <Route path="/surpresa-diaria" element={protectedPage(<SurpresaDiaria />)} />
            <Route path="/dieta" element={protectedDieta} />
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
