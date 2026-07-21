import { PEOPLE } from "./config";

export default function MilkaPersonBar({ person, setPerson, onEnable }) {
  return (
    <section className="rounded-3xl bg-white/75 p-5 shadow-xl dark:bg-slate-800/75">
      <p className="mb-2 text-xs font-bold uppercase text-slate-500">Quem está registrando?</p>
      <div className="flex flex-wrap gap-2">
        {PEOPLE.map((name) => <button key={name} type="button" onClick={() => setPerson(name)} className={`rounded-2xl px-5 py-3 text-sm font-bold ${person === name ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-600 dark:bg-slate-900"}`}>{name}</button>)}
        <button type="button" onClick={onEnable} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">Ativar lembretes</button>
      </div>
    </section>
  );
}
