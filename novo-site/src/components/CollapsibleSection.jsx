import { useEffect, useState } from 'react';

function readCollapsedMap(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
  } catch {
    return {};
  }
}

export default function CollapsibleSection({ title, subtitle = '', defaultOpen = true, storageKey, sectionId, children, className = '' }) {
  const [open, setOpen] = useState(() => {
    const saved = readCollapsedMap(storageKey);
    return typeof saved[sectionId] === 'boolean' ? !saved[sectionId] : defaultOpen;
  });

  useEffect(() => {
    const saved = readCollapsedMap(storageKey);
    localStorage.setItem(storageKey, JSON.stringify({ ...saved, [sectionId]: !open }));
  }, [open, sectionId, storageKey]);

  return (
    <section id={sectionId} className={className || 'rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-xl backdrop-blur-xl'}>
      <button type="button" onClick={() => setOpen((value) => !value)} className="mb-1 flex w-full items-start justify-between gap-4 text-left">
        <span>
          <span className="block font-serif text-2xl font-bold text-slate-900 md:text-3xl">{title}</span>
          {subtitle && <span className="mt-1 block text-sm font-bold text-slate-500">{subtitle}</span>}
        </span>
        <span className="mt-1 rounded-full bg-white/80 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
