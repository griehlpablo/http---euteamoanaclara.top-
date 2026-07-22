const TEAM_ID = 6690;
const CALENDAR_NAME = "🇧🇷 Vôlei feminino do Brasil";
const OFFICIAL_SCHEDULE_URL =
  "https://br.volleyballworld.com/volleyball/competitions/volleyball-nations-league/schedule/";
const SOFASCORE_BASES = [
  "https://www.sofascore.com/api/v1",
  "https://api.sofascore.com/api/v1",
];

const TEAM_NAMES = new Map([
  ["Brazil", "Brasil"],
  ["Japan", "Japão"],
  ["Netherlands", "Países Baixos"],
  ["Dominican Republic", "República Dominicana"],
  ["Bulgaria", "Bulgária"],
  ["Italy", "Itália"],
  ["France", "França"],
  ["Belgium", "Bélgica"],
  ["China", "China"],
  ["Germany", "Alemanha"],
  ["Poland", "Polônia"],
  ["Thailand", "Tailândia"],
  ["United States", "Estados Unidos"],
  ["USA", "Estados Unidos"],
  ["Türkiye", "Turquia"],
  ["Turkey", "Turquia"],
  ["Canada", "Canadá"],
]);

const FALLBACK_EVENT = {
  id: "vnl-2026-qf-bra-jpn",
  startTimestamp: Math.floor(Date.parse("2026-07-22T11:30:00Z") / 1000),
  homeTeam: { id: TEAM_ID, name: "Brazil" },
  awayTeam: { name: "Japan" },
  tournament: { name: "Nations League, Women" },
  roundInfo: { name: "Quarterfinals" },
  status: { type: "scheduled", description: "Scheduled" },
  venue: {
    stadium: { name: "Macau East Asian Games Dome" },
    city: { name: "Macau" },
  },
  fallback: true,
};

const escapeText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const foldLine = (line) => {
  const chunks = [];
  let remaining = String(line);
  while (remaining.length > 72) {
    chunks.push(remaining.slice(0, 72));
    remaining = remaining.slice(72);
  }
  chunks.push(remaining);
  return chunks.join("\r\n ");
};

const stamp = (seconds) =>
  new Date(Number(seconds) * 1000)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

const translatedTeam = (team) => {
  const name = String(team?.name || team?.shortName || "Adversário").trim();
  return TEAM_NAMES.get(name) || name;
};

const getScore = (event) => {
  const home = Number(event?.homeScore?.current);
  const away = Number(event?.awayScore?.current);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return "";
  return `${home} x ${away}`;
};

const phaseName = (event) => {
  const raw = String(
    event?.roundInfo?.name ||
      event?.roundInfo?.round ||
      event?.tournament?.name ||
      "Jogo",
  );
  const normalized = raw.toLowerCase();
  if (normalized.includes("quarter")) return "Quartas de final";
  if (normalized.includes("semi")) return "Semifinal";
  if (normalized.includes("final")) return "Final";
  if (normalized.includes("third") || normalized.includes("bronze")) {
    return "Disputa de bronze";
  }
  return raw;
};

const eventStatus = (event) => {
  const type = String(event?.status?.type || "").toLowerCase();
  const score = getScore(event);
  if (type === "finished") return score ? `Finalizado: ${score}` : "Finalizado";
  if (type === "inprogress" || type === "live") {
    return score ? `AO VIVO: ${score}` : "AO VIVO";
  }
  if (type === "canceled" || type === "cancelled") return "Cancelado";
  if (type === "postponed") return "Adiado";
  return event?.fallback
    ? "Programado — fonte ao vivo temporariamente indisponível"
    : "Programado";
};

const eventUrl = (event) => {
  if (event?.slug && event?.customId) {
    return `https://www.sofascore.com/volleyball/match/${event.slug}/${event.customId}`;
  }
  return OFFICIAL_SCHEDULE_URL;
};

const locationName = (event) => {
  const values = [
    event?.venue?.stadium?.name,
    event?.venue?.name,
    event?.venue?.city?.name,
    event?.venue?.country?.name,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return [...new Set(values)].join(", ") || "Macau, China";
};

const eventToIcs = (event, generatedAt) => {
  const start = Number(event.startTimestamp);
  const end = start + 2.5 * 60 * 60;
  const home = translatedTeam(event.homeTeam);
  const away = translatedTeam(event.awayTeam);
  const score = getScore(event);
  const statusType = String(event?.status?.type || "").toLowerCase();
  const livePrefix =
    statusType === "inprogress" || statusType === "live" ? "🔴 " : "";
  const resultSuffix =
    statusType === "finished" && score ? ` (${score})` : "";
  const summary = `${livePrefix}🏐 ${home} x ${away} — ${phaseName(event)}${resultSuffix}`;
  const changedAt = Number(event?.changes?.changeTimestamp || generatedAt);
  const sequence = Math.max(0, Math.floor(changedAt));
  const uid = `sofascore-${event.id}@euteamoanaclara.top`;
  const description = [
    eventStatus(event),
    `${phaseName(event)} — ${event?.tournament?.name || "VNL Feminina 2026"}.`,
    "Horário ajustado automaticamente pelo fuso do aparelho.",
    event?.fallback
      ? "Fonte de contingência: Volleyball World / CBV."
      : "Fonte dinâmica: SofaScore. Confirmação oficial: Volleyball World.",
    `Atualizado em ${new Date(generatedAt * 1000).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    })}.`,
  ].join("\n");

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp(changedAt)}`,
    `LAST-MODIFIED:${stamp(changedAt)}`,
    `SEQUENCE:${sequence}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `LOCATION:${escapeText(locationName(event))}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${eventUrl(event)}`,
    "CATEGORIES:Vôlei,VNL,Brasil,Ana Clara",
    statusType === "canceled" || statusType === "cancelled"
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
};

const fetchJson = async (path) => {
  let lastError;
  for (const base of SOFASCORE_BASES) {
    try {
      const response = await fetch(`${base}${path}`, {
        headers: {
          Accept: "application/json,text/plain,*/*",
          Referer: "https://www.sofascore.com/",
          "User-Agent":
            "Mozilla/5.0 (compatible; euteamoanaclara-calendar/1.0; +https://euteamoanaclara.top)",
        },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Fonte esportiva indisponível.");
};

const loadEvents = async () => {
  const paths = [
    `/team/${TEAM_ID}/events/next/0`,
    `/team/${TEAM_ID}/events/next/1`,
    `/team/${TEAM_ID}/events/last/0`,
  ];
  const results = await Promise.allSettled(paths.map(fetchJson));
  const byId = new Map();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const events = Array.isArray(result.value?.events)
      ? result.value.events
      : [];
    for (const event of events) {
      if (!event?.id || !event?.startTimestamp) continue;
      const isBrazil =
        Number(event?.homeTeam?.id) === TEAM_ID ||
        Number(event?.awayTeam?.id) === TEAM_ID;
      if (!isBrazil) continue;
      byId.set(String(event.id), event);
    }
  }

  const now = Date.now() / 1000;
  const lowerBound = now - 120 * 24 * 60 * 60;
  const upperBound = now + 370 * 24 * 60 * 60;
  const events = [...byId.values()]
    .filter(
      (event) =>
        event.startTimestamp >= lowerBound &&
        event.startTimestamp <= upperBound,
    )
    .sort((a, b) => a.startTimestamp - b.startTimestamp);

  return events.length ? events : [FALLBACK_EVENT];
};

const buildCalendar = (events) => {
  const generatedAt = Math.floor(Date.now() / 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//euteamoanaclara.top//Brasil Volei Feminino Dinamico//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${CALENDAR_NAME}`,
    "X-WR-CALDESC:Jogos da Seleção Brasileira feminina de vôlei atualizados automaticamente.",
    "X-WR-TIMEZONE:America/Sao_Paulo",
    "REFRESH-INTERVAL;VALUE=DURATION:PT5M",
    "X-PUBLISHED-TTL:PT5M",
    "SOURCE;VALUE=URI:https://euteamoanaclara.top/calendarios/brasil-volei-feminino.ics",
    ...events.flatMap((event) => eventToIcs(event, generatedAt)),
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
};

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Método não permitido.", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    let events;
    let sourceStatus = "live";
    try {
      events = await loadEvents();
      if (events.length === 1 && events[0].fallback) {
        sourceStatus = "fallback";
      }
    } catch {
      events = [FALLBACK_EVENT];
      sourceStatus = "fallback";
    }

    const body = buildCalendar(events);
    const headers = {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'inline; filename="brasil-volei-feminino.ics"',
      "Cache-Control": "public, max-age=0, must-revalidate",
      "CDN-Cache-Control":
        "public, max-age=300, stale-while-revalidate=3600",
      "Vercel-CDN-Cache-Control":
        "public, max-age=300, stale-while-revalidate=3600",
      "X-Calendar-Source": sourceStatus,
      "X-Robots-Tag": "noindex",
    };

    return new Response(request.method === "HEAD" ? null : body, {
      status: 200,
      headers,
    });
  },
};
