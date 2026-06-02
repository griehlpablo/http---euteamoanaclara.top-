import { findFood } from './foodDatabase';

export const NUTRIENT_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'sugar', 'fiber', 'sodium'];

export function emptyNutrition() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0 };
}

export function roundNutrition(values = {}) {
  return {
    calories: Math.round(Number(values.calories) || 0),
    protein: round1(values.protein),
    carbs: round1(values.carbs),
    fat: round1(values.fat),
    sugar: round1(values.sugar),
    fiber: round1(values.fiber),
    sodium: Math.round(Number(values.sodium) || 0),
  };
}

export function calculateFoodNutrition(food, grams = 0) {
  const multiplier = (Number(grams) || 0) / 100;
  return roundNutrition({
    calories: food.kcal_per_100 * multiplier,
    protein: food.protein_per_100 * multiplier,
    carbs: food.carbs_per_100 * multiplier,
    fat: food.fat_per_100 * multiplier,
    sugar: food.sugar_per_100 * multiplier,
    fiber: food.fiber_per_100 * multiplier,
    sodium: food.sodium_per_100 * multiplier,
  });
}

export function calculateDatabaseItem(item = {}) {
  const food = findFood(item.foodSlug || item.databaseSlug || item.slug);
  if (!food) return null;
  const grams = Number(item.grams || item.grams_or_ml || item.amount) || food.default_portions?.[0]?.grams || 100;
  return { ...calculateFoodNutrition(food, grams), grams, source: food.source, source_note: food.source_note, foodName: food.name };
}

export function mergeNutrition(...items) {
  const total = emptyNutrition();
  items.filter(Boolean).forEach((item) => {
    NUTRIENT_FIELDS.forEach((field) => {
      total[field] += Number(item[field]) || 0;
    });
  });
  return roundNutrition(total);
}

export function nutritionForManualItem(item = {}) {
  const database = calculateDatabaseItem(item);
  if (database) return database;
  return roundNutrition({
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    sugar: item.sugar,
    fiber: item.fiber,
    sodium: item.sodium,
  });
}

function round1(value) {
  return Number((Number(value) || 0).toFixed(1));
}
