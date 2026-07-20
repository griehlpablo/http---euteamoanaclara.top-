import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Download,
  ExternalLink,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { motion } from 'framer-motion';

const STORAGE_KEY = 'financas-casal-lancamentos-v1';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1z5Z3pmTMMVJpX0CSulH4AhnJPoU6zmeKLdJeWPsq6y0/edit';

const CATEGORIES = [
  'Mercado',
  'Delivery',
  'Energéticos',
  'Transporte',
  'Lazer',
  'Compras pessoais',
  'Saúde',
  'Assinaturas',
  'Outros/imprevistos',
];

const ACCOUNTS = [
  'Banco do Brasil — Pablo',
  'Banco do Brasil — Ana',
  'Itaú — Ana',
  'Dinheiro',
  'Outra conta',
];

const PAYMENT_METHODS = ['Pix', 'Débito', 'Crédito', 'Dinheiro', 'Outro'];

const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const emptyForm = () => ({
  date: todayKey(),
  description: '',
  category: 'Mercado',
  person: 'Pablo',
  account: 'Banco do Brasil — Pablo',
  paymentMethod: 'Pix',
  amount: '',
  notes: '',
});

const readEntries = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const parseAmount = (value) => {
  const normalized = String(value || '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function Gastos() {
  const [entries, setEntries] = useState(readEntries);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const currentMonth = todayKey().slice(0, 7);

  const monthEntries = useMemo(
    () => entries.filter((entry) => entry.date?.startsWith(currentMonth)),
    [entries, currentMonth],
  );

  const monthTotal = useMemo(
    () => monthEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    [monthEntries],
  );

  const categoryTotals = useMemo(() => {
    return monthEntries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + Number(entry.amount || 0);
      return acc;
    }, {});
  }, [monthEntries]);

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const updateField = (field, value) => {
    setForm((previous) => {
      const next = { ...previous, [field]: value };
      if (field === 'person') {
        next.account = value === 'Pablo' ? 'Banco do Brasil — Pablo' : 'Banco do Brasil — Ana';
      }
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const amount = parseAmount(form.amount);

    if (!form.description.trim() || amount <= 0) {
      setMessage('Preencha a descrição e um valor maior que zero.');
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
      account: previous.person === 'Pablo' ? 'Banco do Brasil — Pablo' : 'Banco do Brasil — Ana',
    }));
    setMessage(`Registrado: ${entry.description} por ${currency.format(entry.amount)}.`);
  };

  const deleteEntry = (id) => {
    if (!window.confirm('Apagar este lançamento?')) return;
    setEntries((previous) => previous.filter((entry) => entry.id !== id));
  };

  const exportCsv = () => {
    if (!entries.length) {
      setMessage('Ainda não há lançamentos para exportar.');
      return;
    }

    const header = ['Data', 'Descrição', 'Categoria', 'Quem', 'Conta', 'Pagamento', 'Valor', 'Observações'];
    const rows = entries.map((entry) => [
      entry.date,
      entry.description,
      entry.category,
      entry.person,
      entry.account,
      entry.paymentMethod,
      Number(entry.amount || 0).toFixed(2).replace('.', ','),
      entry.notes,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(';'))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gastos-pablo-ana-${todayKey()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Arquivo CSV gerado para importar no Google Planilhas.');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link to="/central" className="p-3 bg-white/70 dark:bg-slate-800/70 rounded-full shadow-md text-rose-500 hover:scale-105 transition-transform">
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-end gap-2">
            Gastos do Casal <WalletCards className="text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registro rápido de compras feitas por Pablo e Ana.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Gasto no mês</p>
          <p className="mt-2 text-3xl font-bold text-rose-500">{currency.format(monthTotal)}</p>
        </div>
        <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Lançamentos</p>
          <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{monthEntries.length}</p>
        </div>
        <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Maior categoria</p>
          <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">{topCategory?.[0] || '—'}</p>
          <p className="text-sm text-slate-500">{topCategory ? currency.format(topCategory[1]) : 'Nenhum gasto ainda'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="rounded-[2rem] bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-6 shadow-xl">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 p-3 text-rose-500"><Plus /></div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">Registrar compra</h2>
              <p className="text-xs text-slate-400">Não informe número de cartão, senha ou dados bancários sensíveis.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Descrição</span>
              <input value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Ex.: Coca-Cola 1 L retornável" className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200" required />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Valor</span>
              <div className="relative">
                <Banknote className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input inputMode="decimal" value={form.amount} onChange={(e) => updateField('amount', e.target.value)} placeholder="0,00" className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-rose-200" required />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Data</span>
              <input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200" required />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Categoria</span>
              <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200">
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Quem pagou</span>
              <select value={form.person} onChange={(e) => updateField('person', e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200">
                <option>Pablo</option>
                <option>Ana</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Conta</span>
              <select value={form.account} onChange={(e) => updateField('account', e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200">
                {ACCOUNTS.map((account) => <option key={account}>{account}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Pagamento</span>
              <select value={form.paymentMethod} onChange={(e) => updateField('paymentMethod', e.target.value)} className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200">
                {PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Observações</span>
              <input value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Opcional" className="w-full rounded-2xl border border-white/70 bg-white/80 dark:bg-slate-900/60 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-200" />
            </label>
          </div>

          {message && <p className="mt-4 rounded-2xl bg-rose-50 dark:bg-slate-900/50 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">{message}</p>}

          <button type="submit" className="mt-5 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-4 font-bold text-white shadow-lg hover:from-rose-600 hover:to-pink-600 transition-all">
            Registrar gasto
          </button>
        </form>

        <div className="space-y-5">
          <div className="rounded-[2rem] bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-5 shadow-xl">
            <h2 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2"><ReceiptText className="text-rose-500" /> Lançamentos recentes</h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">Nenhuma compra registrada neste aparelho.</div>
              ) : entries.slice(0, 20).map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-white dark:border-slate-700 p-4 flex items-start gap-3">
                  <div className="rounded-xl bg-rose-50 dark:bg-slate-800 p-2 text-rose-500"><CalendarDays size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 break-words">{entry.description}</p>
                        <p className="text-xs text-slate-400">{entry.date.split('-').reverse().join('/')} · {entry.category} · {entry.person}</p>
                      </div>
                      <p className="font-bold text-rose-500 whitespace-nowrap">{currency.format(entry.amount)}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{entry.account} · {entry.paymentMethod}</p>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="rounded-full p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Apagar lançamento"><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-800 px-4 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors">
              <Download size={18} /> Exportar CSV
            </button>
            <a href={SHEET_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
              <ExternalLink size={18} /> Abrir planilha
            </a>
          </div>

          <p className="px-2 text-xs leading-relaxed text-slate-400">
            Estes registros ficam salvos somente neste navegador. A exportação gera um arquivo compatível com o Google Planilhas; a sincronização automática será adicionada depois por uma integração protegida.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
