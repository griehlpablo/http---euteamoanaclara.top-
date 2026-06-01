import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, ArrowLeft, Plus, Trash2, MessageSquare, X, Image as ImageIcon, Cpu, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../supabase';
import { callGeminiAPI } from '../services/gemini';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = error => reject(error);
});

export default function AssistenteCasal() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [currentModelName, setCurrentModelName] = useState(""); // Exibe qual modelo respondeu
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('chats').select('*').order('createdAt', { ascending: false });
      if (error) {
        console.error('Supabase error fetching chats:', error);
        return;
      }
      if (mounted) {
        setChats(data || []);
        if (data && data.length > 0 && !activeChatId) setActiveChatId(data[0].id);
      }
    })();

    return () => { mounted = false; };
  }, [activeChatId]);

  useEffect(() => {
    if (!activeChatId) {
      const timeoutId = window.setTimeout(() => setMessages([]), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('mensagens').select('*').eq('chat_id', activeChatId).order('createdAt', { ascending: true });
      if (error) {
        console.error('Supabase error fetching mensagens:', error);
        return;
      }
      if (mounted) setMessages((data && data.length > 0) ? data : [{ role: 'assistant', text: "Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?" }]);
    })();

    return () => { mounted = false; };
  }, [activeChatId]);

  const criarNovoChat = async () => {
    const { data, error } = await supabase.from('chats').insert([{ title: 'Nova Conversa', createdAt: new Date().toISOString() }]).select().single();
    if (error) {
      console.error('Erro ao criar chat:', error);
      return;
    }
    setActiveChatId(data.id);
  };

  const deletarChatAtivo = async () => {
    if (!activeChatId || !window.confirm("Quer mesmo apagar essa conversa inteira? 🧹")) return;
    try {
      const { error: delMsgError } = await supabase.from('mensagens').delete().eq('chat_id', activeChatId);
      if (delMsgError) throw delMsgError;
      const { error: delChatError } = await supabase.from('chats').delete().eq('id', activeChatId);
      if (delChatError) throw delChatError;
      setActiveChatId(null);
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    }
  };

  const handleSend = async () => {
    const prompt = input;
    if ((!prompt.trim() && !selectedFile) || isLoading || !activeChatId) return;

    setIsLoading(true);
    let imageUrlForFirebase = null, base64ForGemini = null, mimeTypeForGemini = null;

    if (selectedFile) {
      base64ForGemini = await fileToBase64(selectedFile);
      mimeTypeForGemini = selectedFile.type;
      const bucket = 'chats';
      const filePath = `chats/${activeChatId}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, selectedFile);
      if (uploadError) {
        console.error('Erro ao fazer upload do arquivo:', uploadError);
      } else {
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
        imageUrlForFirebase = publicData?.publicUrl || null;
      }
    }

    if (messages.length <= 1 && prompt) {
      const { error: updateError } = await supabase.from('chats').update({ title: prompt.substring(0, 25) + (prompt.length > 25 ? "..." : "") }).eq('id', activeChatId);
      if (updateError) console.error('Erro ao atualizar título do chat:', updateError);
    }

    const { error: insertError } = await supabase.from('mensagens').insert([
      {
        chat_id: activeChatId,
        role: 'user',
        text: prompt || "Enviou um arquivo",
        imageUrl: imageUrlForFirebase,
        fileType: mimeTypeForGemini,
        createdAt: new Date().toISOString()
      }
    ]);
    if (insertError) console.error('Erro ao inserir mensagem:', insertError);

    setInput("");
    setSelectedFile(null);
    setFilePreview(null);

    const apiResult = await callGeminiAPI(messages, prompt || "Analise este arquivo.", base64ForGemini, mimeTypeForGemini);
    let botResponse = apiResult.text;
    setCurrentModelName(apiResult.modelUsed);

    if (botResponse.includes('[AVISAR_PABLO]')) {
      botResponse = botResponse.replace('[AVISAR_PABLO]', '').trim();
      
      // Envia Push Notification via WhatsApp (CallMeBot)
      try {
        const phoneNumber = "+554497168417"; 
        const apiKey = "8762883";
        const mensagem = `💘 O Cupido avisa: Novo pedido -> "${prompt || 'Enviou um arquivo'}"\n\nResposta do Bot: "${botResponse}"`;
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(mensagem)}&apikey=${apiKey}`;

        fetch(url, { mode: 'no-cors' }).catch(err => console.error('Erro na requisição do WhatsApp:', err));
      } catch (error) {
        console.error('Erro ao montar o aviso do WhatsApp:', error);
      }
    }
    
    const { error: insertAssistantError } = await supabase.from('mensagens').insert([
      { chat_id: activeChatId, role: 'assistant', text: botResponse, createdAt: new Date().toISOString() }
    ]);
    if (insertAssistantError) console.error('Erro ao inserir resposta do assistente:', insertAssistantError);
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
                    {m.fileType && !m.fileType.startsWith('image/') ? (
                      <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors mb-2 text-white text-sm w-max">
                        <FileText size={16} /> Documento Anexado
                      </a>
                    ) : (
                      m.imageUrl && <img src={m.imageUrl} alt="Anexo" className="w-full max-w-sm rounded-xl mb-2 object-cover" />
                    )}
                    {m.role === 'user' ? <span>{m.text}</span> : <div className="prose prose-sm prose-rose max-w-none"><ReactMarkdown>{m.text}</ReactMarkdown></div>}
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-rose-400 text-xs italic animate-pulse px-4">O Cupido está escolhendo o melhor modelo...</div>}
              <div ref={chatEndRef} />
            </div>

            <div className="flex flex-col gap-2 bg-white/40 p-2 rounded-2xl border border-rose-100">
              {selectedFile && (
                <div className="relative ml-2 mt-2 inline-block">
                  {selectedFile.type.startsWith('image/') ? (
                    <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-rose-200" />
                  ) : (
                    <div className="w-auto h-12 px-4 bg-white rounded-xl border-2 border-rose-200 flex items-center justify-center gap-2 text-rose-500 text-sm font-medium shadow-sm">
                      <FileText size={18} />
                      <span className="truncate max-w-[120px]">{selectedFile.name}</span>
                    </div>
                  )}
                  <button onClick={() => {setSelectedFile(null); setFilePreview(null);}} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"><X size={14} /></button>
                </div>
              )}
              <div className="flex items-center w-full gap-2">
                <input type="file" accept="image/*,.pdf,.txt,.docx" ref={fileInputRef} onChange={(e) => {const f = e.target.files[0]; if(f){setSelectedFile(f); if(f.type.startsWith('image/')){setFilePreview(URL.createObjectURL(f));}else{setFilePreview(null);}}}} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="text-rose-400 p-2 rounded-full hover:bg-rose-100"><ImageIcon size={24} /></button>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Fale com o Cupido..." className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:outline-none" />
                <button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFile)} className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all flex-shrink-0"><Send size={20} /></button>
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
