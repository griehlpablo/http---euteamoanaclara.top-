import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Camera, Loader2, Send, X } from "lucide-react";
import { callMilkaAI } from "../services/milkaAI";
import MilkaSuggestionList from "./MilkaSuggestionList";
import { extractJson, fileToBase64, QUICK_QUESTIONS } from "./milkaAssistantHelpers";

const SYSTEM_INSTRUCTION = "Você organiza os dados da Milka. Não diagnostique nem invente tratamento. Responda apenas JSON com answer e suggestions.";

export default function MilkaAssistant({ context, onConfirm, onStatus }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const imageRef = useRef(null);

  const ask = async (customPrompt = null) => {
    const promptText = String(customPrompt ?? input).trim();
    if (!promptText && !image) {
      onStatus("Escreva uma pergunta ou selecione uma foto.");
      return;
    }
    const userText = promptText || "Analise esta imagem sobre a Milka.";
    const nextMessages = [...messages, { role: "user", text: userText }];
    setMessages(nextMessages);
    setSuggestions([]);
    setLoading(true);
    try {
      const result = await callMilkaAI({
        history: messages,
        systemInstruction: SYSTEM_INSTRUCTION,
        prompt: `Contexto da Milka: ${JSON.stringify(context)}. Mensagem: ${userText}. Cada sugestão pode ter kind, type, action, title, details, date, nextDate e weightKg.`,
        base64Image: image ? await fileToBase64(image) : null,
        mimeType: image?.type || null,
      });
      const parsed = extractJson(result.text);
      setMessages([...nextMessages, { role: "assistant", text: parsed?.answer || result.text }]);
      setSuggestions(Array.isArray(parsed?.suggestions) ? parsed.suggestions.slice(0, 8) : []);
      setInput("");
      setImage(null);
      if (imageRef.current) imageRef.current.value = "";
    } catch (error) {
      const text = error?.code === "MISSING_GEMINI_KEY"
        ? "A IA está instalada, mas falta cadastrar GEMINI_API_KEY nas variáveis da Vercel e fazer um redeploy."
        : `Não consegui consultar a IA agora: ${error.message}`;
      setMessages([...nextMessages, { role: "assistant", text }]);
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (item, index) => {
    const saved = await onConfirm(item);
    if (saved !== false) setSuggestions((current) => current.filter((_, i) => i !== index));
  };
  const discard = (index) => setSuggestions((current) => current.filter((_, i) => i !== index));

  return (
    <section className="rounded-[2rem] border border-violet-100 bg-violet-50/80 p-5 shadow-xl dark:border-violet-900 dark:bg-slate-800/80">
      <div className="flex items-start gap-3"><div className="rounded-2xl bg-violet-600 p-3 text-white"><Bot /></div><div><h2 className="font-serif text-2xl font-bold">Assistente da Milka</h2><p className="text-sm text-slate-500">Tira dúvidas, lê rótulos, calcula porções e prepara registros para você revisar.</p></div></div>
      <div className="mt-4 flex flex-wrap gap-2">{QUICK_QUESTIONS.map((text) => <button key={text} type="button" disabled={loading} onClick={() => ask(text)} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-violet-700 shadow-sm dark:bg-slate-900 dark:text-violet-300">{text}</button>)}</div>
      {messages.length > 0 && <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-white/75 p-4 dark:bg-slate-900/60">{messages.slice(-8).map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-2xl p-3 text-sm ${message.role === "user" ? "ml-8 bg-violet-600 text-white" : "mr-8 bg-violet-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}><ReactMarkdown>{message.text}</ReactMarkdown></div>)}</div>}
      <MilkaSuggestionList suggestions={suggestions} onConfirm={confirm} onDiscard={discard} />
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ex.: Registre uma informação sobre a Milka hoje." className="min-h-24 rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-300 dark:border-slate-700 dark:bg-slate-900" />
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(event) => setImage(event.target.files?.[0] || null)} />
        <button type="button" onClick={() => imageRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-violet-700 dark:bg-slate-900"><Camera size={18} />{image ? "Foto pronta" : "Enviar foto"}</button>
        <button type="button" disabled={loading} onClick={() => ask()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}{loading ? "Pensando..." : "Perguntar"}</button>
      </div>
      {image && <div className="mt-2 flex items-center gap-2 text-xs text-violet-700"><span>{image.name}</span><button type="button" onClick={() => { setImage(null); if (imageRef.current) imageRef.current.value = ""; }}><X size={15} /></button></div>}
      <p className="mt-3 text-xs text-slate-500">Revise as respostas; nada é registrado sem sua confirmação.</p>
    </section>
  );
}
