import { motion } from 'framer-motion';
import { BookOpen, Heart, MessageCircle, Coffee } from 'lucide-react';

const ARTICLES = [
  {
    id: 1,
    title: '5 Ideias de Encontros Criativos (e Baratos) para Sair da Rotina',
    icon: <Coffee className="w-5 h-5 text-amber-600" />,
    date: '10 Junho, 2026',
    content: `Sair da rotina não precisa significar gastar uma fortuna em restaurantes caros. Às vezes, os momentos mais inesquecíveis nascem da simplicidade. Uma excelente ideia é organizar um piquenique em um parque local. Preparem juntos alguns sanduíches, levem uma toalha confortável e uma playlist relaxante. Outra opção é a "Noite do Chef em Casa": escolham uma receita nova no YouTube que nenhum dos dois saiba fazer, comprem os ingredientes e encarem o desafio juntos na cozinha. A diversão está nos erros e nos acertos. Além disso, uma maratona temática de filmes (com direito a pipoca e cabana de lençóis na sala) ou um passeio de bicicleta pela cidade ao entardecer rendem memórias incríveis e fortalecem a conexão do casal.`,
  },
  {
    id: 2,
    title: 'A Arte da Comunicação: Como Conversar sobre o Futuro Sem Pressão',
    icon: <MessageCircle className="w-5 h-5 text-cyan-600" />,
    date: '12 Junho, 2026',
    content: `Um dos pilares mais essenciais de qualquer relacionamento duradouro é a comunicação transparente. No entanto, falar sobre o futuro (morar junto, carreira, finanças) pode gerar ansiedade. O segredo é abordar esses temas de forma natural e sem cobranças. Comece compartilhando seus próprios sonhos individuais e pergunte como o seu parceiro se vê nos próximos anos. Pratique a escuta ativa: ouça para entender, não apenas para responder. É fundamental criar um ambiente seguro onde ambos sintam que suas vulnerabilidades são respeitadas. Em vez de fazer planos rígidos de imediato, tratem o futuro como uma tela em branco que vocês estão pintando juntos, ajustando as pinceladas conforme a vida acontece. Um casal que alinha suas expectativas tem muito mais chances de superar qualquer obstáculo.`,
  },
  {
    id: 3,
    title: 'Presentes com Significado: Por que Experiências Valem Mais',
    icon: <Heart className="w-5 h-5 text-rose-600" />,
    date: '15 Junho, 2026',
    content: `Vivemos em uma era de consumo acelerado, onde é fácil clicar em um botão e comprar um presente material. Mas a ciência e a psicologia apontam que presentes baseados em "experiências" trazem uma felicidade muito mais duradoura. Quando você presenteia seu amor com ingressos para um show, uma viagem de fim de semana, ou até mesmo um workshop para aprenderem algo novo juntos, você não está dando um objeto que vai ficar na estante; você está dando uma lembrança. As experiências nos unem, geram histórias para contar e piadas internas que só o casal entende. Da próxima vez que houver uma data comemorativa, pense menos na vitrine do shopping e mais em como vocês podem passar um tempo de qualidade ininterrupto construindo memórias que o tempo não pode apagar.`,
  }
];

export default function Blog() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-8 pb-16 px-4">
      <section className="text-center space-y-4 pt-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-rose-700">
          <BookOpen className="h-4 w-4" /> Dicas e Inspirações
        </div>
        <h1 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">Blog do Casal</h1>
        <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Artigos, reflexões e dicas para fortalecer o relacionamento, sair da rotina e construir um futuro incrível juntos.
        </p>
      </section>

      <div className="space-y-8">
        {ARTICLES.map((article) => (
          <article key={article.id} className="rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-xl backdrop-blur-xl md:p-8 transition-all hover:bg-white/80">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                {article.icon}
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-900 leading-tight">
                  {article.title}
                </h2>
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {article.date}
                </span>
              </div>
            </div>
            <div className="prose prose-slate prose-p:leading-8 text-slate-700 max-w-none">
              <p>{article.content}</p>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
}
