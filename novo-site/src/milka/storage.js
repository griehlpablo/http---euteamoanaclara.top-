import { supabase } from "../supabase";
import { DATA_VERSION, DEFAULT_SCHEDULES, PEOPLE } from "./config";

const LOCAL_STORAGE_KEY = "milka-data-v4";
const CLOUD_MARKER = "__MILKA_DATA_V4__:";

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
    // A sincronização na nuvem continua sendo tentada.
  }
};

const decodeCloudText = (text) => {
  if (typeof text !== "string" || !text.startsWith(CLOUD_MARKER)) return null;
  try {
    return normalizeMilkaData(JSON.parse(text.slice(CLOUD_MARKER.length)));
  } catch {
    return null;
  }
};

const findCloudRow = async () => {
  const { data, error } = await supabase
    .from("bucketlist")
    .select("id,text,createdAt")
    .like("text", `${CLOUD_MARKER}%`)
    .order("createdAt", { ascending: false })
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length ? data[0] : null;
};

export const readMilkaData = async () => {
  const localData = readLocalData();

  try {
    const row = await findCloudRow();
    const cloudData = decodeCloudText(row?.text);
    if (!cloudData) return localData;

    const cloudTime = new Date(cloudData.updatedAt || 0).getTime();
    const localTime = new Date(localData?.updatedAt || 0).getTime();
    const newest = localData && localTime > cloudTime ? localData : cloudData;

    writeLocalData(newest);
    return newest;
  } catch (error) {
    if (localData) return localData;
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

  writeLocalData(next);

  const text = `${CLOUD_MARKER}${JSON.stringify(next)}`;
  const row = await findCloudRow();

  if (row?.id) {
    const { error } = await supabase
      .from("bucketlist")
      .update({ text, completed: true })
      .eq("id", row.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("bucketlist").insert([
      {
        text,
        completed: true,
        createdAt: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
  }

  return next;
};
