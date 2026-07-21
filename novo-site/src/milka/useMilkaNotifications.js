import { useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import {
  EXTERNAL_IDS,
  LOCAL_REMINDERS_KEY,
  getBrasiliaDateKey,
  scheduleDate,
} from "./config";

const showNotification = async (title, body, tag) => {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body, icon: "/images/icon-192.png", badge: "/images/icon-192.png", tag, renotify: false, data: { url: "/milka" } });
      return;
    } catch { /* usa a API direta */ }
  }
  new Notification(title, { body, icon: "/images/icon-192.png", tag });
};

export default function useMilkaNotifications({ person, schedules, activities, setStatus }) {
  const [permission, setPermission] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);

  useEffect(() => {
    if (permission !== "granted") return undefined;
    const check = async () => {
      const now = new Date();
      const dateKey = getBrasiliaDateKey(now);
      const sent = JSON.parse(localStorage.getItem(LOCAL_REMINDERS_KEY) || "{}");
      for (const item of schedules) {
        if (!item.enabled || !item.notify?.includes(person)) continue;
        const dueAt = scheduleDate(dateKey, item.time);
        const delay = now.getTime() - dueAt.getTime();
        if (delay < 0 || delay > 45 * 60000) continue;
        const key = `${dateKey}:${item.id}:${person}`;
        if (sent[key]) continue;
        const completed = activities.some((activity) => activity.action === item.action && new Date(activity.occurredAt) >= dueAt);
        if (!completed) await showNotification("Cuidados da Milka Maria 🐾", `${person}, está na hora de ${item.label.toLowerCase()}. ${item.details || ""}`.trim(), `milka-${item.id}-${dateKey}`);
        sent[key] = completed ? "completed" : new Date().toISOString();
      }
      localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(sent));
    };
    check();
    const interval = window.setInterval(check, 30000);
    return () => window.clearInterval(interval);
  }, [activities, permission, person, schedules]);

  const enable = async () => {
    if (typeof Notification === "undefined") { setStatus("Este navegador não oferece notificações."); return; }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") { setStatus("A permissão de notificação não foi concedida neste celular."); return; }
    try {
      await OneSignal.login(EXTERNAL_IDS[person]);
      await OneSignal.User.addTag("usuario", person.toLowerCase());
    } catch (error) { console.warn("Não foi possível identificar este aparelho:", error); }
    await showNotification("Lembretes da Milka ativados 🐾", `Este celular receberá os lembretes de ${person}.`, "milka-notification-test");
    setStatus(`Notificações ativadas neste celular para ${person}.`);
  };

  return { permission, enable };
}
