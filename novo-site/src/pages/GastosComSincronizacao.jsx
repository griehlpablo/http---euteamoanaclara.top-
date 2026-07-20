import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CloudOff, RefreshCw, Settings2, Sheet, Wifi } from 'lucide-react';
import Gastos from './Gastos';

const ENTRIES_KEY = 'financas-casal-lancamentos-v1';
const CONFIG_KEY = 'financas-casal-google-sync-config-v1';
const SYNCED_KEY = 'financas-casal-google-synced-v1';

const readJson = (key, fallback) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const readEntries = () => {
  const entries = readJson(ENTRIES_KEY, []);
  return Array.isArray(entries) ? entries : [];
};

const readSyncedIds = () => {
  const ids = readJson(SYNCED_KEY, []);
  return new Set(Array.isArray(ids) ? ids : []);
};

const cleanEndpoint = (value) => String(value || '').trim().replace(/\?.*$/, '');

async function sendExpense(config, entry) {
  const payload = {
    action: 'appendExpense',
    token: config.token,
    expense: {
      id: entry.id,
      date: entry.date,
      description: entry.description,
      category: entry.category,
      type: 'Gasto',
      person: entry.person,
      sourceAccount: entry.account,
      destinationAccount: '',
      paymentMethod: entry.paymentMethod,
      amount: Number(entry.amount || 0),
      notes: entry.notes || '',
      createdAt: entry.createdAt || new Date().toISOString(),
    },
  };

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Google respondeu com status ${response.status}.`);
    }

    const text = await response.text();
    const result = text ? JSON.parse(text) : { ok: true };
    if (!result.ok) throw new Error(result.error || 'A planilha recusou o lançamento.');
    return { confirmed: true, row: result.row };
  } catch (error) {
    // Alguns navegadores bloqueiam a leitura da resposta redirecionada do Apps Script.
    // O segundo envio usa no-cors; o script elimina duplicidades pelo ID do gasto.
    await fetch(config.endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return { confirmed: false, warning: error instanceof Error ? error.message : String(error) };
  }
}

export default function GastosComSincronizacao() {
  const initialConfig = readJson(CONFIG_KEY, { endpoint: '', token: '' });
  const [config, setConfig] = useState({
    endpoint: cleanEndpoint(initialConfig.endpoint),
    token: String(initialConfig.token || ''),
  });
  const [draftConfig, setDraftConfig] = useState(config);
  const [pendingCount, setPendingCount] = useState(0);
  const [status, setStatus] = useState({ type: config.endpoint && config.token ? 'ready' : 'offline', text: '' });
  const syncingRef = useRef(false);

  const refreshPendingCount = useCallback(() => {
    const synced = readSyncedIds();
    const pending = readEntries().filter((entry) => entry?.id && !synced.has(entry.id));
    setPendingCount(pending.length);
    return pending;
  }, []);

  const syncNow = useCallback(async () => {
    const activeConfig = readJson(CONFIG_KEY, { endpoint: '', token: '' });
    activeConfig.endpoint = cleanEndpoint(activeConfig.endpoint);
    activeConfig.token = String(activeConfig.token || '');

    if (!activeConfig.endpoint || !activeConfig.token || syncingRef.current) {
      refreshPendingCount();
      return;
    }

    syncingRef.current = true;
    const syncedIds = readSyncedIds();
    const pending = readEntries()
      .filter((entry) => entry?.id && !syncedIds.has(entry.id))
      .reverse();

    if (!pending.length) {
      setStatus({ type: 'synced', text: 'Tudo sincronizado com a planilha.' });
      setPendingCount(0);
      syncingRef.current = false;
      return;
    }

    setStatus({ type: 'syncing', text: `Enviando ${pending.length} lançamento${pending.length === 1 ? '' : 's'}...` });

    try {
      let usedFallback = false;
      for (const entry of pending) {
        const result = await sendExpense(activeConfig, entry);
        usedFallback ||= !result.confirmed;
        syncedIds.add(entry.id);
        localStorage.setItem(SYNCED_KEY, JSON.stringify([...syncedIds]));
        setPendingCount((count) => Math.max(0, count - 1));
      }
      setStatus({
        type: 'synced',
        text: usedFallback
          ? 'Lançamentos enviados. Abra a planilha para confirmar.'
          : 'Lançamentos confirmados na planilha.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        text: `Não foi possível sincronizar: ${error instanceof Error ? error.message : String(error)}`,
      });
      refreshPendingCount();
    } finally {
      syncingRef.current = false;
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    const timer = window.setInterval(() => {
      const pending = refreshPendingCount();
      if (pending.length) syncNow();
    }, 1800);
    return () => window.clearInterval(timer);
  }, [refreshPendingCount, syncNow]);

  const saveConfig = (event) => {
    event.preventDefault();
    const next = {
      endpoint: cleanEndpoint(draftConfig.endpoint),
      token: String(draftConfig.token || '').trim(),
    };

    if (!/^https:\/\/script\.google\.com\//.test(next.endpoint) || !next.endpoint.endsWith('/exec')) {
      setStatus({ type: 'error', text: 'Cole o endereço de implantação do Apps Script terminado em /exec.' });
      return;
    }
    if (next.token.length < 12) {
      setStatus({ type: 'error', text: 'Use um código secreto com pelo menos 12 caracteres.' });
      return;
    }

    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    setConfig(next);
    setDraftConfig(next);
    setStatus({ type: 'ready', text: 'Integração salva neste navegador. Iniciando sincronização...' });
    window.setTimeout(syncNow, 100);
  };

  const statusIcon = {
    offline: <CloudOff size={18} />,
    ready: <Wifi size={18} />,
    syncing: <RefreshCw size={18} className="animate-spin" />,
    synced: <CheckCircle2 size={18} />,
    error: <CloudOff size={18} />,
  }[status.type];

  const configured = Boolean(config.endpoint && config.token);

  return (
    <>
      <section className="mb-5 rounded-[2rem] border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sheet size={22} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-100">Sincronização com Google Planilhas</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {configured
                  ? `${pendingCount} lançamento${pendingCount === 1 ? '' : 's'} aguardando envio.`
                  : 'Configure uma vez neste navegador para enviar cada compra automaticamente.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={syncNow}
            disabled={!configured || status.type === 'syncing'}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RefreshCw size={17} className={status.type === 'syncing' ? 'animate-spin' : ''} /> Sincronizar agora
          </button>
        </div>

        <div className={`mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${status.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>
          <span className="mt-0.5 shrink-0">{statusIcon}</span>
          <span>{status.text || (configured ? 'Integração pronta.' : 'Os gastos continuam salvos localmente enquanto a integração não estiver configurada.')}</span>
        </div>

        <details className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <summary className="cursor-pointer list-none font-bold text-slate-700 dark:text-slate-200">
            <span className="inline-flex items-center gap-2"><Settings2 size={17} /> Configurar ou alterar integração</span>
          </summary>
          <form onSubmit={saveConfig} className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.7fr_auto]">
            <label>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">URL do Apps Script</span>
              <input
                type="url"
                value={draftConfig.endpoint}
                onChange={(event) => setDraftConfig((previous) => ({ ...previous, endpoint: event.target.value }))}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-slate-900/70"
              />
            </label>
            <label>
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Código secreto</span>
              <input
                type="password"
                value={draftConfig.token}
                onChange={(event) => setDraftConfig((previous) => ({ ...previous, token: event.target.value }))}
                placeholder="Código definido no script"
                className="w-full rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-slate-900/70"
              />
            </label>
            <button type="submit" className="self-end rounded-2xl bg-slate-800 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700">
              Salvar
            </button>
          </form>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            O endereço e o código ficam apenas neste navegador. Pablo e Ana precisam configurar uma vez em cada celular ou computador usado para registrar gastos.
          </p>
        </details>
      </section>

      <Gastos />
    </>
  );
}
