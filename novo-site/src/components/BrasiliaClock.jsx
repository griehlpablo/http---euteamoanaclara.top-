import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getBrasiliaNow } from '../lib/time';

export default function BrasiliaClock({ nextWater = '-', nextAlert = '-' }) {
  const [now, setNow] = useState(() => getBrasiliaNow());

  useEffect(() => {
    const update = () => setNow(getBrasiliaNow());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div id="summary" className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-slate-500"><Clock className="h-4 w-4 text-cyan-600" /> Horario de Brasilia</p>
          <p className="font-serif text-3xl font-bold text-slate-900">{now.time}</p>
          <p className="text-xs font-bold capitalize text-slate-500">{now.day}</p>
        </div>
        <div className="grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-2">
          <span className="rounded-2xl bg-cyan-50 px-4 py-3">Proxima agua: {nextWater || '-'}</span>
          <span className="rounded-2xl bg-emerald-50 px-4 py-3">Proximo alerta: {nextAlert || '-'}</span>
        </div>
      </div>
    </div>
  );
}
