import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Loader2, Bot, ArrowLeft } from 'lucide-react';

const callGeminiAPI = async (prompt) => {
  const apiKey = "AIzaSyCrfHGV87_6iNkMFpXNuAEWdMsWwDMsXU4"; 
  // CORREÇÃO FINAL: Usando o modelo gemini-2.5-flash que está ativo e atualizado!
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  // Personalidade injetada diretamente no texto (à prova de erros)
  const context = "Instrução de Personalidade: Você é o 'Cupido Virtual ✨', o assistente romântico do Pablo e da Ana Clara. Pablo criou este site para ela. Seja carinhoso, use emojis, sugira encontros e receitas. Relembre a Ana do quanto ela é amada. História: primeiro beijo em 06/07/2023, namoro começou em 23/09/2023. Responda à seguinte mensagem da Ana Clara: ";

  const payload = {
    contents: [{ 
      parts: [{ text: context + prompt }] 
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.error("Erro detalhado da API:", data);
      throw new Error(data.error?.message || "Erro API");
    }
    
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "O amor me deixou sem palavras. Tente de novo! 💖";
  } catch (error) {
    console.error("Erro comunicação:", error);
    return "Minha conexão falhou. Tente novamente em instantes! 💔";
  }
};

export default function AssistenteCasal() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?" }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

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
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col pt-4 px-2 relative z-10">
      <div className="text-center mb-4 flex items-center justify-center gap-2 font-bold text-rose-600 font-serif text-2xl">
        <Bot size={28} /> Cupido Virtual
      </div>

      <div className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl flex-1 overflow-hidden flex flex-col rounded-[2rem] p-4">
        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar font-sans">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                m.role === 'user' 
                ? 'bg-rose-500 text-white rounded-br-none shadow-md' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-rose-400 text-xs italic animate-pulse px-4 font-sans">O Cupido está pensando...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* Botões de Atalho (Otimizados para toque no celular) */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          <button 
            onClick={() => handleSend("Me dê uma ideia de jantar romântico para fazermos em casa.")} 
            className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold active:scale-95 transition-all"
          >
            Jantar 🍝
          </button>
          <button 
            onClick={() => handleSend("Sugira um filme bom para assistirmos hoje à noite bem abraçados.")} 
            className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold active:scale-95 transition-all"
          >
            Filme 🎬
          </button>
          <button 
            onClick={() => handleSend("Escreva um poema curto dizendo o quanto o Pablo ama a Ana Clara.")} 
            className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-4 py-2 rounded-full font-bold active:scale-95 transition-all"
          >
            Poema 💌
          </button>
        </div>

        {/* Campo de Input */}
        <div className="flex gap-2 bg-white/40 p-2 rounded-2xl border border-rose-100">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSend()} 
            placeholder="Diz algo ao cupido..." 
            className="flex-1 bg-transparent border-none px-4 py-2 text-sm focus:outline-none font-sans" 
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