import { formatDate, todayKey } from "./config";

export default function MilkaSuggestionList({ suggestions, onConfirm, onDiscard }) {
  if (!suggestions.length) return null;
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-bold uppercase text-violet-700">Confira antes de registrar</p>
      {suggestions.map((item, index) => (
        <div key={`${item.title}-${index}`} className="flex flex-col gap-3 rounded-2xl bg-white p-4 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-bold">{item.title || "Registro sugerido"}</p>
            <p className="text-xs text-slate-500">{item.details || "Sem observação"} · {formatDate(item.date || todayKey())}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => onConfirm(item, index)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Registrar</button>
            <button type="button" onClick={() => onDiscard(index)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold dark:bg-slate-800">Descartar</button>
          </div>
        </div>
      ))}
    </div>
  );
}
