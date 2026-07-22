import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TEAM_ID = 6690;
const API_BASES = [
  "https://www.sofascore.com/api/v1",
  "https://api.sofascore.com/api/v1",
];
const OFFICIAL_URL =
  "https://br.volleyballworld.com/volleyball/competitions/volleyball-nations-league/schedule/";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUTS = [
  resolve(ROOT, "calendarios/brasil-volei-feminino.ics"),
  resolve(ROOT, "novo-site/public/calendarios/brasil-volei-feminino.ics"),
];

const FALLBACK = {
  id: "vnl2026-bra-jpn-qf-20260722",
  startTimestamp: Date.parse("2026-07-22T11:30:00Z") / 1000,
  homeTeam: { id: TEAM_ID, name: "Brazil" },
  awayTeam: { name: "Japan" },
  tournament: { name: "Nations League, Women" },
  roundInfo: { name: "Quarterfinals" },
  status: { type: "scheduled" },
  venue: { name: "Macau East Asian Games Dome" },
  fallback: true,
};

const names = new Map([
  ["Brazil", "Brasil"],
  ["Japan", "Japão"],
  ["Netherlands", "Países Baixos"],
  ["Dominican Republic", "República Dominicana"],
  ["Bulgaria", "Bulgária"],
  ["Italy", "Itália"],
  ["France", "França"],
  ["Belgium", "Bélgica"],
  ["Germany", "Alemanha"],
  ["Poland", "Polônia"],
  ["Thailand", "Tailândia"],
  ["United States", "Estados Unidos"],
  ["USA", "Estados Unidos"],
  ["Türkiye", "Turquia"],
  ["Turkey", "Turquia"],
  ["Canada", "Canadá"],
]);

const esc = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
const stamp = (seconds) =>
  new Date(Number(seconds) * 1000)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
const teamName = (team) => {
  const name = String(team?.name || team?.shortName || "Adversário");
  return names.get(name) || name;
};
const phase = (event) => {
  const raw = String(
    event?.roundInfo?.name || event?.roundInfo?.round || "VNL Feminina",
  );
  const value = raw.toLowerCase();
  if (value.includes("quarter")) return "Quartas de final";
  if (value.includes("semi")) return "Semifinal";
  if (value.includes("third") || value.includes("bronze")) {
    return "Disputa de bronze";
  }
  if (value.includes("final")) return "Final";
  return raw;
};
const score = (event) => {
  const home = Number(event?.homeScore?.current);
  const away = Number(event?.awayScore?.current);
  return Number.isFinite(home) && Number.isFinite(away)
    ? `${home} x ${away}`
    : "";
};
const location = (event) =>
  [
    event?.venue?.stadium?.name,
    event?.venue?.name,
    event?.venue?.city?.name,
    event?.venue?.country?.name,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .join(", ") || "Macau, China";
const url = (event) =>
  event?.slug && event?.customId
    ? `https://www.sofascore.com/volleyball/match/${event.slug}/${event.customId}`
    : OFFICIAL_URL;

async function requestJson(path) {
  let lastError;
  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: {
          Accept: "application/json,text/plain,*/*",
          Referer: "https://www.sofascore.com/",
          "User-Agent":
            "Mozilla/5.0 (compatible; euteamoanaclara-calendar/1.0)",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Fonte indisponível");
}

async function loadEvents() {
  const paths = [
    `/team/${TEAM_ID}/events/next/0`,
    `/team/${TEAM_ID}/events/next/1`,
    `/team/${TEAM_ID}/events/last/0`,
  ];
  const responses = await Promise.allSettled(paths.map(requestJson));
  const events = new Map();
  for (const response of responses) {
    if (response.status !== "fulfilled") continue;
    for (const event of response.value?.events || []) {
      const isBrazil =
        Number(event?.homeTeam?.id) === TEAM_ID ||
        Number(event?.awayTeam?.id) === TEAM_ID;
      if (event?.id && event?.startTimestamp && isBrazil) {
        events.set(String(event.id), event);
      }
    }
  }
  const now = Date.now() / 1000;
  const list = [...events.values()]
    .filter(
      (event) =>
        event.startTimestamp >= now - 120 * 86400 &&
        event.startTimestamp <= now + 370 * 86400,
    )
    .sort((a, b) => a.startTimestamp - b.startTimestamp);
  return list.length ? list : [FALLBACK];
}

function eventLines(event, generatedAt) {
  const type = String(event?.status?.type || "").toLowerCase();
  const result = score(event);
  const state =
    type === "finished"
      ? result
        ? `Finalizado: ${result}`
        : "Finalizado"
      : type === "inprogress" || type === "live"
        ? result
          ? `AO VIVO: ${result}`
          : "AO VIVO"
        : type === "postponed"
          ? "Adiado"
          : type === "canceled" || type === "cancelled"
            ? "Cancelado"
            : "Programado";
  const changedAt = Number(
    event?.changes?.changeTimestamp || event.startTimestamp || generatedAt,
  );
  const summaryResult =
    type === "finished" && result ? ` (${result})` : "";
  return [
    "BEGIN:VEVENT",
    `UID:sofascore-${event.id}@euteamoanaclara.top`,
    `DTSTAMP:${stamp(changedAt)}`,
    `LAST-MODIFIED:${stamp(changedAt)}`,
    `SEQUENCE:${Math.max(0, Math.floor(changedAt))}`,
    `DTSTART:${stamp(event.startTimestamp)}`,
    `DTEND:${stamp(Number(event.startTimestamp) + 9000)}`,
    `SUMMARY:${esc(`🏐 ${teamName(event.homeTeam)} x ${teamName(event.awayTeam)} — ${phase(event)}${summaryResult}`)}`,
    `LOCATION:${esc(location(event))}`,
    `DESCRIPTION:${esc(`${state}\n${phase(event)} — ${event?.tournament?.name || "VNL Feminina 2026"}.\nFonte dinâmica: SofaScore. Confirmação oficial: Volleyball World.`)}`,
    `URL:${url(event)}`,
    "CATEGORIES:Vôlei,VNL,Brasil,Ana Clara",
    type === "canceled" || type === "cancelled"
      ? "STATUS:CANCELLED"
      : "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Daqui a 1 hora tem jogo do Brasil no vôlei feminino 🇧🇷🏐",
    "END:VALARM",
    "END:VEVENT",
  ];
}

function buildCalendar(events) {
  const generatedAt = Math.max(
    ...events.map((event) =>
      Number(event?.changes?.changeTimestamp || event.startTimestamp || 0),
    ),
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//euteamoanaclara.top//Brasil Volei Feminino Automatico//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:🇧🇷 Vôlei feminino do Brasil",
    "X-WR-CALDESC:Jogos da Seleção Brasileira feminina de vôlei atualizados automaticamente.",
    "X-WR-TIMEZONE:America/Sao_Paulo",
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
    ...events.flatMap((event) => eventLines(event, generatedAt)),
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}

const events = await loadEvents();
const calendar = buildCalendar(events);
for (const output of OUTPUTS) {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, calendar, "utf8");
}
console.log(`Calendário atualizado com ${events.length} evento(s).`);
