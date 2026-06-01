import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Activity, Heart, Flame, Battery, 
  ShieldAlert, CheckCircle2, BellRing, Smartphone, Zap 
} from 'lucide-react';
import { supabase } from '../supabase';
import OneSignal from 'react-onesignal';
import { sendPartnerNotification } from '../services/notifications';

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

  // Busca os dados do Supabase
  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;
    (async () => {
      // Busca MEU humor
      const { data: myData, error: myError } = await supabase
        .from('humor')
        .select('*')
        .eq('user_id', currentUser)
        .single();
      
      if (myError && myError.code !== 'PGRST116') {
        console.error('Erro ao buscar meu humor:', myError);
      } else if (myData && mounted) {
        setMyMood({ carencia: myData.carencia, estresse: myData.estresse, energia: myData.energia });
      }

      // Busca humor do PARCEIRO
      const { data: partnerData, error: partnerError } = await supabase
        .from('humor')
        .select('*')
        .eq('user_id', targetUser)
        .single();
      
      if (partnerError && partnerError.code !== 'PGRST116') {
        console.error('Erro ao buscar humor do parceiro:', partnerError);
      } else if (partnerData && mounted) {
        setPartnerMood({ carencia: partnerData.carencia, estresse: partnerData.estresse, energia: partnerData.energia });
        setPartnerHasData(true);
      } else if (mounted) {
        setPartnerHasData(false);
      }
    })();

    return () => { mounted = false; };
  }, [currentUser, targetUser]);

  // ==========================================
  // O ALGORITMO DO MANUAL DE SOBREVIVÊNCIA
  // ==========================================
  const calcularManual = (mood, nome, ehMulher) => {
    const { carencia, estresse, energia } = mood;
    const pronome = ehMulher ? 'ela' : 'ele';

    // ALERTA VERMELHO
    if (estresse >= 4 && carencia <= 2) {
      return {
        titulo: "ALERTA VERMELHO 🚨",
        resumo: `${nome} está em nível abominável! Melhor manter distância agora.`,
        texto: `${nome} está nível abominável hoje. Não chegue perto, não faça perguntas difíceis e respire baixo. Jogue um chocolate de longe se não quiser ser decapitado(a)!`,
        cor: "bg-red-100 text-red-700 border-red-500",
        icone: ShieldAlert
      };
    }
    
    // BOMBA-RELÓGIO
    if (estresse >= 4 && carencia >= 4) {
      return {
        titulo: "BOMBA-RELÓGIO 💣❤️",
        resumo: `${nome} está estressado(a), mas quer muito o seu carinho.`,
        texto: `${nome} está uma pilha de nervos com o mundo, mas quer ficar grudado(a). Tome MUITO cuidado com as palavras, mas ofereça colo e carinho. Um carinho na cabeça desativa a bomba.`,
        cor: "bg-orange-100 text-orange-700 border-orange-500",
        icone: Flame
      };
    }

    // ANJINHO
    if (estresse <= 2 && carencia >= 4) {
      return {
        titulo: "ANJINHO NA TERRA ✨",
        resumo: `${nome} está um docinho! Aproveite para dar muito amor.`,
        texto: `${nome} está um docinho! Feliz, animado(a) e absurdamente amoroso(a). Vá lá falar com ${pronome} agora e você será recompensado(a) com muitos beijinhos!`,
        cor: "bg-rose-100 text-rose-700 border-rose-400",
        icone: Heart
      };
    }

    // MODO PREGUIÇA
    if (estresse <= 2 && energia <= 2) {
      return {
        titulo: "MODO PREGUIÇA ATIVADO 💤",
        resumo: `${nome} está sem bateria. Hora de deitar e relaxar.`,
        texto: `${nome} está na paz absoluta, mas sem bateria nenhuma. Apenas deitem juntos, façam um carinho leve e coloquem uma série rolando no fundo.`,
        cor: "bg-blue-100 text-blue-700 border-blue-400",
        icone: Battery
      };
    }

    // CLIMA ESTÁVEL
    if (estresse === 3 && carencia === 3) {
      return {
        titulo: "CLIMA ESTÁVEL ⚖️",
        resumo: `${nome} está na média. Dia perfeito para planos normais.`,
        texto: `${nome} está na média hoje. Dá pra brincar, conversar normal e fazer planos. Tudo correndo como deve ser!`,
        cor: "bg-emerald-100 text-emerald-700 border-emerald-400",
        icone: CheckCircle2
      };
    }

    // MISTURA
    return {
      titulo: "MISTURA DE EMOÇÕES 🌪️",
      resumo: "O clima está misto. Use sua intuição de mozão!",
      texto: `${nome} está com uma combinação peculiar hoje. Use sua intuição de mozão: leia o ambiente, vá com calma e sinta o clima antes de falar besteira.`,
      cor: "bg-purple-100 text-purple-700 border-purple-400",
      icone: Activity
    };
  };

  const handleMoodChange = async (eixo, valor) => {
    const newMood = { ...myMood, [eixo]: Number(valor) };
    setMyMood(newMood);
    
    try {
      const { error: upsertError } = await supabase
        .from('humor')
        .upsert(
          { user_id: currentUser, carencia: newMood.carencia, estresse: newMood.estresse, energia: newMood.energia, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (upsertError) console.error('Erro ao salvar humor:', upsertError);
    } catch (error) {
      console.error('Erro ao atualizar humor:', error);
    }
  };

  // FUNÇÃO DE NOTIFICAÇÃO (ENVIA RESUMIDO)
  const dispararNotificacaoRadar = async () => {
    // Pega as frases baseadas no MEU humor atual para avisar o outro
    const info = calcularManual(myMood, myName, currentUser === 'ana');

    await sendPartnerNotification({
      targetUser,
      title: info.titulo,
      message: info.resumo,
      data: {
        source: 'humor',
        author: currentUser
      }
    });
  };

  const manual = calcularManual(partnerMood, targetName, targetUser === 'ana');
  const IconeManual = manual.icone;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 relative z-50">
      
      {/* HEADER */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:scale-110 transition-transform cursor-pointer">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">
          Radar de Humor <Activity className="text-rose-500" />
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* CONFIGURAÇÃO DO CELULAR */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Configuração do Celular</p>
          
          <div className="flex gap-4 w-full max-w-sm bg-slate-100 p-1.5 rounded-2xl relative z-50 mb-4">
            <button 
              onClick={() => setCurrentUser('pablo')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all cursor-pointer ${currentUser === 'pablo' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Pablo
            </button>
            <button 
              onClick={() => setCurrentUser('ana')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all cursor-pointer ${currentUser === 'ana' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              Ana
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={async () => { if(OneSignal) await OneSignal.Notifications.requestPermission(); }} 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Zap size={14} /> Ativar iPhone
            </button>
            <button 
              onClick={() => { if(OneSignal.User) OneSignal.User.addTag('usuario', currentUser); alert("Vínculo OK!"); }} 
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-full hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Smartphone size={14} /> Confirmar Vínculo
            </button>
          </div>
        </div>

        {currentUser && (
          <>
            {/* PAINEL: O SEU HUMOR */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Como VOCÊ está hoje, {myName}?</h2>
              
              <div className="space-y-8 relative z-50">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="text-slate-400">Frio/Distante</span>
                    <span className="text-rose-500">Grude Total</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" value={myMood.carencia} 
                    onChange={(e) => handleMoodChange('carencia', e.target.value)}
                    onMouseUp={dispararNotificacaoRadar}
                    onTouchEnd={dispararNotificacaoRadar}
                    className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="text-slate-400">Paz de Buda</span>
                    <span className="text-orange-500">Fúria/Estresse</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" value={myMood.estresse} 
                    onChange={(e) => handleMoodChange('estresse', e.target.value)}
                    onMouseUp={dispararNotificacaoRadar}
                    onTouchEnd={dispararNotificacaoRadar}
                    className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-3">
                    <span className="text-slate-400">Só quero Cama</span>
                    <span className="text-blue-500">Bora Sair</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1" value={myMood.energia} 
                    onChange={(e) => handleMoodChange('energia', e.target.value)}
                    onMouseUp={dispararNotificacaoRadar}
                    onTouchEnd={dispararNotificacaoRadar}
                    className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={dispararNotificacaoRadar} 
                className="w-full mt-8 py-4 bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer relative z-50"
              >
                <BellRing size={20} /> Forçar Envio do Humor
              </button>
            </div>

            {/* PAINEL: MANUAL (SITE) */}
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
                    <p className="font-medium leading-relaxed opacity-90">
                      {manual.texto}
                    </p>
                    
                    <div className="mt-6 pt-4 border-t border-current/20 flex gap-4 justify-around opacity-80">
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold mb-1">Carência</div>
                        <div className="text-lg font-black">{partnerMood.carencia}/5</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold mb-1">Estresse</div>
                        <div className="text-lg font-black">{partnerMood.estresse}/5</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold mb-1">Energia</div>
                        <div className="text-lg font-black">{partnerMood.energia}/5</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Activity size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">{targetName} ainda não atualizou hoje.</p>
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
