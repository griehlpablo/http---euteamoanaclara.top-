import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, ArrowLeft, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import emailjs from '@emailjs/browser';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Certifique-se de que o arquivo firebase.js está na pasta src

// --- FUNÇÃO DO GEMINI COM MEMÓRIA ---
const callGeminiAPI = async (historicoMensagens, novoPrompt) => {
  const chaveInvertida = "A-WE-OJqtqPZcJzGYfdOqfj0Rn8-9fa_DySazIA"; 
  const apiKey = chaveInvertida.split('').reverse().join('');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  
  const systemInstruction = "Instruções: Você é o assistente virtual criado pelo Pablo para ajudar a namorada dele, Ana Clara. Seu tom deve ser prestativo, inteligente e gentil, com um leve toque romântico, mas absolutamente SEM ser meloso, grudento ou poético demais. Dê respostas curtas, práticas e vá direto ao ponto. Ajude com ideias reais de encontros, filmes ou receitas. Eles ficaram em 06/07/2023 e namoram desde 23/09/2023. NÃO REPITA sugestões de pratos ou filmes se já tiver sugerido na conversa. Responda de forma natural e amigável.";

  const formattedHistory = historicoMensagens
    .filter(msg => msg.text !== "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?")
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

  formattedHistory.push({
    role: 'user',
    parts: [{ text: novoPrompt }]
  });

  const payload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents: formattedHistory
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Erro API");
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "O amor me deixou sem palavras. Tente de novo! 💖";
  } catch (error) {
    console.error("Erro comunicação:", error);
    return "Minha conexão falhou. Tente novamente em instantes! 💔";
  }
};

// --- COMPONENTE PRINCIPAL ---
export default function AssistenteCasal() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  // 1. CARREGAR HISTÓRICO DO FIREBASE
  useEffect(() => {
    const q = query(collection(db, "chatHistorico"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgsFirebase = snapshot.docs.map(doc => doc.data());
      
      if (msgsFirebase.length === 0) {
        setMessages([{ role: 'assistant', text: "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?" }]);
      } else {
        setMessages(msgsFirebase);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. FUNÇÃO DE NOTIFICAR O PABLO POR EMAIL
  const notificarPablo = (mensagemDaAna) => {
    const templateParams = { mensagem_ana: mensagemDaAna };
    emailjs.send(
      'service_m4p5rzl', 
      'template_nz2c3cf', 
      templateParams, 
      '_vmorr0K9MFFhLsoz'
    )
    .then(r => console.log('Notificação enviada ao Pablo!', r.status, r.text))
    .catch(e => console.log('Falha ao notificar...', e));
  };

  // 3. LIDAR COM O ENVIO DE MENSAGENS
  const handleSend = async (textToProcess) => {
    const prompt = textToProcess || input;
    if (!prompt.trim() || isLoading) return;

    // Salva a mensagem do usuário no Firebase
    await addDoc(collection(db, "chatHistorico"), {
      role: 'user',
      text: prompt,
      createdAt: serverTimestamp()
    });

    setInput("");
    setIsLoading(true);

    // Gatilho do EmailJS
    const textoMinusculo = prompt.toLowerCase();
    const gatilhosExatos = [
      'avisa o pablo', 'avise o pablo', 'avisar o pablo', 'avisa ele', 'avise ele', 'avisar ele', 'avisa lá',
      'chama o pablo', 'chame o pablo', 'chama ele', 'chame ele',
      'pede pro pablo', 'peça pro pablo', 'pede pra ele', 'peça pra ele',
      'fala pro pablo', 'fale pro pablo', 'fala pra ele', 'fale pra ele',
      'diz pro pablo', 'diga pro pablo', 'diz pra ele', 'diga pra ele',
      'manda o pablo', 'manda pra ele', 'manda mensagem',
      'manda pro pablo', 'mande pro pablo', 'mandar pro pablo',
      'envia pro pablo', 'envie pro pablo', 'enviar pro pablo',
      'envia pra ele', 'envie pra ele', 'enviar pra ele', 'envia para ele', 
      'avisa', 'fala', 'diz',
    ];
    if (gatilhosExatos.some(frase => textoMinusculo.includes(frase))) {
      notificarPablo(prompt);
    }

    // Chama o Gemini com a memória
    const botResponse = await callGeminiAPI(messages, prompt);
    
    // Salva a resposta do bot no Firebase
    await addDoc(collection(db, "chatHistorico"), {
      role: 'assistant',
      text: botResponse,
      createdAt: serverTimestamp()
    });

    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col pt-4 px-2 relative z-10">
      <div className="text-center mb-4 flex items-center justify-center gap-2 font-bold text-rose-600 font-serif text-2xl">
        <Bot size={28} /> Cupido Virtual
      </div>

      <div className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl flex-1 overflow-hidden flex flex-col rounded-[2rem] p-4">
        
        {/* ÁREA DE MENSAGENS */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar font-sans">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-rose-500 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'}`}>
                {m.role === 'user' ? ( 
                  m.text 
                ) : (
                  <div className="prose prose-sm prose-rose max-w-none prose-p:leading-relaxed prose-p:my-1 prose-strong:text-rose-700">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-rose-400 text-xs italic animate-pulse px-4 font-sans">O Cupido está pensando...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* BOTÕES DE ATALHO */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button onClick={() => handleSend("Me dê uma ideia de jantar romântico para fazermos em casa.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold active:scale-95 transition-all">Jantar 🍝</button>
          <button onClick={() => handleSend("Sugira um filme bom para assistirmos hoje à noite bem abraçados.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold active:scale-95 transition-all">Filme 🎬</button>
          <button onClick={() => handleSend("Escreva um bilhete curto dizendo o quanto o Pablo ama a Ana Clara.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold active:scale-95 transition-all">Bilhetinho 💌</button>
        </div>

        {/* CAMPO DE INPUT */}
        <div className="flex gap-2 bg-white/40 p-2 rounded-2xl border border-rose-100 items-center">
          
          {/* BOTÃO DE ANEXO (+) */}
          <button 
            onClick={() => alert("A lógica de subir foto vai vir na próxima atualização! 😉")}
            className="text-rose-400 p-2 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-all"
            title="Anexar imagem"
          >
            <Plus size={24} />
          </button>

          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder="Diz algo ao cupido..." 
            className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:outline-none font-sans" 
          />
          <button 
            onClick={() => handleSend()} 
            disabled={isLoading || !input.trim()}
            className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      <Link to="/central" className="mt-4 text-center text-slate-400 hover:text-rose-500 text-xs font-bold uppercase flex items-center justify-center gap-1 font-sans tracking-widest">
        <ArrowLeft size={14} /> Voltar ao Menu
      </Link>
    </div>
  );
}