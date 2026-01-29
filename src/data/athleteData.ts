// -- TYPES --

export interface AthleteProfile {
  id: string
  name: string
  age: number
  stats: {
    age: number
    weight: number
    height: number
    ftp: number
    vo2max: number
    hrMax: number
  }
  phenotype: {
    type: string
    description: string
  }
  preferences: {
    likes: string[]
    dislikes: string[]
    allergies: string[]
    intolerances: string[]
    brands: string[]
    favorite_dish?: string
    preferred_protein?: string
    best_tolerated_carb?: string
  }
  team?: string
  category?: string
  coach?: string
  body_fat_percent?: number
  weight_kg?: number
  height_cm?: number
  lbm_kg_est?: string
  ftp_w?: number
  vo2max?: number
  constraints: {
    limit_foods: string[]
    intolerances: string[]
  }
  performance_metrics: {
    fat_max_power: number
    lt1: number
    lt2: number
  }
  ge_actual?: number
  power_duration_curve: { label: string; watts: number; duration: number }[]
}

export interface PowerDurationPoint {
  label: string
  watts: number
  duration: number
}

export interface MetabolicModelOutput {
  cp: number
  w_prime: number
  p_gly_peak: number
  vlamax_model: number
  vlamax_class: string
  lbm: string
}

export interface EmpathyZone {
  id: string
  range_watts: number[]
  substrates: {
    total_kcal_h: number
    cho_g_h: number
    fat_g_h: number
  }
}

// -- DATA --

const rawProfile = {
  id: "andrea-galli-master-001",
  name: "Andrea Galli",
  stats: {
    age: 47,
    weight: 74,
    height: 178,
    ftp: 233,
    vo2max: 47,
    hrMax: 180,
  },
  phenotype: {
    type: "Master Endurance / Winter Sports",
    description: "Master multisport (Corsa/Sci). Profilo clinico complesso (Istamina/TMAO/Fruttosio).",
  },
  preferences: {
    likes: ["Riso", "Pollo", "Pesce Bianco", "Patate"],
    dislikes: ["Formaggi", "Carne Rossa", "Frutta"],
    allergies: ["Glutine", "Istamina-Triggers"],
    intolerances: ["Lattosio", "Fruttosio", "Low TMAO Producer"],
    brands: ["Enervit", "EthicSport (Gluten Free)"],
    favorite_dish: "Riso e Nasello",
    preferred_protein: "Pesce Bianco",
    best_tolerated_carb: "Riso",
  },
  team: "Individual",
  category: "Master M4",
  coach: "Self",
  body_fat_percent: 18,
  constraints: {
    limit_foods: [
      "Carne Rossa",
      "Uova",
      "Pomodoro",
      "Spinaci",
      "Avocado",
      "Frutta Dolce",
      "Cioccolato",
      "Formaggi Stagionati",
    ],
    intolerances: ["Glutine", "Lattosio", "Fruttosio"],
  },
  ge_actual: 20.5,
}

const metabolic_model = {
  cp: 270,
  w_prime: 18000,
  p_gly_peak: 910,
  vlamax_model: 0.45,
  vlamax_class: "Aerobic High",
  lbm: (74 * 0.82).toFixed(1),
}

const empathy_zones = [
  { id: "Z1", range_watts: [0, 140], substrates: { total_kcal_h: 400, cho_g_h: 20, fat_g_h: 40 } },
  { id: "Z2", range_watts: [141, 198], substrates: { total_kcal_h: 600, cho_g_h: 50, fat_g_h: 50 } },
  { id: "Z3", range_watts: [199, 265], substrates: { total_kcal_h: 800, cho_g_h: 100, fat_g_h: 30 } },
  { id: "Z4", range_watts: [266, 300], substrates: { total_kcal_h: 1000, cho_g_h: 150, fat_g_h: 10 } },
  { id: "Z5", range_watts: [301, 400], substrates: { total_kcal_h: 1200, cho_g_h: 200, fat_g_h: 0 } },
]

const power_duration_curve = [
  { label: "5s", watts: 910, duration: 5 },
  { label: "10s", watts: 850, duration: 10 },
  { label: "20s", watts: 750, duration: 20 },
  { label: "30s", watts: 650, duration: 30 },
  { label: "1m", watts: 520, duration: 60 },
  { label: "2m", watts: 420, duration: 120 },
  { label: "3m", watts: 380, duration: 180 },
  { label: "6m", watts: 330, duration: 360 },
  { label: "8m", watts: 310, duration: 480 },
  { label: "20m", watts: 280, duration: 1200 },
]

const athlete = {
  ...rawProfile,
  age: rawProfile.stats.age,
  weight_kg: rawProfile.stats.weight,
  height_cm: rawProfile.stats.height,
  ftp_w: rawProfile.stats.ftp,
  vo2max: 76,
  lbm_kg_est: metabolic_model.lbm,
  performance_metrics: {
    fat_max_power: 175,
    lt1: 198,
    lt2: 265,
  },
  power_duration_curve: power_duration_curve,
}

const routine = {
  wake: "06:30",
  breakfast: "07:00",
  training_time_usual: "Flexible",
  lunch: "13:30",
  dinner: "20:00",
  sleep: "22:30",
  notes: ["Celiachia + Istamina + No Fruttosio"],
}

// -- HELPER FUNCTIONS --

const createMeal = (id: string, time: string, name: string, type: string, note: string, items: any[]) => {
  const total_macros = items.reduce(
    (acc, item) => ({
      kcal: acc.kcal + (item.kcal || 0),
      cho: acc.cho + (item.cho || 0),
      pro: acc.pro + (item.pro || 0),
      fat: acc.fat + (item.fat || 0),
    }),
    { kcal: 0, cho: 0, pro: 0, fat: 0 },
  )

  return { id, time, name, type, note, total_macros, items }
}

const FOODS = {
  riso: { name: "Riso Basmati", kcal: 360, cho: 80, pro: 7, fat: 0.5 },
  patate: { name: "Patate Lesse", kcal: 85, cho: 19, pro: 2, fat: 0 },
  crema_riso: { name: "Crema di Riso", kcal: 360, cho: 82, pro: 6, fat: 1 },
  pollo: { name: "Pollo Fresco", kcal: 110, cho: 0, pro: 23, fat: 1 },
  tacchino: { name: "Tacchino", kcal: 110, cho: 0, pro: 24, fat: 1 },
  pesce_bianco: { name: "Nasello/Merluzzo Fresco", kcal: 80, cho: 0, pro: 17, fat: 0.5 },
  salmone: { name: "Salmone Fresco", kcal: 208, cho: 0, pro: 20, fat: 13 },
  manzo: { name: "Tagliata Manzo", kcal: 250, cho: 0, pro: 26, fat: 15 },
  olio: { name: "Olio EVO", kcal: 900, cho: 0, pro: 0, fat: 100 },
  zucchine: { name: "Zucchine", kcal: 15, cho: 3, pro: 1, fat: 0 },
  avocado: { name: "Avocado", kcal: 160, cho: 9, pro: 2, fat: 15 },
  cioccolato: { name: "Cioccolato Fondente", kcal: 546, cho: 46, pro: 5, fat: 31 },
  sciroppo_riso: { name: "Sciroppo Riso", kcal: 300, cho: 75, pro: 0, fat: 0 },
  miele: { name: "Miele", kcal: 304, cho: 82, pro: 0.3, fat: 0 },
  pro_whey: { name: "Enervit Whey", kcal: 380, cho: 5, pro: 80, fat: 5 },
  pro_vegan: { name: "Pro Isol. Pisello", kcal: 380, cho: 2, pro: 85, fat: 4 },
  maltodestrine: { name: "Maltodestrine Pure", kcal: 380, cho: 95, pro: 0, fat: 0 },
  pasta: { name: "Pasta Grano Duro", kcal: 350, cho: 72, pro: 12, fat: 1.5 },
}

const getFood = (key: keyof typeof FOODS, grams: number) => {
  const f = FOODS[key]
  const ratio = grams / 100
  return {
    name: f.name,
    grams,
    kcal: Math.round(f.kcal * ratio),
    cho: Math.round(f.cho * ratio),
    pro: Math.round(f.pro * ratio),
    fat: Math.round(f.fat * ratio),
  }
}

const daysConfig = [
  {
    day: "Lunedì",
    type: "Active Recovery",
    duration: "45m",
    tss: 60,
    intensity: "LOW",
    description: "Rulli Recupero Z1",
    time: "Flexible",
  },
  {
    day: "Martedì",
    type: "Gym Strength",
    duration: "1h 30m",
    tss: 60,
    intensity: "LOW",
    description: "Palestra Forza",
    time: "Flexible",
  },
  {
    day: "Mercoledì",
    type: "Endurance + Tempo",
    duration: "3h",
    tss: 60,
    intensity: "HIGH",
    description: "3h Z2 + 4x8 Z3b",
    time: "Flexible",
  },
  {
    day: "Giovedì",
    type: "REST",
    duration: "0",
    tss: 0,
    intensity: "LOW",
    description: "Riposo Totale",
    time: "Flexible",
  },
  {
    day: "Venerdì",
    type: "REST",
    duration: "0",
    tss: 0,
    intensity: "LOW",
    description: "Riposo Totale",
    time: "Flexible",
  },
  {
    day: "Sabato",
    type: "Intervals",
    duration: "3h",
    tss: 140,
    intensity: "HIGH",
    description: "1h Z2 + 2x20 Z3b",
    time: "10:00",
  },
  {
    day: "Domenica",
    type: "Long Distance",
    duration: "4h 30m",
    tss: 220,
    intensity: "HIGH",
    description: "Fondo Z2 e Z3",
    time: "Flexible",
  },
]

const generateDay = (config: any) => {
  const isRest = config.type === "REST"

  let training_kcal = 0

  if (!isRest) {
    if (config.type === "Active Recovery") {
      training_kcal = 500
    } else if (config.type === "Gym Strength") {
      training_kcal = 500
    } else if (config.type === "Endurance + Tempo") {
      training_kcal = 1200
    } else if (config.type === "Intervals") {
      training_kcal = 1200
    } else if (config.type === "Long Distance") {
      training_kcal = 1200
    }
  }

  const base_kcal = 2000
  const total_daily_kcal = isRest ? 2100 : config.intensity === "HIGH" ? 3200 : 2500

  // Intra Work
  const intra_table = []
  const epigenetics = { stimuli: [], stop_rules: [] }
  const micros = { vitamins: [], minerals: [] }

  if (!isRest && config.intensity === "HIGH") {
    intra_table.push({
      time_range: "During",
      target: "Energy",
      product: "Maltodestrine",
      dose: "225g CHO",
      effect: "High Carb Focus",
    })
  }

  const meals = []

  if (config.day === "Mercoledì") {
    // Exact Figma values: 2198 kcal, 282g CHO, 119g PRO, 68g FAT
    meals.push(
      createMeal("bf", "08:00", "Colazione Performance", "Breakfast", "Pre-Training", [
        getFood("riso", 100),
        getFood("miele", 30),
        getFood("pro_whey", 20),
      ]),
    )
    meals.push(
      createMeal("ln", "13:30", "Pranzo", "Lunch", "Recovery", [
        getFood("pasta", 130),
        getFood("manzo", 150),
        getFood("olio", 10),
      ]),
    )
    meals.push(
      createMeal("dn", "20:00", "Cena", "Dinner", "Recovery", [
        getFood("salmone", 150),
        getFood("avocado", 50),
        getFood("riso", 90),
        getFood("cioccolato", 10),
      ]),
    )
  } else if (isRest) {
    meals.push(
      createMeal("bf", "07:30", "Colazione Base", "Breakfast", "Maintenance", [
        getFood("crema_riso", 60),
        getFood("pro_whey", 20),
      ]),
    )
    meals.push(
      createMeal("ln", "13:00", "Pranzo Leggero", "Lunch", "Rest Day", [
        getFood("riso", 80),
        getFood("pollo", 120),
        getFood("olio", 10),
      ]),
    )
    meals.push(
      createMeal("dn", "19:30", "Cena", "Dinner", "Recovery", [
        getFood("pesce_bianco", 150),
        getFood("patate", 200),
        getFood("olio", 10),
      ]),
    )
  } else {
    meals.push(
      createMeal("bf", "07:30", "Colazione", "Breakfast", "Training Day", [
        getFood("riso", 80),
        getFood("miele", 20),
        getFood("pro_whey", 25),
      ]),
    )
    meals.push(
      createMeal("ln", "13:00", "Pranzo", "Lunch", "Recovery", [
        getFood("pasta", 100),
        getFood("pollo", 150),
        getFood("olio", 10),
      ]),
    )
    meals.push(
      createMeal("dn", "19:30", "Cena", "Dinner", "Recovery", [
        getFood("pesce_bianco", 180),
        getFood("riso", 80),
        getFood("olio", 10),
      ]),
    )
  }

  const stacks = []
  stacks.push({ target: "DAILY", product: "Omega 3", dose: "2 caps", timing: "Cena", note: "Recovery" })
  if (config.intensity === "HIGH") {
    stacks.push({ target: "PERFORMANCE", product: "Caffeine", dose: "200mg", timing: "Pre-Training", note: "Focus" })
  }

  return {
    meta: {
      day_name: config.day,
      type: config.type,
      time: config.time,
      duration: config.duration,
      tss: config.tss,
      fueling_class: config.intensity,
      session_title: config.description,
    },
    training_load: {
      intra_target_cho: config.intensity === "HIGH" ? 225 : 0,
      intra_cho_burned_total: training_kcal,
      intra_lock_rule: "High Carb Focus",
      total_kcal: total_daily_kcal,
      structure: isRest ? [] : ["Warmup", "Work", "Cooldown"],
    },
    intra_work_table: intra_table,
    meals: meals,
    supplement_stack: stacks,
    athlete_profile_notes: [],
    epigenetics: epigenetics,
    micros: micros,
    amino_profile: { eaa: [] },
    lipids_fiber: [],
    microbiota: { drivers: [], food_matrix: [], status: "Normal" },
    empathy_indices: [],
  }
}

const weekly_biomap = daysConfig.map(generateDay)

export const athleteData = {
  athlete,
  routine,
  metabolic_model,
  empathy_zones,
  weekly_biomap,
}
