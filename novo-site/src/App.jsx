import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
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
import AssistenteCasal from './pages/AssistenteCasal'; // Importando o Cupido

export default function App() {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-rose-100 min-h-screen text-slate-700 antialiased overflow-x-hidden font-sans">
      <Router>
        <Navbar />
        <main className="pt-28 pb-12 px-4 max-w-5xl mx-auto">
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
            
            {/* Páginas Pendentes */}
            <Route path="/agenda" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Nosso Calendário em construção... 📅</div>} />
            <Route path="/videos" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Vídeos em construção... 🎥</div>} />
            <Route path="/musica" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Nossa Música em construção... 🎵</div>} />
            <Route path="/sonhos" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Lista de Sonhos em construção... ✨</div>} />
            <Route path="/pote" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Pote do Amor em construção... 🎁</div>} />
            <Route path="/quiz" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Quiz do Casal em construção... ❓</div>} />
            <Route path="/notif" element={<div className="text-center mt-20 font-serif text-2xl text-slate-700">Notificações em construção... 🔔</div>} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}