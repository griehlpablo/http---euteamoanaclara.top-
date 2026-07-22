(() => {
  const ENTRIES_KEY = 'financas-casal-lancamentos-v1';
  const SYNCED_KEY = 'financas-casal-google-synced-v1';
  const INCOME_CATEGORIES = new Set([
    'Salário',
    'Freelance',
    'Reembolso',
    'Venda',
    'Presente',
    'Benefício',
    'Outras entradas',
  ]);

  const readList = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const normalizeType = (entry, localEntry) => {
    const raw = String(entry?.type || localEntry?.type || '').toLocaleLowerCase('pt-BR');
    if (
      raw.includes('entrada') ||
      raw.includes('receita') ||
      raw === 'income' ||
      INCOME_CATEGORIES.has(String(entry?.category || localEntry?.category || ''))
    ) {
      return 'income';
    }
    return 'expense';
  };

  const updateFromSheet = async () => {
    if (window.location.pathname.replace(/\/$/, '') !== '/gastos') return;

    const response = await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'listExpenses' }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || !Array.isArray(result.entries)) return;

    const localEntries = readList(ENTRIES_KEY);
    const localById = new Map(
      localEntries.filter((entry) => entry?.id).map((entry) => [entry.id, entry]),
    );
    const synced = new Set(readList(SYNCED_KEY));
    const localOnly = localEntries.filter(
      (entry) => entry?.id && !entry.synced && !synced.has(entry.id),
    );
    const merged = new Map();

    result.entries.forEach((entry) => {
      if (!entry?.id) return;
      const localEntry = localById.get(entry.id);
      synced.add(entry.id);
      merged.set(entry.id, {
        ...entry,
        type: normalizeType(entry, localEntry),
        account:
          localEntry?.type === 'income' && localEntry?.account
            ? localEntry.account
            : entry.account || localEntry?.account || 'Outra conta',
        synced: true,
      });
    });
    localOnly.forEach((entry) => {
      if (!merged.has(entry.id)) merged.set(entry.id, entry);
    });

    const entries = [...merged.values()];
    const serialized = JSON.stringify(entries);
    localStorage.setItem(ENTRIES_KEY, serialized);
    localStorage.setItem(SYNCED_KEY, JSON.stringify([...synced]));
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: ENTRIES_KEY,
        newValue: serialized,
        storageArea: localStorage,
      }),
    );
  };

  window.addEventListener('load', updateFromSheet);
  window.addEventListener('popstate', updateFromSheet);
  window.setInterval(updateFromSheet, 15000);
  updateFromSheet();
})();
