import { Plus, Trash2 } from 'lucide-react';
import { HELENA_CATEGORIES, HELENA_FOODS, HELENA_MEAL_OPTIONS, HELENA_MEALS, HELENA_UNITS } from './helenaData';
import CollapsibleSection from '../CollapsibleSection';

function TextInput(props) {
  return <input {...props} className={`w-full rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100 ${props.className || ''}`} />;
}

function SelectInput(props) {
  return <select {...props} className={`w-full rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100 ${props.className || ''}`} />;
}

export default function HelenaMealLogger({ log, onToggleFood, onUpdateFood, onAddCustom, onUpdateCustom, onRemoveCustom }) {
  const wheyEnabled = log.wheyStatus !== 'nao';

  return (
    <section className="space-y-5">
      {Object.entries(HELENA_MEAL_OPTIONS).map(([meal, foods]) => (
        <CollapsibleSection key={meal} title={HELENA_MEALS[meal]} defaultOpen={['breakfast', 'lunch', 'snack', 'dinner'].includes(meal)} storageKey="planohelena_collapsed_sections" sectionId={meal} className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
          <div className="space-y-3">
            {foods
              .filter((key) => wheyEnabled || !key.includes('whey'))
              .map((foodKey) => {
                const food = HELENA_FOODS[foodKey];
                const item = (log.meals[meal] || []).find((entry) => entry.food === foodKey && !entry.custom);
                return (
                  <div key={foodKey} className="grid gap-2 rounded-2xl bg-emerald-50/60 p-3 sm:grid-cols-[1fr_110px_110px_1fr] sm:items-center">
                    <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                      <input type="checkbox" checked={Boolean(item)} onChange={(event) => onToggleFood(meal, foodKey, event.target.checked)} className="h-5 w-5 accent-emerald-600" />
                      {food.label}
                    </label>
                    <TextInput type="number" min="0" value={item?.amount || ''} placeholder="Qtd." onChange={(event) => onUpdateFood(meal, foodKey, { amount: event.target.value })} />
                    <SelectInput value={item?.unit || food.unit} onChange={(event) => onUpdateFood(meal, foodKey, { unit: event.target.value })}>
                      {HELENA_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                    </SelectInput>
                    <TextInput value={item?.note || ''} placeholder="Obs." onChange={(event) => onUpdateFood(meal, foodKey, { note: event.target.value })} />
                  </div>
                );
              })}

            {(log.meals[meal] || []).filter((item) => item.custom).map((item) => (
              <div key={item.id} className="rounded-2xl border border-emerald-100 bg-white/80 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Outro personalizado</p>
                  <button onClick={() => onRemoveCustom(meal, item.id)} className="rounded-full bg-red-50 p-2 text-red-600" aria-label="Remover item personalizado">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextInput value={item.label || ''} placeholder="Nome" onChange={(event) => onUpdateCustom(meal, item.id, { label: event.target.value })} />
                  <TextInput value={item.brand_name || ''} placeholder="Marca/produto" onChange={(event) => onUpdateCustom(meal, item.id, { brand_name: event.target.value })} />
                  <SelectInput value={item.category || 'outro'} onChange={(event) => onUpdateCustom(meal, item.id, { category: event.target.value })}>
                    {HELENA_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </SelectInput>
                  <TextInput type="number" min="0" value={item.amount || ''} placeholder="Quantidade" onChange={(event) => onUpdateCustom(meal, item.id, { amount: event.target.value })} />
                  <SelectInput value={item.unit || 'g'} onChange={(event) => onUpdateCustom(meal, item.id, { unit: event.target.value })}>
                    {HELENA_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </SelectInput>
                  <TextInput type="number" min="0" value={item.calories || ''} placeholder="Calorias estimadas" onChange={(event) => onUpdateCustom(meal, item.id, { calories: event.target.value })} />
                  <TextInput type="number" min="0" value={item.protein || ''} placeholder="Proteina estimada" onChange={(event) => onUpdateCustom(meal, item.id, { protein: event.target.value })} />
                  <TextInput type="number" min="0" value={item.carbs || ''} placeholder="Carboidratos estimados" onChange={(event) => onUpdateCustom(meal, item.id, { carbs: event.target.value })} />
                  <TextInput type="number" min="0" value={item.fat || ''} placeholder="Gorduras estimadas" onChange={(event) => onUpdateCustom(meal, item.id, { fat: event.target.value })} />
                  <TextInput type="number" min="0" value={item.sugar || ''} placeholder="Acucar estimado" onChange={(event) => onUpdateCustom(meal, item.id, { sugar: event.target.value })} />
                  <TextInput type="number" min="0" value={item.fiber || ''} placeholder="Fibras estimadas" onChange={(event) => onUpdateCustom(meal, item.id, { fiber: event.target.value })} />
                  <TextInput type="number" min="0" value={item.sodium || ''} placeholder="Sodio estimado" onChange={(event) => onUpdateCustom(meal, item.id, { sodium: event.target.value })} />
                  <TextInput value={item.notes || ''} placeholder="Observacao" onChange={(event) => onUpdateCustom(meal, item.id, { notes: event.target.value })} />
                </div>
              </div>
            ))}

            <button onClick={() => onAddCustom(meal)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-200 bg-white/80 px-4 py-3 text-sm font-bold text-emerald-700">
              <Plus className="h-4 w-4" /> Adicionar outro
            </button>
          </div>
        </CollapsibleSection>
      ))}
    </section>
  );
}
