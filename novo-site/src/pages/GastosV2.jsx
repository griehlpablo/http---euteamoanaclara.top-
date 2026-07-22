import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Banknote,
  CalendarDays,
  Camera,
  Download,
  ExternalLink,
  Loader2,
  PiggyBank,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { callGeminiAPI } from "../services/gemini";

const STORAGE_KEY = "financas-casal-lancamentos-v1";
const SHEET_SYNCED_KEY = "financas-casal-google-synced-v1";
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1z5Z3pmTMMVJpX0CSulH4AhnJPoU6zmeKLdJeWPsq6y0/edit";

const REGULAR_CYCLE_LIMIT = 2250;
const REGULAR_DELIVERY_LIMIT = 200;
const RESET_DAY = 5;
const INITIAL_ZERO_START = "2026-07-22";
const INITIAL_ZERO_UNTIL = "2026-08-05";

const EXPENSE_CATEGORIES = [
  "Mercado",
  "Delivery",
  "Energéticos",
  "Transporte",
  "Lazer",
  "Compras pessoais",
  "Saúde",
  "Assinaturas",
  "Outros/imprevistos",
];

const INCOME_CATEGORIES = [
  "Salário",
  "Freelance",
  "Reembolso",
  "Venda",
  "Presente",
  "Benefício",
  "Outras entradas",
];

const ACCOUNTS = [
  "Banco do Brasil — Pablo",
  "Banco do Brasil — Ana",
  "Itaú — Ana",
  "Dinheiro",
  "Outra conta",
];

const PAYMENT_METHODS = [
  "Pix",
  "Transferência",
  "Débito",
  "Crédito",
  "Dinheiro",
  "Depósito",
  "Outro",
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const dateFromKey = (key) => {
  const [year, month, day] = String(key).split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const keyFromDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (key) =>
  String(key || "")
    .split("-")
    .reverse()
    .join("/");

const getRegularCycle = (referenceKey = todayKey()) => {
  const reference = dateFromKey(referenceKey);
  const start = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    RESET_DAY,
    12,
  );
  if (reference.getDate() < RESET_DAY) start.setMonth(start.getMonth() - 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { startKey: keyFromDate(start), endKey: keyFromDate(end) };
};

const getBudgetCycle = (referenceKey = todayKey()) => {
  const regular = getRegularCycle(referenceKey);
  const inInitialZeroWindow =
    referenceKey >= INITIAL_ZERO_START && referenceKey < INITIAL_ZERO_UNTIL;

  if (inInitialZeroWindow) {
    return {
      startKey: INITIAL_ZERO_START,
      endKey: INITIAL_ZERO_UNTIL,
      baseLimit: 0,
      deliveryLimit: 0,
      zeroed: true,
    };
  }

  return {
    ...regular,
    baseLimit: REGULAR_CYCLE_LIMIT,
    deliveryLimit: REGULAR_DELIVERY_LIMIT,
    zeroed: false,
  };
};

const normalizeType = (value) => {
  const normalized = String(value || "").toLocaleLowerCase("pt-BR");
  return normalized.includes("entrada") ||
    normalized.includes("receita") ||
    normalized === "income"
    ? "income"
    : "expense";
};

const normalizeEntry = (entry) => ({
  ...entry,
  type: normalizeType(entry?.type),
  amount: Number(entry?.amount || 0),
});

const readJson = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const readEntries = () => {
  const parsed = readJson(STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
};

const emptyForm = (type = "expense", person = "Pablo") => ({
  type,
  date: todayKey(),
  description: "",
  category: type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0],
  person,
  account: person === "Pablo" ? ACCOUNTS[0] : ACCOUNTS[1],
  paymentMethod: "Pix",
  amount: "",
  notes: "",
});

const parseAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "")
    .trim()
    .replace(/[^\d,.-]/g, "");
  if (!raw) return 0;

  const commaIndex = raw.lastIndexOf(",");
  const dotIndex = raw.lastIndexOf(".");
  let normalized = raw;

  if (commaIndex >= 0 && dotIndex >= 0) {
    normalized =
      commaIndex > dotIndex
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (commaIndex >= 0) {
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else if ((raw.match(/\./g) || []).length > 1) {
    normalized = raw.replace(/\./g, "");
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

const extractExplicitAmount = (text) => {
  const source = String(text || "");
  const match = source.match(
    /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+[.,]\d{1,2})(?!\d)/i,
  );
  return match ? parseAmount(match[1]) : 0;
};

const extractJson = (value) => {
  const sanitized = String(value || "")
    .replace(/```json|```/gi, "")
    .trim();
  const start = sanitized.indexOf("{");
  const end = sanitized.lastIndexOf("}");
  if (start < 0 || end < start)
    throw new Error("A resposta não contém dados válidos.");
  return JSON.parse(sanitized.slice(start, end + 1));
};

const normalizeChoice = (value, choices, fallback) => {
  const normalized = String(value || "")
    .trim()
    .toLocaleLowerCase("pt-BR");
  return (
    choices.find(
      (choice) => choice.toLocaleLowerCase("pt-BR") === normalized,
    ) || fallback
  );
};

const isValidDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
  });

const readSynced = () => {
  const value = readJson(SHEET_SYNCED_KEY, []);
  return new Set(Array.isArray(value) ? value : []);
};

const markAsSynced = (id) => {
  const synced = readSynced();
  synced.add(id);
  localStorage.setItem(SHEET_SYNCED_KEY, JSON.stringify([...synced]));
};

const unmarkAsSynced = (id) => {
  const synced = readSynced();
  synced.delete(id);
  localStorage.setItem(SHEET_SYNCED_KEY, JSON.stringify([...synced]));
};

const isMarkedAsSynced = (id) => readSynced().has(id);

const syncEntry = async (entry) => {
  const isIncome = entry.type === "income";
  const response = await fetch("/api/gastos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "appendExpense",
      expense: {
        id: entry.id,
        date: entry.date,
        description: entry.description,
        category: entry.category,
        type: isIncome ? "Entrada" : "Gasto",
        person: entry.person,
        sourceAccount: isIncome ? "Origem externa" : entry.account,
        destinationAccount: isIncome ? entry.account : "",
        paymentMethod: entry.paymentMethod,
        amount: Number(entry.amount || 0),
        notes: entry.notes || "",
        createdAt: entry.createdAt,
      },
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Erro HTTP ${response.status}`);
  }
  markAsSynced(entry.id);
  return result;
};

const deleteSyncedEntry = async (id) => {
  const response = await fetch("/api/gastos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteExpense", expenseId: id }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Erro HTTP ${response.status}`);
  }
};

export default function GastosV2() {
  const [entries, setEntries] = useState(readEntries);
  const [form, setForm] = useState(() => emptyForm());
  const [message, setMessage] = useState("");
  const [quickEntry, setQuickEntry] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const receiptInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === STORAGE_KEY) setEntries(readEntries());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    let stopped = false;
    const retryPending = async () => {
      const pending = readEntries().filter(
        (entry) => entry.id && !isMarkedAsSynced(entry.id),
      );
      for (const entry of pending.slice(-8)) {
        if (stopped) return;
        try {
          await syncEntry(entry);
        } catch {
          return;
        }
      }
    };
    retryPending();
    const interval = window.setInterval(retryPending, 30000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, []);

  const today = todayKey();
  const cycle = useMemo(() => getBudgetCycle(today), [today]);

  const cycleEntries = useMemo(
    () =>
      entries.filter(
        (entry) => entry.date >= cycle.startKey && entry.date < cycle.endKey,
      ),
    [entries, cycle.startKey, cycle.endKey],
  );

  const expenseEntries = useMemo(
    () => cycleEntries.filter((entry) => entry.type !== "income"),
    [cycleEntries],
  );
  const incomeEntries = useMemo(
    () => cycleEntries.filter((entry) => entry.type === "income"),
    [cycleEntries],
  );

  const totalExpenses = expenseEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0,
  );
  const totalIncome = incomeEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0),
    0,
  );
  const availableBalance = cycle.baseLimit + totalIncome - totalExpenses;

  const expenseCategoryTotals = expenseEntries.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + Number(entry.amount || 0);
    return acc;
  }, {});
  const topCategory = Object.entries(expenseCategoryTotals).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const deliverySpent = expenseCategoryTotals.Delivery || 0;
  const deliveryAvailable = cycle.deliveryLimit - deliverySpent;
  const availableFunds = cycle.baseLimit + totalIncome;
  const usedPercentage =
    availableFunds > 0
      ? Math.min(100, Math.max(0, (totalExpenses / availableFunds) * 100))
      : totalExpenses > 0
        ? 100
        : 0;

  const activeCategories =
    form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const changeType = (type) => {
    setForm((previous) => ({
      ...emptyForm(type, previous.person),
      date: previous.date || todayKey(),
    }));
    setMessage("");
  };

  const updateField = (field, value) => {
    setForm((previous) => {
      const next = { ...previous, [field]: value };
      if (field === "person") {
        next.account = value === "Pablo" ? ACCOUNTS[0] : ACCOUNTS[1];
      }
      return next;
    });
  };

  const interpretEntry = async () => {
    if (!quickEntry.trim() && !receiptFile) {
      setMessage("Escreva o lançamento ou selecione uma foto do comprovante.");
      return;
    }

    setIsInterpreting(true);
    setMessage("");
    try {
      const prompt = [
        `Data de hoje: ${todayKey()}.`,
        `Tipo inicialmente selecionado: ${form.type === "income" ? "entrada" : "gasto"}.`,
        `Texto informado: ${quickEntry.trim() || "nenhum texto adicional"}.`,
        `Categorias de gastos: ${EXPENSE_CATEGORIES.join(", ")}.`,
        `Categorias de entradas: ${INCOME_CATEGORIES.join(", ")}.`,
        `Contas permitidas: ${ACCOUNTS.join(", ")}.`,
        `Formas permitidas: ${PAYMENT_METHODS.join(", ")}.`,
        'Retorne somente JSON no formato: {"type":"expense ou income","description":"","amount":0,"date":"AAAA-MM-DD","category":"","person":"Pablo ou Ana","account":"","paymentMethod":"","notes":""}.',
        "Não invente valor. Quando não for possível identificar, use 0.",
      ].join(" ");

      let base64 = null;
      let mimeType = null;
      if (receiptFile) {
        base64 = await fileToBase64(receiptFile);
        mimeType = receiptFile.type;
      }

      const result = await callGeminiAPI([], prompt, base64, mimeType, {
        includeRuntimeContext: false,
        systemInstruction:
          "Extraia lançamentos financeiros domésticos brasileiros. Diferencie entrada de dinheiro e gasto. Responda somente com JSON válido.",
      });
      const parsed = extractJson(result.text);
      const type = normalizeType(parsed.type || form.type);
      const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const person = normalizeChoice(parsed.person, ["Pablo", "Ana"], form.person);
      const defaultAccount = person === "Pablo" ? ACCOUNTS[0] : ACCOUNTS[1];
      const amount = extractExplicitAmount(quickEntry) || parseAmount(parsed.amount);

      setForm({
        type,
        date: isValidDateKey(parsed.date) ? parsed.date : todayKey(),
        description: String(parsed.description || quickEntry || "Lançamento").trim(),
        category: normalizeChoice(parsed.category, categories, categories[0]),
        person,
        account: normalizeChoice(parsed.account, ACCOUNTS, defaultAccount),
        paymentMethod: normalizeChoice(
          parsed.paymentMethod,
          PAYMENT_METHODS,
          "Pix",
        ),
        amount: amount > 0 ? amount.toFixed(2).replace(".", ",") : "",
        notes: String(parsed.notes || "").trim(),
      });
      setMessage(
        amount > 0
          ? "Preenchi o lançamento. Confira os campos antes de salvar."
          : "Preenchi parte do lançamento, mas você precisa informar o valor.",
      );
      setReceiptFile(null);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
      window.setTimeout(
        () => document.getElementById("lancamento-form")?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } catch (error) {
      setMessage(`Não consegui interpretar: ${error?.message || String(error)}`);
    } finally {
      setIsInterpreting(false);
    }
  };

  const analyzeCycle = async () => {
    if (!cycleEntries.length) {
      setAnalysis("Registre alguma entrada ou gasto para eu analisar este ciclo.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysis("");
    try {
      const snapshot = {
        cycleStart: cycle.startKey,
        nextReset: cycle.endKey,
        baseLimit: cycle.baseLimit,
        limitTemporarilyZeroed: cycle.zeroed,
        income: Number(totalIncome.toFixed(2)),
        expenses: Number(totalExpenses.toFixed(2)),
        available: Number(availableBalance.toFixed(2)),
        deliveryAvailable: Number(deliveryAvailable.toFixed(2)),
        entries: cycleEntries.slice(0, 15).map((entry) => ({
          type: entry.type,
          date: entry.date,
          description: entry.description,
          category: entry.category,
          amount: entry.amount,
        })),
      };
      const result = await callGeminiAPI(
        [],
        `Analise este ciclo financeiro do casal: ${JSON.stringify(snapshot)}. Explique a situação, o principal cuidado e uma ação prática para hoje. Use somente os valores enviados e no máximo 150 palavras.`,
        null,
        null,
        {
          includeRuntimeContext: false,
          systemInstruction:
            "Você é um assistente de organização financeira doméstica. Seja direto, acolhedor e não recomende empréstimos ou investimentos.",
        },
      );
      setAnalysis(result.text);
    } catch (error) {
      setAnalysis(`Não consegui analisar agora: ${error?.message || String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const amount = parseAmount(form.amount);
    if (!form.description.trim() || amount <= 0) {
      setMessage("Preencha a descrição e um valor maior que zero.");
      return;
    }

    const entry = normalizeEntry({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      ...form,
      description: form.description.trim(),
      amount,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    });

    setEntries((previous) => [entry, ...previous]);
    setForm(emptyForm(form.type, form.person));
    setQuickEntry("");
    setIsSaving(true);
    const label = entry.type === "income" ? "Entrada" : "Gasto";
    setMessage(`${label} registrado: ${entry.description} — ${currency.format(entry.amount)}.`);

    try {
      await syncEntry(entry);
      setMessage(`${label} registrado e sincronizado: ${entry.description} — ${currency.format(entry.amount)}.`);
    } catch {
      setMessage(`${label} salvo neste aparelho. A sincronização continuará tentando automaticamente.`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (entry) => {
    const synced = isMarkedAsSynced(entry.id);
    const confirmation = synced
      ? "Apagar este lançamento do site e também da planilha?"
      : "Apagar este lançamento deste aparelho?";
    if (!window.confirm(confirmation)) return;

    setDeletingId(entry.id);
    setMessage("");
    try {
      if (synced) await deleteSyncedEntry(entry.id);
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      unmarkAsSynced(entry.id);
      setMessage(`Lançamento apagado: ${entry.description}.`);
    } catch (error) {
      setMessage(`Não consegui apagar da planilha: ${error?.message || String(error)}`);
    } finally {
      setDeletingId("");
    }
  };

  const exportCsv = () => {
    if (!entries.length) {
      setMessage("Ainda não há lançamentos para exportar.");
      return;
    }
    const header = [
      "Data",
      "Tipo",
      "Descrição",
      "Categoria",
      "Quem",
      "Conta",
      "Forma",
      "Valor",
      "Observações",
    ];
    const rows = entries.map((entry) => [
      entry.date,
      entry.type === "income" ? "Entrada" : "Gasto",
      entry.description,
      entry.category,
      entry.person,
      entry.account,
      entry.paymentMethod,
      Number(entry.amount || 0).toFixed(2).replace(".", ","),
      entry.notes,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `financas-pablo-ana-${todayKey()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Arquivo CSV gerado.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl py-6"
    >
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          to="/central"
          className="rounded-full bg-white/70 p-3 text-rose-500 shadow-md transition-transform hover:scale-105 dark:bg-slate-800/70"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <h1 className="flex items-center justify-end gap-2 font-serif text-3xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
            Finanças do Casal <WalletCards className="text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Entradas, gastos e saldo com renovação todo dia 5.
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50/90 via-white/80 to-rose-50/90 p-5 shadow-xl dark:border-violet-900/50 dark:from-slate-800/90 dark:via-slate-900/80 dark:to-violet-950/60">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                <Sparkles />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Assistente financeiro
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ele identifica se é entrada ou gasto e preenche o formulário.
                </p>
              </div>
            </div>
            <textarea
              value={quickEntry}
              onChange={(event) => setQuickEntry(event.target.value)}
              placeholder="Ex.: Recebi R$ 300 de reembolso no Pix da Ana."
              className="min-h-24 w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
            />
            {receiptFile && (
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                <span className="truncate">{receiptFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    if (receiptInputRef.current) receiptInputRef.current.value = "";
                  }}
                  className="rounded-full p-1 text-slate-400 hover:text-red-500"
                >
                  <X size={17} />
                </button>
              </div>
            )}
            <input
              ref={receiptInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={interpretEntry}
                disabled={isInterpreting}
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isInterpreting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Preencher lançamento
              </button>
              <button
                type="button"
                onClick={() => receiptInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
              >
                <Camera size={18} /> Ler comprovante
              </button>
              <button
                type="button"
                onClick={analyzeCycle}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <PiggyBank size={18} />}
                Analisar ciclo
              </button>
            </div>
          </div>

          <div className="w-full rounded-3xl bg-white/75 p-4 text-sm shadow-sm dark:bg-slate-950/50 lg:w-80">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500">
              Ciclo atual
            </p>
            <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between gap-3">
                <span>Começou</span><strong>{formatDate(cycle.startKey)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Próximo reset</span><strong>{formatDate(cycle.endKey)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Limite-base</span><strong>{currency.format(cycle.baseLimit)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Entradas somadas</span><strong className="text-emerald-600">{currency.format(totalIncome)}</strong>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full ${usedPercentage >= 90 ? "bg-red-500" : usedPercentage >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {cycle.zeroed
                ? "O limite foi zerado agora e volta automaticamente em 05/08. Depois disso, renova todo dia 5."
                : `${usedPercentage.toFixed(0)}% dos recursos deste ciclo foram usados.`}
            </p>
          </div>
        </div>

        {(analysis || isAnalyzing) && (
          <div className="mt-4 whitespace-pre-wrap rounded-3xl border border-violet-100 bg-white/80 p-5 text-sm text-slate-700 dark:border-violet-900/50 dark:bg-slate-950/60 dark:text-slate-200">
            {isAnalyzing ? "Analisando o ciclo..." : analysis}
          </div>
        )}
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Entradas no ciclo" value={currency.format(totalIncome)} tone="text-emerald-600" />
        <SummaryCard label="Gastos no ciclo" value={currency.format(totalExpenses)} tone="text-rose-500" />
        <SummaryCard
          label="Saldo disponível"
          value={currency.format(availableBalance)}
          tone={availableBalance < 0 ? "text-red-500" : "text-emerald-600"}
        />
        <SummaryCard
          label="Delivery disponível"
          value={currency.format(deliveryAvailable)}
          tone={deliveryAvailable < 0 ? "text-red-500" : "text-slate-800 dark:text-slate-100"}
          detail={topCategory ? `Maior gasto: ${topCategory[0]}` : "Nenhum gasto ainda"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <form
          id="lancamento-form"
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className={`rounded-2xl p-3 ${form.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"}`}>
              <Plus />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
                Registrar lançamento
              </h2>
              <p className="text-xs text-slate-400">Escolha entre saída e entrada de dinheiro.</p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-900/70">
            <button
              type="button"
              onClick={() => changeType("expense")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${form.type === "expense" ? "bg-white text-rose-600 shadow-sm dark:bg-slate-800" : "text-slate-500"}`}
            >
              <ArrowDownCircle size={19} /> Saída / gasto
            </button>
            <button
              type="button"
              onClick={() => changeType("income")}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${form.type === "income" ? "bg-white text-emerald-600 shadow-sm dark:bg-slate-800" : "text-slate-500"}`}
            >
              <ArrowUpCircle size={19} /> Entrada de dinheiro
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Descrição" full>
              <input
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder={form.type === "income" ? "Ex.: Salário ou reembolso" : "Ex.: Compra no mercado"}
                className="input-field"
                required
              />
            </Field>
            <Field label="Valor">
              <div className="relative">
                <Banknote className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  placeholder="0,00"
                  className="input-field pl-12"
                  required
                />
              </div>
            </Field>
            <Field label="Data">
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                className="input-field"
                required
              />
            </Field>
            <Field label="Categoria">
              <select
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className="input-field"
              >
                {activeCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </Field>
            <Field label={form.type === "income" ? "Quem recebeu" : "Quem pagou"}>
              <select
                value={form.person}
                onChange={(event) => updateField("person", event.target.value)}
                className="input-field"
              >
                <option>Pablo</option><option>Ana</option>
              </select>
            </Field>
            <Field label={form.type === "income" ? "Conta de entrada" : "Conta de saída"}>
              <select
                value={form.account}
                onChange={(event) => updateField("account", event.target.value)}
                className="input-field"
              >
                {ACCOUNTS.map((account) => <option key={account}>{account}</option>)}
              </select>
            </Field>
            <Field label="Forma">
              <select
                value={form.paymentMethod}
                onChange={(event) => updateField("paymentMethod", event.target.value)}
                className="input-field"
              >
                {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
              </select>
            </Field>
            <Field label="Observações" full>
              <input
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Opcional"
                className="input-field"
              />
            </Field>
          </div>

          {message && (
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-bold text-white shadow-lg disabled:opacity-60 ${form.type === "income" ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-rose-500 to-pink-500"}`}
          >
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            {form.type === "income" ? "Registrar entrada" : "Registrar gasto"}
          </button>
        </form>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70">
            <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-bold text-slate-800 dark:text-slate-100">
              <ReceiptText className="text-rose-500" /> Lançamentos recentes
            </h2>
            <div className="max-h-[550px] space-y-3 overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
                  Nenhum lançamento registrado.
                </div>
              ) : (
                entries.slice(0, 30).map((entry) => {
                  const income = entry.type === "income";
                  return (
                    <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                      <div className={`rounded-xl p-2 ${income ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : "bg-rose-50 text-rose-500 dark:bg-slate-800"}`}>
                        {income ? <ArrowUpCircle size={18} /> : <CalendarDays size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="break-words font-bold text-slate-800 dark:text-slate-100">{entry.description}</p>
                            <p className="text-xs text-slate-400">
                              {formatDate(entry.date)} · {entry.category} · {entry.person}
                            </p>
                          </div>
                          <p className={`whitespace-nowrap font-bold ${income ? "text-emerald-600" : "text-rose-500"}`}>
                            {income ? "+" : "−"} {currency.format(entry.amount)}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{entry.account} · {entry.paymentMethod}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEntry(entry)}
                        disabled={deletingId === entry.id}
                        className="rounded-full p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                      >
                        {deletingId === entry.id ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-bold text-white"
            >
              <Download size={18} /> Exportar CSV
            </button>
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
            >
              <ExternalLink size={18} /> Abrir planilha
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .input-field { width: 100%; border-radius: 1rem; border: 1px solid rgba(255,255,255,.7); background: rgba(255,255,255,.8); padding: .75rem 1rem; outline: none; color: #334155; }
        .input-field:focus { box-shadow: 0 0 0 2px rgba(251,113,133,.28); }
        .dark .input-field { border-color: #334155; background: rgba(15,23,42,.65); color: #e2e8f0; }
      `}</style>
    </motion.div>
  );
}

function Field({ label, full = false, children }) {
  return (
    <label className={full ? "block sm:col-span-2" : "block"}>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryCard({ label, value, tone, detail = "" }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}
