import { useEffect } from "react";
import { isSupabaseConfigured, supabase } from "../supabase";

const CLIENT_KEY = "casal-shared-client-id-v1";
const SHEET_SYNCED_KEY = "financas-casal-google-synced-v1";

const CONFIGS = [
  {
    name: "gastos",
    route: "/gastos",
    kind: "entries",
    storageKey: "financas-casal-lancamentos-v1",
    metaKey: "financas-casal-cloud-state-v1",
    marker: "__SHARED_GASTOS_V1__:",
    fallback: [],
  },
  {
    name: "cardapio",
    route: "/cardapio",
    kind: "checks",
    storageKey: "cardapio-final-22-31-julho-2026-v2",
    metaKey: "cardapio-cloud-state-v1",
    marker: "__SHARED_CARDAPIO_V1__:",
    fallback: {},
  },
];

const safeParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value || "null");
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const clone = (value) => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const timestampOf = (value, fallback = 0) => {
  const number = Number(value);
  if (Number.isFinite(number) && number > 0) return number;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getClientId = () => {
  const saved = localStorage.getItem(CLIENT_KEY);
  if (saved) return saved;
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  localStorage.setItem(CLIENT_KEY, id);
  return id;
};

const decodeCloud = (config, text) => {
  if (typeof text !== "string" || !text.startsWith(config.marker)) return null;
  return safeParse(text.slice(config.marker.length), null);
};

const fetchCloudRows = async (config) => {
  const { data, error } = await supabase
    .from("bucketlist")
    .select("id,text,createdAt")
    .like("text", `${config.marker}%`)
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

const readCloud = async (config) => {
  const rows = await fetchCloudRows(config);
  const decoded = rows
    .map((row) => ({ row, state: decodeCloud(config, row.text) }))
    .filter((item) => item.state)
    .sort(
      (a, b) =>
        timestampOf(b.state.updatedAt, timestampOf(b.row.createdAt)) -
        timestampOf(a.state.updatedAt, timestampOf(a.row.createdAt)),
    );
  return { rows, state: decoded[0]?.state || null };
};

const writeCloud = async (config, state) => {
  const text = `${config.marker}${JSON.stringify(state)}`;
  const rows = await fetchCloudRows(config);
  if (rows.length) {
    const { error } = await supabase
      .from("bucketlist")
      .update({ text, completed: true })
      .in(
        "id",
        rows.map((row) => row.id),
      );
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("bucketlist").insert([
    {
      text,
      completed: true,
      createdAt: new Date().toISOString(),
    },
  ]);
  if (error) throw error;
};

const emptyEntriesState = () => ({
  version: 1,
  kind: "entries",
  entries: {},
  deleted: {},
  updatedAt: 0,
});

const normalizeEntriesState = (value) => ({
  ...emptyEntriesState(),
  ...(value && typeof value === "object" ? value : {}),
  entries:
    value?.entries && typeof value.entries === "object" ? value.entries : {},
  deleted:
    value?.deleted && typeof value.deleted === "object" ? value.deleted : {},
});

const entriesArray = (state) =>
  Object.values(state.entries || {})
    .map((item) => item?.value)
    .filter(Boolean)
    .sort(
      (a, b) =>
        timestampOf(b.createdAt || b.updatedAt) -
        timestampOf(a.createdAt || a.updatedAt),
    );

const applyEntriesRaw = (stateValue, rawEntries, clientId, changedAt, initial) => {
  const state = normalizeEntriesState(clone(stateValue));
  const list = Array.isArray(rawEntries) ? rawEntries : [];
  const incomingIds = new Set();
  let stateChanged = false;

  for (const entry of list) {
    if (!entry?.id) continue;
    const id = String(entry.id);
    incomingIds.add(id);
    const previous = state.entries[id];
    const changed = !previous || !same(previous.value, entry);
    if (changed) {
      const fallbackTime = timestampOf(entry.updatedAt || entry.createdAt, changedAt);
      state.entries[id] = {
        value: entry,
        updatedAt: initial && !previous ? fallbackTime : changedAt,
        source: clientId,
      };
      stateChanged = true;
    }
    const entryTime = timestampOf(state.entries[id]?.updatedAt);
    if (timestampOf(state.deleted[id]) <= entryTime && id in state.deleted) {
      delete state.deleted[id];
      stateChanged = true;
    }
  }

  if (!initial) {
    for (const id of Object.keys(state.entries)) {
      if (incomingIds.has(id)) continue;
      state.deleted[id] = changedAt;
      delete state.entries[id];
      stateChanged = true;
    }
  }

  if (stateChanged) {
    state.updatedAt = Math.max(timestampOf(state.updatedAt), changedAt);
  }
  return state;
};

const mergeEntriesStates = (leftValue, rightValue) => {
  const left = normalizeEntriesState(leftValue);
  const right = normalizeEntriesState(rightValue);
  const merged = emptyEntriesState();
  const ids = new Set([
    ...Object.keys(left.entries),
    ...Object.keys(right.entries),
    ...Object.keys(left.deleted),
    ...Object.keys(right.deleted),
  ]);

  for (const id of ids) {
    const leftEntry = left.entries[id];
    const rightEntry = right.entries[id];
    const entry =
      timestampOf(rightEntry?.updatedAt) > timestampOf(leftEntry?.updatedAt)
        ? rightEntry
        : leftEntry || rightEntry;
    const deletedAt = Math.max(
      timestampOf(left.deleted[id]),
      timestampOf(right.deleted[id]),
    );
    const entryAt = timestampOf(entry?.updatedAt);

    if (deletedAt >= entryAt && deletedAt > 0) merged.deleted[id] = deletedAt;
    else if (entry) merged.entries[id] = entry;
  }

  merged.updatedAt = Math.max(
    timestampOf(left.updatedAt),
    timestampOf(right.updatedAt),
  );
  return merged;
};

const emptyChecksState = () => ({
  version: 1,
  kind: "checks",
  values: {},
  stamps: {},
  updatedAt: 0,
});

const normalizeChecksState = (value) => ({
  ...emptyChecksState(),
  ...(value && typeof value === "object" ? value : {}),
  values: value?.values && typeof value.values === "object" ? value.values : {},
  stamps: value?.stamps && typeof value.stamps === "object" ? value.stamps : {},
});

const applyChecksRaw = (stateValue, rawChecks, clientId, changedAt, initial) => {
  const state = normalizeChecksState(clone(stateValue));
  const values = rawChecks && typeof rawChecks === "object" ? rawChecks : {};
  const keys = new Set([...Object.keys(state.values), ...Object.keys(values)]);
  let stateChanged = false;

  for (const key of keys) {
    const nextValue = Boolean(values[key]);
    const previousValue = Boolean(state.values[key]);
    if (!(key in state.values) || nextValue !== previousValue) {
      state.values[key] = nextValue;
      state.stamps[key] = initial
        ? nextValue
          ? changedAt
          : timestampOf(state.stamps[key])
        : changedAt;
      if (!initial || nextValue) stateChanged = true;
    }
  }

  if (stateChanged) {
    state.source = clientId;
    state.updatedAt = Math.max(timestampOf(state.updatedAt), changedAt);
  }
  return state;
};

const mergeChecksStates = (leftValue, rightValue) => {
  const left = normalizeChecksState(leftValue);
  const right = normalizeChecksState(rightValue);
  const merged = emptyChecksState();
  const keys = new Set([
    ...Object.keys(left.values),
    ...Object.keys(right.values),
    ...Object.keys(left.stamps),
    ...Object.keys(right.stamps),
  ]);

  for (const key of keys) {
    const leftStamp = timestampOf(left.stamps[key]);
    const rightStamp = timestampOf(right.stamps[key]);
    if (rightStamp > leftStamp) {
      merged.values[key] = Boolean(right.values[key]);
      merged.stamps[key] = rightStamp;
    } else {
      merged.values[key] = Boolean(left.values[key]);
      merged.stamps[key] = leftStamp;
    }
  }

  merged.updatedAt = Math.max(
    timestampOf(left.updatedAt),
    timestampOf(right.updatedAt),
  );
  return merged;
};

const markRemoteExpensesAsSynced = (cloudState, clientId) => {
  if (cloudState?.kind !== "entries") return;
  const synced = new Set(
    safeParse(localStorage.getItem(SHEET_SYNCED_KEY), []).map(String),
  );
  let changed = false;
  for (const [id, item] of Object.entries(cloudState.entries || {})) {
    if (item?.source === clientId || synced.has(id)) continue;
    synced.add(id);
    changed = true;
  }
  if (changed) {
    localStorage.setItem(SHEET_SYNCED_KEY, JSON.stringify([...synced]));
  }
};

export default function SharedStorageSync({ onRemoteChange }) {
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let stopped = false;
    let cloudTimer;
    const clientId = getClientId();
    const runtimes = CONFIGS.map((config) => ({
      config,
      state: null,
      lastRaw:
        localStorage.getItem(config.storageKey) || JSON.stringify(config.fallback),
      writing: Promise.resolve(),
    }));

    const notify = (config) => {
      const path = window.location.pathname.replace(/\/$/, "") || "/";
      if (path === config.route) onRemoteChange?.();
    };

    const persistLocal = (runtime, state, remote) => {
      const value =
        runtime.config.kind === "entries" ? entriesArray(state) : state.values;
      const raw = JSON.stringify(value);
      const changed = raw !== runtime.lastRaw;
      runtime.state = state;
      runtime.lastRaw = raw;
      localStorage.setItem(runtime.config.storageKey, raw);
      localStorage.setItem(runtime.config.metaKey, JSON.stringify(state));
      if (remote && changed) notify(runtime.config);
      return changed;
    };

    const queueWrite = (runtime) => {
      const snapshot = clone(runtime.state);
      runtime.writing = runtime.writing
        .catch(() => undefined)
        .then(() => writeCloud(runtime.config, snapshot))
        .catch((error) =>
          console.warn(`Falha ao sincronizar ${runtime.config.name}:`, error),
        );
    };

    const loadRemote = async (runtime, initial = false) => {
      try {
        const { state: cloudState } = await readCloud(runtime.config);
        if (stopped) return;

        const localRaw = safeParse(
          localStorage.getItem(runtime.config.storageKey),
          runtime.config.fallback,
        );
        const savedMeta = safeParse(
          localStorage.getItem(runtime.config.metaKey),
          null,
        );
        const now = Date.now();
        let localState;
        let merged;

        if (runtime.config.kind === "entries") {
          localState = applyEntriesRaw(
            savedMeta || emptyEntriesState(),
            localRaw,
            clientId,
            now,
            true,
          );
          merged = mergeEntriesStates(
            localState,
            cloudState || emptyEntriesState(),
          );
          markRemoteExpensesAsSynced(cloudState, clientId);
        } else {
          localState = applyChecksRaw(
            savedMeta || emptyChecksState(),
            localRaw,
            clientId,
            now,
            true,
          );
          merged = mergeChecksStates(
            localState,
            cloudState || emptyChecksState(),
          );
        }

        const localChanged = persistLocal(runtime, merged, !initial);
        if (!cloudState || !same(merged, cloudState)) queueWrite(runtime);
        else if (localChanged && initial) notify(runtime.config);
      } catch (error) {
        console.warn(
          `Falha ao carregar ${runtime.config.name} compartilhado:`,
          error,
        );
      }
    };

    const inspectLocal = (runtime) => {
      const raw =
        localStorage.getItem(runtime.config.storageKey) ||
        JSON.stringify(runtime.config.fallback);
      if (raw === runtime.lastRaw || !runtime.state) return;

      const value = safeParse(raw, runtime.config.fallback);
      const now = Date.now();
      runtime.state =
        runtime.config.kind === "entries"
          ? applyEntriesRaw(runtime.state, value, clientId, now, false)
          : applyChecksRaw(runtime.state, value, clientId, now, false);
      runtime.lastRaw = raw;
      localStorage.setItem(runtime.config.metaKey, JSON.stringify(runtime.state));
      queueWrite(runtime);
    };

    Promise.all(runtimes.map((runtime) => loadRemote(runtime, true)));

    const localInterval = window.setInterval(() => {
      runtimes.forEach(inspectLocal);
    }, 900);

    const remoteInterval = window.setInterval(() => {
      runtimes.forEach((runtime) => loadRemote(runtime, false));
    }, 5000);

    const refreshVisibleData = () => {
      if (document.visibilityState !== "visible") return;
      runtimes.forEach((runtime) => loadRemote(runtime, false));
    };
    document.addEventListener("visibilitychange", refreshVisibleData);

    const channel = supabase
      .channel(`shared-storage-${clientId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bucketlist" },
        () => {
          window.clearTimeout(cloudTimer);
          cloudTimer = window.setTimeout(() => {
            runtimes.forEach((runtime) => loadRemote(runtime, false));
          }, 250);
        },
      )
      .subscribe();

    return () => {
      stopped = true;
      window.clearInterval(localInterval);
      window.clearInterval(remoteInterval);
      window.clearTimeout(cloudTimer);
      document.removeEventListener("visibilitychange", refreshVisibleData);
      supabase.removeChannel(channel);
    };
  }, [onRemoteChange]);

  return null;
}
