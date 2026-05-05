import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Heart, Flame, Battery, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { ref, onValue, set } from 'firebase/database';
import { rtdb } from '../firebase';

export default function Humor() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('satCurrentUser') || null);
  
  // Nossos eixos de humor (1 a 5)
  const defaultMood = { carencia: 3, estresse: 1, energia: 3 };
  
  const [myMood, setMyMood] = useState(defaultMood);
  const [partnerMood, setPartnerMood] = useState(defaultMood);
  const [partnerHasData, setPartnerHasData] = useState(false);

  // Define quem é o alvo
  const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';
  const myName = currentUser === 'pablo' ? 'Pablo' : 'Ana Clara';
  const targetName = currentUser === 'pablo' ? 'Ana Clara' : 'Pablo';

  // Sincroniza quem está logado no localStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('satCurrentUser', currentUser);
  }, [currentUser]);

  // Busca os dados do Firebase (Meu humor e o do parceiro)
  useEffect(() => {
    if (!currentUser) return;

    // Busca o MEU humor para deixar os sliders onde eu parei
    const myRef = ref(rtdb, `radar/${currentUser}`);
    onValue(myRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setMyMood(data);
    });

    // Busca o humor do PARCEIRO para gerar o manual
    const partnerRef = ref(rtdb, `radar/${targetUser}`);
    onValue(partnerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPartnerMood(data);
        setPartnerHasData(true);
      } else {
        setPartnerHasData(false);
      }
    });
  }, [currentUser, targetUser]);

  // Salva meu humor no Firebase ao deslizar a barra
  const handleMoodChange = (eixo, valor) => {
    const newMood = { ...myMood, [eixo]: Number(valor) };
    setMyMood(newMood);
    set(ref(rtdb, `radar/${currentUser}`), newMood);
  };

  // ==========================================
  // O ALGORITMO DO MANUAL DE SOBREVIVÊNCIA
  // ==========================================
  const gerarManual = () => {
    const { carencia, estresse, energia } = partnerMood;
    const nome = targetName;
    const isAna = targetUser === 'ana'; // Variações de gênero nos pronomes

    // ALERTA VERMELHO: Muito Estresse, Nenhuma Carência
    if (estresse >= 4 && carencia <= 2) {
      return {
        titulo: "ALERTA VERMELHO 🚨",
        texto: `${nome} está nível abominável hoje. Não chegue perto, não faça perguntas difíceis e respire baixo. Jogue um chocolate de longe se não quiser ser decapitado(a)!`,
        cor: "bg-red-100 text-red-700 border-red-500",
        icone: ShieldAlert
      };
    }
    
    // PERIGO CARENTE: Muito Estresse, Muita Carência
    if (estresse >= 4 && carencia >= 4) {
      return {
        titulo: "BOMBA-RELÓGIO AMOROSA 💣❤️",
        texto: `${nome} está uma pilha de nervos com o mundo, mas quer ficar grudado(a). Tome MUITO cuidado com as palavras, mas ofereça colo e carinho. Um carinho na cabeça desativa a bomba.`,
        cor: "bg-orange-100 text-orange-700 border-orange-500",
        icone: Flame
      };
    }

    // GOLDEN RETRIEVER: Muito Carente, Zero Estresse
    if (estresse <= 2 && carencia >= 4) {
      return {
        titulo: "ANJINHO NA TERRA ✨",
        texto: `${nome} está um docinho! Feliz, animado(a) e absurdamente amoroso(a). Vá lá falar com ${isAna ? 'ela' : 'ele'} agora e você será recompensado(a) com muitos beijinhos!`,
        cor: "bg-rose-100 text-rose-700 border-rose-400",
        icone: Heart
      };
    }

    // MODO HIBERNAÇÃO: Zero Energia, Zero Estresse
    if (estresse <= 2 && energia <= 2) {
      return {
        titulo: "MODO PREGUIÇA ATIVADO snooze",
        texto: `${nome} está na paz absoluta, mas sem bateria nenhuma. Apenas deitem juntos, façam um carinho leve e coloquem uma série rolando no fundo.`,
        cor: "bg-blue-100 text-blue-700 border-blue-400",
        icone: Battery
      };
    }

    // MODO NEUTRO / EQUILIBRADO
    if (estresse === 3 && carencia === 3) {
      return {
        titulo: "CLIMA ESTÁVEL ⚖️",
        texto: `${nome} está na média hoje. Dá pra brincar, conversar normal e fazer planos. Tudo correndo como deve ser!`,
        cor: "bg-emerald-100 text-emerald-700 border-emerald-400",
        icone: CheckCircle2
      };
    }

    // FALLBACK: Sentimentos mistos
    return {
      titulo: "MISTURA DE EMOÇÕES 🌪️",
      texto: `${nome} está com uma combinação peculiar hoje. Use sua intuição de mozão: leia o ambiente, vá com calma e sinta o clima antes de falar besteira.`,
      cor: "bg-purple-100 text-purple-700 border-purple-400",
      icone: Activity
    };
  };

  const manual = gerarManual();
  const IconeManual = manual.icone;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      
      {/* HEADER */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:scale-110 transition-transform">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
          Radar de Humor <Activity className="text-rose-500" />
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* QUEM É VOCÊ? */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quem está usando agora?</p>
          <div className="flex gap-4 w-full max-w-sm bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setCurrentUser('pablo')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${currentUser === 'pablo' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Pablo
            </button>
            <button 
              onClick={() => setCurrentUser('ana')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${currentUser === 'ana' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Ana
            </button>
          </div>
        </div>

        {currentUser && (
          <>
            {/* PAINEL 1: O SEU PRÓPRIO HUMOR */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Como VOCÊ está hoje, {myName}?</h2>
              
              <div className="space-y-8">
                {/* Eixo Carência */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="text-slate-400 flex items-center gap-1"><Heart size={16}/> Frio/Distante</span>
                    <span className="text-rose-500 flex items-center gap-1">Grude Total <Heart size={16}/></span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={myMood.carencia} 
                    onChange={(e) => handleMoodChange('carencia', e.target.value)}
                    className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-2 text-xs font-bold text-slate-400">Nível: {myMood.carencia}/5</div>
                </div>

                {/* Eixo Estresse */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="text-slate-400 flex items-center gap-1"><ShieldAlert size={16}/> Paz de Buda</span>
                    <span className="text-orange-500 flex items-center gap-1">Fúria/Estresse <Flame size={16}/></span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={myMood.estresse} 
                    onChange={(e) => handleMoodChange('estresse', e.target.value)}
                    className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-2 text-xs font-bold text-slate-400">Nível: {myMood.estresse}/5</div>
                </div>

                {/* Eixo Energia */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="text-slate-400 flex items-center gap-1"><Battery size={16}/> Só quero Cama</span>
                    <span className="text-blue-500 flex items-center gap-1">Bora Sair <Activity size={16}/></span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" 
                    value={myMood.energia} 
                    onChange={(e) => handleMoodChange('energia', e.target.value)}
                    className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-center mt-2 text-xs font-bold text-slate-400">Nível: {myMood.energia}/5</div>
                </div>
              </div>
            </div>

            {/* PAINEL 2: MANUAL DE SOBREVIVÊNCIA DO PARCEIRO */}
            <div className="bg-slate-800 p-1 rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-6">
              <div className="bg-white p-6 rounded-[22px]">
                <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Manual de Sobrevivência</h2>
                <p className="text-center text-sm text-slate-500 mb-6">Como lidar com {targetName} hoje:</p>

                {partnerHasData ? (
                  <div className={`p-6 rounded-2xl border-l-4 ${manual.cor}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <IconeManual size={28} />
                      <h3 className="font-black text-lg">{manual.titulo}</h3>
                    </div>
                    <p className="font-medium leading-relaxed opacity-90">{manual.texto}</p>
                    
                    {/* Barrinhas menores mostrando como estão os níveis do parceiro */}
                    <div className="mt-6 pt-4 border-t border-current/20 flex gap-4 justify-around opacity-80">
                      <div className="text-center"><div className="text-[10px] uppercase font-bold mb-1">Carência</div><div className="text-lg font-black">{partnerMood.carencia}/5</div></div>
                      <div className="text-center"><div className="text-[10px] uppercase font-bold mb-1">Estresse</div><div className="text-lg font-black">{partnerMood.estresse}/5</div></div>
                      <div className="text-center"><div className="text-[10px] uppercase font-bold mb-1">Energia</div><div className="text-lg font-black">{partnerMood.energia}/5</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Activity size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">{targetName} ainda não atualizou o humor de hoje. Vá com cuidado!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}