import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SCHEDULES, DEVICE_PERSON_KEY } from "./config";
import {
  emptyMilkaData,
  normalizeMilkaData,
  readMilkaData,
  writeMilkaData,
} from "./storage";

export default function useMilkaCloud() {
  const [person, setPerson] = useState(() => localStorage.getItem(DEVICE_PERSON_KEY) || "Pablo");
  const [activities, setActivities] = useState([]);
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES);
  const [profile, setProfile] = useState(emptyMilkaData().profile);
  const [healthRecords, setHealthRecords] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const applyData = useCallback((data) => {
    const normalized = normalizeMilkaData(data);
    setActivities([...normalized.activities].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt)));
    setSchedules(normalized.schedules);
    setProfile(normalized.profile);
    setHealthRecords([...normalized.healthRecords].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)));
    setLastUpdate(normalized.updatedAt);
    return normalized;
  }, []);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      let data = await readMilkaData();
      if (!data) data = await writeMilkaData(emptyMilkaData());
      else if (data.needsWrite) data = await writeMilkaData(data);
      applyData(data);
      if (!silent) setStatus("");
    } catch (error) {
      if (!silent) setStatus(`Não consegui sincronizar os dados da Milka: ${error.message}`);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyData]);

  const persist = useCallback(async (changes, successMessage) => {
    const current = (await readMilkaData()) || emptyMilkaData();
    const next = await writeMilkaData({ ...current, ...changes });
    applyData(next);
    if (successMessage) setStatus(successMessage);
    return next;
  }, [applyData]);

  useEffect(() => {
    let mounted = true;
    loadData();
    const interval = window.setInterval(() => {
      if (mounted && document.visibilityState !== "hidden") loadData({ silent: true });
    }, 10000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [loadData]);

  useEffect(() => localStorage.setItem(DEVICE_PERSON_KEY, person), [person]);

  return {
    person, setPerson, activities, schedules, profile, healthRecords,
    status, setStatus, loading, lastUpdate, persist,
  };
}
