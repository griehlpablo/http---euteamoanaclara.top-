import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import emailjs from '@emailjs/browser';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; 

// --- FUNÇÃO DO GEMINI COM MEMÓRIA CORRIGIDA ---
const callGeminiAPI = async (historicoMensagens, novoPrompt) => {
  // A string abaixo agora termina em "BySazIA" (o 'y' antes do 'S' na inversão para o 'S' vir antes do 'y' no final)
const chaveInvertida = "4GC1x8jqyJfqHztt4LaXgAqWlpAu6wglBySazIA";
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

export default function AssistenteCasal() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

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

  const limparChat = async () => {
    if (!window.confirm("Quer mesmo apagar essa conversa e começar uma nova? 🧹")) return;
    try {
      const q = query(collection(db, "chatHistorico"));
      const querySnapshot = await getDocs(q);
      const promessasDeletar = querySnapshot.docs.map((documento) => 
        deleteDoc(doc(db, "chatHistorico", documento.id))
      );
      await Promise.all(promessasDeletar);
    } catch (error) {
      console.error("Erro ao limpar chat:", error);
    }
  };

  const notificarPablo = (mensagemDaAna) => {
    const templateParams = { mensagem_ana: mensagemDaAna };
    emailjs.send('service_m4p5rzl', 'template_nz2c3cf', templateParams, '_vmorr0K9MFFhLsoz')
    .catch(e => console.log('Falha ao notificar...', e));
  };

  const handleSend = async (textToProcess) => {
    const prompt = textToProcess || input;
    if (!prompt.trim() || isLoading) return;

    await addDoc(collection(db, "chatHistorico"), {
      role: 'user',
      text: prompt,
      createdAt: serverTimestamp()
    });

    setInput("");
    setIsLoading(true);

    const textoMinusculo = prompt.toLowerCase();
    const gatilhos = ['avisa o pablo', 'avise o pablo', 'avisar o pablo', 'chama o pablo', 'manda mensagem'];
    if (gatilhos.some(frase => textoMinusculo.includes(frase))) {
      notificarPablo(prompt);
    }

    const botResponse = await callGeminiAPI(messages, prompt);
    
    await addDoc(collection(db, "chatHistorico"), {
      role: 'assistant',
      text: botResponse,
      createdAt: serverTimestamp()
    });

    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col pt-4 px-2 relative z-10">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 font-bold text-rose-600 font-serif text-2xl">
          <Bot size={28} /> Cupido Virtual
        </div>
        <button onClick={limparChat} className="p-2 text-rose-300 hover:text-rose-600 transition-all">
          <Trash2 size={20} />
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl flex-1 overflow-hidden flex flex-col rounded-[2rem] p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar font-sans">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-rose-500 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'}`}>
                {m.role === 'user' ? m.text : (
                  <div className="prose prose-sm prose-rose max-w-none">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-rose-400 text-xs italic animate-pulse px-4">O Cupido está pensando...</div>}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button onClick={() => handleSend("Me dê uma ideia de jantar romântico para fazermos em casa.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold">Jantar 🍝</button>
          <button onClick={() => handleSend("Sugira um filme bom para assistirmos hoje à noite.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold">Filme 🎬</button>
        </div>

        <div className="flex gap-2 bg-white/40 p-2 rounded-2xl border border-rose-100 items-center">
          <button onClick={() => alert("A galeria vem aí! 😉")} className="text-rose-400 p-2 rounded-full hover:bg-rose-100 transition-all"><Plus size={24} /></button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Diz algo ao cupido..." className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:outline-none font-sans" />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all"><Send size={20} /></button>
        </div>
      </div>

      <Link to="/central" className="mt-4 text-center text-slate-400 hover:text-rose-500 text-xs font-bold uppercase flex items-center justify-center gap-1">
        <ArrowLeft size={14} /> Voltar ao Menu
      </Link>
    </div>
  );
}