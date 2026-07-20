import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import OneSignal from 'react-onesignal';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Clock3,
  Droplets,
  PackagePlus,
  PawPrint,
  Save,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
} from 'lucide-react';
import { supabase } from '../supabase';

const DEVICE_PERSON_KEY = 'milka-device-person-v1';
const LOCAL_REMINDERS_KEY = 'milka-local-reminders-v1';

const PEOPLE = ['Pedro', 'Ana', 'Pablo'];
const EXTERNAL_IDS = {
  Pedro: '@pedro_milka',
  Ana: '@anakov_',
  Pablo: '@griehl_',
};

const ACTIONS = {
  food: { label: 'Deu ração', short: 'Ração', icon: Utensils, group: 'care' },
  sachet: { label: 'Deu sachê', short: 'Sachê', icon: PackagePlus, group: 'care' },
  water: { label: 'Trocou a água', short: 'Água', icon: Droplets, group: 'care' },
  litter: { label: 'Limpou a areia', short: 'Areia', icon: Sparkles, group: 'care' },
  bought_food: { label: 'Comprou ração', short: 'Compra de ração', icon: ShoppingBag, group: 'purchase' },
  bought_sachet: { label: 'Comprou sachê', short: 'Compra de sachê', icon: ShoppingBag, group: 'purchase' },
  bought_litter: { label: 'Comprou areia', short: 'Compra de areia', icon: ShoppingBag, group: 'purchase' },
};

const DEFAULT_SCHEDULES = [
  { id: 'food-morning', action: 'food', label: 'Ração da manhã', time: '08:00', enabled: true, notify: PEOPLE },
  { id: 'water-morning', action: 'water', label: 'Trocar a água', time: '09:00', enabled: true, notify: PEOPLE },
  { id: 'sachet-evening', action: 'sachet', label: 'Sachê', time: '19:00', enabled: true, notify: PEOPLE },
  { id: 'food-evening', action: 'food', label: 'Ração da noite', time: '20:00', enabled: true, notify: PEOPLE },
  { id: 'litter-evening', action: 'litter', label: 'Limpar a areia', time: '21:00', enabled: true, notify: PEOPLE },
];

const parsePayload = (record) => {
  try {
    const parsed = JSON.parse(record.text || '{}');
    return { ...parsed, recordId: record.id, recordTimestamp: record.timestamp };
  } catch {
    return null;
  }
};

const formatDateTime = (value) => {
  if (!value) return 'Ainda não registrado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const relativeTime = (value) => {
  if (!value) return 'Nunca';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Há ${days} dia${days === 1 ? '' : 's'}`;
};

const getBrasiliaParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
};

const scheduleDate = (dateKey, time) => new Date(`${dateKey}T${time}:00-03:00`);

const showDeviceNotification = async (title, body, tag) => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        body,
        icon: '/images/icon-192.png',
        badge: '/images/icon-192.png',
        tag,
        renotify: false,
        data: { url: '/milka' },
      });
      return;
    } catch {
      // O navegador ainda pode exibir a notificação sem o service worker.
    }
  }

  new Notification(title, { body, icon: '/images/icon-192.png', tag });
};

export default function MilkaMaria() {
  const [person, setPerson] = useState(() => localStorage.getItem(DEVICE_PERSON_KEY) || 'Pablo');
  const [activities, setActivities] = useState([]);
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mural')
      .select('*')
      .like('author', 'milka:%')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) {
      setStatus(`Não consegui carregar os registros: ${error.message}`);
      setLoading(false);
      return;
    }

    const parsed = (data || []).map(parsePayload).filter(Boolean);
    const activityRows = parsed
      .filter((item) => item.kind === 'milka-activity')
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    const scheduleRow = parsed.find((item) => item.kind === 'milka-schedule-set');

    setActivities(activityRows);
    if (Array.isArray(scheduleRow?.schedules) && scheduleRow.schedules.length) {
      setSchedules(scheduleRow.schedules);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('milka-care-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mural' },
        (payload) => {
          const author = payload.new?.author || payload.old?.author || '';
          if (String(author).startsWith('milka:')) loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(DEVICE_PERSON_KEY, person);
  }, [person]);

  const latestByAction = useMemo(() => {
    const result = {};
    for (const activity of activities) {
      if (!result[activity.action]) result[activity.action] = activity;
    }
    return result;
  }, [activities]);

  useEffect(() => {
    if (notificationPermission !== 'granted') return undefined;

    const checkReminders = async () => {
      const now = new Date();
      const { dateKey } = getBrasiliaParts(now);
      const sent = JSON.parse(localStorage.getItem(LOCAL_REMINDERS_KEY) || '{}');

      for (const item of schedules) {
        if (!item.enabled || !item.notify?.includes(person)) continue;
        const dueAt = scheduleDate(dateKey, item.time);
        const delay = now.getTime() - dueAt.getTime();
        if (delay < 0 || delay > 45 * 60000) continue;

        const key = `${dateKey}:${item.id}:${person}`;
        if (sent[key]) continue;

        const completed = activities.some(
          (activity) =>
            activity.action === item.action &&
            new Date(activity.occurredAt).getTime() >= dueAt.getTime(),
        );
        if (completed) {
          sent[key] = 'completed';
          continue;
        }

        await showDeviceNotification(
          'Cuidados da Milka Maria 🐾',
          `${person}, está na hora de ${item.label.toLowerCase()}.`,
          `milka-${item.id}-${dateKey}`,
        );
        sent[key] = new Date().toISOString();
      }

      localStorage.setItem(LOCAL_REMINDERS_KEY, JSON.stringify(sent));
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(interval);
  }, [activities, notificationPermission, person, schedules]);

  const registerActivity = async (action) => {
    setSavingAction(action);
    setStatus('');
    const occurredAt = new Date().toISOString();
    const payload = {
      kind: 'milka-activity',
      action,
      person,
      note: note.trim(),
      occurredAt,
    };

    const { data, error } = await supabase
      .from('mural')
      .insert([
        {
          text: JSON.stringify(payload),
          author: `milka:activity:${person.toLowerCase()}`,
          imageUrl: null,
          timestamp: occurredAt,
          likes: [],
        },
      ])
      .select()
      .single();

    if (error) {
      setStatus(`Não consegui registrar: ${error.message}`);
    } else {
      setActivities((current) => [parsePayload(data), ...current].filter(Boolean));
      setNote('');
      setStatus(`${ACTIONS[action].label} por ${person} às ${formatDateTime(occurredAt)}.`);
    }
    setSavingAction('');
  };

  const deleteActivity = async (recordId) => {
    if (!window.confirm('Apagar este registro da Milka?')) return;
    const { error } = await supabase.from('mural').delete().eq('id', recordId);
    if (error) {
      setStatus(`Não consegui apagar: ${error.message}`);
      return;
    }
    setActivities((current) => current.filter((item) => item.recordId !== recordId));
  };

  const updateSchedule = (id, changes) => {
    setSchedules((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  };

  const saveSchedules = async () => {
    setSavingSchedule(true);
    setStatus('');
    const timestamp = new Date().toISOString();

    const { error: deleteError } = await supabase
      .from('mural')
      .delete()
      .eq('author', 'milka:schedule');

    if (deleteError) {
      setStatus(`Não consegui atualizar o cronograma: ${deleteError.message}`);
      setSavingSchedule(false);
      return;
    }

    const { error } = await supabase.from('mural').insert([
      {
        text: JSON.stringify({ kind: 'milka-schedule-set', schedules, updatedAt: timestamp }),
        author: 'milka:schedule',
        imageUrl: null,
        timestamp,
        likes: [],
      },
    ]);

    setStatus(error ? `Não consegui salvar: ${error.message}` : 'Cronograma da Milka salvo para todos.');
    setSavingSchedule(false);
  };

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      setStatus('Este navegador não oferece notificações.');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission !== 'granted') {
      setStatus('A permissão de notificação não foi concedida neste celular.');
      return;
    }

    try {
      await OneSignal.login(EXTERNAL_IDS[person]);
      await OneSignal.User.addTag('usuario', person.toLowerCase());
    } catch (error) {
      console.warn('Não foi possível identificar este aparelho no OneSignal:', error);
    }

    await showDeviceNotification(
      'Lembretes da Milka ativados 🐾',
      `Este celular receberá os lembretes de ${person}.`,
      'milka-notification-test',
    );
    setStatus(`Notificações ativadas neste celular para ${person}.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl space-y-6 py-6"
    >
      <header className="flex items-center justify-between gap-4">
        <Link
          to="/central"
          className="rounded-full bg-white/75 p-3 text-rose-500 shadow-md transition hover:scale-105 dark:bg-slate-800/75"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="text-right">
          <h1 className="flex items-center justify-end gap-2 font-serif text-3xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
            Milka Maria <PawPrint className="text-rose-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Alimentação, higiene, compras e lembretes compartilhados.
          </p>
        </div>
      </header>

      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/75">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Quem está registrando?
            </label>
            <div className="flex flex-wrap gap-2">
              {PEOPLE.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setPerson(name)}
                  className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                    person === name
                      ? 'bg-rose-500 text-white shadow-lg'
                      : 'bg-rose-50 text-rose-600 dark:bg-slate-900 dark:text-rose-300'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={enableNotifications}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white dark:bg-rose-500"
          >
            {notificationPermission === 'granted' ? <BellRing size={18} /> : <Bell size={18} />}
            {notificationPermission === 'granted' ? 'Notificações ativas' : 'Ativar neste celular'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['food', 'sachet', 'water', 'litter'].map((action) => {
          const config = ACTIONS[action];
          const latest = latestByAction[action];
          const Icon = config.icon;
          return (
            <article
              key={action}
              className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg dark:border-slate-700 dark:bg-slate-800/75"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-2xl bg-rose-50 p-3 text-rose-500 dark:bg-slate-900">
                  <Icon size={22} />
                </div>
                <span className="text-xs font-bold text-slate-400">{relativeTime(latest?.occurredAt)}</span>
              </div>
              <h2 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-100">
                {config.short}
              </h2>
              <p className="mt-1 text-sm font-bold text-rose-500">
                {latest ? `${latest.person} foi a última pessoa` : 'Sem registro'}
              </p>
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(latest?.occurredAt)}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-rose-50 p-3 text-rose-500 dark:bg-slate-900">
            <PawPrint />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
              Registrar cuidado agora
            </h2>
            <p className="text-xs text-slate-500">O horário exato é registrado automaticamente.</p>
          </div>
        </div>

        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Observação opcional: quantidade, marca, estoque..."
          className="mb-4 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-900"
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(ACTIONS)
            .filter(([, config]) => config.group === 'care')
            .map(([action, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={action}
                  type="button"
                  disabled={Boolean(savingAction)}
                  onClick={() => registerActivity(action)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-4 text-sm font-bold text-white shadow-md transition hover:bg-rose-600 disabled:opacity-50"
                >
                  <Icon size={19} />
                  {savingAction === action ? 'Registrando...' : config.label}
                </button>
              );
            })}
        </div>

        <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-slate-500">
          Registrar compra
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(ACTIONS)
            .filter(([, config]) => config.group === 'purchase')
            .map(([action, config]) => (
              <button
                key={action}
                type="button"
                disabled={Boolean(savingAction)}
                onClick={() => registerActivity(action)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <ShoppingBag size={18} />
                {savingAction === action ? 'Registrando...' : config.label}
              </button>
            ))}
        </div>

        {status && (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-slate-900 dark:text-rose-300">
            {status}
          </p>
        )}
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
              <Clock3 className="text-violet-500" /> Cronograma da Milka
            </h2>
            <p className="text-xs text-slate-500">
              Os horários são compartilhados. Cada aparelho ativa as próprias notificações.
            </p>
          </div>
          <button
            type="button"
            onClick={saveSchedules}
            disabled={savingSchedule}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Save size={18} /> {savingSchedule ? 'Salvando...' : 'Salvar cronograma'}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {schedules.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-slate-900/70"
            >
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={(event) => updateSchedule(item.id, { enabled: event.target.checked })}
                className="h-5 w-5 accent-violet-600"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">{item.label}</p>
                <p className="text-xs text-slate-400">Todos os dias · Pedro, Ana e Pablo</p>
              </div>
              <input
                type="time"
                value={item.time}
                onChange={(event) => updateSchedule(item.id, { time: event.target.value })}
                className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
        <h2 className="mb-4 font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
          Histórico recente
        </h2>
        {loading ? (
          <p className="text-sm text-slate-400">Carregando os cuidados da Milka...</p>
        ) : activities.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 dark:border-slate-700">
            Nenhum cuidado registrado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 40).map((activity) => {
              const config = ACTIONS[activity.action] || ACTIONS.food;
              const Icon = config.icon;
              return (
                <div
                  key={activity.recordId}
                  className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 dark:bg-slate-900/70"
                >
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-500 dark:bg-slate-800">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {activity.person} · {config.label}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateTime(activity.occurredAt)}</p>
                    {activity.note && (
                      <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-300">
                        {activity.note}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteActivity(activity.recordId)}
                    className="rounded-full p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    title="Apagar registro"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
