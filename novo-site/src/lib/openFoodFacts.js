const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';

export async function searchOpenFoodFacts(query) {
  const term = String(query || '').trim();
  if (!term) return { ok: false, message: 'Digite um produto para buscar online.', results: [] };
  try {
    const params = new URLSearchParams({
      search_terms: term,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '10',
    });
    const response = await fetch(`${SEARCH_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('offline');
    const data = await response.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const results = products.map(normalizeOpenFoodFactsProduct).filter(Boolean).sort(sortBrazilFirst);
    return { ok: true, message: results.length ? `${results.length} produto(s) encontrados.` : 'Produto nao encontrado no Open Food Facts. Voce pode cadastrar manualmente.', results };
  } catch {
    return { ok: false, message: 'Sem conexao. Usando banco interno e produtos salvos.', results: [] };
  }
}

export async function lookupOpenFoodFactsByBarcode(barcode) {
  const code = String(barcode || '').replace(/\D/g, '');
  if (!code) return { ok: false, message: 'Digite ou escaneie um codigo de barras.', product: null };
  try {
    const response = await fetch(`${PRODUCT_URL}/${code}.json`);
    if (!response.ok) throw new Error('offline');
    const data = await response.json();
    if (!data.product || data.status === 0) return { ok: false, message: 'Produto nao encontrado no Open Food Facts. Voce pode cadastrar manualmente.', product: null };
    return { ok: true, message: 'Produto encontrado no Open Food Facts.', product: normalizeOpenFoodFactsProduct(data.product) };
  } catch {
    return { ok: false, message: 'Sem conexao. Usando banco interno e produtos salvos.', product: null };
  }
}

export function normalizeOpenFoodFactsProduct(product = {}) {
  const nutriments = product.nutriments || {};
  const name = product.product_name_pt || product.product_name || product.generic_name_pt || product.generic_name || 'Produto sem nome';
  const barcode = product.code || product._id || '';
  const kcal = number(nutriments['energy-kcal_100g']) || (number(nutriments.energy_100g) ? number(nutriments.energy_100g) / 4.184 : 0);
  const sodium = number(nutriments.sodium_100g) ? number(nutriments.sodium_100g) * 1000 : number(nutriments.salt_100g) ? number(nutriments.salt_100g) * 400 : 0;
  const normalized = {
    slug: `off-${barcode || slugify(`${product.brands || ''}-${name}`)}`,
    name,
    brand_name: product.brands || '',
    barcode,
    category: categoryForProduct(product),
    kcal_per_100: round(kcal),
    protein_per_100: round(number(nutriments.proteins_100g)),
    carbs_per_100: round(number(nutriments.carbohydrates_100g)),
    fat_per_100: round(number(nutriments.fat_100g)),
    sugar_per_100: round(number(nutriments.sugars_100g)),
    fiber_per_100: round(number(nutriments.fiber_100g)),
    sodium_per_100: Math.round(sodium || 0),
    source: 'OpenFoodFacts',
    source_id: barcode,
    source_url: product.url || (barcode ? `https://world.openfoodfacts.org/product/${barcode}` : ''),
    image_url: product.image_front_url || product.image_url || '',
    serving_size: product.serving_size || '',
    source_note: 'base colaborativa Open Food Facts',
    aliases: [name, product.brands, barcode].filter(Boolean),
  };
  normalized.is_liquid = isLikelyBeverage(product, normalized);
  normalized.hydration_factor = guessHydrationFactor(product, normalized);
  normalized.default_portions = defaultPortions(normalized);
  normalized.data_quality = dataQuality(normalized);
  if (normalized.is_liquid && normalized.sugar_per_100 > 5) normalized.warning_sugar = `${normalized.name} trouxe acucar liquido. Melhor nao repetir hoje.`;
  if (normalized.is_liquid && normalized.sugar_per_100 <= 1) normalized.warning_zero = 'Conta um pouco como liquido, mas nao substitui agua.';
  if (textFor(product, normalized).includes('energetic') || textFor(product, normalized).includes('energy') || textFor(product, normalized).includes('monster')) {
    normalized.warning_zero = normalized.warning_zero || 'Energetico pode ajudar no cansaco, mas cuidado para nao virar rotina.';
  }
  if (normalized.data_quality === 'Incompleto') normalized.warning_data = 'Dados incompletos. Confira o rotulo ou edite manualmente.';
  return normalized;
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
  if (text.includes('energetico') || text.includes('energy') || text.includes('monster') || text.includes('red bull')) return sugar <= 1 ? 0.75 : 0.65;
  if (text.includes('suco') || text.includes('juice')) return sugar > 8 ? 0.7 : 0.8;
  if (text.includes('iogurte') || text.includes('yogurt')) return 0.75;
  return isLikelyBeverage(product, food) ? 0.7 : 0;
}

function dataQuality(food) {
  const hasKcal = Number(food.kcal_per_100) > 0;
  const macros = [food.carbs_per_100, food.sugar_per_100, food.protein_per_100, food.fat_per_100].filter((value) => Number(value) > 0).length;
  if (hasKcal && macros >= 4) return 'Completo';
  if (hasKcal && macros >= 2) return 'Parcial';
  return 'Incompleto';
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
  const ab = String(a.source_note || '').includes('Brazil') ? 1 : 0;
  const bb = String(b.source_note || '').includes('Brazil') ? 1 : 0;
  return bb - ab;
}

function textFor(product = {}, food = {}) {
  return `${product.product_name_pt || ''} ${product.product_name || ''} ${product.generic_name || ''} ${product.brands || ''} ${product.categories || ''} ${product.categories_tags || ''} ${food.name || ''} ${food.brand_name || ''} ${food.category || ''}`.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

function slugify(value) {
  return String(value || 'produto').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Number((Number(value) || 0).toFixed(1));
}
