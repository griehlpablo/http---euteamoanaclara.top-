import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import OneSignal from 'react-onesignal';

import Navbar from './components/Navbar';
import HeartRain from './components/HeartRain';
import Home from './pages/Home';
import Central from './pages/Central';
import Contagem from './pages/Contagem';
import AssistenteCasal from './pages/AssistenteCasal';
import Genealogia from './pages/Genealogia';
import Galeria from './pages/Galeria'; 
import Retrospectiva from './pages/Retrospectiva'; 
import Satisfacao from './pages/Satisfacao';
import Humor from './pages/Humor';
import Mural from './pages/Mural'; // ⬅️ IMPORTAÇÃO DO MURAL ADICIONADA AQUI!

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // INICIALIZAÇÃO DO ONESIGNAL
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

  return (
    <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-slate-900 dark:to-slate-800 min-h-screen text-slate-700 dark:text-slate-300 antialiased overflow-x-hidden font-sans relative">
      <HeartRain />
      <Router>
        <Navbar theme={theme} setTheme={setTheme} />
          <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/central" element={<Central />} />
              <Route path="/contagem" element={<Contagem />} />
              <Route path="/assistente" element={<AssistenteCasal />} />
              <Route path="/genealogia" element={<Genealogia />} />
              <Route path="/galeria" element={<Galeria />} /> 
              <Route path="/retrospectiva" element={<Retrospectiva />} />
              <Route path="/satisfacao" element={<Satisfacao />} />
              <Route path="/humor" element={<Humor />} />
              <Route path="/mural" element={<Mural />} /> {/* ⬅️ ROTA DO MURAL ADICIONADA AQUI! */}
            </Routes>
          </main>
        </Router>
      </div>
    );
  }