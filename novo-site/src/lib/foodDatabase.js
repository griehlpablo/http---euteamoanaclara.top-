export const FOOD_SOURCE_OPTIONS = ['manual', 'TACO', 'USDA', 'OpenFoodFacts'];

const baseSource = { source: 'manual', source_note: 'estimativa media' };

export const FOOD_DATABASE = [
  food('agua', 'Agua', 'bebida', 0, 0, 0, 0, 0, 0, [portion('100 ml', 100), portion('250 ml', 250), portion('500 ml', 500)], 1.0, 'ml', true),
  food('agua_com_gas', 'Agua com gas', 'bebida', 0, 0, 0, 0, 0, 0, [portion('100 ml', 100), portion('250 ml', 250)], 1.0, 'ml', true),
  food('cha_sem_acucar', 'Cha sem acucar', 'bebida', 1, 0, 0.2, 0, 0, 0, [portion('copo 180 ml', 180)], 0.9, 'ml'),
  food('cha_adocado', 'Cha adocado', 'bebida acucarada', 20, 0, 5, 0, 5, 0, [portion('copo 180 ml', 180)], 0.75, 'ml'),
  food('cafe_sem_acucar', 'Cafe sem acucar', 'bebida', 2, 0.1, 0, 0, 0, 0, [portion('copo 180 ml', 180)], 0.8, 'ml'),
  food('cafe_com_acucar', 'Cafe com acucar', 'bebida acucarada', 40, 0.1, 10, 0, 10, 0, [portion('copo 180 ml', 180)], 0.75, 'ml'),
  food('cafe_com_leite', 'Cafe com leite', 'bebida', 40, 2, 4, 1, 4, 0, [portion('copo 180 ml', 180)], 0.8, 'ml'),
  food('leite', 'Leite', 'laticinio', 60, 3, 5, 3.3, 5, 0, [portion('copo 250 ml', 250)], 0.85, 'ml'),
  food('leite_integral', 'Leite integral', 'laticinio', 61, 3.2, 4.8, 3.3, 5, 0, [portion('copo 250 ml', 250)], 0.85, 'ml'),
  food('leite_desnatado', 'Leite desnatado', 'laticinio', 34, 3.4, 5, 0.1, 5, 0, [portion('copo 250 ml', 250)], 0.85, 'ml'),
  food('suco_natural', 'Suco natural', 'bebida', 45, 0.5, 10, 0.1, 8, 0.2, [portion('copo 250 ml', 250)], 0.8, 'ml'),
  food('suco_adocado', 'Suco adocado', 'bebida acucarada', 70, 0.3, 17, 0.1, 15, 0.1, [portion('copo 250 ml', 250)], 0.7, 'ml'),
  food('suco_caixinha', 'Suco de caixinha', 'bebida acucarada', 50, 0.3, 12, 0, 12, 0, [portion('caixinha 200 ml', 200)], 0.65, 'ml'),
  food('refrigerante_normal', 'Refrigerante normal', 'bebida acucarada', 42, 0, 10.6, 0, 10.6, 0, [portion('copo 200 ml', 200), portion('lata', 350)], 0.65, 'ml'),
  food('refrigerante_zero', 'Refrigerante zero', 'bebida zero', 0, 0, 0, 0, 0, 0, [portion('lata', 350)], 0.75, 'ml'),
  food('energetico_normal', 'Energetico normal', 'bebida acucarada', 45, 0, 11, 0, 11, 0, [portion('lata 473 ml', 473)], 0.65, 'ml'),
  food('energetico_zero', 'Energetico zero', 'bebida zero', 0, 0, 0, 0, 0, 0, [portion('lata 473 ml', 473)], 0.75, 'ml'),
  food('maca', 'Maca', 'fruta', 52, 0.3, 14, 0.2, 10, 2.4, [portion('unidade pequena', 100), portion('unidade media', 130), portion('unidade grande', 180)], 0.9),
  food('banana', 'Banana', 'fruta', 89, 1.1, 23, 0.3, 12, 2.6, [portion('unidade media', 86), portion('100 g', 100)], 0.85),
  food('laranja', 'Laranja', 'fruta', 47, 0.9, 12, 0.1, 9, 2.4, [portion('unidade media', 130), portion('100 g', 100)], 0.9),
  food('mamiao', 'Mamao', 'fruta', 43, 0.5, 11, 0.3, 8, 1.7, [portion('fatia media', 170), portion('100 g', 100)], 0.9),
  food('uva', 'Uva', 'fruta', 69, 0.7, 18, 0.2, 15, 0.9, [portion('cacho pequeno', 100), portion('100 g', 100)], 0.9),
  food('morango', 'Morango', 'fruta', 32, 0.7, 7.7, 0.3, 4.9, 2, [portion('xicara', 150), portion('100 g', 100)], 0.9),
  food('abacaxi', 'Abacaxi', 'fruta', 50, 0.5, 13, 0.1, 10, 1.4, [portion('fatias', 150), portion('100 g', 100)], 0.9),
  food('pera', 'Pera', 'fruta', 57, 0.4, 15, 0.1, 10, 3.1, [portion('unidade media', 178), portion('100 g', 100)], 0.9),
  food('kiwi', 'Kiwi', 'fruta', 61, 1.1, 15, 0.5, 9, 3, [portion('unidade', 75), portion('100 g', 100)], 0.9),
  food('manga', 'Manga', 'fruta', 60, 0.8, 15, 0.4, 14, 1.6, [portion('unidade media', 200), portion('100 g', 100)], 0.9),
  food('arroz_cozido', 'Arroz cozido', 'base', 130, 2.7, 28, 0.3, 0.1, 0.4, [portion('colher de arroz media', 60), portion('colher de arroz cheia', 80), portion('100 g', 100)], 0.6),
  food('arroz_integral', 'Arroz integral cozido', 'base', 123, 2.7, 26, 1, 0.9, 1.8, [portion('colher de arroz media', 60), portion('100 g', 100)], 0.6),
  food('macarrao_cozido', 'Macarrao cozido', 'base', 157, 5.8, 31, 0.9, 0.6, 1.8, [portion('prato pequeno', 120), portion('100 g', 100)], 0.65),
  food('batata_cozida', 'Batata cozida', 'base', 87, 1.9, 20, 0.1, 0.9, 1.8, [portion('unidade media', 150), portion('100 g', 100)], 0.75),
  food('batata_doce', 'Batata doce', 'base', 86, 1.6, 20, 0.1, 4.2, 2.5, [portion('unidade media', 130), portion('100 g', 100)], 0.75),
  food('mandioca_cozida', 'Mandioca cozida', 'base', 125, 0.6, 30, 0.3, 1.6, 1.8, [portion('pedaco medio', 100), portion('100 g', 100)], 0.7),
  food('pao_frances', 'Pao frances', 'padaria/lanche', 300, 8, 58, 3.1, 2.5, 2.3, [portion('unidade media', 50), portion('100 g', 100)], 0.75),
  food('pao_de_forma', 'Pao de forma', 'padaria/lanche', 265, 9, 49, 3.2, 5, 2.7, [portion('fatia', 25), portion('100 g', 100)], 0.7),
  food('pao_de_queijo', 'Pao de queijo', 'padaria/lanche', 330, 7, 35, 18, 2, 1, [portion('pequeno', 25), portion('medio', 50), portion('grande', 80), portion('100 g', 100)], 0.6),
  food('pizza', 'Pizza', 'padaria/lanche', 266, 11, 33, 10, 3.6, 2.3, [portion('pedaco', 120), portion('100 g', 100)], 0.5),
  food('salgado_assado', 'Salgado assado', 'padaria/lanche', 280, 8, 34, 12, 3, 1.5, [portion('unidade', 100), portion('100 g', 100)], 0.6),
  food('salgado_frito', 'Salgado frito', 'padaria/lanche', 350, 9, 33, 20, 3, 1.5, [portion('unidade', 100), portion('100 g', 100)], 0.6),
  food('frango_grelhado', 'Frango grelhado', 'proteina', 165, 31, 0, 3.6, 0, 0, [portion('file medio', 100), portion('100 g', 100)], 0.5),
  food('frango_frito_crocante', 'Frango frito/crocante', 'proteina', 260, 24, 10, 13, 0.5, 0.6, [portion('pedaco medio', 100), portion('100 g', 100)], 0.4),
  food('carne_bovina', 'Carne bovina', 'proteina', 220, 26, 0, 13, 0, 0, [portion('bife medio', 100), portion('100 g', 100)], 0.4),
  food('carne_moida', 'Carne moida', 'proteina', 240, 25, 0, 16, 0, 0, [portion('porcao media', 100), portion('100 g', 100)], 0.4),
  food('peixe', 'Peixe', 'proteina', 128, 26, 0, 2.7, 0, 0, [portion('file medio', 100), portion('100 g', 100)], 0.5),
  food('sardinha', 'Sardinha', 'proteina', 208, 25, 0, 11, 0, 0, [portion('lata drenada', 84), portion('100 g', 100)], 0.4),
  food('atum', 'Atum', 'proteina', 132, 29, 0, 1, 0, 0, [portion('lata drenada', 120), portion('100 g', 100)], 0.4),
  food('ovo', 'Ovo', 'proteina', 143, 13, 1.1, 10, 0.4, 0, [portion('unidade media', 50), portion('100 g', 100)], 0.5),
  food('ovo_frito', 'Ovo frito', 'proteina', 196, 14, 1.1, 15, 0.4, 0, [portion('unidade media', 55), portion('100 g', 100)], 0.45),
  food('soup', 'Sopa', 'base', 30, 1.5, 4.5, 0.7, 1, 0.8, [portion('copo', 250)], 0.9),
  food('cereal_matinal', 'Cereal matinal', 'industrializado', 380, 7, 82, 3, 25, 4, [portion('porcao pequena', 25), portion('porcao media', 30), portion('xicara', 40), portion('100 g', 100)], 0.1),
  food('granola', 'Granola', 'industrializado', 450, 8, 65, 18, 20, 7, [portion('xicara', 40), portion('100 g', 100)], 0.1),
  food('barra_de_cereal', 'Barra de cereal', 'industrializado', 110, 2, 20, 4, 10, 1, [portion('unidade', 30), portion('100 g', 100)], 0.1),
  food('pudim', 'Pudim', 'doce/sobremesa', 210, 3, 25, 9, 24, 0.5, [portion('fatia media', 80), portion('100 g', 100)], 0.1),
  food('brigadeiro', 'Brigadeiro', 'doce/sobremesa', 110, 1.3, 15, 5, 10, 0.3, [portion('unidade', 20), portion('100 g', 100)], 0.1),
  food('beijinho', 'Beijinho', 'doce/sobremesa', 100, 1.2, 14, 5, 9, 0.4, [portion('unidade', 20), portion('100 g', 100)], 0.1),
  food('outro', 'Outro', 'outro', 0, 0, 0, 0, 0, 0, [portion('100 g', 100)], 0),
].map((item) => ({ ...baseSource, ...item }));

function food(slug, name, category, kcal, protein, carbs, fat, sugar, fiber, sodiumOrPortions, portionsOrHydration = [], hydrationOrUnit = 0, unitOrWater = 'g', maybeWater = false) {
  const legacyShape = Array.isArray(sodiumOrPortions);
  const sodium = legacyShape ? 0 : sodiumOrPortions;
  const default_portions = legacyShape ? sodiumOrPortions : portionsOrHydration;
  const hydration_factor = legacyShape ? Number(portionsOrHydration) || 0 : Number(hydrationOrUnit) || 0;
  const unit = legacyShape ? (typeof hydrationOrUnit === 'string' ? hydrationOrUnit : 'g') : (typeof unitOrWater === 'string' ? unitOrWater : 'g');
  const is_water = legacyShape ? Boolean(unitOrWater) : Boolean(maybeWater);
  return {
    slug,
    name,
    category,
    unit,
    base: '100g',
    kcal_per_100: kcal,
    protein_per_100: protein,
    carbs_per_100: carbs,
    fat_per_100: fat,
    sugar_per_100: sugar,
    fiber_per_100: fiber,
    sodium_per_100: sodium,
    default_portions,
    hydration_factor,
    is_water,
  };
}

function portion(label, grams) {
  return { label, grams };
}

export function findFood(slug) {
  return FOOD_DATABASE.find((item) => item.slug === slug);
}
