import { getBrasiliaNow, minutesToTime, timeToMinutes } from './time';

export function planWaterReminder({ profile, waterMl = 0, now = new Date(), startTime, endTime }) {
  const target = Number(profile?.waterDefault || profile?.waterTarget?.[0] || profile?.water?.[0] || 0);
  const start = timeToMinutes(startTime || profile?.waterStart || '07:00');
  const end = timeToMinutes(endTime || profile?.waterEnd || '23:30');
  const currentTime = getBrasiliaNow(now).time;
  const current = timeToMinutes(currentTime);
  const consumed = Number(waterMl) || 0;
  const remaining = Math.max(0, target - consumed);
  const hoursLeft = Math.max(0.25, (end - current) / 60);
  const expectedByNow = current <= start ? 0 : target * Math.min(1, (current - start) / Math.max(1, end - start));
  const behind = Math.max(0, expectedByNow - consumed);
  const interval = remaining <= 0 ? 0 : behind > 800 || consumed === 0 ? 45 : behind > 250 ? 60 : 90;
  const nextMinutes = interval ? Math.min(end, current + interval) : null;

  return {
    target,
    consumed,
    remaining,
    hoursLeft: Number(hoursLeft.toFixed(1)),
    neededPerHour: Math.round(remaining / hoursLeft),
    interval,
    nextTime: nextMinutes === null ? '-' : minutesToTime(nextMinutes),
    expectedByNow: Math.round(expectedByNow),
    behind: Math.round(behind),
    inWindow: current >= start && current <= end,
    done: remaining <= 0,
  };
}

export function buildNotificationDiagnostic({
  settings = {},
  profile = {},
  waterMl = 0,
  activePerson = '-',
  lastSent = null,
  lastBlocked = null,
  serviceWorkerReady = false,
  isStandalonePwa = false,
  notificationPermission = 'unsupported',
  now = new Date(),
}) {
  const waterPlan = planWaterReminder({ profile, waterMl, now, startTime: settings.startTime, endTime: settings.endTime });
  const blockedReason = getBlockedReason({ settings, waterPlan, serviceWorkerReady, notificationPermission });
  return {
    permission: notificationPermission,
    serviceWorkerReady,
    isStandalonePwa,
    brasilia: getBrasiliaNow(now),
    waterEnabled: Boolean(settings.water ?? true),
    activePerson,
    waterTarget: waterPlan.target,
    waterMl: Number(waterMl) || 0,
    nextWater: waterPlan.nextTime,
    lastSent,
    lastBlocked,
    blockedReason,
    waterPlan,
  };
}

export function getBlockedReason({ settings = {}, waterPlan, serviceWorkerReady, notificationPermission }) {
  if (typeof Notification === 'undefined' && notificationPermission === 'unsupported') return 'navegador nao suporta notificacao';
  if (notificationPermission !== 'granted') return 'permissao nao concedida';
  if (!serviceWorkerReady) return 'service worker nao registrado';
  if (settings.enabled === false) return 'notificacoes desativadas neste dispositivo';
  if (settings.water === false) return 'tipo agua desativado';
  if (!waterPlan.inWindow) return 'fora da janela de lembrete';
  if (waterPlan.done) return 'meta de agua ja batida';
  return '-';
}

export function buildWaterMessage(personName, plan) {
  if (plan.done) return `${personName}, meta de agua batida. Boa.`;
  if (plan.consumed === 0 && plan.behind > 400) return `${personName}, agua zerada ainda. Toma 300 ml agora para nao correr atras so a noite.`;
  if (plan.behind > 800) return `${personName}, agua ficou atrasada. Toma 300 ml agora e deixa uma garrafa por perto.`;
  return `${personName}, hora da agua. Tenta tomar 250 ml agora.`;
}
