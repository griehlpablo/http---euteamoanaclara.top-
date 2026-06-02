import { ArrowUp } from 'lucide-react';

export default function QuickNav({ items }) {
  function goTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <nav className="sticky top-20 z-20 -mx-1 overflow-x-auto rounded-3xl border border-white/70 bg-white/80 p-2 shadow-lg backdrop-blur-xl">
        <div className="flex min-w-max gap-2">
          {items.map((item) => (
            <button key={item.id} type="button" onClick={() => goTo(item.id)} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-5 right-5 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl" aria-label="Voltar ao topo">
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}
