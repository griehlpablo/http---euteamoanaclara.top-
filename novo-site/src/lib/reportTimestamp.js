const TIMEZONE = 'America/Sao_Paulo';

export function buildReportTimestamp(now = new Date()) {
  const local = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now).replace(',', '');
  const hour = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, hour: '2-digit', hour12: false }).format(now));
  return {
    timestamp_local: local,
    timestamp_iso: now.toISOString(),
    timezone: TIMEZONE,
    moment: dayMoment(hour),
  };
}

export function reportTimestampLines(now = new Date()) {
  const stamp = buildReportTimestamp(now);
  return [
    `Exportado em: ${stamp.timestamp_local}`,
    `Timezone: ${stamp.timezone} / Horario de Brasilia`,
    `timestamp_local: ${stamp.timestamp_local}`,
    `timestamp_iso: ${stamp.timestamp_iso}`,
    `timezone: ${stamp.timezone}`,
    `Momento da exportacao: ${stamp.moment}`,
  ];
}

function dayMoment(hour) {
  if (hour >= 5 && hour <= 10) return 'manha';
  if (hour >= 11 && hour <= 13) return 'almoco';
  if (hour >= 14 && hour <= 17) return 'tarde';
  if (hour >= 18 && hour <= 22) return 'noite';
  return 'madrugada';
}
