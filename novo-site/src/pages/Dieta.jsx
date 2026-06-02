import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Clipboard, Save, Utensils } from 'lucide-react';
import supabase from '../supabase';

const COUPLE_PEOPLE = {
  pablo: {
    label: 'Pablo Griehl',
    short: 'Pablo',
    calories: [2100, 2300],
    protein: [130, 160],
    water: [2500, 3000],
    accent: 'bg-cyan-600',
  },
  ana_clara: {
    label: 'Ana Clara',
    short: 'Ana',
    calories: [1900, 2200],
    protein: [80, 110],
    water: [1800, 2500],
    accent: 'bg-pink-600',
  },
};

const STORAGE = {
  notificationSettings: 'diet_notification_settings',
  offlineBackup: 'diet_offline_backup',
  debugLog: 'diet_debug_log',
  lastNotificationAt: 'diet_last_notification_at',
};

const FOOD_DB = {
  arroz: { label: 'Arroz cozido', unit: 'g', kcal: 130, protein: 2.5, sugar: 0, basis: 100 },
  feijao: { label: 'Feijao', unit: 'g', kcal: 76, protein: 4.8, sugar: 0, basis: 100 },
  carne: { label: 'Carne bovina', unit: 'g', kcal: 220, protein: 26, sugar: 0, basis: 100 },
  frango: { label: 'Frango', unit: 'g', kcal: 165, protein: 31, sugar: 0, basis: 100 },
  ovo: { label: 'Ovo', unit: 'unidade', kcal: 70, protein: 6, sugar: 0.4, basis: 1 },
  pao: { label: 'Pao', unit: 'unidade', kcal: 150, protein: 5, sugar: 2.5, basis: 1 },
  banana: { label: 'Banana', unit: 'unidade', kcal: 90, protein: 1, sugar: 12, basis: 1 },
  leite: { label: 'Leite', unit: 'ml', kcal: 60, protein: 3, sugar: 5, basis: 100 },
  iogurte: { label: 'Iogurte', unit: 'unidade', kcal: 120, protein: 6, sugar: 12, basis: 1 },
  cafe_acucar: { label: 'Cafe com acucar', unit: 'ml', kcal: 11, protein: 0, sugar: 2.75, basis: 100, liquidSugar: true },
  refrigerante_normal: { label: 'Refrigerante normal', unit: 'ml', kcal: 42, protein: 0, sugar: 10.6, basis: 100, liquidSugar: true },
  refrigerante_zero: { label: 'Refrigerante zero', unit: 'ml', kcal: 0, protein: 0, sugar: 0, basis: 100 },
  doce: { label: 'Doce', unit: 'g', kcal: 390, protein: 2, sugar: 55, basis: 100 },
};

const MEALS = {
  breakfast: 'Cafe da manha',
  lunch: 'Almoco',
  snack: 'Lanche',
  dinner: 'Janta',
  supper: 'Ceia',
  extras: 'Extras',
};

const MEAL_OPTIONS = {
  pablo: {
    breakfast: ['cafe_acucar', 'pao', 'ovo', 'banana'],
    lunch: ['arroz', 'feijao', 'carne', 'frango', 'ovo', 'refrigerante_normal', 'refrigerante_zero'],
    dinner: ['arroz', 'feijao', 'carne', 'frango', 'ovo', 'pao'],
    supper: ['leite', 'iogurte', 'banana', 'ovo'],
    extras: ['doce', 'refrigerante_normal'],
  },
  ana_clara: {
    breakfast: ['pao', 'ovo', 'banana', 'leite', 'iogurte'],
    lunch: ['arroz', 'feijao', 'carne', 'frango', 'ovo'],
    snack: ['banana', 'leite', 'iogurte', 'pao', 'ovo'],
    dinner: ['arroz', 'feijao', 'carne', 'frango', 'ovo'],
    supper: ['leite', 'iogurte', 'banana'],
    extras: ['doce', 'refrigerante_normal', 'refrigerante_zero'],
  },
};

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function emptyMeals() {
  return { breakfast: [], lunch: [], snack: [], dinner: [], supper: [], extras: [] };
}

function defaultLog(person, selectedDate) {
  return {
    person,
    log_date: selectedDate,
    weight_kg: '',
    wake_time: '',
    sleep_time: '',
    water_ml: 0,
    workout: 'descanso',
    appetite: '',
    notes: '',
    meals: emptyMeals(),
  };
}

function cloneMeals(meals = emptyMeals()) {
  return Object.fromEntries(Object.entries({ ...emptyMeals(), ...meals }).map(([key, value]) => [key, Array.isArray(value) ? value.map((item) => ({ ...item })) : []]));
}

function normalize(row, person, selectedDate) {
  if (!row) return defaultLog(person, selectedDate);
  return {
    ...defaultLog(person, selectedDate),
    ...row,
    weight_kg: row.weight_kg ?? '',
    water_ml: row.water_ml || 0,
    meals: cloneMeals(row.meals),
  };
}

function totalsFor(log) {
  const raw = Object.values(log.meals || {}).flat().reduce((acc, item) => {
    const food = FOOD_DB[item.food];
    if (!food) return acc;
    const multiplier = (Number(item.amount) || 0) / food.basis;
    acc.calories += food.kcal * multiplier;
    acc.protein += food.protein * multiplier;
    acc.sugar += food.sugar * multiplier;
    if (food.liquidSugar) acc.liquidSugar += food.sugar * multiplier;
    return acc;
  }, { calories: 0, protein: 0, sugar: 0, liquidSugar: 0 });
  return {
    calories: Math.round(raw.calories),
    protein: Number(raw.protein.toFixed(1)),
    sugar: Number(raw.sugar.toFixed(1)),
    liquidSugar: Number(raw.liquidSugar.toFixed(1)),
  };
}

function buildPayload(log, selectedDate) {
  const totals = totalsFor(log);
  return {
    person: log.person,
    log_date: selectedDate,
    weight_kg: Number(log.weight_kg) || null,
    wake_time: log.wake_time || null,
    sleep_time: log.sleep_time || null,
    water_ml: Number(log.water_ml) || 0,
    walked: false,
    walked_km: null,
    used_uber: false,
    workout: log.workout,
    mood: null,
    appetite: log.appetite || null,
    notes: log.notes || null,
    meals: cloneMeals(log.meals),
    totals,
    status: Object.values(log.meals || {}).some((items) => items.length) || Number(log.water_ml) ? 'partial' : 'empty',
  };
}

export default function Dieta() {
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [activePerson, setActivePerson] = useState('pablo');
  const [logs, setLogs] = useState(() => ({
    pablo: defaultLog('pablo', dateKey()),
    ana_clara: defaultLog('ana_clara', dateKey()),
  }));
  const [saveState, setSaveState] = useState('idle');
  const [report, setReport] = useState('');
  const [debugLog, setDebugLog] = useState(() => JSON.parse(localStorage.getItem(STORAGE.debugLog) || '[]'));
  const [notificationSettings, setNotificationSettings] = useState(() => JSON.parse(localStorage.getItem(STORAGE.notificationSettings) || 'null') || { enabled: true, pablo: true, ana_clara: true });

  useEffect(() => {
    let mounted = true;
    async function loadCouple() {
      const { data, error } = await supabase
        .from('daily_health_logs')
        .select('*')
        .eq('log_date', selectedDate)
        .in('person', ['pablo', 'ana_clara']);
      if (!mounted) return;
      if (error) {
        const backup = JSON.parse(localStorage.getItem(STORAGE.offlineBackup) || '{}');
        setLogs(backup[selectedDate] || {
          pablo: defaultLog('pablo', selectedDate),
          ana_clara: defaultLog('ana_clara', selectedDate),
        });
        return;
      }
      setLogs({
        pablo: normalize((data || []).find((row) => row.person === 'pablo'), 'pablo', selectedDate),
        ana_clara: normalize((data || []).find((row) => row.person === 'ana_clara'), 'ana_clara', selectedDate),
      });
    }
    loadCouple();
    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  const activeLog = logs[activePerson];
  const activeTotals = useMemo(() => totalsFor(activeLog), [activeLog]);

  function updateLog(person, patch) {
    setLogs((current) => ({ ...current, [person]: { ...current[person], ...patch } }));
  }

  function toggleFood(person, meal, foodKey, checked) {
    const meals = cloneMeals(logs[person].meals);
    if (!checked) {
      meals[meal] = meals[meal].filter((item) => item.food !== foodKey);
    } else if (!meals[meal].some((item) => item.food === foodKey)) {
      const food = FOOD_DB[foodKey];
      meals[meal] = [...meals[meal], { food: foodKey, amount: food.unit === 'g' ? 100 : food.unit === 'ml' ? 200 : 1, unit: food.unit }];
    }
    updateLog(person, { meals });
  }

  function updateFood(person, meal, foodKey, patch) {
    const meals = cloneMeals(logs[person].meals);
    meals[meal] = meals[meal].map((item) => item.food === foodKey ? { ...item, ...patch } : item);
    updateLog(person, { meals });
  }

  async function saveCouple() {
    setSaveState('saving');
    const payload = ['pablo', 'ana_clara'].map((person) => buildPayload(logs[person], selectedDate));
    const { error } = await supabase.from('daily_health_logs').upsert(payload, { onConflict: 'person,log_date' });
    if (error) {
      const backup = JSON.parse(localStorage.getItem(STORAGE.offlineBackup) || '{}');
      localStorage.setItem(STORAGE.offlineBackup, JSON.stringify({ ...backup, [selectedDate]: logs }));
      setSaveState('offline');
      return;
    }
    setSaveState('saved');
  }

  async function testNotification(person) {
    if ('Notification' in window && Notification.permission !== 'granted') await Notification.requestPermission();
    const message = `${COUPLE_PEOPLE[person].short}: lembrete da dieta do casal.`;
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Plano do casal', { body: message, tag: `diet-${person}` });
    const next = [{ id: `${Date.now()}-${person}`, person, message, time: new Date().toLocaleTimeString('pt-BR') }, ...debugLog].slice(0, 20);
    setDebugLog(next);
    localStorage.setItem(STORAGE.debugLog, JSON.stringify(next));
    localStorage.setItem(STORAGE.lastNotificationAt, new Date().toISOString());
  }

  function updateNotificationSettings(patch) {
    const next = { ...notificationSettings, ...patch };
    setNotificationSettings(next);
    localStorage.setItem(STORAGE.notificationSettings, JSON.stringify(next));
  }

  function exportReport(person = activePerson) {
    const log = logs[person];
    const totals = totalsFor(log);
    const text = [
      `RELATORIO DO DIA - ${COUPLE_PEOPLE[person].label} - ${selectedDate}`,
      `Pessoa: ${COUPLE_PEOPLE[person].label}`,
      `Agua: ${log.water_ml || 0} ml`,
      `Treino: ${log.workout}`,
      `Calorias estimadas: ${totals.calories} kcal`,
      `Proteina estimada: ${totals.protein} g`,
      `Acucar estimado: ${totals.sugar} g`,
      `Observacoes: ${log.notes || '-'}`,
    ].join('\n');
    setReport(text);
    return text;
  }

  async function copyReport(person) {
    await navigator.clipboard.writeText(exportReport(person));
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6 pb-16">
      <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-500">Plano do casal</p>
            <h1 className="font-serif text-4xl font-bold text-slate-900">Plano Pablo + Ana Clara</h1>
            <p className="mt-2 text-sm text-slate-500">Esta pagina trabalha somente com pablo e ana_clara.</p>
          </div>
          <button onClick={saveCouple} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            <Save className="h-4 w-4" /> {saveState === 'saving' ? 'Salvando...' : saveState === 'offline' ? 'Backup local' : saveState === 'saved' ? 'Salvo' : 'Salvar casal'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {Object.keys(COUPLE_PEOPLE).map((person) => {
          const totals = totalsFor(logs[person]);
          const profile = COUPLE_PEOPLE[person];
          return (
            <button key={person} onClick={() => setActivePerson(person)} className={`rounded-3xl border p-5 text-left shadow-lg ${activePerson === person ? 'border-slate-900 bg-white' : 'border-white/70 bg-white/65'}`}>
              <div className={`mb-3 inline-flex rounded-2xl px-3 py-2 text-sm font-bold text-white ${profile.accent}`}>{profile.short}</div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">{profile.label}</h2>
              <p className="mt-3 text-sm font-bold text-slate-600">{logs[person].water_ml || 0} ml agua | {totals.calories} kcal | {totals.protein} g proteina</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg">
        <div className="grid gap-4 md:grid-cols-5">
          <label className="text-xs font-bold uppercase text-slate-500">Data<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Peso<input type="number" step="0.1" value={activeLog.weight_kg} onChange={(event) => updateLog(activePerson, { weight_kg: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Agua<input type="number" value={activeLog.water_ml} onChange={(event) => updateLog(activePerson, { water_ml: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm" /></label>
          <label className="text-xs font-bold uppercase text-slate-500">Treino<select value={activeLog.workout} onChange={(event) => updateLog(activePerson, { workout: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm"><option value="descanso">Descanso</option><option value="treino">Treino</option><option value="cardio">Cardio</option></select></label>
          <label className="text-xs font-bold uppercase text-slate-500">Fome<select value={activeLog.appetite} onChange={(event) => updateLog(activePerson, { appetite: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm"><option value="">-</option><option value="normal">Normal</option><option value="muita_fome">Muita fome</option><option value="vontade_doce">Vontade de doce</option></select></label>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          {Object.entries(MEAL_OPTIONS[activePerson]).map(([meal, foods]) => (
            <div key={meal} className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900"><Utensils className="h-5 w-5 text-rose-500" /> {MEALS[meal]}</h2>
              <div className="space-y-2">
                {foods.map((foodKey) => {
                  const food = FOOD_DB[foodKey];
                  const item = (activeLog.meals[meal] || []).find((entry) => entry.food === foodKey);
                  return (
                    <div key={foodKey} className="grid gap-2 rounded-2xl bg-white/75 p-3 sm:grid-cols-[1fr_110px_110px] sm:items-center">
                      <label className="flex items-center gap-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={Boolean(item)} onChange={(event) => toggleFood(activePerson, meal, foodKey, event.target.checked)} className="h-5 w-5 accent-rose-500" />{food.label}</label>
                      <input type="number" min="0" value={item?.amount || ''} onChange={(event) => updateFood(activePerson, meal, foodKey, { amount: event.target.value })} className="rounded-2xl bg-white px-3 py-2 text-sm" />
                      <select value={item?.unit || food.unit} onChange={(event) => updateFood(activePerson, meal, foodKey, { unit: event.target.value })} className="rounded-2xl bg-white px-3 py-2 text-sm"><option value="g">g</option><option value="ml">ml</option><option value="unidade">unidade</option></select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg">
            <h2 className="mb-3 font-serif text-2xl font-bold text-slate-900">Totais de {COUPLE_PEOPLE[activePerson].short}</h2>
            <div className="space-y-2 text-sm font-bold text-slate-700">
              <p>Agua: {activeLog.water_ml || 0} / {COUPLE_PEOPLE[activePerson].water[0]} ml</p>
              <p>Calorias: {activeTotals.calories} / {COUPLE_PEOPLE[activePerson].calories[0]} kcal</p>
              <p>Proteina: {activeTotals.protein} / {COUPLE_PEOPLE[activePerson].protein[0]} g</p>
              <p>Acucar: {activeTotals.sugar} g</p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg">
            <h2 className="mb-3 font-serif text-2xl font-bold text-slate-900">Notificacoes do casal</h2>
            <div className="mb-3 grid gap-2">
              {Object.keys(COUPLE_PEOPLE).map((person) => (
                <label key={person} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-slate-700">{COUPLE_PEOPLE[person].label}<input type="checkbox" checked={Boolean(notificationSettings[person])} onChange={(event) => updateNotificationSettings({ [person]: event.target.checked })} className="h-5 w-5 accent-rose-500" /></label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => testNotification('pablo')} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white"><Bell className="h-4 w-4" /> Testar Pablo</button>
              <button onClick={() => testNotification('ana_clara')} className="inline-flex items-center gap-2 rounded-2xl bg-pink-600 px-4 py-2 text-sm font-bold text-white"><Bell className="h-4 w-4" /> Testar Ana</button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-lg">
            <h2 className="mb-3 font-serif text-2xl font-bold text-slate-900">Exportar casal</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <button onClick={() => setReport(exportReport('pablo'))} className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Exportar Pablo</button>
              <button onClick={() => setReport(exportReport('ana_clara'))} className="rounded-2xl bg-pink-600 px-4 py-2 text-sm font-bold text-white">Exportar Ana</button>
              <button onClick={() => copyReport(activePerson)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"><Clipboard className="h-4 w-4" /> Copiar ativo</button>
            </div>
            <textarea readOnly value={report} className="min-h-48 w-full rounded-2xl bg-white/80 p-3 font-mono text-xs text-slate-700" />
          </section>
        </aside>
      </section>
    </motion.div>
  );
}
