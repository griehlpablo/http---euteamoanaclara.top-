import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Dumbbell, Lock, RotateCcw, Save, Smartphone } from 'lucide-react';
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

const HELENA_ACCESS_CODE = 'helena2026';

const emptyMeals = {
  breakfast: [],
  lunch: [],
  snack: [],
  dinner: [],
  supper: [],
  extras: [],
};

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
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
    meals: emptyMeals,
  };
}

function cloneMeals(meals = emptyMeals) {
  return Object.fromEntries(Object.entries({ ...emptyMeals, ...meals }).map(([key, value]) => [key, Array.isArray(value) ? value.map((item) => ({ ...item })) : []]));
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
  return Object.values(log.meals || {}).flat().reduce(
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
        if (item.category === 'bebida com acucar') acc.liquidSugar += manual.sugar;
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
    weightKg: row.weight_kg ?? '63',
    wakeTime: row.wake_time || '07:40',
    sleepTime: row.sleep_time || '01:40',
    waterMl: row.water_ml || 0,
    workout: row.workout || 'musculacao',
    appetite: row.appetite || 'medio',
    notes: row.notes || '',
    wheyStatus: meta.wheyStatus || 'pretendo_usar',
    preWorkoutMeal: Boolean(meta.preWorkoutMeal),
    postWorkoutMeal: Boolean(meta.postWorkoutMeal),
    proteinDone: Boolean(meta.proteinDone),
    waterDone: Boolean(meta.waterDone),
    measures: { ...defaultLog(selectedDate).measures, ...(meta.measures || {}) },
    meals: cloneMeals(row.meals),
  };
}

function buildWarnings(log, totals) {
  const warnings = [];
  const trained = log.workout === 'musculacao';
  const allItems = Object.values(log.meals || {}).flat();
  const hasPaoDeQueijo = allItems.some((item) => item.food === 'pao_queijo' || item.foodSlug === 'pao_de_queijo' || item.databaseSlug === 'pao_de_queijo' || String(item.label || '').toLowerCase().includes('pao de queijo'));
  const hasMaca = allItems.some((item) => item.food === 'maca' || item.foodSlug === 'maca' || item.databaseSlug === 'maca' || String(item.label || '').toLowerCase().includes('maca'));
  if (totals.protein < 75) warnings.push('Helena, se quer ganhar massa e emagrecer, proteina nao pode ficar baixa. Coloque ovo, frango, carne, leite, iogurte ou whey.');
  if (trained && hasPaoDeQueijo) warnings.push('Pao de queijo e ok, mas tem pouca proteina. Para recomposicao, complementa com ovo, leite, iogurte, frango ou whey.');
  if (hasMaca) warnings.push('Maca ajuda na fibra e saciedade, mas quase nao tem proteina.');
  if (trained && totals.calories > 0 && totals.calories < 1200) warnings.push('Treinou musculacao e comeu pouco. Isso atrapalha ganho de massa e recuperacao.');
  if (totals.calories > 0 && totals.calories < 1100) warnings.push('Comer pouco demais pode ate baixar peso rapido, mas piora treino, fome e massa muscular.');
  if (totals.calories > HELENA_PROFILE.calories[1] + 250) warnings.push('Hoje passou do ponto. Amanha volta ao basico: proteina, agua e comida de verdade.');
  if (totals.liquidSugar > 18) warnings.push('Caloria liquida atrapalha facil. Se quer recomposicao, refrigerante normal/suco adocado precisa ser excecao.');
  if (!log.meals.dinner.length && new Date().getHours() >= 18) warnings.push('Nao vai para faculdade zerada de comida. Depois a chance de atacar qualquer coisa aumenta.');
  if (!warnings.length) warnings.push('Boa, Helena. Sem terrorismo alimentar: mantenha proteina, agua e treino.');
  return warnings;
}

function buildRecommendations(log, totals) {
  const recs = [];
  if (totals.protein < HELENA_PROFILE.protein[0]) recs.push('Prioridade: bater proteina com ovo, frango, carne, leite, iogurte ou whey se estiver usando.');
  if (log.workout === 'musculacao' && !log.meals.lunch.length) recs.push('Depois do treino das 12h15/12h30, faca almoco com proteina.');
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
  const [selectedDate, setSelectedDate] = useState(dateKey());
  const [log, setLog] = useState(() => defaultLog(dateKey()));
  const [history, setHistory] = useState([]);
  const [saveState, setSaveState] = useState('idle');
  const [notificationStatus, setNotificationStatus] = useState('');
  const [debugLog, setDebugLog] = useState(() => JSON.parse(localStorage.getItem(HELENA_STORAGE.debugLog) || '[]'));
  const [report, setReport] = useState('');
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [testCountdown, setTestCountdown] = useState('');
  const [diagnosticTick, setDiagnosticTick] = useState(0);
  const [eatNow, setEatNow] = useState('');
  const [notificationSettings, setNotificationSettings] = useState(() => JSON.parse(localStorage.getItem(HELENA_STORAGE.notificationSettings) || 'null') || {
    enabled: true,
    water: true,
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
      totalHydrationMl: Number(raw.totalHydrationMl || 0),
      pureWaterMl: Number(raw.pureWaterMl || 0),
    };
  }, [log]);
  const warnings = useMemo(() => buildWarnings(log, totals), [log, totals]);
  const recommendations = useMemo(() => buildRecommendations(log, totals), [log, totals]);
  const waterPlan = useMemo(() => planWaterReminder({
    profile: { waterDefault: HELENA_PROFILE.water[0], waterStart: '07:40', waterEnd: '23:30' },
    pureWaterMl: log.waterMl,
    totalHydrationMl: totals.totalHydrationMl,
  }), [log.waterMl, totals.totalHydrationMl, diagnosticTick]);
  const notificationPermission = 'Notification' in window ? Notification.permission : 'unsupported';
  const isStandalonePwa = Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone);
  const notificationDiagnostic = buildNotificationDiagnostic({
    settings: { ...notificationSettings, startTime: '07:40', endTime: '23:30' },
    profile: { waterDefault: HELENA_PROFILE.water[0] },
    waterMl: log.waterMl,
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
      const first = selectedDate.slice(0, 8) + '01';
      const { data, error } = await supabase
        .from('daily_health_logs')
        .select('*')
        .eq('person', HELENA_PERSON)
        .gte('log_date', first)
        .lte('log_date', selectedDate.slice(0, 8) + '31')
        .order('log_date', { ascending: true });
      if (!mounted) return;
      if (error) {
        const backup = JSON.parse(localStorage.getItem(HELENA_STORAGE.offlineBackup) || '{}');
        setLog(backup[selectedDate] || defaultLog(selectedDate));
        return;
      }
      const current = (data || []).find((row) => row.log_date === selectedDate);
      setLog(normalizeLog(current, selectedDate));
      setHistory((data || []).map((row) => ({
        date: formatDateBr(row.log_date),
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

  function grantAccess(event) {
    event.preventDefault();
    if (code.trim() !== HELENA_ACCESS_CODE) return;
    localStorage.setItem(HELENA_STORAGE.access, 'true');
    setHasAccess(true);
  }

  function patchLog(patch) {
    setLog((current) => ({ ...current, ...patch }));
  }

  function toggleFood(meal, foodKey, checked) {
    const meals = cloneMeals(log.meals);
    if (!checked) {
      meals[meal] = meals[meal].filter((item) => item.food !== foodKey || item.custom);
    } else if (!meals[meal].some((item) => item.food === foodKey && !item.custom)) {
      const food = HELENA_FOODS[foodKey];
      meals[meal] = [...meals[meal], { food: foodKey, amount: food.unit === 'g' ? 100 : food.unit === 'ml' ? 200 : 1, unit: food.unit, note: '' }];
    }
    patchLog({ meals });
  }

  function updateFood(meal, foodKey, patch) {
    const meals = cloneMeals(log.meals);
    meals[meal] = meals[meal].map((item) => item.food === foodKey && !item.custom ? { ...item, ...patch } : item);
    patchLog({ meals });
  }

  function addCustom(meal) {
    const meals = cloneMeals(log.meals);
    meals[meal] = [...meals[meal], { id: `helena-${Date.now()}`, custom: true, label: '', category: 'outro', amount: '', unit: 'g', calories: '', protein: '', sugar: '', notes: '' }];
    patchLog({ meals });
  }

  function addCalculatedFood(item, meal = 'snack') {
    const meals = cloneMeals(log.meals);
    meals[meal] = [...(meals[meal] || []), { id: `helena-${Date.now()}`, ...item }];
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
      amount: 1,
      unit: `${grams}g`,
      grams_or_ml: grams,
      grams,
      foodSlug: food.slug,
      databaseSlug: food.slug,
      source: food.source,
      source_note: food.source_note,
      ...calculateFoodNutrition(food, grams),
      notes: `Fonte: ${food.source} (${food.source_note})`,
    }, meal);
  }

  function updateCustom(meal, id, patch) {
    const meals = cloneMeals(log.meals);
    meals[meal] = meals[meal].map((item) => item.id === id ? { ...item, ...patch } : item);
    patchLog({ meals });
  }

  function removeCustom(meal, id) {
    const meals = cloneMeals(log.meals);
    meals[meal] = meals[meal].filter((item) => item.id !== id);
    patchLog({ meals });
  }

  async function saveHelena() {
    setSaveState('saving');
    const payload = rowPayload(log, selectedDate);
    const { error } = await supabase.from('daily_health_logs').upsert(payload, { onConflict: 'person,log_date' });
    if (error) {
      const backup = JSON.parse(localStorage.getItem(HELENA_STORAGE.offlineBackup) || '{}');
      localStorage.setItem(HELENA_STORAGE.offlineBackup, JSON.stringify({ ...backup, [selectedDate]: log }));
      setSaveState('offline');
      return;
    }
    setSaveState('saved');
  }

  function updateNotificationSettings(patch) {
    const next = { ...notificationSettings, ...patch };
    setNotificationSettings(next);
    localStorage.setItem(HELENA_STORAGE.notificationSettings, JSON.stringify(next));
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
    localStorage.setItem(HELENA_STORAGE.debugLog, JSON.stringify(next));
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
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(async (registration) => {
        await registration.update().catch(() => undefined);
        if (registration.scope.includes('/planohelena') || registration.scope.includes(window.location.origin)) {
          await registration.unregister().catch(() => undefined);
        }
      }));
    }
    localStorage.setItem(HELENA_STORAGE.pwaSettings, JSON.stringify({ cacheClearedAt: new Date().toISOString() }));
    window.location.href = `/planohelena?fresh=${Date.now()}`;
  }

  function generateReport() {
    const lineForMeal = (meal) => (log.meals[meal] || []).map((item) => item.custom ? `${item.label || 'Outro'}: ${item.amount || '-'} ${item.unit || ''}` : `${HELENA_FOODS[item.food]?.label}: ${item.amount} ${item.unit}`).join('; ') || '-';
    const text = [
      `RELATORIO DO DIA - HELENA - ${formatDateBr(selectedDate)}`,
      'Pessoa: Helena',
      'Idade: 23',
      'Altura: 1,57 m',
      `Peso atual: ${log.weightKg || '-'}`,
      'Objetivo: emagrecer e ganhar massa / recomposicao corporal',
      `Sono: ${log.wakeTime || '-'} ate ${log.sleepTime || '-'}`,
      `Agua: ${log.waterMl || 0} ml`,
      `Treino: ${log.workout || '-'}`,
      'Horario do treino: 12h15/12h30',
      'Trabalho: 08h00 as 12h00 / 14h30 as 17h00',
      'Faculdade: por volta de 19h30',
      `Fome agora: ${log.appetite || '-'}`,
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
      `Alertas do sistema: ${warnings.join(' | ')}`,
      `Recomendacoes do site: ${recommendations.join(' | ')}`,
      'Itens sem valor nutricional conhecido: itens personalizados sem kcal/proteina/acucar preenchidos',
      `Fontes dos alimentos calculados: ${Object.values(log.meals || {}).flat().map((item) => item.source).filter(Boolean).join(', ') || 'manual/estimativa local'}`,
      `Observacoes: ${log.notes || '-'}`,
      'Pergunta para o ChatGPT: Analise meu dia e me diga o que ajustar ainda hoje ou amanha.',
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
          <button onClick={saveHelena} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
            {saveState === 'saved' ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saveState === 'saving' ? 'Salvando...' : saveState === 'offline' ? 'Backup local criado' : saveState === 'saved' ? 'Salvo' : 'Salvar Helena'}
          </button>
        </div>
      </section>

      <QuickNav items={[
        { id: 'summary', label: 'Resumo' },
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

      <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block text-xs font-bold uppercase text-slate-500">Data<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800" /></label>
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

      <CollapsibleSection title="Notificacoes" defaultOpen={false} storageKey={HELENA_STORAGE.collapsedSections} sectionId="notifications">
        <HelenaNotificationSettings settings={notificationSettings} status={notificationStatus} debugLog={debugLog} onSettings={updateNotificationSettings} onEnable={enableNotifications} onTest={testNotification} onClearCache={clearHelenaCache} />
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
        <HelenaWaterTracker water={log.waterMl} onWater={(ml) => patchLog({ waterMl: (Number(log.waterMl) || 0) + ml })} />
      </CollapsibleSection>

      <CollapsibleSection title="Calculadora alimentar" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="calculator">
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => addQuickDatabaseFood('pao_de_queijo', 'snack')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">+ Pao de queijo</button>
          <button type="button" onClick={() => addQuickDatabaseFood('maca', 'snack')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">+ Maca</button>
          <button type="button" onClick={() => addQuickDatabaseFood('iogurte_com_frutas', 'snack')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">+ Iogurte com frutas</button>
          {log.wheyStatus !== 'nao' && <button type="button" onClick={() => addQuickDatabaseFood('whey_protein', 'snack')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">+ Whey</button>}
        </div>
        <FoodSearchCalculator onAdd={addCalculatedFood} defaultMeal="snack" title="Calculadora alimentar da Helena" />
      </CollapsibleSection>

      <section id="meals" className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <CollapsibleSection title="Refeicoes" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="meals">
          <HelenaMealLogger log={log} onToggleFood={toggleFood} onUpdateFood={updateFood} onAddCustom={addCustom} onUpdateCustom={updateCustom} onRemoveCustom={removeCustom} />
        </CollapsibleSection>
        <CollapsibleSection title="Resumo e recomendacoes" defaultOpen storageKey={HELENA_STORAGE.collapsedSections} sectionId="recommendations">
          <HelenaDashboard log={log} totals={totals} warnings={warnings} recommendations={recommendations} eatNow={eatNow} onEatNow={() => setEatNow(buildEatNow(log, totals))} history={history} />
        </CollapsibleSection>
      </section>

      <CollapsibleSection title="Exportar relatorio" defaultOpen={false} storageKey={HELENA_STORAGE.collapsedSections} sectionId="export">
        <HelenaExportReport report={report} onGenerate={generateReport} onCopy={copyReport} />
      </CollapsibleSection>
    </motion.div>
  );
}
