import { useState } from "react";
import {
  ACTIONS,
  RECORD_TYPES,
  formatDateTime,
  formatKg,
  todayKey,
  uid,
} from "./config";
import { emptyMilkaData, readMilkaData } from "./storage";

export default function useMilkaActions({ person, persist, setStatus }) {
  const [savingAction, setSavingAction] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  const registerActivity = async (action, note = "", customPerson = person, occurredAt = new Date().toISOString()) => {
    setSavingAction(action);
    try {
      const current = (await readMilkaData()) || emptyMilkaData();
      const activity = { id: uid(), action, person: customPerson, note, occurredAt };
      await persist(
        { activities: [activity, ...current.activities].slice(0, 1000) },
        `${ACTIONS[action]?.label || "Cuidado registrado"} por ${customPerson} às ${formatDateTime(occurredAt)}.`,
      );
      return activity;
    } catch (error) {
      setStatus(`Não consegui registrar: ${error.message}`);
      return false;
    } finally {
      setSavingAction("");
    }
  };

  const saveWeight = async ({ weightKg, ageMonths, date, person: recordPerson }) => {
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 20) {
      setStatus("Informe um peso válido em quilos, por exemplo 1,5.");
      return false;
    }
    setSavingRecord(true);
    try {
      const current = (await readMilkaData()) || emptyMilkaData();
      const record = { id: uid(), type: "weight", title: `Peso: ${formatKg(weightKg)}`, details: "Atualização do peso.", date: date || todayKey(), person: recordPerson || person, weightKg, createdAt: new Date().toISOString(), source: "manual" };
      return await persist({
        profile: { ...current.profile, weightKg, estimatedAgeMonths: Math.max(1, Math.min(24, Math.round(ageMonths || 5))), weightUpdatedAt: new Date().toISOString() },
        healthRecords: [record, ...current.healthRecords],
      }, `Peso atualizado para ${formatKg(weightKg)}.`);
    } catch (error) {
      setStatus(`Não consegui salvar o peso: ${error.message}`);
      return false;
    } finally { setSavingRecord(false); }
  };

  const saveHealthRecord = async (record, source = "manual") => {
    const title = String(record?.title || "").trim();
    if (!title) { setStatus("Informe um nome ou uma descrição para o registro."); return false; }
    setSavingRecord(true);
    try {
      const current = (await readMilkaData()) || emptyMilkaData();
      const type = RECORD_TYPES[record.type] ? record.type : "note";
      const item = { id: uid(), type, title, details: String(record.details || "").trim(), date: record.date || todayKey(), nextDate: record.nextDate || "", person: record.person || person, weightKg: Number(record.weightKg) || null, createdAt: new Date().toISOString(), source };
      const changes = { healthRecords: [item, ...current.healthRecords].slice(0, 1000) };
      if (type === "weight" && item.weightKg) changes.profile = { ...current.profile, weightKg: item.weightKg, weightUpdatedAt: new Date().toISOString() };
      await persist(changes, `${RECORD_TYPES[type].label} registrado no prontuário.`);
      return item;
    } catch (error) {
      setStatus(`Não consegui salvar no prontuário: ${error.message}`);
      return false;
    } finally { setSavingRecord(false); }
  };

  const remove = async (collection, id, message) => {
    if (!window.confirm("Apagar este registro da Milka?")) return;
    try {
      const current = (await readMilkaData()) || emptyMilkaData();
      await persist({ [collection]: current[collection].filter((item) => item.id !== id) }, message);
    } catch (error) { setStatus(`Não consegui apagar: ${error.message}`); }
  };

  const saveSchedules = async (schedules) => {
    setSavingSchedule(true);
    try { await persist({ schedules }, "Cronograma da Milka salvo para todos."); }
    catch (error) { setStatus(`Não consegui salvar o cronograma: ${error.message}`); }
    finally { setSavingSchedule(false); }
  };

  return {
    savingAction, savingSchedule, savingRecord, registerActivity, saveWeight,
    saveHealthRecord, saveSchedules,
    deleteActivity: (id) => remove("activities", id, "Registro apagado para todos."),
    deleteHealthRecord: (id) => remove("healthRecords", id, "Registro do prontuário apagado."),
  };
}
