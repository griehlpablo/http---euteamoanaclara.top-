import { useMemo, useState } from "react";
import { dryRecommendationByAge } from "./config";

export default function MilkaFeedingCard({ profile }) {
  const [sachets, setSachets] = useState(1);
  const [meals, setMeals] = useState(4);
  const feeding = useMemo(() => {
    const dryOnly = dryRecommendationByAge(profile.estimatedAgeMonths);
    const dryGrams = Math.max(0, Math.round((dryOnly - Number(sachets) * 18) * 10) / 10);
    const perMeal = Math.round((dryGrams / Math.max(1, Number(meals))) * 10) / 10;
    const tablespoons = Math.round((((dryGrams / 84) * 200) / 15) * 10) / 10;
    return { dryOnly, dryGrams, perMeal, tablespoons };
  }, [meals, profile.estimatedAgeMonths, sachets]);

  return (
    <section className="rounded-[2rem] border border-amber-100 bg-amber-50/85 p-5 shadow-xl dark:border-amber-900/60 dark:bg-slate-800/80">
      <h2 className="font-serif text-2xl font-bold">Calculadora de alimentação</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Baseada na tabela da ração e na equivalência informada no sachê.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 dark:bg-slate-900"><p className="text-xs font-bold text-amber-700">IDADE</p><p className="text-xl font-bold">{profile.estimatedAgeMonths} meses</p></div>
        <label className="text-xs font-bold text-slate-500">SACHÊS POR DIA
          <select value={sachets} onChange={(event) => setSachets(Number(event.target.value))} className="mt-1 w-full rounded-xl bg-white px-3 py-3 text-sm dark:bg-slate-900"><option value="0">Nenhum</option><option value="0.5">Meio sachê</option><option value="1">1 sachê</option><option value="2">2 sachês</option></select>
        </label>
        <label className="text-xs font-bold text-slate-500">REFEIÇÕES
          <input type="number" min="2" max="6" value={meals} onChange={(event) => setMeals(Number(event.target.value))} className="mt-1 w-full rounded-xl bg-white px-3 py-3 text-sm dark:bg-slate-900" />
        </label>
        <div className="rounded-2xl bg-white p-4 dark:bg-slate-900"><p className="text-xs font-bold text-amber-700">RESULTADO DIÁRIO</p><p className="text-xl font-bold">{feeding.dryGrams} g + {sachets} sachê(s)</p><p className="text-xs text-slate-500">≈ {feeding.perMeal} g de ração por refeição</p></div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Sem sachê, o rótulo indica {feeding.dryOnly} g/dia para a idade registrada. Cada sachê substitui aproximadamente 18 g de ração. O total equivale a cerca de {feeding.tablespoons} colheres medidoras de sopa rasas. Ajuste com o veterinário e pela condição corporal.</p>
    </section>
  );
}
