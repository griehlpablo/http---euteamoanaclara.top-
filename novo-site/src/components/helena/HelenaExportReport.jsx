import { Clipboard, Download } from 'lucide-react';

export default function HelenaExportReport({ report, onGenerate, onCopy }) {
  function download() {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-helena-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Exportar Helena para ChatGPT</h2>
          <p className="text-sm text-slate-500">Relatorio proprio da Helena, com os dados do dia.</p>
        </div>
        <button onClick={onGenerate} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">Gerar relatorio</button>
      </div>
      <textarea readOnly value={report} placeholder="Clique em Gerar relatorio." className="min-h-72 w-full rounded-2xl border border-white/70 bg-white/80 p-4 font-mono text-xs text-slate-700 outline-none" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={onCopy} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          <Clipboard className="h-4 w-4" /> Copiar Helena
        </button>
        <button onClick={download} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          <Download className="h-4 w-4" /> Baixar .txt
        </button>
      </div>
    </section>
  );
}
