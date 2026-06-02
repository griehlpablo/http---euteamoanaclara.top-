import { Droplets } from 'lucide-react';
import { HELENA_PROFILE } from './helenaData';

export default function HelenaWaterTracker({ water, onWater }) {
  const target = HELENA_PROFILE.water[0];
  const percent = Math.min(100, Math.round(((Number(water) || 0) / target) * 100));

  return (
    <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
      <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
        <Droplets className="h-5 w-5 text-cyan-600" /> Agua
      </h2>
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-cyan-50">
        <div className="h-full rounded-full bg-cyan-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="mb-4 text-sm font-bold text-slate-700">{water || 0} ml / {target} ml</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[200, 250, 300, 500].map((ml) => (
          <button key={ml} onClick={() => onWater(ml)} className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white">
            +{ml} ml
          </button>
        ))}
      </div>
    </section>
  );
}
