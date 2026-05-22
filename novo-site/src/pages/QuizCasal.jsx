import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, RotateCcw, Trophy } from 'lucide-react';

const questions = [
  {
    question: 'Qual é a data do início do nosso namoro?',
    options: ['23/09/2023', '06/07/2023', '12/06/2023', '24/09/2023'],
    answer: '23/09/2023',
  },
  {
    question: 'Quem ama mais?',
    options: ['Pablo', 'Ana', 'Os dois empatados', 'Impossível medir esse amor'],
    answer: 'Impossível medir esse amor',
  },
  {
    question: 'Qual é o melhor plano para um dia perfeito?',
    options: ['Filme e abraço', 'Passeio sem pressa', 'Comida boa', 'Tudo isso juntos'],
    answer: 'Tudo isso juntos',
  },
  {
    question: 'O que nunca pode faltar entre nós?',
    options: ['Carinho', 'Conversas sinceras', 'Risadas', 'Todas as anteriores'],
    answer: 'Todas as anteriores',
  },
];

const getFinalMessage = (score) => {
  if (score === questions.length) return 'Sintonia perfeita. Esse casal sabe demais.';
  if (score >= questions.length - 1) return 'Quase perfeito, com muito amor e um pouquinho de suspense.';
  if (score >= 2) return 'Foi bonito, mas ainda cabe um encontro de revisão.';
  return 'O amor é grande, o gabarito que lute. Bora jogar de novo.';
};

export default function QuizCasal() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const answerQuestion = (option) => {
    if (option === questions[current].answer) setScore((prev) => prev + 1);

    if (current + 1 === questions.length) {
      setFinished(true);
      return;
    }

    setCurrent((prev) => prev + 1);
  };

  const restart = () => {
    setCurrent(0);
    setScore(0);
    setFinished(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto py-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link to="/central" className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-full shadow-md text-rose-500 hover:scale-105 transition-transform">
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">
            Quiz do Casal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pontuação: {score}/{questions.length}</p>
        </div>
      </div>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 rounded-[2rem] p-6 sm:p-8 shadow-2xl">
        {finished ? (
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <div className="mx-auto mb-5 w-20 h-20 rounded-[2rem] bg-rose-100 text-rose-500 flex items-center justify-center">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Resultado: {score}/{questions.length}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{getFinalMessage(score)}</p>
            <button onClick={restart} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 shadow-lg transition-all">
              <RotateCcw className="w-5 h-5" />
              Jogar novamente
            </button>
          </motion.div>
        ) : (
          <motion.div key={current} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="rounded-full bg-rose-100 text-rose-600 px-4 py-1 text-xs font-bold">
                Pergunta {current + 1} de {questions.length}
              </span>
              <Heart className="w-6 h-6 text-rose-400 fill-current" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              {questions[current].question}
            </h2>
            <div className="grid gap-3">
              {questions[current].options.map((option) => (
                <button
                  key={option}
                  onClick={() => answerQuestion(option)}
                  className="text-left rounded-2xl bg-white/75 dark:bg-slate-900/50 border border-rose-100 dark:border-slate-700 px-5 py-4 text-slate-700 dark:text-slate-100 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-slate-900 transition-all"
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
