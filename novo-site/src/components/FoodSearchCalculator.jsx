import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Plus, Search, Square } from 'lucide-react';
import { FOOD_DATABASE, findFood, loadFoodDatabase } from '../lib/foodDatabase';
import { startBarcodeScanner, stopBarcodeScanner } from '../lib/barcodeScanner';
import { checkOnlineStatus, getOpenFoodFactsDiagnostic, lookupOpenFoodFactsByBarcode, searchOpenFoodFacts } from '../lib/openFoodFacts';
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

function readObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    localStorage.removeItem(key);
    return {};
  }
}

function formatDiagnosticValue(value) {
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function emptyManual() {
  return {
    name: '',
    brand_name: '',
    barcode: '',
    amount: '100',
    unit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    sugar: '',
    fiber: '',
    sodium: '',
    category: 'industrializado',
    hydration_factor: '',
    is_liquid: false,
  };
}

const manualFields = [
  ['name', 'Nome'],
  ['brand_name', 'Marca'],
  ['barcode', 'Codigo de barras'],
  ['amount', 'Quantidade'],
  ['unit', 'Unidade'],
  ['calories', 'Kcal por 100'],
  ['protein', 'Proteina por 100'],
  ['carbs', 'Carboidratos por 100'],
  ['fat', 'Gordura por 100'],
  ['sugar', 'Acucar por 100'],
  ['fiber', 'Fibra por 100'],
  ['sodium', 'Sodio mg por 100'],
  ['category', 'Categoria'],
  ['hydration_factor', 'Fator hidratacao'],
];

export default function FoodSearchCalculator({ onAdd, title = 'Calculadora alimentar', defaultMeal = 'extras', mealOptions = [], allowBarcode = true, storageKey = 'food_search_calculator' }) {
  const prefix = storageKey.startsWith('planohelena') ? 'planohelena' : storageKey.startsWith('diet') ? 'diet' : storageKey;
  const [query, setQuery] = useState('');
  const [onlineQuery, setOnlineQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');
  const [selectedSlug, setSelectedSlug] = useState('maca');
  const [selectedOnline, setSelectedOnline] = useState(null);
  const [targetMeal, setTargetMeal] = useState(defaultMeal);
  const [brandName, setBrandName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [manual, setManual] = useState(emptyManual());
  const [database, setDatabase] = useState(FOOD_DATABASE);
  const [onlineResults, setOnlineResults] = useState([]);
  const [onlineMessage, setOnlineMessage] = useState('');
  const [diagnostic, setDiagnostic] = useState(() => getOpenFoodFactsDiagnostic());
  const [showRawDebug, setShowRawDebug] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [recent, setRecent] = useState(() => readList(`${storageKey}_recent`));
  const [favorites, setFavorites] = useState(() => readList(`${storageKey}_favorites`));
  const [customFoods, setCustomFoods] = useState(() => readList(`${prefix}_custom_foods`));
  const videoRef = useRef(null);
  const selected = database.find((item) => item.slug === selectedSlug) || findFood(selectedSlug);
  const defaultPortion = selected?.default_portions?.[0];
  const [grams, setGrams] = useState(defaultPortion?.grams || 100);
  const mergedDatabase = useMemo(() => [...customFoods, ...database], [customFoods, database]);
  const results = useMemo(() => searchFoods(query, 8, mergedDatabase), [mergedDatabase, query]);
  const nutrition = selected ? calculateFoodNutrition(selected, grams) : null;
  const onlineNutrition = selectedOnline ? calculateFoodNutrition(selectedOnline, grams) : null;
  const cacheKey = `${prefix}_openfoodfacts_cache`;

  useEffect(() => {
    let active = true;
    loadFoodDatabase().then((items) => {
      if (active) setDatabase([...customFoods, ...items]);
    });
    return () => {
      active = false;
      stopBarcodeScanner();
    };
  }, []);

  function choose(slug) {
    const food = mergedDatabase.find((item) => item.slug === slug) || findFood(slug);
    setSelectedSlug(slug);
    setSelectedOnline(null);
    setGrams(food?.default_portions?.[0]?.grams || 100);
    setBrandName('');
  }

  function addSelected() {
    if (!selected || !nutrition) return;
    const item = {
      custom: true,
      label: selected.name,
      category: selected.category,
      amount: grams,
      unit: selected.unit || 'g',
      grams_or_ml: grams,
      grams,
      foodSlug: selected.slug,
      databaseSlug: selected.slug,
      brand_name: brandName.trim(),
      source: selected.source,
      source_id: selected.source_id,
      source_note: selected.source_note,
      hydration_factor: selected.hydration_factor,
      is_water: selected.is_water,
      is_liquid: selected.is_liquid,
      warning_zero: selected.warning_zero,
      warning_sugar: selected.warning_sugar,
      ...nutrition,
      notes: `${brandName.trim() ? `Produto: ${brandName.trim()}. ` : ''}Fonte: ${selected.source} (${selected.source_note})`,
    };
    setRecent(saveList(`${storageKey}_recent`, [item, ...recent.filter((entry) => entry.databaseSlug !== selected.slug)]));
    onAdd?.(item, targetMeal);
  }

  function toggleFavorite() {
    if (!selected || !nutrition) return;
    const exists = favorites.some((item) => item.databaseSlug === selected.slug);
    const favorite = {
      custom: true,
      label: selected.name,
      category: selected.category,
      amount: grams,
      unit: selected.unit || 'g',
      grams_or_ml: grams,
      grams,
      foodSlug: selected.slug,
      databaseSlug: selected.slug,
      brand_name: brandName.trim(),
      source: selected.source,
      source_id: selected.source_id,
      source_note: selected.source_note,
      hydration_factor: selected.hydration_factor,
      is_water: selected.is_water,
      is_liquid: selected.is_liquid,
      warning_zero: selected.warning_zero,
      warning_sugar: selected.warning_sugar,
      ...nutrition,
      notes: `${brandName.trim() ? `Produto: ${brandName.trim()}. ` : ''}Favorito. Fonte: ${selected.source}`,
    };
    setFavorites(saveList(`${storageKey}_favorites`, exists ? favorites.filter((item) => item.databaseSlug !== selected.slug) : [favorite, ...favorites]));
  }

  function addStored(item) {
    onAdd?.(item, targetMeal);
  }

  function productToItem(product = selectedOnline) {
    if (!product) return null;
    const macros = calculateFoodNutrition(product, grams);
    const pureWater = product.is_water ? grams : 0;
    const hydration = product.is_water ? grams : grams * (Number(product.hydration_factor) || 0);
    return {
      custom: true,
      label: product.name,
      brand_name: product.brand_name || brandName.trim(),
      barcode: product.barcode,
      category: product.category,
      amount: grams,
      unit: product.is_liquid ? 'ml' : 'g',
      grams_or_ml: grams,
      grams,
      quantity: grams,
      portion_label: `${grams} ${product.is_liquid ? 'ml' : 'g'}`,
      foodSlug: product.slug,
      databaseSlug: product.slug,
      source: product.source,
      source_id: product.source_id,
      source_url: product.source_url,
      image_url: product.image_url,
      source_note: product.source_note,
      data_quality: product.data_quality,
      hydration_factor: product.hydration_factor,
      hydration_ml: hydration,
      pure_water_ml: pureWater,
      is_water: product.is_water,
      is_liquid: product.is_liquid,
      warning_zero: product.warning_zero,
      warning_sugar: product.warning_sugar,
      warning_data: product.warning_data,
      ...macros,
      notes: `${product.brand_name ? `Produto: ${product.brand_name}. ` : ''}Fonte: ${product.source} (${product.data_quality || 'qualidade nao informada'})`,
    };
  }

  function addOnlineProduct() {
    const item = productToItem();
    if (!item) return;
    setRecent(saveList(`${storageKey}_recent`, [item, ...recent.filter((entry) => entry.barcode !== item.barcode)]));
    onAdd?.(item, targetMeal);
  }

  async function handleOnlineSearch(force = false, termOverride = '') {
    const term = (termOverride || onlineQuery || query).trim();
    const cache = readObject(cacheKey);
    const key = `query:${term.toLowerCase()}`;
    if (!force && cache[key] && Date.now() - cache[key].timestamp < 30 * 24 * 60 * 60 * 1000) {
      setOnlineResults(cache[key].results || []);
      setOnlineQuery(term);
      setOnlineMessage('Open Food Facts via cache local.');
      setDiagnostic(getOpenFoodFactsDiagnostic());
      return;
    }
    setOnlineQuery(term);
    const result = await searchOpenFoodFacts(term);
    setOnlineResults(result.results || []);
    setOnlineMessage(result.message);
    setDiagnostic(result.diagnostic || getOpenFoodFactsDiagnostic());
    if (result.results?.length) localStorage.setItem(cacheKey, JSON.stringify({ ...cache, [key]: { timestamp: Date.now(), results: result.results } }));
  }

  async function handleBarcodeSearch(force = false, code = barcode) {
    const cleanCode = String(code || '').replace(/\D/g, '');
    setBarcode(cleanCode);
    const saved = customFoods.find((item) => String(item.barcode || '') === cleanCode);
    if (saved && !force) {
      setSelectedOnline(saved);
      setGrams(saved.default_portions?.[0]?.grams || 100);
      setOnlineMessage('Produto encontrado no seu banco local.');
      setDiagnostic(getOpenFoodFactsDiagnostic());
      return;
    }
    const cache = readObject(cacheKey);
    const key = `barcode:${cleanCode}`;
    if (!force && cache[key] && Date.now() - cache[key].timestamp < 30 * 24 * 60 * 60 * 1000) {
      setSelectedOnline(cache[key].product);
      setGrams(cache[key].product?.default_portions?.[0]?.grams || 100);
      setOnlineMessage('Open Food Facts via cache local.');
      setDiagnostic(getOpenFoodFactsDiagnostic());
      return;
    }
    const result = await lookupOpenFoodFactsByBarcode(cleanCode);
    setOnlineMessage(result.message);
    setDiagnostic(result.diagnostic || getOpenFoodFactsDiagnostic());
    if (result.product) {
      setSelectedOnline(result.product);
      setGrams(result.product.default_portions?.[0]?.grams || 100);
      localStorage.setItem(cacheKey, JSON.stringify({ ...cache, [key]: { timestamp: Date.now(), product: result.product } }));
    }
  }

  async function testOnlineConnection(label = 'Teste de conexao online') {
    const result = await checkOnlineStatus();
    setDiagnostic(getOpenFoodFactsDiagnostic());
    setOnlineMessage(`${label}: ${result.message}`);
  }

  function clearOnlineCache() {
    localStorage.removeItem(cacheKey);
    setOnlineMessage('Cache da busca online limpo para este plano.');
  }

  function clearCurrentProductCache() {
    const cache = readObject(cacheKey);
    const next = { ...cache };
    if (selectedOnline?.barcode) delete next[`barcode:${selectedOnline.barcode}`];
    const term = (onlineQuery || selectedOnline?.name || query || '').trim().toLowerCase();
    if (term) delete next[`query:${term}`];
    localStorage.setItem(cacheKey, JSON.stringify(next));
    setOnlineMessage('Cache deste produto limpo. Use Atualizar dados online para refazer a consulta.');
  }

  function retryOnlineAction() {
    if (activeTab === 'barcode' || barcode) {
      handleBarcodeSearch(true);
      return;
    }
    handleOnlineSearch(true);
  }

  function saveSelectedOnline() {
    const product = selectedOnline;
    if (!product) return;
    const saved = { ...product, saved_at: new Date().toISOString() };
    const next = [saved, ...customFoods.filter((item) => item.slug !== saved.slug && item.barcode !== saved.barcode)].slice(0, 80);
    setCustomFoods(next);
    setDatabase((items) => [saved, ...items.filter((item) => item.slug !== saved.slug)]);
    localStorage.setItem(`${prefix}_custom_foods`, JSON.stringify(next));
    setOnlineMessage('Produto salvo no seu banco local.');
  }

  function addManualProduct() {
    const product = {
      slug: `local-${Date.now()}`,
      name: manual.name || 'Produto manual',
      brand_name: manual.brand_name,
      barcode: manual.barcode || barcode,
      category: manual.category || 'industrializado',
      kcal_per_100: Number(manual.calories) || 0,
      protein_per_100: Number(manual.protein) || 0,
      carbs_per_100: Number(manual.carbs) || 0,
      fat_per_100: Number(manual.fat) || 0,
      sugar_per_100: Number(manual.sugar) || 0,
      fiber_per_100: Number(manual.fiber) || 0,
      sodium_per_100: Number(manual.sodium) || 0,
      hydration_factor: Number(manual.hydration_factor) || 0,
      is_liquid: Boolean(manual.is_liquid),
      source: 'manual',
      source_id: manual.barcode || barcode,
      source_note: 'cadastro manual local',
      default_portions: [{ label: `${manual.amount || 100} ${manual.unit || 'g'}`, grams: Number(manual.amount) || 100 }, { label: `100 ${manual.unit || 'g'}`, grams: 100 }],
      saved_at: new Date().toISOString(),
    };
    setSelectedOnline(product);
    setGrams(product.default_portions[0].grams);
    setOnlineMessage('Produto manual pronto para adicionar ou salvar.');
  }

  async function startCamera() {
    setCameraMessage('Abrindo camera...');
    setScanning(true);
    await startBarcodeScanner(videoRef.current, async (code) => {
      setScanning(false);
      setCameraMessage(`Codigo detectado: ${code}`);
      await handleBarcodeSearch(false, code);
    }, (message) => {
      setScanning(false);
      setCameraMessage(message);
    });
  }

  function stopCamera() {
    stopBarcodeScanner();
    setScanning(false);
    setCameraMessage('Camera parada.');
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg">
      <h3 className="mb-2 font-serif text-2xl font-bold text-slate-900">{title}</h3>
      <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
        Valores nutricionais sao estimativas e variam por marca, preparo e porcao.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ['search', 'Buscar alimento'],
          ['barcode', 'Codigo de barras'],
          ['online', 'Produto online'],
          ['manual', 'Cadastro manual'],
        ].map(([value, label]) => (
          <button key={value} type="button" onClick={() => { setActiveTab(value); if (value !== 'barcode') stopCamera(); }} className={`rounded-2xl px-3 py-2 text-xs font-bold ${activeTab === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>{label}</button>
        ))}
      </div>

      {activeTab === 'search' && <label className="mb-3 block text-xs font-bold uppercase text-slate-500">
        Buscar alimento
        <div className="mt-1 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="monster, coca, nugget, cereal..." className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none" />
        </div>
      </label>}
      {activeTab === 'search' && <div className="mb-4 grid gap-2 sm:grid-cols-2">
        {results.map((food) => (
          <button key={food.slug} type="button" onClick={() => choose(food.slug)} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold shadow-sm ${selectedSlug === food.slug ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
            {food.name}
            <span className="block text-[11px] opacity-70">{food.category} · {food.source}</span>
          </button>
        ))}
      </div>}
      {activeTab === 'search' && <button type="button" onClick={() => { setActiveTab('online'); setOnlineQuery(query); handleOnlineSearch(false, query); }} className="mb-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">Buscar online no Open Food Facts</button>}

      {activeTab === 'barcode' && (
        <div className="mb-4 rounded-2xl bg-white/80 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" onClick={startCamera} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"><Camera className="h-4 w-4" /> Escanear com camera</button>
            <button type="button" onClick={() => setCameraMessage('Digite o codigo manualmente.')} className="rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">Digitar codigo manualmente</button>
            <button type="button" onClick={stopCamera} className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700"><Square className="h-4 w-4" /> Parar camera</button>
          </div>
          <video ref={videoRef} className={`mb-3 aspect-video w-full rounded-2xl bg-slate-900 object-cover ${scanning ? 'block' : 'hidden'}`} muted playsInline />
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Codigo de barras" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none" />
            <button type="button" onClick={() => handleBarcodeSearch()} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Buscar produto</button>
          </div>
          {cameraMessage && <p className="mt-2 rounded-2xl bg-cyan-50 p-3 text-xs font-bold text-cyan-900">{cameraMessage}</p>}
        </div>
      )}

      {activeTab === 'online' && (
        <div className="mb-4 rounded-2xl bg-white/80 p-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input value={onlineQuery} onChange={(event) => setOnlineQuery(event.target.value)} placeholder="Monster zero, Coca-Cola, nuggets..." className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none" />
            <button type="button" onClick={() => handleOnlineSearch()} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Buscar online</button>
            <button type="button" onClick={() => handleOnlineSearch(true)} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">Atualizar dados online</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <button type="button" onClick={() => testOnlineConnection('Teste de conexao online')} className="rounded-2xl bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900">Testar conexao online</button>
            <button type="button" onClick={() => testOnlineConnection('Teste Open Food Facts')} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900">Testar Open Food Facts</button>
            <button type="button" onClick={clearOnlineCache} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">Limpar cache da busca online</button>
            <button type="button" onClick={retryOnlineAction} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Tentar novamente</button>
          </div>
          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
            <div className="grid gap-2 sm:grid-cols-3">
              <span>Navegador online: {formatDiagnosticValue(diagnostic.browserOnline)}</span>
              <span>Open Food Facts: {formatDiagnosticValue(diagnostic.openFoodFactsStatus)}</span>
              <span>Ultima tentativa: {formatDiagnosticValue(diagnostic.lastAttemptAt)}</span>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-slate-900">Detalhes tecnicos</summary>
              <div className="mt-2 grid gap-1 break-words font-mono text-[11px] text-slate-500">
                <span>ultima_url: {formatDiagnosticValue(diagnostic.lastUrl)}</span>
                <span>http_status: {formatDiagnosticValue(diagnostic.lastHttpStatus)}</span>
                <span>erro_tecnico: {formatDiagnosticValue(diagnostic.lastTechnicalError)}</span>
                <span>codigo_erro: {formatDiagnosticValue(diagnostic.lastErrorCode)}</span>
                <span>ultima_busca: {formatDiagnosticValue(diagnostic.lastSearch)}</span>
              </div>
            </details>
          </div>
          {onlineResults.length ? <div className="mt-3 grid gap-2">
            {onlineResults.map((product) => (
              <button key={product.slug} type="button" onClick={() => { setSelectedOnline(product); setGrams(product.default_portions?.[0]?.grams || 100); }} className="grid gap-3 rounded-2xl bg-slate-50 p-3 text-left text-xs font-bold text-slate-700 sm:grid-cols-[48px_1fr_auto]">
                {product.image_url ? <img src={product.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <span className="h-12 w-12 rounded-xl bg-white" />}
                <span>{product.name}<span className="block text-slate-400">{product.brand_name || '-'} | {product.kcal_per_100 || 0} kcal/100 | acucar {product.sugar_per_100 || 0}g | Open Food Facts</span></span>
                <span className="rounded-full bg-white px-3 py-2">{product.data_quality}</span>
              </button>
            ))}
          </div> : null}
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="mb-4 grid gap-2 rounded-2xl bg-white/80 p-4 sm:grid-cols-2">
          {manualFields.map(([key, label]) => <input key={key} value={manual[key]} onChange={(event) => setManual({ ...manual, [key]: event.target.value })} placeholder={label} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none" />)}
          <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"><input type="checkbox" checked={manual.is_liquid} onChange={(event) => setManual({ ...manual, is_liquid: event.target.checked })} /> E bebida?</label>
          <button type="button" onClick={addManualProduct} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">Preparar cadastro manual</button>
        </div>
      )}
      {(selectedOnline || selected) && (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-800">{selectedOnline?.name || selected.name}</p>
            {selectedOnline?.data_quality && selectedOnline.data_quality !== 'COMPLETE' && (
              <p className={`mb-2 rounded-2xl p-3 text-xs font-bold ${selectedOnline.data_quality === 'PARTIAL' ? 'bg-cyan-50 text-cyan-900' : 'bg-amber-50 text-amber-800'}`}>
                {selectedOnline.data_quality_message || 'Dados encontrados parcialmente. Voce pode editar antes de adicionar.'}
              </p>
            )}
            {selectedOnline?.warning_zero && <p className="mb-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900">{selectedOnline.warning_zero}</p>}
            {selectedOnline?.missing_fields?.length ? <p className="mb-2 text-xs font-bold text-slate-500">Campos ausentes no Open Food Facts: {selectedOnline.missing_fields.join(', ')}.</p> : null}
            {selectedOnline && (
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                {[
                  ['name', 'Nome'],
                  ['brand_name', 'Marca'],
                  ['category', 'Categoria'],
                  ['kcal_per_100', 'Kcal/100'],
                  ['protein_per_100', 'Proteina/100'],
                  ['carbs_per_100', 'Carbo/100'],
                  ['fat_per_100', 'Gordura/100'],
                  ['sugar_per_100', 'Acucar/100'],
                  ['fiber_per_100', 'Fibra/100'],
                  ['sodium_per_100', 'Sodio mg/100'],
                  ['hydration_factor', 'Fator hidratacao'],
                ].map(([key, label]) => (
                  <input key={key} value={selectedOnline[key] ?? ''} onChange={(event) => setSelectedOnline({ ...selectedOnline, [key]: event.target.value })} placeholder={label} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none" />
                ))}
                <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  <input type="checkbox" checked={Boolean(selectedOnline.is_liquid)} onChange={(event) => setSelectedOnline({ ...selectedOnline, is_liquid: event.target.checked })} /> E bebida?
                </label>
                <button type="button" onClick={clearCurrentProductCache} className="rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">Limpar cache deste produto</button>
                {selectedOnline.raw_debug && (
                  <button type="button" onClick={() => setShowRawDebug(!showRawDebug)} className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                    {showRawDebug ? 'Ocultar dados brutos' : 'Ver dados brutos do produto'}
                  </button>
                )}
              </div>
            )}
            {selectedOnline?.raw_debug && showRawDebug && (
              <pre className="mb-3 max-h-72 overflow-auto rounded-2xl bg-slate-950 p-3 text-[11px] font-bold text-slate-100">
                {JSON.stringify(selectedOnline.raw_debug, null, 2)}
              </pre>
            )}
            <div className="mb-3 flex flex-wrap gap-2">
              {(selectedOnline?.default_portions || selected.default_portions).map((portion) => (
                <button key={portion.label} type="button" onClick={() => setGrams(portion.grams)} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
                  {portion.label} ({portion.grams} g)
                </button>
              ))}
            </div>
            <label className="block text-xs font-bold uppercase text-slate-500">
              Peso da porcao (g/ml)
              <input type="number" min="0" value={grams} onChange={(event) => setGrams(event.target.value)} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none" />
            </label>
            {mealOptions.length ? (
              <label className="mt-3 block text-xs font-bold uppercase text-slate-500">
                Adicionar em
                <select value={targetMeal} onChange={(event) => setTargetMeal(event.target.value)} className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none">
                  {mealOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="mt-3 block text-xs font-bold uppercase text-slate-500">
              Marca / produto especifico
              <input value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Ex.: Monster Ultra" className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm outline-none" />
            </label>
            {allowBarcode && (
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="codigo de barras futuro" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-500 shadow-sm outline-none" />
                <button type="button" onClick={() => handleBarcodeSearch()} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">Buscar por codigo</button>
              </div>
            )}
            <button type="button" onClick={() => handleOnlineSearch()} className="mt-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">Buscar produto online</button>
            {onlineMessage && <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-800">{onlineMessage}</p>}
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
              <span>{(onlineNutrition || nutrition).calories} kcal</span>
              <span>{(onlineNutrition || nutrition).protein} g proteina</span>
              <span>{(onlineNutrition || nutrition).carbs} g carboidratos</span>
              <span>{(onlineNutrition || nutrition).fat} g gorduras</span>
              <span>{(onlineNutrition || nutrition).sugar} g acucar</span>
              <span>{(onlineNutrition || nutrition).fiber} g fibras</span>
              <span>{(onlineNutrition || nutrition).sodium} mg sodio</span>
            </div>
            <button type="button" onClick={selectedOnline ? addOnlineProduct : addSelected} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
            {selectedOnline && <button type="button" onClick={saveSelectedOnline} className="mt-2 w-full rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">Salvar no meu banco</button>}
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
