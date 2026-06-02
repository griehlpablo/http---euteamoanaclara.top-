import { Bell, RotateCcw } from 'lucide-react';

export default function NotificationDiagnostics({ diagnostic, countdown = '', onTestNow, onTestWater10s, onRecalculate, onResetTimers }) {
  const rows = [
    ['Permissao do navegador', diagnostic.permission],
    ['Service Worker ativo', diagnostic.serviceWorkerReady ? 'sim' : 'nao'],
    ['App instalado/PWA', diagnostic.isStandalonePwa ? 'sim' : 'nao'],
    ['Horario de Brasilia', diagnostic.brasilia?.time],
    ['Lembretes de agua ativos', diagnostic.waterEnabled ? 'sim' : 'nao'],
    ['Pessoa ativa neste dispositivo', diagnostic.activePerson],
    ['Meta de agua', `${diagnostic.waterTarget || 0} ml`],
    ['Agua consumida hoje', `${diagnostic.waterMl || 0} ml`],
    ['Proxima notificacao prevista', diagnostic.nextWater || '-'],
    ['Ultima notificacao enviada', diagnostic.lastSent || '-'],
    ['Ultima notificacao bloqueada', diagnostic.lastBlocked || '-'],
    ['Motivo do bloqueio', diagnostic.blockedReason || '-'],
  ];

  return (
    <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-4">
      <h3 className="mb-3 font-serif text-2xl font-bold text-slate-900">Diagnostico de notificacoes</h3>
      <div className="grid gap-2 text-xs font-bold text-slate-700 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/85 px-4 py-3">
            <span className="block text-slate-400">{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      {countdown && <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">{countdown}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onTestNow} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"><Bell className="h-4 w-4" /> Testar agora</button>
        <button type="button" onClick={onTestWater10s} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Agua em 10s</button>
        <button type="button" onClick={onRecalculate} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Recalcular proxima agua</button>
        <button type="button" onClick={onResetTimers} className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700"><RotateCcw className="h-4 w-4" /> Resetar timers</button>
      </div>
    </div>
  );
}
