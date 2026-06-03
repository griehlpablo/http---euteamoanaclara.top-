import { Bell, RotateCcw } from 'lucide-react';

export default function HelenaNotificationSettings({ settings, status, debugLog, pendingSyncCount = 0, syncMeta = {}, onSettings, onEnable, onTest, onClearCache, onSyncPending, onClearPending }) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Notificacoes da Helena</h2>
          <p className="text-xs font-bold text-slate-500">Namespace: planohelena_notification_settings</p>
        </div>
        <button onClick={onEnable} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
          <Bell className="h-4 w-4" /> Ativar
        </button>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {[
          ['enabled', 'Ativar notificacoes da Helena'],
          ['water', 'Agua'],
          ['meals', 'Refeicoes'],
          ['workout', 'Treino'],
          ['preWorkout', 'Pre-treino'],
          ['postWorkout', 'Pos-treino'],
          ['protein', 'Proteina'],
          ['collegeSnack', 'Lanche antes da faculdade'],
          ['weighIn', 'Pesagem quinzenal'],
          ['quietHours', 'Horario silencioso'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-2xl bg-emerald-50/70 px-4 py-3 text-sm font-bold text-slate-700">
            {label}
            <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => onSettings({ [key]: event.target.checked })} className="h-5 w-5 accent-emerald-600" />
          </label>
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <label className="block rounded-2xl bg-white/80 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          Inicio silencioso
          <input type="time" value={settings.quietStart || '23:30'} onChange={(event) => onSettings({ quietStart: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-3 py-2 text-sm text-slate-800 outline-none" />
        </label>
        <label className="block rounded-2xl bg-white/80 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          Fim silencioso
          <input type="time" value={settings.quietEnd || '07:40'} onChange={(event) => onSettings({ quietEnd: event.target.value })} className="mt-1 w-full rounded-2xl bg-white px-3 py-2 text-sm text-slate-800 outline-none" />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => onTest(0)} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Testar agora</button>
        <button onClick={() => onTest(10000)} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Testar em 10s</button>
        <button onClick={() => onTest(60000)} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Testar em 1 min</button>
        <button onClick={() => onTest(0)} className="rounded-2xl bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-900">Diagnostico</button>
        <button onClick={onClearCache} className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
          <RotateCcw className="h-4 w-4" /> Atualizar app / limpar cache
        </button>
      </div>

      <p className="mb-3 rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-slate-600">
        {status || 'As notificacoes desta tela disparam apenas para Helena e usam planohelena_last_notification_at/planohelena_debug_log.'}
      </p>

      <div className="mb-4 rounded-2xl bg-white/80 p-4 text-xs font-bold leading-5 text-slate-600">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-900">Sincronizacao da Helena</p>
            <p>Pendencias locais: {pendingSyncCount}</p>
            <p>Ultima tentativa: {syncMeta.lastAttempt || '-'}</p>
            <p>Ultimo erro: {syncMeta.lastError || '-'}</p>
            <p>Codigo: {syncMeta.lastCode || '-'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSyncPending} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Sincronizar pendencias</button>
            <button type="button" onClick={onClearPending} className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Limpar pendencias</button>
          </div>
        </div>
        <p>Backup local: planohelena_pending_sync</p>
      </div>

      <div className="max-h-32 overflow-auto rounded-2xl bg-slate-50 p-3 text-[11px] font-bold leading-5 text-slate-500">
        {debugLog.length ? debugLog.map((entry) => (
          <div key={entry.id}>{entry.time} - {entry.type}: {entry.message}</div>
        )) : 'Nenhum evento de notificacao da Helena ainda.'}
      </div>
    </section>
  );
}
