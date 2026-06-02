export function getBrasiliaNow(date = new Date()) {
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  const day = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  return { time, day };
}

export function timeToMinutes(value = '00:00') {
  const [hour, minute] = String(value).split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

export function minutesToTime(minutes) {
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour = String(Math.floor(safe / 60)).padStart(2, '0');
  const minute = String(safe % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}
