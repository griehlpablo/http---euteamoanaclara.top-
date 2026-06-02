import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { findFood } from '../lib/foodDatabase';
import { searchFoods } from '../lib/foodSearch';
import { calculateFoodNutrition } from '../lib/nutrition';

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function saveList(key, items) {
  localStorage.setItem(key, JSON.stringify(items.slice(0, 8)));
  return items.slice(0, 8);
}

export default function FoodSearchCalculator({ onAdd, title = 'Calculadora alimentar', defaultMeal = 'extras', allowBarcode = true, storageKey = 'food_search_calculator' }) {
  const [query, setQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState('maca');
  const [recent, setRecent] = useState(() => readList(`${storageKey}_recent`));
  const [favorites, setFavorites] = useState(() => readList(`${storageKey}_favorites`));
  const selected = findFood(selectedSlug);
  const defaultPortion = selected?.default_portions?.[0];
  const [grams, setGrams] = useState(defaultPortion?.grams || 100);
  const results = useMemo(() => searchFoods(query, 8), [query]);
  const nutrition = selected ? calculateFoodNutrition(selected, grams) : null;

  function choose(slug) {
    const food = findFood(slug);
    setSelectedSlug(slug);
    setGrams(food?.default_portions?.[0]?.grams || 100);
  }

  function addSelected() {
    if (!selected || !nutrition) return;
    const item = {
      custom: true,
      label: selected.name,
      category: selected.category,
      amount: 1,
      unit: `${grams}g`,
      grams_or_ml: grams,
      grams,
      foodSlug: selected.slug,
      databaseSlug: selected.slug,
      source: selected.source,
      source_note: selected.source_note,
      ...nutrition,
      notes: `Fonte: ${selected.source} (${selected.source_note})`,
    };
    setRecent(saveList(`${storageKey}_recent`, [item, ...recent.filter((entry) => entry.databaseSlug !== selected.slug)]));
    onAdd?.(item, defaultMeal);
  }

  function toggleFavorite() {
    if (!selected || !nutrition) return;
    const exists = favorites.some((item) => item.databaseSlug === selected.slug);
    const favorite = {
      custom: true,
      label: selected.name,
      category: selected.category,
      amount: 1,
      unit: `${grams}g`,
      grams_or_ml: grams,
      grams,
      foodSlug: selected.slug,
      databaseSlug: selected.slug,
      ...nutrition,
      notes: `Favorito. Fonte: ${selected.source}`,
    };
    setFavorites(saveList(`${storageKey}_favorites`, exists ? favorites.filter((item) => item.databaseSlug !== selected.slug) : [favorite, ...favorites]));
  }

  function addStored(item) {
    onAdd?.(item, defaultMeal);
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
      <h3 className="mb-2 font-serif text-2xl font-bold text-slate-900">{title}</h3>
      <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
        Valores nutricionais sao estimativas e variam por marca, preparo e porcao.
      </p>
      <label className="mb-3 block text-xs font-bold uppercase text-slate-500">
        Buscar alimento
        <div className="mt-1 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="maca, ovos, pao de queijo..." className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none" />
        </div>
      </label>
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {results.map((food) => (
          <button key={food.slug} type="button" onClick={() => choose(food.slug)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold shadow-sm ${selectedSlug === food.slug ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
            {food.name}
            <span className="block text-[11px] opacity-70">{food.category} · {food.source}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-800">{selected.name}</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {selected.default_portions.map((portion) => (
                <button key={portion.label} type="button" onClick={() => setGrams(portion.grams)} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  {portion.label} ({portion.grams} g)
                </button>
              ))}
            </div>
            <label className="block text-xs font-bold uppercase text-slate-500">
              Peso da porcao (g/ml)
              <input type="number" min="0" value={grams} onChange={(event) => setGrams(event.target.value)} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none" />
            </label>
            {allowBarcode && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input placeholder="codigo de barras futuro" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-500 shadow-sm outline-none" />
                <button type="button" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">buscar produto</button>
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
              <span>{nutrition.calories} kcal</span>
              <span>{nutrition.protein} g proteina</span>
              <span>{nutrition.carbs} g carboidratos</span>
              <span>{nutrition.fat} g gorduras</span>
              <span>{nutrition.sugar} g acucar</span>
              <span>{nutrition.fiber} g fibras</span>
              <span>{nutrition.sodium} mg sodio</span>
            </div>
            <button type="button" onClick={addSelected} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
            <button type="button" onClick={toggleFavorite} className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
              {favorites.some((item) => item.databaseSlug === selected.slug) ? 'Remover dos favoritos' : 'Salvar favorito'}
            </button>
          </div>
        </div>
      )}
      {(favorites.length || recent.length) ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Favoritos</p>
            <div className="flex flex-wrap gap-2">
              {favorites.length ? favorites.map((item) => (
                <button key={`fav-${item.databaseSlug}-${item.grams_or_ml}`} type="button" onClick={() => addStored(item)} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  + {item.label}
                </button>
              )) : <span className="text-xs font-bold text-slate-400">Nenhum favorito ainda.</span>}
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Recentes</p>
            <div className="flex flex-wrap gap-2">
              {recent.length ? recent.map((item) => (
                <button key={`recent-${item.databaseSlug}-${item.grams_or_ml}`} type="button" onClick={() => addStored(item)} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                  + {item.label}
                </button>
              )) : <span className="text-xs font-bold text-slate-400">Nada recente ainda.</span>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
