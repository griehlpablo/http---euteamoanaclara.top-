import { useMemo } from "react";
import { motion } from "framer-motion";
import MilkaAssistant from "../milka/MilkaAssistant";
import MilkaHealthPanel from "../milka/MilkaHealthPanel";
import MilkaHistoryPanel from "../milka/MilkaHistoryPanel";
import MilkaPersonBar from "../milka/MilkaPersonBar";
import MilkaRoutinePanel from "../milka/MilkaRoutinePanel";
import MilkaTopHeader from "../milka/MilkaTopHeader";
import useMilkaActions from "../milka/useMilkaActions";
import useMilkaCloud from "../milka/useMilkaCloud";
import useMilkaNotifications from "../milka/useMilkaNotifications";
import {
  ACTIONS,
  HOME_WINDOWS,
  RECORD_TYPES,
  getBrasiliaDateKey,
  todayKey,
} from "../milka/config";

export default function MilkaMariaV2() {
  const cloud = useMilkaCloud();
  const actions = useMilkaActions(cloud);
  const reminders = useMilkaNotifications({
    person: cloud.person,
    schedules: cloud.schedules,
    activities: cloud.activities,
    setStatus: cloud.setStatus,
  });

  const todayActivities = useMemo(() => {
    const today = getBrasiliaDateKey();
    return cloud.activities.filter(
      (item) => getBrasiliaDateKey(new Date(item.occurredAt)) === today,
    );
  }, [cloud.activities]);

  const aiContext = useMemo(() => ({
    today: todayKey(),
    currentPerson: cloud.person,
    profile: cloud.profile,
    foodLabel: {
      recommendationByMonth: { 1: 33, 2: 47, 3: 58, 4: 66, 5: 69, "6-12": 70 },
      volumeReference: "200 ml correspondem a aproximadamente 84 g",
      sachetEquivalentDryGrams: 18,
    },
    peopleHomeWindows: HOME_WINDOWS,
    schedules: cloud.schedules,
    todayActivities,
    recentRecords: cloud.healthRecords.slice(0, 20),
  }), [cloud.healthRecords, cloud.person, cloud.profile, cloud.schedules, todayActivities]);

  const confirmSuggestion = async (suggestion) => {
    if (suggestion.kind === "activity" && ACTIONS[suggestion.action]) {
      const occurredAt = suggestion.date
        ? new Date(`${suggestion.date}T12:00:00`).toISOString()
        : new Date().toISOString();
      return actions.registerActivity(
        suggestion.action,
        suggestion.details || suggestion.title || "Registro sugerido",
        cloud.person,
        occurredAt,
      );
    }
    return actions.saveHealthRecord({
      type: RECORD_TYPES[suggestion.type] ? suggestion.type : "note",
      title: suggestion.title || RECORD_TYPES[suggestion.type]?.label || "Registro da Milka",
      details: suggestion.details || "",
      date: suggestion.date || todayKey(),
      nextDate: suggestion.nextDate || "",
      weightKg: suggestion.weightKg || null,
      person: cloud.person,
    }, "ia-confirmada");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl space-y-6 py-6">
      <MilkaTopHeader lastUpdate={cloud.lastUpdate} />
      <MilkaPersonBar person={cloud.person} setPerson={cloud.setPerson} permission={reminders.permission} onEnable={reminders.enable} />
      {cloud.status && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-slate-900 dark:text-rose-300">{cloud.status}</p>}
      <MilkaAssistant context={aiContext} onConfirm={confirmSuggestion} onStatus={cloud.setStatus} />
      <MilkaHealthPanel profile={cloud.profile} person={cloud.person} saving={actions.savingRecord} onSaveWeight={actions.saveWeight} onSaveRecord={actions.saveHealthRecord} />
      <MilkaRoutinePanel schedules={cloud.schedules} savingAction={actions.savingAction} savingSchedule={actions.savingSchedule} onRegister={actions.registerActivity} onSaveSchedules={actions.saveSchedules} />
      <MilkaHistoryPanel loading={cloud.loading} activities={cloud.activities} healthRecords={cloud.healthRecords} onDeleteActivity={actions.deleteActivity} onDeleteRecord={actions.deleteHealthRecord} />
    </motion.div>
  );
}
