import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Heart, Flame, Battery, ShieldAlert, CheckCircle2, BellRing, Smartphone, Zap } from 'lucide-react';
import { ref, onValue, set } from 'firebase/database';
import { rtdb } from '../firebase';
import OneSignal from 'react-onesignal';

export default function Humor() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('satCurrentUser') || null);
  const defaultMood = { carencia: 3, estresse: 1, energia: 3 };
  const [myMood, setMyMood] = useState(defaultMood);
  const [partnerMood, setPartnerMood] = useState(defaultMood);
  const [partnerHasData, setPartnerHasData] = useState(false);

  const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';
  const myName = currentUser === 'pablo' ? 'Pablo' : 'Ana Clara';
  const targetName = currentUser === 'pablo' ? 'Ana Clara' : 'Pablo';

  useEffect(() => {
    if (currentUser) localStorage.setItem('satCurrentUser', currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const myRef = ref(rtdb, `radar/${currentUser}`);
    onValue(myRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setMyMood(data);
    });

    const partnerRef = ref(rtdb, `radar/${targetUser}`);
    onValue(partnerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) { setPartnerMood(data); setPartnerHasData(true); } 
      else { setPartnerHasData(false); }
    });
  }, [currentUser, targetUser]);

  const handleMoodChange = (eixo, valor) => {
    const newMood = { ...myMood, [eixo]: Number(valor) };
    setMyMood(newMood);
    set(ref(rtdb, `radar/${currentUser}`), newMood);
  };

  // ATIVAÇÃO NATIVA
  const ativarNotificacoesNativas = async () => {
    if (OneSignal) {
      try {
        await OneSignal.Notifications.requestPermission();
        alert("Se o pop-up apareceu, agora clique em 'Confirmar Vínculo'!");
      } catch (e) { console.error(e); }
    }
  };

  const confirmarVinculoCelular = () => {
    if (!currentUser) return alert("Selecione quem você é!");
    if (OneSignal.User) {
      OneSignal.User.addTag('usuario', currentUser);
      alert(`✅ Vínculo confirmado para ${myName}!`);
    }
  };

  // FUNÇÃO DE NOTIFICAÇÃO (MANTIDA PARA O BOTÃO E PARA O AUTO)
  const dispararNotificacaoRadar = async () => {
    const APP_ID = "5d8db7f8-b110-42af-a94d-96655cccd6ff"; 
    const REST_API_KEY = "os_v2_app_lwg3p6frcbbk7kknszsvztgw75j7gz65b2revye5nxv4rpknt7dwlwguahwat2arasb4ug2wnflzlxmdfiugzywmnqckyyyz2j7th5q"; 
    
    const body = {
      app_id: APP_ID,
      filters: [{ field: "tag", key: "usuario", relation: "=", value: targetUser }],
      headings: { en: "Radar de Humor Atualizado 📡", pt: "Radar de Humor Atualizado 📡" },
      contents: { 
        en: `${myName} atualizou o humor agora. Confira o manual!`, 
        pt: `${myName} atualizou o humor agora. Confira o manual!` 
      }
    };

    try {
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Basic ${REST_API_KEY}` },
        body: JSON.stringify(body)
      });
    } catch (error) { console.error(error); }
  };

  const gerarManual = () => {
    const { carencia, estresse, energia } = partnerMood;
    const nome = targetName;
    const isAna = targetUser === 'ana';
    if (estresse >= 4 && carencia <= 2) return { titulo: "ALERTA VERMELHO 🚨", texto: `${nome} está nível abominável. Cuidado!`, cor: "bg-red-100 text-red-700 border-red-500", icone: ShieldAlert };
    if (estresse >= 4 && carencia >= 4) return { titulo: "BOMBA-RELÓGIO 💣❤️", texto: `${nome} quer grude mas está estressado(a).`, cor: "bg-orange-100 text-orange-700 border-orange-500", icone: Flame };
    if (estresse <= 2 && carencia >= 4) return { titulo: "ANJINHO ✨", texto: `${nome} está um amorzinho! Aproveite.`, cor: "bg-rose-100 text-rose-700 border-rose-400", icone: Heart };
    if (estresse <= 2 && energia <= 2) return { titulo: "PREGUIÇA 💤", texto: `${nome} está sem bateria. Carinho leve!`, cor: "bg-blue-100 text-blue-700 border-blue-400", icone: Battery };
    if (estresse === 3 && carencia === 3) return { titulo: "ESTÁVEL ⚖️", texto: `${nome} está na paz. Tudo normal.`, cor: "bg-emerald-100 text-emerald-700 border-emerald-400", icone: CheckCircle2 };
    return { titulo: "MISTURA 🌪️", texto: `Sinta o clima antes de falar besteira!`, cor: "bg-purple-100 text-purple-700 border-purple-400", icone: Activity };
  };

  const manual = gerarManual();
  const IconeManual = manual.icone;

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20 relative z-50">
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 pt-4">
        <Link to="/central" className="p-2 bg-white rounded-full shadow-sm text-slate-500 hover:scale-110 transition-transform cursor-pointer"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2">Radar de Humor <Activity className="text-rose-500" /></h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Configuração do Celular</p>
          <div className="flex gap-4 w-full max-w-sm bg-slate-100 p-1.5 rounded-2xl relative z-50 mb-3">
            <button onClick={() => setCurrentUser('pablo')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all cursor-pointer ${currentUser === 'pablo' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>Pablo</button>
            <button onClick={() => setCurrentUser('ana')} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all cursor-pointer ${currentUser === 'ana' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}>Ana</button>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={ativarNotificacoesNativas} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full cursor-pointer"><Zap size={14} /> Ativar iPhone</button>
            <button onClick={confirmarVinculoCelular} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-full cursor-pointer"><Smartphone size={14} /> Confirmar Vínculo</button>
          </div>
        </div>

        {currentUser && (
          <>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Como VOCÊ está hoje, {myName}?</h2>
              
              <div className="space-y-8 relative z-50">
                {/* Sliders com disparo automático no MouseUp e TouchEnd */}
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3"><span className="text-slate-400">Frio/Distante</span><span className="text-rose-500">Grude Total</span></div>
                  <input 
                    type="range" min="1" max="5" step="1" value={myMood.carencia} 
                    onChange={(e) => handleMoodChange('carencia', e.target.value)}
                    onMouseUp={dispararNotificacaoRadar}
                    onTouchEnd={dispararNotificacaoRadar}
                    className="w-full accent-rose-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3"><span className="text-slate-400">Paz de Buda</span><span className="text-orange-500">Fúria/Estresse</span></div>
                  <input 
                    type="range" min="1" max="5" step="1" value={myMood.estresse} 
                    onChange={(e) => handleMoodChange('estresse', e.target.value)}
                    onMouseUp={dispararNotificacaoRadar}
                    onTouchEnd={dispararNotificacaoRadar}
                    className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-3"><span className="text-slate-400">Só quero Cama</span><span className="text-blue-500">Bora Sair</span></div>
                  <input 
                    type="range" min="1" max="5" step="1" value={myMood.energia} 
                    onChange={(e) => handleMoodChange('energia', e.target.value)}
                    onMouseUp={dispararNotificacaoRadar}
                    onTouchEnd={dispararNotificacaoRadar}
                    className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              </div>
              
              {/* Mantido botão manual como backup */}
              <button onClick={dispararNotificacaoRadar} className="w-full mt-8 py-4 bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                <BellRing size={20} /> Forçar Envio do Humor
              </button>
            </div>

            <div className="bg-slate-800 p-1 rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-6">
              <div className="bg-white p-6 rounded-[22px]">
                <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">Manual de Sobrevivência</h2>
                {partnerHasData ? (
                  <div className={`p-6 rounded-2xl border-l-4 ${manual.cor}`}>
                    <div className="flex items-center gap-3 mb-3"><IconeManual size={28} /><h3 className="font-black text-lg">{manual.titulo}</h3></div>
                    <p className="font-medium opacity-90">{manual.texto}</p>
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200"><p className="text-slate-500">{targetName} ainda não atualizou.</p></div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}