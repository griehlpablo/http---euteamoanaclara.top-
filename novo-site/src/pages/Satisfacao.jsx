import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Coffee, Snowflake, Lock, TrendingUp, User, PenSquare } from 'lucide-react';
import { ref, onValue, set, push } from 'firebase/database';
import { rtdb } from '../firebase';
import OneSignal from 'react-onesignal';

// Dicionário de Níveis com Estilos Premium
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
  const [chartTab, setChartTab] = useState('ana'); // Qual gráfico estamos vendo
  const [jailNote, setJailNote] = useState({ pablo: '', ana: '' });
  const [jailInput, setJailInput] = useState('');

  // Sincroniza quem está logado no localStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('satCurrentUser', currentUser);
  }, [currentUser]);

  // Busca dados do Firebase
  useEffect(() => {
    // Escuta os níveis atuais e notas da cadeia
    const currentRef = ref(rtdb, 'satisfaction/pablo-ana/current');
    onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.levels) setCurrentLevels(data.levels);
        if (data.notes) setJailNote(data.notes);
      }
    });

    // Escuta o histórico para o gráfico
    const historyRef = ref(rtdb, 'satisfaction/pablo-ana/history');
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Converte o objeto do Firebase em um array ordenado por data
        const historyArray = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setHistory(historyArray);
      }
    });
  }, []);

  // ==========================================
  // FUNÇÃO MÁGICA DA NOTIFICAÇÃO DO ONESIGNAL
  // ==========================================
  const enviarNotificacaoProAmor = async (nivelLabel, mensagemExtra = "") => {
    const APP_ID = "5d8db7f8-b110-42af-a94d-96655cccd6ff"; 
    const REST_API_KEY = "os_v2_app_lwg3p6frcbbk7kknszsvztgw75j7gz65b2revye5nxv4rpknt7dwlwguahwat2arasb4ug2wnflzlxmdfiugzywmnqckyyyz2j7th5q"; 
    
    const alvo = currentUser === 'pablo' ? 'ana' : 'pablo';
    const meuNome = currentUser === 'pablo' ? 'Pablo' : 'Ana Clara';
    const msg = mensagemExtra || `${meuNome} atualizou o nível de satisfação para: ${nivelLabel}`;

    const body = {
      app_id: APP_ID,
      target_channel: "push",
      filters: [{ field: "tag", key: "usuario", relation: "=", value: alvo }],
      headings: { en: "Termômetro do Amor 🌡️", pt: "Termômetro do Amor 🌡️" },
      contents: { en: msg, pt: msg }
    };

    try {
      await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Basic ${REST_API_KEY}` },
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error("Erro ao enviar notificação", error);
    }
  };

  // Lógica de Votação
  const handleVote = (levelKey) => {
    if (!currentUser) {
      alert("Ei! Selecione primeiro lá em cima se você é o Pablo ou a Ana Clara!");
      return;
    }
    
    const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';

    // 1. Atualiza o status atual do alvo
    set(ref(rtdb, `satisfaction/pablo-ana/current/levels/${targetUser}`), levelKey);

    // 2. Registra no histórico para o gráfico
    const newEntry = {
      target: targetUser,
      level: levelKey,
      val: LEVELS[levelKey].val,
      timestamp: Date.now()
    };
    push(ref(rtdb, 'satisfaction/pablo-ana/history'), newEntry);

    // 3. Dispara a notificação após votar
    enviarNotificacaoProAmor(LEVELS[levelKey].label);
  };

  // Salvar a missão da cadeia
  const saveJailNote = () => {
    if (!jailInput.trim()) return;
    const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';
    set(ref(rtdb, `satisfaction/pablo-ana/current/notes/${targetUser}`), jailInput);
    
    // Dispara notificação de missão da cadeia
    const meuNome = currentUser === 'pablo' ? 'Pablo' : 'Ana Clara';
    enviarNotificacaoProAmor("Cadeia", `🚨 ${meuNome} te deu uma missão para sair da cadeia: "${jailInput}"`);
    setJailInput('');
  };

  // Lógica do Gráfico SVG Customizado
  const renderChart = () => {
    const targetHistory = history.filter(h => h.target === chartTab).slice(-15); // Pega os últimos 15 votos
    
    if (targetHistory.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p>Faltam votos para gerar o gráfico de {chartTab === 'pablo' ? 'Pablo' : 'Ana Clara'}.</p>
        </div>
      );
    }

    const width = 100; // Porcentagem
    const height = 120; // Altura fixa em px
    const maxVal = 5;
    const minVal = 1;

    // Converte os dados em coordenadas X e Y
    const points = targetHistory.map((entry, index) => {
      const x = (index / (targetHistory.length - 1)) * 100;
      const y = height - (((entry.val - minVal) / (maxVal - minVal)) * height);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative h-[160px] w-full pt-4">
        {/* Linhas de grade horizontais */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
          {[5,4,3,2,1].map(n => <div key={n} className="w-full h-px bg-slate-800"></div>)}
        </div>
        
        {/* O Gráfico SVG Desenhado na Mão */}
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke={chartTab === 'pablo' ? '#3b82f6' : '#f43f5e'} // Azul pro Pablo, Rosa pra Ana
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-md animate-in fade-in duration-1000"
            vectorEffect="non-scaling-stroke"
          />
          {/* Pontos no gráfico */}
          {targetHistory.map((entry, index) => {
            const x = `${(index / (targetHistory.length - 1)) * 100}%`;
            const y = height - (((entry.val - minVal) / (maxVal - minVal)) * height);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill="white"
                stroke={chartTab === 'pablo' ? '#3b82f6' : '#f43f5e'}
                strokeWidth="3"
                className="hover:r-6 transition-all duration-300"
              >
                <title>{LEVELS[entry.level].label}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    );
  };

  const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';
  const targetName = targetUser === 'pablo' ? 'Pablo' : 'Ana Clara';
  const currentTargetLevel = LEVELS[currentLevels[targetUser]] || LEVELS.perfect;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 relative z-50">
      
      {/* HEADER */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:scale-110 transition-transform cursor-pointer">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
          Termômetro do Amor <TrendingUp className="text-rose-500" />
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* QUEM É VOCÊ? */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quem está usando agora?</p>
          <div className="flex gap-4 w-full max-w-sm bg-slate-100 p-1.5 rounded-2xl relative z-50">
            <button 
              onClick={() => {
                setCurrentUser('pablo');
                if(OneSignal.User) OneSignal.User.addTag('usuario', 'pablo');
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentUser === 'pablo' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <User size={18}/> Pablo
            </button>
            <button 
              onClick={() => {
                setCurrentUser('ana');
                if(OneSignal.User) OneSignal.User.addTag('usuario', 'ana');
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${currentUser === 'ana' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <User size={18}/> Ana
            </button>
          </div>
        </div>

        {/* PAINEL DE VOTAÇÃO (Só aparece se alguém estiver logado) */}
        {currentUser && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Como está {targetUser === 'pablo' ? 'o' : 'a'} <span className={currentUser === 'ana' ? 'text-blue-500' : 'text-rose-500'}>{targetName}</span> hoje?
              </h2>
              <p className="text-slate-500 text-sm mt-1">Status atual: <strong className={currentTargetLevel.text}>{currentTargetLevel.label}</strong></p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-50">
              {Object.values(LEVELS).map((level) => {
                const Icon = level.icon;
                const isSelected = currentLevels[targetUser] === level.id;
                return (
                  <button
                    key={level.id}
                    onClick={() => handleVote(level.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${isSelected ? `${level.color} border-transparent text-white shadow-lg transform -translate-y-1` : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <Icon size={28} className="mb-2" />
                    <span className="text-xs font-bold text-center leading-tight">{level.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SE O ALVO ESTIVER NA CADEIA */}
            {currentLevels[targetUser] === 'jail' && (
              <div className="mt-6 p-5 bg-slate-800 rounded-2xl text-white animate-in zoom-in-95 relative z-50">
                <h3 className="font-bold flex items-center gap-2 mb-2"><Lock size={18} className="text-slate-400" /> Fiança da Cadeia</h3>
                
                {/* Se você botou o outro na cadeia, você escreve a missão */}
                <p className="text-sm text-slate-300 mb-3">O que {targetName} precisa fazer para ser perdoado(a)?</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={jailInput}
                    onChange={(e) => setJailInput(e.target.value)}
                    placeholder="Ex: Fazer massagem por 20 min..."
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-rose-500"
                  />
                  <button onClick={saveJailNote} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors cursor-pointer">
                    Salvar
                  </button>
                </div>

                {/* Exibe a missão atual salva no banco */}
                {jailNote[targetUser] && (
                  <div className="mt-4 p-3 bg-slate-700/50 rounded-xl border border-slate-600 flex items-start gap-3">
                    <PenSquare size={20} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm italic">"{jailNote[targetUser]}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ÁREA DO GRÁFICO HISTÓRICO */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative z-50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Histórico de Humor</h2>
            
            {/* Toggle do Gráfico */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setChartTab('pablo')}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${chartTab === 'pablo' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Pablo
              </button>
              <button 
                onClick={() => setChartTab('ana')}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${chartTab === 'ana' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Ana Clara
              </button>
            </div>
          </div>

          {/* Renderiza o SVG Customizado */}
          {renderChart()}
          
          <div className="mt-6 flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>Passado</span>
            <span>Hoje</span>
          </div>
        </div>

      </div>
    </div>
  );
}