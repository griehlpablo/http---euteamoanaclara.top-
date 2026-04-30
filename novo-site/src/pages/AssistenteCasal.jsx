import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Loader2, Bot, ArrowLeft } from 'lucide-react';

const callGeminiAPI = async (prompt) => {
  const apiKey = "AIzaSyCrfHGV87_6iNkMFpXNuAEWdMsWwDMsXU4"; 
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  // Instrução de sistema que define a personalidade
  const instructionText = "Você é o 'Cupido Virtual ✨', o assistente romântico do Pablo e da Ana Clara. O Pablo criou este site para ela. Seja carinhoso, use emojis, sugira encontros criativos e receitas. Relembre a Ana do quanto ela é amada. História: primeiro beijo em 06/07/2023, namoro começou em 23/09/2023.";

  const payload = {
    contents: [{ 
      parts: [{ text: prompt }] 
    }],
    // CORREÇÃO: O campo deve ser system_instruction (com underscore)
    system_instruction: { 
      parts: [{ text: instructionText }] 
    }
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput("");
    setIsLoading(true);
    const reply = await callGeminiAPI(userText);
    setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto h-[70vh] flex flex-col pt-4 px-2">
      <div className="text-center mb-4 flex items-center justify-center gap-2 font-bold text-rose-600 font-serif text-2xl">
        <Bot size={28} /> Cupido Virtual
      </div>
      <div className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl flex-1 overflow-hidden flex flex-col rounded-[2rem] p-4">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar font-sans">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-rose-500 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-rose-400 text-xs italic animate-pulse px-4">O Cupido está pensando...</div>}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2 bg-white/40 p-2 rounded-2xl border border-rose-100">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Fale com o cupido..." className="flex-1 bg-transparent border-none px-4 py-2 text-sm focus:outline-none" />
          <button onClick={handleSend} className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 active:scale-95 transition-all"><Send size={20} /></button>
        </div>
      </div>
      <Link to="/central" className="mt-4 text-center text-slate-400 hover:text-rose-500 text-xs font-bold uppercase flex items-center justify-center gap-1">
        <ArrowLeft size={14} /> Voltar ao Menu
      </Link>
    </div>
  );
}