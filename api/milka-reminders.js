const DATA_URL =
  "https://houqxdlsziscdnnaknlv.supabase.co/storage/v1/object/public/mural/milka/data.json";
const NOTIFICATION_URL =
  "https://houqxdlsziscdnnaknlv.supabase.co/functions/v1/send-notification";
const MILKA_URL = "https://www.euteamoanaclara.top/milka";

const DEFAULT_SCHEDULES = [
  {
    id: "litter-morning",
    action: "litter",
    label: "Limpar a areia pela manhã",
    time: "06:00",
    enabled: true,
    notify: ["Pedro"],
    details: "Retirar fezes e torrões. É a primeira limpeza do dia.",
  },
  {
    id: "food-morning",
    action: "food",
    label: "Ração da manhã",
    time: "06:15",
    enabled: true,
    notify: ["Pablo"],
    details:
      "17 g de ração seca: 2 colheres medidoras de sopa rasas + 2 de chá rasas.",
  },
  {
    id: "water-morning",
    action: "water",
    label: "Trocar a água pela manhã",
    time: "06:20",
    enabled: true,
    notify: ["Pablo"],
    details: "Descartar a água antiga, lavar o pote e colocar água fresca.",
  },
  {
    id: "sachet-midday",
    action: "sachet",
    label: "Refeição do meio-dia",
    time: "12:15",
    enabled: true,
    notify: ["Pablo"],
    details:
      "½ sachê + 8 g de ração seca: 1 colher medidora de sopa rasa + 1 de chá rasa.",
  },
  {
    id: "water-midday",
    action: "water",
    label: "Conferir a água ao meio-dia",
    time: "12:25",
    enabled: true,
    notify: ["Pablo"],
    details: "Conferir o nível e a sujeira; completar ou trocar se necessário.",
  },
  {
    id: "sachet-afternoon",
    action: "sachet",
    label: "Refeição do fim da tarde",
    time: "17:10",
    enabled: true,
    notify: ["Pedro"],
    details:
      "½ sachê + 8 g de ração seca: 1 colher medidora de sopa rasa + 1 de chá rasa.",
  },
  {
    id: "water-evening",
    action: "water",
    label: "Trocar a água à noite",
    time: "18:00",
    enabled: true,
    notify: ["Ana"],
    details: "Colocar água fresca novamente e lavar o pote se estiver sujo.",
  },
  {
    id: "litter-evening",
    action: "litter",
    label: "Limpar a areia à noite",
    time: "18:15",
    enabled: true,
    notify: ["Pedro"],
    details: "Retirar fezes e torrões pela segunda vez no dia.",
  },
  {
    id: "food-night",
    action: "food",
    label: "Ração antes de dormir",
    time: "21:00",
    enabled: true,
    notify: ["Ana"],
    details:
      "17 g de ração seca: 2 colheres medidoras de sopa rasas + 2 de chá rasas.",
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
      message:
        `Está na hora de ${String(item.label || "cuidar da Milka").toLowerCase()}. ${item.details || ""} Abra a página para registrar quem fez.`.trim(),
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
