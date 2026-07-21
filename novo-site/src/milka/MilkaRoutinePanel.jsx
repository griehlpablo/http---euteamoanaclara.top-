import { useEffect, useState } from "react";
import { Clock3, PawPrint, Save, ShoppingBag } from "lucide-react";
import { ACTIONS, PEOPLE } from "./config";

export default function MilkaRoutinePanel({
  schedules,
  savingAction,
  savingSchedule,
  onRegister,
  onSaveSchedules,
}) {
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState(schedules);

  useEffect(() => {
    setDraft(schedules);
  }, [schedules]);

  const update = (id, changes) =>
    setDraft((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const togglePerson = (id, name) =>
    setDraft((current) => current.map((item) => {
      if (item.id !== id) return item;
      const notify = Array.isArray(item.notify) ? item.notify : [];
      return {
        ...item,
        notify: notify.includes(name)
          ? notify.filter((personName) => personName !== name)
          : [...notify, name],
      };
    }));

  const register = async (action) => {
    const saved = await onRegister(action, note.trim());
    if (saved) setNote("");
  };

  return (
    <>
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
        <div className="mb-5 flex items-center gap-3"><div className="rounded-2xl bg-rose-50 p-3 text-rose-500 dark:bg-slate-900"><PawPrint /></div><div><h2 className="font-serif text-2xl font-bold">Registrar cuidado agora</h2><p className="text-xs text-slate-500">O horário exato é registrado automaticamente.</p></div></div>
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Observação opcional: quantidade, marca, estoque..." className="mb-4 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-900" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(ACTIONS).filter(([, config]) => config.group === "care").map(([action, config]) => { const Icon = config.icon; return <button key={action} type="button" disabled={Boolean(savingAction)} onClick={() => register(action)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-4 text-sm font-bold text-white shadow-md disabled:opacity-50"><Icon size={19} />{savingAction === action ? "Registrando..." : config.label}</button>; })}
        </div>
        <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-slate-500">Registrar compra</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(ACTIONS).filter(([, config]) => config.group === "purchase").map(([action, config]) => <button key={action} type="button" disabled={Boolean(savingAction)} onClick={() => register(action)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><ShoppingBag size={18} />{config.label}</button>)}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 font-serif text-2xl font-bold"><Clock3 className="text-violet-500" /> Cronograma da Milka</h2><p className="text-xs text-slate-500">Os horários e responsáveis são compartilhados.</p></div><button type="button" onClick={() => onSaveSchedules(draft)} disabled={savingSchedule} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Save size={18} />{savingSchedule ? "Salvando..." : "Salvar cronograma"}</button></div>
        <div className="grid gap-3 md:grid-cols-2">
          {draft.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-slate-900/70"><input type="checkbox" checked={item.enabled} onChange={(event) => update(item.id, { enabled: event.target.checked })} className="h-5 w-5 accent-violet-600" /><div className="min-w-0 flex-1"><p className="font-bold">{item.label}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{item.details}</p><p className="mt-1 text-xs text-slate-400">Avisar: {item.notify?.length ? item.notify.join(", ") : "ninguém"}</p><div className="mt-2 flex flex-wrap gap-1.5">{PEOPLE.map((name) => { const selected = item.notify?.includes(name); return <button key={name} type="button" onClick={() => togglePerson(item.id, name)} className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${selected ? "bg-violet-600 text-white" : "bg-white text-slate-400 dark:bg-slate-800"}`}>{name}</button>; })}</div></div><input type="time" value={item.time} onChange={(event) => update(item.id, { time: event.target.value })} className="rounded-xl bg-white px-3 py-2 text-sm font-bold dark:bg-slate-800" /></div>)}
        </div>
      </section>
    </>
  );
}
