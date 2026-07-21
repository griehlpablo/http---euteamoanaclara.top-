import { supabase } from "../supabase";
import { DATA_VERSION, DEFAULT_SCHEDULES, PEOPLE } from "./config";

const STORAGE_BUCKET = "mural";
const STORAGE_PATH = "milka/data.json";
const LOCAL_STORAGE_KEY = "milka-data-v4";

export const emptyMilkaData = () => ({
  version: DATA_VERSION,
  activities: [],
  schedules: DEFAULT_SCHEDULES,
  profile: { estimatedAgeMonths: 5, weightKg: 1.5, weightUpdatedAt: null },
  healthRecords: [],
  updatedAt: new Date().toISOString(),
});

export const normalizeMilkaData = (value) => {
  const version = Number(value?.version || 1);
  const savedSchedules = Array.isArray(value?.schedules) ? value.schedules : [];
  const profile = value?.profile && typeof value.profile === "object" ? value.profile : {};
  return {
    version: DATA_VERSION,
    activities: Array.isArray(value?.activities) ? value.activities : [],
    schedules:
      version < 3 || !savedSchedules.length
        ? DEFAULT_SCHEDULES
        : savedSchedules.map((item) => ({
            ...item,
            notify:
              Array.isArray(item.notify) && item.notify.length
                ? item.notify.filter((name) => PEOPLE.includes(name))
                : PEOPLE,
          })),
    profile: {
      estimatedAgeMonths: Number(profile.estimatedAgeMonths || 5),
      weightKg: Number(profile.weightKg || 1.5),
      weightUpdatedAt: profile.weightUpdatedAt || null,
    },
    healthRecords: Array.isArray(value?.healthRecords) ? value.healthRecords : [],
    updatedAt: value?.updatedAt || new Date().toISOString(),
    needsWrite: version < DATA_VERSION,
  };
};

const isMissingBucketError = (error) => {
  const status = Number(error?.statusCode || error?.status || 0);
  const message = String(error?.message || "").toLowerCase();
  return (
    status === 400 ||
    status === 404 ||
    message.includes("bucket not found") ||
    message.includes("not found")
  );
};

const readLocalData = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? normalizeMilkaData(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

const writeLocalData = (value) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // O salvamento na nuvem continua sendo tentado mesmo se o navegador bloquear o armazenamento local.
  }
};

export const readMilkaData = async () => {
  const localData = readLocalData();

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_PATH);

    if (error) {
      if (isMissingBucketError(error)) return localData;
      throw error;
    }

    const cloudData = normalizeMilkaData(JSON.parse(await data.text()));
    writeLocalData(cloudData);
    return cloudData;
  } catch (error) {
    if (localData) return localData;
    if (isMissingBucketError(error)) return null;
    throw error;
  }
};

export const writeMilkaData = async (value) => {
  const normalized = normalizeMilkaData({
    ...value,
    version: DATA_VERSION,
    updatedAt: new Date().toISOString(),
  });
  const { needsWrite: _needsWrite, ...next } = normalized;

  // Salva primeiro no aparelho para que cronograma, peso e prontuário nunca
  // sejam perdidos por uma falha temporária ou ausência do bucket no Supabase.
  writeLocalData(next);

  try {
    const blob = new Blob([JSON.stringify(next)], { type: "application/json" });
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH, blob, {
        upsert: true,
        contentType: "application/json",
        cacheControl: "0",
      });

    if (error && !isMissingBucketError(error)) throw error;
  } catch (error) {
    if (!isMissingBucketError(error)) throw error;
  }

  return next;
};
