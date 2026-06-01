import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  Dumbbell,
  HeartPulse,
  Loader2,
  Save,
  Scale,
  Utensils,
} from 'lucide-react';
import supabase from '../supabase';

const PEOPLE = {
  pablo: {
    label: 'Pablo Griehl',
    short: 'Pablo',
    accent: 'from-cyan-500 to-emerald-500',
    soft: 'bg-cyan-50 border-cyan-100 text-cyan-900',
    goal: 'Secar barriga, reduzir gordura e manter proteina.',
    calorieTarget: [2100, 2300],
    proteinTarget: [130, 160],
    waterTarget: [2500, 3000],
    workoutGoal: '3x por semana',
  },
  ana_clara: {
    label: 'Ana Clara',
    short: 'Ana',
    accent: 'from-pink-500 to-violet-500',
    soft: 'bg-pink-50 border-pink-100 text-pink-900',
    goal: 'Ganhar e definir gluteos.',
    calorieTarget: [1900, 2200],
    proteinTarget: [80, 110],
    waterTarget: [1800, 2500],
    workoutGoal: 'Gluteo/perna 3 a 4x por semana',
  },
};

const EMPTY_MEALS = {
  breakfast: [],
  lunch: [],
  dinner: [],
  supper: [],
  snack: [],
  extras: [],
};

const MEAL_LABELS = {
  breakfast: 'Cafe da manha',
  lunch: 'Almoco',
  dinner: 'Janta',
  supper: 'Ceia',
  snack: 'Lanche/vitamina',
  extras: 'Extras',
};

const FOOD_DB = {
  arroz: { label: 'Arroz cozido', unit: 'g', kcal: 130, protein: 2.5, sugar: 0, basis: 100 },
  feijao: { label: 'Feijao cozido', unit: 'g', kcal: 76, protein: 4.8, sugar: 0, basis: 100 },
  brocolis: { label: 'Brocolis/legumes', unit: 'g', kcal: 35, protein: 2.4, sugar: 1.7, basis: 100 },
  salada: { label: 'Salada', unit: 'g', kcal: 20, protein: 1.2, sugar: 1.5, basis: 100 },
  carne_bovina: { label: 'Carne bovina', unit: 'g', kcal: 220, protein: 26, sugar: 0, basis: 100 },
  frango: { label: 'Frango', unit: 'g', kcal: 165, protein: 31, sugar: 0, basis: 100 },
  ovo: { label: 'Ovo', unit: 'unidade', kcal: 70, protein: 6, sugar: 0.4, basis: 1 },
  pao: { label: 'Pao frances', unit: 'unidade', kcal: 150, protein: 5, sugar: 2.5, basis: 1 },
  banana: { label: 'Banana', unit: 'unidade', kcal: 90, protein: 1, sugar: 12, basis: 1 },
  aveia: { label: 'Aveia', unit: 'g', kcal: 390, protein: 17, sugar: 1, basis: 100 },
  leite: { label: 'Leite integral', unit: 'ml', kcal: 60, protein: 3, sugar: 5, basis: 100 },
  iogurte: { label: 'Iogurte', unit: 'g', kcal: 75, protein: 4, sugar: 7, basis: 100 },
  vitamina: { label: 'Vitamina', unit: 'ml', kcal: 95, protein: 4, sugar: 11, basis: 100 },
  amendoim: { label: 'Amendoim/pasta', unit: 'g', kcal: 590, protein: 25, sugar: 5, basis: 100 },
  sardinha_atum: { label: 'Sardinha/atum', unit: 'g', kcal: 180, protein: 26, sugar: 0, basis: 100 },
  refrigerante_normal: { label: 'Refrigerante normal', unit: 'ml', kcal: 42, protein: 0, sugar: 10.6, basis: 100, liquidSugar: true },
  refrigerante_zero: { label: 'Refrigerante zero', unit: 'ml', kcal: 0, protein: 0, sugar: 0, basis: 100 },
  cafe_sem_acucar: { label: 'Cafe sem acucar', unit: 'ml', kcal: 0, protein: 0, sugar: 0, basis: 100 },
  cafe_com_acucar: { label: 'Cafe com acucar', unit: 'ml', kcal: 11, protein: 0, sugar: 2.75, basis: 100, liquidSugar: true },
  cafe: { label: 'Cafe', unit: 'ml', kcal: 0, protein: 0, sugar: 0, basis: 100 },
  acucar: { label: 'Acucar', unit: 'colher', kcal: 20, protein: 0, sugar: 5, basis: 1 },
  bolacha: { label: 'Bolacha', unit: 'g', kcal: 430, protein: 7, sugar: 22, basis: 100 },
  doce: { label: 'Doce', unit: 'g', kcal: 390, protein: 2, sugar: 55, basis: 100 },
  salgadinho: { label: 'Salgadinho', unit: 'g', kcal: 500, protein: 7, sugar: 4, basis: 100 },
  omelete: { label: 'Omelete', unit: 'unidade', kcal: 160, protein: 13, sugar: 1, basis: 1 },
  outro: { label: 'Outro', unit: 'g', kcal: 0, protein: 0, sugar: 0, basis: 100 },
  nada: { label: 'Nada', unit: 'unidade', kcal: 0, protein: 0, sugar: 0, basis: 1 },
};

const MEAL_OPTIONS = {
  pablo: {
    breakfast: ['cafe_sem_acucar', 'cafe_com_acucar', 'banana', 'aveia', 'pao', 'ovo', 'leite', 'outro'],
    lunch: ['arroz', 'feijao', 'carne_bovina', 'frango', 'ovo', 'sardinha_atum', 'brocolis', 'salada', 'refrigerante_normal', 'refrigerante_zero', 'outro'],
    dinner: ['arroz', 'feijao', 'frango', 'carne_bovina', 'ovo', 'pao', 'brocolis', 'salada', 'outro'],
    supper: ['banana', 'leite', 'iogurte', 'ovo', 'pao', 'nada', 'outro'],
    extras: ['bolacha', 'doce', 'salgadinho', 'refrigerante_normal', 'cafe_com_acucar', 'outro'],
  },
  ana_clara: {
    breakfast: ['banana', 'aveia', 'leite', 'pao', 'ovo', 'cafe', 'vitamina', 'outro'],
    lunch: ['arroz', 'feijao', 'frango', 'carne_bovina', 'ovo', 'brocolis', 'salada', 'outro'],
    snack: ['banana', 'aveia', 'leite', 'iogurte', 'pao', 'ovo', 'amendoim', 'outro'],
    dinner: ['arroz', 'feijao', 'frango', 'carne_bovina', 'ovo', 'omelete', 'brocolis', 'salada', 'outro'],
    supper: ['leite', 'banana', 'aveia', 'iogurte', 'pao', 'nada', 'outro'],
  },
};

const WORKOUTS = {
  pablo: [
    { name: 'Treino A', steps: ['agachamento 4x15', 'flexao 4x8-12', 'afundo 3x10 cada perna', 'prancha 3x30s', 'abdominal 3x20', 'elevacao pelvica 3x20'] },
    { name: 'Treino B', steps: ['agachamento com mochila 4x12', 'flexao 4x8-12', 'stiff com mochila 4x12', 'prancha lateral 3x20s cada lado', 'abdominal bicicleta 3x20', 'polichinelo 4x40s'] },
  ],
  ana_clara: [
    { name: 'Gluteo A', steps: ['agachamento 4x12', 'elevacao pelvica 4x15', 'afundo 3x10 cada perna', 'ponte de gluteo 3x20', 'abducao de perna 3x20 cada lado', 'prancha 3x30s'] },
    { name: 'Gluteo B', steps: ['elevacao pelvica com mochila 5x12', 'agachamento sumo 4x12', 'stiff com mochila 4x12', 'passada/afundo 3x12 cada perna', 'coice de gluteo 3x20 cada perna', 'panturrilha 4x20'] },
    { name: 'Gluteo Pump', steps: ['3 a 4 voltas', '20 agachamentos', '20 elevacoes pelvicas', '15 afundos cada perna', '20 coices cada perna', '30s cadeira na parede', '30s prancha'] },
  ],
};

const PABLO_SCHEDULE = [
  ['06h40', 'acordar'],
  ['06h45', 'agua'],
  ['07h00', 'cafe da manha'],
  ['07h25', 'sair andando para o trabalho'],
  ['08h00', 'trabalho'],
  ['11h00 a 13h30', 'almoco'],
  ['12h15 a 12h40', 'mobilidade ou descanso'],
  ['17h00 a 18h00', 'treino quando possivel'],
  ['18h00/18h30', 'janta antes da faculdade'],
  ['23h20', 'chega da faculdade'],
  ['23h30', 'ceia leve se precisar'],
  ['00h10/00h30', 'dormir'],
];

const ANA_SCHEDULE = [
  ['08h30', 'acordar'],
  ['09h00', 'cafe da manha'],
  ['12h00', 'almoco'],
  ['15h30/16h00', 'lanche/vitamina'],
  ['17h00', 'treino'],
  ['19h30/20h00', 'janta'],
  ['22h00', 'ceia opcional'],
  ['23h00/23h30', 'dormir'],
];

const DEFAULTS_BY_PERSON = {
  pablo: {
    person: 'pablo',
    weight_kg: '',
    wake_time: '',
    sleep_time: '',
    water_ml: 0,
    walked: false,
    walked_km: '',
    used_uber: false,
    workout: 'descanso',
    mood: 'medio',
    appetite: '',
    notes: '',
    meals: EMPTY_MEALS,
    totals: {},
    status: 'empty',
  },
  ana_clara: {
    person: 'ana_clara',
    weight_kg: '',
    wake_time: '',
    sleep_time: '',
    water_ml: 0,
    walked: false,
    walked_km: '',
    used_uber: false,
    workout: 'descanso',
    mood: '',
    appetite: 'medio',
    notes: '',
    meals: EMPTY_MEALS,
    totals: {},
    status: 'empty',
  },
};

function dateToKey(date) {
  return date.toISOString().slice(0, 10);
}

function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateBr(value) {
  return parseLocalDate(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function cloneMeals(meals = EMPTY_MEALS) {
  return Object.fromEntries(
    Object.entries({ ...EMPTY_MEALS, ...meals }).map(([key, items]) => [key, Array.isArray(items) ? items.map((item) => ({ ...item })) : []]),
  );
}

function defaultLog(person, logDate) {
  return {
    ...DEFAULTS_BY_PERSON[person],
    log_date: logDate,
    meals: cloneMeals(DEFAULTS_BY_PERSON[person].meals),
    totals: {},
  };
}

function normalizeLog(row, person, logDate) {
  if (!row) return defaultLog(person, logDate);
  return {
    ...defaultLog(person, logDate),
    ...row,
    weight_kg: row.weight_kg ?? '',
    walked_km: row.walked_km ?? '',
    water_ml: row.water_ml ?? 0,
    meals: cloneMeals(row.meals),
    totals: row.totals || {},
  };
}

function calculateTotals(log) {
  const allItems = Object.values(log.meals || {}).flat();
  const totals = allItems.reduce(
    (acc, item) => {
      const food = FOOD_DB[item.food] || FOOD_DB.outro;
      const amount = Number(item.amount) || 0;
      const multiplier = amount / food.basis;
      acc.calories += food.kcal * multiplier;
      acc.protein += food.protein * multiplier;
      acc.sugar += food.sugar * multiplier;
      if (food.liquidSugar) acc.liquidSugar += food.sugar * multiplier;
      return acc;
    },
    { calories: 0, protein: 0, sugar: 0, liquidSugar: 0 },
  );

  const profile = PEOPLE[log.person];
  const warnings = getWarnings(log, totals);

  return {
    calories: Math.round(totals.calories),
    protein: Number(totals.protein.toFixed(1)),
    sugar: Number(totals.sugar.toFixed(1)),
    liquid_sugar: Number(totals.liquidSugar.toFixed(1)),
    water_ml: Number(log.water_ml) || 0,
    calories_remaining: Math.max(0, profile.calorieTarget[0] - Math.round(totals.calories)),
    protein_remaining: Math.max(0, profile.proteinTarget[0] - Number(totals.protein.toFixed(1))),
    water_remaining: Math.max(0, profile.waterTarget[0] - (Number(log.water_ml) || 0)),
    warnings,
  };
}

function mealHas(log, meal, food) {
  return (log.meals?.[meal] || []).some((item) => item.food === food && Number(item.amount) > 0);
}

function mealFilled(log, meal) {
  return (log.meals?.[meal] || []).some((item) => Number(item.amount) > 0);
}

function getWarnings(log, totals) {
  const warnings = [];
  if (log.person === 'pablo') {
    const hasSoda = Object.keys(log.meals || {}).some((meal) => mealHas(log, meal, 'refrigerante_normal'));
    const hasSugarCoffee = Object.keys(log.meals || {}).some((meal) => mealHas(log, meal, 'cafe_com_acucar'));
    if (hasSoda && hasSugarCoffee) warnings.push({ type: 'warning', text: 'Atencao: Coca + cafe com acucar no mesmo dia pode atrapalhar seu deficit.' });
    if (totals.liquidSugar > 25) warnings.push({ type: 'danger', text: 'Pablo tomou muito acucar liquido hoje.' });
    if (log.used_uber || (log.walked === false && log.walked_km !== '')) warnings.push({ type: 'warning', text: 'Hoje voce andou menos; controle melhor a noite.' });
    if (!mealFilled(log, 'dinner')) warnings.push({ type: 'warning', text: 'Pablo: tente jantar antes da faculdade para nao chegar com fome extrema.' });
    if ((log.meals?.supper || []).some((item) => ['pao', 'ovo', 'leite'].includes(item.food) && Number(item.amount) > 1)) warnings.push({ type: 'warning', text: 'Ceia ficou pesada tarde; prefira algo mais leve se ja jantou.' });
  }

  if (log.person === 'ana_clara') {
    const trainedGlutes = ['gluteo_a', 'gluteo_b', 'gluteo_pump'].includes(log.workout);
    if (trainedGlutes && totals.calories < 1500) warnings.push({ type: 'warning', text: 'Ana Clara: em dia de gluteo, voce parece ter comido pouco.' });
    if (trainedGlutes && !mealFilled(log, 'snack')) warnings.push({ type: 'warning', text: 'Ana Clara: em dia de gluteo, nao pule lanche/vitamina.' });
  }

  if (!warnings.length) warnings.push({ type: 'ok', text: log.person === 'pablo' ? 'Boa, Pablo. Continue registrando para ajustar fino.' : 'Boa, Ana Clara. Constancia hoje, resultado amanha.' });
  return warnings;
}

function getStatus(log, totals) {
  const hasBasic = Number(log.water_ml) > 0 || log.weight_kg || log.wake_time || log.workout !== 'descanso';
  const hasMeals = Object.values(log.meals || {}).some((items) => items.length > 0);
  if (!hasBasic && !hasMeals) return 'empty';
  const profile = PEOPLE[log.person];
  if (hasMeals && Number(log.water_ml) >= profile.waterTarget[0] && totals.protein >= profile.proteinTarget[0]) return 'complete';
  return 'partial';
}

function getMonthDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => dateToKey(new Date(year, month, index + 1)));
}

function progressValue(value, target) {
  return Math.min(100, Math.round(((Number(value) || 0) / target) * 100));
}

function inputNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function itemLabel(item) {
  const food = FOOD_DB[item.food] || FOOD_DB.outro;
  const amount = Number(item.amount) || 0;
  const note = item.note ? ` (${item.note})` : '';
  return `${food.label}: ${amount} ${item.unit || food.unit}${note}`;
}

function buildReport(logs, selectedDate, mode) {
  const people = mode === 'couple' ? ['pablo', 'ana_clara'] : [mode];
  return people
    .map((person) => {
      const log = logs[person];
      const totals = calculateTotals(log);
      const lines = [
        `RELATORIO DO DIA - ${formatDateBr(selectedDate)}`,
        `Pessoa: ${PEOPLE[person].label}`,
        `Peso: ${log.weight_kg || '-'}`,
        `Agua: ${log.water_ml || 0} ml`,
        person === 'pablo' ? `Caminhada: ${log.walked ? 'sim' : 'nao'} ${log.walked_km ? `(${log.walked_km} km)` : ''}` : null,
        person === 'pablo' ? `Usou Uber: ${log.used_uber ? 'sim' : 'nao'}` : null,
        `Treino: ${log.workout || '-'}`,
        `Cafe da manha: ${(log.meals.breakfast || []).map(itemLabel).join('; ') || '-'}`,
        `Almoco: ${(log.meals.lunch || []).map(itemLabel).join('; ') || '-'}`,
        person === 'ana_clara' ? `Lanche/vitamina: ${(log.meals.snack || []).map(itemLabel).join('; ') || '-'}` : null,
        person === 'pablo' ? `Janta antes da faculdade: ${(log.meals.dinner || []).map(itemLabel).join('; ') || '-'}` : `Janta: ${(log.meals.dinner || []).map(itemLabel).join('; ') || '-'}`,
        `Ceia: ${(log.meals.supper || []).map(itemLabel).join('; ') || '-'}`,
        person === 'pablo' ? `Extras: ${(log.meals.extras || []).map(itemLabel).join('; ') || '-'}` : null,
        `Calorias estimadas: ${totals.calories} kcal`,
        `Proteina estimada: ${totals.protein} g`,
        `Acucar estimado: ${totals.sugar} g`,
        `Alertas do sistema: ${totals.warnings.map((warning) => warning.text).join(' | ')}`,
        `Observacoes: ${log.notes || '-'}`,
        'Pergunta para o ChatGPT: Analise meu dia e me diga o que ajustar amanha.',
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n---\n\n');
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className={`w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 ${props.className || ''}`} />;
}

function SelectInput(props) {
  return <select {...props} className={`w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100 ${props.className || ''}`} />;
}

function ProgressBar({ label, value, target, unit, tone = 'rose' }) {
  const percent = progressValue(value, target);
  const color = tone === 'blue' ? 'from-cyan-500 to-blue-500' : tone === 'green' ? 'from-emerald-500 to-lime-500' : 'from-pink-500 to-violet-500';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
        <span>{label}</span>
        <span>{value || 0}/{target} {unit}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/80">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function Dieta() {
  const todayKey = dateToKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [monthDate, setMonthDate] = useState(parseLocalDate(todayKey));
  const [logsByDate, setLogsByDate] = useState({});
  const [activePerson, setActivePerson] = useState('pablo');
  const [saveState, setSaveState] = useState('idle');
  const [loadState, setLoadState] = useState('loading');
  const [report, setReport] = useState('');
  const [dirtyVersion, setDirtyVersion] = useState(0);
  const didLoadRef = useRef(false);
  const saveTimerRef = useRef(null);

  const monthDays = useMemo(() => getMonthDays(monthDate), [monthDate]);

  const selectedLogs = useMemo(() => {
    const current = logsByDate[selectedDate] || {};
    return {
      pablo: normalizeLog(current.pablo, 'pablo', selectedDate),
      ana_clara: normalizeLog(current.ana_clara, 'ana_clara', selectedDate),
    };
  }, [logsByDate, selectedDate]);

  const saveDay = useCallback(async () => {
    setSaveState('saving');
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = Object.values(selectedLogs).map((log) => {
      const totals = calculateTotals(log);
      return {
        user_id: user?.id || null,
        person: log.person,
        log_date: selectedDate,
        weight_kg: inputNumber(log.weight_kg),
        wake_time: log.wake_time || null,
        sleep_time: log.sleep_time || null,
        water_ml: Number(log.water_ml) || 0,
        walked: Boolean(log.walked),
        walked_km: inputNumber(log.walked_km),
        used_uber: Boolean(log.used_uber),
        workout: log.workout || null,
        mood: log.mood || null,
        appetite: log.appetite || null,
        notes: log.notes || null,
        meals: log.meals || EMPTY_MEALS,
        totals,
        status: getStatus(log, totals),
      };
    });

    const { error } = await supabase
      .from('daily_health_logs')
      .upsert(payload, { onConflict: 'person,log_date' })
      .select();

    setSaveState(error ? 'error' : 'saved');
    if (error) {
      const backup = JSON.parse(localStorage.getItem('diet-offline-backup') || '{}');
      localStorage.setItem('diet-offline-backup', JSON.stringify({ ...backup, [selectedDate]: selectedLogs }));
    }
  }, [selectedDate, selectedLogs]);

  useEffect(() => {
    let mounted = true;
    async function loadLogs() {
      setLoadState('loading');
      const firstDay = dateToKey(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
      const lastDay = dateToKey(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
      const { data, error } = await supabase
        .from('daily_health_logs')
        .select('*')
        .gte('log_date', firstDay)
        .lte('log_date', lastDay);

      if (!mounted) return;
      if (error) {
        setLoadState('error');
        didLoadRef.current = true;
        return;
      }

      setLogsByDate((previous) => {
        const next = { ...previous };
        for (const row of data || []) {
          next[row.log_date] = {
            ...(next[row.log_date] || {}),
            [row.person]: normalizeLog(row, row.person, row.log_date),
          };
        }
        return next;
      });
      setLoadState('ready');
      didLoadRef.current = true;
    }

    loadLogs();
    return () => {
      mounted = false;
    };
  }, [monthDate]);

  useEffect(() => {
    if (!didLoadRef.current || dirtyVersion === 0) return;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveDay();
    }, 900);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [dirtyVersion, saveDay]);

  function updateLog(person, patch) {
    setDirtyVersion((version) => version + 1);
    setLogsByDate((previous) => {
      const currentDateLogs = previous[selectedDate] || {};
      const currentLog = normalizeLog(currentDateLogs[person], person, selectedDate);
      const nextLog = { ...currentLog, ...patch };
      const totals = calculateTotals(nextLog);
      nextLog.totals = totals;
      nextLog.status = getStatus(nextLog, totals);
      return {
        ...previous,
        [selectedDate]: {
          ...currentDateLogs,
          [person]: nextLog,
        },
      };
    });
  }

  function updateMealItem(person, meal, foodKey, patch) {
    const log = selectedLogs[person];
    const meals = cloneMeals(log.meals);
    const list = meals[meal] || [];
    const index = list.findIndex((item) => item.food === foodKey);
    const food = FOOD_DB[foodKey] || FOOD_DB.outro;

    if (patch.checked === false) {
      meals[meal] = list.filter((item) => item.food !== foodKey);
    } else if (index >= 0) {
      meals[meal] = list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch, checked: undefined } : item));
    } else {
      meals[meal] = [
        ...list,
        {
          food: foodKey,
          label: food.label,
          amount: food.unit === 'ml' ? 200 : food.unit === 'g' ? 100 : 1,
          unit: food.unit,
          note: '',
          ...patch,
          checked: undefined,
        },
      ];
    }

    updateLog(person, { meals });
  }

  function changeMonth(direction) {
    setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  }

  function exportReport(mode) {
    const text = buildReport(selectedLogs, selectedDate, mode);
    setReport(text);
  }

  async function copyReport() {
    if (!report) return;
    await navigator.clipboard.writeText(report);
  }

  function downloadReport() {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-dieta-${selectedDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const activeLog = selectedLogs[activePerson];
  const activeTotals = calculateTotals(activeLog);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6 pb-16">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-xl backdrop-blur-xl">
        <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-rose-600">
              <HeartPulse className="h-4 w-4" /> Plano do Casal
            </div>
            <h1 className="font-serif text-4xl font-bold text-slate-900 md:text-5xl">Plano do Casal - Pablo & Ana Clara</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Calendario diario com alimentacao, treino, agua, peso, calculos aproximados e relatorio pronto para mandar ao ChatGPT.
            </p>
          </div>
          <div className="grid content-center gap-3 rounded-3xl bg-gradient-to-br from-rose-50 to-cyan-50 p-5">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              {saveState === 'saving' && <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />}
              {saveState === 'saved' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              {saveState === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              <span>
                {saveState === 'saving' && 'Salvando...'}
                {saveState === 'saved' && 'Salvo no Supabase'}
                {saveState === 'error' && 'Erro ao salvar. Backup local criado.'}
                {saveState === 'idle' && 'Pronto para registrar'}
              </span>
            </div>
            {loadState === 'error' && (
              <p className="rounded-2xl bg-amber-100 px-4 py-3 text-xs font-bold text-amber-800">
                Nao consegui conectar ao Supabase. Confira as variaveis VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e a tabela daily_health_logs.
              </p>
            )}
            <button onClick={saveDay} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg">
              <Save className="h-4 w-4" /> Salvar agora
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => changeMonth(-1)} className="rounded-full bg-white p-2 shadow-sm" aria-label="Mes anterior"><ChevronLeft /></button>
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Calendario</p>
              <h2 className="font-serif text-2xl font-bold capitalize text-slate-800">
                {monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            <button onClick={() => changeMonth(1)} className="rounded-full bg-white p-2 shadow-sm" aria-label="Proximo mes"><ChevronRight /></button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day) => {
              const dateLogs = logsByDate[day] || {};
              const statuses = Object.values(dateLogs).map((log) => log.status).filter(Boolean);
              const status = statuses.includes('complete') ? 'complete' : statuses.includes('partial') ? 'partial' : 'empty';
              const isSelected = selectedDate === day;
              const isToday = todayKey === day;
              const color = status === 'complete' ? 'bg-emerald-100 text-emerald-800' : status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-white/80 text-slate-500';
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-2xl border text-sm font-bold transition ${color} ${isSelected ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-white/80'} ${isToday ? 'shadow-lg shadow-rose-200' : ''}`}
                >
                  {parseLocalDate(day).getDate()}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-slate-500">
            <span className="rounded-full bg-white/80 px-2 py-2">vazio</span>
            <span className="rounded-full bg-amber-100 px-2 py-2">parcial</span>
            <span className="rounded-full bg-emerald-100 px-2 py-2">completo</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {Object.keys(PEOPLE).map((person) => {
            const log = selectedLogs[person];
            const totals = calculateTotals(log);
            return (
              <button
                key={person}
                onClick={() => setActivePerson(person)}
                className={`rounded-[2rem] border p-5 text-left shadow-lg transition ${activePerson === person ? 'border-slate-900 bg-white' : 'border-white/70 bg-white/60'}`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${PEOPLE[person].accent} text-white`}>
                  {person === 'pablo' ? <Dumbbell /> : <Activity />}
                </div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">{PEOPLE[person].label}</h3>
                <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">{PEOPLE[person].goal}</p>
                <div className="space-y-3">
                  <ProgressBar label="Agua" value={log.water_ml} target={PEOPLE[person].waterTarget[0]} unit="ml" tone="blue" />
                  <ProgressBar label="Calorias" value={totals.calories} target={PEOPLE[person].calorieTarget[0]} unit="kcal" tone={person === 'pablo' ? 'green' : 'rose'} />
                  <ProgressBar label="Proteina" value={totals.protein} target={PEOPLE[person].proteinTarget[0]} unit="g" tone="green" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-xl backdrop-blur-xl md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Dia selecionado: {formatDateBr(selectedDate)}</p>
            <h2 className="font-serif text-3xl font-bold text-slate-900">{PEOPLE[activePerson].label}</h2>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${PEOPLE[activePerson].soft}`}>
            Meta: {PEOPLE[activePerson].calorieTarget[0]}-{PEOPLE[activePerson].calorieTarget[1]} kcal, {PEOPLE[activePerson].proteinTarget[0]}-{PEOPLE[activePerson].proteinTarget[1]}g proteina
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Peso kg"><TextInput type="number" step="0.1" value={activeLog.weight_kg} onChange={(event) => updateLog(activePerson, { weight_kg: event.target.value })} /></Field>
          <Field label="Acordou"><TextInput type="time" value={activeLog.wake_time || ''} onChange={(event) => updateLog(activePerson, { wake_time: event.target.value })} /></Field>
          <Field label="Dormiu/pretende"><TextInput type="time" value={activeLog.sleep_time || ''} onChange={(event) => updateLog(activePerson, { sleep_time: event.target.value })} /></Field>
          <Field label="Agua ml"><TextInput type="number" step="100" value={activeLog.water_ml || 0} onChange={(event) => updateLog(activePerson, { water_ml: event.target.value })} /></Field>
          {activePerson === 'pablo' && (
            <>
              <Field label="Caminhou">
                <SelectInput value={activeLog.walked ? 'sim' : 'nao'} onChange={(event) => updateLog(activePerson, { walked: event.target.value === 'sim' })}>
                  <option value="nao">Nao</option>
                  <option value="sim">Sim</option>
                </SelectInput>
              </Field>
              <Field label="Km aprox."><TextInput type="number" step="0.1" value={activeLog.walked_km} onChange={(event) => updateLog(activePerson, { walked_km: event.target.value })} /></Field>
              <Field label="Usou Uber">
                <SelectInput value={activeLog.used_uber ? 'sim' : 'nao'} onChange={(event) => updateLog(activePerson, { used_uber: event.target.value === 'sim' })}>
                  <option value="nao">Nao</option>
                  <option value="sim">Sim</option>
                </SelectInput>
              </Field>
            </>
          )}
          <Field label="Treino">
            <SelectInput value={activeLog.workout || 'descanso'} onChange={(event) => updateLog(activePerson, { workout: event.target.value })}>
              {(activePerson === 'pablo'
                ? ['descanso', 'treino_a', 'treino_b', 'mobilidade', 'outro']
                : ['descanso', 'gluteo_a', 'gluteo_b', 'superior_core', 'gluteo_pump']
              ).map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
            </SelectInput>
          </Field>
          <Field label={activePerson === 'pablo' ? 'Humor/energia' : 'Apetite'}>
            <SelectInput value={activePerson === 'pablo' ? activeLog.mood || 'medio' : activeLog.appetite || 'medio'} onChange={(event) => updateLog(activePerson, activePerson === 'pablo' ? { mood: event.target.value } : { appetite: event.target.value })}>
              <option value="baixo">Baixo</option>
              <option value="medio">Medio</option>
              <option value="bom">Bom</option>
            </SelectInput>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Observacoes">
            <textarea value={activeLog.notes || ''} onChange={(event) => updateLog(activePerson, { notes: event.target.value })} className="min-h-24 w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100" />
          </Field>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          {Object.entries(MEAL_OPTIONS[activePerson]).map(([meal, foods]) => (
            <div key={meal} className="rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-lg backdrop-blur-xl">
              <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
                <Utensils className="h-5 w-5 text-rose-500" /> {MEAL_LABELS[meal]}
              </h3>
              <div className="space-y-3">
                {foods.map((foodKey) => {
                  const food = FOOD_DB[foodKey] || FOOD_DB.outro;
                  const current = (activeLog.meals[meal] || []).find((item) => item.food === foodKey);
                  return (
                    <div key={foodKey} className="grid gap-2 rounded-2xl bg-white/75 p-3 sm:grid-cols-[1fr_110px_110px_1fr] sm:items-center">
                      <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <input type="checkbox" checked={Boolean(current)} onChange={(event) => updateMealItem(activePerson, meal, foodKey, { checked: event.target.checked })} className="h-5 w-5 rounded border-slate-300 accent-rose-500" />
                        {food.label}
                      </label>
                      <TextInput type="number" min="0" value={current?.amount || ''} placeholder="Qtd." onChange={(event) => updateMealItem(activePerson, meal, foodKey, { amount: event.target.value })} />
                      <SelectInput value={current?.unit || food.unit} onChange={(event) => updateMealItem(activePerson, meal, foodKey, { unit: event.target.value })}>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="unidade">unidade</option>
                        <option value="colher">colher</option>
                      </SelectInput>
                      <TextInput value={current?.note || ''} placeholder="Obs." onChange={(event) => updateMealItem(activePerson, meal, foodKey, { note: event.target.value })} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900"><Scale className="h-5 w-5 text-cyan-600" /> Totais</h3>
            <div className="grid gap-4">
              <ProgressBar label="Agua" value={activeTotals.water_ml} target={PEOPLE[activePerson].waterTarget[0]} unit="ml" tone="blue" />
              <ProgressBar label="Calorias" value={activeTotals.calories} target={PEOPLE[activePerson].calorieTarget[0]} unit="kcal" tone={activePerson === 'pablo' ? 'green' : 'rose'} />
              <ProgressBar label="Proteina" value={activeTotals.protein} target={PEOPLE[activePerson].proteinTarget[0]} unit="g" tone="green" />
              <div className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-700">
                Acucar estimado: {activeTotals.sugar}g
              </div>
              <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-600">
                Falta: {activeTotals.calories_remaining} kcal, {activeTotals.protein_remaining}g proteina, {activeTotals.water_remaining}ml agua.
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900"><AlertTriangle className="h-5 w-5 text-amber-500" /> Feedback</h3>
            <div className="space-y-3">
              {activeTotals.warnings.map((warning, index) => (
                <div key={`${warning.text}-${index}`} className={`rounded-2xl px-4 py-3 text-sm font-bold ${warning.type === 'danger' ? 'bg-red-100 text-red-800' : warning.type === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {warning.text}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900"><CalendarDays className="h-5 w-5 text-rose-500" /> Cronograma</h3>
            <div className="space-y-2">
              {(activePerson === 'pablo' ? PABLO_SCHEDULE : ANA_SCHEDULE).map(([time, task]) => (
                <div key={`${time}-${task}`} className="grid grid-cols-[100px_1fr] rounded-2xl bg-white/80 px-3 py-2 text-sm">
                  <span className="font-bold text-slate-800">{time}</span>
                  <span className="text-slate-600">{task}</span>
                </div>
              ))}
            </div>
            {activePerson === 'pablo' ? (
              <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-xs font-bold leading-5 text-cyan-900">
                Jantar tarde nao cria barriga sozinho, mas facilita exageros. O foco do Pablo e jantar antes da faculdade e fazer so ceia leve ao chegar.
              </p>
            ) : (
              <div className="mt-4 space-y-2 text-xs font-bold leading-5 text-pink-900">
                <p className="rounded-2xl bg-pink-50 p-3">Terca: sair 13h para estagio, almoco reforcado antes e levar lanche.</p>
                <p className="rounded-2xl bg-pink-50 p-3">Quarta: sair 9h para reuniao, cafe antes e treino a tarde se estiver bem.</p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900"><Dumbbell className="h-5 w-5 text-emerald-600" /> Treinos</h3>
            <div className="space-y-3">
              {WORKOUTS[activePerson].map((workout) => (
                <details key={workout.name} className="rounded-2xl bg-white/80 p-4">
                  <summary className="cursor-pointer font-bold text-slate-800">{workout.name}</summary>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {workout.steps.map((step) => <li key={step}>{step}</li>)}
                  </ul>
                </details>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-xl backdrop-blur-xl">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900">Exportar dia para o ChatGPT</h2>
            <p className="text-sm text-slate-500">Gera um texto organizado com tudo que foi preenchido no dia.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportReport('pablo')} className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white">Exportar Pablo</button>
            <button onClick={() => exportReport('ana_clara')} className="rounded-2xl bg-pink-600 px-4 py-3 text-sm font-bold text-white">Exportar Ana</button>
            <button onClick={() => exportReport('couple')} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Exportar casal</button>
          </div>
        </div>
        <textarea readOnly value={report} placeholder="Clique em uma opcao de exportacao para gerar o relatorio." className="min-h-72 w-full rounded-2xl border border-white/70 bg-white/80 p-4 font-mono text-xs text-slate-700 outline-none" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={copyReport} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><Clipboard className="h-4 w-4" /> Copiar relatorio</button>
          <button onClick={downloadReport} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><Download className="h-4 w-4" /> Baixar .txt</button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/60 p-5 text-sm leading-6 text-slate-600 shadow-lg backdrop-blur-xl">
        <h2 className="mb-2 font-serif text-2xl font-bold text-slate-900">Dados iniciais de 01/06</h2>
        <p>
          Para registrar o primeiro dia do Pablo, marque cafe com acucar 180ml; almoco com arroz 134g, feijao 94g, brocolis 70g, carne bovina 128g e Coca normal 218ml; e marque Uber/caminhada reduzida se foi o caso.
        </p>
      </section>
    </motion.div>
  );
}
