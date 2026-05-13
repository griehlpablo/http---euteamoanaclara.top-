import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, ArrowLeft, Plus, Trash2, MessageSquare, X, Image as ImageIcon, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// Modelos ordenados por capacidade/custo
const MODEL_TIERS = {
  PREMIUM: "gemini-1.5-pro",
  STANDARD: "gemini-3-flash",
  LITE: "gemini-3.1-flash-lite-preview"
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = error => reject(error);
});

/**
 * Função de API Aprimorada:
 * 1. Decide a ordem de tentativa baseada no prompt.
 * 2. Tenta os modelos em sequência caso ocorra erro de limite (fallback).
 */
const callGeminiAPI = async (historicoMensagens, novoPrompt, base64Image = null, mimeType = null) => {
  const chaveInvertida = "QTuVoVZNCzC4i7gRA0sha6SBVXAMRJ0MBySazIA"; 
  const apiKey = chaveInvertida.split('').reverse().join('');
  
  const systemInstruction = "Instruções: Você é o assistente virtual criado pelo desenvolvedor Pablo Griehl para ajudar a namorada dele, Ana Clara. Seu tom deve ser prestativo, inteligente e gentil, com um leve toque romântico. Dê respostas curtas e práticas, EXCETO quando ela pedir uma receita, um roteiro ou detalhes específicos. Eles ficaram em 06/07/2023 e namoram desde 23/09/2023. NÃO REPITA sugestões. REGRA CRÍTICA: Se a Ana Clara pedir para avisar/notificar o namorado (ex: 'fala pro pablo', 'pede pro pablo', etc.), confirme que vai enviar e OBRIGATORIAMENTE inclua a tag secreta [AVISAR_PABLO] no final da sua resposta.";

  // Define a prioridade: Se tiver imagem ou texto longo, tenta o melhor modelo primeiro.
  // Caso contrário, tenta o Lite primeiro pela velocidade.
  let modelOrder = [MODEL_TIERS.LITE, MODEL_TIERS.STANDARD, MODEL_TIERS.PREMIUM];
  if (base64Image || (novoPrompt && novoPrompt.length > 250)) {
    modelOrder = [MODEL_TIERS.PREMIUM, MODEL_TIERS.STANDARD, MODEL_TIERS.LITE];
  }

  const formattedHistory = historicoMensagens
    .filter(msg => msg.text !== "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?")
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

  const currentParts = [{ text: novoPrompt || "Analise esta imagem." }];
  if (base64Image) {
    currentParts.push({ inlineData: { data: base64Image, mimeType: mimeType } });
  }

  formattedHistory.push({ role: 'user', parts: currentParts });

  // Loop de Fallback: Tenta cada modelo da lista se o anterior falhar por limite de requisições
  for (const modelId of modelOrder) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: formattedHistory
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        return { 
          text: data.candidates?.[0]?.content?.parts?.[0]?.text || "O amor me deixou sem palavras.",
          modelUsed: modelId 
        };
      }

      // Se for erro de limite (429), continua para o próximo modelo
      if (response.status === 429) {
        console.warn(`Modelo ${modelId} atingiu o limite. Tentando próximo...`);
        continue;
      }

      throw new Error(data.error?.message || "Erro desconhecido");
    } catch (error) {
      console.error(`Erro com modelo ${modelId}:`, error);
      if (modelId === modelOrder[modelOrder.length - 1]) {
        return { text: "Minha conexão falhou em todos os níveis. Tente novamente! 💔", modelUsed: "none" };
      }
    }
  }
};

export default function AssistenteCasal() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentModelName, setCurrentModelName] = useState(""); // Exibe qual modelo respondeu
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      if (chatsData.length > 0 && !activeChatId) setActiveChatId(chatsData[0].id);
    });
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) { setMessages([]); return; }
    const q = query(collection(db, "chats", activeChatId, "mensagens"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      const msgsFirebase = snapshot.docs.map(doc => doc.data());
      setMessages(msgsFirebase.length === 0 ? [{ role: 'assistant', text: "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?" }] : msgsFirebase);
    });
  }, [activeChatId]);

  const criarNovoChat = async () => {
    const docRef = await addDoc(collection(db, "chats"), { title: "Nova Conversa", createdAt: serverTimestamp() });
    setActiveChatId(docRef.id);
  };

  const deletarChatAtivo = async () => {
    if (!activeChatId || !window.confirm("Quer mesmo apagar essa conversa inteira? 🧹")) return;
    const querySnapshot = await getDocs(query(collection(db, "chats", activeChatId, "mensagens")));
    await Promise.all(querySnapshot.docs.map(d => deleteDoc(doc(db, "chats", activeChatId, "mensagens", d.id))));
    await deleteDoc(doc(db, "chats", activeChatId));
    setActiveChatId(null);
  };

  const handleSend = async () => {
    const prompt = input;
    if ((!prompt.trim() && !selectedImage) || isLoading || !activeChatId) return;

    setIsLoading(true);
    let imageUrlForFirebase = null, base64ForGemini = null, mimeTypeForGemini = null;

    if (selectedImage) {
      base64ForGemini = await fileToBase64(selectedImage);
      mimeTypeForGemini = selectedImage.type;
      const imageRef = ref(storage, `chats/${activeChatId}/${Date.now()}_${selectedImage.name}`);
      await uploadBytes(imageRef, selectedImage);
      imageUrlForFirebase = await getDownloadURL(imageRef);
    }

    if (messages.length <= 1 && prompt) {
      await updateDoc(doc(db, "chats", activeChatId), { title: prompt.substring(0, 25) + (prompt.length > 25 ? "..." : "") });
    }

    await addDoc(collection(db, "chats", activeChatId, "mensagens"), {
      role: 'user', text: prompt || "Enviou uma imagem", imageUrl: imageUrlForFirebase, createdAt: serverTimestamp()
    });

    setInput("");
    setSelectedImage(null);
    setImagePreview(null);

    const apiResult = await callGeminiAPI(messages, prompt || "Descreva esta imagem.", base64ForGemini, mimeTypeForGemini);
    let botResponse = apiResult.text;
    setCurrentModelName(apiResult.modelUsed);

    if (botResponse.includes('[AVISAR_PABLO]')) {
      botResponse = botResponse.replace('[AVISAR_PABLO]', '').trim();
      
      // Envia Push Notification via WhatsApp (CallMeBot)
      try {
        const phoneNumber = "+554497168417"; 
        const apiKey = "8762883";
        const mensagem = `💘 O Cupido avisa: Novo pedido -> "${prompt || 'Enviou uma imagem'}"\n\nResposta do Bot: "${botResponse}"`;
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(mensagem)}&apikey=${apiKey}`;

        fetch(url).catch(err => console.error('Erro na requisição do WhatsApp:', err));
      } catch (error) {
        console.error('Erro ao montar o aviso do WhatsApp:', error);
      }
    }
    
    await addDoc(collection(db, "chats", activeChatId, "mensagens"), {
      role: 'assistant', text: botResponse, createdAt: serverTimestamp()
    });
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col md:flex-row gap-4 pt-4 px-2 relative z-10">
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl rounded-[2rem] p-4 flex flex-col h-48 md:h-full flex-shrink-0">
        <button onClick={criarNovoChat} className="w-full bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 transition-all font-bold flex items-center justify-center gap-2 mb-4"><Plus size={20} /> Nova Conversa</button>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {chats.map(chat => (
            <button key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`w-full text-left p-3 rounded-xl flex items-center gap-2 text-sm transition-all truncate ${activeChatId === chat.id ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200' : 'text-slate-600 hover:bg-white/50'}`}><MessageSquare size={16} /> <span className="truncate">{chat.title}</span></button>
          ))}
        </div>
        <Link to="/central" className="mt-4 text-center text-slate-400 hover:text-rose-500 text-xs font-bold uppercase flex items-center justify-center gap-1"><ArrowLeft size={14} /> Menu</Link>
      </div>

      {/* CHAT */}
      <div className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl flex-1 overflow-hidden flex flex-col rounded-[2rem] p-4">
        <div className="flex items-center justify-between mb-4 px-2 border-b border-rose-100/50 pb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-bold text-rose-600 font-serif text-2xl"><Bot size={28} /> Cupido Virtual</div>
            {currentModelName && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Cpu size={10}/> Processado por: {currentModelName}</span>}
          </div>
          {activeChatId && <button onClick={deletarChatAtivo} className="p-2 text-rose-300 hover:text-rose-600 transition-all"><Trash2 size={20} /></button>}
        </div>

        {activeChatId ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar font-sans text-slate-800">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-rose-500 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-100 shadow-sm'}`}>
                    {m.imageUrl && <img src={m.imageUrl} alt="Anexo" className="w-full max-w-sm rounded-xl mb-2 object-cover" />}
                    {m.role === 'user' ? <span>{m.text}</span> : <div className="prose prose-sm prose-rose max-w-none"><ReactMarkdown>{m.text}</ReactMarkdown></div>}
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-rose-400 text-xs italic animate-pulse px-4">O Cupido está escolhendo o melhor modelo...</div>}
              <div ref={chatEndRef} />
            </div>

            <div className="flex flex-col gap-2 bg-white/40 p-2 rounded-2xl border border-rose-100">
              {imagePreview && (
                <div className="relative w-20 h-20 ml-2 mt-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl border-2 border-rose-200" />
                  <button onClick={() => {setSelectedImage(null); setImagePreview(null);}} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"><X size={14} /></button>
                </div>
              )}
              <div className="flex items-center w-full gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {const f = e.target.files[0]; if(f){setSelectedImage(f); setImagePreview(URL.createObjectURL(f));}}} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="text-rose-400 p-2 rounded-full hover:bg-rose-100"><ImageIcon size={24} /></button>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Fale com o Cupido..." className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:outline-none" />
                <button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedImage)} className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all flex-shrink-0"><Send size={20} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-300 font-serif"><Bot size={64} className="mb-4 opacity-50" /><p>Selecione um chat para começar.</p></div>
        )}
      </div>
    </div>
  );
}