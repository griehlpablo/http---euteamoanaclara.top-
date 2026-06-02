import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import OneSignal from 'react-onesignal';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  Dumbbell,
  HeartPulse,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Scale,
  Trash2,
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
    waterDefault: 2700,
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
    waterDefault: 2200,
    workoutGoal: 'Gluteo/perna 3 a 4x por semana',
  },
};

const DEFAULT_REMINDER_SETTINGS = {
  pablo: {
    enabled: true,
    water: true,
    meals: true,
    goals: true,
    workout: true,
    smartFrequency: true,
    waterInterval: 60,
    startTime: '07:00',
    endTime: '23:30',
    tone: 'firme',
  },
  ana_clara: {
    enabled: true,
    water: true,
    meals: true,
    goals: true,
    workout: true,
    smartFrequency: true,
    waterInterval: 60,
    startTime: '08:30',
    endTime: '22:30',
    tone: 'normal',
  },
};

const DEVICE_NOTIFICATION_STORAGE_KEY = 'healthNotificationDeviceSettings';
const NOTIFICATION_DEBUG_LOG_KEY = 'notificationDebugLog';
const LAST_NOTIFICATION_AT_KEY = 'healthNotificationLastAt';
const DEFAULT_DEVICE_NOTIFICATION_SETTINGS = {
  enabled: true,
  people: {
    pablo: true,
    ana_clara: true,
  },
  water: true,
  meals: true,
  goals: true,
  workout: true,
  quietHours: {
    enabled: true,
    start: '23:30',
    end: '07:00',
  },
};
const NOTIFICATION_COOLDOWNS = {
  water: 30,
  meals: 60,
  goals: 60,
  workout: 120,
  test: 0,
};

const FOOD_CATEGORIES = [
  ['caseiro', 'caseiro/comida de verdade'],
  ['processado', 'processado'],
  ['ultraprocessado', 'ultraprocessado'],
  ['doce', 'doce/sobremesa'],
  ['bebida_acucar', 'bebida com acucar'],
  ['bebida_zero', 'bebida zero/sem acucar'],
  ['energetico', 'energetico'],
  ['fruta', 'fruta'],
  ['legume', 'legume/verdura'],
  ['proteina', 'proteina'],
  ['carboidrato', 'carboidrato'],
  ['gordura_molho', 'gordura/molho'],
  ['lanche_padaria', 'lanche/padaria'],
  ['pizza', 'pizza'],
  ['fast_food', 'fast food'],
  ['outro', 'outro'],
];

const UNIT_OPTIONS = [
  ['g', 'g'],
  ['kg', 'kg'],
  ['ml', 'ml'],
  ['litro', 'litro'],
  ['unidade', 'unidade'],
  ['fatia', 'fatia'],
  ['pedaco', 'pedaco'],
  ['colher_cha', 'colher de cha'],
  ['colher_sopa', 'colher de sopa'],
  ['colher_arroz_pequena', 'colher de arroz pequena'],
  ['colher_arroz_media', 'colher de arroz media'],
  ['colher_arroz_cheia', 'colher de arroz cheia'],
  ['concha_pequena', 'concha pequena'],
  ['concha_media', 'concha media'],
  ['copo_180', 'copo 180 ml'],
  ['copo_250', 'copo 250 ml'],
  ['xicara', 'xicara'],
  ['prato_raso', 'prato raso'],
  ['prato_cheio', 'prato cheio'],
];

const UNIT_CONVERSIONS = {
  kg: 1000,
  litro: 1000,
  colher_cha: 5,
  colher_sopa: 12,
  colher_arroz_pequena: 40,
  colher_arroz_media: 60,
  colher_arroz_cheia: 80,
  concha_pequena: 70,
  concha_media: 100,
  copo_180: 180,
  copo_250: 250,
  xicara: 200,
  fatia: 50,
  pedaco: 80,
  prato_raso: 250,
  prato_cheio: 350,
  unidade: 1,
};

const QUICK_ACTIONS = {
  pablo: [
    { label: '+ Cafe acucar 180 ml', meal: 'breakfast', food: 'cafe_com_acucar', amount: 180, unit: 'ml' },
    { label: '+ Cafe sem acucar 180 ml', meal: 'breakfast', food: 'cafe_sem_acucar', amount: 180, unit: 'ml' },
    { label: '+ Agua 280 ml', water: 280 },
    { label: '+ Agua 500 ml', water: 500 },
    { label: '+ Arroz 100 g', meal: 'lunch', food: 'arroz', amount: 100, unit: 'g' },
    { label: '+ Feijao 100 g', meal: 'lunch', food: 'feijao', amount: 100, unit: 'g' },
    { label: '+ Carne 100 g', meal: 'lunch', food: 'carne_bovina', amount: 100, unit: 'g' },
    { label: '+ Ovo 1 un.', meal: 'extras', food: 'ovo', amount: 1, unit: 'unidade' },
    { label: '+ Coca normal 200 ml', meal: 'extras', food: 'refrigerante_normal', amount: 200, unit: 'ml' },
    { label: '+ Monster zero 473 ml', meal: 'extras', custom: { label: 'Monster zero', category: 'energetico', amount: 473, unit: 'ml', calories: 0, protein: 0, sugar: 0, notes: 'Energetico zero; nao substitui agua.' } },
  ],
  ana_clara: [
    { label: '+ Vitamina banana/leite/aveia', meal: 'snack', food: 'vitamina', amount: 350, unit: 'ml' },
    { label: '+ Agua 250 ml', water: 250 },
    { label: '+ Ovo 1 un.', meal: 'snack', food: 'ovo', amount: 1, unit: 'unidade' },
    { label: '+ Banana 1 un.', meal: 'snack', food: 'banana', amount: 1, unit: 'unidade' },
    { label: '+ Arroz 150 g', meal: 'lunch', food: 'arroz', amount: 150, unit: 'g' },
    { label: '+ Feijao 100 g', meal: 'lunch', food: 'feijao', amount: 100, unit: 'g' },
    { label: '+ Frango 100 g', meal: 'lunch', food: 'frango', amount: 100, unit: 'g' },
  ],
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
    class_today: false,
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
    class_today: false,
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

function createCustomMealItem(overrides = {}) {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    custom: true,
    food: 'outro',
    label: '',
    category: 'outro',
    amount: '',
    unit: 'g',
    grams_or_ml: '',
    calories: '',
    protein: '',
    sugar: '',
    notes: '',
    ...overrides,
  };
}

function amountForCalculation(item, food) {
  const amount = Number(item.amount) || 0;
  if (item.grams_or_ml !== '' && item.grams_or_ml !== undefined && item.grams_or_ml !== null) return Number(item.grams_or_ml) || 0;
  if (item.unit === 'kg') return amount * 1000;
  if (item.unit === 'litro') return amount * 1000;
  if (item.unit === food.unit || ['g', 'ml', 'unidade'].includes(item.unit)) return amount;
  return amount * (UNIT_CONVERSIONS[item.unit] || 1);
}

function categoryWarning(item) {
  const label = item.label || 'Item personalizado';
  if (item.category === 'bebida_acucar') return { type: 'danger', text: `${label}: acucar liquido registrado. Melhor tratar como excecao.` };
  if (item.category === 'energetico') return { type: 'warning', text: `${label}: energetico nao substitui agua; cuidado com cafeina.` };
  if (['ultraprocessado', 'fast_food', 'pizza'].includes(item.category)) return { type: 'warning', text: `${label}: item mais calorico/processado, vale moderar no resto do dia.` };
  if (item.category === 'doce') return { type: 'warning', text: `${label}: doce registrado; ajuste as proximas escolhas.` };
  return null;
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
    class_today: Boolean(row.meals?._meta?.class_today),
    totals: row.totals || {},
  };
}

function calculateTotals(log) {
  const allItems = Object.values(log.meals || {}).flat();
  const totals = allItems.reduce(
    (acc, item) => {
      const food = FOOD_DB[item.food] || FOOD_DB.outro;
      const amount = amountForCalculation(item, food);
      const multiplier = amount / food.basis;
      const hasCustomNumbers = item.custom && (item.calories !== '' || item.protein !== '' || item.sugar !== '');
      const itemCalories = hasCustomNumbers ? Number(item.calories) || 0 : food.kcal * multiplier;
      const itemProtein = hasCustomNumbers ? Number(item.protein) || 0 : food.protein * multiplier;
      const itemSugar = hasCustomNumbers ? Number(item.sugar) || 0 : food.sugar * multiplier;
      acc.calories += itemCalories;
      acc.protein += itemProtein;
      acc.sugar += itemSugar;
      if (food.liquidSugar || item.category === 'bebida_acucar') acc.liquidSugar += itemSugar;
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
  const customWarnings = Object.values(log.meals || {})
    .flat()
    .filter((item) => item.custom)
    .map(categoryWarning)
    .filter(Boolean);
  warnings.push(...customWarnings);

  if (log.person === 'pablo') {
    const hasSoda = Object.keys(log.meals || {}).some((meal) => mealHas(log, meal, 'refrigerante_normal'));
    const hasSugarCoffee = Object.keys(log.meals || {}).some((meal) => mealHas(log, meal, 'cafe_com_acucar'));
    if (hasSoda && hasSugarCoffee) warnings.push({ type: 'warning', text: 'Pablo, aqui voce esta se sabotando: Coca + cafe com acucar no mesmo dia nao ajuda sua barriga.' });
    if (totals.liquidSugar > 25) warnings.push({ type: 'danger', text: 'Pablo tomou muito acucar liquido hoje.' });
    if (log.used_uber || (log.walked === false && log.walked_km !== '')) warnings.push({ type: 'warning', text: 'Hoje voce andou menos; controle melhor a noite.' });
    if (!mealFilled(log, 'dinner')) warnings.push({ type: 'warning', text: 'Pablo: tente jantar antes da faculdade para nao chegar com fome extrema.' });
    if ((log.meals?.supper || []).some((item) => ['pao', 'ovo', 'leite'].includes(item.food) && Number(item.amount) > 1)) warnings.push({ type: 'warning', text: 'Ceia ficou pesada tarde; prefira algo mais leve se ja jantou.' });
    if ((Number(log.water_ml) || 0) < 1000) warnings.push({ type: 'warning', text: 'Agua esta baixa. Monster zero nao substitui agua.' });
  }

  if (log.person === 'ana_clara') {
    const trainedGlutes = ['gluteo_a', 'gluteo_b', 'gluteo_pump'].includes(log.workout);
    if (trainedGlutes && totals.calories < 1500) warnings.push({ type: 'warning', text: 'Ana Clara: em dia de gluteo, voce parece ter comido pouco.' });
    if (trainedGlutes && !mealFilled(log, 'snack')) warnings.push({ type: 'warning', text: 'Ana Clara: em dia de gluteo, nao pule lanche/vitamina.' });
    if (trainedGlutes && totals.protein < 60) warnings.push({ type: 'warning', text: 'Dia de gluteo precisa de proteina e comida suficiente.' });
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

function buildLogPayload(log, selectedDate, userId = null) {
  const totals = calculateTotals(log);
  const mealsPayload = {
    ...(log.meals || EMPTY_MEALS),
    _meta: {
      ...(log.meals?._meta || {}),
      class_today: Boolean(log.class_today),
    },
  };
  return {
    user_id: userId,
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
    meals: mealsPayload,
    totals,
    status: getStatus(log, totals),
  };
}

function itemLabel(item) {
  const food = FOOD_DB[item.food] || FOOD_DB.outro;
  const amount = Number(item.amount) || 0;
  const label = item.custom ? item.label || 'Outro item' : food.label;
  const note = item.custom ? item.notes : item.note;
  const macros = item.custom && (item.calories || item.protein || item.sugar)
    ? ` - ${item.calories || 0} kcal, ${item.protein || 0}g prot., ${item.sugar || 0}g acucar`
    : '';
  return `${label}: ${amount} ${item.unit || food.unit}${macros}${note ? ` (${note})` : ''}`;
}

function getRecommendations(log, totals) {
  const person = log.person;
  const profile = PEOPLE[person];
  const recs = [];
  const trainedGlutes = person === 'ana_clara' && ['gluteo_a', 'gluteo_b', 'gluteo_pump'].includes(log.workout);
  const proteinMissing = Math.max(0, profile.proteinTarget[0] - totals.protein);
  const caloriesMissing = Math.max(0, profile.calorieTarget[0] - totals.calories);

  if (person === 'pablo') {
    if (proteinMissing >= 35 && totals.calories < profile.calorieTarget[1]) recs.push(`Faltam ${proteinMissing.toFixed(0)}g de proteina. Melhor opcao: frango, ovos, sardinha ou carne em porcao controlada.`);
    if (proteinMissing >= 25 && totals.calories >= profile.calorieTarget[1]) recs.push('Proteina baixa com caloria alta: vai de frango mais magro, sardinha escorrida ou iogurte natural se tiver.');
    if (caloriesMissing >= 350 && proteinMissing < 20) recs.push('Calorias baixas e proteina ok: arroz/feijao simples, banana, leite ou pao simples resolvem sem bagunca.');
    if (totals.liquid_sugar > 15) recs.push('Voce ja consumiu acucar liquido hoje. Evite Coca, doces e bolacha agora.');
    if (log.used_uber) recs.push('Hoje teve menos caminhada. Janta controlada e sem belisco tarde.');
    if (!mealFilled(log, 'dinner')) recs.push('Pablo, janta antes da faculdade. Se deixar para 23h20, a chance de exagerar sobe.');
    if (log.appetite === 'vontade_doce') recs.push(totals.sugar > 25 ? 'Vontade de doce com acucar alto: agua, cafe sem acucar, banana ou espera 20 minutos.' : 'Se bater doce, prefira banana ou leite antes de atacar bolacha/refrigerante.');
    if (log.appetite === 'muita_fome' && proteinMissing > 25) recs.push('Muita fome e proteina baixa: ovos, carne ou frango antes de pensar em pao com requeijao.');
  } else {
    if (trainedGlutes && (proteinMissing >= 20 || caloriesMissing >= 300)) recs.push('Dia de construir gluteo: vitamina de banana + leite + aveia e 2 ovos ajudam bastante.');
    if (!mealFilled(log, 'snack')) recs.push('Ana Clara, nao pula lanche/vitamina. Comer pouco demais atrapalha o objetivo.');
    if (proteinMissing >= 20) recs.push('Proteina baixa: ovos, frango, carne, leite ou iogurte entram bem hoje.');
    if (caloriesMissing >= 350) recs.push('Calorias baixas: banana + aveia + leite, pao com ovo ou arroz/feijao ajudam sem complicar.');
    if (log.appetite === 'muita_fome' && trainedGlutes) recs.push('Muita fome em dia de gluteo: faz uma vitamina ou refeicao reforcada, sem medo de comer direito.');
  }

  if ((Number(log.water_ml) || 0) >= profile.waterTarget[0] && totals.protein >= profile.proteinTarget[0]) recs.push('Dia perfeito encaminhado: agua + proteina batendo meta.');
  if (!recs.length) recs.push(person === 'pablo' ? 'Boa escolha: comida de verdade e constancia ganham o jogo.' : 'Boa: mantenha agua, proteina e refeicoes suficientes.');
  return recs;
}

function getSabotageRisk(log, totals) {
  const profile = PEOPLE[log.person];
  const reasons = [];
  const customItems = Object.values(log.meals || {}).flat().filter((item) => item.custom);
  const ultraCount = customItems.filter((item) => ['ultraprocessado', 'fast_food', 'pizza'].includes(item.category)).length;

  if ((Number(log.water_ml) || 0) < profile.waterTarget[0] * 0.55) reasons.push('agua baixa');
  if (totals.liquid_sugar > 15) reasons.push('acucar liquido');
  if (totals.protein < profile.proteinTarget[0] * 0.65) reasons.push('proteina baixa');
  if (totals.calories > profile.calorieTarget[1]) reasons.push('calorias acima da meta');
  if (totals.calories > 0 && totals.calories < profile.calorieTarget[0] * 0.6) reasons.push('calorias muito baixas');
  if (log.person === 'pablo' && (log.used_uber || (log.walked === false && log.walked_km !== ''))) reasons.push('andou pouco/usou Uber');
  if (ultraCount >= 2) reasons.push('muitos ultraprocessados');
  if (log.person === 'pablo' && log.class_today && !mealFilled(log, 'dinner')) reasons.push('aula hoje sem janta marcada');
  if (log.appetite === 'vontade_doce') reasons.push('vontade de doce');
  if ((log.meals?.supper || []).some((item) => ['pao', 'ovo', 'leite'].includes(item.food) && Number(item.amount) > 1)) reasons.push('ceia pesada');

  if (reasons.length >= 3 || totals.liquid_sugar > 25) return { label: 'Risco alto', tone: 'bg-red-100 text-red-800', reasons };
  if (reasons.length) return { label: 'Atencao', tone: 'bg-amber-100 text-amber-800', reasons };
  return { label: 'Bom', tone: 'bg-emerald-100 text-emerald-800', reasons: ['dia bem encaminhado'] };
}

function getEatNowSuggestion(log, totals, now = new Date()) {
  const hour = now.getHours();
  const profile = PEOPLE[log.person];
  const proteinMissing = Math.max(0, profile.proteinTarget[0] - totals.protein);
  const caloriesMissing = Math.max(0, profile.calorieTarget[0] - totals.calories);
  const late = hour >= 22;

  if (log.person === 'pablo') {
    if (late && mealFilled(log, 'dinner')) return 'Ja jantou e esta tarde. Se tiver fome real, ceia leve: iogurte, leite ou 1-2 ovos. Se for vontade, agua e dormir.';
    if (log.class_today && !mealFilled(log, 'dinner') && hour >= 17) return 'Hoje tem aula: prioriza jantar antes das 18h30 com arroz/feijao e frango/carne/ovos.';
    if (totals.liquid_sugar > 15) return 'Acucar ja subiu hoje. Evita doce, refrigerante, pessego em calda e bolacha. Vai de proteina simples ou banana se precisar.';
    if ((log.used_uber || !log.walked) && hour >= 18) return 'Como andou pouco/usou Uber, nao compensa com lanche pesado. Melhor comida de verdade e porcao controlada.';
    if (proteinMissing >= 30 && totals.calories < profile.calorieTarget[1]) return 'Pode comer ovos, carne, frango, leite ou iogurte para subir proteina sem baguncar o dia.';
    if (caloriesMissing >= 350 && proteinMissing < 20) return 'Calorias ainda baixas: arroz/feijao, banana com leite ou pao simples resolvem sem exagero.';
    return 'Melhor escolha agora: agua primeiro, depois comida de verdade com proteina se a fome continuar.';
  }

  const trainedGlutes = ['gluteo_a', 'gluteo_b', 'gluteo_pump'].includes(log.workout);
  if (trainedGlutes && (proteinMissing >= 20 || caloriesMissing >= 300)) return 'Dia de gluteo: vitamina de banana com leite e aveia, ovos ou arroz/feijao/frango ajudam muito.';
  if (caloriesMissing >= 350) return 'Calorias baixas: banana com leite e aveia, pao com ovo ou arroz/feijao sao boas opcoes.';
  if (proteinMissing >= 20) return 'Proteina baixa: ovos, carne, frango, leite ou iogurte entram bem agora.';
  return 'Mantem simples: agua, uma refeicao com proteina ou lanche leve se a fome for real.';
}

function getCloseDaySuggestions(log, totals) {
  const profile = PEOPLE[log.person];
  const suggestions = [];
  const waterMissing = Math.max(0, profile.waterTarget[0] - (Number(log.water_ml) || 0));
  const proteinMissing = Math.max(0, profile.proteinTarget[0] - totals.protein);

  if (waterMissing >= 300) suggestions.push(`Tome mais ${Math.min(1000, Math.ceil(waterMissing / 100) * 100)} ml de agua.`);
  if (totals.liquid_sugar > 10) suggestions.push(log.person === 'pablo' ? 'Nao coma doce hoje e amanha evite Coca.' : 'Evite doce/refrigerante para fechar melhor o dia.');
  if (proteinMissing >= 20) suggestions.push(log.person === 'pablo' ? 'Se tiver fome, coma 2 ovos, frango ou iogurte.' : 'Se tiver fome, vitamina, ovos ou frango ajudam a fechar proteina.');
  if (log.person === 'pablo' && log.class_today && !mealFilled(log, 'dinner')) suggestions.push('Jante antes da faculdade ou faca ceia leve ao voltar, sem lanche pesado.');
  if (!suggestions.length) suggestions.push('Fechamento bom: mantenha agua e nao invente belisco sem fome.');
  return suggestions;
}

function getWeeklySummary(logsByDate, person, selectedDate) {
  const end = parseLocalDate(selectedDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - index));
    const key = dateToKey(date);
    const log = logsByDate[key]?.[person];
    if (!log) return null;
    const totals = calculateTotals(log);
    const risk = getSabotageRisk(log, totals);
    return { key, log, totals, risk };
  }).filter(Boolean);

  if (!days.length) return null;
  const weights = days.map((day) => Number(day.log.weight_kg)).filter(Boolean);
  const average = (items, getter) => Math.round(items.reduce((sum, item) => sum + getter(item), 0) / Math.max(1, items.length));
  const warningReasons = days.flatMap((day) => day.risk.reasons.filter((reason) => reason !== 'dia bem encaminhado'));
  const reasonCounts = warningReasons.reduce((acc, reason) => ({ ...acc, [reason]: (acc[reason] || 0) + 1 }), {});
  const mainIssue = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'sem erro claro';
  const waterOkDays = days.filter((day) => day.totals.water_ml >= PEOPLE[person].waterTarget[0]).length;
  const proteinOkDays = days.filter((day) => day.totals.protein >= PEOPLE[person].proteinTarget[0]).length;

  return {
    startWeight: weights[0] || null,
    endWeight: weights[weights.length - 1] || null,
    averageWater: average(days, (day) => day.totals.water_ml),
    averageProtein: average(days, (day) => day.totals.protein),
    averageCalories: average(days, (day) => day.totals.calories),
    goodDays: days.filter((day) => day.risk.label === 'Bom').length,
    attentionDays: days.filter((day) => day.risk.label !== 'Bom').length,
    mainIssue,
    mainWin: waterOkDays >= proteinOkDays ? 'agua apareceu melhor na semana' : 'proteina apareceu melhor na semana',
  };
}

function getSmartWaterInterval(log, settings) {
  if (!settings.smartFrequency) return Number(settings.waterInterval) || 60;
  const target = PEOPLE[log.person].waterDefault;
  const water = Number(log.water_ml) || 0;
  if (water >= target) return 0;
  const now = new Date();
  const [endHour, endMinute] = (settings.endTime || '23:00').split(':').map(Number);
  const end = new Date();
  end.setHours(endHour || 23, endMinute || 0, 0, 0);
  const hoursLeft = Math.max(1, (end - now) / 36e5);
  const neededPerHour = Math.max(0, target - water) / hoursLeft;
  if (neededPerHour > 350) return 45;
  if (neededPerHour < 170) return 90;
  return 60;
}

function buildReminderMessage(log) {
  const profile = PEOPLE[log.person];
  const waterMissing = Math.max(0, profile.waterDefault - (Number(log.water_ml) || 0));
  if (waterMissing <= 0) return `${profile.short}, meta de agua batida. Boa!`;
  if (log.person === 'pablo') {
    return waterMissing > 1200
      ? 'Pablo, agua baixa hoje. Toma 300 ml agora para salvar o dia.'
      : 'Pablo, voce esta atrasado na hidratacao. Nada de so cafe e Monster, toma agua.';
  }
  return waterMissing > 900 ? 'Ana Clara, hora da agua. Tenta tomar 250 ml agora.' : 'Boa! Meta de agua quase batida. Falta pouco.';
}

function timeToMinutes(value) {
  const [hours, minutes] = (value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function cloneDeviceNotificationSettings(settings = DEFAULT_DEVICE_NOTIFICATION_SETTINGS) {
  return {
    ...DEFAULT_DEVICE_NOTIFICATION_SETTINGS,
    ...settings,
    people: {
      ...DEFAULT_DEVICE_NOTIFICATION_SETTINGS.people,
      ...(settings.people || {}),
    },
    quietHours: {
      ...DEFAULT_DEVICE_NOTIFICATION_SETTINGS.quietHours,
      ...(settings.quietHours || {}),
    },
  };
}

function loadDeviceNotificationSettings() {
  try {
    return cloneDeviceNotificationSettings(JSON.parse(localStorage.getItem(DEVICE_NOTIFICATION_STORAGE_KEY) || 'null') || DEFAULT_DEVICE_NOTIFICATION_SETTINGS);
  } catch {
    return cloneDeviceNotificationSettings();
  }
}

function saveDeviceNotificationSettings(settings) {
  const next = cloneDeviceNotificationSettings(settings);
  localStorage.setItem(DEVICE_NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
  return next;
}

function isInsideQuietHours(quietHours, now = new Date()) {
  if (!quietHours?.enabled) return false;
  const start = timeToMinutes(quietHours.start);
  const end = timeToMinutes(quietHours.end);
  const current = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false;
  if (start < end) return current >= start && current < end;
  return current >= start || current < end;
}

function readNotificationDebugLog() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATION_DEBUG_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function readLastNotificationAt() {
  try {
    return JSON.parse(localStorage.getItem(LAST_NOTIFICATION_AT_KEY) || '{}');
  } catch {
    return {};
  }
}

function formatEnabledPeople(settings) {
  if (!settings.enabled) return 'Notificacoes desativadas neste dispositivo';
  const enabled = Object.entries(settings.people || {})
    .filter(([, value]) => value)
    .map(([person]) => PEOPLE[person]?.short)
    .filter(Boolean);
  return enabled.length ? `Este dispositivo recebe notificacoes de: ${enabled.join(' e ')}` : 'Nenhuma pessoa ativada neste dispositivo';
}

function isInsideReminderWindow(settings, now = new Date()) {
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= timeToMinutes(settings.startTime) && current <= timeToMinutes(settings.endTime);
}

function getTimedReminder(log, totals, now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const profile = PEOPLE[log.person];
  if (log.person === 'pablo') {
    if (minutes >= timeToMinutes('18:30') && !mealFilled(log, 'dinner')) {
      return 'Pablo, janta antes da faculdade. Se deixar pra 23h20, a chance de exagerar sobe.';
    }
    if (minutes >= timeToMinutes('23:20') && (!mealFilled(log, 'dinner') || totals.protein < profile.proteinTarget[0])) {
      return 'Pablo, ceia leve agora: proteina simples e nada de exagerar tarde.';
    }
    if (minutes >= timeToMinutes('17:00') && log.workout === 'descanso') {
      return 'Pablo, se couber hoje, faz pelo menos treino curto ou caminhada.';
    }
  } else {
    if (minutes >= timeToMinutes('16:30') && !mealFilled(log, 'snack')) {
      return 'Ana Clara, dia de construir gluteo: nao pula lanche/vitamina.';
    }
    if (minutes >= timeToMinutes('17:00') && log.workout === 'descanso') {
      return 'Ana Clara, se hoje for dia de perna/gluteo, ja deixa o treino encaminhado.';
    }
    if (totals.protein < profile.proteinTarget[0] || totals.calories < profile.calorieTarget[0]) {
      return 'Ana Clara, ainda falta comida boa para bater proteina/caloria hoje.';
    }
  }
  return null;
}

function settingsToRow(person, settings) {
  return {
    person,
    water_reminders_enabled: Boolean(settings.water),
    meal_reminders_enabled: Boolean(settings.meals),
    goal_reminders_enabled: Boolean(settings.goals),
    workout_reminders_enabled: Boolean(settings.workout),
    smart_frequency: Boolean(settings.smartFrequency),
    default_water_interval_minutes: Number(settings.waterInterval) || 60,
    reminder_start_time: settings.startTime || DEFAULT_REMINDER_SETTINGS[person].startTime,
    reminder_end_time: settings.endTime || DEFAULT_REMINDER_SETTINGS[person].endTime,
    updated_at: new Date().toISOString(),
  };
}

function rowToSettings(row) {
  return {
    enabled: true,
    water: row.water_reminders_enabled,
    meals: row.meal_reminders_enabled,
    goals: row.goal_reminders_enabled,
    workout: row.workout_reminders_enabled,
    smartFrequency: row.smart_frequency,
    waterInterval: row.default_water_interval_minutes,
    startTime: row.reminder_start_time,
    endTime: row.reminder_end_time,
  };
}

function getDayScore(log, totals) {
  const profile = PEOPLE[log.person];
  if (!Object.values(log.meals || {}).some((items) => items.length) && !Number(log.water_ml)) return { label: 'vazio', tone: 'bg-slate-100 text-slate-600' };
  const waterOk = Number(log.water_ml) >= profile.waterTarget[0];
  const proteinOk = totals.protein >= profile.proteinTarget[0];
  const caloriesLow = totals.calories < profile.calorieTarget[0] * 0.7;
  const sugarHigh = log.person === 'pablo' && totals.liquid_sugar > 25;
  if (waterOk && proteinOk && !sugarHigh) return { label: 'bom', tone: 'bg-emerald-100 text-emerald-800' };
  if (caloriesLow || sugarHigh || Number(log.water_ml) < profile.waterTarget[0] * 0.45) return { label: 'ruim', tone: 'bg-red-100 text-red-800' };
  return { label: 'atencao', tone: 'bg-amber-100 text-amber-800' };
}

function getMonthHistory(logsByDate, person) {
  return Object.entries(logsByDate)
    .map(([date, logs]) => {
      const log = logs?.[person];
      if (!log) return null;
      const totals = calculateTotals(log);
      return {
        date,
        weight: Number(log.weight_kg) || 0,
        water: Number(log.water_ml) || 0,
        protein: totals.protein || 0,
        status: log.status,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getStreak(logsByDate) {
  let streak = 0;
  const cursor = new Date();
  while (streak < 370) {
    const key = dateToKey(cursor);
    const dayLogs = logsByDate[key] || {};
    const registered = Object.values(dayLogs).some((log) => log.status && log.status !== 'empty');
    if (!registered) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function applyFeedbackTone(warnings, tone) {
  if (tone === 'firme') return warnings;
  return warnings.map((warning) => {
    if (tone === 'leve' && warning.type !== 'ok') {
      return {
        ...warning,
        text: warning.text
          .replace('Pablo, aqui voce esta se sabotando: ', 'Atencao, Pablo: ')
          .replace('nao ajuda sua barriga', 'pode atrapalhar seu objetivo')
          .replace('Nada de so cafe e Monster, toma agua.', 'Tenta tomar agua agora.'),
      };
    }
    if (tone === 'normal' && warning.type !== 'ok') {
      return {
        ...warning,
        text: warning.text.replace('Pablo, aqui voce esta se sabotando: ', 'Pablo, ponto de atencao: '),
      };
    }
    return warning;
  });
}

function buildReport(logs, selectedDate, mode) {
  const people = mode === 'couple' ? ['pablo', 'ana_clara'] : [mode];
  return people
    .map((person) => {
      const log = logs[person];
      const totals = calculateTotals(log);
      const recommendations = getRecommendations(log, totals);
      const customItems = Object.values(log.meals || {}).flat().filter((item) => item.custom);
      const unknownCustom = Object.values(log.meals || {}).flat().filter((item) => item.custom && !item.calories && !item.protein && !item.sugar);
      const lines = [
        `RELATORIO DO DIA - ${formatDateBr(selectedDate)}`,
        `Pessoa: ${PEOPLE[person].label}`,
        `Peso: ${log.weight_kg || '-'}`,
        `Sono: ${log.sleep_time || '-'}`,
        `Agua: ${log.water_ml || 0} ml`,
        person === 'pablo' ? `Caminhada: ${log.walked ? 'sim' : 'nao'} ${log.walked_km ? `(${log.walked_km} km)` : ''}` : null,
        person === 'pablo' ? `Usou Uber: ${log.used_uber ? 'sim' : 'nao'}` : null,
        `Treino: ${log.workout || '-'}`,
        `Fome agora: ${log.appetite || '-'}`,
        `Cafe da manha: ${(log.meals.breakfast || []).map(itemLabel).join('; ') || '-'}`,
        `Almoco: ${(log.meals.lunch || []).map(itemLabel).join('; ') || '-'}`,
        person === 'ana_clara' ? `Lanche/vitamina: ${(log.meals.snack || []).map(itemLabel).join('; ') || '-'}` : null,
        person === 'pablo' ? `Janta antes da faculdade: ${(log.meals.dinner || []).map(itemLabel).join('; ') || '-'}` : `Janta: ${(log.meals.dinner || []).map(itemLabel).join('; ') || '-'}`,
        `Ceia: ${(log.meals.supper || []).map(itemLabel).join('; ') || '-'}`,
        person === 'pablo' ? `Extras: ${(log.meals.extras || []).map(itemLabel).join('; ') || '-'}` : null,
        `Itens personalizados: ${customItems.map(itemLabel).join('; ') || '-'}`,
        `Calorias estimadas: ${totals.calories} kcal`,
        `Proteina estimada: ${totals.protein} g`,
        `Acucar estimado: ${totals.sugar} g`,
        `Alertas do sistema: ${totals.warnings.map((warning) => warning.text).join(' | ')}`,
        `Recomendacoes do site: ${recommendations.join(' | ')}`,
        `Itens sem valor nutricional conhecido: ${unknownCustom.map((item) => item.label || 'Outro').join('; ') || '-'}`,
        `Observacoes: ${log.notes || '-'}`,
        'Pergunta para o ChatGPT: Analise meu dia e me diga o que ajustar ainda hoje ou amanha.',
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
  const [notificationStatus, setNotificationStatus] = useState('idle');
  const [lastReminder, setLastReminder] = useState(null);
  const [lastBlockedNotification, setLastBlockedNotification] = useState(null);
  const [notificationDebugLog, setNotificationDebugLog] = useState(() => readNotificationDebugLog());
  const [deviceNotificationSettings, setDeviceNotificationSettings] = useState(() => loadDeviceNotificationSettings());
  const [deviceSetupNeeded, setDeviceSetupNeeded] = useState(() => !localStorage.getItem(DEVICE_NOTIFICATION_STORAGE_KEY));
  const [testCountdown, setTestCountdown] = useState('');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [isStandalonePwa] = useState(() => Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone));
  const [settingsSaveState, setSettingsSaveState] = useState('local');
  const [actionMessage, setActionMessage] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [eatNowSuggestion, setEatNowSuggestion] = useState('');
  const [reminderSettings, setReminderSettings] = useState(() => {
    try {
      return { ...DEFAULT_REMINDER_SETTINGS, ...(JSON.parse(localStorage.getItem('diet-reminder-settings') || '{}')) };
    } catch {
      return DEFAULT_REMINDER_SETTINGS;
    }
  });
  const didLoadRef = useRef(false);
  const saveTimerRef = useRef(null);
  const reminderMinuteRef = useRef('');
  const waterReminderTimersRef = useRef([]);
  const timedReminderIntervalRef = useRef(null);
  const testNotificationTimersRef = useRef([]);
  const notifyUserRef = useRef(null);

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

    const payload = Object.values(selectedLogs).map((log) => buildLogPayload(log, selectedDate, user?.id || null));

    const { error } = await supabase
      .from('daily_health_logs')
      .upsert(payload, { onConflict: 'person,log_date' })
      .select();

    setSaveState(error ? 'error' : 'saved');
    if (error) {
      const backup = JSON.parse(localStorage.getItem('diet-offline-backup') || '{}');
      localStorage.setItem('diet-offline-backup', JSON.stringify({ ...backup, [selectedDate]: { logs: selectedLogs, updated_at: new Date().toISOString() } }));
    }
  }, [selectedDate, selectedLogs]);

  const syncOfflineBackups = useCallback(async () => {
    const backup = JSON.parse(localStorage.getItem('diet-offline-backup') || '{}');
    const entries = Object.entries(backup);
    if (!entries.length) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const remaining = {};
    let synced = 0;

    for (const [date, value] of entries) {
      const logs = value.logs || value;
      const backupUpdatedAt = value.updated_at || '1970-01-01T00:00:00.000Z';
      const people = Object.keys(logs || {});
      if (!people.length) continue;

      const { data: remoteRows } = await supabase
        .from('daily_health_logs')
        .select('person,updated_at')
        .eq('log_date', date)
        .in('person', people);

      const remoteNewer = (remoteRows || []).some((row) => row.updated_at && new Date(row.updated_at) > new Date(backupUpdatedAt));
      if (remoteNewer) {
        remaining[date] = value;
        continue;
      }

      const payload = Object.values(logs).map((log) => buildLogPayload(normalizeLog(log, log.person, date), date, user?.id || null));
      const { error } = await supabase
        .from('daily_health_logs')
        .upsert(payload, { onConflict: 'person,log_date' });

      if (error) {
        remaining[date] = value;
      } else {
        synced += 1;
      }
    }

    if (Object.keys(remaining).length) {
      localStorage.setItem('diet-offline-backup', JSON.stringify(remaining));
    } else {
      localStorage.removeItem('diet-offline-backup');
    }
    if (synced) setSyncMessage('Dados offline sincronizados.');
  }, []);

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
    const timer = window.setTimeout(syncOfflineBackups, 0);
    window.addEventListener('online', syncOfflineBackups);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('online', syncOfflineBackups);
    };
  }, [syncOfflineBackups]);

  useEffect(() => {
    let mounted = true;
    async function loadReminderSettings() {
      const { data, error } = await supabase
        .from('health_notification_settings')
        .select('*');

      if (!mounted || error || !Array.isArray(data) || !data.length) return;

      setReminderSettings((previous) => {
        const next = { ...previous };
        for (const row of data) {
          next[row.person] = {
            ...(next[row.person] || DEFAULT_REMINDER_SETTINGS[row.person]),
            ...rowToSettings(row),
            tone: next[row.person]?.tone || DEFAULT_REMINDER_SETTINGS[row.person].tone,
          };
        }
        localStorage.setItem('diet-reminder-settings', JSON.stringify(next));
        return next;
      });
      setSettingsSaveState('supabase');
    }

    loadReminderSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then(() => setServiceWorkerReady(true))
      .catch(() => setServiceWorkerReady(false));
  }, []);

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
    return text;
  }

  async function copyReport(mode) {
    const text = mode ? buildReport(selectedLogs, selectedDate, mode) : report;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    if (mode) setReport(text);
    setActionMessage('Relatorio copiado.');
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
  const activeRecommendations = getRecommendations(activeLog, activeTotals);
  const activeSettings = reminderSettings[activePerson] || DEFAULT_REMINDER_SETTINGS[activePerson];
  const activeWarnings = applyFeedbackTone(activeTotals.warnings, activeSettings.tone);
  const history = getMonthHistory(logsByDate, activePerson);
  const streak = getStreak(logsByDate);
  const dayScore = getDayScore(activeLog, activeTotals);
  const sabotageRisk = getSabotageRisk(activeLog, activeTotals);
  const closeDaySuggestions = getCloseDaySuggestions(activeLog, activeTotals);
  const weeklySummary = getWeeklySummary(logsByDate, activePerson, selectedDate);
  const notificationPermission = 'Notification' in window ? Notification.permission : 'unsupported';
  const deviceStatusText = formatEnabledPeople(deviceNotificationSettings);

  async function persistReminderSettings(nextSettings) {
    const payload = Object.entries(nextSettings).map(([person, settings]) => settingsToRow(person, settings));
    const { error } = await supabase
      .from('health_notification_settings')
      .upsert(payload, { onConflict: 'person' });
    setSettingsSaveState(error ? 'local' : 'supabase');
  }

  function updateReminderSetting(person, key, value) {
    setReminderSettings((previous) => {
      const next = {
        ...previous,
        [person]: {
          ...(previous[person] || DEFAULT_REMINDER_SETTINGS[person]),
          [key]: value,
        },
      };
      localStorage.setItem('diet-reminder-settings', JSON.stringify(next));
      persistReminderSettings(next);
      return next;
    });
  }

  function updateDeviceNotificationSetting(patch) {
    setDeviceNotificationSettings((previous) => {
      const next = saveDeviceNotificationSettings({
        ...previous,
        ...patch,
        people: {
          ...previous.people,
          ...(patch.people || {}),
        },
        quietHours: {
          ...previous.quietHours,
          ...(patch.quietHours || {}),
        },
      });
      setDeviceSetupNeeded(false);
      return next;
    });
  }

  function chooseDeviceOwner(mode) {
    const people = {
      pablo: mode === 'pablo' || mode === 'both',
      ana_clara: mode === 'ana_clara' || mode === 'both',
    };
    updateDeviceNotificationSetting({ enabled: true, people });
    setActionMessage('Preferencia deste dispositivo salva.');
  }

  function logNotificationEvent(event) {
    const entry = {
      timestamp: new Date().toISOString(),
      ...event,
    };
    const next = [entry, ...readNotificationDebugLog()].slice(0, 20);
    localStorage.setItem(NOTIFICATION_DEBUG_LOG_KEY, JSON.stringify(next));
    setNotificationDebugLog(next);
    if (entry.action === 'sent') setLastReminder({ title: entry.title, body: entry.reason, time: new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    if (entry.action === 'blocked' || entry.action === 'error') setLastBlockedNotification(entry);
    return entry;
  }

  function shouldNotify(person, type, options = {}) {
    const settings = deviceNotificationSettings;
    if (!settings.enabled) return { ok: false, reason: 'Notificacoes desativadas neste dispositivo' };
    if (!settings.people?.[person]) return { ok: false, reason: `${PEOPLE[person]?.short || person} nao esta ativado neste dispositivo` };
    if (type === 'water' && !settings.water) return { ok: false, reason: 'Tipo agua desativado' };
    if (type === 'meals' && !settings.meals) return { ok: false, reason: 'Tipo refeicoes desativado' };
    if (type === 'goals' && !settings.goals) return { ok: false, reason: 'Tipo metas desativado' };
    if (type === 'workout' && !settings.workout) return { ok: false, reason: 'Tipo treino desativado' };
    if (!options.ignoreQuietHours && isInsideQuietHours(settings.quietHours)) return { ok: false, reason: 'Horario silencioso' };
    if (!('Notification' in window)) return { ok: false, reason: 'Este navegador nao suporta notificacoes web' };
    if (Notification.permission !== 'granted') return { ok: false, reason: 'Permissao do navegador nao concedida' };

    const cooldownMinutes = options.ignoreCooldown ? 0 : NOTIFICATION_COOLDOWNS[type] ?? 60;
    const lastAt = readLastNotificationAt();
    const cooldownKey = `${person}:${type}`;
    const previous = lastAt[cooldownKey] ? new Date(lastAt[cooldownKey]).getTime() : 0;
    if (cooldownMinutes && previous && Date.now() - previous < cooldownMinutes * 60 * 1000) {
      return { ok: false, reason: `Cooldown ativo para ${type}` };
    }

    return { ok: true, reason: 'ok' };
  }

  async function activateReminders() {
    if (!('Notification' in window)) {
      setNotificationStatus('unsupported');
      return;
    }

    try {
      setNotificationStatus('requesting');
      if (OneSignal?.Notifications?.requestPermission) {
        await OneSignal.Notifications.requestPermission();
      } else {
        await Notification.requestPermission();
      }
      if (OneSignal?.User?.addTag) {
        OneSignal.User.addTag('dieta_lembretes', 'ativo');
        OneSignal.User.addTag('dieta_pessoa_ativa', activePerson);
      }
      setNotificationStatus(Notification.permission === 'granted' ? 'granted' : 'blocked');
    } catch (error) {
      console.warn('Erro ao ativar lembretes da dieta:', error);
      setNotificationStatus('error');
    }
  }

  function notifyUser(person, type, title, body, options = {}) {
    const check = shouldNotify(person, type, options);
    if (!check.ok) {
      const reason = `Bloqueada: ${check.reason}`;
      logNotificationEvent({ person, type, action: 'blocked', title, reason });
      setActionMessage(reason);
      return false;
    }

    const lastAt = readLastNotificationAt();
    lastAt[`${person}:${type}`] = new Date().toISOString();
    localStorage.setItem(LAST_NOTIFICATION_AT_KEY, JSON.stringify(lastAt));

    navigator.serviceWorker?.ready
      ?.then((registration) => registration.showNotification(title, { body, icon: '/images/icon-192.png', tag: `dieta-${person}-${type}` }))
      .catch(() => new Notification(title, { body }));
    logNotificationEvent({ person, type, action: 'sent', title, reason: body });
    setActionMessage('Notificacao enviada com sucesso.');
    return true;
  }

  function testNotification(person, type = 'test', delayMs = 0) {
    const title = person === 'pablo' ? 'Teste - Pablo' : 'Teste - Ana Clara';
    const body = person === 'pablo'
      ? 'Se voce recebeu isso, os lembretes do Pablo estao funcionando neste dispositivo.'
      : 'Se voce recebeu isso, os lembretes da Ana Clara estao funcionando neste dispositivo.';

    if (!delayMs) {
      notifyUserRef.current?.(person, type, title, body, { ignoreCooldown: true, ignoreQuietHours: true });
      return;
    }

    setActionMessage(`Teste agendado. Aguarde ${Math.round(delayMs / 1000)} segundos.`);
    let remaining = Math.round(delayMs / 1000);
    setTestCountdown(`Notificacao de teste em ${remaining}s...`);
    const countdown = window.setInterval(() => {
      remaining -= 1;
      setTestCountdown(remaining > 0 ? `Notificacao de teste em ${remaining}s...` : '');
      if (remaining <= 0) window.clearInterval(countdown);
    }, 1000);
    const timer = window.setTimeout(() => {
      notifyUserRef.current?.(person, type, 'Teste agendado da dieta', 'Se voce recebeu isso, o teste agendado funcionou neste dispositivo.', { ignoreCooldown: true, ignoreQuietHours: true });
    }, delayMs);
    testNotificationTimersRef.current.push(timer, countdown);
  }

  function addCustomItem(person, meal, custom = {}) {
    const log = selectedLogs[person];
    const meals = cloneMeals(log.meals);
    meals[meal] = [...(meals[meal] || []), createCustomMealItem(custom)];
    updateLog(person, { meals });
  }

  function updateCustomItem(person, meal, id, patch) {
    const log = selectedLogs[person];
    const meals = cloneMeals(log.meals);
    meals[meal] = (meals[meal] || []).map((item) => (item.id === id ? { ...item, ...patch } : item));
    updateLog(person, { meals });
  }

  function removeCustomItem(person, meal, id) {
    const log = selectedLogs[person];
    const meals = cloneMeals(log.meals);
    meals[meal] = (meals[meal] || []).filter((item) => item.id !== id);
    updateLog(person, { meals });
  }

  function applyQuickAction(action) {
    if (action.water) {
      updateLog(activePerson, { water_ml: (Number(activeLog.water_ml) || 0) + action.water });
      return;
    }
    if (action.custom) {
      addCustomItem(activePerson, action.meal, action.custom);
      return;
    }
    updateMealItem(activePerson, action.meal, action.food, { checked: true, amount: action.amount, unit: action.unit });
  }

  function clearSelectedDay() {
    if (!window.confirm('Limpar os registros deste dia para Pablo e Ana Clara?')) return;
    setDirtyVersion((version) => version + 1);
    setLogsByDate((previous) => ({
      ...previous,
      [selectedDate]: {
        pablo: defaultLog('pablo', selectedDate),
        ana_clara: defaultLog('ana_clara', selectedDate),
      },
    }));
    setActionMessage('Dia limpo. Salvamento automatico em instantes.');
  }

  function duplicateYesterdayMeals() {
    const yesterday = parseLocalDate(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const previousKey = dateToKey(yesterday);
    const previousLog = logsByDate[previousKey]?.[activePerson];
    if (!previousLog) {
      setActionMessage('Nao encontrei refeicoes de ontem para duplicar.');
      return;
    }
    updateLog(activePerson, { meals: cloneMeals(previousLog.meals) });
    setActionMessage('Refeicoes de ontem duplicadas para a pessoa ativa.');
  }

  function repeatPreviousLunch() {
    const previousLunch = history
      .filter((item) => item.date < selectedDate)
      .map((item) => logsByDate[item.date]?.[activePerson])
      .reverse()
      .find((log) => log?.meals?.lunch?.length);
    if (!previousLunch) {
      setActionMessage('Nao encontrei almoco anterior para repetir.');
      return;
    }
    const meals = cloneMeals(activeLog.meals);
    meals.lunch = (previousLunch.meals.lunch || []).map((item) => ({
      ...item,
      id: item.custom ? `custom-${Date.now()}-${Math.random().toString(16).slice(2)}` : item.id,
    }));
    updateLog(activePerson, { meals });
    setActionMessage('Almoco anterior repetido.');
  }

  function resetDeviceNotifications() {
    const confirmed = window.confirm('Resetar notificacoes deste dispositivo? Isso limpa preferencias locais da dieta e cancela lembretes ativos desta sessao.');
    if (!confirmed) return;

    waterReminderTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    waterReminderTimersRef.current = [];
    if (timedReminderIntervalRef.current) {
      window.clearInterval(timedReminderIntervalRef.current);
      timedReminderIntervalRef.current = null;
    }
    testNotificationTimersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    testNotificationTimersRef.current = [];
    reminderMinuteRef.current = '';

    [
      DEVICE_NOTIFICATION_STORAGE_KEY,
      NOTIFICATION_DEBUG_LOG_KEY,
      LAST_NOTIFICATION_AT_KEY,
      'diet-reminder-settings',
      'diet-notification-diagnostics',
      'diet-reminder-diagnostics',
      'diet-last-reminder',
      'diet-reminder-log',
    ].forEach((key) => localStorage.removeItem(key));

    setReminderSettings(DEFAULT_REMINDER_SETTINGS);
    setDeviceNotificationSettings(cloneDeviceNotificationSettings());
    setDeviceSetupNeeded(true);
    setNotificationDebugLog([]);
    setLastReminder(null);
    setLastBlockedNotification(null);
    setTestCountdown('');
    setNotificationStatus('idle');
    setSettingsSaveState('local');
    setActionMessage('Notificacoes deste dispositivo resetadas. Recarregue a pagina para iniciar limpo.');

    const reloadNow = window.confirm('Reset concluido. Recarregar a pagina agora?');
    if (reloadNow) window.location.reload();
  }

  async function clearAppCache() {
    const confirmed = window.confirm('Limpar cache do app e recarregar o plano do casal? Isso nao apaga registros do Supabase.');
    if (!confirmed) return;
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async (registration) => {
        await registration.update().catch(() => undefined);
      }));
    }
    window.location.href = `/dieta?fresh=${Date.now()}`;
  }

  useEffect(() => {
    notifyUserRef.current = notifyUser;
  });

  useEffect(() => {
    if (selectedDate !== todayKey) return undefined;
    waterReminderTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    waterReminderTimersRef.current = [];

    const timers = Object.entries(reminderSettings)
      .filter(([, settings]) => settings.enabled && settings.water)
      .map(([person, settings]) => {
        const log = selectedLogs[person];
        const interval = getSmartWaterInterval(log, settings);
        if (!interval) return null;
        return window.setTimeout(() => {
          notifyUserRef.current?.(person, 'water', 'Lembrete de agua', buildReminderMessage(log));
        }, interval * 60 * 1000);
      })
      .filter(Boolean);
    waterReminderTimersRef.current = timers;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      waterReminderTimersRef.current = [];
    };
  }, [selectedDate, todayKey, selectedLogs, reminderSettings]);

  useEffect(() => {
    if (selectedDate !== todayKey) return undefined;
    if (timedReminderIntervalRef.current) window.clearInterval(timedReminderIntervalRef.current);
    const interval = window.setInterval(() => {
      const now = new Date();
      const minuteKey = now.toISOString().slice(0, 16);
      if (reminderMinuteRef.current === minuteKey) return;
      reminderMinuteRef.current = minuteKey;

      Object.entries(reminderSettings).forEach(([person, settings]) => {
        if (!settings.enabled || !isInsideReminderWindow(settings, now)) return;
        const log = selectedLogs[person];
        const totals = calculateTotals(log);
        const message = getTimedReminder(log, totals, now);
        if (message && (settings.meals || settings.goals || settings.workout)) {
          const type = message.toLowerCase().includes('treino') ? 'workout' : message.toLowerCase().includes('proteina') || message.toLowerCase().includes('caloria') ? 'goals' : 'meals';
          notifyUserRef.current?.(person, type, 'Lembrete da dieta', message);
        }
      });
    }, 60 * 1000);
    timedReminderIntervalRef.current = interval;

    return () => {
      window.clearInterval(interval);
      timedReminderIntervalRef.current = null;
    };
  }, [selectedDate, todayKey, selectedLogs, reminderSettings]);

  useEffect(() => () => {
    testNotificationTimersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    testNotificationTimersRef.current = [];
  }, []);

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
            {syncMessage && (
              <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-xs font-bold text-emerald-800">
                {syncMessage}
              </p>
            )}
            <button onClick={saveDay} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg">
              <Save className="h-4 w-4" /> Salvar agora
            </button>
            <button onClick={clearAppCache} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm">
              <RotateCcw className="h-4 w-4" /> Limpar cache do app
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
            const score = getDayScore(log, totals);
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
                <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${score.tone}`}>
                  Status: {score.label}
                </div>
                <div className="space-y-3">
                  <ProgressBar label="Agua" value={log.water_ml} target={PEOPLE[person].waterTarget[0]} unit="ml" tone="blue" />
                  <ProgressBar label="Calorias" value={totals.calories} target={PEOPLE[person].calorieTarget[0]} unit="kcal" tone={person === 'pablo' ? 'green' : 'rose'} />
                  <ProgressBar label="Proteina" value={totals.protein} target={PEOPLE[person].proteinTarget[0]} unit="g" tone="green" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                  <span>Acucar: {totals.sugar}g</span>
                  <span>{person === 'pablo' ? `Caminhada: ${log.walked ? 'sim' : 'nao'}` : `Lanche: ${mealFilled(log, 'snack') ? 'sim' : 'nao'}`}</span>
                  <span className="col-span-2">Treino: {(log.workout || 'descanso').replaceAll('_', ' ')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-xl backdrop-blur-xl">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold text-slate-900">Configuracoes de lembretes</h2>
              <p className="text-sm text-slate-500">Usa o OneSignal ja configurado no site e lembretes locais enquanto esta pagina/PWA estiver aberta.</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <button onClick={activateReminders} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-lg">
                <Bell className="h-4 w-4" /> Ativar lembretes
              </button>
              <button onClick={resetDeviceNotifications} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
                <RotateCcw className="h-4 w-4" /> Resetar notificacoes deste dispositivo
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-2xl bg-white/75 p-4 text-xs font-bold leading-5 text-slate-600">
            {notificationStatus === 'granted' && 'Permissao ativa. Tags da dieta vinculadas no OneSignal.'}
            {notificationStatus === 'blocked' && 'Permissao negada no navegador. Ative nas configuracoes do site para receber notificacoes.'}
            {notificationStatus === 'unsupported' && 'Este navegador nao suporta notificacoes.'}
            {notificationStatus === 'error' && 'Nao consegui pedir permissao agora. Tente de novo pelo navegador.'}
            {notificationStatus === 'requesting' && 'Pedindo permissao...'}
            {notificationStatus === 'idle' && 'No iPhone, adicione este site a Tela de Inicio e permita notificacoes para melhor compatibilidade.'}
            <span className="mt-1 block text-slate-400">
              Preferencias: {settingsSaveState === 'supabase' ? 'salvas no Supabase' : 'salvas localmente; rode a migration para sincronizar no Supabase'}.
            </span>
          </div>

          <div className="mb-4 rounded-3xl border border-cyan-100 bg-cyan-50/70 p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold text-slate-900">Notificacoes deste dispositivo</h3>
                <p className="text-xs font-bold text-cyan-900">{deviceStatusText}</p>
              </div>
              <button
                onClick={() => updateDeviceNotificationSetting({ enabled: !deviceNotificationSettings.enabled })}
                className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-sm ${deviceNotificationSettings.enabled ? 'bg-red-50 text-red-700' : 'bg-slate-900 text-white'}`}
              >
                {deviceNotificationSettings.enabled ? 'Desativar notificacoes neste dispositivo' : 'Ativar notificacoes neste dispositivo'}
              </button>
            </div>

            {deviceSetupNeeded && (
              <div className="mb-4 rounded-2xl bg-white/85 p-3">
                <p className="mb-2 text-sm font-bold text-slate-800">Quem usa este dispositivo?</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => chooseDeviceOwner('pablo')} className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Sou Pablo</button>
                  <button onClick={() => chooseDeviceOwner('ana_clara')} className="rounded-2xl bg-pink-600 px-4 py-2 text-sm font-bold text-white">Sou Ana Clara</button>
                  <button onClick={() => chooseDeviceOwner('both')} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Nos dois</button>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/80 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Pessoas</p>
                {Object.keys(PEOPLE).map((person) => (
                  <label key={person} className="flex items-center justify-between gap-3 py-2 text-sm font-bold text-slate-700">
                    {PEOPLE[person].label}
                    <input
                      type="checkbox"
                      checked={Boolean(deviceNotificationSettings.people?.[person])}
                      onChange={(event) => updateDeviceNotificationSetting({ people: { [person]: event.target.checked } })}
                      className="h-5 w-5 accent-cyan-600"
                    />
                  </label>
                ))}
              </div>

              <div className="rounded-2xl bg-white/80 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Tipos</p>
                {[
                  ['water', 'Agua'],
                  ['meals', 'Refeicoes'],
                  ['goals', 'Metas de proteina/caloria'],
                  ['workout', 'Treino'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between gap-3 py-2 text-sm font-bold text-slate-700">
                    {label}
                    <input
                      type="checkbox"
                      checked={Boolean(deviceNotificationSettings[key])}
                      onChange={(event) => updateDeviceNotificationSetting({ [key]: event.target.checked })}
                      className="h-5 w-5 accent-emerald-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/80 p-3">
              <label className="mb-3 flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                Horario silencioso
                <input
                  type="checkbox"
                  checked={Boolean(deviceNotificationSettings.quietHours?.enabled)}
                  onChange={(event) => updateDeviceNotificationSetting({ quietHours: { enabled: event.target.checked } })}
                  className="h-5 w-5 accent-violet-600"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Inicio"><TextInput type="time" value={deviceNotificationSettings.quietHours?.start || '23:30'} onChange={(event) => updateDeviceNotificationSetting({ quietHours: { start: event.target.value } })} /></Field>
                <Field label="Fim"><TextInput type="time" value={deviceNotificationSettings.quietHours?.end || '07:00'} onChange={(event) => updateDeviceNotificationSetting({ quietHours: { end: event.target.value } })} /></Field>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white/80 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Testar notificacoes</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => testNotification('pablo')} className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white">Testar Pablo</button>
                <button onClick={() => testNotification('ana_clara')} className="rounded-2xl bg-pink-600 px-4 py-2 text-sm font-bold text-white">Testar Ana Clara</button>
                <button onClick={() => testNotification(activePerson, 'water')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Testar agua</button>
                <button onClick={() => testNotification(activePerson, 'goals')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Testar meta</button>
                <button onClick={() => testNotification(activePerson, 'meals')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Testar refeicao</button>
                <button onClick={() => testNotification(activePerson, 'test', 10000)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Testar em 10s</button>
                <button onClick={() => testNotification(activePerson, 'test', 60000)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Testar em 1 min</button>
              </div>
              {testCountdown && <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{testCountdown}</p>}
            </div>

            <div className="mt-4 rounded-2xl bg-white/80 p-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Diagnostico de notificacoes</p>
              <div className="grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                <span>Permissao do navegador: {notificationPermission}</span>
                <span>Service Worker registrado: {serviceWorkerReady ? 'sim' : 'nao'}</span>
                <span>PWA instalada: {isStandalonePwa ? 'sim' : 'nao'}</span>
                <span>Ativadas neste dispositivo: {deviceNotificationSettings.enabled ? 'sim' : 'nao'}</span>
                <span>Pessoas ativadas: {Object.keys(PEOPLE).filter((person) => deviceNotificationSettings.people?.[person]).map((person) => PEOPLE[person].short).join(' / ') || '-'}</span>
                <span>Ultima enviada: {lastReminder ? `${lastReminder.title} (${lastReminder.time})` : '-'}</span>
                <span className="sm:col-span-2">Ultima bloqueada: {lastBlockedNotification ? lastBlockedNotification.reason : '-'}</span>
              </div>
              <div className="mt-3 max-h-40 overflow-auto rounded-2xl bg-slate-50 p-3 text-[11px] font-bold leading-5 text-slate-500">
                {notificationDebugLog.length ? notificationDebugLog.map((entry) => (
                  <div key={`${entry.timestamp}-${entry.person}-${entry.type}-${entry.action}`}>
                    {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {entry.person || '-'} / {entry.type || '-'} / {entry.action}: {entry.reason}
                  </div>
                )) : 'Nenhum evento registrado ainda.'}
              </div>
            </div>

            <p className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-cyan-900">
              No celular, as notificacoes funcionam melhor com o site instalado como aplicativo/PWA. No iPhone, abra no Safari, toque em Compartilhar e depois em Adicionar a Tela de Inicio. Depois abra pelo icone criado e permita notificacoes.
            </p>
            {!('Notification' in window) && (
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800">
                Este navegador nao permite notificacoes web. Os lembretes aparecerao apenas dentro da pagina enquanto ela estiver aberta.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.keys(PEOPLE).map((person) => {
              const settings = reminderSettings[person] || DEFAULT_REMINDER_SETTINGS[person];
              const interval = getSmartWaterInterval(selectedLogs[person], settings);
              return (
                <div key={person} className="rounded-3xl bg-white/75 p-4">
                  <h3 className="mb-3 font-serif text-xl font-bold text-slate-900">{PEOPLE[person].short}</h3>
                  <div className="grid gap-3">
                    <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                      Lembretes ativos
                      <input type="checkbox" checked={settings.enabled} onChange={(event) => updateReminderSetting(person, 'enabled', event.target.checked)} className="h-5 w-5 accent-rose-500" />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                      Agua
                      <input type="checkbox" checked={settings.water} onChange={(event) => updateReminderSetting(person, 'water', event.target.checked)} className="h-5 w-5 accent-cyan-500" />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                      Metas/refeicoes
                      <input type="checkbox" checked={settings.meals && settings.goals} onChange={(event) => {
                        updateReminderSetting(person, 'meals', event.target.checked);
                        updateReminderSetting(person, 'goals', event.target.checked);
                      }} className="h-5 w-5 accent-emerald-500" />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                      Frequencia inteligente
                      <input type="checkbox" checked={settings.smartFrequency} onChange={(event) => updateReminderSetting(person, 'smartFrequency', event.target.checked)} className="h-5 w-5 accent-violet-500" />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
                      Treino
                      <input type="checkbox" checked={settings.workout} onChange={(event) => updateReminderSetting(person, 'workout', event.target.checked)} className="h-5 w-5 accent-emerald-500" />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Inicio"><TextInput type="time" value={settings.startTime} onChange={(event) => updateReminderSetting(person, 'startTime', event.target.value)} /></Field>
                      <Field label="Fim"><TextInput type="time" value={settings.endTime} onChange={(event) => updateReminderSetting(person, 'endTime', event.target.value)} /></Field>
                    </div>
                    <Field label="Intervalo agua">
                      <SelectInput value={settings.smartFrequency ? 'smart' : settings.waterInterval} onChange={(event) => {
                        if (event.target.value === 'smart') {
                          updateReminderSetting(person, 'smartFrequency', true);
                          return;
                        }
                        updateReminderSetting(person, 'smartFrequency', false);
                        updateReminderSetting(person, 'waterInterval', Number(event.target.value));
                      }}>
                        <option value="smart">automatico/inteligente</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                        <option value={90}>90 min</option>
                      </SelectInput>
                    </Field>
                    <Field label="Tom do feedback">
                      <SelectInput value={settings.tone || DEFAULT_REMINDER_SETTINGS[person].tone} onChange={(event) => updateReminderSetting(person, 'tone', event.target.value)}>
                        <option value="leve">leve</option>
                        <option value="normal">normal</option>
                        <option value="firme">firme</option>
                      </SelectInput>
                    </Field>
                    <p className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500">
                      Proximo lembrete de agua em: {interval ? `${interval} min` : 'meta de agua batida'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {lastReminder && (
            <div className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-bold text-cyan-900">
              Ultimo lembrete visual ({lastReminder.time}): {lastReminder.body}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-xl backdrop-blur-xl">
          <h2 className="mb-4 font-serif text-3xl font-bold text-slate-900">Acoes rapidas</h2>
          <div className="mb-5 flex flex-wrap gap-2">
            {[200, 250, 300, 500].map((ml) => (
              <button key={ml} onClick={() => updateLog(activePerson, { water_ml: (Number(activeLog.water_ml) || 0) + ml })} className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white">
                +{ml} ml
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_ACTIONS[activePerson].map((action) => (
              <button key={action.label} onClick={() => applyQuickAction(action)} className="rounded-2xl bg-white/85 px-4 py-3 text-left text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white">
                {action.label}
              </button>
            ))}
          </div>
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

        <div className="mb-5 flex flex-wrap gap-2">
          <button onClick={duplicateYesterdayMeals} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
            <RotateCcw className="h-4 w-4" /> Duplicar refeicoes de ontem
          </button>
          <button onClick={repeatPreviousLunch} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
            <Utensils className="h-4 w-4" /> Repetir almoco anterior
          </button>
          <button onClick={clearSelectedDay} className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-sm">
            <Trash2 className="h-4 w-4" /> Limpar dia
          </button>
          {actionMessage && <span className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{actionMessage}</span>}
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
              <Field label="Modo faculdade">
                <SelectInput value={activeLog.class_today ? 'sim' : 'nao'} onChange={(event) => updateLog(activePerson, { class_today: event.target.value === 'sim' })}>
                  <option value="nao">Hoje nao tenho aula</option>
                  <option value="sim">Hoje tenho aula</option>
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
          <Field label="Fome agora">
            <SelectInput value={activeLog.appetite || 'sem_fome'} onChange={(event) => updateLog(activePerson, { appetite: event.target.value })}>
              <option value="sem_fome">Sem fome</option>
              <option value="fome_leve">Fome leve</option>
              <option value="fome_normal">Fome normal</option>
              <option value="muita_fome">Muita fome</option>
              <option value="vontade_doce">Vontade de doce</option>
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
                {(activeLog.meals[meal] || []).filter((item) => item.custom).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800">Outro item</p>
                      <button onClick={() => removeCustomItem(activePerson, meal, item.id)} className="rounded-full bg-white p-2 text-red-500 shadow-sm" aria-label="Remover item personalizado">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="Alimento"><TextInput value={item.label || ''} placeholder="Ex.: Nugget, pizza, requeijao" onChange={(event) => updateCustomItem(activePerson, meal, item.id, { label: event.target.value })} /></Field>
                      <Field label="Categoria">
                        <SelectInput value={item.category || 'outro'} onChange={(event) => updateCustomItem(activePerson, meal, item.id, { category: event.target.value })}>
                          {FOOD_CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </SelectInput>
                      </Field>
                      <Field label="Quantidade"><TextInput type="number" min="0" value={item.amount || ''} onChange={(event) => updateCustomItem(activePerson, meal, item.id, { amount: event.target.value })} /></Field>
                      <Field label="Unidade">
                        <SelectInput value={item.unit || 'g'} onChange={(event) => updateCustomItem(activePerson, meal, item.id, { unit: event.target.value })}>
                          {UNIT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </SelectInput>
                      </Field>
                      <Field label="g/ml calculado"><TextInput type="number" min="0" value={item.grams_or_ml || ''} placeholder="Opcional" onChange={(event) => updateCustomItem(activePerson, meal, item.id, { grams_or_ml: event.target.value })} /></Field>
                      <Field label="Calorias"><TextInput type="number" min="0" value={item.calories || ''} placeholder="Se souber" onChange={(event) => updateCustomItem(activePerson, meal, item.id, { calories: event.target.value })} /></Field>
                      <Field label="Proteina g"><TextInput type="number" min="0" value={item.protein || ''} placeholder="Se souber" onChange={(event) => updateCustomItem(activePerson, meal, item.id, { protein: event.target.value })} /></Field>
                      <Field label="Acucar g"><TextInput type="number" min="0" value={item.sugar || ''} placeholder="Se souber" onChange={(event) => updateCustomItem(activePerson, meal, item.id, { sugar: event.target.value })} /></Field>
                      <div className="sm:col-span-2">
                        <Field label="Observacao"><TextInput value={item.notes || ''} placeholder="Ex.: sem acucar, pouco oleo, porcao pequena" onChange={(event) => updateCustomItem(activePerson, meal, item.id, { notes: event.target.value })} /></Field>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => addCustomItem(activePerson, meal)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-rose-200 bg-white/70 px-4 py-3 text-sm font-bold text-rose-700">
                  <Plus className="h-4 w-4" /> Adicionar outro alimento
                </button>
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
            <h3 className="mb-4 font-serif text-2xl font-bold text-slate-900">O que posso comer agora?</h3>
            <button
              onClick={() => setEatNowSuggestion(getEatNowSuggestion(activeLog, activeTotals))}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm"
            >
              Gerar sugestao
            </button>
            {eatNowSuggestion && (
              <p className="mt-3 rounded-2xl bg-white/80 p-4 text-sm font-bold leading-5 text-slate-700">{eatNowSuggestion}</p>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-3 font-serif text-2xl font-bold text-slate-900">Risco de sabotagem</h3>
            <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${sabotageRisk.tone}`}>
              {sabotageRisk.label}
            </div>
            <div className="space-y-2">
              {sabotageRisk.reasons.map((reason) => (
                <p key={reason} className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-bold text-slate-600">{reason}</p>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-4 font-serif text-2xl font-bold text-slate-900">Para salvar/fechar o dia</h3>
            <div className="space-y-2">
              {closeDaySuggestions.map((suggestion) => (
                <p key={suggestion} className="rounded-2xl bg-cyan-50 px-4 py-3 text-sm font-bold leading-5 text-cyan-900">{suggestion}</p>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Para bater sua meta hoje</h3>
            <div className="space-y-3">
              {activeRecommendations.map((recommendation) => (
                <div key={recommendation} className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-5 text-emerald-900">
                  {recommendation}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-slate-900"><AlertTriangle className="h-5 w-5 text-amber-500" /> Feedback</h3>
            <div className="space-y-3">
              {activeWarnings.map((warning, index) => (
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-slate-900">
              <BarChart3 className="h-6 w-6 text-cyan-600" /> Historico do mes
            </h2>
            <p className="text-sm text-slate-500">Peso, agua e proteina de {PEOPLE[activePerson].short}. Sequencia atual: {streak} dia(s) registrados.</p>
          </div>
          <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${dayScore.tone}`}>
            Hoje: {dayScore.label}
          </div>
        </div>
        {history.length ? (
          <div className="grid gap-3">
            {history.slice(-10).map((item) => {
              const waterPercent = progressValue(item.water, PEOPLE[activePerson].waterTarget[0]);
              const proteinPercent = progressValue(item.protein, PEOPLE[activePerson].proteinTarget[0]);
              return (
                <div key={item.date} className="rounded-2xl bg-white/80 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                    <span>{formatDateBr(item.date)}</span>
                    <span>{item.weight ? `${item.weight} kg` : 'peso -'} | {item.water} ml | {item.protein}g prot.</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="h-2 overflow-hidden rounded-full bg-cyan-50">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${waterPercent}%` }} />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-emerald-50">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${proteinPercent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-500">Ainda nao ha historico carregado para esta pessoa neste mes.</p>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-xl backdrop-blur-xl">
        <h2 className="mb-4 font-serif text-3xl font-bold text-slate-900">Resumo semanal</h2>
        {weeklySummary ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-700">Peso: {weeklySummary.startWeight || '-'} kg para {weeklySummary.endWeight || '-'} kg</div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-700">Media agua: {weeklySummary.averageWater} ml</div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-700">Media proteina: {weeklySummary.averageProtein} g</div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-700">Media calorias: {weeklySummary.averageCalories} kcal</div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Dias bons: {weeklySummary.goodDays}</div>
            <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">Dias de atencao: {weeklySummary.attentionDays}</div>
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-800">Principal erro: {weeklySummary.mainIssue}</div>
            <div className="rounded-2xl bg-cyan-50 p-4 text-sm font-bold text-cyan-900">Principal acerto: {weeklySummary.mainWin}</div>
          </div>
        ) : (
          <p className="rounded-2xl bg-white/80 p-4 text-sm font-bold text-slate-500">Ainda nao ha dados suficientes para montar a semana.</p>
        )}
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
          <button onClick={() => copyReport('pablo')} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><Clipboard className="h-4 w-4" /> Copiar Pablo</button>
          <button onClick={() => copyReport('ana_clara')} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><Clipboard className="h-4 w-4" /> Copiar Ana Clara</button>
          <button onClick={() => copyReport('couple')} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><Clipboard className="h-4 w-4" /> Copiar casal</button>
          <button onClick={() => copyReport()} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><Clipboard className="h-4 w-4" /> Copiar texto acima</button>
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
