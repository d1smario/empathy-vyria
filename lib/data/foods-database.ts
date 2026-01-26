/**
 * EMPATHY Foods Database
 * Database completo di alimenti con valori nutrizionali reali,
 * allergeni, tag e compatibilità per diete specifiche
 */

export interface FoodItem {
  id: string
  name: string
  category: 'protein' | 'carb' | 'fat' | 'vegetable' | 'fruit' | 'dairy' | 'legume' | 'grain' | 'nut' | 'condiment'
  // Valori per 100g
  nutrition: {
    kcal: number
    cho_g: number
    pro_g: number
    fat_g: number
    fiber_g: number
    sugar_g: number
    sodium_mg: number
  }
  // Allergeni presenti
  allergens: string[]
  // Tag per filtraggio
  tags: string[]
  // Compatibilità diete
  is_gluten_free: boolean
  is_lactose_free: boolean
  is_vegan: boolean
  is_vegetarian: boolean
  is_keto_friendly: boolean
  is_low_fodmap: boolean
  // Indice glicemico
  glycemic_index: 'low' | 'medium' | 'high'
  // Momento consigliato
  best_for: ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout')[]
}

export const FOODS_DATABASE: FoodItem[] = [
  // ==================== PROTEINE ====================
  {
    id: 'chicken_breast',
    name: 'Petto di pollo',
    category: 'protein',
    nutrition: { kcal: 165, cho_g: 0, pro_g: 31, fat_g: 3.6, fiber_g: 0, sugar_g: 0, sodium_mg: 74 },
    allergens: [],
    tags: ['carne', 'pollo', 'magro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'post_workout']
  },
  {
    id: 'turkey_breast',
    name: 'Petto di tacchino',
    category: 'protein',
    nutrition: { kcal: 135, cho_g: 0, pro_g: 30, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 65 },
    allergens: [],
    tags: ['carne', 'tacchino', 'magro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'post_workout']
  },
  {
    id: 'beef_lean',
    name: 'Manzo magro',
    category: 'protein',
    nutrition: { kcal: 250, cho_g: 0, pro_g: 26, fat_g: 15, fiber_g: 0, sugar_g: 0, sodium_mg: 72 },
    allergens: [],
    tags: ['carne', 'manzo', 'rosso'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'salmon',
    name: 'Salmone',
    category: 'protein',
    nutrition: { kcal: 208, cho_g: 0, pro_g: 20, fat_g: 13, fiber_g: 0, sugar_g: 0, sodium_mg: 59 },
    allergens: ['pesce'],
    tags: ['pesce', 'omega3', 'grasso'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'tuna_natural',
    name: 'Tonno al naturale',
    category: 'protein',
    nutrition: { kcal: 116, cho_g: 0, pro_g: 26, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 40 },
    allergens: ['pesce'],
    tags: ['pesce', 'magro', 'conservato'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'cod',
    name: 'Merluzzo',
    category: 'protein',
    nutrition: { kcal: 82, cho_g: 0, pro_g: 18, fat_g: 0.7, fiber_g: 0, sugar_g: 0, sodium_mg: 54 },
    allergens: ['pesce'],
    tags: ['pesce', 'bianco', 'magro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'shrimp',
    name: 'Gamberi',
    category: 'protein',
    nutrition: { kcal: 99, cho_g: 0.2, pro_g: 24, fat_g: 0.3, fiber_g: 0, sugar_g: 0, sodium_mg: 111 },
    allergens: ['crostacei'],
    tags: ['crostacei', 'magro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'eggs',
    name: 'Uova',
    category: 'protein',
    nutrition: { kcal: 155, cho_g: 1.1, pro_g: 13, fat_g: 11, fiber_g: 0, sugar_g: 1.1, sodium_mg: 124 },
    allergens: ['uova'],
    tags: ['uova', 'versatile'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  {
    id: 'egg_whites',
    name: 'Albume d\'uovo',
    category: 'protein',
    nutrition: { kcal: 52, cho_g: 0.7, pro_g: 11, fat_g: 0.2, fiber_g: 0, sugar_g: 0.7, sodium_mg: 166 },
    allergens: ['uova'],
    tags: ['uova', 'magro', 'alto-proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'post_workout']
  },
  {
    id: 'tofu',
    name: 'Tofu',
    category: 'protein',
    nutrition: { kcal: 76, cho_g: 1.9, pro_g: 8, fat_g: 4.8, fiber_g: 0.3, sugar_g: 0.6, sodium_mg: 7 },
    allergens: ['soia'],
    tags: ['soia', 'vegetale', 'proteina'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'tempeh',
    name: 'Tempeh',
    category: 'protein',
    nutrition: { kcal: 193, cho_g: 9.4, pro_g: 19, fat_g: 11, fiber_g: 0, sugar_g: 0, sodium_mg: 9 },
    allergens: ['soia'],
    tags: ['soia', 'vegetale', 'fermentato'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'greek_yogurt',
    name: 'Yogurt greco',
    category: 'dairy',
    nutrition: { kcal: 97, cho_g: 3.6, pro_g: 9, fat_g: 5, fiber_g: 0, sugar_g: 3.6, sodium_mg: 36 },
    allergens: ['latte', 'lattosio'],
    tags: ['latticini', 'proteico', 'cremoso'],
    is_gluten_free: true, is_lactose_free: false, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  {
    id: 'skyr',
    name: 'Skyr',
    category: 'dairy',
    nutrition: { kcal: 63, cho_g: 4, pro_g: 11, fat_g: 0.2, fiber_g: 0, sugar_g: 4, sodium_mg: 46 },
    allergens: ['latte', 'lattosio'],
    tags: ['latticini', 'proteico', 'magro'],
    is_gluten_free: true, is_lactose_free: false, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  {
    id: 'cottage_cheese',
    name: 'Fiocchi di latte',
    category: 'dairy',
    nutrition: { kcal: 98, cho_g: 3.4, pro_g: 11, fat_g: 4.3, fiber_g: 0, sugar_g: 2.7, sodium_mg: 364 },
    allergens: ['latte', 'lattosio'],
    tags: ['latticini', 'proteico', 'fresco'],
    is_gluten_free: true, is_lactose_free: false, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'dinner']
  },
  
  // ==================== CARBOIDRATI ====================
  {
    id: 'rice_white',
    name: 'Riso bianco',
    category: 'carb',
    nutrition: { kcal: 130, cho_g: 28, pro_g: 2.7, fat_g: 0.3, fiber_g: 0.4, sugar_g: 0, sodium_mg: 1 },
    allergens: [],
    tags: ['cereali', 'riso', 'semplice'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'high',
    best_for: ['lunch', 'dinner', 'post_workout']
  },
  {
    id: 'rice_basmati',
    name: 'Riso basmati',
    category: 'carb',
    nutrition: { kcal: 121, cho_g: 25, pro_g: 3.5, fat_g: 0.4, fiber_g: 0.6, sugar_g: 0, sodium_mg: 1 },
    allergens: [],
    tags: ['cereali', 'riso', 'aromatico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'rice_brown',
    name: 'Riso integrale',
    category: 'carb',
    nutrition: { kcal: 111, cho_g: 23, pro_g: 2.6, fat_g: 0.9, fiber_g: 1.8, sugar_g: 0.4, sodium_mg: 5 },
    allergens: [],
    tags: ['cereali', 'riso', 'integrale'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'quinoa',
    name: 'Quinoa',
    category: 'carb',
    nutrition: { kcal: 120, cho_g: 21, pro_g: 4.4, fat_g: 1.9, fiber_g: 2.8, sugar_g: 0.9, sodium_mg: 7 },
    allergens: [],
    tags: ['pseudocereale', 'proteico', 'completo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'oats',
    name: 'Fiocchi d\'avena',
    category: 'carb',
    nutrition: { kcal: 389, cho_g: 66, pro_g: 17, fat_g: 7, fiber_g: 10, sugar_g: 1, sodium_mg: 2 },
    allergens: ['glutine'],
    tags: ['cereali', 'avena', 'integrale', 'colazione'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'pre_workout']
  },
  {
    id: 'oats_gluten_free',
    name: 'Fiocchi d\'avena senza glutine',
    category: 'carb',
    nutrition: { kcal: 389, cho_g: 66, pro_g: 17, fat_g: 7, fiber_g: 10, sugar_g: 1, sodium_mg: 2 },
    allergens: [],
    tags: ['cereali', 'avena', 'senza-glutine', 'colazione'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'pre_workout']
  },
  {
    id: 'pasta',
    name: 'Pasta di semola',
    category: 'carb',
    nutrition: { kcal: 131, cho_g: 25, pro_g: 5, fat_g: 1.1, fiber_g: 1.8, sugar_g: 0.6, sodium_mg: 1 },
    allergens: ['glutine', 'grano'],
    tags: ['cereali', 'pasta', 'grano'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner', 'pre_workout']
  },
  {
    id: 'pasta_integral',
    name: 'Pasta integrale',
    category: 'carb',
    nutrition: { kcal: 124, cho_g: 25, pro_g: 5.3, fat_g: 1.1, fiber_g: 4, sugar_g: 0.8, sodium_mg: 4 },
    allergens: ['glutine', 'grano'],
    tags: ['cereali', 'pasta', 'integrale'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'pasta_rice',
    name: 'Pasta di riso',
    category: 'carb',
    nutrition: { kcal: 109, cho_g: 24, pro_g: 0.9, fat_g: 0.2, fiber_g: 0.9, sugar_g: 0, sodium_mg: 3 },
    allergens: [],
    tags: ['riso', 'pasta', 'senza-glutine'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'high',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'bread_whole',
    name: 'Pane integrale',
    category: 'carb',
    nutrition: { kcal: 247, cho_g: 41, pro_g: 13, fat_g: 3.4, fiber_g: 7, sugar_g: 5.6, sodium_mg: 450 },
    allergens: ['glutine', 'grano'],
    tags: ['pane', 'integrale', 'fibre'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'lunch', 'snack']
  },
  {
    id: 'bread_gluten_free',
    name: 'Pane senza glutine',
    category: 'carb',
    nutrition: { kcal: 250, cho_g: 48, pro_g: 3.5, fat_g: 4.5, fiber_g: 3, sugar_g: 4, sodium_mg: 420 },
    allergens: [],
    tags: ['pane', 'senza-glutine'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'high',
    best_for: ['breakfast', 'lunch', 'snack']
  },
  {
    id: 'sweet_potato',
    name: 'Patata dolce',
    category: 'carb',
    nutrition: { kcal: 86, cho_g: 20, pro_g: 1.6, fat_g: 0.1, fiber_g: 3, sugar_g: 4.2, sodium_mg: 55 },
    allergens: [],
    tags: ['tubero', 'complesso', 'antiossidante'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner', 'pre_workout', 'post_workout']
  },
  {
    id: 'potato',
    name: 'Patata',
    category: 'carb',
    nutrition: { kcal: 77, cho_g: 17, pro_g: 2, fat_g: 0.1, fiber_g: 2.2, sugar_g: 0.8, sodium_mg: 6 },
    allergens: [],
    tags: ['tubero', 'semplice'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'high',
    best_for: ['lunch', 'dinner', 'post_workout']
  },
  {
    id: 'banana',
    name: 'Banana',
    category: 'fruit',
    nutrition: { kcal: 89, cho_g: 23, pro_g: 1.1, fat_g: 0.3, fiber_g: 2.6, sugar_g: 12, sodium_mg: 1 },
    allergens: [],
    tags: ['frutta', 'energia', 'potassio'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'snack', 'pre_workout', 'post_workout']
  },
  
  // ==================== GRASSI SANI ====================
  {
    id: 'avocado',
    name: 'Avocado',
    category: 'fat',
    nutrition: { kcal: 160, cho_g: 9, pro_g: 2, fat_g: 15, fiber_g: 7, sugar_g: 0.7, sodium_mg: 7 },
    allergens: [],
    tags: ['frutta', 'grasso-sano', 'omega'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  {
    id: 'olive_oil',
    name: 'Olio extravergine d\'oliva',
    category: 'fat',
    nutrition: { kcal: 884, cho_g: 0, pro_g: 0, fat_g: 100, fiber_g: 0, sugar_g: 0, sodium_mg: 2 },
    allergens: [],
    tags: ['olio', 'mediterraneo', 'omega9'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'coconut_oil',
    name: 'Olio di cocco',
    category: 'fat',
    nutrition: { kcal: 862, cho_g: 0, pro_g: 0, fat_g: 100, fiber_g: 0, sugar_g: 0, sodium_mg: 0 },
    allergens: [],
    tags: ['olio', 'mct', 'saturo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'pre_workout']
  },
  {
    id: 'almonds',
    name: 'Mandorle',
    category: 'nut',
    nutrition: { kcal: 579, cho_g: 22, pro_g: 21, fat_g: 50, fiber_g: 12, sugar_g: 4.4, sodium_mg: 1 },
    allergens: ['frutta a guscio'],
    tags: ['frutta-secca', 'proteico', 'snack'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['snack', 'breakfast']
  },
  {
    id: 'walnuts',
    name: 'Noci',
    category: 'nut',
    nutrition: { kcal: 654, cho_g: 14, pro_g: 15, fat_g: 65, fiber_g: 7, sugar_g: 2.6, sodium_mg: 2 },
    allergens: ['frutta a guscio'],
    tags: ['frutta-secca', 'omega3', 'cervello'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['snack', 'breakfast']
  },
  {
    id: 'almond_butter',
    name: 'Burro di mandorle',
    category: 'nut',
    nutrition: { kcal: 614, cho_g: 19, pro_g: 21, fat_g: 56, fiber_g: 10, sugar_g: 4.4, sodium_mg: 227 },
    allergens: ['frutta a guscio'],
    tags: ['crema', 'proteico', 'energia'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'pre_workout']
  },
  {
    id: 'peanut_butter',
    name: 'Burro di arachidi',
    category: 'nut',
    nutrition: { kcal: 588, cho_g: 20, pro_g: 25, fat_g: 50, fiber_g: 6, sugar_g: 9.2, sodium_mg: 459 },
    allergens: ['arachidi'],
    tags: ['crema', 'proteico', 'energia'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'pre_workout']
  },
  
  // ==================== LATTICINI E ALTERNATIVE ====================
  {
    id: 'milk_whole',
    name: 'Latte intero',
    category: 'dairy',
    nutrition: { kcal: 61, cho_g: 4.8, pro_g: 3.2, fat_g: 3.3, fiber_g: 0, sugar_g: 5, sodium_mg: 43 },
    allergens: ['latte', 'lattosio'],
    tags: ['latticini', 'calcio', 'proteine'],
    is_gluten_free: true, is_lactose_free: false, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  {
    id: 'milk_lactose_free',
    name: 'Latte senza lattosio',
    category: 'dairy',
    nutrition: { kcal: 47, cho_g: 4.8, pro_g: 3.3, fat_g: 1.5, fiber_g: 0, sugar_g: 4.8, sodium_mg: 44 },
    allergens: ['latte'],
    tags: ['latticini', 'calcio', 'delattosato'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  {
    id: 'milk_almond',
    name: 'Latte di mandorla',
    category: 'dairy',
    nutrition: { kcal: 15, cho_g: 0.3, pro_g: 0.6, fat_g: 1.1, fiber_g: 0.2, sugar_g: 0, sodium_mg: 67 },
    allergens: ['frutta a guscio'],
    tags: ['vegetale', 'senza-lattosio', 'leggero'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'milk_oat',
    name: 'Latte d\'avena',
    category: 'dairy',
    nutrition: { kcal: 43, cho_g: 6.7, pro_g: 1, fat_g: 1.5, fiber_g: 0.8, sugar_g: 4, sodium_mg: 36 },
    allergens: ['glutine'],
    tags: ['vegetale', 'senza-lattosio', 'cremoso'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'milk_coconut',
    name: 'Latte di cocco',
    category: 'dairy',
    nutrition: { kcal: 20, cho_g: 2.8, pro_g: 0.2, fat_g: 0.9, fiber_g: 0, sugar_g: 2.8, sodium_mg: 15 },
    allergens: [],
    tags: ['vegetale', 'senza-lattosio', 'tropicale'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'milk_soy',
    name: 'Latte di soia',
    category: 'dairy',
    nutrition: { kcal: 33, cho_g: 1.2, pro_g: 2.8, fat_g: 1.8, fiber_g: 0.4, sugar_g: 1, sodium_mg: 32 },
    allergens: ['soia'],
    tags: ['vegetale', 'senza-lattosio', 'proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  {
    id: 'yogurt_coconut',
    name: 'Yogurt di cocco',
    category: 'dairy',
    nutrition: { kcal: 185, cho_g: 11, pro_g: 1.5, fat_g: 14, fiber_g: 1, sugar_g: 8, sodium_mg: 25 },
    allergens: [],
    tags: ['vegetale', 'senza-lattosio', 'probiotico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'yogurt_soy',
    name: 'Yogurt di soia',
    category: 'dairy',
    nutrition: { kcal: 54, cho_g: 2.7, pro_g: 4.5, fat_g: 2.3, fiber_g: 0.6, sugar_g: 1.5, sodium_mg: 40 },
    allergens: ['soia'],
    tags: ['vegetale', 'senza-lattosio', 'proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  
  // ==================== VERDURE ====================
  {
    id: 'spinach',
    name: 'Spinaci',
    category: 'vegetable',
    nutrition: { kcal: 23, cho_g: 3.6, pro_g: 2.9, fat_g: 0.4, fiber_g: 2.2, sugar_g: 0.4, sodium_mg: 79 },
    allergens: [],
    tags: ['verdura', 'ferro', 'verde'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    category: 'vegetable',
    nutrition: { kcal: 34, cho_g: 7, pro_g: 2.8, fat_g: 0.4, fiber_g: 2.6, sugar_g: 1.7, sodium_mg: 33 },
    allergens: [],
    tags: ['verdura', 'crucifere', 'vitamina-c'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'zucchini',
    name: 'Zucchine',
    category: 'vegetable',
    nutrition: { kcal: 17, cho_g: 3.1, pro_g: 1.2, fat_g: 0.3, fiber_g: 1, sugar_g: 2.5, sodium_mg: 8 },
    allergens: [],
    tags: ['verdura', 'leggera', 'versatile'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'tomatoes',
    name: 'Pomodori',
    category: 'vegetable',
    nutrition: { kcal: 18, cho_g: 3.9, pro_g: 0.9, fat_g: 0.2, fiber_g: 1.2, sugar_g: 2.6, sodium_mg: 5 },
    allergens: [],
    tags: ['verdura', 'licopene', 'mediterraneo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'bell_pepper',
    name: 'Peperoni',
    category: 'vegetable',
    nutrition: { kcal: 31, cho_g: 6, pro_g: 1, fat_g: 0.3, fiber_g: 2.1, sugar_g: 4.2, sodium_mg: 4 },
    allergens: [],
    tags: ['verdura', 'vitamina-c', 'colorato'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'cucumber',
    name: 'Cetriolo',
    category: 'vegetable',
    nutrition: { kcal: 16, cho_g: 3.6, pro_g: 0.7, fat_g: 0.1, fiber_g: 0.5, sugar_g: 1.7, sodium_mg: 2 },
    allergens: [],
    tags: ['verdura', 'idratante', 'fresco'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'carrot',
    name: 'Carote',
    category: 'vegetable',
    nutrition: { kcal: 41, cho_g: 10, pro_g: 0.9, fat_g: 0.2, fiber_g: 2.8, sugar_g: 4.7, sodium_mg: 69 },
    allergens: [],
    tags: ['verdura', 'beta-carotene', 'dolce'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'asparagus',
    name: 'Asparagi',
    category: 'vegetable',
    nutrition: { kcal: 20, cho_g: 3.9, pro_g: 2.2, fat_g: 0.1, fiber_g: 2.1, sugar_g: 1.9, sodium_mg: 2 },
    allergens: [],
    tags: ['verdura', 'diuretico', 'primaverile'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'olives',
    name: 'Olive',
    category: 'vegetable',
    nutrition: { kcal: 115, cho_g: 6, pro_g: 0.8, fat_g: 11, fiber_g: 3.2, sugar_g: 0, sodium_mg: 735 },
    allergens: [],
    tags: ['verdura', 'grasso-sano', 'mediterraneo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  
  // ==================== LEGUMI ====================
  {
    id: 'chickpeas',
    name: 'Ceci',
    category: 'legume',
    nutrition: { kcal: 164, cho_g: 27, pro_g: 9, fat_g: 2.6, fiber_g: 8, sugar_g: 4.8, sodium_mg: 7 },
    allergens: [],
    tags: ['legumi', 'proteico', 'fibre'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'lentils',
    name: 'Lenticchie',
    category: 'legume',
    nutrition: { kcal: 116, cho_g: 20, pro_g: 9, fat_g: 0.4, fiber_g: 8, sugar_g: 1.8, sodium_mg: 2 },
    allergens: [],
    tags: ['legumi', 'ferro', 'proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'black_beans',
    name: 'Fagioli neri',
    category: 'legume',
    nutrition: { kcal: 132, cho_g: 24, pro_g: 9, fat_g: 0.5, fiber_g: 8, sugar_g: 0.3, sodium_mg: 1 },
    allergens: [],
    tags: ['legumi', 'fibre', 'proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  
  // ==================== FRUTTA ====================
  {
    id: 'apple',
    name: 'Mela',
    category: 'fruit',
    nutrition: { kcal: 52, cho_g: 14, pro_g: 0.3, fat_g: 0.2, fiber_g: 2.4, sugar_g: 10, sodium_mg: 1 },
    allergens: [],
    tags: ['frutta', 'fibre', 'snack'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['snack', 'breakfast']
  },
  {
    id: 'berries_mixed',
    name: 'Frutti di bosco misti',
    category: 'fruit',
    nutrition: { kcal: 43, cho_g: 10, pro_g: 1, fat_g: 0.3, fiber_g: 2, sugar_g: 5, sodium_mg: 1 },
    allergens: [],
    tags: ['frutta', 'antiossidanti', 'basso-gi'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'orange',
    name: 'Arancia',
    category: 'fruit',
    nutrition: { kcal: 47, cho_g: 12, pro_g: 0.9, fat_g: 0.1, fiber_g: 2.4, sugar_g: 9.4, sodium_mg: 0 },
    allergens: [],
    tags: ['frutta', 'vitamina-c', 'agrume'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'dates',
    name: 'Datteri',
    category: 'fruit',
    nutrition: { kcal: 282, cho_g: 75, pro_g: 2.5, fat_g: 0.4, fiber_g: 8, sugar_g: 63, sodium_mg: 2 },
    allergens: [],
    tags: ['frutta', 'energia', 'naturale'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'high',
    best_for: ['pre_workout', 'snack']
  },

  // ==================== NUOVI ALIMENTI AGGIUNTI ====================
  
  // PROTEINE AGGIUNTIVE
  {
    id: 'pork_tenderloin',
    name: 'Filetto di maiale',
    category: 'protein',
    nutrition: { kcal: 143, cho_g: 0, pro_g: 26, fat_g: 3.5, fiber_g: 0, sugar_g: 0, sodium_mg: 55 },
    allergens: [],
    tags: ['carne', 'maiale', 'magro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'lamb_leg',
    name: 'Coscia di agnello',
    category: 'protein',
    nutrition: { kcal: 234, cho_g: 0, pro_g: 25, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 65 },
    allergens: [],
    tags: ['carne', 'agnello', 'rosso'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'duck_breast',
    name: 'Petto di anatra',
    category: 'protein',
    nutrition: { kcal: 201, cho_g: 0, pro_g: 24, fat_g: 11, fiber_g: 0, sugar_g: 0, sodium_mg: 65 },
    allergens: [],
    tags: ['carne', 'anatra', 'ferro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['dinner']
  },
  {
    id: 'rabbit',
    name: 'Coniglio',
    category: 'protein',
    nutrition: { kcal: 173, cho_g: 0, pro_g: 33, fat_g: 3.5, fiber_g: 0, sugar_g: 0, sodium_mg: 45 },
    allergens: [],
    tags: ['carne', 'coniglio', 'magro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'sea_bass',
    name: 'Branzino',
    category: 'protein',
    nutrition: { kcal: 97, cho_g: 0, pro_g: 18, fat_g: 2, fiber_g: 0, sugar_g: 0, sodium_mg: 70 },
    allergens: ['pesce'],
    tags: ['pesce', 'bianco', 'mediterraneo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'sea_bream',
    name: 'Orata',
    category: 'protein',
    nutrition: { kcal: 100, cho_g: 0, pro_g: 19, fat_g: 2.5, fiber_g: 0, sugar_g: 0, sodium_mg: 65 },
    allergens: ['pesce'],
    tags: ['pesce', 'bianco', 'mediterraneo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'trout',
    name: 'Trota',
    category: 'protein',
    nutrition: { kcal: 119, cho_g: 0, pro_g: 20, fat_g: 3.5, fiber_g: 0, sugar_g: 0, sodium_mg: 50 },
    allergens: ['pesce'],
    tags: ['pesce', 'omega3', 'acqua dolce'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'mackerel',
    name: 'Sgombro',
    category: 'protein',
    nutrition: { kcal: 205, cho_g: 0, pro_g: 19, fat_g: 14, fiber_g: 0, sugar_g: 0, sodium_mg: 90 },
    allergens: ['pesce'],
    tags: ['pesce', 'omega3', 'grasso', 'economico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'sardines',
    name: 'Sardine',
    category: 'protein',
    nutrition: { kcal: 208, cho_g: 0, pro_g: 25, fat_g: 11, fiber_g: 0, sugar_g: 0, sodium_mg: 505 },
    allergens: ['pesce'],
    tags: ['pesce', 'omega3', 'calcio', 'economico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'anchovies',
    name: 'Acciughe',
    category: 'protein',
    nutrition: { kcal: 131, cho_g: 0, pro_g: 20, fat_g: 5, fiber_g: 0, sugar_g: 0, sodium_mg: 104 },
    allergens: ['pesce'],
    tags: ['pesce', 'omega3', 'piccolo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'octopus',
    name: 'Polpo',
    category: 'protein',
    nutrition: { kcal: 82, cho_g: 2, pro_g: 15, fat_g: 1, fiber_g: 0, sugar_g: 0, sodium_mg: 230 },
    allergens: ['molluschi'],
    tags: ['molluschi', 'magro', 'mediterraneo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'squid',
    name: 'Calamari',
    category: 'protein',
    nutrition: { kcal: 92, cho_g: 3, pro_g: 15.6, fat_g: 1.4, fiber_g: 0, sugar_g: 0, sodium_mg: 44 },
    allergens: ['molluschi'],
    tags: ['molluschi', 'magro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'mussels',
    name: 'Cozze',
    category: 'protein',
    nutrition: { kcal: 86, cho_g: 4, pro_g: 12, fat_g: 2, fiber_g: 0, sugar_g: 0, sodium_mg: 286 },
    allergens: ['molluschi'],
    tags: ['molluschi', 'ferro', 'zinco'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: false,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  
  // PROTEINE VEGETALI
  {
    id: 'tempeh',
    name: 'Tempeh',
    category: 'protein',
    nutrition: { kcal: 193, cho_g: 9, pro_g: 19, fat_g: 11, fiber_g: 0, sugar_g: 0, sodium_mg: 9 },
    allergens: ['soia'],
    tags: ['vegano', 'soia', 'fermentato', 'probiotico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'seitan',
    name: 'Seitan',
    category: 'protein',
    nutrition: { kcal: 370, cho_g: 14, pro_g: 75, fat_g: 2, fiber_g: 0.6, sugar_g: 0, sodium_mg: 20 },
    allergens: ['glutine'],
    tags: ['vegano', 'glutine', 'alto-proteico'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'edamame',
    name: 'Edamame',
    category: 'legume',
    nutrition: { kcal: 121, cho_g: 9, pro_g: 11, fat_g: 5, fiber_g: 5, sugar_g: 2, sodium_mg: 6 },
    allergens: ['soia'],
    tags: ['legumi', 'soia', 'snack', 'proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['snack', 'lunch', 'dinner']
  },
  
  // CEREALI E CARBOIDRATI AGGIUNTIVI
  {
    id: 'farro',
    name: 'Farro',
    category: 'grain',
    nutrition: { kcal: 335, cho_g: 68, pro_g: 15, fat_g: 2.5, fiber_g: 11, sugar_g: 0, sodium_mg: 8 },
    allergens: ['glutine'],
    tags: ['cereale', 'integrale', 'italiano', 'fibre'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'barley',
    name: 'Orzo',
    category: 'grain',
    nutrition: { kcal: 354, cho_g: 73, pro_g: 12, fat_g: 2.3, fiber_g: 17, sugar_g: 0.8, sodium_mg: 12 },
    allergens: ['glutine'],
    tags: ['cereale', 'integrale', 'fibre', 'beta-glucani'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'buckwheat',
    name: 'Grano saraceno',
    category: 'grain',
    nutrition: { kcal: 343, cho_g: 72, pro_g: 13, fat_g: 3.4, fiber_g: 10, sugar_g: 0, sodium_mg: 1 },
    allergens: [],
    tags: ['pseudocereale', 'senza-glutine', 'completo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'lunch', 'dinner']
  },
  {
    id: 'millet',
    name: 'Miglio',
    category: 'grain',
    nutrition: { kcal: 378, cho_g: 73, pro_g: 11, fat_g: 4.2, fiber_g: 8.5, sugar_g: 0, sodium_mg: 5 },
    allergens: [],
    tags: ['cereale', 'senza-glutine', 'alcalino'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'amaranth',
    name: 'Amaranto',
    category: 'grain',
    nutrition: { kcal: 371, cho_g: 65, pro_g: 14, fat_g: 7, fiber_g: 7, sugar_g: 1.7, sodium_mg: 4 },
    allergens: [],
    tags: ['pseudocereale', 'senza-glutine', 'completo', 'lisina'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'lunch', 'dinner']
  },
  {
    id: 'spelt_pasta',
    name: 'Pasta di farro',
    category: 'grain',
    nutrition: { kcal: 352, cho_g: 68, pro_g: 14, fat_g: 2.5, fiber_g: 8, sugar_g: 3, sodium_mg: 6 },
    allergens: ['glutine'],
    tags: ['pasta', 'integrale', 'farro'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner', 'post_workout']
  },
  {
    id: 'rice_basmati',
    name: 'Riso Basmati',
    category: 'grain',
    nutrition: { kcal: 350, cho_g: 77, pro_g: 9, fat_g: 0.5, fiber_g: 0.4, sugar_g: 0, sodium_mg: 1 },
    allergens: [],
    tags: ['riso', 'basso-gi', 'aromatico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner', 'post_workout']
  },
  {
    id: 'rice_black',
    name: 'Riso nero Venere',
    category: 'grain',
    nutrition: { kcal: 356, cho_g: 75, pro_g: 9, fat_g: 3, fiber_g: 2, sugar_g: 0, sodium_mg: 4 },
    allergens: [],
    tags: ['riso', 'antiossidanti', 'antociani'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'couscous',
    name: 'Couscous',
    category: 'grain',
    nutrition: { kcal: 376, cho_g: 77, pro_g: 13, fat_g: 0.6, fiber_g: 5, sugar_g: 0, sodium_mg: 10 },
    allergens: ['glutine'],
    tags: ['semola', 'veloce', 'mediterraneo'],
    is_gluten_free: false, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'polenta',
    name: 'Polenta (mais)',
    category: 'grain',
    nutrition: { kcal: 85, cho_g: 18, pro_g: 2, fat_g: 0.5, fiber_g: 1, sugar_g: 0, sodium_mg: 2 },
    allergens: [],
    tags: ['mais', 'italiano', 'senza-glutine'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'high',
    best_for: ['lunch', 'dinner']
  },
  
  // VERDURE AGGIUNTIVE
  {
    id: 'asparagus',
    name: 'Asparagi',
    category: 'vegetable',
    nutrition: { kcal: 20, cho_g: 3.9, pro_g: 2.2, fat_g: 0.1, fiber_g: 2.1, sugar_g: 1.9, sodium_mg: 2 },
    allergens: [],
    tags: ['verdura', 'primavera', 'diuretico', 'folato'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'artichoke',
    name: 'Carciofi',
    category: 'vegetable',
    nutrition: { kcal: 47, cho_g: 11, pro_g: 3.3, fat_g: 0.2, fiber_g: 5.4, sugar_g: 1, sodium_mg: 94 },
    allergens: [],
    tags: ['verdura', 'fegato', 'prebiotico', 'inulina'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'fennel',
    name: 'Finocchio',
    category: 'vegetable',
    nutrition: { kcal: 31, cho_g: 7, pro_g: 1.2, fat_g: 0.2, fiber_g: 3.1, sugar_g: 3.9, sodium_mg: 52 },
    allergens: [],
    tags: ['verdura', 'digestivo', 'croccante'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'eggplant',
    name: 'Melanzane',
    category: 'vegetable',
    nutrition: { kcal: 25, cho_g: 6, pro_g: 1, fat_g: 0.2, fiber_g: 3, sugar_g: 3.5, sodium_mg: 2 },
    allergens: [],
    tags: ['verdura', 'mediterraneo', 'solanacee'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'pumpkin',
    name: 'Zucca',
    category: 'vegetable',
    nutrition: { kcal: 26, cho_g: 6.5, pro_g: 1, fat_g: 0.1, fiber_g: 0.5, sugar_g: 2.8, sodium_mg: 1 },
    allergens: [],
    tags: ['verdura', 'beta-carotene', 'autunno'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'cauliflower',
    name: 'Cavolfiore',
    category: 'vegetable',
    nutrition: { kcal: 25, cho_g: 5, pro_g: 1.9, fat_g: 0.3, fiber_g: 2, sugar_g: 1.9, sodium_mg: 30 },
    allergens: [],
    tags: ['verdura', 'crucifere', 'sulforafano'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'brussels_sprouts',
    name: 'Cavolini di Bruxelles',
    category: 'vegetable',
    nutrition: { kcal: 43, cho_g: 9, pro_g: 3.4, fat_g: 0.3, fiber_g: 3.8, sugar_g: 2.2, sodium_mg: 25 },
    allergens: [],
    tags: ['verdura', 'crucifere', 'vitamina-k'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'kale',
    name: 'Cavolo riccio (Kale)',
    category: 'vegetable',
    nutrition: { kcal: 49, cho_g: 9, pro_g: 4.3, fat_g: 0.9, fiber_g: 3.6, sugar_g: 2.3, sodium_mg: 38 },
    allergens: [],
    tags: ['verdura', 'superfood', 'calcio', 'vitamina-k'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'breakfast']
  },
  {
    id: 'chard',
    name: 'Bietole',
    category: 'vegetable',
    nutrition: { kcal: 19, cho_g: 3.7, pro_g: 1.8, fat_g: 0.2, fiber_g: 1.6, sugar_g: 1.1, sodium_mg: 213 },
    allergens: [],
    tags: ['verdura', 'foglia', 'magnesio', 'nitrati'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'beetroot',
    name: 'Barbabietola',
    category: 'vegetable',
    nutrition: { kcal: 43, cho_g: 10, pro_g: 1.6, fat_g: 0.2, fiber_g: 2.8, sugar_g: 7, sodium_mg: 78 },
    allergens: [],
    tags: ['verdura', 'nitrati', 'performance', 'antiossidanti'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['pre_workout', 'lunch', 'dinner']
  },
  {
    id: 'radish',
    name: 'Ravanelli',
    category: 'vegetable',
    nutrition: { kcal: 16, cho_g: 3.4, pro_g: 0.7, fat_g: 0.1, fiber_g: 1.6, sugar_g: 1.9, sodium_mg: 39 },
    allergens: [],
    tags: ['verdura', 'croccante', 'digestivo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'leek',
    name: 'Porri',
    category: 'vegetable',
    nutrition: { kcal: 61, cho_g: 14, pro_g: 1.5, fat_g: 0.3, fiber_g: 1.8, sugar_g: 3.9, sodium_mg: 20 },
    allergens: [],
    tags: ['verdura', 'prebiotico', 'inulina'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  
  // LEGUMI AGGIUNTIVI
  {
    id: 'black_beans',
    name: 'Fagioli neri',
    category: 'legume',
    nutrition: { kcal: 339, cho_g: 63, pro_g: 21, fat_g: 0.9, fiber_g: 16, sugar_g: 0.3, sodium_mg: 5 },
    allergens: [],
    tags: ['legumi', 'fibre', 'antiossidanti'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'white_beans',
    name: 'Fagioli cannellini',
    category: 'legume',
    nutrition: { kcal: 333, cho_g: 60, pro_g: 23, fat_g: 0.8, fiber_g: 15, sugar_g: 2.1, sodium_mg: 16 },
    allergens: [],
    tags: ['legumi', 'italiano', 'cremoso'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'fava_beans',
    name: 'Fave',
    category: 'legume',
    nutrition: { kcal: 341, cho_g: 58, pro_g: 26, fat_g: 1.5, fiber_g: 25, sugar_g: 5.7, sodium_mg: 13 },
    allergens: ['fave'],
    tags: ['legumi', 'primavera', 'l-dopa'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'red_lentils',
    name: 'Lenticchie rosse',
    category: 'legume',
    nutrition: { kcal: 358, cho_g: 63, pro_g: 24, fat_g: 1, fiber_g: 11, sugar_g: 2, sodium_mg: 6 },
    allergens: [],
    tags: ['legumi', 'veloce', 'ferro'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner']
  },
  {
    id: 'green_peas',
    name: 'Piselli',
    category: 'legume',
    nutrition: { kcal: 81, cho_g: 14, pro_g: 5, fat_g: 0.4, fiber_g: 5, sugar_g: 6, sodium_mg: 5 },
    allergens: [],
    tags: ['legumi', 'dolce', 'versatile'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['lunch', 'dinner']
  },
  
  // FRUTTA AGGIUNTIVA
  {
    id: 'pomegranate',
    name: 'Melograno',
    category: 'fruit',
    nutrition: { kcal: 83, cho_g: 19, pro_g: 1.7, fat_g: 1.2, fiber_g: 4, sugar_g: 14, sodium_mg: 3 },
    allergens: [],
    tags: ['frutta', 'antiossidanti', 'polifenoli'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'grapefruit',
    name: 'Pompelmo',
    category: 'fruit',
    nutrition: { kcal: 42, cho_g: 11, pro_g: 0.8, fat_g: 0.1, fiber_g: 1.6, sugar_g: 7, sodium_mg: 0 },
    allergens: [],
    tags: ['frutta', 'agrume', 'vitamina-c'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'mango',
    name: 'Mango',
    category: 'fruit',
    nutrition: { kcal: 60, cho_g: 15, pro_g: 0.8, fat_g: 0.4, fiber_g: 1.6, sugar_g: 14, sodium_mg: 1 },
    allergens: [],
    tags: ['frutta', 'tropicale', 'vitamina-a'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  {
    id: 'papaya',
    name: 'Papaya',
    category: 'fruit',
    nutrition: { kcal: 43, cho_g: 11, pro_g: 0.5, fat_g: 0.3, fiber_g: 1.7, sugar_g: 8, sodium_mg: 8 },
    allergens: [],
    tags: ['frutta', 'tropicale', 'enzimi', 'digestivo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'pineapple',
    name: 'Ananas',
    category: 'fruit',
    nutrition: { kcal: 50, cho_g: 13, pro_g: 0.5, fat_g: 0.1, fiber_g: 1.4, sugar_g: 10, sodium_mg: 1 },
    allergens: [],
    tags: ['frutta', 'tropicale', 'bromelina', 'anti-infiammatorio'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'snack', 'post_workout']
  },
  {
    id: 'watermelon',
    name: 'Anguria',
    category: 'fruit',
    nutrition: { kcal: 30, cho_g: 8, pro_g: 0.6, fat_g: 0.2, fiber_g: 0.4, sugar_g: 6, sodium_mg: 1 },
    allergens: [],
    tags: ['frutta', 'idratazione', 'citrullina', 'estate'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'high',
    best_for: ['snack', 'post_workout']
  },
  {
    id: 'grapes',
    name: 'Uva',
    category: 'fruit',
    nutrition: { kcal: 69, cho_g: 18, pro_g: 0.7, fat_g: 0.2, fiber_g: 0.9, sugar_g: 16, sodium_mg: 2 },
    allergens: [],
    tags: ['frutta', 'resveratrolo', 'antiossidanti'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['snack', 'pre_workout']
  },
  {
    id: 'cherries',
    name: 'Ciliegie',
    category: 'fruit',
    nutrition: { kcal: 63, cho_g: 16, pro_g: 1.1, fat_g: 0.2, fiber_g: 2.1, sugar_g: 13, sodium_mg: 0 },
    allergens: [],
    tags: ['frutta', 'melatonina', 'recupero', 'anti-infiammatorio'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['snack', 'post_workout']
  },
  {
    id: 'figs',
    name: 'Fichi freschi',
    category: 'fruit',
    nutrition: { kcal: 74, cho_g: 19, pro_g: 0.8, fat_g: 0.3, fiber_g: 2.9, sugar_g: 16, sodium_mg: 1 },
    allergens: [],
    tags: ['frutta', 'calcio', 'fibre', 'mediterraneo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'medium',
    best_for: ['snack', 'breakfast']
  },
  
  // NOCI E SEMI AGGIUNTIVI
  {
    id: 'brazil_nuts',
    name: 'Noci del Brasile',
    category: 'nut',
    nutrition: { kcal: 656, cho_g: 12, pro_g: 14, fat_g: 66, fiber_g: 7.5, sugar_g: 2.3, sodium_mg: 3 },
    allergens: ['frutta a guscio'],
    tags: ['frutta secca', 'selenio', 'tiroide'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['snack']
  },
  {
    id: 'cashews',
    name: 'Anacardi',
    category: 'nut',
    nutrition: { kcal: 553, cho_g: 30, pro_g: 18, fat_g: 44, fiber_g: 3.3, sugar_g: 5.9, sodium_mg: 12 },
    allergens: ['frutta a guscio'],
    tags: ['frutta secca', 'magnesio', 'zinco'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['snack']
  },
  {
    id: 'pistachios',
    name: 'Pistacchi',
    category: 'nut',
    nutrition: { kcal: 560, cho_g: 28, pro_g: 20, fat_g: 45, fiber_g: 10, sugar_g: 7.7, sodium_mg: 1 },
    allergens: ['frutta a guscio'],
    tags: ['frutta secca', 'melatonina', 'proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['snack']
  },
  {
    id: 'macadamia',
    name: 'Noci di Macadamia',
    category: 'nut',
    nutrition: { kcal: 718, cho_g: 14, pro_g: 8, fat_g: 76, fiber_g: 8.6, sugar_g: 4.6, sodium_mg: 5 },
    allergens: ['frutta a guscio'],
    tags: ['frutta secca', 'grassi monoinsaturi', 'keto'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['snack']
  },
  {
    id: 'hazelnuts',
    name: 'Nocciole',
    category: 'nut',
    nutrition: { kcal: 628, cho_g: 17, pro_g: 15, fat_g: 61, fiber_g: 9.7, sugar_g: 4.3, sodium_mg: 0 },
    allergens: ['frutta a guscio'],
    tags: ['frutta secca', 'vitamina-e', 'italiano'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['snack', 'breakfast']
  },
  {
    id: 'sunflower_seeds',
    name: 'Semi di girasole',
    category: 'nut',
    nutrition: { kcal: 584, cho_g: 20, pro_g: 21, fat_g: 51, fiber_g: 8.6, sugar_g: 2.6, sodium_mg: 9 },
    allergens: [],
    tags: ['semi', 'vitamina-e', 'magnesio'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['snack', 'breakfast']
  },
  {
    id: 'pumpkin_seeds',
    name: 'Semi di zucca',
    category: 'nut',
    nutrition: { kcal: 559, cho_g: 11, pro_g: 30, fat_g: 49, fiber_g: 6, sugar_g: 1.4, sodium_mg: 7 },
    allergens: [],
    tags: ['semi', 'zinco', 'triptofano', 'prostata'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['snack', 'breakfast']
  },
  {
    id: 'hemp_seeds',
    name: 'Semi di canapa',
    category: 'nut',
    nutrition: { kcal: 553, cho_g: 9, pro_g: 32, fat_g: 49, fiber_g: 4, sugar_g: 1.5, sodium_mg: 5 },
    allergens: [],
    tags: ['semi', 'omega3', 'proteina completa', 'GLA'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  
  // SUPERFOOD E SPECIALI
  {
    id: 'spirulina',
    name: 'Spirulina',
    category: 'vegetable',
    nutrition: { kcal: 290, cho_g: 24, pro_g: 57, fat_g: 8, fiber_g: 3.6, sugar_g: 3, sodium_mg: 1048 },
    allergens: [],
    tags: ['superfood', 'alga', 'proteina', 'ferro', 'b12'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'chlorella',
    name: 'Clorella',
    category: 'vegetable',
    nutrition: { kcal: 411, cho_g: 23, pro_g: 58, fat_g: 9, fiber_g: 0, sugar_g: 0, sodium_mg: 68 },
    allergens: [],
    tags: ['superfood', 'alga', 'detox', 'clorofilla'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'maca',
    name: 'Maca in polvere',
    category: 'condiment',
    nutrition: { kcal: 325, cho_g: 71, pro_g: 14, fat_g: 3.6, fiber_g: 7.1, sugar_g: 31, sodium_mg: 5 },
    allergens: [],
    tags: ['superfood', 'adattogeno', 'energia', 'ormoni'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack', 'pre_workout']
  },
  {
    id: 'cacao_powder',
    name: 'Cacao amaro in polvere',
    category: 'condiment',
    nutrition: { kcal: 228, cho_g: 58, pro_g: 20, fat_g: 14, fiber_g: 33, sugar_g: 1.8, sodium_mg: 21 },
    allergens: [],
    tags: ['superfood', 'antiossidanti', 'magnesio', 'teobromina'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'goji_berries',
    name: 'Bacche di Goji',
    category: 'fruit',
    nutrition: { kcal: 349, cho_g: 77, pro_g: 14, fat_g: 0.4, fiber_g: 13, sugar_g: 46, sodium_mg: 298 },
    allergens: [],
    tags: ['superfood', 'antiossidanti', 'vitamina-c', 'zeaxantina'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  {
    id: 'acai_powder',
    name: 'Acai in polvere',
    category: 'fruit',
    nutrition: { kcal: 534, cho_g: 52, pro_g: 8, fat_g: 33, fiber_g: 33, sugar_g: 0, sodium_mg: 30 },
    allergens: [],
    tags: ['superfood', 'antiossidanti', 'antociani'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['breakfast', 'snack']
  },
  
  // CONDIMENTI E ALTRO
  {
    id: 'honey',
    name: 'Miele',
    category: 'condiment',
    nutrition: { kcal: 304, cho_g: 82, pro_g: 0.3, fat_g: 0, fiber_g: 0.2, sugar_g: 82, sodium_mg: 4 },
    allergens: [],
    tags: ['dolcificante', 'naturale', 'energia rapida'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: false,
    glycemic_index: 'high',
    best_for: ['breakfast', 'pre_workout', 'post_workout']
  },
  {
    id: 'maple_syrup',
    name: 'Sciroppo d\'acero',
    category: 'condiment',
    nutrition: { kcal: 260, cho_g: 67, pro_g: 0, fat_g: 0.1, fiber_g: 0, sugar_g: 60, sodium_mg: 12 },
    allergens: [],
    tags: ['dolcificante', 'naturale', 'manganese'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: false, is_low_fodmap: true,
    glycemic_index: 'medium',
    best_for: ['breakfast', 'post_workout']
  },
  {
    id: 'tahini',
    name: 'Tahini (crema di sesamo)',
    category: 'condiment',
    nutrition: { kcal: 595, cho_g: 21, pro_g: 17, fat_g: 54, fiber_g: 9.3, sugar_g: 0.5, sodium_mg: 115 },
    allergens: ['sesamo'],
    tags: ['crema', 'calcio', 'mediterraneo'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'hummus',
    name: 'Hummus',
    category: 'condiment',
    nutrition: { kcal: 166, cho_g: 14, pro_g: 8, fat_g: 10, fiber_g: 6, sugar_g: 0.3, sodium_mg: 379 },
    allergens: ['sesamo'],
    tags: ['crema', 'ceci', 'mediterraneo', 'proteico'],
    is_gluten_free: true, is_lactose_free: true, is_vegan: true, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: false,
    glycemic_index: 'low',
    best_for: ['lunch', 'dinner', 'snack']
  },
  {
    id: 'dark_chocolate',
    name: 'Cioccolato fondente 85%',
    category: 'condiment',
    nutrition: { kcal: 600, cho_g: 20, pro_g: 13, fat_g: 50, fiber_g: 13, sugar_g: 14, sodium_mg: 20 },
    allergens: ['latte'],
    tags: ['dolce', 'antiossidanti', 'magnesio'],
    is_gluten_free: true, is_lactose_free: false, is_vegan: false, is_vegetarian: true,
    is_keto_friendly: true, is_low_fodmap: true,
    glycemic_index: 'low',
    best_for: ['snack']
  },
]

// ==================== HELPER FUNCTIONS ====================

/**
 * Filtra cibi in base a intolleranze, allergie e preferenze
 */
export function filterFoodsByConstraints(
  foods: FoodItem[],
  constraints: {
    intolerances?: string[]
    allergies?: string[]
    dietary_preferences?: string[]
    foods_to_avoid?: string[]
  }
): FoodItem[] {
  return foods.filter(food => {
    // Check allergens against user allergies
    if (constraints.allergies?.length) {
      for (const allergy of constraints.allergies) {
        const allergyLower = allergy.toLowerCase()
        if (food.allergens.some(a => a.toLowerCase().includes(allergyLower))) {
          return false
        }
      }
    }
    
    // Check intolerances
    if (constraints.intolerances?.length) {
      for (const intol of constraints.intolerances) {
        const intolLower = intol.toLowerCase()
        // Lattosio
        if (intolLower.includes('lattosio') && !food.is_lactose_free) {
          return false
        }
        // Glutine
        if (intolLower.includes('glutine') && !food.is_gluten_free) {
          return false
        }
        // Check allergens for this intolerance
        if (food.allergens.some(a => a.toLowerCase().includes(intolLower))) {
          return false
        }
      }
    }
    
    // Check dietary preferences
    if (constraints.dietary_preferences?.length) {
      for (const pref of constraints.dietary_preferences) {
        const prefLower = pref.toLowerCase()
        if (prefLower.includes('vegan') && !food.is_vegan) {
          return false
        }
        if (prefLower.includes('vegetarian') && !food.is_vegetarian) {
          return false
        }
        if (prefLower.includes('keto') && !food.is_keto_friendly) {
          return false
        }
        if (prefLower.includes('fodmap') && !food.is_low_fodmap) {
          return false
        }
      }
    }
    
    // Check specific foods to avoid
    if (constraints.foods_to_avoid?.length) {
      for (const avoid of constraints.foods_to_avoid) {
        if (food.name.toLowerCase().includes(avoid.toLowerCase())) {
          return false
        }
      }
    }
    
    return true
  })
}

/**
 * Ottiene cibi per categoria filtrati per vincoli
 */
export function getFoodsByCategory(
  category: FoodItem['category'],
  constraints?: Parameters<typeof filterFoodsByConstraints>[1]
): FoodItem[] {
  let foods = FOODS_DATABASE.filter(f => f.category === category)
  if (constraints) {
    foods = filterFoodsByConstraints(foods, constraints)
  }
  return foods
}

/**
 * Ottiene cibi per momento del giorno filtrati per vincoli
 */
export function getFoodsForMealTime(
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout',
  constraints?: Parameters<typeof filterFoodsByConstraints>[1]
): FoodItem[] {
  let foods = FOODS_DATABASE.filter(f => f.best_for.includes(mealTime))
  if (constraints) {
    foods = filterFoodsByConstraints(foods, constraints)
  }
  return foods
}

/**
 * Cerca alternative per un cibo non compatibile
 */
export function findAlternative(
  foodName: string,
  constraints: Parameters<typeof filterFoodsByConstraints>[1]
): FoodItem | null {
  const originalFood = FOODS_DATABASE.find(f => 
    f.name.toLowerCase().includes(foodName.toLowerCase()) ||
    foodName.toLowerCase().includes(f.name.toLowerCase())
  )
  
  if (!originalFood) return null
  
  // Find compatible foods in the same category
  const alternatives = filterFoodsByConstraints(
    FOODS_DATABASE.filter(f => f.category === originalFood.category && f.id !== originalFood.id),
    constraints
  )
  
  // Sort by similar nutrition profile
  alternatives.sort((a, b) => {
    const aDiff = Math.abs(a.nutrition.pro_g - originalFood.nutrition.pro_g) +
                  Math.abs(a.nutrition.cho_g - originalFood.nutrition.cho_g)
    const bDiff = Math.abs(b.nutrition.pro_g - originalFood.nutrition.pro_g) +
                  Math.abs(b.nutrition.cho_g - originalFood.nutrition.cho_g)
    return aDiff - bDiff
  })
  
  return alternatives[0] || null
}

/**
 * Calcola i grammi necessari per raggiungere target macro
 */
export function calculatePortionForMacro(
  food: FoodItem,
  targetMacro: 'cho' | 'pro' | 'fat',
  targetGrams: number
): number {
  const per100g = targetMacro === 'cho' ? food.nutrition.cho_g :
                  targetMacro === 'pro' ? food.nutrition.pro_g : food.nutrition.fat_g
  if (per100g === 0) return 0
  return Math.round((targetGrams / per100g) * 100)
}
