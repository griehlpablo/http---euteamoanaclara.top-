import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Gift, Loader2, Sparkles, Ticket } from 'lucide-react';
import { supabase } from '../supabase';
import { callGeminiAPI } from '../services/gemini';

const STORAGE_PREFIX = 'surpresaDiaria';
const MISSION_PREFIX = 'surpresaMissaoCumprida';

const fallbackSurprises = [
  {
    tipo: 'missao',
    titulo: 'Mandar uma foto aleatória agora',
    descricao: 'Escolham uma foto do dia e mandem um para o outro sem explicar muito. Só carinho.',
    recompensa: 'Um sorriso imediato',
  },
  {
    tipo: 'cupom',
    titulo: 'Vale abraço demorado',
    descricao: 'Cupom válido para um abraço sem pressa, daqueles que reorganizam o mundo.',
    recompensa: 'Abraço premium',
  },
  {
    tipo: 'desafio',
    titulo: '10 minutos sem celular',
    descricao: 'Fiquem 10 minutos conversando olhando um para o outro, sem tela no meio.',
    recompensa: 'Mais presença',
  },
  {
    tipo: 'frase',
    titulo: 'Vocês dois são time',
    descricao: 'Hoje é dia de lembrar que vocês dois são time, abrigo e escolha bonita.',
  },
  {
    tipo: 'lembranca',
    titulo: 'Foto antiga, sentimento novo',
    descricao: 'Escolham uma foto antiga e contem o que sentiram naquele dia.',
    recompensa: 'Uma memória reacendida',
  },
];

const typeLabels = {
  missao: 'Missão',
  cupom: 'Cupom',
  frase: 'Frase',
  desafio: 'Desafio',
  lembranca: 'Lembrança',
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const pickFallback = () => fallbackSurprises[new Date().getDate() % fallbackSurprises.length];

const parseSurprise = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : cleaned);

  return {
    tipo: parsed.tipo || parsed.type || 'frase',
    titulo: parsed.titulo || parsed.title || 'Surpresa do dia',
    descricao: parsed.descricao || parsed.description || cleaned,
    recompensa: parsed.recompensa || parsed.reward || '',
  };
};

export default function SurpresaDiaria() {
  const [date] = useState(todayKey);
  const storageKey = `${STORAGE_PREFIX}:${date}`;
  const missionKey = `${MISSION_PREFIX}:${date}`;
  const [surprise, setSurprise] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);

    const fallback = pickFallback();
    localStorage.setItem(storageKey, JSON.stringify(fallback));
    return fallback;
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [missionDone, setMissionDone] = useState(() => localStorage.getItem(missionKey) === 'true');

  const saveSurprise = (nextSurprise) => {
    localStorage.setItem(storageKey, JSON.stringify(nextSurprise));
    setSurprise(nextSurprise);
    setMessage('');
  };

  const generateWithAI = async (force = false) => {
    if (force && !window.confirm('Gerar outra surpresa para hoje? A atual será substituída.')) return;

    setLoading(true);
    setMessage('');

    try {
      const prompt = `Crie uma surpresa romântica curta para Pablo e Ana Clara hoje. Eles ficaram em 06/07/2023 e namoram desde 23/09/2023. Responda somente em JSON válido com as chaves: tipo, titulo, descricao, recompensa. Tipo deve ser um destes: missao, cupom, frase, desafio, lembranca.`;
      const result = await callGeminiAPI([], prompt, null, null, {
        systemInstruction: 'Você cria pequenas surpresas românticas, doces e práticas para um casal. Responda somente JSON válido, sem markdown.',
      });
      const nextSurprise = parseSurprise(result.text);
      saveSurprise(nextSurprise);
    } catch (error) {
      console.error('Erro ao gerar surpresa com IA:', error);
      saveSurprise(pickFallback());
      setMessage('A IA descansou um pouquinho, então escolhi uma surpresa especial daqui mesmo.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsCoupon = async () => {
    if (!surprise) return;

    try {
      const { error } = await supabase.from('cupons').insert([{
        title: surprise.titulo,
        description: surprise.descricao,
        reward: surprise.recompensa || '',
        redeemed: false,
        source: 'surpresa-diaria',
        createdAt: new Date().toISOString(),
      }]);
      if (error) throw error;
      setMessage('Cupom salvo na página de Cupons.');
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      setMessage('Não consegui salvar no Supabase agora. A surpresa continua salva aqui para hoje.');
    }
  };

  const markMissionDone = () => {
    localStorage.setItem(missionKey, 'true');
    setMissionDone(true);
    setMessage('Missão marcada como cumprida hoje.');
  };

  const type = surprise?.tipo || 'frase';
  const canSaveCoupon = type === 'cupom';
  const canCompleteMission = type === 'missao' || type === 'desafio';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link to="/central" className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-full shadow-md text-rose-500 hover:scale-105 transition-transform">
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-end gap-2">
            Surpresa Diária <Sparkles className="text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Uma ideia nova para deixar o dia mais de vocês.</p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-hidden relative">
        <motion.div
          key={surprise?.titulo}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="flex items-center justify-between gap-4 mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 text-rose-600 px-4 py-2 text-xs font-bold uppercase tracking-widest">
              <Gift className="w-4 h-4" />
              {typeLabels[type] || typeLabels.frase}
            </span>
            <span className="text-xs text-slate-400 font-bold">{date.split('-').reverse().join('/')}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {surprise?.titulo}
          </h2>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300 mb-5">
            {surprise?.descricao}
          </p>

          {surprise?.recompensa && (
            <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-slate-900/60 border border-rose-100 dark:border-slate-700 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
              Recompensa: {surprise.recompensa}
            </div>
          )}

          {message && (
            <p className="mb-5 rounded-2xl bg-white/70 dark:bg-slate-900/40 px-4 py-3 text-sm text-slate-500 dark:text-slate-300">
              {message}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => generateWithAI(false)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4 text-white font-bold shadow-lg hover:from-rose-600 hover:to-pink-600 disabled:opacity-60 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Gerar surpresa com IA
            </button>
            <button
              onClick={() => generateWithAI(true)}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-rose-100 dark:border-slate-700 px-5 py-4 text-rose-500 font-bold hover:bg-rose-50 transition-all disabled:opacity-60"
            >
              Gerar outra
            </button>
          </div>

          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {canSaveCoupon && (
              <button onClick={saveAsCoupon} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-100 text-rose-600 px-5 py-4 font-bold hover:bg-rose-200 transition-all">
                <Ticket className="w-5 h-5" />
                Salvar como cupom
              </button>
            )}
            {canCompleteMission && (
              <button
                onClick={markMissionDone}
                disabled={missionDone}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 text-emerald-700 px-5 py-4 font-bold hover:bg-emerald-200 disabled:opacity-60 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                {missionDone ? 'Cumprida hoje' : 'Marcar como cumprida hoje'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
