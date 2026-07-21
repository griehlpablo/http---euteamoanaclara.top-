import { useState } from "react";
import { HeartPulse, Plus } from "lucide-react";
import { RECORD_TYPES, todayKey } from "./config";

const emptyRecord = () => ({
  type: "vaccine",
  title: "",
  date: todayKey(),
  details: "",
  nextDate: "",
});

export default function MilkaRecordCard({ person, saving, onSave }) {
  const [record, setRecord] = useState(emptyRecord);
  const update = (field, value) => setRecord((current) => ({ ...current, [field]: value }));
  const submit = async () => {
    const saved = await onSave({ ...record, person });
    if (saved) setRecord(emptyRecord());
  };

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
      <h2 className="flex items-center gap-2 font-serif text-2xl font-bold">
        <HeartPulse className="text-rose-500" /> Novo registro de saúde
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select value={record.type} onChange={(event) => update("type", event.target.value)} className="rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900">
          {Object.entries(RECORD_TYPES).filter(([key]) => key !== "weight").map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}
        </select>
        <input type="date" value={record.date} onChange={(event) => update("date", event.target.value)} className="rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900" />
        <input value={record.title} onChange={(event) => update("title", event.target.value)} placeholder="Ex.: V4, vermífugo X ou consulta" className="rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900 sm:col-span-2" />
        <textarea value={record.details} onChange={(event) => update("details", event.target.value)} placeholder="Lote, clínica, reação, observações..." className="min-h-20 rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900 sm:col-span-2" />
        <label className="text-xs font-bold text-slate-500 sm:col-span-2">PRÓXIMA DATA, CASO TENHA
          <input type="date" value={record.nextDate} onChange={(event) => update("nextDate", event.target.value)} className="mt-1 w-full rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900" />
        </label>
      </div>
      <button type="button" disabled={saving} onClick={submit} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
        <Plus size={18} /> Adicionar ao prontuário
      </button>
    </div>
  );
}
