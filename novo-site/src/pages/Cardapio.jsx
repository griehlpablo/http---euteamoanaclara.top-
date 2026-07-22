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

const STORAGE_KEY = "cardapio-22-31-julho-2026-v1";

const DAYS = [
  {
    date: "2026-07-22",
    label: "22/07 · quarta-feira",
    meals: [
      { id: "22-almoco", name: "Almoço", text: "1 pacote de bifes acebolados, arroz e 1 cabeça de brócolis." },
      { id: "22-jantar", name: "Jantar", text: "Tapioca com 2 ovos mexidos e salada de pepino." },
    ],
    prep: "Descongele apenas o pacote de bifes. Use o pepino e o brócolis primeiro.",
  },
  {
    date: "2026-07-23",
    label: "23/07 · quinta-feira",
    meals: [
      { id: "23-almoco", name: "Almoço", text: "Sassami ensopado, aproximadamente 500 g, com 4 batatas, cenoura, cebola e repolho." },
      { id: "23-jantar", name: "Jantar", text: "Repetir o ensopado com arroz." },
    ],
    prep: "Retire do pacote somente os sassamis necessários; não descongele o pacote inteiro.",
  },
  {
    date: "2026-07-24",
    label: "24/07 · sexta-feira",
    meals: [
      { id: "24-almoco", name: "Almoço", text: "Arroz, feijão, atum e salada de repolho com pepino." },
      { id: "24-jantar", name: "Jantar", text: "Omelete de 2 ovos com repolho refogado." },
    ],
    prep: "Deixe 1 ossobuco descongelando na geladeira para o jantar especial do dia seguinte.",
  },
  {
    date: "2026-07-25",
    label: "25/07 · sábado · aniversário",
    special: true,
    meals: [
      { id: "25-almoco", name: "Almoço", text: "1 pacote de bifes acebolados, arroz e cenoura ou repolho." },
      { id: "25-jantar", name: "Jantar", text: "Risoto de funghi com 1 ossobuco cozido, desfiado e incorporado ao risoto." },
    ],
    prep: "Cozinhe o ossobuco até ficar macio. Hidrate o funghi, use a água coada no caldo e finalize o risoto com parmesão.",
  },
  {
    date: "2026-07-26",
    label: "26/07 · domingo",
    meals: [
      { id: "26-almoco", name: "Almoço", text: "Creme de batatas com costela desfiada." },
      { id: "26-jantar", name: "Jantar", text: "Repetir o creme de batatas com costela desfiada; acompanhar com arroz, se necessário." },
    ],
    prep: "Cozinhe a costela até desmanchar. Cozinhe 5 batatas no caldo, amasse, ajuste com o caldo e misture a costela desfiada.",
  },
  {
    date: "2026-07-27",
    label: "27/07 · segunda-feira",
    meals: [
      { id: "27-almoco", name: "Almoço", text: "2 fígados acebolados, arroz, feijão e repolho." },
      { id: "27-jantar", name: "Jantar", text: "Tapioca com banana ou uma pequena sobra do almoço." },
    ],
    prep: "Descongele o fígado na geladeira e prepare apenas na hora da refeição.",
  },
  {
    date: "2026-07-28",
    label: "28/07 · terça-feira",
    meals: [
      { id: "28-almoco", name: "Almoço", text: "Sassami com shoyu, aproximadamente 500 g, brócolis, cenoura e arroz." },
      { id: "28-jantar", name: "Jantar", text: "Repetir o sassami com arroz." },
    ],
    prep: "Retire somente os sassamis necessários do pacote ainda congelado.",
  },
  {
    date: "2026-07-29",
    label: "29/07 · quarta-feira",
    meals: [
      { id: "29-almoco", name: "Almoço", text: "2 ossobucos cozidos com as 2 batatas restantes, arroz e repolho." },
      { id: "29-jantar", name: "Jantar", text: "Caldo do ossobuco com arroz e carne desfiada." },
    ],
    prep: "Descongele os 2 ossobucos na geladeira na noite anterior. O quarto ossobuco fica como reserva.",
  },
  {
    date: "2026-07-30",
    label: "30/07 · quinta-feira",
    meals: [
      { id: "30-almoco", name: "Almoço", text: "Carne moída com bastante repolho, cenoura e arroz." },
      { id: "30-jantar", name: "Jantar", text: "Tapioca com 2 ovos mexidos." },
    ],
    prep: "Use bastante repolho para os 250 g de carne moída renderem para os dois.",
  },
  {
    date: "2026-07-31",
    label: "31/07 · sexta-feira",
    meals: [
      { id: "31-almoco", name: "Almoço", text: "1 pacote de bifes acebolados, arroz e os legumes restantes." },
      { id: "31-jantar", name: "Jantar", text: "Sobras do almoço; se faltar, arroz com ovo ou tapioca." },
    ],
    prep: "Mantenha 1 pacote de bifes e 1 ossobuco como reserva até confirmar que não serão necessários antes.",
  },
];

const RISOTTO_SHOPPING = [
  { id: "buy-arroz", text: "300 g de arroz arbóreo ou carnaroli." },
  { id: "buy-funghi", text: "30 a 50 g de funghi secchi." },
  { id: "buy-parmesao", text: "100 g de queijo parmesão para ralar." },
  { id: "buy-manteiga", text: "Manteiga, caso não tenham em casa." },
  { id: "buy-caldo", text: "Caldo de legumes ou carne para cerca de 1 litro." },
  { id: "buy-vinho", text: "Vinho branco seco pequeno, somente se o vinho de casa não for branco e seco." },
];

const SNACKS = [
  { id: "snack-tapioca", text: "Tapioca pequena com banana amassada." },
  { id: "snack-iogurte", text: "Iogurte natural dividido com banana ou manga." },
  { id: "snack-fruta", text: "Maçã, manga ou banana como lanche." },
  { id: "snack-abacate", text: "Abacate temperado com sal ou usado na tapioca." },
  { id: "snack-sobras", text: "Usar sobras pequenas de frango ou carne como recheio." },
  { id: "snack-reserva", text: "Reserva prevista: 1 pacote de bifes, 1 ossobuco e 3 ovos." },
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
    () => [
      ...DAYS.flatMap((day) => day.meals),
      ...RISOTTO_SHOPPING,
      ...SNACKS,
    ],
    [],
  );
  const completed = allItems.filter((item) => checks[item.id]).length;
  const progress = allItems.length ? Math.round((completed / allItems.length) * 100) : 0;

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
          <h1 className="flex items-center justify-end gap-2 font-serif text-3xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
            Nosso Cardápio <UtensilsCrossed className="text-emerald-700" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            22 a 31 de julho · para duas pessoas
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
                Planejamento até o dia 31
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Marque cada refeição, compra ou opção de lanche conforme usar.
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
                ? "border-rose-300 bg-rose-50/85 dark:border-rose-800 dark:bg-rose-950/30"
                : day.date === today
                  ? "border-emerald-400 bg-emerald-50/90 dark:border-emerald-700 dark:bg-emerald-950/30"
                  : "border-white/70 bg-white/70 dark:border-slate-700 dark:bg-slate-800/70"
            }`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className={`font-serif text-xl font-bold ${day.special ? "text-rose-700 dark:text-rose-300" : "text-emerald-800 dark:text-emerald-300"}`}>
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
                />
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>Preparo:</strong> {day.prep}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-rose-100 bg-rose-50/80 p-5 shadow-xl dark:border-rose-900/50 dark:bg-rose-950/25">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-white p-3 text-rose-600 shadow-sm dark:bg-slate-900">
              <ShoppingCart />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-rose-800 dark:text-rose-300">
                Compras para o risoto · 25/07
              </h2>
              <p className="text-xs text-rose-700/70 dark:text-rose-300/70">
                Já há cebola, alho e 1 ossobuco em casa.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {RISOTTO_SHOPPING.map((item) => (
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
                Café, lanches e reserva
              </h2>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70">
                Consuma as frutas conforme amadurecerem.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {SNACKS.map((item) => (
              <CheckRow
                key={item.id}
                checked={Boolean(checks[item.id])}
                onClick={() => toggle(item.id)}
                text={item.text}
              />
            ))}
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
        Planejado para aproveitar primeiro os alimentos mais perecíveis e manter uma pequena reserva para imprevistos.
      </p>
    </motion.div>
  );
}

function CheckRow({ checked, onClick, title = "", text }) {
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
        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
      ) : (
        <Circle className="mt-0.5 shrink-0 text-slate-300" size={20} />
      )}
      <span className={checked ? "line-through opacity-75" : ""}>
        {title && <strong className="mr-1 uppercase">{title}:</strong>}
        {text}
      </span>
    </button>
  );
}
