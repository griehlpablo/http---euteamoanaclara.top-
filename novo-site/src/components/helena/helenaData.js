export const HELENA_PERSON = 'helena';

export const HELENA_STORAGE = {
  access: 'planohelena_access',
  selectedDate: 'planohelena_selected_date',
  currentLog: 'planohelena_current_log',
  draftLog: 'planohelena_draft_log',
  notificationSettings: 'planohelena_notification_settings',
  offlineBackup: 'planohelena_offline_backup',
  pendingSync: 'planohelena_pending_sync',
  syncMeta: 'planohelena_pending_sync_meta',
  debugLog: 'planohelena_debug_log',
  lastNotificationAt: 'planohelena_last_notification_at',
  pwaSettings: 'planohelena_pwa_settings',
  collapsedSections: 'planohelena_collapsed_sections',
  foodFavorites: 'planohelena_food_favorites',
  recentFoods: 'planohelena_recent_foods',
  savedMeals: 'planohelena_saved_meals',
  customFoods: 'planohelena_custom_foods',
  openFoodFactsCache: 'planohelena_openfoodfacts_cache',
};

export const HELENA_PROFILE = {
  name: 'Helena',
  age: 23,
  height: '1,57 m',
  initialWeight: 63,
  goal: 'Recomposicao corporal: perder gordura, melhorar definicao e manter/ganhar massa magra.',
  calories: [1700, 2000],
  protein: [100, 125],
  water: [2300, 2500],
};

export const HELENA_SCHEDULE = [
  ['07h40', 'Acordar + agua'],
  ['08h00', 'Trabalho'],
  ['10h00', 'Agua / lanche leve, se precisar'],
  ['12h00', 'Saida do trabalho'],
  ['12h15/12h30', 'Musculacao'],
  ['13h30', 'Almoco/pos-treino com proteina'],
  ['14h30', 'Volta ao trabalho'],
  ['17h00', 'Saida do trabalho'],
  ['17h30/18h00', 'Lanche ou janta leve'],
  ['19h30', 'Faculdade'],
  ['22h30/23h30', 'Ceia leve, se necessario'],
  ['01h40', 'Dormir'],
];

export const HELENA_FOODS = {
  arroz: { label: 'Arroz cozido', unit: 'g', kcal: 130, protein: 2.5, sugar: 0, basis: 100 },
  feijao: { label: 'Feijao 100 g', unit: 'g', kcal: 76, protein: 4.8, sugar: 0, basis: 100 },
  carne: { label: 'Carne bovina', unit: 'g', kcal: 220, protein: 26, sugar: 0, basis: 100 },
  frango: { label: 'Frango', unit: 'g', kcal: 165, protein: 31, sugar: 0, basis: 100 },
  ovo: { label: 'Ovo 1 unidade', unit: 'unidade', kcal: 70, protein: 6, sugar: 0.4, basis: 1 },
  macarrao: { label: 'Macarrao cozido', unit: 'g', kcal: 157, protein: 5.8, sugar: 0.6, basis: 100 },
  salada: { label: 'Salada/legumes', unit: 'g', kcal: 25, protein: 1.5, sugar: 2, basis: 100 },
  pao: { label: 'Pao frances', unit: 'unidade', kcal: 150, protein: 5, sugar: 2.5, basis: 1 },
  pao_queijo: { label: 'Pao com queijo', unit: 'unidade', kcal: 220, protein: 10, sugar: 3, basis: 1 },
  pao_requeijao: { label: 'Pao com requeijao', unit: 'unidade', kcal: 210, protein: 7, sugar: 3, basis: 1 },
  pao_ovo: { label: 'Pao com ovo', unit: 'unidade', kcal: 220, protein: 11, sugar: 3, basis: 1 },
  iogurte: { label: 'Iogurte', unit: 'unidade', kcal: 120, protein: 6, sugar: 12, basis: 1 },
  iogurte_frutas: { label: 'Iogurte com frutas', unit: 'unidade', kcal: 170, protein: 7, sugar: 22, basis: 1 },
  banana: { label: 'Banana', unit: 'unidade', kcal: 90, protein: 1, sugar: 12, basis: 1 },
  maca: { label: 'Maca', unit: 'unidade', kcal: 70, protein: 0.3, sugar: 14, basis: 1 },
  leite: { label: 'Leite', unit: 'ml', kcal: 60, protein: 3, sugar: 5, basis: 100 },
  vitamina: { label: 'Vitamina', unit: 'ml', kcal: 95, protein: 4, sugar: 11, basis: 100 },
  cafe_acucar: { label: 'Cafe com acucar', unit: 'ml', kcal: 11, protein: 0, sugar: 2.75, basis: 100, liquidSugar: true },
  cafe_sem_acucar: { label: 'Cafe sem acucar', unit: 'ml', kcal: 0, protein: 0, sugar: 0, basis: 100 },
  whey: { label: 'Whey 1 scoop', unit: 'scoop', kcal: 120, protein: 24, sugar: 2, basis: 1 },
  whey_leite: { label: 'Whey com leite', unit: 'unidade', kcal: 270, protein: 31, sugar: 14, basis: 1 },
  whey_agua: { label: 'Whey com agua', unit: 'unidade', kcal: 120, protein: 24, sugar: 2, basis: 1 },
  iogurte_whey: { label: 'Iogurte + whey', unit: 'unidade', kcal: 240, protein: 28, sugar: 10, basis: 1 },
  vitamina_whey: { label: 'Vitamina com whey', unit: 'ml', kcal: 150, protein: 12, sugar: 10, basis: 100 },
  doce: { label: 'Chocolate/doce', unit: 'g', kcal: 390, protein: 2, sugar: 55, basis: 100 },
  refrigerante_normal: { label: 'Refrigerante normal', unit: 'ml', kcal: 42, protein: 0, sugar: 10.6, basis: 100, liquidSugar: true },
  refrigerante_zero: { label: 'Refrigerante zero', unit: 'ml', kcal: 0, protein: 0, sugar: 0, basis: 100 },
  suco: { label: 'Suco', unit: 'ml', kcal: 48, protein: 0, sugar: 11, basis: 100, liquidSugar: true },
  salgado: { label: 'Salgado', unit: 'unidade', kcal: 280, protein: 8, sugar: 3, basis: 1 },
  pizza: { label: 'Pizza', unit: 'pedaco', kcal: 260, protein: 11, sugar: 3, basis: 1 },
  fast_food: { label: 'Fast food', unit: 'unidade', kcal: 550, protein: 20, sugar: 8, basis: 1 },
};

export const HELENA_MEALS = {
  breakfast: 'Cafe da manha',
  lunch: 'Almoco',
  snack: 'Lanche',
  dinner: 'Janta',
  supper: 'Ceia',
  extras: 'Extras',
};

export const HELENA_MEAL_OPTIONS = {
  breakfast: ['pao', 'pao_queijo', 'pao_requeijao', 'pao_ovo', 'ovo', 'iogurte', 'iogurte_frutas', 'banana', 'maca', 'cafe_acucar', 'cafe_sem_acucar'],
  lunch: ['arroz', 'feijao', 'carne', 'frango', 'ovo', 'macarrao', 'salada'],
  snack: ['iogurte', 'banana', 'maca', 'pao_ovo', 'leite', 'vitamina', 'whey', 'whey_leite', 'whey_agua', 'iogurte_whey', 'vitamina_whey'],
  dinner: ['arroz', 'feijao', 'carne', 'frango', 'ovo', 'macarrao', 'salada'],
  supper: ['iogurte', 'leite', 'banana', 'whey'],
  extras: ['doce', 'refrigerante_normal', 'refrigerante_zero', 'suco', 'salgado', 'pizza', 'fast_food'],
};

export const HELENA_CATEGORIES = [
  'comida de verdade',
  'proteina',
  'carboidrato',
  'gordura/molho',
  'fruta',
  'legume/verdura',
  'laticinio',
  'bebida com acucar',
  'bebida zero/sem acucar',
  'doce/sobremesa',
  'processado',
  'ultraprocessado',
  'lanche/padaria',
  'fast food',
  'suplemento',
  'outro',
];

export const HELENA_UNITS = ['g', 'ml', 'unidade', 'fatia', 'pedaco', 'colher de sopa', 'colher de cha', 'colher de arroz', 'concha', 'copo 180 ml', 'copo 250 ml', 'xicara', 'scoop'];
