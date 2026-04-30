import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Send, Loader2, Bot } from 'lucide-react';

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

// --- SERVIÇO DE INTEGRAÇÃO COM A API DO GEMINI ---
const callGeminiAPI = async (prompt) => {
  const apiKey = "AIzaSyCrfHGV87_6iNkMFpXNuAEWdMsWwDMsXU4"; 
  // Alterado para gemini-1.5-flash (mais estável)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const systemInstruction = "Você é o 'Cupido Virtual ✨', o assistente romântico do Pablo e da Ana Clara. Pablo criou este site para ela. Seja fofo, use muitos emojis e lembre a Ana do quanto o Pablo a ama. História: ficaram em 06/07/2023 e namoram desde 23/09/2023.";

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();

    if (!response.ok) {
      // Isso vai imprimir o erro real no seu console (F12)
      console.error("Erro detalhado da API:", data);
      throw new Error(`Erro: ${response.status}`);
    }
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Opa, me perdi nos pensamentos de amor. Pode repetir? 💖";
  } catch (error) {
    console.error("Erro na comunicação:", error);
    return "Desculpe, Ana. Minha conexão com o coração do Pablo falhou agora. Tente novamente mais tarde! 💔";
  }
};

// --- COMPONENTE VISUAL DO CHAT ---
export default function AssistenteCasal() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Olá, Ana Clara! 💕 Eu sou o Cupido Virtual. Quer uma ideia pro jantar de hoje, uma sugestão de filme para assistirem grudadinhos, ou que eu conte uma piada?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Faz o scroll automático para o fim da conversa
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToProcess) => {
    const prompt = textToProcess || input;
    if (!prompt.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setInput("");
    setIsLoading(true);

    const botResponse = await callGeminiAPI(prompt);
    
    setMessages(prev => [...prev, { role: 'assistant', text: botResponse }]);
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-2xl mx-auto flex flex-col h-[75vh] px-2 pt-4"
    >
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl font-bold mb-1 text-gray-800 flex items-center justify-center gap-2 text-rose-600">
          <Bot size={28} /> Cupido Virtual
        </h2>
        <p className="text-slate-500 text-sm italic">Sua IA romântica personalizada ✨</p>
      </div>

      <div className={`flex-1 overflow-hidden flex flex-col ${glassClasses} rounded-[2rem] p-4 shadow-xl`}>
        {/* Área das Mensagens */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-rose-500 text-white rounded-br-none shadow-md' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/80 border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-slate-400 text-xs italic">
                <Loader2 className="w-3 h-3 animate-spin" /> O Cupido está pensando...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Sugestões Rápidas (Ótimo para celular) */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button onClick={() => handleSend("Ideia de jantar romântico em casa")} className="whitespace-nowrap text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-full font-bold">Jantar 🍝</button>
          <button onClick={() => handleSend("Sugestão de filme de romance")} className="whitespace-nowrap text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-full font-bold">Filme 🎬</button>
          <button onClick={() => handleSend("Escreva um poeminha sobre nós")} className="whitespace-nowrap text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-full font-bold">Poema 💌</button>
        </div>

        {/* Campo de Entrada */}
        <div className="flex gap-2 bg-white/50 p-2 rounded-2xl border border-rose-100 backdrop-blur-sm">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte algo ao cupido..." 
            className="flex-1 bg-transparent border-none px-4 py-2 text-sm focus:outline-none placeholder:text-slate-400"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 active:scale-95 transition-all shadow-md disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <Link to="/central" className="mt-4 text-center text-slate-400 hover:text-rose-500 text-xs font-bold uppercase flex items-center justify-center gap-2 tracking-widest">
        <ArrowLeft size={14} /> Voltar ao Menu
      </Link>
    </motion.div>
  );
}