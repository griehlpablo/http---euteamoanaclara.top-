import { useEffect, useState } from "react";
import { Save, Scale } from "lucide-react";
import { formatKg, parseNumber, todayKey } from "./config";

export default function MilkaWeightCard({ profile, person, saving, onSave }) {
  const [weight, setWeight] = useState("1,5");
  const [age, setAge] = useState("5");
  const [date, setDate] = useState(todayKey());

  useEffect(() => {
    setWeight(String(profile.weightKg || 1.5).replace(".", ","));
    setAge(String(profile.estimatedAgeMonths || 5));
  }, [profile.estimatedAgeMonths, profile.weightKg]);

  const submit = async () => {
    await onSave({
      weightKg: parseNumber(weight),
      ageMonths: parseNumber(age),
      date,
      person,
    });
  };

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
        <Scale className="text-emerald-600" /> Peso e idade atual
      </h2>
      <p className="mt-1 text-sm text-slate-500">Peso salvo: {formatKg(profile.weightKg)}.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold text-slate-500">PESO (KG)
          <input value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="1,5" className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900" />
        </label>
        <label className="text-xs font-bold text-slate-500">IDADE (MESES)
          <input type="number" min="1" max="24" value={age} onChange={(event) => setAge(event.target.value)} className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900" />
        </label>
        <label className="text-xs font-bold text-slate-500">DATA
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900" />
        </label>
      </div>
      <button type="button" disabled={saving} onClick={submit} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        <Save size={18} /> Salvar peso e idade
      </button>
    </div>
  );
}
