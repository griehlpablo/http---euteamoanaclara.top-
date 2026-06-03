import { BarChart3, CalendarDays, Dumbbell, Scale } from 'lucide-react';
import { HELENA_PROFILE, HELENA_SCHEDULE } from './helenaData';

function Progress({ label, value, target, unit, color }) {
  const percent = Math.min(100, Math.round(((Number(value) || 0) / target) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>{value || 0}/{target} {unit}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function nextWeighDate(history) {
  const last = history.at(-1);
  if (!last?.logDate) return '-';
  const date = new Date(`${last.logDate}T12:00:00`);
  date.setDate(date.getDate() + 15);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function HelenaDashboard({ log, totals, warnings, recommendations, recommendationOptions, onAddRecommendation, eatNow, onEatNow, history, onRegisterWeight }) {
  return (
    <aside className="space-y-5">
      <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
          <Scale className="h-5 w-5 text-emerald-600" /> Metas da Helena
        </h2>
        <div className="space-y-4">
          <Progress label="Agua pura" value={totals.pureWaterMl} target={HELENA_PROFILE.water[0]} unit="ml" color="bg-cyan-500" />
          <Progress label="Calorias" value={totals.calories} target={HELENA_PROFILE.calories[0]} unit="kcal" color="bg-emerald-500" />
          <Progress label="Proteina" value={totals.protein} target={HELENA_PROFILE.protein[0]} unit="g" color="bg-lime-500" />
          <div className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-slate-700">
            Carboidratos: {totals.carbs || 0}g | Gorduras: {totals.fat || 0}g | Acucar: {totals.sugar || 0}g | Fibras: {totals.fiber || 0}g | Sodio: {totals.sodium || 0}mg
          </div>
          <div className="rounded-2xl bg-cyan-50 p-3 text-xs font-bold leading-5 text-cyan-900">
            Hidratacao total estimada: {totals.totalHydrationMl || 0} ml. Agua pura: {totals.pureWaterMl || 0} ml.
          </div>
          <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
            Metas iniciais: {HELENA_PROFILE.calories[0]}-{HELENA_PROFILE.calories[1]} kcal, {HELENA_PROFILE.protein[0]}-{HELENA_PROFILE.protein[1]} g proteina, {HELENA_PROFILE.water[0]}-{HELENA_PROFILE.water[1]} ml agua.
          </p>
          <p className="text-xs font-bold leading-5 text-slate-500">
            Essas metas sao iniciais e podem ser ajustadas conforme peso, medidas, fome, treino e evolucao quinzenal.
          </p>
        </div>
      </section>

      <section id="history" className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <h2 className="mb-3 font-serif text-2xl font-bold text-slate-900">O que posso comer agora?</h2>
        <button onClick={onEatNow} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Gerar sugestao</button>
        {eatNow && <p className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-5 text-emerald-900">{eatNow}</p>}
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <h2 className="mb-3 font-serif text-2xl font-bold text-slate-900">Recomendacoes para sua proxima refeicao</h2>
        <div className="space-y-3">
          {recommendationOptions.map((option) => (
            <div key={option.id} className="rounded-2xl bg-emerald-50/80 p-4 text-sm font-bold leading-5 text-emerald-950">
              <div className="mb-1 text-base text-slate-900">{option.title}</div>
              <p>{option.foods}</p>
              <p className="text-xs text-emerald-800">{option.calories} kcal estimadas | {option.protein}g proteina estimada</p>
              <p className="mt-2 text-xs text-slate-600">{option.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onAddRecommendation(option)} className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">Adicionar esta refeicao</button>
                <button type="button" onClick={() => onAddRecommendation(option)} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">Editar antes de adicionar</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
          <Dumbbell className="h-5 w-5 text-emerald-600" /> Checklist de treino
        </h2>
        <div className="grid gap-2">
          {[
            ['preWorkoutMeal', 'Comeu antes do treino?'],
            ['postWorkoutMeal', 'Comeu depois do treino?'],
            ['proteinDone', 'Bateu proteina?'],
            ['waterDone', 'Tomou agua suficiente?'],
          ].map(([key, label]) => (
            <div key={key} className={`rounded-2xl px-4 py-3 text-sm font-bold ${log[key] ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              {label} {log[key] ? 'sim' : 'nao'}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <h2 className="mb-3 font-serif text-2xl font-bold text-slate-900">Feedback firme e realista</h2>
        <div className="space-y-2">
          {warnings.map((warning) => (
            <p key={warning} className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold leading-5 text-amber-900">{warning}</p>
          ))}
          {recommendations.map((rec) => (
            <p key={rec} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-5 text-emerald-900">{rec}</p>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
          <CalendarDays className="h-5 w-5 text-emerald-600" /> Cronograma
        </h2>
        <div className="space-y-2">
          {HELENA_SCHEDULE.map(([time, task]) => (
            <div key={`${time}-${task}`} className="grid grid-cols-[110px_1fr] rounded-2xl bg-emerald-50/70 px-3 py-2 text-sm">
              <span className="font-bold text-slate-800">{time}</span>
              <span>{task}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">
          Dormir 01h40 e tarde. Se o sono estiver ruim, a fome e a recuperacao muscular podem piorar. Tente melhorar aos poucos, sem radicalismo.
        </p>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
          <BarChart3 className="h-5 w-5 text-emerald-600" /> Evolucao quinzenal
        </h2>
        <p className="mb-3 rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-slate-600">
          Peso e quinzenal. Nao precisa se pesar todo dia; avalie tendencia, medidas e forca no treino.
        </p>
        <div className="mb-3 grid gap-2 rounded-2xl bg-emerald-50/70 p-3 text-xs font-bold text-slate-700">
          <span>Ultima pesagem: {history.at(-1)?.date || '-'}</span>
          <span>Proxima pesagem sugerida: {nextWeighDate(history)}</span>
          <button type="button" onClick={onRegisterWeight} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm">Registrar peso de hoje</button>
        </div>
        <div className="space-y-2">
          {history.length ? history.slice(-6).map((item) => (
            <div key={item.date} className="rounded-2xl bg-emerald-50/70 p-3 text-xs font-bold text-slate-700">
              {item.date}: {item.weight || '-'} kg, cintura {item.waist || '-'} cm, abdomen {item.abdomen || '-'} cm
            </div>
          )) : <p className="text-sm font-bold text-slate-500">Ainda sem historico quinzenal.</p>}
        </div>
        <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
          Para recomposicao corporal, peso pode demorar a cair. Medidas, roupa e forca no treino tambem importam.
        </p>
      </section>
    </aside>
  );
}
