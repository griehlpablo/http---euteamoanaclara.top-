import { createClient } from "@supabase/supabase-js";

const defaultUrl = "https://houqxdlsziscdnnaknlv.supabase.co";
const defaultKey = ["sb_publishable_G80SeJmG0_", "jsyrZojvINtg_HW1pYt67"].join("");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

const rawSupabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      Prefer: "return=representation",
    },
  },
});

const HEALTH_TABLE = "daily_health_logs";
const HEALTH_MARKER = "__DAILY_HEALTH_LOG_V1__:";

const asArray = (value) => (Array.isArray(value) ? value : [value]);
const timestamp = (value) => {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const makeError = (message, code = "HELENA_CLOUD_ERROR", details = "") => ({
  message,
  code,
  details,
  hint: "",
});

const decodeHealthRow = (row) => {
  const text = String(row?.text || "");
  if (!text.startsWith(HEALTH_MARKER)) return null;
  try {
    const value = JSON.parse(text.slice(HEALTH_MARKER.length));
    if (!value?.person || !value?.log_date) return null;
    return {
      row,
      value: {
        ...value,
        updated_at: value.updated_at || row.createdAt || new Date().toISOString(),
      },
    };
  } catch {
    return null;
  }
};

const loadFallbackHealthRows = async () => {
  const { data, error } = await rawSupabase
    .from("bucketlist")
    .select("id,text,createdAt")
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data || []).map(decodeHealthRow).filter(Boolean);
};

const healthKey = (value) => `${value?.person || ""}|${value?.log_date || ""}`;

const saveFallbackHealthRows = async (values) => {
  const existing = await loadFallbackHealthRows();
  const byKey = new Map();
  for (const item of existing) {
    const key = healthKey(item.value);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(item.row);
  }

  const saved = [];
  for (const original of values) {
    const now = new Date().toISOString();
    const value = {
      ...original,
      person: original.person,
      log_date: original.log_date,
      updated_at: now,
    };
    const text = `${HEALTH_MARKER}${JSON.stringify(value)}`;
    const rows = byKey.get(healthKey(value)) || [];

    if (rows.length) {
      const { error } = await rawSupabase
        .from("bucketlist")
        .update({ text, completed: true })
        .in(
          "id",
          rows.map((row) => row.id),
        );
      if (error) throw error;
    } else {
      const { error } = await rawSupabase.from("bucketlist").insert([
        {
          text,
          completed: true,
          createdAt: now,
        },
      ]);
      if (error) throw error;
    }
    saved.push(value);
  }
  return saved;
};

const deleteFallbackHealthRows = async (filters) => {
  const existing = await loadFallbackHealthRows();
  const matching = existing.filter(({ value }) => matchesFilters(value, filters));
  if (!matching.length) return [];
  const ids = matching.map(({ row }) => row.id);
  const { error } = await rawSupabase.from("bucketlist").delete().in("id", ids);
  if (error) throw error;
  return matching.map(({ value }) => value);
};

const updateFallbackHealthRows = async (patch, filters) => {
  const existing = await loadFallbackHealthRows();
  const matching = existing.filter(({ value }) => matchesFilters(value, filters));
  if (!matching.length) return [];
  return saveFallbackHealthRows(
    matching.map(({ value }) => ({ ...value, ...patch })),
  );
};

const compareValue = (left, operator, right) => {
  if (operator === "eq") return left === right;
  if (operator === "neq") return left !== right;
  if (operator === "gte") return left >= right;
  if (operator === "lte") return left <= right;
  if (operator === "gt") return left > right;
  if (operator === "lt") return left < right;
  if (operator === "in") return Array.isArray(right) && right.includes(left);
  return true;
};

function matchesFilters(value, filters) {
  return filters.every(({ column, operator, value: expected }) =>
    compareValue(value?.[column], operator, expected),
  );
}

const mergeHealthRows = (nativeRows, fallbackRows) => {
  const merged = new Map();
  for (const value of [...nativeRows, ...fallbackRows]) {
    if (!value?.person || !value?.log_date) continue;
    const key = healthKey(value);
    const current = merged.get(key);
    if (!current || timestamp(value.updated_at) >= timestamp(current.updated_at)) {
      merged.set(key, value);
    }
  }
  return [...merged.values()];
};

const projectColumns = (row, columns) => {
  if (!columns || columns === "*") return row;
  const keys = String(columns)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return Object.fromEntries(keys.map((key) => [key, row?.[key]]));
};

class DailyHealthQuery {
  constructor() {
    this.action = "select";
    this.columns = "*";
    this.filters = [];
    this.orderBy = null;
    this.maxRows = null;
    this.payload = null;
    this.returning = false;
    this.mode = "many";
  }

  select(columns = "*") {
    this.columns = columns || "*";
    this.returning = true;
    return this;
  }

  insert(payload) {
    this.action = "insert";
    this.payload = asArray(payload);
    return this;
  }

  upsert(payload) {
    this.action = "upsert";
    this.payload = asArray(payload);
    return this;
  }

  update(patch) {
    this.action = "update";
    this.payload = patch || {};
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, operator: "eq", value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ column, operator: "neq", value });
    return this;
  }

  gte(column, value) {
    this.filters.push({ column, operator: "gte", value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ column, operator: "lte", value });
    return this;
  }

  gt(column, value) {
    this.filters.push({ column, operator: "gt", value });
    return this;
  }

  lt(column, value) {
    this.filters.push({ column, operator: "lt", value });
    return this;
  }

  in(column, value) {
    this.filters.push({ column, operator: "in", value });
    return this;
  }

  order(column, options = {}) {
    this.orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(value) {
    this.maxRows = Number(value) || null;
    return this;
  }

  single() {
    this.mode = "single";
    return this.execute();
  }

  maybeSingle() {
    this.mode = "maybeSingle";
    return this.execute();
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async nativeSelect() {
    const { data, error } = await rawSupabase.from(HEALTH_TABLE).select("*");
    return error ? [] : data || [];
  }

  async executeSelect() {
    const [nativeResult, fallbackResult] = await Promise.allSettled([
      this.nativeSelect(),
      loadFallbackHealthRows(),
    ]);
    const nativeRows = nativeResult.status === "fulfilled" ? nativeResult.value : [];
    const fallbackRows =
      fallbackResult.status === "fulfilled"
        ? fallbackResult.value.map(({ value }) => value)
        : [];

    if (!nativeRows.length && !fallbackRows.length) {
      const nativeError = nativeResult.status === "rejected" ? nativeResult.reason : null;
      const fallbackError =
        fallbackResult.status === "rejected" ? fallbackResult.reason : null;
      if (nativeError && fallbackError) {
        return {
          data: null,
          error: makeError(
            "Não foi possível acessar os registros da Helena na nuvem.",
            fallbackError.code || nativeError.code,
            fallbackError.message || nativeError.message,
          ),
        };
      }
    }

    let rows = mergeHealthRows(nativeRows, fallbackRows).filter((row) =>
      matchesFilters(row, this.filters),
    );

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows.sort((left, right) => {
        const a = left?.[column] ?? "";
        const b = right?.[column] ?? "";
        if (a === b) return 0;
        return (a < b ? -1 : 1) * (ascending ? 1 : -1);
      });
    }
    if (this.maxRows) rows = rows.slice(0, this.maxRows);
    rows = rows.map((row) => projectColumns(row, this.columns));
    return this.finish(rows);
  }

  async executeWrite() {
    let nativeData = null;
    let nativeError = null;
    let fallbackData = null;
    let fallbackError = null;

    try {
      let query;
      if (this.action === "upsert") {
        query = rawSupabase
          .from(HEALTH_TABLE)
          .upsert(this.payload, { onConflict: "person,log_date" });
      } else if (this.action === "insert") {
        query = rawSupabase.from(HEALTH_TABLE).insert(this.payload);
      } else if (this.action === "update") {
        query = rawSupabase.from(HEALTH_TABLE).update(this.payload);
        for (const filter of this.filters) {
          if (typeof query[filter.operator] === "function") {
            query = query[filter.operator](filter.column, filter.value);
          }
        }
      } else {
        query = rawSupabase.from(HEALTH_TABLE).delete();
        for (const filter of this.filters) {
          if (typeof query[filter.operator] === "function") {
            query = query[filter.operator](filter.column, filter.value);
          }
        }
      }
      const result = await query.select("*");
      nativeData = result.data;
      nativeError = result.error;
    } catch (error) {
      nativeError = error;
    }

    try {
      if (this.action === "upsert" || this.action === "insert") {
        fallbackData = await saveFallbackHealthRows(this.payload);
      } else if (this.action === "update") {
        fallbackData = await updateFallbackHealthRows(this.payload, this.filters);
      } else {
        fallbackData = await deleteFallbackHealthRows(this.filters);
      }
    } catch (error) {
      fallbackError = error;
    }

    if (fallbackError && nativeError) {
      return {
        data: null,
        error: makeError(
          "Não foi possível salvar os dados da Helena na nuvem.",
          fallbackError.code || nativeError.code,
          fallbackError.message || nativeError.message,
        ),
      };
    }

    let rows = fallbackData?.length ? fallbackData : nativeData || [];
    rows = rows.map((row) => projectColumns(row, this.columns));
    return this.finish(rows);
  }

  finish(rows) {
    if (this.mode === "single") {
      if (rows.length !== 1) {
        return {
          data: null,
          error: makeError(
            rows.length ? "Mais de um registro foi encontrado." : "Registro não encontrado.",
            "PGRST116",
          ),
        };
      }
      return { data: rows[0], error: null };
    }
    if (this.mode === "maybeSingle") {
      if (rows.length > 1) {
        return {
          data: null,
          error: makeError("Mais de um registro foi encontrado.", "PGRST116"),
        };
      }
      return { data: rows[0] || null, error: null };
    }
    return { data: rows, error: null };
  }

  execute() {
    return this.action === "select" ? this.executeSelect() : this.executeWrite();
  }
}

export const supabase = new Proxy(rawSupabase, {
  get(target, property) {
    if (property === "from") {
      return (table) =>
        table === HEALTH_TABLE ? new DailyHealthQuery() : target.from(table);
    }
    const value = target[property];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export default supabase;
