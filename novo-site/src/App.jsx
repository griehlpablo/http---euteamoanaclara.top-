import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeartRain from './components/HeartRain';

// Importação das Páginas (Certifique-se de que os arquivos existem em src/pages/)
import Home from './pages/Home';
import Central from './pages/Central';
import Contagem from './pages/Contagem';
import Carta from './pages/Carta';
import Galeria from './pages/Galeria';
import Mensagens from './pages/Mensagens';
import Retrospectiva from './pages/Retrospectiva';
import Painel from './pages/Painel';
import Mural from './pages/Mural';
import Genealogia from './pages/Genealogia';
import Humor from './pages/Humor';
import Links from './pages/Links';
import AssistenteCasal from './pages/AssistenteCasal';

export default function App() {
  return (
    // O container principal define o gradiente de fundo e a fonte
    <div className="bg-gradient-to-br from-rose-50 to-rose-100 min-h-screen text-slate-700 antialiased overflow-x-hidden font-sans relative">
      {/* A Chuva de Corações fica aqui para aparecer em todas as telas */}
      <HeartRain />
      
      <Router>
        <Navbar />
        {/* Padding-top (pt-24) garante que o conteúdo não fique escondido sob a Navbar fixa */}
        <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/central" element={<Central />} />
            <Route path="/contagem" element={<Contagem />} />
            <Route path="/carta" element={<Carta />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/mensagens" element={<Mensagens />} />
            <Route path="/retrospectiva" element={<Retrospectiva />} />
            <Route path="/painel" element={<Painel />} />
            <Route path="/mural" element={<Mural />} />
            <Route path="/genealogia" element={<Genealogia />} />
            <Route path="/humor" element={<Humor />} />
            <Route path="/links" element={<Links />} />
            <Route path="/assistente" element={<AssistenteCasal />} />
            
            {/* Fallback para rotas não encontradas */}
            <Route path="*" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Página em construção... 🚧</div>} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}