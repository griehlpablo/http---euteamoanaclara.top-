import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
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
import ReactMarkdown from "react-markdown";
import { callGeminiAPI } from "../services/gemini";

const STORAGE_KEY = "financas-casal-lancamentos-v1";
const SHEET_SYNCED_KEY = "financas-casal-google-synced-v1";
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1z5Z3pmTMMVJpX0CSulH4AhnJPoU6zmeKLdJeWPsq6y0/edit";
const MONTHLY_SPENDING_LIMIT = 2250;
const MONTHLY_SAVINGS_GOAL = 700;
const DELIVERY_LIMIT = 200;

const CATEGORIES = [
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

const ACCOUNTS = [
  "Banco do Brasil — Pablo",
  "Banco do Brasil — Ana",
  "Itaú — Ana",
  "Dinheiro",
  "Outra conta",
];

const PAYMENT_METHODS = ["Pix", "Débito", "Crédito", "Dinheiro", "Outro"];

const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const emptyForm = () => ({
  date: todayKey(),
  description: "",
  category: "Mercado",
  person: "Pablo",
  account: "Banco do Brasil — Pablo",
  paymentMethod: "Pix",
  amount: "",
  notes: "",
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
  return Array.isArray(parsed) ? parsed : [];
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const parseAmount = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

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
  } else if (dotIndex >= 0) {
    const decimalPlaces = raw.length - dotIndex - 1;
    normalized = decimalPlaces === 3 ? raw.replace(".", "") : raw;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

const extractExplicitAmount = (text) => {
  const source = String(text || "");
  const decimalMatch = source.match(
    /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{1,2}|\d+[.,]\d{1,2})(?!\d)/i,
  );
  if (decimalMatch) return parseAmount(decimalMatch[1]);

  const reaisMatch = source.match(/\b(\d+(?:\.\d{3})*)\s*(?:reais?|conto)\b/i);
  return reaisMatch ? parseAmount(reaisMatch[1]) : 0;
};

const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
  });

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

const isValidDateKey = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const markAsSynced = (id) => {
  const synced = readJson(SHEET_SYNCED_KEY, []);
  const next = new Set(Array.isArray(synced) ? synced : []);
  next.add(id);
  localStorage.setItem(SHEET_SYNCED_KEY, JSON.stringify([...next]));
};

const syncExpense = async (entry) => {
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
        type: "Gasto",
        person: entry.person,
        sourceAccount: entry.account,
        destinationAccount: "",
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

export default function Gastos() {
  const [entries, setEntries] = useState(readEntries);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [quickEntry, setQuickEntry] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const currentMonth = todayKey().slice(0, 7);

  const monthEntries = useMemo(
    () => entries.filter((entry) => entry.date?.startsWith(currentMonth)),
    [entries, currentMonth],
  );

  const monthTotal = useMemo(
    () =>
      monthEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    [monthEntries],
  );

  const categoryTotals = useMemo(
    () =>
      monthEntries.reduce((acc, entry) => {
        acc[entry.category] =
          (acc[entry.category] || 0) + Number(entry.amount || 0);
        return acc;
      }, {}),
    [monthEntries],
  );

  const personTotals = useMemo(
    () =>
      monthEntries.reduce((acc, entry) => {
        acc[entry.person] =
          (acc[entry.person] || 0) + Number(entry.amount || 0);
        return acc;
      }, {}),
    [monthEntries],
  );

  const topCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const remainingBudget = MONTHLY_SPENDING_LIMIT - monthTotal;
  const deliveryTotal = categoryTotals.Delivery || 0;
  const deliveryRemaining = DELIVERY_LIMIT - deliveryTotal;
  const budgetPercentage = Math.min(
    100,
    Math.max(0, (monthTotal / MONTHLY_SPENDING_LIMIT) * 100),
  );

  const updateField = (field, value) => {
    setForm((previous) => {
      const next = { ...previous, [field]: value };
      if (field === "person") {
        next.account =
          value === "Pablo"
            ? "Banco do Brasil — Pablo"
            : "Banco do Brasil — Ana";
      }
      return next;
    });
  };

  const interpretExpense = async () => {
    if (!quickEntry.trim() && !receiptFile) {
      setMessage("Escreva o gasto ou selecione uma foto do comprovante.");
      return;
    }

    setIsInterpreting(true);
    setMessage("");

    try {
      const defaultPerson = form.person;
      const prompt = [
        `Data de hoje: ${todayKey()}.`,
        `Texto informado: ${quickEntry.trim() || "nenhum texto adicional"}.`,
        `Pessoa padrão quando não estiver claro: ${defaultPerson}.`,
        `Categorias permitidas: ${CATEGORIES.join(", ")}.`,
        `Contas permitidas: ${ACCOUNTS.join(", ")}.`,
        `Pagamentos permitidos: ${PAYMENT_METHODS.join(", ")}.`,
        "Interprete o gasto ou comprovante e retorne somente JSON.",
        'Formato obrigatório: {"description":"","amount":0,"date":"AAAA-MM-DD","category":"","person":"Pablo ou Ana","account":"","paymentMethod":"","notes":""}.',
        "Não invente valor. Quando não for possível identificar o valor, use 0.",
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
          "Extraia dados de gastos domésticos brasileiros. Responda somente com JSON válido, sem explicações e sem bloco de código.",
      });
      const parsed = extractJson(result.text);
      const person = normalizeChoice(
        parsed.person,
        ["Pablo", "Ana"],
        defaultPerson,
      );
      const defaultAccount =
        person === "Pablo"
          ? "Banco do Brasil — Pablo"
          : "Banco do Brasil — Ana";
      const amountFromText = extractExplicitAmount(quickEntry);
      const amount = amountFromText || parseAmount(parsed.amount);

      setForm({
        date: isValidDateKey(parsed.date) ? parsed.date : todayKey(),
        description: String(
          parsed.description || quickEntry || "Compra",
        ).trim(),
        category: normalizeChoice(
          parsed.category,
          CATEGORIES,
          "Outros/imprevistos",
        ),
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
          ? "Preenchi o lançamento. Confira os campos e clique em Registrar gasto."
          : "Consegui preencher parte do lançamento, mas você precisa informar o valor.",
      );
      setReceiptFile(null);
      if (receiptInputRef.current) receiptInputRef.current.value = "";
      window.setTimeout(
        () =>
          document
            .getElementById("gasto-form")
            ?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
    } catch (error) {
      setMessage(
        `Não consegui interpretar esse gasto: ${error?.message || String(error)}`,
      );
    } finally {
      setIsInterpreting(false);
    }
  };

  const analyzeMonth = async () => {
    if (!monthEntries.length) {
      setAnalysis(
        "Registre alguns gastos deste mês para eu conseguir fazer uma análise útil.",
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysis("");

    try {
      const snapshot = {
        month: currentMonth,
        totalSpent: Number(monthTotal.toFixed(2)),
        monthlyLimit: MONTHLY_SPENDING_LIMIT,
        remainingBudget: Number(remainingBudget.toFixed(2)),
        savingsGoal: MONTHLY_SAVINGS_GOAL,
        deliverySpent: Number(deliveryTotal.toFixed(2)),
        deliveryLimit: DELIVERY_LIMIT,
        entriesCount: monthEntries.length,
        byCategory: Object.fromEntries(
          Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, total]) => [category, Number(total.toFixed(2))]),
        ),
        byPerson: Object.fromEntries(
          Object.entries(personTotals).map(([person, total]) => [
            person,
            Number(total.toFixed(2)),
          ]),
        ),
        recentEntries: monthEntries.slice(0, 12).map((entry) => ({
          date: entry.date,
          description: entry.description,
          category: entry.category,
          person: entry.person,
          amount: Number(entry.amount || 0),
        })),
      };

      const result = await callGeminiAPI(
        [],
        `Analise este resumo financeiro do casal: ${JSON.stringify(snapshot)}. Responda em português brasileiro com: situação do mês, principal ponto de atenção, uma economia prática para hoje e uma conclusão curta. Use apenas os números enviados.`,
        null,
        null,
        {
          includeRuntimeContext: false,
          systemInstruction:
            "Você é um assistente de organização financeira doméstica. Seja direto, acolhedor e cuidadoso. Não invente valores, não dê sermão e não recomende empréstimos ou investimentos. Use no máximo 180 palavras.",
        },
      );
      setAnalysis(result.text);
    } catch (error) {
      setAnalysis(
        `Não consegui analisar o mês agora: ${error?.message || String(error)}`,
      );
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

    const entry = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      date: form.date || todayKey(),
      description: form.description.trim(),
      category: form.category,
      person: form.person,
      account: form.account,
      paymentMethod: form.paymentMethod,
      amount,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setEntries((previous) => [entry, ...previous]);
    setForm((previous) => ({
      ...emptyForm(),
      person: previous.person,
      account:
        previous.person === "Pablo"
          ? "Banco do Brasil — Pablo"
          : "Banco do Brasil — Ana",
    }));
    setQuickEntry("");
    setIsSaving(true);
    setMessage(
      `Registrado: ${entry.description} por ${currency.format(entry.amount)}.`,
    );

    try {
      await syncExpense(entry);
      setMessage(
        `Registrado e sincronizado na planilha: ${entry.description} por ${currency.format(entry.amount)}.`,
      );
    } catch {
      setMessage(
        `Registrado neste aparelho. A sincronização com a planilha continuará tentando automaticamente.`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = (id) => {
    if (!window.confirm("Apagar este lançamento deste aparelho?")) return;
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
    setMessage(
      "Lançamento removido deste aparelho. A exclusão não altera uma linha já enviada à planilha.",
    );
  };

  const exportCsv = () => {
    if (!entries.length) {
      setMessage("Ainda não há lançamentos para exportar.");
      return;
    }

    const header = [
      "Data",
      "Descrição",
      "Categoria",
      "Quem",
      "Conta",
      "Pagamento",
      "Valor",
      "Observações",
    ];
    const rows = entries.map((entry) => [
      entry.date,
      entry.description,
      entry.category,
      entry.person,
      entry.account,
      entry.paymentMethod,
      Number(entry.amount || 0)
        .toFixed(2)
        .replace(".", ","),
      entry.notes,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `gastos-pablo-ana-${todayKey()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Arquivo CSV gerado para importar no Google Planilhas.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto py-6"
    >
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          to="/central"
          className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-full shadow-md text-rose-500 hover:scale-105 transition-transform"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-end gap-2">
            Gastos do Casal <WalletCards className="text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registro, análise e organização das compras de Pablo e Ana.
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50/90 via-white/80 to-rose-50/90 p-5 shadow-xl dark:border-violet-900/50 dark:from-slate-800/90 dark:via-slate-900/80 dark:to-violet-950/60">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
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
                  Escreva do seu jeito ou envie uma foto. O formulário será
                  preenchido para você conferir.
                </p>
              </div>
            </div>

            <textarea
              value={quickEntry}
              onChange={(event) => setQuickEntry(event.target.value)}
              placeholder="Ex.: Paguei R$ 47,80 no mercado pelo Pix do Banco do Brasil."
              className="min-h-24 w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
            />

            {receiptFile && (
              <div className="mt-2 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                <span className="truncate">{receiptFile.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    if (receiptInputRef.current)
                      receiptInputRef.current.value = "";
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
              onChange={(event) =>
                setReceiptFile(event.target.files?.[0] || null)
              }
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={interpretExpense}
                disabled={isInterpreting}
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {isInterpreting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
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
                onClick={analyzeMonth}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <PiggyBank size={18} />
                )}
                Analisar o mês
              </button>
            </div>
          </div>

          <div className="w-full rounded-3xl bg-white/75 p-4 text-sm shadow-sm dark:bg-slate-950/50 lg:w-80">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500">
              Metas usadas na análise
            </p>
            <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between gap-3">
                <span>Limite mensal</span>
                <strong>{currency.format(MONTHLY_SPENDING_LIMIT)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Meta de economia</span>
                <strong>{currency.format(MONTHLY_SAVINGS_GOAL)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Delivery</span>
                <strong>{currency.format(DELIVERY_LIMIT)}</strong>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={`h-full rounded-full ${budgetPercentage >= 90 ? "bg-red-500" : budgetPercentage >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {budgetPercentage.toFixed(0)}% do limite mensal utilizado.
            </p>
          </div>
        </div>

        {(analysis || isAnalyzing) && (
          <div className="mt-4 rounded-3xl border border-violet-100 bg-white/80 p-5 text-sm text-slate-700 dark:border-violet-900/50 dark:bg-slate-950/60 dark:text-slate-200">
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-violet-500">
                <Loader2 size={18} className="animate-spin" /> Analisando os
                lançamentos deste mês...
              </div>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Gasto no mês
          </p>
          <p className="mt-2 text-3xl font-bold text-rose-500">
            {currency.format(monthTotal)}
          </p>
        </div>
        <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Restante do limite
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${remainingBudget < 0 ? "text-red-500" : "text-emerald-600"}`}
          >
            {currency.format(remainingBudget)}
          </p>
        </div>
        <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Delivery disponível
          </p>
          <p
            className={`mt-2 text-2xl font-bold ${deliveryRemaining < 0 ? "text-red-500" : "text-slate-800 dark:text-slate-100"}`}
          >
            {currency.format(deliveryRemaining)}
          </p>
        </div>
        <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Maior categoria
          </p>
          <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
            {topCategory?.[0] || "—"}
          </p>
          <p className="text-sm text-slate-500">
            {topCategory
              ? currency.format(topCategory[1])
              : "Nenhum gasto ainda"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          id="gasto-form"
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-6 shadow-xl"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-500">
              <Plus />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
                Registrar compra
              </h2>
              <p className="text-xs text-slate-400">
                Confira os campos antes de salvar. Não informe cartão, senha ou
                dados bancários sensíveis.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Descrição
              </span>
              <input
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                placeholder="Ex.: Coca-Cola 1 L retornável"
                className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Valor
              </span>
              <div className="relative">
                <Banknote className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) =>
                    updateField("amount", event.target.value)
                  }
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-rose-200"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Data
              </span>
              <input
                type="date"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Categoria
              </span>
              <select
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
              >
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Quem pagou
              </span>
              <select
                value={form.person}
                onChange={(event) => updateField("person", event.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
              >
                <option>Pablo</option>
                <option>Ana</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Conta
              </span>
              <select
                value={form.account}
                onChange={(event) => updateField("account", event.target.value)}
                className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
              >
                {ACCOUNTS.map((account) => (
                  <option key={account}>{account}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Pagamento
              </span>
              <select
                value={form.paymentMethod}
                onChange={(event) =>
                  updateField("paymentMethod", event.target.value)
                }
                className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Observações
              </span>
              <input
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Opcional"
                className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>
          </div>

          {message && (
            <p className="mt-4 rounded-2xl bg-rose-50 dark:bg-slate-900/50 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4 font-bold text-white shadow-lg hover:from-rose-600 hover:to-pink-600 disabled:opacity-60 transition-all"
          >
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            Registrar gasto
          </button>
        </form>

        <div className="space-y-5">
          <div className="rounded-[2rem] bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-xl">
            <h2 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <ReceiptText className="text-rose-500" /> Lançamentos recentes
            </h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
                  Nenhuma compra registrada neste aparelho.
                </div>
              ) : (
                entries.slice(0, 20).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-white dark:border-slate-700 p-4 flex items-start gap-3"
                  >
                    <div className="rounded-xl bg-rose-50 dark:bg-slate-800 p-2 text-rose-500">
                      <CalendarDays size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100 break-words">
                            {entry.description}
                          </p>
                          <p className="text-xs text-slate-400">
                            {entry.date.split("-").reverse().join("/")} ·{" "}
                            {entry.category} · {entry.person}
                          </p>
                        </div>
                        <p className="font-bold text-rose-500 whitespace-nowrap">
                          {currency.format(entry.amount)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {entry.account} · {entry.paymentMethod}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="rounded-full p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Apagar lançamento"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors"
            >
              <Download size={18} /> Exportar CSV
            </button>
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <ExternalLink size={18} /> Abrir planilha
            </a>
          </div>

          <p className="px-2 text-xs leading-relaxed text-slate-400">
            Os lançamentos ficam disponíveis neste navegador e são enviados à
            planilha quando a sincronização está configurada. A interpretação
            automática apenas preenche o formulário; nada é salvo sem sua
            confirmação.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
