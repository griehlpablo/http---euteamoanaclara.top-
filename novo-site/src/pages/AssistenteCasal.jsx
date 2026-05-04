import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, ArrowLeft, Plus, Trash2, MessageSquare, X, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import emailjs from '@emailjs/browser'; 
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase'; // Importando o storage que você adicionou!

// Função auxiliar para converter a imagem em Base64 para a API do Gemini
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]); // Pega só a parte do código
  reader.onerror = error => reject(error);
});

const callGeminiAPI = async (historicoMensagens, novoPrompt, base64Image = null, mimeType = null) => {
  const chaveInvertida = "QTuVoVZNCzC4i7gRA0sha6SBVXAMRJ0MBySazIA"; 
  const apiKey = chaveInvertida.split('').reverse().join('');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;
  
  const systemInstruction = "Instruções: Você é o assistente virtual criado pelo desenvolvedor Pablo Griehl para ajudar a namorada dele, Ana Clara. Seu tom deve ser prestativo, inteligente e gentil, com um leve toque romântico. Dê respostas curtas e práticas, EXCETO quando ela pedir uma receita, um roteiro ou detalhes específicos. Eles ficaram em 06/07/2023 e namoram desde 23/09/2023. NÃO REPITA sugestões. REGRA CRÍTICA: Se a Ana Clara pedir para avisar/notificar o namorado (ex: 'fala pro pablo', 'pede pro pablo', etc.), confirme que vai enviar e OBRIGATORIAMENTE inclua a tag secreta [AVISAR_PABLO] no final da sua resposta.";

  // Formata o histórico filtrando a mensagem inicial
  const formattedHistory = historicoMensagens
    .filter(msg => msg.text !== "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?")
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

  // Monta a mensagem atual (com ou sem imagem)
  const currentParts = [{ text: novoPrompt }];
  if (base64Image && mimeType) {
    currentParts.push({
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    });
  }

  formattedHistory.push({
    role: 'user',
    parts: currentParts
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
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Estado da imagem selecionada
  const [imagePreview, setImagePreview] = useState(null);   // Miniatura da imagem
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      if (chatsData.length > 0 && !activeChatId) {
        setActiveChatId(chatsData[0].id);
      }
    });
    return () => unsubscribe();
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "chats", activeChatId, "mensagens"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgsFirebase = snapshot.docs.map(doc => doc.data());
      if (msgsFirebase.length === 0) {
        setMessages([{ role: 'assistant', text: "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?" }]);
      } else {
        setMessages(msgsFirebase);
      }
    });
    return () => unsubscribe();
  }, [activeChatId]);

  const criarNovoChat = async () => {
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        title: "Nova Conversa",
        createdAt: serverTimestamp()
      });
      setActiveChatId(docRef.id);
    } catch (error) {
      console.error("Erro ao criar chat:", error);
    }
  };

  const deletarChatAtivo = async () => {
    if (!activeChatId || !window.confirm("Quer mesmo apagar essa conversa inteira? 🧹")) return;
    try {
      const q = query(collection(db, "chats", activeChatId, "mensagens"));
      const querySnapshot = await getDocs(q);
      const promessasDeletarMsgs = querySnapshot.docs.map((documento) => 
        deleteDoc(doc(db, "chats", activeChatId, "mensagens", documento.id))
      );
      await Promise.all(promessasDeletarMsgs);
      await deleteDoc(doc(db, "chats", activeChatId));
      setActiveChatId(null);
    } catch (error) {
      console.error("Erro ao limpar chat:", error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    const prompt = input;
    // Só envia se tiver texto OU uma imagem selecionada
    if ((!prompt.trim() && !selectedImage) || isLoading || !activeChatId) return;

    setIsLoading(true);
    let imageUrlForFirebase = null;
    let base64ForGemini = null;
    let mimeTypeForGemini = null;

    // Se tiver imagem, primeiro converte e faz o upload
    if (selectedImage) {
      try {
        // 1. Converte para Base64 para mandar pro Gemini
        base64ForGemini = await fileToBase64(selectedImage);
        mimeTypeForGemini = selectedImage.type;

        // 2. Faz o upload para o Firebase Storage para aparecer no chat
        const imageRef = ref(storage, `chats/${activeChatId}/${Date.now()}_${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        imageUrlForFirebase = await getDownloadURL(imageRef);
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        setIsLoading(false);
        return;
      }
    }

    if (messages.length <= 1 && prompt) {
      const titulo = prompt.length > 25 ? prompt.substring(0, 25) + "..." : prompt;
      await updateDoc(doc(db, "chats", activeChatId), { title: titulo });
    }

    // Salva a mensagem do usuário no Firebase (com ou sem imagem)
    await addDoc(collection(db, "chats", activeChatId, "mensagens"), {
      role: 'user',
      text: prompt || "Enviou uma imagem",
      imageUrl: imageUrlForFirebase, // Adiciona a URL da imagem se existir
      createdAt: serverTimestamp()
    });

    setInput("");
    clearImageSelection(); // Limpa a miniatura

    // Chama a API passando a imagem se houver
    let botResponse = await callGeminiAPI(messages, prompt || "Descreva esta imagem ou me ajude com ela.", base64ForGemini, mimeTypeForGemini);

    if (botResponse.includes('[AVISAR_PABLO]')) {
      botResponse = botResponse.replace('[AVISAR_PABLO]', '').trim();
      try {
        await emailjs.send(
          'service_m4p5rzl',   
          'template_nz2c3cf',  
          {
            mensagem_ana: prompt || "Enviou uma imagem",         
            resposta_cupido: botResponse  
          },
          '_vmorr0K9MFFhLsoz'    
        );
      } catch (error) {
        console.error('Falha ao enviar email:', error);
      }
    }
    
    await addDoc(collection(db, "chats", activeChatId, "mensagens"), {
      role: 'assistant',
      text: botResponse,
      createdAt: serverTimestamp()
    });

    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col md:flex-row gap-4 pt-4 px-2 relative z-10">
      
      {/* SIDEBAR MANTIDA IGUAL */}
      <div className="w-full md:w-64 bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl rounded-[2rem] p-4 flex flex-col h-48 md:h-full flex-shrink-0">
        <button onClick={criarNovoChat} className="w-full bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 transition-all font-bold flex items-center justify-center gap-2 mb-4">
          <Plus size={20} /> Nova Conversa
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {chats.map(chat => (
            <button key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`w-full text-left p-3 rounded-xl flex items-center gap-2 text-sm transition-all truncate ${activeChatId === chat.id ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200' : 'text-slate-600 hover:bg-white/50'}`}>
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="truncate">{chat.title}</span>
            </button>
          ))}
        </div>
        
        <Link to="/central" className="mt-4 text-center text-slate-400 hover:text-rose-500 text-xs font-bold uppercase flex items-center justify-center gap-1">
          <ArrowLeft size={14} /> Menu
        </Link>
      </div>

      {/* ÁREA DO CHAT */}
      <div className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl flex-1 overflow-hidden flex flex-col rounded-[2rem] p-4">
        <div className="flex items-center justify-between mb-4 px-2 border-b border-rose-100/50 pb-2">
          <div className="flex items-center gap-2 font-bold text-rose-600 font-serif text-2xl">
            <Bot size={28} /> Cupido Virtual
          </div>
          {activeChatId && (
            <button onClick={deletarChatAtivo} className="p-2 text-rose-300 hover:text-rose-600 transition-all" title="Apagar Conversa">
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {activeChatId ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar font-sans text-slate-800">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-rose-500 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-100 shadow-sm'}`}>
                    
                    {/* Renderiza a imagem no histórico se existir */}
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Anexo do chat" className="w-full max-w-sm rounded-xl mb-2 object-cover" />
                    )}
                    
                    {m.role === 'user' ? (
                      m.text !== "Enviou uma imagem" && <span>{m.text}</span>
                    ) : (
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

            {/* PREVIEW DA IMAGEM E CAIXA DE TEXTO */}
            <div className="flex flex-col gap-2 bg-white/40 p-2 rounded-2xl border border-rose-100">
              
              {/* Miniatura da imagem antes de enviar */}
              {imagePreview && (
                <div className="relative w-20 h-20 ml-2 mt-2">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl border-2 border-rose-200" />
                  <button onClick={clearImageSelection} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600">
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center w-full gap-2">
                {/* Input de arquivo invisível */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect} 
                  className="hidden" 
                />
                
                {/* Botão que chama o input de arquivo */}
                <button 
                  onClick={() => fileInputRef.current.click()} 
                  className="text-rose-400 p-2 rounded-full hover:bg-rose-100 transition-all flex-shrink-0"
                  title="Anexar Imagem"
                >
                  <ImageIcon size={24} />
                </button>
                
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()} 
                  placeholder="Fale com o Cupido ou envie uma foto..." 
                  className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:outline-none" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || (!input.trim() && !selectedImage)} 
                  className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all flex-shrink-0"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-300 font-serif">
            <Bot size={64} className="mb-4 opacity-50" />
            <p>Selecione um chat ou crie uma nova conversa.</p>
          </div>
        )}
      </div>
    </div>
  );
}