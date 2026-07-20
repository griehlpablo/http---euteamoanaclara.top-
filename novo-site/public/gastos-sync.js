(() => {
  const ENTRIES_KEY = 'financas-casal-lancamentos-v1';
  const SYNCED_KEY = 'financas-casal-google-synced-v1';
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1z5Z3pmTMMVJpX0CSulH4AhnJPoU6zmeKLdJeWPsq6y0/edit';
  const API_URL = '/api/gastos';
  const ROOT_ID = 'gastos-google-sync';

  let syncing = false;
  let lastPath = '';

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

  const readSynced = () => {
    const ids = readJson(SYNCED_KEY, []);
    return new Set(Array.isArray(ids) ? ids : []);
  };

  const pendingEntries = () => {
    const synced = readSynced();
    return readEntries().filter((entry) => entry?.id && !synced.has(entry.id));
  };

  const styles = `
    #${ROOT_ID}{position:fixed;right:18px;bottom:18px;z-index:99999;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#334155}
    #${ROOT_ID} *{box-sizing:border-box}
    #${ROOT_ID} .gs-toggle{display:flex;align-items:center;gap:9px;border:0;border-radius:999px;padding:12px 16px;background:#059669;color:white;font-weight:800;cursor:pointer;box-shadow:0 14px 35px rgba(5,150,105,.3)}
    #${ROOT_ID} .gs-count{display:inline-flex;min-width:22px;height:22px;padding:0 6px;align-items:center;justify-content:center;border-radius:999px;background:rgba(255,255,255,.22);font-size:12px}
    #${ROOT_ID} .gs-panel{display:none;width:min(370px,calc(100vw - 24px));margin-bottom:10px;border:1px solid rgba(255,255,255,.85);border-radius:24px;padding:18px;background:rgba(255,255,255,.96);box-shadow:0 25px 70px rgba(71,30,52,.25);backdrop-filter:blur(18px)}
    #${ROOT_ID}.open .gs-panel{display:block}
    #${ROOT_ID} h3{margin:0;font-family:Georgia,serif;font-size:21px;color:#1e293b}
    #${ROOT_ID} p{margin:6px 0 0;font-size:12px;line-height:1.55;color:#64748b}
    #${ROOT_ID} .gs-status{margin:14px 0;border-radius:15px;padding:10px 12px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700}
    #${ROOT_ID} .gs-status.error{background:#fff1f2;color:#be123c}
    #${ROOT_ID} .gs-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}
    #${ROOT_ID} .gs-button,#${ROOT_ID} .gs-link{display:flex;align-items:center;justify-content:center;min-height:42px;border:0;border-radius:14px;padding:10px 12px;text-decoration:none;font-size:12px;font-weight:850;cursor:pointer}
    #${ROOT_ID} .gs-sync{background:#059669;color:white}.gs-link{background:#f1f5f9;color:#334155}
    #${ROOT_ID} .gs-help{margin-top:12px;padding-top:11px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
    .dark #${ROOT_ID}{color:#e2e8f0}.dark #${ROOT_ID} .gs-panel{background:rgba(15,23,42,.97);border-color:#334155}.dark #${ROOT_ID} h3{color:#f8fafc}.dark #${ROOT_ID} p{color:#94a3b8}.dark #${ROOT_ID} .gs-link{background:#334155;color:#e2e8f0}.dark #${ROOT_ID} .gs-help{border-color:#334155}
    @media(max-width:520px){#${ROOT_ID}{right:10px;bottom:10px}#${ROOT_ID} .gs-panel{width:calc(100vw - 20px)}#${ROOT_ID} .gs-actions{grid-template-columns:1fr}}
  `;

  const setStatus = (text, isError = false) => {
    const status = document.querySelector(`#${ROOT_ID} .gs-status`);
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('error', isError);
  };

  const refreshUi = () => {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;
    const pending = pendingEntries().length;
    const count = root.querySelector('.gs-count');
    if (count) count.textContent = String(pending);
  };

  const createUi = () => {
    if (document.getElementById(ROOT_ID)) return;

    const style = document.createElement('style');
    style.id = `${ROOT_ID}-styles`;
    style.textContent = styles;
    document.head.appendChild(style);

    const root = document.createElement('aside');
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="gs-panel">
        <h3>Google Planilhas</h3>
        <p>Os gastos registrados neste aparelho são enviados automaticamente para a aba <strong>Lançamentos</strong>.</p>
        <div class="gs-status">Sincronização automática pronta.</div>
        <div class="gs-actions">
          <button class="gs-button gs-sync" type="button">Sincronizar agora</button>
          <a class="gs-link" href="${SHEET_URL}" target="_blank" rel="noopener">Abrir planilha</a>
          <button class="gs-button gs-link gs-close" type="button">Fechar</button>
        </div>
        <div class="gs-help">A URL e o código secreto ficam protegidos no servidor. Não é necessário configurar cada navegador.</div>
      </div>
      <button class="gs-toggle" type="button">☁ Planilha <span class="gs-count">0</span></button>
    `;
    document.body.appendChild(root);

    root.querySelector('.gs-toggle').addEventListener('click', () => root.classList.toggle('open'));
    root.querySelector('.gs-close').addEventListener('click', () => root.classList.remove('open'));
    root.querySelector('.gs-sync').addEventListener('click', syncNow);
    refreshUi();
  };

  const removeUi = () => {
    document.getElementById(ROOT_ID)?.remove();
    document.getElementById(`${ROOT_ID}-styles`)?.remove();
  };

  const sendExpense = async (entry) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'appendExpense',
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
      }),
    });

    const text = await response.text();
    let result;
    try {
      result = text ? JSON.parse(text) : { ok: response.ok };
    } catch {
      throw new Error('O servidor respondeu em formato inválido.');
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.error || `Servidor respondeu com status ${response.status}.`);
    }

    return result;
  };

  async function syncNow() {
    if (syncing || window.location.pathname.replace(/\/$/, '') !== '/gastos') return;

    const synced = readSynced();
    const pending = pendingEntries().reverse();
    if (!pending.length) {
      setStatus('Tudo sincronizado com a planilha.');
      refreshUi();
      return;
    }

    syncing = true;
    setStatus(`Enviando ${pending.length} lançamento${pending.length === 1 ? '' : 's'}...`);

    try {
      for (const entry of pending) {
        await sendExpense(entry);
        synced.add(entry.id);
        localStorage.setItem(SYNCED_KEY, JSON.stringify([...synced]));
        refreshUi();
      }
      setStatus('Sincronização confirmada na planilha.');
    } catch (error) {
      setStatus(`Falha ao sincronizar: ${error?.message || String(error)}`, true);
    } finally {
      syncing = false;
      refreshUi();
    }
  }

  const tick = () => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path !== lastPath) {
      lastPath = path;
      if (path === '/gastos') createUi();
      else removeUi();
    }
    if (path !== '/gastos') return;
    createUi();
    refreshUi();
    if (pendingEntries().length) syncNow();
  };

  window.setInterval(tick, 2500);
  window.addEventListener('load', tick);
  window.addEventListener('popstate', tick);
  window.addEventListener('storage', tick);
  tick();
})();