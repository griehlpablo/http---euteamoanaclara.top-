import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Coffee, Snowflake, Lock, TrendingUp, User, PenSquare, Smartphone, Zap, BellRing } from 'lucide-react';
import { ref, onValue, set, push } from 'firebase/database';
import { rtdb } from '../firebase';
import OneSignal from 'react-onesignal';

const LEVELS = {
  perfect: { id: 'perfect', label: 'Amorzinho Perfeito', icon: Heart, color: 'bg-rose-500', text: 'text-rose-500', val: 5 },
  good: { id: 'good', label: 'Muito Bonzinho(a)', icon: Star, color: 'bg-amber-400', text: 'text-amber-500', val: 4 },
  chill: { id: 'chill', label: 'De Boa / Chill', icon: Coffee, color: 'bg-blue-400', text: 'text-blue-500', val: 3 },
  ice: { id: 'ice', label: 'Em Gelo Fino', icon: Snowflake, color: 'bg-cyan-400', text: 'text-cyan-500', val: 2 },
  jail: { id: 'jail', label: 'Cadeia (Aiai)', icon: Lock, color: 'bg-slate-800', text: 'text-slate-700', val: 1 }
};

export default function Satisfacao() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('satCurrentUser') || null);
  const [currentLevels, setCurrentLevels] = useState({ pablo: 'perfect', ana: 'perfect' });
  const [history, setHistory] = useState([]);
  const [chartTab, setChartTab] = useState('ana'); 
  const [jailNote, setJailNote] = useState({ pablo: '', ana: '' });
  const [jailInput, setJailInput] = useState('');

  useEffect(() => {
    if (currentUser) localStorage.setItem('satCurrentUser', currentUser);
  }, [currentUser]);

  useEffect(() => {
    const currentRef = ref(rtdb, 'satisfaction/pablo-ana/current');
    onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.levels) setCurrentLevels(data.levels);
        if (data.notes) setJailNote(data.notes);
      }
    });

    const historyRef = ref(rtdb, 'satisfaction/pablo-ana/history');
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setHistory(historyArray);
      }
    });
  }, []);

  const ativarNotificacoesNativas = async () => {
    if (OneSignal) { await OneSignal.Notifications.requestPermission(); alert("Pop-up solicitado!"); }
  };

  const confirmarVinculoCelular = () => {
    if (OneSignal.User) { OneSignal.User.addTag('usuario', currentUser); alert("Vínculo solicitado!"); }
  };

  // FUNÇÃO DE NOTIFICAÇÃO
  const enviarNotificacaoProAmor = async (nivelLabel, mensagemExtra = "") => {
    const APP_ID = "5d8db7f8-b110-42af-a94d-96655cccd6ff"; 
    const REST_API_KEY = "os_v2_app_lwg3p6frcbbk7kknszsvztgw75j7gz65b2revye5nxv4rpknt7dwlwguahwat2arasb4ug2wnflzlxmdfiugzywmnqckyyyz2j7th5q"; 
    const alvo = currentUser === 'pablo' ? 'ana' : 'pablo';
    const meuNome = currentUser === 'pablo' ? 'Pablo' : 'Ana Clara';
    const msg = mensagemExtra || `${meuNome} atualizou a satisfação: ${nivelLabel}`;

    const body = {
      app_id: APP_ID,
      filters: [{ field: "tag", key: "usuario", relation: "=", value: alvo }],
      headings: { en: "Termômetro do Amor 🌡️", pt: "Termômetro do Amor 🌡️" },
      contents: { en: msg, pt: msg }
    };

    try {
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Basic ${REST_API_KEY}` },
        body: JSON.stringify(body)
      });
    } catch (error) { console.error(error); }
  };

  // VOTAÇÃO AUTOMÁTICA DISPARA NOTIFICAÇÃO
  const handleVote = (levelKey) => {
    if (!currentUser) return;
    const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';
    set(ref(rtdb, `satisfaction/pablo-ana/current/levels/${targetUser}`), levelKey);
    const newEntry = { target: targetUser, level: levelKey, val: LEVELS[levelKey].val, timestamp: Date.now() };
    push(ref(rtdb, 'satisfaction/pablo-ana/history'), newEntry);
    
    // Dispara sozinho no clique!
    enviarNotificacaoProAmor(LEVELS[levelKey].label);
  };

  const saveJailNote = () => {
    if (!jailInput.trim()) return;
    const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';
    set(ref(rtdb, `satisfaction/pablo-ana/current/notes/${targetUser}`), jailInput);
    enviarNotificacaoProAmor("Cadeia", `🚨 Missão da Cadeia: "${jailInput}"`);
    setJailInput('');
  };

  const renderChart = () => {
    const targetHistory = history.filter(h => h.target === chartTab).slice(-15); 
    if (targetHistory.length < 2) return <div className="h-48 flex items-center justify-center text-slate-400">Faltam votos.</div>;
    const height = 120; const maxVal = 5; const minVal = 1;
    const points = targetHistory.map((entry, index) => `${(index / (targetHistory.length - 1)) * 100},${height - (((entry.val - minVal) / (maxVal - minVal)) * height)}`).join(' ');

    return (
      <div className="relative h-[160px] w-full pt-4">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <polyline points={points} fill="none" stroke={chartTab === 'pablo' ? '#3b82f6' : '#f43f5e'} strokeWidth="4" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    );
  };

  const targetName = currentUser === 'pablo' ? 'Ana Clara' : 'Pablo';

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 relative z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:scale-110 transition-transform cursor-pointer"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">Termômetro do Amor <TrendingUp className="text-rose-500" /></h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Configuração</p>
          <div className="flex gap-4 w-full max-w-sm bg-slate-100 p-1.5 rounded-2xl relative z-50 mb-3">
            <button onClick={() => setCurrentUser('pablo')} className={`flex-1 py-3 px-4 rounded-xl font-bold cursor-pointer ${currentUser === 'pablo' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>Pablo</button>
            <button onClick={() => setCurrentUser('ana')} className={`flex-1 py-3 px-4 rounded-xl font-bold cursor-pointer ${currentUser === 'ana' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>Ana</button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={ativarNotificacoesNativas} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full cursor-pointer"><Zap size={14} /> Ativar iPhone</button>
            <button onClick={confirmarVinculoCelular} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-full cursor-pointer"><Smartphone size={14} /> Confirmar Vínculo</button>
          </div>
        </div>

        {currentUser && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-6"><h2 className="text-xl font-bold text-slate-800">Como está {targetName}?</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-50">
              {Object.values(LEVELS).map((level) => {
                const Icon = level.icon;
                const isSelected = currentLevels[currentUser === 'pablo' ? 'ana' : 'pablo'] === level.id;
                return (
                  <button key={level.id} onClick={() => handleVote(level.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer ${isSelected ? `${level.color} border-transparent text-white shadow-lg` : 'border-slate-100 bg-white text-slate-500'}`}>
                    <Icon size={28} className="mb-2" />
                    <span className="text-xs font-bold text-center leading-tight">{level.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Backup Manual */}
            <button onClick={() => enviarNotificacaoProAmor("Manual", "Aviso forçado pelo parceiro(a)")} className="w-full mt-8 py-3 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
              <BellRing size={16} /> Forçar Aviso de Satisfação
            </button>
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative z-50">
          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Histórico</h2>
          {renderChart()}
        </div>
      </div>
    </div>
  );
}