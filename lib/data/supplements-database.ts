/**
 * EMPATHY Supplements Database
 * Database completo di integratori sportivi con valori nutrizionali reali
 * Organizzato per marca e tipo di prodotto
 */

export interface SupplementProduct {
  id: string
  brand: string
  name: string
  type: 'pre_workout' | 'intra_workout' | 'post_workout'
  category: string // Gel, Barretta, Polvere, Capsula, Drink
  format: string // es. "gel 25ml", "barretta 55g", "polvere 1kg"
  serving_size_g: number
  servings_per_package: number
  
  // Valori nutrizionali per serving
  nutrition: {
    kcal: number
    cho_g: number // carboidrati totali
    sugars_g: number // di cui zuccheri
    pro_g: number // proteine
    fat_g: number // grassi
    fiber_g: number // fibre
    sodium_mg: number
    potassium_mg: number
    magnesium_mg: number
    caffeine_mg: number
  }
  
  // Caratteristiche speciali
  features: {
    is_isotonic: boolean
    is_hypotonic: boolean
    has_electrolytes: boolean
    has_bcaa: boolean
    has_caffeine: boolean
    is_vegan: boolean
    is_gluten_free: boolean
    is_lactose_free: boolean
    maltodextrin_ratio?: number // rapporto maltodestrine (es. 0.8 per 2:1)
    fructose_ratio?: number // rapporto fruttosio
  }
  
  // Timing consigliato
  timing: {
    minutes_before?: number // per pre-workout
    during_activity?: boolean
    minutes_after?: number // per post-workout
    absorption_speed: 'fast' | 'medium' | 'slow'
  }
  
  // Tags per matching
  tags: string[]
}

export interface BrandInfo {
  id: string
  name: string
  country: string
  website: string
  specialization: string[]
}

// Database marchi
export const BRANDS_DATABASE: Record<string, BrandInfo> = {
  enervit: {
    id: 'enervit',
    name: 'Enervit',
    country: 'Italia',
    website: 'https://www.enervit.com',
    specialization: ['endurance', 'cycling', 'running', 'triathlon']
  },
  sis: {
    id: 'sis',
    name: 'Science in Sport (SiS)',
    country: 'UK',
    website: 'https://www.scienceinsport.com',
    specialization: ['endurance', 'cycling', 'running']
  },
  pluswatt: {
    id: 'pluswatt',
    name: '+Watt',
    country: 'Italia',
    website: 'https://www.pluswatt.it',
    specialization: ['bodybuilding', 'endurance', 'fitness']
  },
  ethicsport: {
    id: 'ethicsport',
    name: 'Ethic Sport',
    country: 'Italia',
    website: 'https://www.ethicsport.com',
    specialization: ['endurance', 'cycling', 'running']
  },
  forendurance: {
    id: 'forendurance',
    name: '4Endurance',
    country: 'Slovenia',
    website: 'https://www.4endurance.com',
    specialization: ['endurance', 'ultra', 'triathlon']
  },
  esn: {
    id: 'esn',
    name: 'ESN',
    country: 'Germania',
    website: 'https://www.esn.com',
    specialization: ['bodybuilding', 'fitness', 'protein']
  },
  muscletech: {
    id: 'muscletech',
    name: 'MuscleTech',
    country: 'USA',
    website: 'https://www.muscletech.com',
    specialization: ['bodybuilding', 'strength', 'performance']
  },
  isostar: {
    id: 'isostar',
    name: 'Isostar',
    country: 'Svizzera',
    website: 'https://www.isostar.com',
    specialization: ['endurance', 'hydration', 'energy']
  },
  powerbar: {
    id: 'powerbar',
    name: 'PowerBar',
    country: 'USA',
    website: 'https://www.powerbar.com',
    specialization: ['endurance', 'cycling', 'running']
  },
  maurten: {
    id: 'maurten',
    name: 'Maurten',
    country: 'Svezia',
    website: 'https://www.maurten.com',
    specialization: ['endurance', 'elite', 'hydrogel']
  },
  ers226: {
    id: 'ers226',
    name: '226ERS',
    country: 'Spagna',
    website: 'https://www.226ers.com',
    specialization: ['endurance', 'triathlon', 'ultra']
  },
  precision: {
    id: 'precision',
    name: 'Precision Fuel & Hydration',
    country: 'UK',
    website: 'https://www.precisionhydration.com',
    specialization: ['hydration', 'electrolytes', 'sweat testing', 'personalized']
  },
  high5: {
    id: 'high5',
    name: 'HIGH5',
    country: 'UK',
    website: 'https://www.highfive.co.uk',
    specialization: ['endurance', 'running', 'cycling', 'affordable']
  },
  nduranz: {
    id: 'nduranz',
    name: 'Nduranz',
    country: 'Slovenia',
    website: 'https://www.nduranz.com',
    specialization: ['endurance', 'natural', 'science-based']
  },
  torq: {
    id: 'torq',
    name: 'TORQ',
    country: 'UK',
    website: 'https://www.torqfitness.co.uk',
    specialization: ['cycling', 'triathlon', 'organic', 'natural']
  },
  hammer: {
    id: 'hammer',
    name: 'Hammer Nutrition',
    country: 'USA',
    website: 'https://www.hammernutrition.com',
    specialization: ['ultra', 'endurance', 'no sugar', 'veteran']
  },
  tailwind: {
    id: 'tailwind',
    name: 'Tailwind Nutrition',
    country: 'USA',
    website: 'https://www.tailwindnutrition.com',
    specialization: ['ultra', 'running', 'all-in-one', 'simplicity']
  },
  skratch: {
    id: 'skratch',
    name: 'Skratch Labs',
    country: 'USA',
    website: 'https://www.skratchlabs.com',
    specialization: ['hydration', 'natural', 'pro-cycling', 'real food']
  },
  namedsport: {
    id: 'namedsport',
    name: 'NamedSport',
    country: 'Italia',
    website: 'https://www.namedsport.com',
    specialization: ['cycling', 'running', 'professional']
  },
  myprotein: {
    id: 'myprotein',
    name: 'MyProtein',
    country: 'UK',
    website: 'https://www.myprotein.it',
    specialization: ['protein', 'fitness', 'value']
  },
  prozis: {
    id: 'prozis',
    name: 'Prozis',
    country: 'Portogallo',
    website: 'https://www.prozis.com',
    specialization: ['fitness', 'wellness', 'value']
  },
  bulk: {
    id: 'bulk',
    name: 'Bulk',
    country: 'UK',
    website: 'https://www.bulk.com',
    specialization: ['protein', 'fitness', 'value']
  },
  mnstry: {
    id: 'mnstry',
    name: 'MNSTRY',
    country: 'Italia',
    website: 'https://www.mnstry.com',
    specialization: ['endurance', 'cycling', 'natural']
  }
}

// Database prodotti completo
export const SUPPLEMENTS_DATABASE: SupplementProduct[] = [
  // ============================================
  // ENERVIT
  // ============================================
  {
    id: 'enervit-isocarb-c2-1',
    brand: 'enervit',
    name: 'Isocarb C2:1 Pro',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'busta 650g',
    serving_size_g: 45,
    servings_per_package: 14,
    nutrition: {
      kcal: 168,
      cho_g: 42,
      sugars_g: 14,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 300,
      potassium_mg: 150,
      magnesium_mg: 56,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.67,
      fructose_ratio: 0.33
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['carboidrati', 'maltodestrine', 'fruttosio', 'elettroliti', 'isotonic']
  },
  {
    id: 'enervit-gel-competition',
    brand: 'enervit',
    name: 'Enervitene Sport Gel Competition',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 25ml',
    serving_size_g: 25,
    servings_per_package: 1,
    nutrition: {
      kcal: 53,
      cho_g: 13.2,
      sugars_g: 7.4,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 36,
      potassium_mg: 30,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: true,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'rapido']
  },
  {
    id: 'enervit-gel-competition-caffeine',
    brand: 'enervit',
    name: 'Enervitene Sport Gel Competition + Caffeina',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 25ml',
    serving_size_g: 25,
    servings_per_package: 1,
    nutrition: {
      kcal: 53,
      cho_g: 13.2,
      sugars_g: 7.4,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 36,
      potassium_mg: 30,
      magnesium_mg: 0,
      caffeine_mg: 25
    },
    features: {
      is_isotonic: false,
      is_hypotonic: true,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: true,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'caffeina', 'rapido']
  },
  {
    id: 'enervit-recovery-drink',
    brand: 'enervit',
    name: 'Enervit R2 Sport Recovery Drink',
    type: 'post_workout',
    category: 'Polvere',
    format: 'busta 50g',
    serving_size_g: 50,
    servings_per_package: 1,
    nutrition: {
      kcal: 183,
      cho_g: 34,
      sugars_g: 18,
      pro_g: 9,
      fat_g: 1,
      fiber_g: 0,
      sodium_mg: 290,
      potassium_mg: 400,
      magnesium_mg: 112,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: false
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['recovery', 'proteine', 'carboidrati', 'recupero']
  },
  {
    id: 'enervit-pre-sport',
    brand: 'enervit',
    name: 'Enervit Pre Sport',
    type: 'pre_workout',
    category: 'Barretta',
    format: 'barretta 45g',
    serving_size_g: 45,
    servings_per_package: 1,
    nutrition: {
      kcal: 164,
      cho_g: 29,
      sugars_g: 16,
      pro_g: 3,
      fat_g: 4,
      fiber_g: 1,
      sodium_mg: 50,
      potassium_mg: 80,
      magnesium_mg: 20,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: false,
      is_lactose_free: false
    },
    timing: {
      minutes_before: 60,
      absorption_speed: 'medium'
    },
    tags: ['pre-workout', 'energia', 'barretta']
  },

  // ============================================
  // SIS (Science in Sport)
  // ============================================
  {
    id: 'sis-go-isotonic-gel',
    brand: 'sis',
    name: 'GO Isotonic Energy Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 60ml',
    serving_size_g: 60,
    servings_per_package: 1,
    nutrition: {
      kcal: 87,
      cho_g: 22,
      sugars_g: 1,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 10,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'isotonic', 'energia', 'maltodestrine']
  },
  {
    id: 'sis-go-isotonic-gel-caffeine',
    brand: 'sis',
    name: 'GO Isotonic Energy Gel + Caffeine',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 60ml',
    serving_size_g: 60,
    servings_per_package: 1,
    nutrition: {
      kcal: 87,
      cho_g: 22,
      sugars_g: 1,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 10,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 75
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: true,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'isotonic', 'energia', 'caffeina']
  },
  {
    id: 'sis-beta-fuel-80',
    brand: 'sis',
    name: 'Beta Fuel 80g',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 80g',
    serving_size_g: 80,
    servings_per_package: 1,
    nutrition: {
      kcal: 308,
      cho_g: 80,
      sugars_g: 30,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 200,
      potassium_mg: 100,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.5,
      fructose_ratio: 0.5
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'high-carb', 'endurance', 'ultra', '1:1']
  },
  {
    id: 'sis-go-electrolyte',
    brand: 'sis',
    name: 'GO Electrolyte Powder',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 500g',
    serving_size_g: 36,
    servings_per_package: 14,
    nutrition: {
      kcal: 131,
      cho_g: 32,
      sugars_g: 6,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 300,
      potassium_mg: 60,
      magnesium_mg: 6,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['elettroliti', 'carboidrati', 'idratazione', 'isotonic']
  },
  {
    id: 'sis-rego-rapid-recovery',
    brand: 'sis',
    name: 'REGO Rapid Recovery',
    type: 'post_workout',
    category: 'Polvere',
    format: 'busta 50g',
    serving_size_g: 50,
    servings_per_package: 1,
    nutrition: {
      kcal: 182,
      cho_g: 23,
      sugars_g: 6,
      pro_g: 20,
      fat_g: 1.3,
      fiber_g: 0.5,
      sodium_mg: 300,
      potassium_mg: 300,
      magnesium_mg: 50,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: false
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['recovery', 'proteine', 'carboidrati', 'whey']
  },

  // ============================================
  // MAURTEN
  // ============================================
  {
    id: 'maurten-gel-100',
    brand: 'maurten',
    name: 'Gel 100',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 40g',
    serving_size_g: 40,
    servings_per_package: 1,
    nutrition: {
      kcal: 100,
      cho_g: 25,
      sugars_g: 12,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 35,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.5,
      fructose_ratio: 0.5
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'hydrogel', 'elite', '1:0.8']
  },
  {
    id: 'maurten-gel-100-caf100',
    brand: 'maurten',
    name: 'Gel 100 CAF 100',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 40g',
    serving_size_g: 40,
    servings_per_package: 1,
    nutrition: {
      kcal: 100,
      cho_g: 25,
      sugars_g: 12,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 35,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 100
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: true,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.5,
      fructose_ratio: 0.5
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'hydrogel', 'caffeina', 'elite']
  },
  {
    id: 'maurten-drink-mix-320',
    brand: 'maurten',
    name: 'Drink Mix 320',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'busta 80g',
    serving_size_g: 80,
    servings_per_package: 1,
    nutrition: {
      kcal: 320,
      cho_g: 79,
      sugars_g: 32,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 220,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.5,
      fructose_ratio: 0.5
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['drink', 'hydrogel', 'high-carb', 'elite']
  },

  // ============================================
  // NAMEDSPORT
  // ============================================
  {
    id: 'named-total-energy-fruit-jelly',
    brand: 'namedsport',
    name: 'Total Energy Fruit Jelly',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 42g',
    serving_size_g: 42,
    servings_per_package: 1,
    nutrition: {
      kcal: 87,
      cho_g: 21,
      sugars_g: 14,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 50,
      potassium_mg: 40,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'frutta']
  },
  {
    id: 'named-100-whey-protein-shake',
    brand: 'namedsport',
    name: '100% Whey Protein Shake',
    type: 'post_workout',
    category: 'Polvere',
    format: 'barattolo 900g',
    serving_size_g: 30,
    servings_per_package: 30,
    nutrition: {
      kcal: 118,
      cho_g: 2.4,
      sugars_g: 1.8,
      pro_g: 24,
      fat_g: 1.5,
      fiber_g: 0,
      sodium_mg: 100,
      potassium_mg: 150,
      magnesium_mg: 20,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: false
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['proteine', 'whey', 'recovery', 'muscoli']
  },
  {
    id: 'named-creatine-100',
    brand: 'namedsport',
    name: 'Creatine 100%',
    type: 'pre_workout',
    category: 'Polvere',
    format: 'barattolo 250g',
    serving_size_g: 3,
    servings_per_package: 83,
    nutrition: {
      kcal: 0,
      cho_g: 0,
      sugars_g: 0,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      minutes_before: 30,
      absorption_speed: 'slow'
    },
    tags: ['creatina', 'forza', 'potenza', 'atp']
  },

  // ============================================
  // 226ERS
  // ============================================
  {
    id: '226ers-isotonic-drink',
    brand: 'ers226',
    name: 'Isotonic Drink',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 500g',
    serving_size_g: 35,
    servings_per_package: 14,
    nutrition: {
      kcal: 126,
      cho_g: 31,
      sugars_g: 7,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 320,
      potassium_mg: 120,
      magnesium_mg: 30,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['elettroliti', 'carboidrati', 'isotonic', 'idratazione']
  },
  {
    id: '226ers-high-energy-gel',
    brand: 'ers226',
    name: 'High Energy Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 76g',
    serving_size_g: 76,
    servings_per_package: 1,
    nutrition: {
      kcal: 200,
      cho_g: 50,
      sugars_g: 25,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 80,
      potassium_mg: 40,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.6,
      fructose_ratio: 0.4
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'high-carb', 'energia', 'endurance']
  },
  {
    id: '226ers-recovery-drink',
    brand: 'ers226',
    name: 'Recovery Drink',
    type: 'post_workout',
    category: 'Polvere',
    format: 'barattolo 500g',
    serving_size_g: 50,
    servings_per_package: 10,
    nutrition: {
      kcal: 185,
      cho_g: 25,
      sugars_g: 8,
      pro_g: 18,
      fat_g: 1,
      fiber_g: 0,
      sodium_mg: 250,
      potassium_mg: 300,
      magnesium_mg: 60,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: false
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['recovery', 'proteine', 'carboidrati', 'recupero']
  },

  // ============================================
  // ISOSTAR
  // ============================================
  {
    id: 'isostar-hydrate-perform',
    brand: 'isostar',
    name: 'Hydrate & Perform',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 400g',
    serving_size_g: 30,
    servings_per_package: 13,
    nutrition: {
      kcal: 108,
      cho_g: 26,
      sugars_g: 11,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 270,
      potassium_mg: 80,
      magnesium_mg: 10,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['elettroliti', 'isotonic', 'idratazione', 'carboidrati']
  },
  {
    id: 'isostar-energy-sport-bar',
    brand: 'isostar',
    name: 'Energy Sport Bar',
    type: 'intra_workout',
    category: 'Barretta',
    format: 'barretta 40g',
    serving_size_g: 40,
    servings_per_package: 1,
    nutrition: {
      kcal: 160,
      cho_g: 27,
      sugars_g: 15,
      pro_g: 3,
      fat_g: 4,
      fiber_g: 1,
      sodium_mg: 70,
      potassium_mg: 60,
      magnesium_mg: 15,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: false,
      is_lactose_free: false
    },
    timing: {
      during_activity: true,
      minutes_before: 30,
      absorption_speed: 'medium'
    },
    tags: ['barretta', 'energia', 'carboidrati']
  },

  // ============================================
  // POWERBAR
  // ============================================
  {
    id: 'powerbar-powergel-original',
    brand: 'powerbar',
    name: 'PowerGel Original',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 41g',
    serving_size_g: 41,
    servings_per_package: 1,
    nutrition: {
      kcal: 108,
      cho_g: 27,
      sugars_g: 10,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 200,
      potassium_mg: 20,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.7,
      fructose_ratio: 0.3
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'c2max']
  },
  {
    id: 'powerbar-isoactive',
    brand: 'powerbar',
    name: 'IsoActive Isotonic Sports Drink',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 600g',
    serving_size_g: 33,
    servings_per_package: 18,
    nutrition: {
      kcal: 119,
      cho_g: 29,
      sugars_g: 17,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 290,
      potassium_mg: 80,
      magnesium_mg: 15,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['elettroliti', 'isotonic', 'carboidrati', 'idratazione']
  },

  // ============================================
  // MYPROTEIN
  // ============================================
  {
    id: 'myprotein-impact-whey',
    brand: 'myprotein',
    name: 'Impact Whey Protein',
    type: 'post_workout',
    category: 'Polvere',
    format: 'busta 1kg',
    serving_size_g: 25,
    servings_per_package: 40,
    nutrition: {
      kcal: 103,
      cho_g: 1,
      sugars_g: 1,
      pro_g: 21,
      fat_g: 1.9,
      fiber_g: 0,
      sodium_mg: 50,
      potassium_mg: 100,
      magnesium_mg: 10,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: false
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'fast'
    },
    tags: ['proteine', 'whey', 'recovery', 'value']
  },
  {
    id: 'myprotein-creatine-mono',
    brand: 'myprotein',
    name: 'Creatine Monohydrate',
    type: 'pre_workout',
    category: 'Polvere',
    format: 'busta 250g',
    serving_size_g: 3,
    servings_per_package: 83,
    nutrition: {
      kcal: 0,
      cho_g: 0,
      sugars_g: 0,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      minutes_before: 30,
      absorption_speed: 'slow'
    },
    tags: ['creatina', 'forza', 'potenza']
  },
  {
    id: 'myprotein-bcaa',
    brand: 'myprotein',
    name: 'Essential BCAA 2:1:1',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'busta 250g',
    serving_size_g: 5,
    servings_per_package: 50,
    nutrition: {
      kcal: 18,
      cho_g: 0,
      sugars_g: 0,
      pro_g: 4.5,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['bcaa', 'aminoacidi', 'recupero', 'muscoli']
  },

  // ============================================
  // +WATT
  // ============================================
  {
    id: 'pluswatt-maltodex',
    brand: 'pluswatt',
    name: 'Maltodex 100%',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'busta 1kg',
    serving_size_g: 30,
    servings_per_package: 33,
    nutrition: {
      kcal: 114,
      cho_g: 28.5,
      sugars_g: 3,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 10,
      potassium_mg: 5,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 1.0,
      fructose_ratio: 0
    },
    timing: {
      during_activity: true,
      minutes_before: 60,
      absorption_speed: 'fast'
    },
    tags: ['maltodestrine', 'carboidrati', 'energia', 'puro']
  },
  {
    id: 'pluswatt-bcaa-811',
    brand: 'pluswatt',
    name: 'BCAA 8:1:1',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 300g',
    serving_size_g: 5,
    servings_per_package: 60,
    nutrition: {
      kcal: 17,
      cho_g: 0,
      sugars_g: 0,
      pro_g: 4.25,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['bcaa', 'aminoacidi', 'leucina', 'muscoli']
  },

  // ============================================
  // ETHIC SPORT
  // ============================================
  {
    id: 'ethicsport-energia-rapida',
    brand: 'ethicsport',
    name: 'Energia Rapida Professional',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 35ml',
    serving_size_g: 35,
    servings_per_package: 1,
    nutrition: {
      kcal: 72,
      cho_g: 18,
      sugars_g: 9,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 50,
      potassium_mg: 40,
      magnesium_mg: 10,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: true,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'rapido']
  },
  {
    id: 'ethicsport-pre-gara',
    brand: 'ethicsport',
    name: 'Pre Gara',
    type: 'pre_workout',
    category: 'Flacone',
    format: 'flacone 50ml',
    serving_size_g: 50,
    servings_per_package: 1,
    nutrition: {
      kcal: 52,
      cho_g: 13,
      sugars_g: 10,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 30,
      potassium_mg: 100,
      magnesium_mg: 50,
      caffeine_mg: 50
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: true,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      minutes_before: 30,
      absorption_speed: 'fast'
    },
    tags: ['pre-gara', 'caffeina', 'energia', 'focus']
  },

  // ============================================
  // 4ENDURANCE
  // ============================================
  {
    id: '4endurance-energy-gel',
    brand: 'forendurance',
    name: 'Energy Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 40g',
    serving_size_g: 40,
    servings_per_package: 1,
    nutrition: {
      kcal: 103,
      cho_g: 25.5,
      sugars_g: 13,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 40,
      potassium_mg: 30,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.6,
      fructose_ratio: 0.4
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'naturale']
  },
  {
    id: '4endurance-carbo-nrg',
    brand: 'forendurance',
    name: 'Carbo Nrg',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 500g',
    serving_size_g: 40,
    servings_per_package: 12,
    nutrition: {
      kcal: 152,
      cho_g: 38,
      sugars_g: 19,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 200,
      potassium_mg: 100,
      magnesium_mg: 25,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.67,
      fructose_ratio: 0.33
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['carboidrati', 'elettroliti', 'endurance', 'isotonic']
  },

  // =====================================================
  // NUOVI PRODOTTI - PRECISION FUEL & HYDRATION
  // =====================================================
  {
    id: 'pf-pfh30',
    brand: 'precision',
    name: 'PF 30 Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 51g',
    serving_size_g: 51,
    servings_per_package: 1,
    nutrition: {
      kcal: 120,
      cho_g: 30,
      sugars_g: 15,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.5,
      fructose_ratio: 0.5
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', '1:1 ratio', 'mild']
  },
  {
    id: 'pf-pfh90',
    brand: 'precision',
    name: 'PF 90 Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 106g',
    serving_size_g: 106,
    servings_per_package: 1,
    nutrition: {
      kcal: 360,
      cho_g: 90,
      sugars_g: 45,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 0,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: false,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.5,
      fructose_ratio: 0.5
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'alto-cho', 'race']
  },
  {
    id: 'pf-sweat-1000',
    brand: 'precision',
    name: 'PH 1000 Electrolyte Drink',
    type: 'intra_workout',
    category: 'Compresse',
    format: 'tubo 12 compresse',
    serving_size_g: 4.5,
    servings_per_package: 12,
    nutrition: {
      kcal: 8,
      cho_g: 1.5,
      sugars_g: 0,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 1000,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: true,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['elettroliti', 'sodio', 'idratazione', 'sudorazione intensa']
  },
  {
    id: 'pf-sweat-1500',
    brand: 'precision',
    name: 'PH 1500 Electrolyte Drink',
    type: 'intra_workout',
    category: 'Compresse',
    format: 'tubo 12 compresse',
    serving_size_g: 4.5,
    servings_per_package: 12,
    nutrition: {
      kcal: 8,
      cho_g: 1.5,
      sugars_g: 0,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 1500,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: true,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['elettroliti', 'alto-sodio', 'idratazione', 'sudorazione estrema']
  },

  // =====================================================
  // HIGH5
  // =====================================================
  {
    id: 'high5-energy-gel',
    brand: 'high5',
    name: 'Energy Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 40g',
    serving_size_g: 40,
    servings_per_package: 1,
    nutrition: {
      kcal: 92,
      cho_g: 23,
      sugars_g: 12,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 35,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'economico']
  },
  {
    id: 'high5-energy-gel-aqua',
    brand: 'high5',
    name: 'Energy Gel Aqua',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 66g',
    serving_size_g: 66,
    servings_per_package: 1,
    nutrition: {
      kcal: 92,
      cho_g: 23,
      sugars_g: 12,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 35,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'isotonico', 'no acqua', 'facile digestione']
  },
  {
    id: 'high5-energy-bar',
    brand: 'high5',
    name: 'Energy Bar',
    type: 'intra_workout',
    category: 'Barretta',
    format: 'barretta 55g',
    serving_size_g: 55,
    servings_per_package: 1,
    nutrition: {
      kcal: 200,
      cho_g: 40,
      sugars_g: 20,
      pro_g: 3,
      fat_g: 3,
      fiber_g: 2,
      sodium_mg: 60,
      potassium_mg: 0,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: false,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'medium'
    },
    tags: ['barretta', 'energia', 'solido', 'avena']
  },
  {
    id: 'high5-zero',
    brand: 'high5',
    name: 'Zero Electrolyte',
    type: 'intra_workout',
    category: 'Compresse',
    format: 'tubo 20 compresse',
    serving_size_g: 3.8,
    servings_per_package: 20,
    nutrition: {
      kcal: 7,
      cho_g: 1,
      sugars_g: 0,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 250,
      potassium_mg: 65,
      magnesium_mg: 10,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: true,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['elettroliti', 'zero calorie', 'idratazione']
  },
  {
    id: 'high5-4-1',
    brand: 'high5',
    name: 'Recovery Drink 4:1',
    type: 'post_workout',
    category: 'Polvere',
    format: 'bustina 60g',
    serving_size_g: 60,
    servings_per_package: 1,
    nutrition: {
      kcal: 224,
      cho_g: 44,
      sugars_g: 12,
      pro_g: 15,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 200,
      potassium_mg: 300,
      magnesium_mg: 50,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: false
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['recovery', '4:1 ratio', 'proteine', 'carboidrati']
  },

  // =====================================================
  // NDURANZ
  // =====================================================
  {
    id: 'nduranz-nrgy-gel',
    brand: 'nduranz',
    name: 'Nrgy Unit Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 25g',
    serving_size_g: 25,
    servings_per_package: 1,
    nutrition: {
      kcal: 90,
      cho_g: 22.5,
      sugars_g: 11,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 100,
      potassium_mg: 50,
      magnesium_mg: 15,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.8,
      fructose_ratio: 0.2
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'sloveno', 'natural']
  },
  {
    id: 'nduranz-nrgy-bar',
    brand: 'nduranz',
    name: 'Nrgy Unit Bar',
    type: 'intra_workout',
    category: 'Barretta',
    format: 'barretta 45g',
    serving_size_g: 45,
    servings_per_package: 1,
    nutrition: {
      kcal: 180,
      cho_g: 36,
      sugars_g: 18,
      pro_g: 2,
      fat_g: 3,
      fiber_g: 1,
      sodium_mg: 80,
      potassium_mg: 40,
      magnesium_mg: 10,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'medium'
    },
    tags: ['barretta', 'energia', 'datteri', 'naturale']
  },
  {
    id: 'nduranz-nrgy-drink',
    brand: 'nduranz',
    name: 'Nrgy Unit Drink 90',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'bustina 45g',
    serving_size_g: 45,
    servings_per_package: 1,
    nutrition: {
      kcal: 360,
      cho_g: 90,
      sugars_g: 45,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 400,
      potassium_mg: 100,
      magnesium_mg: 30,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.5,
      fructose_ratio: 0.5
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['drink', '90g/h', 'alto-cho', 'race']
  },

  // =====================================================
  // TORQ
  // =====================================================
  {
    id: 'torq-gel',
    brand: 'torq',
    name: 'Energy Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 45g',
    serving_size_g: 45,
    servings_per_package: 1,
    nutrition: {
      kcal: 114,
      cho_g: 28.5,
      sugars_g: 14,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 70,
      potassium_mg: 35,
      magnesium_mg: 10,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true,
      maltodextrin_ratio: 0.67,
      fructose_ratio: 0.33
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', '2:1 maltodex:fructose']
  },
  {
    id: 'torq-bar',
    brand: 'torq',
    name: 'Energy Bar',
    type: 'intra_workout',
    category: 'Barretta',
    format: 'barretta 45g',
    serving_size_g: 45,
    servings_per_package: 1,
    nutrition: {
      kcal: 182,
      cho_g: 32,
      sugars_g: 16,
      pro_g: 4,
      fat_g: 4,
      fiber_g: 2,
      sodium_mg: 90,
      potassium_mg: 50,
      magnesium_mg: 15,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: false,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'medium'
    },
    tags: ['barretta', 'energia', 'biologico']
  },
  {
    id: 'torq-recovery',
    brand: 'torq',
    name: 'Recovery Drink',
    type: 'post_workout',
    category: 'Polvere',
    format: 'bustina 65g',
    serving_size_g: 65,
    servings_per_package: 1,
    nutrition: {
      kcal: 246,
      cho_g: 40,
      sugars_g: 20,
      pro_g: 20,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 150,
      potassium_mg: 200,
      magnesium_mg: 40,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: false
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['recovery', 'proteine', 'whey', '2:1 ratio']
  },

  // =====================================================
  // HAMMER NUTRITION
  // =====================================================
  {
    id: 'hammer-gel',
    brand: 'hammer',
    name: 'Hammer Gel',
    type: 'intra_workout',
    category: 'Gel',
    format: 'gel 33g',
    serving_size_g: 33,
    servings_per_package: 1,
    nutrition: {
      kcal: 90,
      cho_g: 21,
      sugars_g: 2,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 25,
      potassium_mg: 30,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['gel', 'energia', 'basso zucchero', 'maltodestrine']
  },
  {
    id: 'hammer-perpetuem',
    brand: 'hammer',
    name: 'Perpetuem',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 1.36kg',
    serving_size_g: 68,
    servings_per_package: 20,
    nutrition: {
      kcal: 270,
      cho_g: 54,
      sugars_g: 4,
      pro_g: 7,
      fat_g: 3,
      fiber_g: 0,
      sodium_mg: 130,
      potassium_mg: 200,
      magnesium_mg: 30,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'slow'
    },
    tags: ['ultra', 'endurance', 'proteine', 'grassi', 'lunga durata']
  },
  {
    id: 'hammer-heed',
    brand: 'hammer',
    name: 'HEED',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'barattolo 928g',
    serving_size_g: 29,
    servings_per_package: 32,
    nutrition: {
      kcal: 100,
      cho_g: 25,
      sugars_g: 0,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 40,
      potassium_mg: 40,
      magnesium_mg: 6,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['drink', 'energia', 'no zucchero', 'stevia']
  },
  {
    id: 'hammer-recoverite',
    brand: 'hammer',
    name: 'Recoverite',
    type: 'post_workout',
    category: 'Polvere',
    format: 'barattolo 907g',
    serving_size_g: 57,
    servings_per_package: 16,
    nutrition: {
      kcal: 170,
      cho_g: 32,
      sugars_g: 10,
      pro_g: 10,
      fat_g: 1,
      fiber_g: 0,
      sodium_mg: 90,
      potassium_mg: 90,
      magnesium_mg: 50,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['recovery', 'proteine', 'whey isolate', 'glutammina']
  },

  // =====================================================
  // TAILWIND
  // =====================================================
  {
    id: 'tailwind-endurance',
    brand: 'tailwind',
    name: 'Endurance Fuel',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'bustina 54g',
    serving_size_g: 54,
    servings_per_package: 1,
    nutrition: {
      kcal: 200,
      cho_g: 50,
      sugars_g: 50,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 310,
      potassium_mg: 88,
      magnesium_mg: 14,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['drink', 'all-in-one', 'destrosio', 'saccarosio']
  },
  {
    id: 'tailwind-caffeinated',
    brand: 'tailwind',
    name: 'Endurance Fuel Caffeinated',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'bustina 54g',
    serving_size_g: 54,
    servings_per_package: 1,
    nutrition: {
      kcal: 200,
      cho_g: 50,
      sugars_g: 50,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 310,
      potassium_mg: 88,
      magnesium_mg: 14,
      caffeine_mg: 35
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: true,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['drink', 'caffeina', 'all-in-one', 'ultra']
  },
  {
    id: 'tailwind-recovery',
    brand: 'tailwind',
    name: 'Rebuild Recovery',
    type: 'post_workout',
    category: 'Polvere',
    format: 'bustina 62g',
    serving_size_g: 62,
    servings_per_package: 1,
    nutrition: {
      kcal: 210,
      cho_g: 36,
      sugars_g: 26,
      pro_g: 10,
      fat_g: 3,
      fiber_g: 0,
      sodium_mg: 180,
      potassium_mg: 320,
      magnesium_mg: 30,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: true,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      minutes_after: 30,
      absorption_speed: 'medium'
    },
    tags: ['recovery', 'proteine', 'rice protein', 'completo']
  },

  // =====================================================
  // SKRATCH LABS
  // =====================================================
  {
    id: 'skratch-hydration',
    brand: 'skratch',
    name: 'Sport Hydration Drink Mix',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'bustina 22g',
    serving_size_g: 22,
    servings_per_package: 1,
    nutrition: {
      kcal: 80,
      cho_g: 20,
      sugars_g: 18,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 380,
      potassium_mg: 38,
      magnesium_mg: 38,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: true,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['drink', 'elettroliti', 'naturale', 'real fruit']
  },
  {
    id: 'skratch-superfuel',
    brand: 'skratch',
    name: 'Superfuel',
    type: 'intra_workout',
    category: 'Polvere',
    format: 'bustina 60g',
    serving_size_g: 60,
    servings_per_package: 1,
    nutrition: {
      kcal: 400,
      cho_g: 100,
      sugars_g: 0,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 800,
      potassium_mg: 80,
      magnesium_mg: 80,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: true,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'fast'
    },
    tags: ['drink', 'alto-cho', 'cluster dextrin', 'race day']
  },
  {
    id: 'skratch-chews',
    brand: 'skratch',
    name: 'Sport Energy Chews',
    type: 'intra_workout',
    category: 'Gommose',
    format: 'pacchetto 50g',
    serving_size_g: 50,
    servings_per_package: 1,
    nutrition: {
      kcal: 160,
      cho_g: 40,
      sugars_g: 32,
      pro_g: 0,
      fat_g: 0,
      fiber_g: 0,
      sodium_mg: 80,
      potassium_mg: 40,
      magnesium_mg: 0,
      caffeine_mg: 0
    },
    features: {
      is_isotonic: false,
      is_hypotonic: false,
      has_electrolytes: true,
      has_bcaa: false,
      has_caffeine: false,
      is_vegan: false,
      is_gluten_free: true,
      is_lactose_free: true
    },
    timing: {
      during_activity: true,
      absorption_speed: 'medium'
    },
    tags: ['chews', 'gommose', 'energia', 'pectina']
  }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Filtra prodotti per marca
 */
export function getProductsByBrand(brand: string): SupplementProduct[] {
  return SUPPLEMENTS_DATABASE.filter(p => p.brand.toLowerCase() === brand.toLowerCase())
}

/**
 * Filtra prodotti per tipo (pre/intra/post)
 */
export function getProductsByType(type: 'pre_workout' | 'intra_workout' | 'post_workout'): SupplementProduct[] {
  return SUPPLEMENTS_DATABASE.filter(p => p.type === type)
}

/**
 * Filtra prodotti per categoria (Gel, Polvere, Barretta, etc.)
 */
export function getProductsByCategory(category: string): SupplementProduct[] {
  return SUPPLEMENTS_DATABASE.filter(p => p.category.toLowerCase() === category.toLowerCase())
}

/**
 * Filtra prodotti compatibili con vincoli (intolleranze, etc.)
 */
export function getCompatibleProducts(
  products: SupplementProduct[],
  constraints: {
    is_lactose_intolerant?: boolean
    is_gluten_intolerant?: boolean
    is_vegan?: boolean
    avoid_caffeine?: boolean
  }
): SupplementProduct[] {
  return products.filter(p => {
    if (constraints.is_lactose_intolerant && !p.features.is_lactose_free) return false
    if (constraints.is_gluten_intolerant && !p.features.is_gluten_free) return false
    if (constraints.is_vegan && !p.features.is_vegan) return false
    if (constraints.avoid_caffeine && p.features.has_caffeine) return false
    return true
  })
}

/**
 * Calcola piano fueling ottimale basato su durata e intensità
 */
export function calculateOptimalFueling(
  duration_minutes: number,
  intensity: 'low' | 'medium' | 'high',
  athlete_weight_kg: number,
  available_brands: string[],
  constraints: {
    is_lactose_intolerant?: boolean
    is_gluten_intolerant?: boolean
    is_vegan?: boolean
    avoid_caffeine?: boolean
  }
): {
  pre_workout: SupplementProduct[]
  intra_workout: SupplementProduct[]
  post_workout: SupplementProduct[]
  total_cho_g: number
  total_kcal: number
  cho_per_hour: number
  caffeine_mg: number
  recommendations: string[]
} {
  // Calcola CHO target per ora basato su intensità
  let cho_per_hour: number
  switch (intensity) {
    case 'high':
      cho_per_hour = 90 // Alta intensità: 90g/h
      break
    case 'medium':
      cho_per_hour = 60 // Media intensità: 60g/h
      break
    default:
      cho_per_hour = 30 // Bassa intensità: 30g/h
  }
  
  const hours = duration_minutes / 60
  const total_cho_target = Math.round(cho_per_hour * hours)
  
  // Filtra prodotti disponibili per marca
  let availableProducts = SUPPLEMENTS_DATABASE.filter(p => 
    available_brands.some(b => b.toLowerCase() === p.brand.toLowerCase())
  )
  
  // Applica vincoli
  availableProducts = getCompatibleProducts(availableProducts, constraints)
  
  // Seleziona prodotti
  const pre_workout = availableProducts
    .filter(p => p.type === 'pre_workout')
    .slice(0, 2)
  
  const intra_workout = availableProducts
    .filter(p => p.type === 'intra_workout')
    .sort((a, b) => b.nutrition.cho_g - a.nutrition.cho_g) // Ordina per CHO
    .slice(0, 4)
  
  const post_workout = availableProducts
    .filter(p => p.type === 'post_workout')
    .slice(0, 2)
  
  // Calcola totali
  const total_cho_g = intra_workout.reduce((sum, p) => sum + p.nutrition.cho_g, 0)
  const total_kcal = intra_workout.reduce((sum, p) => sum + p.nutrition.kcal, 0)
  const caffeine_mg = [...pre_workout, ...intra_workout].reduce((sum, p) => sum + p.nutrition.caffeine_mg, 0)
  
  // Genera raccomandazioni
  const recommendations: string[] = []
  
  if (duration_minutes > 90 && intensity === 'high') {
    recommendations.push(`Per attività >90min ad alta intensità, target ${cho_per_hour}g CHO/h`)
  }
  
  if (total_cho_g < total_cho_target) {
    recommendations.push(`Considera di aggiungere prodotti per raggiungere ${total_cho_target}g CHO totali`)
  }
  
  if (caffeine_mg > 400) {
    recommendations.push('Attenzione: caffeina totale elevata (>400mg)')
  }
  
  if (duration_minutes > 180) {
    recommendations.push('Per attività ultra (>3h), considera barrette solide per variare texture')
  }
  
  return {
    pre_workout,
    intra_workout,
    post_workout,
    total_cho_g,
    total_kcal,
    cho_per_hour,
    caffeine_mg,
    recommendations
  }
}

/**
 * Trova prodotti simili (per sostituzione)
 */
export function findSimilarProducts(
  product: SupplementProduct,
  availableBrands: string[]
): SupplementProduct[] {
  return SUPPLEMENTS_DATABASE.filter(p => 
    p.id !== product.id &&
    p.type === product.type &&
    p.category === product.category &&
    availableBrands.some(b => b.toLowerCase() === p.brand.toLowerCase()) &&
    Math.abs(p.nutrition.cho_g - product.nutrition.cho_g) <= 10 // CHO simile ±10g
  ).slice(0, 5)
}
