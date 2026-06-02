export function formatNumber(value, decimals = 0) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return '0';
  return number.toFixed(decimals);
}

export function formatMacro(value) {
  return `${formatNumber(value, 1)} g`;
}

export function formatCalories(value) {
  return `${Math.round(Number(value || 0))} kcal`;
}

export function formatHydration(value) {
  return `${Math.round(Number(value || 0))} ml`;
}
