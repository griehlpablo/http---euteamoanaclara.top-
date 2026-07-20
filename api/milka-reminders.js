const DATA_URL =
  "https://houqxdlsziscdnnaknlv.supabase.co/storage/v1/object/public/mural/milka/data.json";
const NOTIFICATION_URL =
  "https://houqxdlsziscdnnaknlv.supabase.co/functions/v1/send-notification";
const MILKA_URL = "https://www.euteamoanaclara.top/milka";

const DEFAULT_SCHEDULES = [
  {
    id: "food-morning",
    action: "food",
    label: "Ração da manhã",
    time: "07:00",
    enabled: true,
    notify: ["Pablo"],
  },
  {
    id: "water-morning",
    action: "water",
    label: "Trocar a água",
    time: "07:10",
    enabled: true,
    notify: ["Pablo"],
  },
  {
    id: "litter-midday",
    action: "litter",
    label: "Limpar a areia ao meio-dia",
    time: "12:15",
    enabled: true,
    notify: ["Pablo"],
  },
  {
    id: "sachet-afternoon",
    action: "sachet",
    label: "Sachê da tarde",
    time: "13:10",
    enabled: true,
    notify: ["Ana"],
  },
  {
    id: "food-evening",
    action: "food",
    label: "Ração da noite",
    time: "18:00",
    enabled: true,
    notify: ["Pedro"],
  },
  {
    id: "litter-evening",
    action: "litter",
    label: "Limpar a areia à noite",
    time: "21:00",
    enabled: true,
    notify: ["Ana"],
  },
];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

const getBrasiliaParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
};

const scheduleDate = (dateKey, time) => new Date(`${dateKey}T${time}:00-03:00`);

async function readData() {
  const response = await fetch(`${DATA_URL}?v=${Date.now()}`, {
    cache: "no-store",
  });
  if (response.status === 404)
    return { activities: [], schedules: DEFAULT_SCHEDULES };
  if (!response.ok)
    throw new Error(`Arquivo da Milka respondeu ${response.status}`);
  const data = await response.json();
  return {
    activities: Array.isArray(data.activities) ? data.activities : [],
    schedules:
      Array.isArray(data.schedules) && data.schedules.length
        ? data.schedules
        : DEFAULT_SCHEDULES,
  };
}

async function sendPush(target, item) {
  const response = await fetch(NOTIFICATION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetUser: String(target).toLowerCase(),
      title: "Cuidados da Milka Maria 🐾",
      message: `Está na hora de ${String(item.label || "cuidar da Milka").toLowerCase()}. Abra a página para registrar quem fez.`,
      url: MILKA_URL,
      data: { source: "milka-reminder", scheduleId: item.id },
    }),
  });
  return { target, ok: response.ok, status: response.status };
}

export default {
  async fetch(request) {
    const secret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization") || "";
    const userAgent = request.headers.get("user-agent") || "";

    if (secret) {
      if (authorization !== `Bearer ${secret}`)
        return json({ ok: false, error: "Não autorizado." }, 401);
    } else if (userAgent !== "vercel-cron/1.0") {
      return json({ ok: false, error: "Rota exclusiva do cron." }, 401);
    }

    try {
      const data = await readData();
      const now = new Date();
      const { dateKey, hour, minute } = getBrasiliaParts(now);
      const results = [];

      for (const item of data.schedules) {
        const [itemHour, itemMinute] = String(item.time).split(":").map(Number);
        if (!item.enabled || itemHour !== hour || itemMinute !== minute)
          continue;
        const dueAt = scheduleDate(dateKey, item.time);
        if (now.getTime() < dueAt.getTime()) {
          results.push({ scheduleId: item.id, skipped: "not-due-yet" });
          continue;
        }

        const completed = data.activities.some(
          (activity) =>
            activity.action === item.action &&
            new Date(activity.occurredAt).getTime() >= dueAt.getTime(),
        );

        if (completed) {
          results.push({ scheduleId: item.id, skipped: "completed" });
          continue;
        }

        const targets =
          Array.isArray(item.notify) && item.notify.length
            ? item.notify
            : ["Ana", "Pablo"];
        const deliveries = await Promise.all(
          targets.map((target) => sendPush(target, item)),
        );
        results.push({ scheduleId: item.id, deliveries });
      }

      return json({
        ok: true,
        dateKey,
        hour,
        minute,
        checked: data.schedules.length,
        results,
      });
    } catch (error) {
      return json(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        500,
      );
    }
  },
};
