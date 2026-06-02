import { FOOD_DATABASE, findFood } from './foodDatabase';

const RELATED_GROUPS = {
  monster: ['energetico_zero', 'energetico_normal'],
  energetico: ['energetico_zero', 'energetico_normal'],
  'red bull': ['energetico_zero', 'energetico_normal'],
  coca: ['refrigerante_normal', 'refrigerante_zero'],
  refri: ['refrigerante_normal', 'refrigerante_zero'],
  refrigerante: ['refrigerante_normal', 'refrigerante_zero'],
  nugget: ['nuggets'],
  nuggets: ['nuggets'],
  cereal: ['cereal_matinal', 'granola', 'achocolatado'],
};

const ALIASES = {
  mexerica: 'tangerina',
  bergamota: 'tangerina',
  nescau: 'achocolatado',
  bolacha: 'bolacha_recheada',
  biscoito: 'bolacha_recheada',
  suco: 'suco_natural',
};

export function normalizeFoodText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\b(\w+)s\b/g, '$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function searchFoods(query, limit = 8, database = FOOD_DATABASE) {
  const normalizedQuery = normalizeFoodText(query);
  if (!normalizedQuery) return database.slice(0, limit);

  const aliasTarget = ALIASES[normalizedQuery];
  const related = relatedSlugs(normalizedQuery);
  const scored = database
    .map((item) => ({ item, score: scoreFood(item, normalizedQuery, aliasTarget, related) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));

  if (scored.length) return scored.map(({ item }) => item).slice(0, limit);

  return database.filter((item) => {
    const haystack = haystackForFood(item);
    return normalizedQuery.split(' ').every((term) => haystack.includes(term));
  }).slice(0, limit);
}

export function getFoodSuggestions(query, limit = 8, database = FOOD_DATABASE) {
  return searchFoods(query, limit, database);
}

export { findFood };

function scoreFood(item, normalizedQuery, aliasTarget, related) {
  const haystack = haystackForFood(item);
  const slug = normalizeFoodText(item.slug);
  const name = normalizeFoodText(item.name);
  const aliases = (item.aliases || []).map(normalizeFoodText);
  if (related.includes(item.slug)) return 100 - related.indexOf(item.slug);
  if (aliasTarget && slug === normalizeFoodText(aliasTarget)) return 90;
  if (slug === normalizedQuery || name === normalizedQuery) return 80;
  if (aliases.includes(normalizedQuery)) return 75;
  if (name.includes(normalizedQuery)) return 60;
  if (aliases.some((alias) => alias.includes(normalizedQuery) || normalizedQuery.includes(alias))) return 55;
  if (haystack.includes(normalizedQuery)) return 35;
  return 0;
}

function relatedSlugs(query) {
  const direct = RELATED_GROUPS[query] || [];
  const partial = Object.entries(RELATED_GROUPS)
    .filter(([key]) => query.includes(key) || key.includes(query))
    .flatMap(([, slugs]) => slugs);
  return [...new Set([...direct, ...partial])];
}

function haystackForFood(item) {
  return normalizeFoodText(`${item.name} ${item.slug} ${item.category} ${(item.aliases || []).join(' ')} ${item.source} ${item.source_note}`);
}
