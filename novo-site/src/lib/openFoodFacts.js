const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const HEALTHCHECK_URL = 'https://world.openfoodfacts.org/api/v2/product/737628064502.json';
const DEFAULT_TIMEOUT = 8000;

export const OFF_ERROR_MESSAGES = {
  OFFLINE: 'Sem conexao detectada. Usando banco interno e produtos salvos.',
  TIMEOUT: 'A busca online demorou demais. Tente novamente.',
  HTTP_ERROR: 'Open Food Facts respondeu com erro. Tente novamente em instantes.',
  PRODUCT_NOT_FOUND: 'Produto nao encontrado no Open Food Facts. Voce pode cadastrar manualmente.',
  EMPTY_SEARCH: 'Nenhum produto encontrado para essa busca.',
  INVALID_RESPONSE: 'Produto encontrado, mas a resposta veio incompleta. Voce pode editar manualmente.',
  CORS_OR_NETWORK_ERROR: 'Nao foi possivel acessar a busca online agora. Tente atualizar ou usar cadastro manual.',
  UNKNOWN_ERROR: 'Erro inesperado na busca online. Use o cadastro manual por enquanto.',
};

let lastDiagnostic = {
  browserOnline: typeof navigator === 'undefined' ? 'desconhecido' : navigator.onLine ? 'sim' : 'nao',
  openFoodFactsStatus: 'nao testado',
  lastUrl: '',
  lastHttpStatus: '',
  lastTechnicalError: '',
  lastSearch: '',
  lastAttemptAt: '',
  lastErrorCode: '',
};

export function getOpenFoodFactsDiagnostic() {
  return { ...lastDiagnostic };
}

export async function checkOnlineStatus() {
  const browserOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
  const check = await fetchWithTimeout(HEALTHCHECK_URL, {}, 5000);
  const online = browserOnline && check.ok;
  updateDiagnostic({
    browserOnline: browserOnline ? 'sim' : 'nao',
    openFoodFactsStatus: check.ok ? 'ok' : 'falhou',
    lastUrl: HEALTHCHECK_URL,
    lastHttpStatus: check.status || '',
    lastTechnicalError: check.error || '',
    lastErrorCode: check.errorCode || '',
  });
  return { online, browserOnline, openFoodFactsOk: check.ok, errorCode: check.errorCode, message: check.ok ? 'Open Food Facts acessivel.' : messageForError(check.errorCode) };
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    updateDiagnostic({ lastUrl: url, lastAttemptAt: new Date().toLocaleString('pt-BR'), lastTechnicalError: '', lastHttpStatus: '', lastErrorCode: '' });
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...(options.headers || {}) },
    });
    clearTimeout(timer);
    updateDiagnostic({ lastHttpStatus: response.status });
    if (!response.ok) {
      return { ok: false, response, status: response.status, errorCode: 'HTTP_ERROR', error: `HTTP ${response.status}` };
    }
    return { ok: true, response, status: response.status };
  } catch (error) {
    clearTimeout(timer);
    const errorCode = classifyFetchError(error);
    updateDiagnostic({ lastTechnicalError: String(error?.message || error), lastErrorCode: errorCode });
    return { ok: false, errorCode, error: String(error?.message || error) };
  }
}

export async function searchOpenFoodFacts(query) {
  const term = String(query || '').trim();
  if (!term) return resultError('UNKNOWN_ERROR', 'Digite um produto para buscar online.', { results: [] });
  const params = new URLSearchParams({
    search_terms: term,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '10',
  });
  const url = `${SEARCH_URL}?${params.toString()}`;
  updateDiagnostic({ lastSearch: term });
  const fetched = await fetchWithTimeout(url);
  if (!fetched.ok) return resultError(fetched.errorCode, messageForError(fetched.errorCode), { results: [] });
  const parsed = await safeJson(fetched.response);
  if (!parsed.ok || !Array.isArray(parsed.data.products)) return resultError('INVALID_RESPONSE', messageForError('INVALID_RESPONSE'), { results: [] });
  if (!parsed.data.products.length) return resultError('EMPTY_SEARCH', messageForError('EMPTY_SEARCH'), { results: [] });
  const results = parsed.data.products.map(normalizeOpenFoodFactsProduct).filter(Boolean).sort(sortBrazilFirst);
  return { ok: true, errorCode: '', message: `${results.length} produto(s) encontrados.`, results, diagnostic: getOpenFoodFactsDiagnostic() };
}

export async function lookupOpenFoodFactsByBarcode(barcode) {
  const code = String(barcode || '').replace(/\D/g, '');
  if (!code) return resultError('UNKNOWN_ERROR', 'Digite ou escaneie um codigo de barras.', { product: null });
  const url = `${PRODUCT_URL}/${encodeURIComponent(code)}.json`;
  updateDiagnostic({ lastSearch: code });
  const fetched = await fetchWithTimeout(url);
  if (!fetched.ok) return resultError(fetched.errorCode, messageForError(fetched.errorCode), { product: null });
  const parsed = await safeJson(fetched.response);
  if (!parsed.ok) return resultError('INVALID_RESPONSE', messageForError('INVALID_RESPONSE'), { product: null });
  if (!parsed.data.product || parsed.data.status === 0) return resultError('PRODUCT_NOT_FOUND', messageForError('PRODUCT_NOT_FOUND'), { product: null });
  const product = normalizeOpenFoodFactsProduct(parsed.data.product);
  if (!product) return resultError('INVALID_RESPONSE', messageForError('INVALID_RESPONSE'), { product: null });
  return { ok: true, errorCode: '', message: 'Produto encontrado no Open Food Facts.', product, diagnostic: getOpenFoodFactsDiagnostic() };
}

export function normalizeOpenFoodFactsProduct(product = {}) {
  const nutriments = product.nutriments || {};
  const name = product.product_name_pt || product.product_name || product.generic_name_pt || product.generic_name || 'Produto sem nome';
  const barcode = product.code || product._id || '';
  const kcal = nutrient(nutriments, ['energy-kcal_100g', 'energy-kcal']) || kjToKcal(nutrient(nutriments, ['energy_100g', 'energy']));
  const sodiumRaw = nutrient(nutriments, ['sodium_100g', 'sodium']);
  const saltRaw = nutrient(nutriments, ['salt_100g', 'salt']);
  const sodium = sodiumRaw ? sodiumRaw * 1000 : saltRaw ? saltRaw * 400 : 0;
  const normalized = {
    slug: `off-${barcode || slugify(`${product.brands || ''}-${name}`)}`,
    name,
    brand_name: product.brands || '',
    barcode,
    category: categoryForProduct(product),
    kcal_per_100: round(kcal),
    protein_per_100: round(nutrient(nutriments, ['proteins_100g', 'proteins'])),
    carbs_per_100: round(nutrient(nutriments, ['carbohydrates_100g', 'carbohydrates'])),
    fat_per_100: round(nutrient(nutriments, ['fat_100g', 'fat'])),
    saturated_fat_per_100: round(nutrient(nutriments, ['saturated-fat_100g', 'saturated-fat'])),
    sugar_per_100: round(nutrient(nutriments, ['sugars_100g', 'sugars'])),
    fiber_per_100: round(nutrient(nutriments, ['fiber_100g', 'fiber'])),
    sodium_per_100: Math.round(sodium || 0),
    source: 'OpenFoodFacts',
    source_id: barcode,
    source_url: product.url || (barcode ? `https://world.openfoodfacts.org/product/${barcode}` : ''),
    image_url: product.image_front_url || product.image_url || '',
    serving_size: product.serving_size || '',
    serving_quantity: product.serving_quantity || '',
    source_note: 'base colaborativa Open Food Facts',
    aliases: [name, product.brands, barcode].filter(Boolean),
  };
  normalized.is_liquid = isLikelyBeverage(product, normalized);
  normalized.hydration_factor = guessHydrationFactor(product, normalized);
  normalized.default_portions = defaultPortions(normalized);
  normalized.missing_fields = missingNutritionFields(normalized, product);
  normalized.data_quality = getNutritionDataQuality(normalized, product);
  normalized.data_quality_message = qualityMessage(normalized);
  normalized.raw_debug = rawDebug(product, normalized);
  if (normalized.is_liquid && normalized.sugar_per_100 > 5) normalized.warning_sugar = `${normalized.name} trouxe acucar liquido. Melhor nao repetir hoje.`;
  if (normalized.is_liquid && normalized.sugar_per_100 <= 1) normalized.warning_zero = isZeroDrink(product, normalized) ? 'Bebida zero detectada. Valores baixos sao esperados.' : 'Conta um pouco como liquido, mas nao substitui agua.';
  if (isEnergyDrink(product, normalized)) normalized.warning_zero = normalized.warning_zero || 'Energetico pode ajudar no cansaco, mas cuidado para nao virar rotina.';
  if (normalized.data_quality === 'INCOMPLETE') normalized.warning_data = normalized.data_quality_message;
  return normalized;
}

export function getNutritionDataQuality(food, product = {}) {
  if (isZeroDrink(product, food) && Number(food.sugar_per_100) <= 1 && Number(food.carbs_per_100) <= 2 && Number(food.kcal_per_100) <= 10) return 'COMPLETE';
  const hasKcal = Number(food.kcal_per_100) > 0;
  const macros = ['carbs_per_100', 'protein_per_100', 'fat_per_100', 'sugar_per_100'].filter((key) => hasValue(food[key])).length;
  if (hasKcal && macros >= 4) return 'COMPLETE';
  if (hasKcal && macros >= 2) return 'PARTIAL';
  if (hasKcal) return 'MINIMAL';
  return 'INCOMPLETE';
}

export function isLikelyBeverage(product = {}, food = {}) {
  const text = textFor(product, food);
  return ['agua', 'water', 'refrigerante', 'soda', 'cola', 'coca', 'energetico', 'energy drink', 'monster', 'red bull', 'suco', 'juice', 'cha', 'tea', 'leite', 'milk', 'bebida lactea', 'isotonico'].some((term) => text.includes(term));
}

export function guessHydrationFactor(product = {}, food = {}) {
  const text = textFor(product, food);
  const sugar = Number(food.sugar_per_100) || 0;
  if (text.includes('agua') || text.includes('water')) return 1;
  if (text.includes('leite') || text.includes('milk')) return 0.85;
  if (text.includes('cha') || text.includes('tea')) return sugar <= 1 ? 0.9 : 0.75;
  if (text.includes('cafe') || text.includes('coffee')) return sugar <= 1 ? 0.8 : 0.75;
  if (text.includes('refrigerante') || text.includes('soda') || text.includes('cola') || text.includes('coca')) return sugar <= 1 ? 0.75 : 0.65;
  if (isEnergyDrink(product, food)) return sugar <= 1 ? 0.75 : 0.65;
  if (text.includes('suco') || text.includes('juice')) return sugar > 8 ? 0.7 : 0.8;
  if (text.includes('iogurte') || text.includes('yogurt')) return 0.75;
  return isLikelyBeverage(product, food) ? 0.7 : 0;
}

export function messageForError(errorCode) {
  return OFF_ERROR_MESSAGES[errorCode] || OFF_ERROR_MESSAGES.UNKNOWN_ERROR;
}

function resultError(errorCode, message, extra) {
  updateDiagnostic({ lastErrorCode: errorCode, lastTechnicalError: message });
  return { ok: false, errorCode, message, diagnostic: getOpenFoodFactsDiagnostic(), ...extra };
}

function classifyFetchError(error) {
  if (error?.name === 'AbortError') return 'TIMEOUT';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'OFFLINE';
  if (String(error?.message || '').toLowerCase().includes('failed to fetch')) return 'CORS_OR_NETWORK_ERROR';
  return 'UNKNOWN_ERROR';
}

async function safeJson(response) {
  try {
    return { ok: true, data: await response.json() };
  } catch {
    return { ok: false, data: null };
  }
}

function updateDiagnostic(patch) {
  lastDiagnostic = { ...lastDiagnostic, ...patch };
}

function missingNutritionFields(food, product = {}) {
  const nutriments = product.nutriments || {};
  return [
    ['kcal_per_100', 'calorias', ['energy-kcal_100g', 'energy-kcal', 'energy_100g', 'energy']],
    ['protein_per_100', 'proteina', ['proteins_100g', 'proteins']],
    ['carbs_per_100', 'carboidratos', ['carbohydrates_100g', 'carbohydrates']],
    ['fat_per_100', 'gordura', ['fat_100g', 'fat']],
    ['sugar_per_100', 'acucar', ['sugars_100g', 'sugars']],
    ['fiber_per_100', 'fibra', ['fiber_100g', 'fiber']],
    ['sodium_per_100', 'sodio', ['sodium_100g', 'sodium', 'salt_100g', 'salt']],
  ].filter(([key, , sourceKeys]) => !hasValue(food[key]) && !hasNutriment(nutriments, sourceKeys)).map(([, label]) => label);
}

function qualityMessage(food) {
  if (food.data_quality === 'COMPLETE') return isZeroDrink({}, food) ? 'Bebida zero detectada. Valores baixos sao esperados.' : '';
  const missing = food.missing_fields?.length ? ` Dados faltando: ${food.missing_fields.join(', ')}.` : '';
  if (food.data_quality === 'PARTIAL') return `Alguns dados menores podem estar ausentes. Confira o rotulo se quiser mais precisao.${missing}`;
  if (food.data_quality === 'MINIMAL') return `Produto encontrado com poucos dados nutricionais. Voce pode editar antes de adicionar.${missing}`;
  return `Produto encontrado, mas sem dados nutricionais suficientes. Confira o rotulo ou cadastre manualmente.${missing}`;
}

function rawDebug(product, normalized) {
  const nutriments = product.nutriments || {};
  return {
    product_name: product.product_name_pt || product.product_name,
    brands: product.brands,
    code: product.code || product._id,
    countries: product.countries,
    countries_tags: product.countries_tags,
    categories: product.categories,
    serving_size: product.serving_size,
    nutriments: {
      'energy-kcal_100g': nutriments['energy-kcal_100g'],
      'energy-kcal': nutriments['energy-kcal'],
      energy_100g: nutriments.energy_100g,
      energy: nutriments.energy,
      proteins_100g: nutriments.proteins_100g,
      carbohydrates_100g: nutriments.carbohydrates_100g,
      sugars_100g: nutriments.sugars_100g,
      fat_100g: nutriments.fat_100g,
      fiber_100g: nutriments.fiber_100g,
      sodium_100g: nutriments.sodium_100g,
      salt_100g: nutriments.salt_100g,
    },
    normalized,
    data_quality: normalized.data_quality,
    missing_fields: normalized.missing_fields,
  };
}

function isEnergyDrink(product = {}, food = {}) {
  const text = textFor(product, food);
  return text.includes('energetico') || text.includes('energy') || text.includes('monster') || text.includes('red bull');
}

function isZeroDrink(product = {}, food = {}) {
  const text = textFor(product, food);
  return food.is_liquid && (text.includes('zero') || text.includes('sem acucar') || text.includes('sugar free') || text.includes('diet') || text.includes('light') || text.includes('ultra'));
}

function nutrient(nutriments, keys) {
  for (const key of keys) {
    if (nutriments[key] !== undefined && nutriments[key] !== null && nutriments[key] !== '') return number(nutriments[key]);
  }
  return 0;
}

function hasNutriment(nutriments, keys) {
  return keys.some((key) => nutriments[key] !== undefined && nutriments[key] !== null && nutriments[key] !== '');
}

function kjToKcal(value) {
  return value ? value / 4.184 : 0;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '' && Number(value) !== 0;
}

function categoryForProduct(product) {
  const text = textFor(product);
  if (text.includes('energy') || text.includes('monster') || text.includes('red bull')) return 'bebida/energetico';
  if (text.includes('refrigerante') || text.includes('cola') || text.includes('soda')) return 'bebida';
  if (text.includes('nugget')) return 'industrializado';
  if (text.includes('chocolate') || text.includes('biscuit') || text.includes('cookie') || text.includes('bolacha')) return 'doce/industrializado';
  return 'industrializado';
}

function defaultPortions(food) {
  const unit = food.is_liquid ? 'ml' : 'g';
  if (food.serving_size) {
    const amount = Number(String(food.serving_size).replace(',', '.').match(/\d+(\.\d+)?/)?.[0]);
    if (amount) return [{ label: food.serving_size, grams: amount }, { label: `100 ${unit}`, grams: 100 }];
  }
  if (food.is_liquid) return [{ label: 'lata 350 ml', grams: 350 }, { label: 'lata 473 ml', grams: 473 }, { label: '100 ml', grams: 100 }];
  return [{ label: 'porcao 30 g', grams: 30 }, { label: '100 g', grams: 100 }];
}

function sortBrazilFirst(a, b) {
  const ab = String(a.raw_debug?.countries || a.source_note || '').toLowerCase().includes('brazil') ? 1 : 0;
  const bb = String(b.raw_debug?.countries || b.source_note || '').toLowerCase().includes('brazil') ? 1 : 0;
  return bb - ab;
}

function textFor(product = {}, food = {}) {
  return `${product.product_name_pt || ''} ${product.product_name || ''} ${product.generic_name || ''} ${product.brands || ''} ${product.categories || ''} ${product.categories_tags || ''} ${food.name || ''} ${food.brand_name || ''} ${food.category || ''}`.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function slugify(value) {
  return String(value || 'produto').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function number(value) {
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Number((Number(value) || 0).toFixed(1));
}
