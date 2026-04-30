import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Send, Loader2 } from 'lucide-react';

const glassClasses = "bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg";

const callGeminiAPI = async (prompt) => {
  // ATENÇÃO: Substitua "SUA_CHAVE_AQUI" pela sua chave real da API do Google Gemini
  const apiKey = "SUA_CHAVE_AQUI"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const systemInstruction = "Você é o 'Cupido Virtual ✨', um assistente de inteligência artificial criado pelo Pablo exclusivamente para ajudar a Ana Clara, sua namorada. Seja sempre romântico, gentil, use emojis fofos e ajude com ideias de encontros, recomendações de filmes para casal, ideias de receitas românticas ou apenas diga o quanto o Pablo a ama. Você conhece a história deles (ficaram a primeira vez em 06/07/2023 e começaram a namorar em 23/09/2023). Seja conciso, charmoso e focado no amor deles.";

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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Opa, me perdi nos pensamentos de amor. Pode repetir?";
  } catch (error) {
    return "Desculpe, Ana. Minha conexão com o coração do Pablo falhou agora. Tente novamente mais tarde! 💔";
  }
};

export default function AssistenteCasal() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Olá, Ana Clara! 💕 Eu sou o Cupido Virtual, a inteligência artificial do Pablo. Quer uma ideia pro jantar de hoje, uma sugestão de filme pra vocês assistirem grudadinhos, ou que eu conte uma piada?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToProcess) => {
    const prompt = textToProcess || input;
    if (!prompt.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setInput("");
    setIsLoading(true);

    const botResponse = await callGeminiAPI(prompt);
    
    setMessages(prev => [...prev, { role: 'assistant', text: botResponse }]);
    setIsLoading(false);
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto flex flex-col h-[75vh]">
      <div className="text-center mb-6">
        <h2 className="font-serif text-3xl font-bold mb-2 text-gray-800 flex items-center justify-center gap-3">
          <Sparkles className="text-rose-500" /> Cupido Virtual ✨
        </h2>
        <p className="text-slate-500 italic">Sua IA pessoal alimentada com muito amor.</p>
      </div>

      <div className={`flex-1 overflow-hidden flex flex-col ${glassClasses} rounded-3xl p-4 md:p-6 mb-6`}>
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
          <button onClick={() => handleQuickPrompt("Me dê uma ideia de jantar romântico para fazermos em casa.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-3 py-2 rounded-full hover:bg-rose-100 transition-colors">Ideia de Jantar 🍝</button>
          <button onClick={() => handleQuickPrompt("Sugira um filme bom para assistirmos hoje à noite bem abraçados.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-3 py-2 rounded-full hover:bg-rose-100 transition-colors">Filme de Casal 🎬</button>
          <button onClick={() => handleQuickPrompt("Escreva um poema curto dizendo o quanto o Pablo me ama.")} className="whitespace-nowrap text-xs bg-rose-50 text-rose-600 border border-rose-200 px-3 py-2 rounded-full hover:bg-rose-100 transition-colors">Poema Romântico 💌</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Pensando com carinho...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="pt-4 mt-2 border-t border-slate-100 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte ao cupido..." 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all text-sm"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <Link to="/central" className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-slate-600">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Menu
        </Link>
      </div>
    </motion.div>
  );
}