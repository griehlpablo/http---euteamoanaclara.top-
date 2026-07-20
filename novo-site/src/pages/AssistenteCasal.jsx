import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, ArrowLeft, Plus, Trash2, MessageSquare, X, Image as ImageIcon, Cpu, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase, isSupabaseConfigured } from '../supabase';
import { callGeminiAPI } from '../services/gemini';
import { sendPartnerNotification } from '../services/notifications';

const LOCAL_CHATS_KEY = 'cupido-virtual-chats-v1';
const LOCAL_MESSAGES_KEY = 'cupido-virtual-messages-v1';
const WELCOME_TEXT = 'Olá, Ana Clara! 💕 Como posso ajudar o casal hoje?';

const welcomeMessage = () => ({
  id: 'welcome',
  role: 'assistant',
  text: WELCOME_TEXT,
  createdAt: new Date().toISOString(),
});

const readLocalJson = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const createLocalId = () => (
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
);

const saveLocalChats = (chats) => {
  localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats));
};

const readLocalMessageStore = () => readLocalJson(LOCAL_MESSAGES_KEY, {});

const saveLocalMessages = (chatId, messages) => {
  const store = readLocalMessageStore();
  store[chatId] = messages;
  localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(store));
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (error) => reject(error);
});

export default function AssistenteCasal() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [currentModelName, setCurrentModelName] = useState('');

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const localChats = readLocalJson(LOCAL_CHATS_KEY, []);
      setChats(Array.isArray(localChats) ? localChats : []);
      if (localChats?.length) setActiveChatId(localChats[0].id);
      return undefined;
    }

    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from('chats').select('*').order('createdAt', { ascending: false });
      if (error) {
        console.error('Supabase error fetching chats:', error);
        return;
      }
      if (mounted) {
        setChats(data || []);
        if (data?.length) setActiveChatId((current) => current || data[0].id);
      }
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!activeChatId) {
      const timeoutId = window.setTimeout(() => setMessages([]), 0);
      return () => window.clearTimeout(timeoutId);
    }

    if (!isSupabaseConfigured) {
      const storedMessages = readLocalMessageStore()[activeChatId];
      const nextMessages = Array.isArray(storedMessages) && storedMessages.length
        ? storedMessages
        : [welcomeMessage()];
      const timeoutId = window.setTimeout(() => setMessages(nextMessages), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('chat_id', activeChatId)
        .order('createdAt', { ascending: true });
      if (error) {
        console.error('Supabase error fetching mensagens:', error);
        return;
      }
      if (mounted) setMessages(data?.length ? data : [welcomeMessage()]);
    })();

    return () => { mounted = false; };
  }, [activeChatId]);

  const criarNovoChat = async () => {
    if (!isSupabaseConfigured) {
      const data = {
        id: createLocalId(),
        title: 'Nova Conversa',
        createdAt: new Date().toISOString(),
      };
      const nextChats = [data, ...chats];
      saveLocalChats(nextChats);
      saveLocalMessages(data.id, [welcomeMessage()]);
      setChats(nextChats);
      setActiveChatId(data.id);
      return;
    }

    const { data, error } = await supabase
      .from('chats')
      .insert([{ title: 'Nova Conversa', createdAt: new Date().toISOString() }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar chat:', error);
      return;
    }

    setChats((previous) => [data, ...previous.filter((chat) => chat.id !== data.id)]);
    setActiveChatId(data.id);
  };

  const deletarChatAtivo = async () => {
    if (!activeChatId || !window.confirm('Quer mesmo apagar essa conversa inteira? 🧹')) return;

    if (!isSupabaseConfigured) {
      const remaining = chats.filter((chat) => chat.id !== activeChatId);
      const messageStore = readLocalMessageStore();
      delete messageStore[activeChatId];
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messageStore));
      saveLocalChats(remaining);
      setChats(remaining);
      setActiveChatId(remaining[0]?.id || null);
      setMessages([]);
      return;
    }

    try {
      const { error: delMsgError } = await supabase.from('mensagens').delete().eq('chat_id', activeChatId);
      if (delMsgError) throw delMsgError;
      const { error: delChatError } = await supabase.from('chats').delete().eq('id', activeChatId);
      if (delChatError) throw delChatError;

      const remaining = chats.filter((chat) => chat.id !== activeChatId);
      setChats(remaining);
      setActiveChatId(remaining[0]?.id || null);
      setMessages([]);
    } catch (error) {
      console.error('Erro ao deletar conversa:', error);
    }
  };

  const handleSend = async () => {
    const prompt = input;
    if ((!prompt.trim() && !selectedFile) || isLoading || !activeChatId) return;

    setIsLoading(true);
    let imageUrl = null;
    let base64ForGemini = null;
    let mimeTypeForGemini = null;
    let messagesAfterUser = messages;

    try {
      if (selectedFile) {
        base64ForGemini = await fileToBase64(selectedFile);
        mimeTypeForGemini = selectedFile.type;

        if (isSupabaseConfigured) {
          const bucket = 'chats';
          const filePath = `chats/${activeChatId}/${Date.now()}_${selectedFile.name}`;
          const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, selectedFile);
          if (uploadError) {
            console.error('Erro ao fazer upload do arquivo:', uploadError);
          } else {
            const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
            imageUrl = publicData?.publicUrl || null;
          }
        } else if (selectedFile.type.startsWith('image/')) {
          imageUrl = `data:${selectedFile.type};base64,${base64ForGemini}`;
        }
      }

      const shouldRenameChat = messages.length <= 1 && prompt.trim();
      if (shouldRenameChat) {
        const nextTitle = prompt.substring(0, 25) + (prompt.length > 25 ? '...' : '');

        if (isSupabaseConfigured) {
          const { error: updateError } = await supabase.from('chats').update({ title: nextTitle }).eq('id', activeChatId);
          if (updateError) {
            console.error('Erro ao atualizar título do chat:', updateError);
          } else {
            setChats((previous) => previous.map((chat) => chat.id === activeChatId ? { ...chat, title: nextTitle } : chat));
          }
        } else {
          const nextChats = chats.map((chat) => chat.id === activeChatId ? { ...chat, title: nextTitle } : chat);
          saveLocalChats(nextChats);
          setChats(nextChats);
        }
      }

      const userMessage = {
        id: createLocalId(),
        chat_id: activeChatId,
        role: 'user',
        text: prompt || 'Enviou um arquivo',
        imageUrl,
        fileType: mimeTypeForGemini,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { data: insertedUserMessage, error: insertError } = await supabase
          .from('mensagens')
          .insert([userMessage])
          .select()
          .single();
        if (insertError) throw insertError;
        messagesAfterUser = [...messages, insertedUserMessage];
      } else {
        messagesAfterUser = [...messages, userMessage];
        saveLocalMessages(activeChatId, messagesAfterUser);
      }

      setMessages(messagesAfterUser);
      setInput('');
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      const apiResult = await callGeminiAPI(
        messages,
        prompt || 'Analise este arquivo.',
        base64ForGemini,
        mimeTypeForGemini,
      );
      let botResponse = apiResult.text;
      setCurrentModelName(apiResult.modelUsed);

      if (botResponse.includes('[AVISAR_PABLO]')) {
        botResponse = botResponse.replace('[AVISAR_PABLO]', '').trim();
        if (isSupabaseConfigured) {
          await sendPartnerNotification({
            targetUser: 'pablo',
            title: 'Recado da Ana pelo Cupido 💘',
            message: `${prompt || 'Ana enviou um arquivo'} — ${botResponse}`,
            data: { source: 'assistente-casal', chatId: activeChatId },
          });
        }
      }

      const assistantMessage = {
        id: createLocalId(),
        chat_id: activeChatId,
        role: 'assistant',
        text: botResponse,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured) {
        const { data: insertedAssistantMessage, error: insertAssistantError } = await supabase
          .from('mensagens')
          .insert([assistantMessage])
          .select()
          .single();
        if (insertAssistantError) throw insertAssistantError;
        setMessages((previous) => [...previous, insertedAssistantMessage]);
      } else {
        const completedMessages = [...messagesAfterUser, assistantMessage];
        saveLocalMessages(activeChatId, completedMessages);
        setMessages(completedMessages);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage = {
        id: createLocalId(),
        role: 'assistant',
        text: 'Não consegui enviar agora. Tente novamente em instantes. 💔',
        createdAt: new Date().toISOString(),
      };
      const nextMessages = [...messagesAfterUser, errorMessage];
      if (!isSupabaseConfigured) saveLocalMessages(activeChatId, nextMessages);
      setMessages(nextMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col md:flex-row gap-4 pt-4 px-2 relative z-10">
      <div className="w-full md:w-64 bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl rounded-[2rem] p-4 flex flex-col h-48 md:h-full flex-shrink-0">
        <button onClick={criarNovoChat} className="w-full bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 transition-all font-bold flex items-center justify-center gap-2 mb-4"><Plus size={20} /> Nova Conversa</button>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {chats.map((chat) => (
            <button key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`w-full text-left p-3 rounded-xl flex items-center gap-2 text-sm transition-all truncate ${activeChatId === chat.id ? 'bg-rose-100 text-rose-700 font-bold border border-rose-200' : 'text-slate-600 hover:bg-white/50'}`}><MessageSquare size={16} /> <span className="truncate">{chat.title}</span></button>
          ))}
        </div>
        <Link to="/central" className="mt-4 text-center text-slate-400 hover:text-rose-500 text-xs font-bold uppercase flex items-center justify-center gap-1"><ArrowLeft size={14} /> Menu</Link>
      </div>

      <div className="bg-white/60 backdrop-blur-lg border border-white/50 shadow-xl flex-1 overflow-hidden flex flex-col rounded-[2rem] p-4">
        <div className="flex items-center justify-between mb-4 px-2 border-b border-rose-100/50 pb-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-bold text-rose-600 font-serif text-2xl"><Bot size={28} /> Cupido Virtual</div>
            {!isSupabaseConfigured && <span className="text-[10px] text-slate-400">Conversas salvas neste navegador</span>}
            {currentModelName && <span className="text-[10px] text-slate-400 flex items-center gap-1"><Cpu size={10} /> Processado por: {currentModelName}</span>}
          </div>
          {activeChatId && <button onClick={deletarChatAtivo} className="p-2 text-rose-300 hover:text-rose-600 transition-all"><Trash2 size={20} /></button>}
        </div>

        {activeChatId ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar font-sans text-slate-800">
              {messages.map((message, index) => (
                <div key={message.id || index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${message.role === 'user' ? 'bg-rose-500 text-white rounded-br-none shadow-md' : 'bg-white border border-slate-100 shadow-sm'}`}>
                    {message.fileType && !message.fileType.startsWith('image/') ? (
                      message.imageUrl ? (
                        <a href={message.imageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/20 p-2 rounded-lg hover:bg-white/30 transition-colors mb-2 text-white text-sm w-max">
                          <FileText size={16} /> Documento Anexado
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg mb-2 text-sm w-max"><FileText size={16} /> Documento enviado</div>
                      )
                    ) : (
                      message.imageUrl && <img src={message.imageUrl} alt="Anexo" className="w-full max-w-sm rounded-xl mb-2 object-cover" />
                    )}
                    {message.role === 'user' ? <span>{message.text}</span> : <div className="prose prose-sm prose-rose max-w-none"><ReactMarkdown>{message.text}</ReactMarkdown></div>}
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-rose-400 text-xs italic animate-pulse px-4">O Cupido está preparando a resposta...</div>}
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
                  <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"><X size={14} /></button>
                </div>
              )}
              <div className="flex items-center w-full gap-2">
                <input type="file" accept="image/*,.pdf,.txt,.docx" ref={fileInputRef} onChange={(event) => { const file = event.target.files[0]; if (file) { setSelectedFile(file); if (file.type.startsWith('image/')) { setFilePreview(URL.createObjectURL(file)); } else { setFilePreview(null); } } }} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="text-rose-400 p-2 rounded-full hover:bg-rose-100"><ImageIcon size={24} /></button>
                <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && handleSend()} placeholder="Fale com o Cupido..." className="flex-1 bg-transparent border-none px-2 py-2 text-sm focus:outline-none" />
                <button onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFile)} className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all flex-shrink-0"><Send size={20} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-rose-300 font-serif"><Bot size={64} className="mb-4 opacity-50" /><p>Crie uma conversa para começar.</p></div>
        )}
      </div>
    </div>
  );
}
