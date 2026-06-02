import { findFood } from './foodDatabase';

export function calculateHydrationContribution(item = {}) {
  const pureWaterMl = Number(item.pure_water_ml || 0);
  const hydrationMl = Number(item.hydration_ml || 0);
  if (pureWaterMl || hydrationMl) {
    return { pure_water_ml: pureWaterMl, hydration_ml: hydrationMl };
  }

  const food = findFood(item.foodSlug || item.databaseSlug || item.food);
  const amount = Number(item.grams_or_ml || item.grams || item.amount) || 0;
  if (!food || !amount) return { pure_water_ml: 0, hydration_ml: 0 };

  if (food.is_water) {
    return { pure_water_ml: amount, hydration_ml: amount };
  }

  const factor = Number(food.hydration_factor || 0);
  return { pure_water_ml: 0, hydration_ml: amount * factor };
}

export function calculateTotalHydration(items = [], manualWaterMl = 0) {
  const totals = items.reduce(
    (acc, item) => {
      const contribution = calculateHydrationContribution(item);
      acc.pure_water_ml += contribution.pure_water_ml;
      acc.hydration_ml += contribution.hydration_ml;
      return acc;
    },
    { pure_water_ml: 0, hydration_ml: 0 },
  );

  return {
    pure_water_ml: totals.pure_water_ml + Number(manualWaterMl || 0),
    hydration_ml: totals.hydration_ml + Number(manualWaterMl || 0),
  };
}
