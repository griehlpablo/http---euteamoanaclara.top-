import { Trash2 } from "lucide-react";
import { ACTIONS, RECORD_TYPES, formatDate, formatDateTime } from "./config";

export default function MilkaHistoryPanel({
  loading,
  activities,
  healthRecords,
  onDeleteActivity,
  onDeleteRecord,
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
        <h2 className="mb-4 font-serif text-2xl font-bold">Prontuário recente</h2>
        {healthRecords.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-400">Nenhuma vacina, vermífugo, peso ou consulta registrada.</p>
        ) : (
          <div className="space-y-3">
            {healthRecords.slice(0, 30).map((record) => {
              const config = RECORD_TYPES[record.type] || RECORD_TYPES.note;
              const Icon = config.icon;
              return (
                <div key={record.id} className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 dark:bg-slate-900/70">
                  <div className="rounded-xl bg-violet-50 p-2 text-violet-500 dark:bg-slate-800"><Icon size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{config.label} · {record.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(record.date)} · registrado por {record.person}</p>
                    {record.details && <p className="mt-1 break-words text-sm text-slate-500">{record.details}</p>}
                    {record.nextDate && <p className="mt-1 text-xs font-bold text-amber-700">Próxima data: {formatDate(record.nextDate)}</p>}
                  </div>
                  <button type="button" onClick={() => onDeleteRecord(record.id)} className="rounded-full p-2 text-slate-300 hover:bg-red-50 hover:text-red-500" title="Apagar registro"><Trash2 size={17} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800/75">
        <h2 className="mb-4 font-serif text-2xl font-bold">Cuidados recentes</h2>
        {loading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : activities.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-400">Nenhum cuidado registrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 30).map((activity) => {
              const config = ACTIONS[activity.action] || ACTIONS.food;
              const Icon = config.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 rounded-2xl bg-white/80 p-4 dark:bg-slate-900/70">
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-500 dark:bg-slate-800"><Icon size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{activity.person} · {config.label}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(activity.occurredAt)}</p>
                    {activity.note && <p className="mt-1 break-words text-sm text-slate-500">{activity.note}</p>}
                  </div>
                  <button type="button" onClick={() => onDeleteActivity(activity.id)} className="rounded-full p-2 text-slate-300 hover:bg-red-50 hover:text-red-500" title="Apagar registro"><Trash2 size={17} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
