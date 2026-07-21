import {
  Droplets,
  HeartPulse,
  PackagePlus,
  PawPrint,
  Pill,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Syringe,
  Utensils,
} from "lucide-react";

export const DEVICE_PERSON_KEY = "milka-device-person-v1";
export const LOCAL_REMINDERS_KEY = "milka-local-reminders-v1";
export const DATA_VERSION = 4;
export const PEOPLE = ["Pedro", "Ana", "Pablo"];
export const HOME_WINDOWS = {
  Pablo: "Antes das 07:30, das 12:00 às 13:00 e após 16:30",
  Ana: "Antes das 06:30 e após 13:00",
  Pedro: "Antes das 06:30 e após 17:00",
};
export const EXTERNAL_IDS = {
  Pedro: "@pedro_milka",
  Ana: "@anakov_",
  Pablo: "@griehl_",
};

export const ACTIONS = {
  food: { label: "Deu ração", icon: Utensils, group: "care" },
  sachet: { label: "Deu sachê", icon: PackagePlus, group: "care" },
  water: { label: "Trocou a água", icon: Droplets, group: "care" },
  litter: { label: "Limpou a areia", icon: Sparkles, group: "care" },
  bought_food: { label: "Comprou ração", icon: ShoppingBag, group: "purchase" },
  bought_sachet: { label: "Comprou sachê", icon: ShoppingBag, group: "purchase" },
  bought_litter: { label: "Comprou areia", icon: ShoppingBag, group: "purchase" },
};

export const RECORD_TYPES = {
  weight: { label: "Peso", icon: Scale },
  vaccine: { label: "Vacina", icon: Syringe },
  dewormer: { label: "Vermífugo", icon: ShieldCheck },
  medication: { label: "Medicamento", icon: Pill },
  consultation: { label: "Consulta", icon: Stethoscope },
  symptom: { label: "Sintoma/ocorrência", icon: HeartPulse },
  note: { label: "Observação", icon: PawPrint },
};

export const DEFAULT_SCHEDULES = [
  {
    id: "litter-morning",
    action: "litter",
    label: "Limpar a areia pela manhã",
    time: "06:00",
    enabled: true,
    notify: ["Pedro"],
    details: "Retirar fezes e torrões. É a primeira limpeza do dia.",
  },
  {
    id: "food-morning",
    action: "food",
    label: "Ração da manhã",
    time: "06:15",
    enabled: true,
    notify: ["Pablo"],
    details: "17 g de ração seca: 2 colheres de sopa rasas + 2 de chá rasas.",
  },
  {
    id: "water-morning",
    action: "water",
    label: "Trocar a água pela manhã",
    time: "06:20",
    enabled: true,
    notify: ["Pablo"],
    details: "Descartar a água antiga, lavar o pote e colocar água fresca.",
  },
  {
    id: "sachet-midday",
    action: "sachet",
    label: "Refeição do meio-dia",
    time: "12:15",
    enabled: true,
    notify: ["Pablo"],
    details: "½ sachê + 8 g de ração seca: 1 colher de sopa rasa + 1 de chá rasa.",
  },
  {
    id: "water-midday",
    action: "water",
    label: "Conferir a água ao meio-dia",
    time: "12:25",
    enabled: true,
    notify: ["Pablo"],
    details: "Conferir o nível e a sujeira; completar ou trocar se necessário.",
  },
  {
    id: "sachet-afternoon",
    action: "sachet",
    label: "Refeição do fim da tarde",
    time: "17:10",
    enabled: true,
    notify: ["Pedro"],
    details: "½ sachê + 8 g de ração seca: 1 colher de sopa rasa + 1 de chá rasa.",
  },
  {
    id: "water-evening",
    action: "water",
    label: "Trocar a água à noite",
    time: "18:00",
    enabled: true,
    notify: ["Ana"],
    details: "Colocar água fresca novamente e lavar o pote se estiver sujo.",
  },
  {
    id: "litter-evening",
    action: "litter",
    label: "Limpar a areia à noite",
    time: "18:15",
    enabled: true,
    notify: ["Pedro"],
    details: "Retirar fezes e torrões pela segunda vez no dia.",
  },
  {
    id: "food-night",
    action: "food",
    label: "Ração antes de dormir",
    time: "21:00",
    enabled: true,
    notify: ["Ana"],
    details: "17 g de ração seca: 2 colheres de sopa rasas + 2 de chá rasas.",
  },
];

export const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
export const parseNumber = (value) => Number(String(value ?? "").replace(",", "."));
export const formatKg = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? `${number.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg`
    : "Não informado";
};
export const formatDate = (value) => {
  if (!value) return "Não informado";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
};
export const formatDateTime = (value) => {
  if (!value) return "Ainda não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};
export const getBrasiliaDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};
export const scheduleDate = (dateKey, time) => new Date(`${dateKey}T${time}:00-03:00`);
export const dryRecommendationByAge = (months) => {
  const age = Number(months || 5);
  if (age <= 1) return 33;
  if (age <= 2) return 47;
  if (age <= 3) return 58;
  if (age <= 4) return 66;
  if (age <= 5) return 69;
  return 70;
};
