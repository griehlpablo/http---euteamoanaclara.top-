import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeartRain from './components/HeartRain';
import Home from './pages/Home';
import Central from './pages/Central';
import Contagem from './pages/Contagem';
import AssistenteCasal from './pages/AssistenteCasal';
import Genealogia from './pages/Genealogia';
import Galeria from './pages/Galeria'; // 1. Importando a nova página de Galeria

export default function App() {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-rose-100 min-h-screen text-slate-700 antialiased overflow-x-hidden font-sans relative">
      <HeartRain />
      <Router>
        <Navbar />
        <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/central" element={<Central />} />
            <Route path="/contagem" element={<Contagem />} />
            <Route path="/assistente" element={<AssistenteCasal />} />
            <Route path="/genealogia" element={<Genealogia />} />
            {/* 2. Rota da Galeria adicionada para resolver o erro de navegação */}
            <Route path="/galeria" element={<Galeria />} /> 
          </Routes>
        </main>
      </Router>
    </div>
  );
}