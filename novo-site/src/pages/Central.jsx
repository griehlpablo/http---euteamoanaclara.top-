import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, ImageIcon, MessageCircleHeart, ArrowLeft,
  TrendingUp, GitMerge, Link as LinkIcon, Sparkles,
  SmilePlus, Gift, Activity, Ticket, ListChecks,
  CalendarDays, Gamepad2, HeartPulse, WalletCards,
} from 'lucide-react';

const glassClasses = 'bg-white/60 backdrop-blur-lg border border-white/50 shadow-lg';

const cards = [
  { path: '/contagem', icon: Clock, title: 'O Nosso Tempo', desc: 'Contagem oficial desde o início.' },
  { path: '/linha-do-tempo', icon: CalendarDays, title: 'Linha do Tempo', desc: 'Os capítulos mais bonitos da nossa história.' },
  { path: '/quiz', icon: Gamepad2, title: 'Quiz do Casal', desc: 'Perguntas para testar a sintonia.' },
  { path: '/surpresa-diaria', icon: Gift, title: 'Surpresa Diária', desc: 'Uma missão, cupom ou carinho por dia.' },
  { path: '/dieta', icon: HeartPulse, title: 'Plano do Casal', desc: 'Dieta, rotina, treino e água do dia.' },
  { path: '/gastos.html?v=20260720-3', external: true, icon: WalletCards, title: 'Gastos do Casal', desc: 'Registre compras e acompanhe o total do mês.' },
  { path: '/galeria', icon: ImageIcon, title: 'Memórias', desc: 'Os nossos melhores momentos.' },
  { path: '/assistente', icon: Sparkles, title: 'Cupido Virtual ✨', desc: 'IA para dicas de encontros.' },
  { path: '/retrospectiva', icon: TrendingUp, title: 'Retrospectiva', desc: 'A nossa história em números.' },
  { path: '/satisfacao', icon: SmilePlus, title: 'Satisfação', desc: 'Como estamos hoje?' },
  { path: '/humor', icon: Activity, title: 'Radar de Humor', desc: 'Manual de sobrevivência diário.' },
  { path: '/mural', icon: MessageCircleHeart, title: 'Mural', desc: 'Recados e missões diárias.' },
  { path: '/genealogia', icon: GitMerge, title: 'Genealogia', desc: 'As suas raízes.' },
  { path: '/links', icon: LinkIcon, title: 'Links Úteis', desc: 'Acessos rápidos importantes.' },
  { path: '/capsula', icon: Clock, title: 'Cápsula do Tempo', desc: 'Mensagens para o futuro.' },
  { path: '/cupons', icon: Ticket, title: 'Cupons', desc: 'Recompensas especiais.' },
  { path: '/bucketlist', icon: ListChecks, title: 'Bucket List', desc: 'Nossos sonhos e metas.' },
  { path: '/potepapel', icon: MessageCircleHeart, title: 'Pote de Papel', desc: 'Mensagens doces aleatórias.' },
];

function CardContent({ card }) {
  return (
    <>
      <div className="bg-rose-50 dark:bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 text-rose-500 group-hover:scale-110 transition-transform group-hover:bg-rose-100 dark:group-hover:bg-slate-700">
        <card.icon className="w-7 h-7" />
      </div>
      <h3 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{card.title}</h3>
      <p className="text-slate-400 text-[11px] leading-relaxed">{card.desc}</p>
    </>
  );
}

export default function Central() {
  const cardClasses = `${glassClasses} dark:bg-slate-900/60 dark:border-slate-700 p-6 rounded-[2.5rem] hover:-translate-y-2 transition-transform block border border-transparent hover:border-rose-200 group`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 pt-6">
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl font-bold text-gray-800 dark:text-slate-100 mb-2">O Nosso Espaço</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Tudo o que construímos, guardado com amor.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
        {cards.map((card) => card.external ? (
          <a key={card.path} href={card.path} className={cardClasses}>
            <CardContent card={card} />
          </a>
        ) : (
          <Link key={card.path} to={card.path} className={cardClasses}>
            <CardContent card={card} />
          </Link>
        ))}
      </div>

      <div className="mt-12 flex items-center justify-center text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors text-xs font-bold uppercase tracking-widest bg-white/40 dark:bg-slate-900/40 px-6 py-3 rounded-full backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>
      </div>
    </motion.div>
  );
}
