export const FOOD_SOURCE_OPTIONS = ['manual', 'TACO', 'USDA', 'OpenFoodFacts'];

const baseSource = { source: 'manual', source_note: 'estimativa media' };

export const FOOD_DATABASE = [
  food('maca', 'Maca', 'fruta', 52, 0.3, 14, 0.2, 10, 2.4, 1, [
    portion('unidade pequena', 100),
    portion('unidade media', 130),
    portion('unidade grande', 180),
  ]),
  food('banana', 'Banana', 'fruta', 89, 1.1, 23, 0.3, 12, 2.6, 1, [portion('unidade media', 86)]),
  food('laranja', 'Laranja', 'fruta', 47, 0.9, 12, 0.1, 9, 2.4, 0, [portion('unidade media', 130)]),
  food('mamao', 'Mamao', 'fruta', 43, 0.5, 11, 0.3, 8, 1.7, 8, [portion('fatia media', 170)]),
  food('uva', 'Uva', 'fruta', 69, 0.7, 18, 0.2, 15, 0.9, 2, [portion('cacho pequeno', 100)]),
  food('morango', 'Morango', 'fruta', 32, 0.7, 7.7, 0.3, 4.9, 2, 1, [portion('xicara', 150)]),
  food('arroz_cozido', 'Arroz cozido', 'base', 130, 2.7, 28, 0.3, 0.1, 0.4, 1, [portion('colher de arroz media', 60), portion('colher de arroz cheia', 80)]),
  food('feijao_cozido', 'Feijao cozido', 'base', 76, 4.8, 14, 0.5, 0.3, 8.5, 2, [portion('concha media', 100)]),
  food('feijao_preto_cozido', 'Feijao preto cozido', 'base', 77, 4.5, 14, 0.5, 0.3, 8.4, 2, [portion('concha media', 100)]),
  food('macarrao_cozido', 'Macarrao cozido', 'base', 157, 5.8, 31, 0.9, 0.6, 1.8, 1, [portion('prato pequeno', 120)]),
  food('batata_cozida', 'Batata cozida', 'base', 87, 1.9, 20, 0.1, 0.9, 1.8, 4, [portion('unidade media', 150)]),
  food('mandioca_cozida', 'Mandioca cozida', 'base', 125, 0.6, 30, 0.3, 1.6, 1.8, 1, [portion('pedaco medio', 100)]),
  food('ovo', 'Ovo', 'proteina', 143, 13, 1.1, 10, 0.4, 0, 142, [portion('unidade media', 50)]),
  food('ovo_frito', 'Ovo frito', 'proteina', 196, 14, 1.1, 15, 0.4, 0, 207, [portion('unidade media', 55)]),
  food('frango_grelhado', 'Frango grelhado', 'proteina', 165, 31, 0, 3.6, 0, 0, 74, [portion('file medio', 100)]),
  food('frango_frito_crocante', 'Frango frito/crocante', 'proteina', 260, 24, 10, 13, 0.5, 0.6, 420, [portion('pedaco medio', 100)]),
  food('carne_bovina', 'Carne bovina', 'proteina', 220, 26, 0, 13, 0, 0, 72, [portion('bife medio', 100)]),
  food('carne_moida', 'Carne moida', 'proteina', 240, 25, 0, 16, 0, 0, 75, [portion('porcao media', 100)]),
  food('peixe', 'Peixe', 'proteina', 128, 26, 0, 2.7, 0, 0, 56, [portion('file medio', 100)]),
  food('sardinha', 'Sardinha', 'proteina', 208, 25, 0, 11, 0, 0, 307, [portion('lata drenada', 84)]),
  food('atum', 'Atum', 'proteina', 132, 29, 0, 1, 0, 0, 300, [portion('lata drenada', 120)]),
  food('leite_integral', 'Leite integral', 'laticinio', 61, 3.2, 4.8, 3.3, 5, 0, 43, [portion('copo 250 ml', 250)]),
  food('leite_desnatado', 'Leite desnatado', 'laticinio', 34, 3.4, 5, 0.1, 5, 0, 50, [portion('copo 250 ml', 250)]),
  food('iogurte_natural', 'Iogurte natural', 'laticinio', 61, 3.5, 4.7, 3.3, 4.7, 0, 46, [portion('pote', 170)]),
  food('iogurte_com_frutas', 'Iogurte com frutas', 'laticinio', 100, 3.5, 18, 2, 14, 0.5, 45, [portion('pote', 170)]),
  food('queijo_mucarela', 'Queijo mucarela', 'laticinio', 300, 22, 2.2, 22, 1, 0, 620, [portion('fatia', 30)]),
  food('requeijao', 'Requeijao', 'laticinio', 250, 9, 4, 22, 2, 0, 600, [portion('colher de sopa', 30)]),
  food('whey_protein', 'Whey protein', 'suplemento', 400, 80, 8, 6, 5, 0, 250, [portion('scoop', 30)]),
  food('pao_frances', 'Pao frances', 'padaria/lanche', 300, 8, 58, 3.1, 2.5, 2.3, 580, [portion('unidade media', 50)]),
  food('pao_de_forma', 'Pao de forma', 'padaria/lanche', 265, 9, 49, 3.2, 5, 2.7, 490, [portion('fatia', 25)]),
  food('pao_de_queijo', 'Pao de queijo', 'padaria/lanche', 330, 7, 35, 18, 2, 1, 520, [portion('pequeno', 25), portion('medio', 50), portion('grande', 80)]),
  food('pizza', 'Pizza', 'padaria/lanche', 266, 11, 33, 10, 3.6, 2.3, 598, [portion('pedaco', 120)]),
  food('salgado_assado', 'Salgado assado', 'padaria/lanche', 280, 8, 34, 12, 3, 1.5, 520, [portion('unidade', 100)]),
  food('salgado_frito', 'Salgado frito', 'padaria/lanche', 350, 9, 33, 20, 3, 1.5, 620, [portion('unidade', 100)]),
  food('cafe_sem_acucar', 'Cafe sem acucar', 'bebida', 2, 0.1, 0, 0, 0, 0, 1, [portion('copo 180 ml', 180)]),
  food('cafe_com_acucar', 'Cafe com acucar', 'bebida com acucar', 40, 0.1, 10, 0, 10, 0, 1, [portion('copo 180 ml', 180)]),
  food('refrigerante_normal', 'Refrigerante normal', 'bebida com acucar', 42, 0, 10.6, 0, 10.6, 0, 5, [portion('copo 200 ml', 200), portion('lata', 350)]),
  food('refrigerante_zero', 'Refrigerante zero', 'bebida zero/sem acucar', 0, 0, 0, 0, 0, 0, 12, [portion('lata', 350)]),
  food('energetico_normal', 'Energetico normal', 'bebida com acucar', 45, 0, 11, 0, 11, 0, 80, [portion('lata 473 ml', 473)]),
  food('energetico_zero', 'Energetico zero', 'bebida zero/sem acucar', 0, 0, 0, 0, 0, 0, 80, [portion('lata 473 ml', 473)]),
  food('suco_natural', 'Suco natural', 'bebida', 45, 0.5, 10, 0.1, 8, 0.2, 2, [portion('copo 250 ml', 250)]),
  food('suco_adocado', 'Suco adocado', 'bebida com acucar', 70, 0.3, 17, 0.1, 15, 0.1, 2, [portion('copo 250 ml', 250)]),
  food('brocolis', 'Brocolis', 'legume/verdura', 35, 2.4, 7, 0.4, 1.7, 3.3, 33, [portion('xicara', 90)]),
  food('alface', 'Alface', 'legume/verdura', 15, 1.4, 2.9, 0.2, 0.8, 1.3, 28, [portion('prato pequeno', 50)]),
  food('repolho', 'Repolho', 'legume/verdura', 25, 1.3, 5.8, 0.1, 3.2, 2.5, 18, [portion('xicara', 90)]),
  food('cenoura', 'Cenoura', 'legume/verdura', 41, 0.9, 10, 0.2, 4.7, 2.8, 69, [portion('unidade media', 60)]),
  food('tomate', 'Tomate', 'legume/verdura', 18, 0.9, 3.9, 0.2, 2.6, 1.2, 5, [portion('unidade media', 120)]),
  food('salada_mista', 'Salada mista', 'legume/verdura', 25, 1.3, 5, 0.2, 2.5, 2, 30, [portion('prato', 100)]),
  food('molho_barbecue', 'Molho barbecue', 'molho', 170, 1, 40, 0.5, 35, 1, 900, [portion('colher de sopa', 20)]),
  food('molho_mostarda_mel', 'Molho mostarda e mel', 'molho', 250, 1, 30, 13, 25, 0.5, 800, [portion('colher de sopa', 20)]),
  food('maionese', 'Maionese', 'molho', 680, 1, 1, 75, 1, 0, 635, [portion('colher de sopa', 15)]),
  food('ketchup', 'Ketchup', 'molho', 112, 1.3, 26, 0.2, 22, 0.3, 907, [portion('colher de sopa', 15)]),
  food('chocolate', 'Chocolate', 'doce/sobremesa', 535, 7.6, 59, 30, 52, 3.4, 79, [portion('barra pequena', 25)]),
  food('bolacha_recheada', 'Bolacha recheada', 'doce/sobremesa', 480, 5, 72, 20, 38, 2, 300, [portion('3 unidades', 30)]),
  food('pessego_em_calda', 'Pessego em calda', 'doce/sobremesa', 74, 0.4, 19, 0.1, 17, 1, 3, [portion('metade', 50)]),
].map((item) => ({ ...baseSource, ...item }));

function food(slug, name, category, kcal, protein, carbs, fat, sugar, fiber, sodium, default_portions) {
  return { slug, name, category, base: '100g', kcal_per_100: kcal, protein_per_100: protein, carbs_per_100: carbs, fat_per_100: fat, sugar_per_100: sugar, fiber_per_100: fiber, sodium_per_100: sodium, default_portions };
}

function portion(label, grams) {
  return { label, grams };
}

export function normalizeFoodText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(\w+)s\b/g, '$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function searchFoods(query, limit = 8) {
  const normalized = normalizeFoodText(query);
  if (!normalized) return FOOD_DATABASE.slice(0, limit);
  return FOOD_DATABASE
    .filter((item) => normalizeFoodText(`${item.name} ${item.slug} ${item.category}`).includes(normalized))
    .slice(0, limit);
}

export function findFood(slug) {
  return FOOD_DATABASE.find((item) => item.slug === slug);
}
