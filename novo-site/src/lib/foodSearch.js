import { FOOD_DATABASE, findFood } from './foodDatabase';

const ALIASES = {
  mexerica: 'tangerina',
  bergamota: 'tangerina',
  refri: 'refrigerante_normal',
  coca: 'refrigerante_normal',
  coke: 'refrigerante_normal',
  monster: 'energetico_normal',
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

export function searchFoods(query, limit = 8) {
  const normalizedQuery = normalizeFoodText(query);
  if (!normalizedQuery) return FOOD_DATABASE.slice(0, limit);

  const aliasTarget = ALIASES[normalizedQuery];
  const results = FOOD_DATABASE.filter((item) => {
    const haystack = normalizeFoodText(`${item.name} ${item.slug} ${item.category} ${item.source} ${item.source_note}`);
    if (haystack.includes(normalizedQuery)) return true;
    if (aliasTarget && normalizeFoodText(item.slug) === normalizeFoodText(aliasTarget)) return true;
    return false;
  });

  if (results.length) {
    return results.slice(0, limit);
  }

  return FOOD_DATABASE.filter((item) => {
    const haystack = normalizeFoodText(`${item.name} ${item.slug} ${item.category} ${item.source} ${item.source_note}`);
    return normalizedQuery.split(' ').every((term) => haystack.includes(term));
  }).slice(0, limit);
}

export function getFoodSuggestions(query, limit = 8) {
  return searchFoods(query, limit);
}

export { findFood };
