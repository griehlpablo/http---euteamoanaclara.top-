import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Circle,
  Coffee,
  Printer,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "framer-motion";

const STORAGE_KEY = "cardapio-final-22-31-julho-2026-v2";

const DAYS = [
  {
    date: "2026-07-22",
    label: "22/07 · quarta-feira",
    meals: [
      {
        id: "22-almoco",
        name: "Almoço",
        text: "Bifes acebolados, arroz, feijão e brócolis.",
        detail: "Usar 1 pacote de bifes e metade de uma cabeça de brócolis.",
      },
      {
        id: "22-jantar",
        name: "Jantar",
        text: "Omelete com arroz e salada.",
        detail: "Omelete simples com 2 ovos; aproveitar pepino ou repolho.",
      },
    ],
    note: "Separar o feijão que não será usado e congelar.",
  },
  {
    date: "2026-07-23",
    label: "23/07 · quinta-feira",
    meals: [
      {
        id: "23-almoco",
        name: "Almoço",
        text: "Sassami grelhado com alho, arroz e pepino.",
        detail: "Retirar apenas os filés necessários do pacote congelado.",
      },
      {
        id: "23-jantar",
        name: "Jantar",
        text: "Sassami acebolado, arroz e repolho refogado.",
        detail: "Dourar o frango; não fazer ensopado.",
      },
    ],
    note: "Usar aproximadamente metade do pacote de sassami no total do dia.",
  },
  {
    date: "2026-07-24",
    label: "24/07 · sexta-feira",
    meals: [
      {
        id: "24-almoco",
        name: "Almoço",
        text: "2 ossobucos cozidos, arroz, feijão e cenoura.",
        detail: "Cozinhar lentamente com alho e cebola para formar bastante caldo.",
      },
      {
        id: "24-jantar",
        name: "Jantar",
        text: "Arroz de panela com carne desfiada.",
        detail: "Aproveitar a carne e o caldo do almoço com um pouco de repolho.",
      },
    ],
    note: "Guardar 1 ossobuco para o aniversário e 1 para o dia 29.",
  },
  {
    date: "2026-07-25",
    label: "25/07 · sábado · aniversário do Pablo",
    special: true,
    meals: [
      {
        id: "25-almoco",
        name: "Almoço",
        text: "Almoço leve com sobras ou arroz com ovo.",
        detail: "Poupar apetite e ingredientes para o jantar especial.",
      },
      {
        id: "25-jantar",
        name: "Jantar",
        text: "Risoto de funghi com ossobuco desfiado.",
        detail: "Usar 1 ossobuco. Finalizar o risoto com manteiga e parmesão.",
      },
    ],
    note: "O vinho de casa só entra no risoto se for branco e seco.",
  },
  {
    date: "2026-07-26",
    label: "26/07 · domingo",
    meals: [
      {
        id: "26-almoco",
        name: "Almoço",
        text: "Creme de batata com costela desfiada.",
        detail: "Usar 8 batatas pequenas. Amassar com caldo da costela e leite ou creme.",
      },
      {
        id: "26-jantar",
        name: "Jantar",
        text: "Repetir o creme com costela.",
        detail: "Preparar quantidade suficiente para as duas refeições.",
      },
    ],
    note: "Não usar batatas em outros pratos antes deste dia.",
  },
  {
    date: "2026-07-27",
    label: "27/07 · segunda-feira",
    meals: [
      {
        id: "27-almoco",
        name: "Almoço",
        text: "Fígado acebolado, arroz, feijão e repolho.",
        detail: "Usar os 2 fígados e bastante cebola.",
      },
      {
        id: "27-jantar",
        name: "Jantar",
        text: "Arroz com atum e salada de pepino.",
        detail: "Usar a lata de atum e o pepino restante.",
      },
    ],
    note: "Consumir primeiro os legumes já cortados ou mais maduros.",
  },
  {
    date: "2026-07-28",
    label: "28/07 · terça-feira",
    meals: [
      {
        id: "28-almoco",
        name: "Almoço",
        text: "Sassami dourado com shoyu, arroz e brócolis.",
        detail: "Usar o restante do sassami e da segunda cabeça de brócolis.",
      },
      {
        id: "28-jantar",
        name: "Jantar",
        text: "Sobras do sassami com arroz e salada.",
        detail: "Reaquecer rapidamente para não ressecar.",
      },
    ],
    note: "O shoyu já salga: provar antes de acrescentar sal.",
  },
  {
    date: "2026-07-29",
    label: "29/07 · quarta-feira",
    meals: [
      {
        id: "29-almoco",
        name: "Almoço",
        text: "Ossobuco com 3 batatas, arroz e cenoura.",
        detail: "Usar o último ossobuco e todas as batatas restantes.",
      },
      {
        id: "29-jantar",
        name: "Jantar",
        text: "Carne desfiada com arroz e caldo.",
        detail: "Aproveitar completamente o caldo do cozimento.",
      },
    ],
    note: "As batatas já estarão totalmente utilizadas depois desta refeição.",
  },
  {
    date: "2026-07-30",
    label: "30/07 · quinta-feira",
    meals: [
      {
        id: "30-almoco",
        name: "Almoço",
        text: "Carne moída com repolho e cenoura, acompanhada de arroz.",
        detail: "Os 250 g rendem mais quando misturados aos legumes.",
      },
      {
        id: "30-jantar",
        name: "Jantar",
        text: "Omelete com arroz.",
        detail: "Usar 2 ou 3 ovos, conforme a quantidade restante.",
      },
    ],
    note: "Pode transformar as sobras do almoço em mexidão.",
  },
  {
    date: "2026-07-31",
    label: "31/07 · sexta-feira",
    meals: [
      {
        id: "31-almoco",
        name: "Almoço",
        text: "Bifes acebolados, arroz e legumes restantes.",
        detail: "Usar 1 pacote de bifes. Os demais ficam como reserva.",
      },
      {
        id: "31-jantar",
        name: "Jantar",
        text: "Noite de aproveitar as sobras.",
        detail: "Montar os pratos com o que restar antes de abrir novos alimentos.",
      },
    ],
    note: "Depois do pagamento, conferir o que sobrou antes da próxima compra.",
  },
];

const SHOPPING = [
  { id: "buy-funghi", text: "30 a 40 g de funghi seco." },
  { id: "buy-arroz", text: "250 g de arroz arbóreo ou carnaroli." },
  { id: "buy-parmesao", text: "80 a 100 g de parmesão." },
  { id: "buy-manteiga", text: "1 pacote pequeno de manteiga." },
  { id: "buy-vinho", text: "Vinho branco seco, caso o atual não seja branco e seco." },
  { id: "buy-leite", text: "Leite ou 1 caixa de creme de leite." },
];

const readChecks = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

export default function Cardapio() {
  const [checks, setChecks] = useState(readChecks);
  const today = localToday();

  const allItems = useMemo(
    () => [...DAYS.flatMap((day) => day.meals), ...SHOPPING],
    [],
  );
  const completed = allItems.filter((item) => checks[item.id]).length;
  const progress = allItems.length
    ? Math.round((completed / allItems.length) * 100)
    : 0;

  const toggle = (id) => {
    setChecks((previous) => {
      const next = { ...previous, [id]: !previous[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl py-6"
    >
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          to="/central"
          className="rounded-full bg-white/70 p-3 text-emerald-700 shadow-md transition-transform hover:scale-105 dark:bg-slate-800/70"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-800/70 dark:text-emerald-300/70">
            Pablo & Ana · planejamento de refeições
          </p>
          <h1 className="flex items-center justify-end gap-2 font-serif text-3xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
            Cardápio até o pagamento
            <UtensilsCrossed className="text-emerald-700" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            De 22 a 31 de julho · para duas pessoas
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white/80 to-amber-50/80 p-5 shadow-xl dark:border-emerald-900/40 dark:from-slate-800/90 dark:via-slate-900/80 dark:to-emerald-950/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ChefHat />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
                Marquem cada refeição depois de comer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Marquem também os itens comprados para o aniversário e a costela.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-bold text-white"
          >
            <Printer size={18} /> Imprimir
          </button>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/80 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          {completed} de {allItems.length} itens marcados · {progress}%
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {DAYS.map((day) => (
          <article
            key={day.date}
            className={`rounded-[2rem] border p-5 shadow-lg backdrop-blur-xl ${
              day.special
                ? "border-orange-300 bg-orange-50/85 dark:border-orange-800 dark:bg-orange-950/30"
                : day.date === today
                  ? "border-emerald-400 bg-emerald-50/90 dark:border-emerald-700 dark:bg-emerald-950/30"
                  : "border-white/70 bg-white/70 dark:border-slate-700 dark:bg-slate-800/70"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                className={`font-serif text-xl font-bold ${
                  day.special
                    ? "text-orange-800 dark:text-orange-300"
                    : "text-emerald-800 dark:text-emerald-300"
                }`}
              >
                {day.label}
              </h2>
              {day.date === today && (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  Hoje
                </span>
              )}
            </div>
            <div className="space-y-3">
              {day.meals.map((meal) => (
                <CheckRow
                  key={meal.id}
                  checked={Boolean(checks[meal.id])}
                  onClick={() => toggle(meal.id)}
                  title={meal.name}
                  text={meal.text}
                  detail={meal.detail}
                />
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-stone-100/90 px-4 py-3 text-xs leading-relaxed text-stone-700 dark:bg-slate-950/35 dark:text-slate-300">
              {day.note}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-orange-200 bg-orange-50/85 p-5 shadow-xl dark:border-orange-900/50 dark:bg-orange-950/25">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 text-orange-700 shadow-sm dark:bg-slate-900">
              <ShoppingCart />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-orange-900 dark:text-orange-300">
                Compras para o aniversário e a costela
              </h2>
              <p className="text-xs text-orange-800/70 dark:text-orange-300/70">
                Marque cada item depois de comprar.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {SHOPPING.map((item) => (
              <CheckRow
                key={item.id}
                checked={Boolean(checks[item.id])}
                onClick={() => toggle(item.id)}
                text={item.text}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-emerald-50/80 p-5 shadow-xl dark:border-emerald-900/50 dark:bg-emerald-950/25">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm dark:bg-slate-900">
              <Coffee />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                Controle das 11 batatas
              </h2>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">
                As 3 batatas restantes ficam reservadas para o ossobuco do dia 29.
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2" aria-label="Onze batatas planejadas">
            {Array.from({ length: 11 }, (_, index) => (
              <span
                key={index}
                className={`h-8 w-8 rounded-[45%] border-2 ${
                  index < 8
                    ? "border-orange-300 bg-orange-200 dark:border-orange-700 dark:bg-orange-900/60"
                    : "border-dashed border-emerald-400 bg-white/60 dark:bg-slate-900/50"
                }`}
                title={index < 8 ? "Creme com costela" : "Ossobuco do dia 29"}
              />
            ))}
          </div>

          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            8 para o creme com costela · 3 para o ossobuco do dia 29
          </p>
          <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm leading-relaxed text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
            <strong>Café e lanches:</strong> frutas, iogurte e tapioca com banana ou com alguma carne desfiada. A tapioca não precisa entrar como jantar e não será combinada com ovo.
          </p>
        </section>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
        Planejado com o que já há em casa.
      </p>
    </motion.div>
  );
}

function CheckRow({ checked, onClick, title = "", text, detail = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
        checked
          ? "bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
          : "bg-white/70 text-slate-700 hover:bg-white dark:bg-slate-900/40 dark:text-slate-200"
      }`}
    >
      {checked ? (
        <CheckCircle2
          className="mt-0.5 shrink-0 text-emerald-600"
          size={20}
        />
      ) : (
        <Circle className="mt-0.5 shrink-0 text-slate-300" size={20} />
      )}
      <span className={checked ? "line-through opacity-75" : ""}>
        {title && (
          <strong className="mr-1 block text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
            {title}
          </strong>
        )}
        <span className="font-semibold">{text}</span>
        {detail && (
          <span className="mt-1 block text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
            {detail}
          </span>
        )}
      </span>
    </button>
  );
}
