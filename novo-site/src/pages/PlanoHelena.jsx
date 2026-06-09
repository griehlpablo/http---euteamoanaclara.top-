import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, Lock, RotateCcw, Save, Smartphone } from 'lucide-react';
import supabase from '../supabase';
import HelenaDashboard from '../components/helena/HelenaDashboard';
import HelenaExportReport from '../components/helena/HelenaExportReport';
import HelenaMealLogger from '../components/helena/HelenaMealLogger';
import HelenaNotificationSettings from '../components/helena/HelenaNotificationSettings';
import HelenaWaterTracker from '../components/helena/HelenaWaterTracker';
import { HELENA_FOODS, HELENA_MEALS, HELENA_PERSON, HELENA_PROFILE, HELENA_STORAGE } from '../components/helena/helenaData';
import BrasiliaClock from '../components/BrasiliaClock';
import CollapsibleSection from '../components/CollapsibleSection';
import FoodSearchCalculator from '../components/FoodSearchCalculator';
import NotificationDiagnostics from '../components/NotificationDiagnostics';
import QuickNav from '../components/QuickNav';
import { findFood } from '../lib/foodDatabase';
import { buildNotificationDiagnostic, buildWaterMessage, planWaterReminder } from '../lib/notificationPlanner';
import { calculateFoodNutrition, nutritionForManualItem } from '../lib/nutrition';
import { reportTimestampLines } from '../lib/reportTimestamp';
import {
  APP_CACHE_VERSION,
  assertSerializable,
  buildDiagnosticText,
  clearAppCachesAndReload,
  getMonthDateRange as getSafeMonthDateRange,
  safeParseLocalStorage,
  sanitizeLogForSave,
  supabaseErrorDetails,
} from '../lib/healthPlanDiagnostics';

const HELENA_ACCESS_CODE = 'helena2026';

const emptyMeals = {
  breakfast: { items: [], totals: {} },
  lunch: { items: [], totals: {} },
  snack: { items: [], totals: {} },
  dinner: { items: [], totals: {} },
  supper: { items: [], totals: {} },
  extras: { items: [], totals: {} },
};

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthDateRange(date) {
  const d = new Date(`${date}T00:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  return {
    startDate: formatLocalDate(new Date(year, month, 1)),
    endDate: formatLocalDate(new Date(year, month + 1, 0)),
  };
}

function formatDateBr(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function defaultLog(selectedDate = dateKey()) {
  return {
    person: HELENA_PERSON,
    logDate: selectedDate,
    weightKg: '63',
    wakeTime: '07:40',
    sleepTime: '01:40',
    waterMl: 0,
    workout: 'musculacao',
    appetite: 'medio',
    hungerNow: '',
    notes: '',
    wheyStatus: 'pretendo_usar',
    preWorkoutMeal: false,
    postWorkoutMeal: false,
    proteinDone: false,
    waterDone: false,
    measures: { waist: '', hip: '', abdomen: '', thigh: '', arm: '' },
    meals: cloneMeals(emptyMeals),
  };
}

function cloneMeals(meals = emptyMeals) {
  return Object.fromEntries(Object.keys(emptyMeals).map((key) => {
    const value = meals?.[key];
    const items = Array.isArray(value) ? value : Array.isArray(value?.items) ? value.items : [];
    return [key, { items: items.map((item) => normalizeMealItem(item, key)), totals: value?.totals || {} }];
  }));
}

function mealItems(meals, meal) {
  const value = meals?.[meal];
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.items) ? value.items : [];
}

function allMealItems(meals) {
  return Object.keys(emptyMeals).flatMap((meal) => mealItems(meals, meal));
}

function normalizeMealItem(item = {}, meal = 'extras') {
  const food = item.food ? HELENA_FOODS[item.food] : null;
  const label = item.label || food?.label || item.name || 'Alimento';
  const amount = item.amount ?? item.quantity ?? item.grams_or_ml ?? item.grams ?? '';
  const gramsOrMl = item.grams_or_ml ?? item.grams ?? amount ?? '';
  return {
    id: item.id || `helena-${meal}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    food_key: item.food_key || item.food || item.foodSlug || item.databaseSlug || '',
    label,
    brand_name: item.brand_name || '',
    barcode: item.barcode || '',
    category: item.category || food?.category || 'outro',
    meal,
    quantity: item.quantity ?? amount,
    portion_label: item.portion_label || `${amount || '-'} ${item.unit || food?.unit || 'g'}`,
    unit: item.unit || food?.unit || 'g',
    grams_or_ml: gramsOrMl,
    calories: item.calories ?? '',
    protein: item.protein ?? '',
    carbs: item.carbs ?? '',
    fat: item.fat ?? '',
    sugar: item.sugar ?? '',
    fiber: item.fiber ?? '',
    sodium: item.sodium ?? '',
    hydration_ml: item.hydration_ml ?? '',
    pure_water_ml: item.pure_water_ml ?? '',
    hydration_factor: item.hydration_factor ?? '',
    source: item.source || '',
    source_id: item.source_id || '',
    source_url: item.source_url || '',
    image_url: item.image_url || '',
    notes: item.notes || item.note || '',
    ...item,
    meal,
    label,
  };
}

function safeJson(key, fallback) {
  return safeParseLocalStorage(key, fallback);
}

function isDomOrReactEvent(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.nodeType) return true;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  if (typeof Event !== 'undefined' && value instanceof Event) return true;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
  if (typeof File !== 'undefined' && value instanceof File) return true;
  if ('target' in value && 'currentTarget' in value && 'preventDefault' in value) return true;
  return Object.keys(value).some((key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key === '_reactInternals');
}

export function sanitizeHelenaLogForSave(value, seen = new WeakSet()) {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (isDomOrReactEvent(value)) return undefined;
  if (seen.has(value)) return undefined;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeHelenaLogForSave(item, seen)).filter((item) => item !== undefined);
  const output = {};
  Object.entries(value).forEach(([key, item]) => {
    if (key === 'target' || key === 'currentTarget' || key === 'nativeEvent' || key === 'view' || key === 'ownerDocument' || key.startsWith('__react')) return;
    const clean = sanitizeHelenaLogForSave(item, seen);
    if (clean !== undefined) output[key] = clean;
  });
  return output;
}

function safeStringify(value) {
  const clean = sanitizeHelenaLogForSave(value);
  try {
    return { ok: true, clean, text: JSON.stringify(clean), error: null };
  } catch (error) {
    console.error('Erro ao serializar dados da Helena:', error);
    return { ok: false, clean: null, text: '', error };
  }
}

function gramsMultiplier(item, food) {
  const amount = Number(item.amount) || 0;
  if (item.unit === food.unit || ['g', 'ml', 'unidade', 'scoop'].includes(item.unit)) return amount / food.basis;
  if (item.unit === 'colher de arroz') return (amount * 60) / food.basis;
  if (item.unit === 'concha') return (amount * 100) / food.basis;
  if (item.unit === 'copo 180 ml') return (amount * 180) / food.basis;
  if (item.unit === 'copo 250 ml') return (amount * 250) / food.basis;
  if (item.unit === 'colher de sopa') return (amount * 20) / food.basis;
  return amount / food.basis;
}

function calculateTotals(log) {
  return allMealItems(log.meals).reduce(
    (acc, item) => {
      if (item.custom) {
        const manual = nutritionForManualItem(item);
        acc.calories += manual.calories;
        acc.protein += manual.protein;
        acc.carbs += manual.carbs;
        acc.fat += manual.fat;
        acc.sugar += manual.sugar;
        acc.fiber += manual.fiber;
        acc.sodium += manual.sodium;
        const hydration = estimateHydration(item, null);
        acc.pureWaterMl += hydration.pure_water_ml;
        acc.totalHydrationMl += hydration.hydration_ml;
        if (String(item.category || '').includes('bebida') && String(item.category || '').includes('acucar')) acc.liquidSugar += manual.sugar;
        return acc;
      }
      const food = HELENA_FOODS[item.food];
      if (!food) return acc;
      const multiplier = gramsMultiplier(item, food);
      const hydration = estimateHydration(item, food);
      acc.pureWaterMl += hydration.pure_water_ml;
      acc.totalHydrationMl += hydration.hydration_ml;
      acc.calories += food.kcal * multiplier;
      acc.protein += food.protein * multiplier;
      acc.carbs += (food.carbs || 0) * multiplier;
      acc.fat += (food.fat || 0) * multiplier;
      acc.sugar += food.sugar * multiplier;
      acc.fiber += (food.fiber || 0) * multiplier;
      acc.sodium += (food.sodium || 0) * multiplier;
      if (food.liquidSugar) acc.liquidSugar += food.sugar * multiplier;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, liquidSugar: 0, pureWaterMl: 0, totalHydrationMl: 0 },
  );
}

function estimateHydration(item, food) {
  const amount = Number(item.amount) || 0;
  const unit = item.unit || food?.unit || '';
  const normalizedCategory = String(item.category || food?.category || '').toLowerCase();
  if (item.is_water) return { pure_water_ml: amount, hydration_ml: amount };
  if (item.hydration_factor) return { pure_water_ml: 0, hydration_ml: amount * Number(item.hydration_factor) };
  const isWater = item.food === 'agua' || normalizedCategory.includes('agua');
  const isBeverage = normalizedCategory.includes('bebida') || normalizedCategory.includes('suco') || normalizedCategory.includes('energetico') || normalizedCategory.includes('cafe');
  const isLiquid = unit === 'ml' || unit.includes('copo') || unit === 'litro';
  if (isWater) return { pure_water_ml: amount, hydration_ml: amount };
  if (unit === 'ml') return { pure_water_ml: 0, hydration_ml: amount * 0.9 };
  if (isLiquid) return { pure_water_ml: 0, hydration_ml: amount * 0.8 };
  if (isBeverage) return { pure_water_ml: 0, hydration_ml: amount * 0.75 };
  return { pure_water_ml: 0, hydration_ml: 0 };
}

function normalizeLog(row, selectedDate) {
  if (!row) return defaultLog(selectedDate);
  const meta = row.meals?._meta || {};
  return {
    ...defaultLog(selectedDate),
    weightKg: row.weight_kg ?? row.weightKg ?? '63',
    wakeTime: row.wake_time || row.wakeTime || '07:40',
    sleepTime: row.sleep_time || row.sleepTime || '01:40',
    waterMl: row.water_ml ?? row.waterMl ?? 0,
    workout: row.workout || 'musculacao',
    appetite: row.appetite || 'medio',
    hungerNow: row.hungerNow || row.hunger_now || '',
    notes: row.notes || '',
    wheyStatus: meta.wheyStatus || row.wheyStatus || 'pretendo_usar',
    preWorkoutMeal: Boolean(meta.preWorkoutMeal ?? row.preWorkoutMeal),
    postWorkoutMeal: Boolean(meta.postWorkoutMeal ?? row.postWorkoutMeal),
    proteinDone: Boolean(meta.proteinDone ?? row.proteinDone),
    waterDone: Boolean(meta.waterDone ?? row.waterDone),
    measures: { ...defaultLog(selectedDate).measures, ...(meta.measures || row.measures || {}) },
    meals: cloneMeals(row.meals),
  };
}

function buildWarnings(log, totals) {
  const warnings = [];
  const trained = log.workout === 'musculacao';
  const allItems = allMealItems(log.meals);
  const hasPaoDeQueijo = allItems.some((item) => item.food === 'pao_queijo' || item.foodSlug === 'pao_de_queijo' || item.databaseSlug === 'pao_de_queijo' || String(item.label || '').toLowerCase().includes('pao de queijo'));
  const hasMaca = allItems.some((item) => item.food === 'maca' || item.foodSlug === 'maca' || item.databaseSlug === 'maca' || String(item.label || '').toLowerCase().includes('maca'));
  allItems.filter((item) => item.custom).forEach((item) => {
    if (item.warning_sugar && Number(item.sugar) > 0) warnings.push(item.warning_sugar);
    else if (item.warning_zero && Number(item.sugar) === 0) warnings.push(item.warning_zero);
    else if (String(item.category || '').includes('energetico')) warnings.push(`${item.brand_name || item.label || 'Energetico'} nao substitui agua. Use como excecao, nao como hidratacao principal.`);
  });
  if (totals.protein < 75) warnings.push('Helena, se quer ganhar massa e emagrecer, proteina nao pode ficar baixa. Coloque ovo, frango, carne, leite, iogurte ou whey.');
  if (trained && hasPaoDeQueijo) warnings.push('Pao de queijo e ok, mas tem pouca proteina. Para recomposicao, complementa com ovo, leite, iogurte, frango ou whey.');
  if (hasMaca) warnings.push('Maca ajuda na fibra e saciedade, mas quase nao tem proteina.');
  if (trained && totals.calories > 0 && totals.calories < 1200) warnings.push('Treinou musculacao e comeu pouco. Isso atrapalha ganho de massa e recuperacao.');
  if (totals.calories > 0 && totals.calories < 1100) warnings.push('Comer pouco demais pode ate baixar peso rapido, mas piora treino, fome e massa muscular.');
  if (totals.calories > HELENA_PROFILE.calories[1] + 250) warnings.push('Hoje passou do ponto. Amanha volta ao basico: proteina, agua e comida de verdade.');
  if (totals.liquidSugar > 18) warnings.push('Caloria liquida atrapalha facil. Se quer recomposicao, refrigerante normal/suco adocado precisa ser excecao.');
  if (!mealItems(log.meals, 'dinner').length && new Date().getHours() >= 18) warnings.push('Nao vai para faculdade zerada de comida. Depois a chance de atacar qualquer coisa aumenta.');
  if (!warnings.length) warnings.push('Boa, Helena. Sem terrorismo alimentar: mantenha proteina, agua e treino.');
  return warnings;
}

function buildRecommendations(log, totals) {
  const recs = [];
  if (totals.protein < HELENA_PROFILE.protein[0]) recs.push('Prioridade: bater proteina com ovo, frango, carne, leite, iogurte ou whey se estiver usando.');
  if (log.workout === 'musculacao' && !mealItems(log.meals, 'lunch').length) recs.push('Depois do treino das 12h15/12h30, faca almoco com proteina.');
  if (totals.liquidSugar > 12) recs.push('Controle refrigerante normal/suco adocado. Pequeno doce isolado nao e desastre; repetir todo dia atrapalha.');
  if (!recs.length) recs.push('Dia encaminhado: comida de verdade, proteina e agua.');
  return recs;
}

function buildEatNow(log, totals) {
  const hour = new Date().getHours();
  if (totals.protein < HELENA_PROFILE.protein[0]) return 'Melhor agora: ovo, frango, carne, iogurte, leite ou whey.';
  if (log.workout === 'musculacao' && totals.calories < HELENA_PROFILE.calories[0]) return 'Voce treinou e ainda comeu pouco. Uma refeicao com arroz + proteina ou iogurte com fruta ajuda.';
  if (hour >= 17 && hour <= 20) return 'Antes da faculdade, melhor algo que sustente: pao com ovo, iogurte com fruta ou arroz/carne em porcao pequena.';
  if (totals.calories > HELENA_PROFILE.calories[1]) return 'Hoje fecha mais leve: agua, proteina magra ou nada se nao estiver com fome.';
  return 'Mantem simples: proteina primeiro, agua e carboidrato suficiente para o treino.';
}

function buildRecommendationOptions(log, totals) {
  const trained = log.workout === 'musculacao';
  const proteinGap = Math.max(0, HELENA_PROFILE.protein[0] - (Number(totals.protein) || 0));
  const caloriesGap = Math.max(0, HELENA_PROFILE.calories[0] - (Number(totals.calories) || 0));
  const baseReason = trained ? 'Treino pede carboidrato suficiente e proteina para recuperar.' : 'Mantem saciedade sem exagerar no fim do dia.';
  return [
    {
      id: 'leve',
      title: 'Opcao leve',
      meal: 'snack',
      foods: 'iogurte natural + banana pequena',
      calories: 220,
      protein: 10,
      reason: proteinGap > 20 ? 'Leve, mas ja coloca um pouco de proteina sem pesar.' : 'Boa para fome pequena e para nao chegar vazia na faculdade.',
      items: [
        recommendationItem('Iogurte natural', 'laticinio', 170, 'g', 110, 7, 14, 4),
        recommendationItem('Banana', 'fruta', 1, 'unidade', 90, 1, 23, 0),
      ],
    },
    {
      id: 'equilibrada',
      title: 'Opcao equilibrada',
      meal: trained || caloriesGap > 400 ? 'lunch' : 'dinner',
      foods: 'arroz + frango + legumes',
      calories: 480,
      protein: 35,
      reason: baseReason,
      items: [
        recommendationItem('Arroz cozido', 'carboidrato', 120, 'g', 156, 3, 34, 0),
        recommendationItem('Frango', 'proteina', 120, 'g', 198, 37, 0, 4),
        recommendationItem('Legumes/salada', 'legume/verdura', 120, 'g', 42, 3, 8, 0),
      ],
    },
    {
      id: 'reforcada',
      title: 'Opcao reforcada',
      meal: trained ? 'lunch' : 'dinner',
      foods: 'macarrao ou arroz + carne/frango + ovo',
      calories: 650,
      protein: 48,
      reason: trained ? 'Boa se treinou 12h15/12h30 e ainda esta longe da meta.' : 'Use se a fome estiver alta e o dia ainda couber nas metas.',
      items: [
        recommendationItem('Macarrao cozido', 'carboidrato', 150, 'g', 236, 9, 46, 2),
        recommendationItem('Carne ou frango', 'proteina', 140, 'g', 260, 38, 0, 10),
        recommendationItem('Ovo', 'proteina', 1, 'unidade', 70, 6, 0, 5),
      ],
    },
  ];
}

function recommendationItem(label, category, amount, unit, calories, protein, carbs, fat) {
  return normalizeMealItem({
    custom: true,
    label,
    category,
    amount,
    quantity: amount,
    unit,
    grams_or_ml: unit === 'unidade' ? amount : amount,
    calories,
    protein,
    carbs,
    fat,
    sugar: 0,
    fiber: category === 'legume/verdura' || category === 'fruta' ? 3 : 0,
    sodium: 0,
    source: 'recomendacao_helena',
    notes: 'Adicionado por recomendacao automatica da Helena.',
  });
}

function rowPayload(log, selectedDate) {
  const rawTotals = calculateTotals(log);
  const totals = {
    calories: Math.round(rawTotals.calories),
    protein: Number(rawTotals.protein.toFixed(1)),
    carbs: Number(rawTotals.carbs.toFixed(1)),
    fat: Number(rawTotals.fat.toFixed(1)),
    sugar: Number(rawTotals.sugar.toFixed(1)),
    fiber: Number(rawTotals.fiber.toFixed(1)),
    sodium: Math.round(rawTotals.sodium),
    liquid_sugar: Number(rawTotals.liquidSugar.toFixed(1)),
    water_ml: Number(log.waterMl) || 0,
    pure_water_ml: Math.round((Number(log.waterMl) || 0) + Number(rawTotals.pureWaterMl || 0)),
    hydration_ml: Math.round((Number(log.waterMl) || 0) + Number(rawTotals.totalHydrationMl || 0)),
  };
  return {
    person: HELENA_PERSON,
    log_date: selectedDate,
    weight_kg: Number(log.weightKg) || null,
    wake_time: log.wakeTime || null,
    sleep_time: log.sleepTime || null,
    water_ml: Number(log.waterMl) || 0,
    walked: false,
    walked_km: null,
    used_uber: false,
    workout: log.workout,
    mood: null,
    appetite: log.appetite,
    notes: log.notes || null,
    meals: {
      ...cloneMeals(log.meals),
      _meta: {
        wheyStatus: log.wheyStatus,
        preWorkoutMeal: log.preWorkoutMeal,
        postWorkoutMeal: log.postWorkoutMeal,
        proteinDone: log.proteinDone,
        waterDone: log.waterDone,
        measures: log.measures,
      },
    },
    totals,
    status: 'partial',
  };
}

export default function PlanoHelena() {
  const [hasAccess, setHasAccess] = useState(() => localStorage.getItem(HELENA_STORAGE.access) === 'true');
  const [code, setCode] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem(HELENA_STORAGE.selectedDate) || dateKey());
  const [log, setLog] = useState(() => normalizeLog(safeJson(HELENA_STORAGE.draftLog, null), localStorage.getItem(HELENA_STORAGE.selectedDate) || dateKey()));
  const [history, setHistory] = useState([]);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('');
  const [debugLog, setDebugLog] = useState(() => safeJson(HELENA_STORAGE.debugLog, []));
  const [report, setReport] = useState('');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [testCountdown, setTestCountdown] = useState('');
  const [diagnosticTick, setDiagnosticTick] = useState(0);
  const [eatNow, setEatNow] = useState('');
  const [syncMeta, setSyncMeta] = useState(() => safeJson(HELENA_STORAGE.syncMeta, { lastAttempt: '', lastError: '' }));
  const [pendingSyncCount, setPendingSyncCount] = useState(() => Object.keys(safeJson(HELENA_STORAGE.pendingSync, {})).length);
  const [dataOrigin, setDataOrigin] = useState('vazio');
  const [lastSupabaseCall, setLastSupabaseCall] = useState(null);
  const [saveConfirmation, setSaveConfirmation] = useState(null);
  const [cloudRows, setCloudRows] = useState([]);
  const [cloudRowsError, setCloudRowsError] = useState(null);
  const attemptedPendingSync = useRef(false);
  const [notificationSettings, setNotificationSettings] = useState(() => safeJson(HELENA_STORAGE.notificationSettings, null) || {
    enabled: true,
    water: true,
    meals: true,
    workout: true,
    quietHours: true,
    quietStart: '23:30',
    quietEnd: '07:40',
    preWorkout: true,
    postWorkout: true,
    protein: true,
    collegeSnack: true,
    weighIn: true,
  });

  const totals = useMemo(() => {
    const raw = calculateTotals(log);
    return {
      calories: Math.round(raw.calories),
      protein: Number(raw.protein.toFixed(1)),
      carbs: Number(raw.carbs.toFixed(1)),
      fat: Number(raw.fat.toFixed(1)),
      sugar: Number(raw.sugar.toFixed(1)),
      fiber: Number(raw.fiber.toFixed(1)),
      sodium: Math.round(raw.sodium),
      liquidSugar: Number(raw.liquidSugar.toFixed(1)),
      totalHydrationMl: Math.round((Number(log.waterMl) || 0) + Number(raw.totalHydrationMl || 0)),
      pureWaterMl: Math.round((Number(log.waterMl) || 0) + Number(raw.pureWaterMl || 0)),
    };
  }, [log]);
  const warnings = useMemo(() => buildWarnings(log, totals), [log, totals]);
  const recommendations = useMemo(() => buildRecommendations(log, totals), [log, totals]);
  const recommendationOptions = useMemo(() => buildRecommendationOptions(log, totals), [log, totals]);
  const waterPlan = useMemo(() => planWaterReminder({
    profile: { waterDefault: HELENA_PROFILE.water[0], waterStart: '07:40', waterEnd: '23:30' },
    pureWaterMl: totals.pureWaterMl,
    totalHydrationMl: totals.totalHydrationMl,
  }), [totals.pureWaterMl, totals.totalHydrationMl, diagnosticTick]);
  const notificationPermission = 'Notification' in window ? Notification.permission : 'unsupported';
  const isStandalonePwa = Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone);
  const notificationDiagnostic = buildNotificationDiagnostic({
    settings: { ...notificationSettings, startTime: '07:40', endTime: '23:30' },
    profile: { waterDefault: HELENA_PROFILE.water[0] },
    waterMl: totals.pureWaterMl,
    totalHydrationMl: totals.totalHydrationMl,
    activePerson: 'Helena',
    lastSent: debugLog[0] ? `${debugLog[0].type} (${debugLog[0].time})` : '-',
    lastBlocked: '-',
    serviceWorkerReady,
    isStandalonePwa,
    notificationPermission,
  });

  useEffect(() => {
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    const previousManifest = manifestLink.getAttribute('href');
    manifestLink.setAttribute('href', '/manifest-helena.json');
    document.title = 'Plano da Helena';
    return () => {
      if (previousManifest) manifestLink.setAttribute('href', previousManifest);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(() => setServiceWorkerReady(true)).catch(() => setServiceWorkerReady(false));
  }, []);

  useEffect(() => {
    if (!hasAccess) return;
    let mounted = true;
    async function loadHelena() {
      const { startDate, endDate } = getSafeMonthDateRange(selectedDate);
      setLastSupabaseCall({ operation: 'loadHelenaMonth', table: 'daily_health_logs', person: HELENA_PERSON, startDate, endDate, at: new Date().toISOString() });
      const { data, error } = await supabase
        .from('daily_health_logs')
        .select('*')
        .eq('person', HELENA_PERSON)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date', { ascending: true });
      if (!mounted) return;
      if (error) {
        console.error('Erro ao carregar Helena no Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          range: { startDate, endDate },
          person: HELENA_PERSON,
        });
        const backup = safeJson(HELENA_STORAGE.offlineBackup, {});
        const pending = safeJson(HELENA_STORAGE.pendingSync, {});
        setLog(backup[selectedDate] || defaultLog(selectedDate));
        setDataOrigin(backup[selectedDate] ? 'LocalStorage' : 'Vazio');
        setPendingSyncCount(Object.keys(pending).length);
        return;
      }
      const current = (data || []).find((row) => row.log_date === selectedDate);
      const pending = safeJson(HELENA_STORAGE.pendingSync, {});
      setLog(normalizeLog(pending[selectedDate]?.log || current, selectedDate));
      setDataOrigin(pending[selectedDate] ? 'LocalStorage pendente' : current ? 'Supabase' : 'Vazio');
      setHasPendingChanges(false);
      setPendingSyncCount(Object.keys(pending).length);
      setHistory((data || []).map((row) => ({
        date: formatDateBr(row.log_date),
        logDate: row.log_date,
        weight: row.weight_kg,
        waist: row.meals?._meta?.measures?.waist,
        abdomen: row.meals?._meta?.measures?.abdomen,
      })));
    }
    loadHelena();
    return () => {
      mounted = false;
    };
  }, [hasAccess, selectedDate]);

  useEffect(() => {
    if (!hasAccess) return;
    localStorage.setItem(HELENA_STORAGE.selectedDate, selectedDate);
    const serialized = safeStringify(log);
    if (!serialized.ok) {
      setSaveError({ message: serialized.error?.message || 'Dados da Helena nao puderam ser serializados.' });
      return;
    }
    localStorage.setItem(HELENA_STORAGE.currentLog, serialized.text);
    if (hasPendingChanges) localStorage.setItem(HELENA_STORAGE.draftLog, serialized.text);
  }, [hasAccess, hasPendingChanges, log, selectedDate]);

  useEffect(() => {
    if (!hasAccess || attemptedPendingSync.current || pendingSyncCount === 0) return;
    attemptedPendingSync.current = true;
    syncPendingHelena();
  }, [hasAccess, pendingSyncCount]);

  function grantAccess(event) {
    event.preventDefault();
    if (code.trim() !== HELENA_ACCESS_CODE) return;
    localStorage.setItem(HELENA_STORAGE.access, 'true');
    setHasAccess(true);
  }

  function patchLog(patch) {
    setLog((current) => ({ ...current, ...patch }));
    setHasPendingChanges(true);
  }

  function toggleFood(meal, foodKey, checked) {
    const meals = cloneMeals(log.meals);
    if (!checked) {
      meals[meal].items = mealItems(meals, meal).filter((item) => item.food !== foodKey || item.custom);
    } else if (!mealItems(meals, meal).some((item) => item.food === foodKey && !item.custom)) {
      const food = HELENA_FOODS[foodKey];
      meals[meal].items = [...mealItems(meals, meal), normalizeMealItem({ food: foodKey, amount: food.unit === 'g' ? 100 : food.unit === 'ml' ? 200 : 1, unit: food.unit, note: '' }, meal)];
    }
    patchLog({ meals });
  }

  function updateFood(meal, foodKey, patch) {
    const meals = cloneMeals(log.meals);
    meals[meal].items = mealItems(meals, meal).map((item) => item.food === foodKey && !item.custom ? normalizeMealItem({ ...item, ...patch }, meal) : item);
    patchLog({ meals });
  }

  function addCustom(meal) {
    const meals = cloneMeals(log.meals);
    meals[meal].items = [...mealItems(meals, meal), normalizeMealItem({ id: `helena-${Date.now()}`, custom: true, label: '', brand_name: '', category: 'outro', amount: '', unit: 'g', calories: '', protein: '', sugar: '', notes: '' }, meal)];
    patchLog({ meals });
  }

  function addCalculatedFood(item, meal = 'snack') {
    const meals = cloneMeals(log.meals);
    meals[meal].items = [...mealItems(meals, meal), normalizeMealItem({ id: `helena-${Date.now()}`, custom: true, ...item }, meal)];
    patchLog({ meals });
  }

  function addQuickDatabaseFood(slug, meal = 'snack') {
    const food = findFood(slug);
    if (!food) return;
    const grams = food.default_portions?.[0]?.grams || 100;
    addCalculatedFood({
      custom: true,
      label: food.name,
      category: food.category,
      amount: grams,
      unit: food.unit || 'g',
      grams_or_ml: grams,
      grams,
      foodSlug: food.slug,
      databaseSlug: food.slug,
      source: food.source,
      source_id: food.source_id,
      source_note: food.source_note,
      hydration_factor: food.hydration_factor,
      is_water: food.is_water,
      is_liquid: food.is_liquid,
      warning_zero: food.warning_zero,
      warning_sugar: food.warning_sugar,
      ...calculateFoodNutrition(food, grams),
      notes: `Fonte: ${food.source} (${food.source_note})`,
    }, meal);
  }

  function updateCustom(meal, id, patch) {
    const meals = cloneMeals(log.meals);
    meals[meal].items = mealItems(meals, meal).map((item) => item.id === id ? normalizeMealItem({ ...item, ...patch }, meal) : item);
    patchLog({ meals });
  }

  function removeCustom(meal, id) {
    const meals = cloneMeals(log.meals);
    meals[meal].items = mealItems(meals, meal).filter((item) => item.id !== id);
    patchLog({ meals });
  }

  function duplicateItem(meal, item) {
    const meals = cloneMeals(log.meals);
    meals[meal].items = [...mealItems(meals, meal), normalizeMealItem({ ...item, id: `helena-${Date.now()}` }, meal)];
    patchLog({ meals });
  }

  function addRecommendation(option) {
    const meals = cloneMeals(log.meals);
    meals[option.meal].items = [...mealItems(meals, option.meal), ...option.items.map((item) => normalizeMealItem({ ...item, id: `helena-${Date.now()}-${item.label}` }, option.meal))];
    patchLog({ meals });
  }

  function saveMealTemplate(meal) {
    const templates = safeJson(HELENA_STORAGE.savedMeals, []);
    const next = [{
      id: `helena-meal-${Date.now()}`,
      name: `${HELENA_MEALS[meal]} Helena`,
      meal,
      items: sanitizeHelenaLogForSave(mealItems(log.meals, meal)),
      saved_at: new Date().toISOString(),
    }, ...templates].slice(0, 12);
    const serialized = safeStringify(next);
    if (serialized.ok) localStorage.setItem(HELENA_STORAGE.savedMeals, serialized.text);
    setSaveState('saved');
  }

  function repeatMealTemplate(template) {
    const meals = cloneMeals(log.meals);
    const meal = template.meal || 'snack';
    meals[meal].items = [...mealItems(meals, meal), ...(template.items || []).map((item) => normalizeMealItem({ ...item, id: `helena-${Date.now()}-${item.label}` }, meal))];
    patchLog({ meals });
  }

  function savePendingSync(dateToSave, cleanLog, payload, error) {
    const pending = safeJson(HELENA_STORAGE.pendingSync, {});
    const next = {
      ...pending,
      [dateToSave]: {
        person: HELENA_PERSON,
        log_date: dateToSave,
        log: cleanLog,
        payload,
        saved_at: new Date().toISOString(),
        error: {
          message: error?.message || 'Erro desconhecido',
          details: error?.details || '',
          hint: error?.hint || '',
          code: error?.code || '',
        },
      },
    };
    const serialized = safeStringify(next);
    if (serialized.ok) {
      localStorage.setItem(HELENA_STORAGE.pendingSync, serialized.text);
      setPendingSyncCount(Object.keys(next).length);
    }
    const meta = {
      lastAttempt: new Date().toISOString(),
      lastError: error?.message || '',
      lastCode: error?.code || '',
    };
    localStorage.setItem(HELENA_STORAGE.syncMeta, safeStringify(meta).text);
    setSyncMeta(meta);
  }

  async function saveHelena(logToSave = log, dateToSave = selectedDate) {
    if (logToSave?.preventDefault) {
      logToSave.preventDefault();
      logToSave = log;
      dateToSave = selectedDate;
    }
    setSaveState('saving');
    setSaveError(null);
    try {
      const cleanLog = sanitizeHelenaLogForSave(logToSave);
      const serializable = safeStringify(cleanLog);
      if (!serializable.ok) throw new Error(serializable.error?.message || 'Log da Helena nao e serializavel.');
      const payload = sanitizeHelenaLogForSave(rowPayload(cleanLog, dateToSave));
      assertSerializable(sanitizeLogForSave(payload));
      const payloadSerializable = safeStringify(payload);
      if (!payloadSerializable.ok) throw new Error(payloadSerializable.error?.message || 'Payload da Helena nao e serializavel.');
      setLastSupabaseCall({ operation: 'saveHelena.upsert', table: 'daily_health_logs', person: HELENA_PERSON, log_date: dateToSave, at: new Date().toISOString() });
      const { error } = await supabase
        .from('daily_health_logs')
        .upsert(payload, { onConflict: 'person,log_date' })
        .select()
        .single();
      if (error) {
        console.error('Erro ao salvar Helena no Supabase:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          payload,
        });
        savePendingSync(dateToSave, cleanLog, payload, error);
        setSaveState('offline');
        setSaveError({
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          person: HELENA_PERSON,
          logDate: dateToSave,
          serializable: true,
        });
        return;
      }
      setLastSupabaseCall({ operation: 'saveHelena.readBack', table: 'daily_health_logs', person: HELENA_PERSON, log_date: dateToSave, at: new Date().toISOString() });
      const { data: confirmData, error: confirmError } = await supabase
        .from('daily_health_logs')
        .select('id,person,log_date,water_ml,totals,updated_at')
        .eq('person', HELENA_PERSON)
        .eq('log_date', dateToSave)
        .single();
      if (confirmError) throw confirmError;
      const backup = safeJson(HELENA_STORAGE.offlineBackup, {});
      const backupSerialized = safeStringify({ ...backup, [dateToSave]: cleanLog });
      if (backupSerialized.ok) localStorage.setItem(HELENA_STORAGE.offlineBackup, backupSerialized.text);
      setSaveState('confirmed');
      setSaveConfirmation({ row: confirmData, at: new Date().toISOString() });
      setDataOrigin('Supabase');
      setHasPendingChanges(false);
      localStorage.removeItem(HELENA_STORAGE.draftLog);
    } catch (error) {
      console.error('Erro local ao salvar Helena:', error);
      setSaveError({ ...supabaseErrorDetails(error), message: error.message || 'Erro local ao salvar Helena.', person: HELENA_PERSON, logDate: dateToSave, serializable: false });
      setSaveState('error');
    }
  }

  async function changeDate(nextDate) {
    if (!nextDate || nextDate === selectedDate) return;
    if (hasPendingChanges) await saveHelena(log, selectedDate);
    setSelectedDate(nextDate);
  }

  function moveDate(days) {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const next = new Date(year, month - 1, day + days);
    changeDate(dateKey(next));
  }

  async function syncPendingHelena() {
    const pending = safeJson(HELENA_STORAGE.pendingSync, {});
    const entries = Object.entries(pending);
    if (!entries.length) {
      setNotificationStatus('Nao ha pendencias da Helena para sincronizar.');
      return;
    }
    const remaining = { ...pending };
    let lastError = null;
    for (const [date, entry] of entries) {
      const payload = sanitizeHelenaLogForSave(entry.payload || rowPayload(entry.log, date));
      const serializable = safeStringify(payload);
      if (!serializable.ok) {
        lastError = { message: serializable.error?.message || 'Payload pendente nao serializavel.', code: 'LOCAL_SERIALIZE' };
        continue;
      }
      const { error } = await supabase
        .from('daily_health_logs')
        .upsert(payload, { onConflict: 'person,log_date' })
        .select()
        .single();
      if (error) {
        console.error('Erro ao sincronizar pendencia da Helena:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          payload,
        });
        lastError = error;
        remaining[date] = { ...entry, error, last_attempt: new Date().toISOString() };
      } else {
        delete remaining[date];
      }
    }
    localStorage.setItem(HELENA_STORAGE.pendingSync, safeStringify(remaining).text);
    const meta = {
      lastAttempt: new Date().toISOString(),
      lastError: lastError?.message || '',
      lastCode: lastError?.code || '',
    };
    localStorage.setItem(HELENA_STORAGE.syncMeta, safeStringify(meta).text);
    setSyncMeta(meta);
    setPendingSyncCount(Object.keys(remaining).length);
    setNotificationStatus(lastError ? 'Ainda ha pendencias da Helena. Veja o ultimo erro.' : 'Pendencias da Helena sincronizadas.');
  }

  function clearPendingHelena() {
    const ok = window.confirm('Limpar pendencias locais da Helena? Isso pode apagar alteracoes ainda nao sincronizadas.');
    if (!ok) return;
    localStorage.removeItem(HELENA_STORAGE.pendingSync);
    const meta = { lastAttempt: new Date().toISOString(), lastError: 'Pendencias limpas manualmente.', lastCode: 'CLEARED' };
    localStorage.setItem(HELENA_STORAGE.syncMeta, safeStringify(meta).text);
    setSyncMeta(meta);
    setPendingSyncCount(0);
  }

  async function forceFetchHelenaFromCloud() {
    setLastSupabaseCall({ operation: 'forceFetchHelenaFromCloud', table: 'daily_health_logs', person: HELENA_PERSON, log_date: selectedDate, at: new Date().toISOString() });
    const { data, error } = await supabase
      .from('daily_health_logs')
      .select('*')
      .eq('person', HELENA_PERSON)
      .eq('log_date', selectedDate)
      .maybeSingle();
    if (error) {
      const details = supabaseErrorDetails(error);
      setSaveError({ ...details, person: HELENA_PERSON, logDate: selectedDate });
      setNotificationStatus(`Erro ao buscar Helena da nuvem: ${details.message}`);
      return;
    }
    setLog(normalizeLog(data, selectedDate));
    setDataOrigin(data ? 'Supabase' : 'Vazio');
    setHasPendingChanges(false);
    setNotificationStatus(data ? 'Helena carregada da nuvem.' : 'Nenhum registro da Helena na nuvem para esta data.');
  }

  async function fetchLatestHelenaCloudRows() {
    setCloudRowsError(null);
    setLastSupabaseCall({ operation: 'fetchLatestHelenaCloudRows', table: 'daily_health_logs', person: HELENA_PERSON, at: new Date().toISOString() });
    const { data, error } = await supabase
      .from('daily_health_logs')
      .select('id,person,log_date,water_ml,totals,updated_at')
      .eq('person', HELENA_PERSON)
      .order('updated_at', { ascending: false })
      .limit(10);
    if (error) {
      const details = supabaseErrorDetails(error);
      setCloudRowsError(details);
      return;
    }
    setCloudRows(data || []);
  }

  async function copyHelenaDiagnostic() {
    const text = buildDiagnosticText({
      plan: 'Helena',
      activePerson: HELENA_PERSON,
      selectedDate,
      localStoragePrefix: 'planohelena_',
      dataOrigin,
      saveState,
      saveError,
      saveConfirmation,
      lastSupabaseCall,
      syncMeta,
      pendingSyncCount,
      cloudRowsError,
    });
    await navigator.clipboard.writeText(text);
    setNotificationStatus('Diagnostico da Helena copiado.');
  }

  function updateNotificationSettings(patch) {
    const next = { ...notificationSettings, ...patch };
    setNotificationSettings(next);
    localStorage.setItem(HELENA_STORAGE.notificationSettings, safeStringify(next).text);
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setNotificationStatus('Este navegador nao suporta notificacoes web.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission === 'granted' ? 'Permissao concedida para notificacoes da Helena.' : 'Permissao negada.');
  }

  function logNotification(type, message) {
    const entry = { id: `${Date.now()}-${type}`, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), type, message };
    const next = [entry, ...debugLog].slice(0, 20);
    setDebugLog(next);
    localStorage.setItem(HELENA_STORAGE.debugLog, safeStringify(next).text);
    localStorage.setItem(HELENA_STORAGE.lastNotificationAt, new Date().toISOString());
  }

  function testNotification(delayMs = 0) {
    const send = async () => {
      const message = buildWaterMessage('Helena', waterPlan);
      if ('Notification' in window && Notification.permission === 'granted') {
        const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.ready.catch(() => null) : null;
        if (registration?.showNotification) {
          registration.showNotification('Plano da Helena', { body: message, tag: 'planohelena-water', icon: '/images/icon-192.png' });
        } else {
          new Notification('Plano da Helena', { body: message, tag: 'planohelena-test' });
        }
      }
      logNotification('helena', message);
      setTestCountdown('');
      setNotificationStatus('Teste de notificacao da Helena enviado.');
    };
    if (delayMs) {
      let remaining = Math.round(delayMs / 1000);
      setTestCountdown(`Disparando teste em ${remaining}s.`);
      const countdown = window.setInterval(() => {
        remaining -= 1;
        setTestCountdown(remaining > 0 ? `Disparando teste em ${remaining}s.` : 'Enviando notificacao...');
        if (remaining <= 0) window.clearInterval(countdown);
      }, 1000);
      setNotificationStatus(`Teste da Helena agendado em ${Math.round(delayMs / 1000)}s.`);
      window.setTimeout(send, delayMs);
    } else {
      send();
    }
  }

  async function clearHelenaCache() {
    const ok = window.confirm('Corrigir o atalho da Helena e limpar cache do app? Isso nao apaga registros salvos no Supabase.');
    if (!ok) return;
    localStorage.setItem(HELENA_STORAGE.pwaSettings, safeStringify({ cacheClearedAt: new Date().toISOString() }).text);
    await clearAppCachesAndReload('/planohelena');
  }

  function generateReport() {
    const items = allMealItems(log.meals);
    const lineForMeal = (meal) => mealItems(log.meals, meal).map((item) => {
      if (!item.custom) return `${HELENA_FOODS[item.food]?.label}: ${item.amount} ${item.unit}`;
      const name = item.brand_name ? `${item.label || 'Outro'} / ${item.brand_name}` : item.label || 'Outro';
      const source = item.source ? `; fonte: ${item.source}${item.source_note ? ` (${item.source_note})` : ''}` : '';
      return `${name}: ${item.amount || '-'} ${item.unit || ''}${source}`;
    }).join('; ') || '-';
    const hydrationItems = items
      .map((item) => ({ item, hydration: estimateHydration(item, HELENA_FOODS[item.food]) }))
      .filter(({ hydration }) => Number(hydration.hydration_ml) > 0)
      .map(({ item, hydration }) => `- ${item.label || HELENA_FOODS[item.food]?.label || 'Bebida'}: ${item.amount || item.grams_or_ml || '-'} ${item.unit || ''}; fator ${item.hydration_factor || (item.is_water ? 1 : 'estimado')}; hidratacao ${Math.round(hydration.hydration_ml)} ml`);
    const unknownItems = items
      .filter((item) => item.custom && !Number(item.calories) && !Number(item.protein) && !Number(item.carbs))
      .map((item) => item.label || item.brand_name || 'Item personalizado');
    const text = [
      'RELATORIO DO DIA - HELENA',
      `Data do registro: ${formatDateBr(selectedDate)}`,
      ...reportTimestampLines(),
      'Pessoa: Helena',
      'Idade: 23',
      'Altura: 1,57 m',
      `Peso: ${log.weightKg || '-'}`,
      'Objetivo: emagrecer e ganhar massa / recomposicao corporal',
      `Sono: ${log.wakeTime || '-'} ate ${log.sleepTime || '-'}`,
      `Agua pura: ${totals.pureWaterMl || 0} ml`,
      `Hidratacao total estimada: ${totals.totalHydrationMl || 0} ml`,
      `Treino: ${log.workout || '-'}`,
      'Horario do treino: 12h15/12h30',
      'Trabalho: 08h00 as 12h00 / 14h30 as 17h00',
      'Faculdade: por volta de 19h30',
      `Fome: ${log.appetite || '-'}`,
      `Cafe da manha: ${lineForMeal('breakfast')}`,
      `Almoco: ${lineForMeal('lunch')}`,
      `Lanche: ${lineForMeal('snack')}`,
      `Janta: ${lineForMeal('dinner')}`,
      `Ceia: ${lineForMeal('supper')}`,
      `Extras: ${lineForMeal('extras')}`,
      `Calorias estimadas: ${totals.calories} kcal`,
      `Proteina estimada: ${totals.protein} g`,
      `Carboidratos estimados: ${totals.carbs} g`,
      `Gorduras estimadas: ${totals.fat} g`,
      `Acucar estimado: ${totals.sugar} g`,
      `Fibras estimadas: ${totals.fiber} g`,
      `Sodio estimado: ${totals.sodium} mg`,
      'Bebidas que contribuiram para hidratacao:',
      hydrationItems.join('\n') || '-',
      `Alertas do sistema: ${warnings.join(' | ')}`,
      'Recomendacoes automaticas do site:',
      recommendationOptions.map((option) => `- ${option.title}: ${option.foods}; ${option.calories} kcal; ${option.protein}g proteina; motivo: ${option.reason}`).join('\n'),
      `Itens sem valor nutricional conhecido: ${unknownItems.join(', ') || '-'}`,
      `Fontes dos alimentos calculados: ${items.map((item) => item.source).filter(Boolean).join(', ') || 'manual/estimativa local'}`,
      `Observacoes: ${log.notes || '-'}`,
      'Pergunta para o ChatGPT: Analise meu dia e me diga o que ajustar ainda hoje ou amanha.',
      'Aviso: Valores nutricionais e hidratacao estimada sao aproximacoes e podem variar por marca, preparo e porcao.',
    ].join('\n');
    setReport(text);
    return text;
  }

  async function copyReport() {
    const text = report || generateReport();
    await navigator.clipboard.writeText(text);
  }

  if (!hasAccess) {
    return (
      <motion.form onSubmit={grantAccess} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl">
        <Lock className="mb-4 h-8 w-8 text-emerald-600" />
        <h1 className="mb-2 font-serif text-3xl font-bold text-slate-900">Plano da Helena</h1>
        <p className="mb-4 text-sm text-slate-500">Digite o codigo proprio da Helena.</p>
        <input value={code} onChange={(event) => setCode(event.target.value)} type="password" className="mb-3 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100" />
        <button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Entrar</button>
      </motion.form>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6 pb-16">
      <section className="rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase text-emerald-700">
              <Dumbbell className="h-4 w-4" /> Plano independente
            </div>
            <h1 className="font-serif text-4xl font-bold text-slate-900">Plano Helena</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{HELENA_PROFILE.goal}</p>
          </div>
          <button onClick={() => saveHelena()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            {saveState === 'confirmed' ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saveState === 'saving' ? 'Salvando...' : saveState === 'offline' ? 'Salvo neste aparelho' : saveState === 'error' ? 'Erro ao salvar' : saveState === 'confirmed' ? 'Confirmado na nuvem' : 'Salvar e confirmar na nuvem'}
          </button>
        </div>
        <div className="mt-4 grid gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-bold leading-5 text-emerald-900 sm:grid-cols-2">
          <p>Origem atual: {dataOrigin}</p>
          <p>person: {HELENA_PERSON} | data: {selectedDate}</p>
          <p>Versao/cache: {APP_CACHE_VERSION}</p>
          <p>Ultima chamada Supabase: {lastSupabaseCall?.operation || '-'}</p>
          {saveConfirmation?.row ? (
            <>
              <p>id: {saveConfirmation.row.id || '-'}</p>
              <p>updated_at: {saveConfirmation.row.updated_at || '-'}</p>
              <p>water_ml: {saveConfirmation.row.water_ml || 0}</p>
              <p>totals.pure_water_ml: {saveConfirmation.row.totals?.pure_water_ml || 0}</p>
            </>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => saveHelena()} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Salvar e confirmar na nuvem</button>
          <button onClick={forceFetchHelenaFromCloud} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">Forcar buscar da nuvem</button>
          <button onClick={syncPendingHelena} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">Sincronizar pendencias</button>
          <button onClick={fetchLatestHelenaCloudRows} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">Ver ultimos registros na nuvem</button>
          <button onClick={clearHelenaCache} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">Limpar cache e recarregar</button>
          <button onClick={copyHelenaDiagnostic} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">Copiar diagnostico</button>
        </div>
        {cloudRows.length ? (
          <div className="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-slate-700">
            {cloudRows.map((row) => (
              <p key={row.id || `${row.person}-${row.log_date}`}>{row.person} | {row.log_date} | agua {row.water_ml || 0}ml | agua pura {row.totals?.pure_water_ml || 0}ml | {row.updated_at || '-'} | {row.id || '-'}</p>
            ))}
          </div>
        ) : null}
        {cloudRowsError ? (
          <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold text-red-800">Supabase: {cloudRowsError.code || '-'} {cloudRowsError.message}</p>
        ) : null}
        {saveError && (
          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900">
            <p>Erro ao salvar. Veja detalhes.</p>
            <p>Codigo: {saveError.code || '-'}</p>
            <p>Mensagem: {saveError.message || '-'}</p>
            <p>Hint: {saveError.hint || '-'}</p>
            <p>Data: {saveError.logDate || selectedDate} | person: {saveError.person || HELENA_PERSON} | JSON serializavel: {saveError.serializable === false ? 'nao' : 'sim'}</p>
          </div>
        )}
      </section>

      <QuickNav items={[
        { id: 'summary', label: 'Resumo' },
        { id: 'calendar', label: 'Data' },
        { id: 'water', label: 'Agua' },
        { id: 'meals', label: 'Refeicoes' },
        { id: 'history', label: 'Historico' },
        { id: 'notifications', label: 'Notificacoes' },
      ]} />

      <BrasiliaClock nextWater={waterPlan.nextTime} nextAlert={buildWaterMessage('Helena', waterPlan)} />

      <section className="rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-lg">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
              <Smartphone className="h-5 w-5 text-emerald-600" /> Instalar no celular
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-500">Use esta pagina aberta em /planohelena para criar o atalho correto da Helena.</p>
          </div>
          <button onClick={clearHelenaCache} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <RotateCcw className="h-4 w-4" /> Corrigir atalho / limpar cache
          </button>
        </div>
        <ol className="grid gap-2 text-sm font-bold leading-6 text-slate-700 md:grid-cols-2">
          <li className="rounded-2xl bg-emerald-50/70 px-4 py-3">1. Abra no Chrome: https://euteamoanaclara.top/planohelena</li>
          <li className="rounded-2xl bg-emerald-50/70 px-4 py-3">2. Toque nos tres pontinhos do navegador.</li>
          <li className="rounded-2xl bg-emerald-50/70 px-4 py-3">3. Toque em Adicionar a tela inicial ou Instalar app.</li>
          <li className="rounded-2xl bg-emerald-50/70 px-4 py-3">4. Confirme que o nome aparece como Plano Helena.</li>
          <li className="rounded-2xl bg-emerald-50/70 px-4 py-3">5. Abra pelo novo icone criado.</li>
          <li className="rounded-2xl bg-emerald-50/70 px-4 py-3">6. Se abrir errado, apague o atalho antigo e use o botao de limpar cache desta pagina.</li>
        </ol>
      </section>

      <CollapsibleSection title="Calendario/Data" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="calendar">
        <section id="calendar" className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-slate-900">
                <CalendarDays className="h-5 w-5 text-emerald-600" /> {formatDateBr(selectedDate)}
              </h2>
              <p className="text-xs font-bold text-slate-500">Registro separado: person=helena, log_date={selectedDate}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => moveDate(-1)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                <ChevronLeft className="h-4 w-4" /> Dia anterior
              </button>
              <input type="date" value={selectedDate} onChange={(event) => changeDate(event.target.value)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none" />
              <button type="button" onClick={() => moveDate(1)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                Proximo dia <ChevronRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => changeDate(dateKey())} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Hoje</button>
            </div>
          </div>
        </section>
      </CollapsibleSection>

      <CollapsibleSection title="Resumo do dia" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="summary">
      <section id="summary" className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block text-xs font-bold uppercase text-slate-500">Peso kg<input type="number" step="0.1" value={log.weightKg} onChange={(event) => patchLog({ weightKg: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800" /></label>
          <label className="block text-xs font-bold uppercase text-slate-500">Acordou<input type="time" value={log.wakeTime} onChange={(event) => patchLog({ wakeTime: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800" /></label>
          <label className="block text-xs font-bold uppercase text-slate-500">Dormir<input type="time" value={log.sleepTime} onChange={(event) => patchLog({ sleepTime: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800" /></label>
          <label className="block text-xs font-bold uppercase text-slate-500">Treino<select value={log.workout} onChange={(event) => patchLog({ workout: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800"><option value="musculacao">Musculacao</option><option value="descanso">Descanso</option><option value="cardio">Cardio</option><option value="outro">Outro</option></select></label>
          <label className="block text-xs font-bold uppercase text-slate-500">Fome<select value={log.appetite} onChange={(event) => patchLog({ appetite: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800"><option value="sem_fome">Sem fome</option><option value="medio">Media</option><option value="muita_fome">Muita fome</option><option value="vontade_doce">Vontade de doce</option></select></label>
          <label className="block text-xs font-bold uppercase text-slate-500">Usa whey?<select value={log.wheyStatus} onChange={(event) => patchLog({ wheyStatus: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800"><option value="nao">Nao</option><option value="sim">Sim</option><option value="pretendo_usar">Pretendo usar</option></select></label>
          <label className="block text-xs font-bold uppercase text-slate-500">Agua ml<input type="number" value={log.waterMl} onChange={(event) => patchLog({ waterMl: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800" /></label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          {Object.entries({ waist: 'Cintura', hip: 'Quadril', abdomen: 'Abdomen', thigh: 'Coxa', arm: 'Braco' }).map(([key, label]) => (
            <label key={key} className="block text-xs font-bold uppercase text-slate-500">{label} cm<input type="number" step="0.1" value={log.measures[key]} onChange={(event) => patchLog({ measures: { ...log.measures, [key]: event.target.value } })} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800" /></label>
          ))}
        </div>
        <textarea value={log.notes} onChange={(event) => patchLog({ notes: event.target.value })} placeholder="Observacoes" className="mt-4 min-h-20 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800 outline-none" />
      </section>
      </CollapsibleSection>

      <CollapsibleSection title="Notificacoes" defaultOpen={false} storageKey={HELENA_STORAGE.collapsedSections} sectionId="notifications">
        <HelenaNotificationSettings
          settings={notificationSettings}
          status={notificationStatus}
          debugLog={debugLog}
          pendingSyncCount={pendingSyncCount}
          syncMeta={syncMeta}
          onSettings={updateNotificationSettings}
          onEnable={enableNotifications}
          onTest={testNotification}
          onClearCache={clearHelenaCache}
          onSyncPending={syncPendingHelena}
          onClearPending={clearPendingHelena}
        />
        <div className="mt-4">
          <NotificationDiagnostics
            diagnostic={notificationDiagnostic}
            countdown={testCountdown}
            onTestNow={() => testNotification(0)}
            onTestWater10s={() => testNotification(10000)}
            onRecalculate={() => setDiagnosticTick((value) => value + 1)}
            onResetTimers={() => {
              setTestCountdown('');
              localStorage.removeItem(HELENA_STORAGE.lastNotificationAt);
              setNotificationStatus('Timers de notificacao da Helena resetados.');
            }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Agua" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="water">
        <HelenaWaterTracker water={log.waterMl} hydration={totals} onWater={(ml) => patchLog({ waterMl: (Number(log.waterMl) || 0) + ml })} />
      </CollapsibleSection>

      <section id="meals" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <CollapsibleSection title="Refeicoes" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="meals">
          <HelenaMealLogger
            log={log}
            totals={totals}
            onToggleFood={toggleFood}
            onUpdateFood={updateFood}
            onAddCustom={addCustom}
            onAddCalculatedFood={addCalculatedFood}
            onUpdateCustom={updateCustom}
            onRemoveCustom={removeCustom}
            onDuplicateItem={duplicateItem}
            onSaveMeal={saveMealTemplate}
            onRepeatMeal={repeatMealTemplate}
          />
        </CollapsibleSection>
        <CollapsibleSection title="Resumo e recomendacoes" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="recommendations">
          <HelenaDashboard log={log} totals={totals} warnings={warnings} recommendations={recommendations} recommendationOptions={recommendationOptions} onAddRecommendation={addRecommendation} eatNow={eatNow} onEatNow={() => setEatNow(buildEatNow(log, totals))} history={history} onRegisterWeight={() => patchLog({ weightKg: log.weightKg || '63' })} />
        </CollapsibleSection>
      </section>

      <CollapsibleSection title="Exportar relatorio" defaultOpen={false} storageKey={HELENA_STORAGE.collapsedSections} sectionId="export">
        <HelenaExportReport report={report} onGenerate={generateReport} onCopy={copyReport} />
      </CollapsibleSection>
    </motion.div>
  );
}
