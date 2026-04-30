import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, Image, Mail, MessageCircleHeart, ArrowLeft, 
  TrendingUp, GitMerge, Link as LinkIcon, Sparkles, 
  SmilePlus, CalendarHeart, Film, Music, CheckSquare, 
  HelpCircle, Gift, BellRing, Bot
} from 'lucide-react';

const cards = [
  { path: "/contagem", icon: Clock, title: "O Nosso Tempo", desc: "A contagem oficial." },
  { path: "/carta", icon: Mail, title: "Palavras para Ti", desc: "Tudo aquilo que sinto e guardo." },
  { path: "/galeria", icon: Image, title: "Nossas Memórias", desc: "Nossos melhores momentos." },
  { path: "/mensagens", icon: MessageCircleHeart, title: "Mural & Recados", desc: "Deixem lembretes e missões." },
  { path: "/retrospectiva", icon: Sparkles, title: "Retrospectiva", desc: "Nosso Spotify Wrapped." },
  { path: "/painel", icon: SmilePlus, title: "Satisfação", desc: "Nível de satisfação com o mozão." },
  { path: "/humor", icon: TrendingUp, title: "Humor", desc: "Histórico de humor do casal." },
  { path: "/genealogia", icon: GitMerge, title: "Dossiê Genealógico", desc: "Nossas origens e antepassados." },
  { path: "/links", icon: LinkIcon, title: "Links Úteis", desc: "Referências rápidas para nós." },
  { path: "/agenda", icon: CalendarHeart, title: "Nosso Calendário", desc: "Datas e combinados." },
  { path: "/videos", icon: Film, title: "Vídeos", desc: "Momentos gravados." },
  { path: "/musica", icon: Music, title: "Nossa Música", desc: "A trilha sonora do nosso amor." },
  { path: "/sonhos", icon: CheckSquare, title: "Lista de Sonhos", desc: "Nossa Bucket List." },
  { path: "/pote", icon: Gift, title: "Pote do Amor", desc: "Sorteie um motivo para amar." },
  { path: "/quiz", icon: HelpCircle, title: "Quiz do Casal", desc: "O quanto nos conhecemos?" },
  { path: "/notif", icon: BellRing, title: "Notificações", desc: "Lembretes e avisos." },
  { path: "/chatgpt", icon: Bot, title: "ChatGPT", desc: "Nosso assistente pessoal." },
];

export default function Central() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl font-bold mb-3 text-gray-800">O Nosso Espaço</h2>
        <p className="text-slate-500">Tudo o que construímos, guardado aqui com amor.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div key={card.path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Link to={card.path} className="block glass-panel p-6 rounded-3xl text-left hover:-translate-y-2 transition-transform duration-300 group h-full border border-transparent hover:border-brand-light">
              <div className="bg-brand-light w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-brand-dark group-hover:scale-110 transition-transform">
                <card.icon className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2 text-slate-800">{card.title}</h3>
              <p className="text-slate-500 text-xs mb-4">{card.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <Link to="/" className="text-slate-500 hover:text-brand transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
      </div>
    </motion.div>
  );
}