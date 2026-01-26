"use client"
import type { AthleteDataType } from "@/components/dashboard-content"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Activity, Flame, Clock, Package, Sparkles, ShoppingCart, Download, FileText, AlertTriangle, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AIAnalysisButton } from "@/components/ai-analysis-button"
import { SUPPLEMENTS_DATABASE, getProductsByBrand, getCompatibleProducts, type SupplementProduct } from "@/lib/data/supplements-database"
import { FOODS_DATABASE, filterFoodsByConstraints, getFoodsForMealTime, findAlternative, calculatePortionForMacro, type FoodItem } from "@/lib/data/foods-database"
import { NutrigenomicsPanel } from "@/components/nutrigenomics-panel"

interface NutritionPlanProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
}

// ============================================
// EMPATHY PERFORMANCE bioMAP CONSTITUTION v2
// Metabolic-Layer + Microbiota/Epigenetic Merge (LOCK)
// ============================================

// LOCK: Substrati per zona (fallback se Metabolic Layer assente)
const ZONE_SUBSTRATES: Record<string, { cho: number; fat: number; pro: number; name: string }> = {
  z1: { cho: 0.4, fat: 0.6, pro: 0, name: "Recovery" },
  z2: { cho: 0.6, fat: 0.4, pro: 0, name: "Endurance" },
  z3: { cho: 0.8, fat: 0.2, pro: 0, name: "Tempo" },
  z4: { cho: 0.9, fat: 0.08, pro: 0, name: "Threshold" },
  z5: { cho: 0.98, fat: 0, pro: 0.02, name: "VO2max" },
  z6: { cho: 1.0, fat: 0, pro: 0, name: "Anaerobic" },
  z7: { cho: 1.0, fat: 0, pro: 0, name: "Neuromuscular" },
  gym: { cho: 0.6, fat: 0.3, pro: 0.1, name: "Palestra" },
}

// LOCK: Zone definitions for calculation (same as metabolic-profile-generator)
const ZONE_DEFINITIONS = [
  { id: "Z1", name: "Recovery", cpMin: 0, cpMax: 0.7, color: "#94a3b8" },
  { id: "Z2", name: "Endurance", cpMin: 0.7, cpMax: 0.76, color: "#22c55e" },
  { id: "Z3", name: "Tempo", cpMin: 0.88, cpMax: 0.92, color: "#eab308" },
  { id: "Z4", name: "Threshold", cpMin: 0.98, cpMax: 1.02, color: "#f97316" },
  { id: "Z5", name: "VO2max", cpMin: 1.1, cpMax: 1.2, color: "#ef4444" },
  { id: "Z6", name: "Anaerobic", cpMin: 1.25, cpMax: 1.8, color: "#dc2626" },
  { id: "Z7", name: "Neuromuscular", cpMin: 1.8, cpMax: 3.0, color: "#991b1b" },
]

// LOCK: Classi fueling
const FUELING_CLASS = {
  LOW: { cho_target: 0.3, type: "solido", description: "Training LOW → quasi zero CHO, adattamento" },
  MEDIUM: { cho_target: 0.5, type: "misto", description: "Training MEDIUM → misto solido/liquido" },
  HIGH: { cho_target: 0.5, type: "liquido", description: "Training HIGH → liquido altamente digeribile" },
}

// LOCK: Distribuzione kcal in base a orario allenamento
const MEAL_DISTRIBUTION = {
  morning: {
    colazione: { pct: 0.3, macro: { cho: 0.75, fat: 0.15, pro: 0.1 } },
    pranzo: { pct: 0.25, macro: { cho: 0.65, fat: 0.25, pro: 0.15 } },
    post_workout: { pct: 0.05, macro: { cho: 0.6, fat: 0.1, pro: 0.3 } },
    spuntino: { pct: 0.1, macro: { cho: 0.5, fat: 0.25, pro: 0.25 } },
    merenda: { pct: 0.05, macro: { cho: 0.4, fat: 0.4, pro: 0.2 } },
    cena: { pct: 0.2, macro: { cho: 0.4, fat: 0.4, pro: 0.3 } },
    pre_sonno: { pct: 0.05, macro: { cho: 0.2, fat: 0.3, pro: 0.5 } },
  },
  afternoon: {
    colazione: { pct: 0.22, macro: { cho: 0.65, fat: 0.25, pro: 0.1 } },
    pranzo: { pct: 0.25, macro: { cho: 0.75, fat: 0.15, pro: 0.1 } },
    post_workout: { pct: 0.05, macro: { cho: 0.6, fat: 0.1, pro: 0.3 } },
    spuntino: { pct: 0.1, macro: { cho: 0.5, fat: 0.25, pro: 0.25 } },
    merenda: { pct: 0.08, macro: { cho: 0.4, fat: 0.4, pro: 0.2 } },
    cena: { pct: 0.25, macro: { cho: 0.55, fat: 0.2, pro: 0.25 } },
    pre_sonno: { pct: 0.05, macro: { cho: 0.2, fat: 0.3, pro: 0.5 } },
  },
}

const MICRONUTRIENT_TARGETS = {
  vitamins: {
    b1: { name: "Vitamina B1", target: 1.2, unit: "mg", role: "Metabolismo carboidrati" },
    b6: { name: "Vitamina B6", target: 1.7, unit: "mg", role: "Metabolismo proteine" },
    b12: { name: "Vitamina B12", target: 2.4, unit: "μg", role: "Formazione globuli rossi" },
    c: { name: "Vitamina C", target: 90, unit: "mg", role: "Antiossidante, recupero" },
    d: { name: "Vitamina D", target: 20, unit: "μg", role: "Salute ossea, immunità" },
    e: { name: "Vitamina E", target: 15, unit: "mg", role: "Antiossidante" },
  },
  minerals: {
    iron: { name: "Ferro", target: 18, unit: "mg", role: "Trasporto ossigeno" },
    zinc: { name: "Zinco", target: 11, unit: "mg", role: "Recupero, immunità" },
    magnesium: { name: "Magnesio", target: 420, unit: "mg", role: "Funzione muscolare" },
    calcium: { name: "Calcio", target: 1000, unit: "mg", role: "Salute ossea" },
    sodium: { name: "Sodio", target: 2300, unit: "mg", role: "Bilancio elettroliti" },
    potassium: { name: "Potassio", target: 3500, unit: "mg", role: "Funzione muscolare" },
  },
}

const DAILY_SUPPLEMENT_STACK = {
  base: [
    { name: "Omega-3", dose: "2g", timing: "Colazione", benefit: "Anti-infiammatorio, salute cardiovascolare" },
    { name: "Vitamina D3", dose: "2000 UI", timing: "Colazione", benefit: "Immunità, salute ossea" },
    { name: "Magnesio", dose: "400mg", timing: "Pre-sonno", benefit: "Recupero muscolare, qualità sonno" },
  ],
  training_day: [
    { name: "Caffeina", dose: "200mg", timing: "Pre-workout (-60min)", benefit: "Performance, focus" },
    { name: "Beta-Alanina", dose: "3.2g", timing: "Pre-workout (-30min)", benefit: "Buffer acido lattico" },
    { name: "Creatina", dose: "5g", timing: "Post-workout", benefit: "Forza, recupero ATP" },
    { name: "BCAA", dose: "10g", timing: "Intra-workout", benefit: "Preservazione muscolare" },
    { name: "Glutammina", dose: "10g", timing: "Post-workout", benefit: "Recupero, immunità" },
  ],
  high_intensity: [
    { name: "Citrullina", dose: "6g", timing: "Pre-workout (-45min)", benefit: "Vasodilatazione, NO+" },
    { name: "Sodio Bicarbonato", dose: "0.3g/kg", timing: "Pre-workout (-90min)", benefit: "Buffer acidità" },
  ],
  endurance: [
    { name: "Sale elettrolitico", dose: "500mg", timing: "Ogni 60min", benefit: "Prevenzione crampi" },
    { name: "Ferro (se necessario)", dose: "14mg", timing: "Lontano dai pasti", benefit: "Capacità aerobica" },
  ],
  recovery: [
    { name: "Tart Cherry", dose: "500mg", timing: "Post-workout", benefit: "Anti-infiammatorio naturale" },
    { name: "Collagene", dose: "10g", timing: "Colazione", benefit: "Salute tendini e articolazioni" },
    { name: "ZMA", dose: "30mg Zn + 450mg Mg", timing: "Pre-sonno", benefit: "Recupero ormonale" },
  ],
}

// Brand products database
const BRAND_PRODUCTS: Record<string, Record<string, { name: string; dose: string; note: string }[]>> = {
  Enervit: {
    gel: [{ name: "Enervit Gel", dose: "1 gel (25g CHO)", note: "Ogni 30-45min" }],
    maltodestrine: [{ name: "Enervit Carbo Flow", dose: "30-60g/h", note: "Sciogliere in 500ml" }],
    "carbo-polvere": [{ name: "Enervit G Sport", dose: "40-80g/h", note: "Concentrazione 6-8%" }],
    whey: [{ name: "Enervit Protein", dose: "30g (0.4g/kg)", note: "Post workout entro 30min" }],
    recovery: [{ name: "Enervit Recovery Drink", dose: "1 porzione", note: "CHO:PRO ratio 3:1" }],
    elettroliti: [{ name: "Enervit Isotonic Drink", dose: "500-750ml/h", note: "Durante attività" }],
    barrette: [{ name: "Enervit Power Sport", dose: "1 barretta", note: "Pre o durante attività lunga" }],
  },
  SIS: {
    gel: [{ name: "SIS GO Isotonic Gel", dose: "1 gel (22g CHO)", note: "No acqua necessaria" }],
    maltodestrine: [{ name: "SIS GO Energy", dose: "40-90g/h", note: "In 500-750ml acqua" }],
    "carbo-polvere": [{ name: "SIS Beta Fuel", dose: "80-120g/h", note: "Ratio 1:0.8 per alta intensità" }],
    whey: [{ name: "SIS REGO Rapid Recovery", dose: "50g porzione", note: "20g proteine + 23g CHO" }],
    recovery: [{ name: "SIS REGO Rapid Recovery+", dose: "1 porzione", note: "Con elettroliti e vitamine" }],
    caffeina: [{ name: "SIS GO Caffeine Shot", dose: "150mg caffeina", note: "30min pre o durante" }],
    elettroliti: [{ name: "SIS GO Hydro", dose: "1 tab in 500ml", note: "Zero calorie" }],
    barrette: [{ name: "SIS GO Energy Bar", dose: "1 barretta (26g CHO)", note: "Facile digestione" }],
  },
  "+Watt": {
    gel: [{ name: "+Watt Energel", dose: "1 gel (25g CHO)", note: "Con elettroliti" }],
    maltodestrine: [{ name: "+Watt Maltodex", dose: "40-80g/h", note: "DE 19" }],
    whey: [{ name: "+Watt Whey Protein", dose: "30g", note: "Isolate 90%" }],
    bcaa: [{ name: "+Watt BCAA 8:1:1", dose: "5-10g", note: "Durante o post" }],
    creatina: [{ name: "+Watt Creatina", dose: "3-5g/die", note: "Monoidrato micronizzata" }],
    "beta-alanina": [{ name: "+Watt Beta Alanine", dose: "3-6g/die", note: "Suddivisa in 2 dosi" }],
  },
  Maurten: {
    gel: [{ name: "Maurten Gel 100", dose: "1 gel (25g CHO)", note: "Idrogel technology" }],
    maltodestrine: [{ name: "Maurten Drink Mix 320", dose: "80g/500ml", note: "Per alta intensità" }],
    "carbo-polvere": [{ name: "Maurten Drink Mix 160", dose: "40g/500ml", note: "Per intensità moderata" }],
    caffeina: [{ name: "Maurten Gel 100 CAF", dose: "1 gel + 100mg caffeina", note: "Ultimi 60min" }],
  },
  "226ers": {
    gel: [{ name: "226ers Energy Gel", dose: "1 gel (25g CHO)", note: "Bio ingredients" }],
    maltodestrine: [{ name: "226ers Energy Drink", dose: "40-80g/h", note: "Con amilopectina" }],
    recovery: [{ name: "226ers Recovery Drink", dose: "1 porzione", note: "Vegano disponibile" }],
    bcaa: [{ name: "226ers BCAA", dose: "5g", note: "Ratio 8:1:1" }],
  },
  NamedSport: {
    gel: [{ name: "Total Energy Gel", dose: "1 gel (25g CHO)", note: "Vari gusti" }],
    maltodestrine: [{ name: "Maltonam", dose: "40-80g/h", note: "DE variabile" }],
    whey: [{ name: "100% Whey Protein Shake", dose: "30g", note: "Gusto cioccolato" }],
    creatina: [{ name: "Crea-Gold", dose: "3g/die", note: "Creapure" }],
    recovery: [{ name: "Star Whey Perfect", dose: "1 porzione", note: "Post intenso" }],
  },
  MyProtein: {
    whey: [{ name: "Impact Whey", dose: "25g", note: "Economico e efficace" }],
    maltodestrine: [{ name: "Maltodestrina", dose: "50-100g/h", note: "Bulk economico" }],
    creatina: [{ name: "Creatine Monohydrate", dose: "5g/die", note: "Creapure" }],
    bcaa: [{ name: "BCAA 4:1:1", dose: "5-10g", note: "Durante allenamento" }],
    eaa: [{ name: "EAA", dose: "10g", note: "Tutti gli essenziali" }],
    "beta-alanina": [{ name: "Beta Alanine", dose: "3-6g/die", note: "Powder o tabs" }],
  },
  // New brands added to match expanded database
  "Precision Hydration": {
    gel: [{ name: "PF 30 Gel", dose: "1 gel (30g CHO)", note: "1:1 ratio mild" }],
    elettroliti: [{ name: "PH 1000", dose: "1 tab/500ml", note: "1000mg sodio" }],
  },
  HIGH5: {
    gel: [{ name: "Energy Gel Aqua", dose: "1 gel (23g CHO)", note: "Isotonico, no acqua" }],
    maltodestrine: [{ name: "Energy Drink", dose: "40-80g/h", note: "Mix economico" }],
    recovery: [{ name: "Recovery Drink 4:1", dose: "60g", note: "15g proteine" }],
    elettroliti: [{ name: "Zero", dose: "1 tab/500ml", note: "Zero calorie" }],
    barrette: [{ name: "Energy Bar", dose: "1 bar (40g CHO)", note: "Avena naturale" }],
  },
  Nduranz: {
    gel: [{ name: "Nrgy Unit Gel", dose: "1 gel (22g CHO)", note: "Natural ingredients" }],
    maltodestrine: [{ name: "Nrgy Unit Drink 90", dose: "90g/h", note: "1:1 ratio high CHO" }],
    barrette: [{ name: "Nrgy Unit Bar", dose: "1 bar (36g CHO)", note: "Datteri naturali" }],
  },
  TORQ: {
    gel: [{ name: "TORQ Gel", dose: "1 gel (28g CHO)", note: "2:1 maltodex:fruct" }],
    maltodestrine: [{ name: "TORQ Energy", dose: "40-80g/h", note: "Biologico" }],
    recovery: [{ name: "TORQ Recovery", dose: "65g", note: "20g whey protein" }],
    barrette: [{ name: "TORQ Bar", dose: "1 bar (32g CHO)", note: "Organic" }],
  },
  "Hammer Nutrition": {
    gel: [{ name: "Hammer Gel", dose: "1 gel (21g CHO)", note: "Basso zucchero" }],
    maltodestrine: [{ name: "HEED", dose: "25-50g/h", note: "No zucchero, stevia" }],
    recovery: [{ name: "Recoverite", dose: "57g", note: "Whey isolate + glutamina" }],
  },
  Tailwind: {
    maltodestrine: [{ name: "Endurance Fuel", dose: "50-100g/h", note: "All-in-one semplice" }],
    recovery: [{ name: "Rebuild Recovery", dose: "62g", note: "Rice protein" }],
    caffeina: [{ name: "Caffeinated Fuel", dose: "35mg/porzione", note: "Per ultra" }],
  },
  "Skratch Labs": {
    maltodestrine: [{ name: "Sport Hydration", dose: "20-40g/h", note: "Real fruit, natural" }],
    elettroliti: [{ name: "Superfuel", dose: "100g/h", note: "Cluster dextrin race" }],
  },
}

// Default GE value
const DEFAULT_GE = 0.23

// Interface for zone consumption data
interface ZoneConsumption {
  kcalH: number
  choGH: number
  fatGH: number
  proGH?: number
}

interface EmpathyZone {
  id: string
  name: string
  min: number
  max: number
  cpPercent?: { min: number; max: number }
  color: string
  substrates: { cho: number; fat: number; pro: number }
  consumption: ZoneConsumption
}

interface MetabolicProfile {
  ftp_watts?: number // renamed from ftp to ftp_watts to match database field
  ge?: number
  empathy_zones?: Record<string, EmpathyZone>
  hr_zones?: Record<string, EmpathyZone>
}

interface SportSupplements {
  brands: string[]
  types: string[]
}

interface TrainingActivity {
  id: string
  day_of_week: number
  sport_type: string
  duration: number
  zone: number
  workout_name?: string
  target_power_min?: number
  target_power_max?: number
  activity_date?: string
  title?: string
  tss?: number
  primary_zone?: string // Added for getWorkoutType
  target_zone?: string // Added for getWorkoutType
  scheduled_time?: string // Added scheduled_time field
}

interface TrainingPreferences {
  preferred_training_time: string
  preferred_rest_days: string[]
  coach_notes: string
}

const parsePreferredTimeToHour = (preferredTime: string): number => {
  if (preferredTime.includes("6-8") || preferredTime.includes("presto")) return 7
  if (preferredTime.includes("8-12") || preferredTime.includes("Mattina")) return 10
  if (preferredTime.includes("12-14") || preferredTime.includes("Pranzo")) return 13
  if (preferredTime.includes("14-18") || preferredTime.includes("Pomeriggio")) return 16
  if (preferredTime.includes("18-21") || preferredTime.includes("Sera")) return 19
  return 10 // default
}

interface AthleteConstraintsData {
  intolerances: string[]
  allergies: string[]
  dietary_preferences: string[]
  dietary_limits: string[]
  notes?: string // added notes field
  foods_to_avoid?: string[] // AI corrections
  foods_to_include?: string[] // AI corrections
}

// AI Ingredient Substitutions - applied inline to meals
interface AISubstitution {
  original: string
  substitute: string
  reason: string
}

// Built-in substitution rules based on common intolerances/allergies
const INGREDIENT_SUBSTITUTIONS: Record<string, { substitute: string; reason: string }> = {
  // Lattosio
  "latte": { substitute: "latte di cocco", reason: "intolleranza lattosio" },
  "latte intero": { substitute: "latte di cocco", reason: "intolleranza lattosio" },
  "latte parzialmente scremato": { substitute: "latte di mandorla", reason: "intolleranza lattosio" },
  "yogurt": { substitute: "yogurt di cocco", reason: "intolleranza lattosio" },
  "yogurt greco": { substitute: "yogurt greco senza lattosio", reason: "intolleranza lattosio" },
  "ricotta": { substitute: "tofu morbido", reason: "intolleranza lattosio" },
  "parmigiano": { substitute: "lievito alimentare", reason: "intolleranza lattosio" },
  "burro": { substitute: "burro chiarificato/ghee", reason: "intolleranza lattosio" },
  "mozzarella": { substitute: "mozzarella senza lattosio", reason: "intolleranza lattosio" },
  // Glutine
  "pane": { substitute: "pane senza glutine", reason: "celiachia/intolleranza glutine" },
  "pasta": { substitute: "pasta di riso/mais", reason: "celiachia/intolleranza glutine" },
  "farina": { substitute: "farina di riso", reason: "celiachia/intolleranza glutine" },
  "avena": { substitute: "avena certificata gluten-free", reason: "celiachia/intolleranza glutine" },
  "farro": { substitute: "quinoa", reason: "celiachia/intolleranza glutine" },
  "orzo": { substitute: "riso", reason: "celiachia/intolleranza glutine" },
  // Uova
  "uova": { substitute: "tofu strapazzato", reason: "allergia uova" },
  "uovo": { substitute: "semi di chia + acqua", reason: "allergia uova" },
  // Frutta secca
  "noci": { substitute: "semi di zucca", reason: "allergia frutta secca" },
  "mandorle": { substitute: "semi di girasole", reason: "allergia frutta secca" },
  "nocciole": { substitute: "semi di canapa", reason: "allergia frutta secca" },
  "arachidi": { substitute: "semi di zucca", reason: "allergia frutta secca" },
  // Nichel
  "pomodoro": { substitute: "peperoni", reason: "allergia nichel" },
  "spinaci": { substitute: "lattuga", reason: "allergia nichel" },
  "cacao": { substitute: "carruba", reason: "allergia nichel" },
  "cioccolato": { substitute: "carruba", reason: "allergia nichel" },
}

// Interface for tracking used foods across the week
interface WeeklyFoodUsage {
  [mealType: string]: {
    [foodName: string]: number
  }
}

const WORKOUT_METABOLIC_PROFILE: Record<
  string,
  {
    metabolicPath: string
    primaryFuel: string
    macroRatio: { cho: number; pro: number; fat: number }
    keyNutrients: string[]
    preWorkoutFocus: string
    postWorkoutFocus: string
    foodSuggestions: string[]
  }
> = {
  // VO2max / Intervalli alta intensità
  vo2max: {
    metabolicPath: "Glicolitico anaerobico",
    primaryFuel: "Glicogeno muscolare",
    macroRatio: { cho: 0.65, pro: 0.2, fat: 0.15 },
    keyNutrients: ["CHO rapidi", "Antiossidanti", "Ferro", "Vitamina C", "Beta-alanina"],
    preWorkoutFocus: "CHO alto indice glicemico, evitare grassi",
    postWorkoutFocus: "Recovery 4:1 CHO:PRO, antiossidanti",
    foodSuggestions: ["Riso bianco", "Banana matura", "Miele", "Succo di barbabietola", "Ciliegie"],
  },
  intervals: {
    metabolicPath: "Glicolitico misto",
    primaryFuel: "Glicogeno + Fosfocreatina",
    macroRatio: { cho: 0.6, pro: 0.22, fat: 0.18 },
    keyNutrients: ["CHO complessi", "Creatina", "Magnesio", "Sodio"],
    preWorkoutFocus: "CHO complessi 2-3h prima",
    postWorkoutFocus: "PRO alto + CHO per resintesi glicogeno",
    foodSuggestions: ["Pasta", "Patate", "Pollo", "Uova", "Quinoa"],
  },
  // Soglia / Threshold
  threshold: {
    metabolicPath: "Aerobico-glicolitico",
    primaryFuel: "Glicogeno + Acidi grassi",
    macroRatio: { cho: 0.55, pro: 0.2, fat: 0.25 },
    keyNutrients: ["CHO complessi", "Caffeina", "Sodio", "Potassio", "Vitamina B"],
    preWorkoutFocus: "CHO moderati + grassi MCT",
    postWorkoutFocus: "CHO:PRO 3:1, elettroliti",
    foodSuggestions: ["Avena", "Riso integrale", "Salmone", "Avocado", "Noci"],
  },
  tempo: {
    metabolicPath: "Aerobico intenso",
    primaryFuel: "Glicogeno + lipidi",
    macroRatio: { cho: 0.55, pro: 0.18, fat: 0.27 },
    keyNutrients: ["CHO medi", "Omega-3", "Ferro", "B12"],
    preWorkoutFocus: "Pasto equilibrato 2-3h prima",
    postWorkoutFocus: "Recovery drink + pasto completo",
    foodSuggestions: ["Pasta integrale", "Pesce", "Verdure", "Frutta secca"],
  },
  // Endurance / Fondo
  endurance: {
    metabolicPath: "Aerobico lipidico",
    primaryFuel: "Acidi grassi + glicogeno (risparmio)",
    macroRatio: { cho: 0.5, pro: 0.18, fat: 0.32 },
    keyNutrients: ["Grassi MCT", "CHO lenti", "L-carnitina", "Omega-3", "Vitamina D"],
    preWorkoutFocus: "Low CHO per adattamento, grassi sani",
    postWorkoutFocus: "PRO per recupero, grassi anti-infiammatori",
    foodSuggestions: ["Uova", "Avocado", "Salmone", "Noci", "Olio MCT", "Verdure a foglia"],
  },
  recovery: {
    metabolicPath: "Rigenerazione tissutale",
    primaryFuel: "Aminoacidi + glucosio",
    macroRatio: { cho: 0.45, pro: 0.3, fat: 0.25 },
    keyNutrients: ["PRO alta qualità", "Leucina", "Omega-3", "Vitamina D", "Zinco", "Collagene"],
    preWorkoutFocus: "N/A - giorno riposo",
    postWorkoutFocus: "N/A - focus su riparazione",
    foodSuggestions: ["Pollo", "Pesce", "Uova", "Brodo di ossa", "Frutti di bosco", "Curcuma"],
  },
  // Forza / Palestra
  strength: {
    metabolicPath: "Fosfocreatina + glicolitico",
    primaryFuel: "ATP-CP + Glicogeno",
    macroRatio: { cho: 0.4, pro: 0.35, fat: 0.25 },
    keyNutrients: ["PRO alto", "Creatina", "Leucina", "HMB", "Vitamina D", "Zinco"],
    preWorkoutFocus: "PRO + CHO moderati",
    postWorkoutFocus: "PRO 0.4g/kg entro 2h, Creatina 5g",
    foodSuggestions: ["Carne magra", "Uova", "Ricotta", "Riso", "Patate dolci"],
  },
  gym: {
    metabolicPath: "Fosfocreatina + glicolitico",
    primaryFuel: "ATP-CP + Glicogeno",
    macroRatio: { cho: 0.4, pro: 0.35, fat: 0.25 },
    keyNutrients: ["PRO alto", "Creatina", "Leucina", "HMB"],
    preWorkoutFocus: "PRO + CHO moderati",
    postWorkoutFocus: "PRO 0.4g/kg + Creatina",
    foodSuggestions: ["Pollo", "Riso", "Uova", "Yogurt greco"],
  },
  // Riposo
  rest: {
    metabolicPath: "Metabolismo basale",
    primaryFuel: "Mix equilibrato",
    macroRatio: { cho: 0.4, pro: 0.25, fat: 0.35 },
    keyNutrients: ["Omega-3", "Antiossidanti", "Fibre", "Probiotici"],
    preWorkoutFocus: "N/A",
    postWorkoutFocus: "N/A",
    foodSuggestions: ["Verdure", "Pesce", "Legumi", "Frutta", "Yogurt"],
  },
}

const getWorkoutType = (workout: any): string => {
  if (!workout) return "rest"

  const title = (workout.title || "").toLowerCase()
  const zone = workout.target_zone || workout.primary_zone || ""
  const sportType = (workout.sport_type || "").toLowerCase()

  // Check sport type first
  if (sportType.includes("gym") || sportType.includes("palestra") || sportType.includes("strength")) {
    return "strength"
  }

  // Check title keywords
  if (title.includes("vo2") || title.includes("v02") || title.includes("massimo")) return "vo2max"
  if (title.includes("interval") || title.includes("ripetute") || title.includes("siv")) return "intervals"
  if (title.includes("soglia") || title.includes("threshold") || title.includes("ftp")) return "threshold"
  if (title.includes("tempo") || title.includes("z3")) return "tempo"
  if (title.includes("endurance") || title.includes("fondo") || title.includes("lungo") || title.includes("z2"))
    return "endurance"
  if (title.includes("recovery") || title.includes("recupero") || title.includes("riposo")) return "recovery"
  if (title.includes("forza") || title.includes("strength") || title.includes("palestra")) return "strength"

  // Check zone
  if (zone === "Z5" || zone === "Z6") return "vo2max"
  if (zone === "Z4") return "threshold"
  if (zone === "Z3") return "tempo"
  if (zone === "Z2") return "endurance"
  if (zone === "Z1") return "recovery"

  return "endurance" // default
}

const calculateMealTiming = (workoutTime: string | null, workoutType: string, preferredTrainingTime?: string | null) => {
  const profile = WORKOUT_METABOLIC_PROFILE[workoutType] || WORKOUT_METABOLIC_PROFILE.endurance

  // Calculate meal windows
  const meals = []

  // CASO SPECIALE: Giorno di riposo - nessun pre/post workout
  if (workoutType === "rest" || !workoutTime) {
    // Colazione
    meals.push({
      time: "07:30",
      type: "colazione",
      name: "Colazione",
      kcalPct: 0.25,
      macroRatio: { cho: 0.5, pro: 0.25, fat: 0.25 },
    })
    // Spuntino
    meals.push({
      time: "10:30",
      type: "spuntino",
      name: "Spuntino",
      kcalPct: 0.1,
      macroRatio: { cho: 0.4, pro: 0.3, fat: 0.3 },
    })
    // Pranzo
    meals.push({
      time: "13:00",
      type: "pranzo",
      name: "Pranzo",
      kcalPct: 0.3,
      macroRatio: { cho: 0.4, pro: 0.3, fat: 0.3 },
    })
    // Merenda
    meals.push({
      time: "16:30",
      type: "merenda",
      name: "Merenda",
      kcalPct: 0.1,
      macroRatio: { cho: 0.35, pro: 0.35, fat: 0.3 },
    })
    // Cena
    meals.push({
      time: "20:00",
      type: "cena",
      name: "Cena",
      kcalPct: 0.2,
      macroRatio: { cho: 0.35, pro: 0.35, fat: 0.3 },
    })
    // Pre-sonno
    meals.push({
      time: "22:00",
      type: "pre_sonno",
      name: "Pre-Sonno",
      kcalPct: 0.05,
      macroRatio: { cho: 0.2, pro: 0.5, fat: 0.3 },
    })
    
    return { meals, profile }
  }

  // Parse workout time
  // Priority: 1) specific workout time (HH:MM), 2) athlete's preferred training slot, 3) default 10:00
  let workoutHour = 10 // default mid-morning
  
  if (workoutTime) {
    // Format: "HH:MM"
    const parts = workoutTime.split(":")
    workoutHour = Number.parseInt(parts[0]) || 10
  } else if (preferredTrainingTime) {
    // Format: "Pomeriggio (14-18)" - use parsePreferredTimeToHour
    workoutHour = parsePreferredTimeToHour(preferredTrainingTime)
  }

  workoutHour = Math.max(5, workoutHour)

  const isEarlyMorning = workoutHour < 8
  const isMorning = workoutHour >= 8 && workoutHour < 12
  const isAfternoon = workoutHour >= 12 && workoutHour < 17
  const isEvening = workoutHour >= 17

  if (isEarlyMorning) {
    meals.push({
      time: `${String(Math.max(5, workoutHour - 1)).padStart(2, "0")}:00`,
      type: "pre_workout",
      name: "Pre-Workout",
      kcalPct: 0.1,
      macroRatio: { cho: 0.85, pro: 0.1, fat: 0.05 },
      note: "Leggero e digeribile prima dell'allenamento mattutino",
    })
    const breakfastHour = Math.max(6, workoutHour + 2)
    meals.push({
      time: `${String(breakfastHour).padStart(2, "0")}:00`,
      type: "colazione",
      name: "Colazione (Post-Workout)",
      kcalPct: 0.25,
      macroRatio: { cho: 0.55, pro: 0.3, fat: 0.15 },
      note: profile.postWorkoutFocus + " - Pasto principale post allenamento",
    })
    // Spuntino metà mattina
    meals.push({
      time: "10:30",
      type: "spuntino",
      name: "Spuntino",
      kcalPct: 0.08,
      macroRatio: { cho: 0.5, pro: 0.25, fat: 0.25 },
    })
    // Pranzo
    meals.push({
      time: "12:30",
      type: "pranzo",
      name: "Pranzo",
      kcalPct: 0.22,
      macroRatio: profile.macroRatio,
    })
    // Merenda
    meals.push({
      time: "16:00",
      type: "merenda",
      name: "Merenda",
      kcalPct: 0.1,
      macroRatio: { cho: 0.45, pro: 0.25, fat: 0.3 },
    })
    // Cena
    meals.push({
      time: "19:30",
      type: "cena",
      name: "Cena",
      kcalPct: 0.2,
      macroRatio: { cho: 0.35, pro: 0.35, fat: 0.3 },
    })
    // Pre-sonno
    meals.push({
      time: "22:00",
      type: "pre_sonno",
      name: "Pre-Sonno",
      kcalPct: 0.05,
      macroRatio: { cho: 0.2, pro: 0.5, fat: 0.3 },
    })
  } else if (isMorning) {
    // Colazione pre-workout
    meals.push({
      time: `${String(Math.max(6, workoutHour - 2)).padStart(2, "0")}:00`,
      type: "colazione",
      name: "Colazione (Pre-Workout)",
      kcalPct: 0.25,
      macroRatio: { cho: 0.7, pro: 0.15, fat: 0.15 },
      note: profile.preWorkoutFocus,
    })
    // Post-workout
    meals.push({
      time: `${String(workoutHour + 2).padStart(2, "0")}:00`,
      type: "post_workout",
      name: "Post-Workout",
      kcalPct: 0.15,
      macroRatio: { cho: 0.6, pro: 0.3, fat: 0.1 },
      note: profile.postWorkoutFocus,
    })
    // Pranzo
    meals.push({
      time: "13:00",
      type: "pranzo",
      name: "Pranzo",
      kcalPct: 0.2,
      macroRatio: profile.macroRatio,
    })
    // Merenda
    meals.push({
      time: "16:30",
      type: "merenda",
      name: "Merenda",
      kcalPct: 0.1,
      macroRatio: { cho: 0.45, pro: 0.25, fat: 0.3 },
    })
    // Cena
    meals.push({
      time: "20:00",
      type: "cena",
      name: "Cena",
      kcalPct: 0.2,
      macroRatio: { cho: 0.4, pro: 0.35, fat: 0.25 },
    })
    // Pre-sonno
    meals.push({
      time: "22:30",
      type: "pre_sonno",
      name: "Pre-Sonno",
      kcalPct: 0.05,
      macroRatio: { cho: 0.2, pro: 0.5, fat: 0.3 },
    })
  } else if (isAfternoon) {
    // Colazione
    meals.push({
      time: "07:00",
      type: "colazione",
      name: "Colazione",
      kcalPct: 0.2,
      macroRatio: { cho: 0.6, pro: 0.2, fat: 0.2 },
    })
    // Spuntino
    meals.push({
      time: "10:00",
      type: "spuntino",
      name: "Spuntino",
      kcalPct: 0.08,
      macroRatio: { cho: 0.5, pro: 0.25, fat: 0.25 },
    })
    // Pranzo pre-workout
    meals.push({
      time: `${String(Math.max(11, workoutHour - 2)).padStart(2, "0")}:00`,
      type: "pranzo",
      name: "Pranzo (Pre-Workout)",
      kcalPct: 0.25,
      macroRatio: { cho: 0.65, pro: 0.2, fat: 0.15 },
      note: profile.preWorkoutFocus,
    })
    // Post-workout / Merenda
    meals.push({
      time: `${String(workoutHour + 2).padStart(2, "0")}:00`,
      type: "post_workout",
      name: "Post-Workout",
      kcalPct: 0.15,
      macroRatio: { cho: 0.6, pro: 0.3, fat: 0.1 },
      note: profile.postWorkoutFocus,
    })
    // Cena
    meals.push({
      time: "20:00",
      type: "cena",
      name: "Cena",
      kcalPct: 0.22,
      macroRatio: { cho: 0.4, pro: 0.35, fat: 0.25 },
    })
    // Pre-sonno
    meals.push({
      time: "22:30",
      type: "pre_sonno",
      name: "Pre-Sonno",
      kcalPct: 0.05,
      macroRatio: { cho: 0.2, pro: 0.5, fat: 0.3 },
    })
  } else {
    // Colazione
    meals.push({
      time: "07:00",
      type: "colazione",
      name: "Colazione",
      kcalPct: 0.2,
      macroRatio: { cho: 0.55, pro: 0.25, fat: 0.2 },
    })
    // Spuntino
    meals.push({
      time: "10:00",
      type: "spuntino",
      name: "Spuntino",
      kcalPct: 0.08,
      macroRatio: { cho: 0.5, pro: 0.25, fat: 0.25 },
    })
    // Pranzo
    meals.push({
      time: "13:00",
      type: "pranzo",
      name: "Pranzo",
      kcalPct: 0.25,
      macroRatio: profile.macroRatio,
    })
    // Merenda / Pre-workout
    meals.push({
      time: `${String(Math.max(15, workoutHour - 2)).padStart(2, "0")}:30`,
      type: "pre_workout",
      name: "Merenda (Pre-Workout)",
      kcalPct: 0.12,
      macroRatio: { cho: 0.7, pro: 0.15, fat: 0.15 },
      note: profile.preWorkoutFocus,
    })
    // Cena / Post-workout
    meals.push({
      time: `${String(Math.min(21, workoutHour + 1)).padStart(2, "0")}:00`,
      type: "cena",
      name: "Cena (Post-Workout)",
      kcalPct: 0.25,
      macroRatio: { cho: 0.5, pro: 0.35, fat: 0.15 },
      note: profile.postWorkoutFocus,
    })
    // Pre-sonno
    meals.push({
      time: "22:30",
      type: "pre_sonno",
      name: "Pre-Sonno",
      kcalPct: 0.05,
      macroRatio: { cho: 0.2, pro: 0.5, fat: 0.3 },
    })
  }

  return { meals, profile }
}

// LOCK: Expanded MEAL_DATABASE with more variety for weekly rotation
const MEAL_DATABASE: Record<
  string,
  {
    name: string
    cho: number
    fat: number
    pro: number
    kcal: number
    tags: string[]
    ingredients: { name: string; grams: number }[]
  }[]
> = {
  colazione: [
    // === COLAZIONI DOLCI SENZA LATTOSIO ===
    {
      name: "Porridge avena con banana e miele",
      cho: 62, fat: 10, pro: 10, kcal: 375,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Fiocchi avena", grams: 80 },
        { name: "Bevanda avena", grams: 200 },
        { name: "Banana", grams: 100 },
        { name: "Miele", grams: 15 },
      ],
    },
    {
      name: "Overnight oats frutti di bosco",
      cho: 58, fat: 12, pro: 14, kcal: 390,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Fiocchi avena", grams: 70 },
        { name: "Bevanda soia", grams: 180 },
        { name: "Semi di chia", grams: 15 },
        { name: "Frutti di bosco", grams: 80 },
        { name: "Miele", grams: 15 },
      ],
    },
    {
      name: "Smoothie bowl mango e cocco",
      cho: 55, fat: 14, pro: 12, kcal: 390,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Mango congelato", grams: 150 },
        { name: "Banana", grams: 80 },
        { name: "Bevanda cocco", grams: 150 },
        { name: "Granola", grams: 30 },
        { name: "Cocco rapè", grams: 10 },
      ],
    },
    {
      name: "Smoothie proteico banana e burro arachidi",
      cho: 50, fat: 16, pro: 22, kcal: 430,
      tags: ["vegetarian", "lactose-free", "high-protein"],
      ingredients: [
        { name: "Banana congelata", grams: 150 },
        { name: "Proteine vegetali", grams: 25 },
        { name: "Bevanda mandorla", grams: 200 },
        { name: "Burro arachidi", grams: 20 },
      ],
    },
    {
      name: "Pancakes avena con sciroppo acero",
      cho: 55, fat: 10, pro: 18, kcal: 380,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Farina avena", grams: 60 },
        { name: "Albume uovo", grams: 80 },
        { name: "Banana", grams: 60 },
        { name: "Sciroppo acero", grams: 25 },
      ],
    },
    {
      name: "Pancakes proteici con frutti di bosco",
      cho: 48, fat: 8, pro: 25, kcal: 365,
      tags: ["vegetarian", "lactose-free", "high-protein"],
      ingredients: [
        { name: "Farina avena", grams: 50 },
        { name: "Proteine whey", grams: 20 },
        { name: "Uovo intero", grams: 50 },
        { name: "Frutti di bosco", grams: 80 },
        { name: "Miele", grams: 15 },
      ],
    },
    {
      name: "Crema di riso con mandorle e cannella",
      cho: 65, fat: 14, pro: 8, kcal: 410,
      tags: ["vegetarian", "lactose-free", "gluten-free"],
      ingredients: [
        { name: "Crema di riso", grams: 80 },
        { name: "Bevanda mandorla", grams: 200 },
        { name: "Mandorle", grams: 20 },
        { name: "Miele", grams: 15 },
        { name: "Cannella", grams: 2 },
      ],
    },
    {
      name: "Chia pudding con mango",
      cho: 45, fat: 15, pro: 12, kcal: 355,
      tags: ["vegetarian", "lactose-free", "gluten-free"],
      ingredients: [
        { name: "Semi di chia", grams: 35 },
        { name: "Bevanda cocco", grams: 200 },
        { name: "Mango", grams: 100 },
        { name: "Miele", grams: 10 },
      ],
    },
    {
      name: "Muesli con frutta secca",
      cho: 60, fat: 12, pro: 10, kcal: 385,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Muesli integrale", grams: 70 },
        { name: "Bevanda avena", grams: 200 },
        { name: "Noci", grams: 15 },
        { name: "Uvetta", grams: 20 },
      ],
    },
    {
      name: "Fette biscottate con marmellata",
      cho: 52, fat: 4, pro: 6, kcal: 265,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Fette biscottate", grams: 50 },
        { name: "Marmellata", grams: 30 },
        { name: "Mela", grams: 100 },
        { name: "Spremuta arancia", grams: 150 },
      ],
    },
    {
      name: "Crostata integrale con marmellata",
      cho: 58, fat: 12, pro: 6, kcal: 360,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Crostata integrale", grams: 80 },
        { name: "Marmellata", grams: 20 },
        { name: "Spremuta arancia", grams: 200 },
      ],
    },
    {
      name: "Torta di mele fatta in casa",
      cho: 55, fat: 10, pro: 5, kcal: 330,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Torta di mele", grams: 100 },
        { name: "The verde", grams: 200 },
        { name: "Mandorle", grams: 10 },
      ],
    },
    // === COLAZIONI CON UOVA ===
    {
      name: "Uova strapazzate con pane tostato",
      cho: 30, fat: 18, pro: 22, kcal: 370,
      tags: ["vegetarian", "lactose-free", "high-protein"],
      ingredients: [
        { name: "Uova intere", grams: 120 },
        { name: "Pane integrale tostato", grams: 50 },
        { name: "Olio evo", grams: 10 },
        { name: "Pomodorini", grams: 50 },
      ],
    },
    {
      name: "Omelette verdure e pane",
      cho: 28, fat: 20, pro: 24, kcal: 390,
      tags: ["vegetarian", "lactose-free", "high-protein"],
      ingredients: [
        { name: "Uova intere", grams: 120 },
        { name: "Zucchine", grams: 50 },
        { name: "Peperoni", grams: 40 },
        { name: "Pane integrale", grams: 40 },
        { name: "Olio evo", grams: 10 },
      ],
    },
    {
      name: "Uova in camicia con avocado toast",
      cho: 32, fat: 24, pro: 18, kcal: 415,
      tags: ["vegetarian", "lactose-free", "high-protein"],
      ingredients: [
        { name: "Uova", grams: 100 },
        { name: "Pane integrale tostato", grams: 60 },
        { name: "Avocado", grams: 70 },
        { name: "Semi di sesamo", grams: 5 },
      ],
    },
    {
      name: "Frittata di albumi con spinaci",
      cho: 12, fat: 10, pro: 28, kcal: 250,
      tags: ["vegetarian", "lactose-free", "high-protein", "low-carb"],
      ingredients: [
        { name: "Albumi", grams: 150 },
        { name: "Spinaci", grams: 80 },
        { name: "Pane integrale", grams: 30 },
        { name: "Olio evo", grams: 10 },
      ],
    },
    // === COLAZIONI SALATE CON AFFETTATI ===
    {
      name: "Toast con prosciutto cotto e pomodoro",
      cho: 35, fat: 12, pro: 20, kcal: 330,
      tags: ["lactose-free", "high-protein"],
      ingredients: [
        { name: "Pane integrale tostato", grams: 60 },
        { name: "Prosciutto cotto", grams: 60 },
        { name: "Pomodoro", grams: 50 },
        { name: "Olio evo", grams: 5 },
      ],
    },
    {
      name: "Pane con prosciutto crudo e melone",
      cho: 40, fat: 8, pro: 18, kcal: 305,
      tags: ["lactose-free", "high-protein"],
      ingredients: [
        { name: "Pane integrale", grams: 50 },
        { name: "Prosciutto crudo", grams: 50 },
        { name: "Melone", grams: 150 },
      ],
    },
    {
      name: "Bresaola con rucola e pane",
      cho: 32, fat: 6, pro: 24, kcal: 280,
      tags: ["lactose-free", "high-protein", "low-fat"],
      ingredients: [
        { name: "Pane integrale", grams: 50 },
        { name: "Bresaola", grams: 60 },
        { name: "Rucola", grams: 30 },
        { name: "Olio evo", grams: 5 },
        { name: "Limone", grams: 10 },
      ],
    },
    {
      name: "Pane tostato con salmone e avocado",
      cho: 32, fat: 20, pro: 24, kcal: 400,
      tags: ["lactose-free", "high-protein", "omega3"],
      ingredients: [
        { name: "Pane integrale tostato", grams: 60 },
        { name: "Salmone affumicato", grams: 80 },
        { name: "Avocado", grams: 60 },
        { name: "Limone", grams: 10 },
      ],
    },
    {
      name: "Friselle con pomodoro e tonno",
      cho: 45, fat: 12, pro: 22, kcal: 375,
      tags: ["lactose-free", "high-protein"],
      ingredients: [
        { name: "Friselle integrali", grams: 60 },
        { name: "Tonno al naturale", grams: 80 },
        { name: "Pomodorini", grams: 100 },
        { name: "Olio evo", grams: 10 },
        { name: "Origano", grams: 2 },
      ],
    },
    // === COLAZIONI CON YOGURT SENZA LATTOSIO ===
    {
      name: "Yogurt senza lattosio con granola",
      cho: 48, fat: 10, pro: 15, kcal: 340,
      tags: ["vegetarian", "lactose-free", "high-carb"],
      ingredients: [
        { name: "Yogurt senza lattosio", grams: 200 },
        { name: "Granola", grams: 50 },
        { name: "Miele", grams: 15 },
        { name: "Fragole", grams: 50 },
      ],
    },
    {
      name: "Yogurt vegetale con frutta fresca",
      cho: 42, fat: 8, pro: 10, kcal: 280,
      tags: ["vegetarian", "vegan", "lactose-free"],
      ingredients: [
        { name: "Yogurt soia", grams: 200 },
        { name: "Banana", grams: 80 },
        { name: "Kiwi", grams: 60 },
        { name: "Miele", grams: 10 },
      ],
    },
    // === OPZIONI CON LATTICINI (per chi non ha intolleranze) ===
    {
      name: "Yogurt greco con muesli",
      cho: 45, fat: 12, pro: 20, kcal: 370,
      tags: ["vegetarian", "high-protein", "latticini"],
      ingredients: [
        { name: "Yogurt greco", grams: 200 },
        { name: "Muesli", grams: 50 },
        { name: "Frutti di bosco", grams: 100 },
        { name: "Miele", grams: 10 },
      ],
    },
    {
      name: "Cappuccino con cornetto integrale",
      cho: 55, fat: 18, pro: 12, kcal: 430,
      tags: ["vegetarian", "high-carb", "latticini"],
      ingredients: [
        { name: "Latte", grams: 200 },
        { name: "Caffè", grams: 30 },
        { name: "Cornetto integrale", grams: 70 },
      ],
    },
  ],
  pre_workout: [
    {
      name: "Banana con miele e riso soffiato",
      cho: 55,
      fat: 2,
      pro: 3,
      kcal: 250,
      tags: ["vegetarian", "gluten-free", "high-carb", "easy-digest"],
      ingredients: [
        { name: "Banana matura", grams: 120 },
        { name: "Miele", grams: 20 },
        { name: "Riso soffiato", grams: 30 },
      ],
    },
    {
      name: "Toast con marmellata",
      cho: 45,
      fat: 3,
      pro: 5,
      kcal: 220,
      tags: ["vegetarian", "high-carb", "easy-digest"],
      ingredients: [
        { name: "Pane bianco", grams: 50 },
        { name: "Marmellata", grams: 30 },
        { name: "Miele", grams: 10 },
      ],
    },
    {
      name: "Porridge leggero con miele",
      cho: 50,
      fat: 4,
      pro: 8,
      kcal: 270,
      tags: ["vegetarian", "high-carb", "easy-digest"],
      ingredients: [
        { name: "Fiocchi d'avena", grams: 50 },
        { name: "Acqua", grams: 200 },
        { name: "Miele", grams: 20 },
        { name: "Cannella", grams: 2 },
      ],
    },
    {
      name: "Succo di frutta con fette biscottate",
      cho: 48,
      fat: 2,
      pro: 4,
      kcal: 230,
      tags: ["vegetarian", "high-carb", "easy-digest"],
      ingredients: [
        { name: "Succo d'arancia", grams: 200 },
        { name: "Fette biscottate", grams: 40 },
        { name: "Miele", grams: 15 },
      ],
    },
  ],
  post_workout: [
    {
      name: "Recovery shake proteine e banana",
      cho: 45,
      fat: 5,
      pro: 30,
      kcal: 345,
      tags: ["vegetarian", "high-protein", "recovery"],
      ingredients: [
        { name: "Whey protein", grams: 30 },
        { name: "Banana", grams: 120 },
        { name: "Latte", grams: 250 },
        { name: "Miele", grams: 15 },
      ],
    },
    {
      name: "Yogurt greco con frutta e granola",
      cho: 50,
      fat: 8,
      pro: 25,
      kcal: 370,
      tags: ["vegetarian", "high-protein", "recovery"],
      ingredients: [
        { name: "Yogurt greco 0%", grams: 200 },
        { name: "Banana", grams: 80 },
        { name: "Granola", grams: 40 },
        { name: "Miele", grams: 15 },
      ],
    },
    {
      name: "Pane con ricotta e miele",
      cho: 40,
      fat: 10,
      pro: 20,
      kcal: 330,
      tags: ["vegetarian", "high-protein", "recovery"],
      ingredients: [
        { name: "Pane integrale", grams: 60 },
        { name: "Ricotta", grams: 100 },
        { name: "Miele", grams: 20 },
        { name: "Noci", grams: 15 },
      ],
    },
    {
      name: "Frullato recupero con avena",
      cho: 55,
      fat: 6,
      pro: 28,
      kcal: 385,
      tags: ["vegetarian", "high-protein", "recovery", "high-carb"],
      ingredients: [
        { name: "Whey protein", grams: 25 },
        { name: "Fiocchi d'avena", grams: 40 },
        { name: "Banana", grams: 100 },
        { name: "Latte", grams: 200 },
      ],
    },
  ],
  pranzo: [
    {
      name: "Pasta integrale con pollo e verdure",
      cho: 85,
      fat: 12,
      pro: 35,
      kcal: 588,
      tags: ["cereali", "carne"],
      ingredients: [
        { name: "Pasta integrale", grams: 100 },
        { name: "Petto di pollo", grams: 120 },
        { name: "Zucchine", grams: 100 },
        { name: "Pomodorini", grams: 80 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Riso con salmone e avocado",
      cho: 75,
      fat: 22,
      pro: 32,
      kcal: 622,
      tags: ["cereali", "pesce"],
      ingredients: [
        { name: "Riso basmati", grams: 90 },
        { name: "Salmone", grams: 120 },
        { name: "Avocado", grams: 70 },
        { name: "Cetriolo", grams: 50 },
        { name: "Salsa di soia", grams: 10 },
      ],
    },
    {
      name: "Quinoa bowl con tonno e verdure",
      cho: 65,
      fat: 15,
      pro: 38,
      kcal: 547,
      tags: ["cereali", "pesce"],
      ingredients: [
        { name: "Quinoa", grams: 80 },
        { name: "Tonno al naturale", grams: 120 },
        { name: "Pomodori", grams: 100 },
        { name: "Olive", grams: 20 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Insalata di farro con legumi",
      cho: 72,
      fat: 14,
      pro: 22,
      kcal: 498,
      tags: ["cereali", "legumi"],
      ingredients: [
        { name: "Farro", grams: 90 },
        { name: "Ceci", grams: 80 },
        { name: "Pomodorini", grams: 80 },
        { name: "Feta", grams: 40 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Petto di tacchino con patate dolci",
      cho: 55,
      fat: 10,
      pro: 42,
      kcal: 478,
      tags: ["carne"],
      ingredients: [
        { name: "Petto di tacchino", grams: 150 },
        { name: "Patate dolci", grams: 200 },
        { name: "Broccoli", grams: 100 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Pasta al pesto con gamberetti",
      cho: 80,
      fat: 18,
      pro: 30,
      kcal: 598,
      tags: ["cereali", "pesce", "fruttasecca"],
      ingredients: [
        { name: "Pasta", grams: 90 },
        { name: "Gamberetti", grams: 120 },
        { name: "Pesto", grams: 30 },
        { name: "Parmigiano", grams: 15 },
      ],
    },
    {
      name: "Buddha bowl con tofu",
      cho: 68,
      fat: 16,
      pro: 25,
      kcal: 508,
      tags: ["soia"],
      ingredients: [
        { name: "Riso integrale", grams: 80 },
        { name: "Tofu", grams: 120 },
        { name: "Edamame", grams: 50 },
        { name: "Carote", grams: 60 },
        { name: "Avocado", grams: 50 },
        { name: "Salsa tahini", grams: 15 },
      ],
    },
    {
      name: "Wrap di pollo con hummus",
      cho: 58,
      fat: 15,
      pro: 35,
      kcal: 503,
      tags: ["cereali", "carne", "legumi"],
      ingredients: [
        { name: "Tortilla integrale", grams: 80 },
        { name: "Petto di pollo", grams: 120 },
        { name: "Hummus", grams: 50 },
        { name: "Lattuga", grams: 40 },
        { name: "Pomodoro", grams: 50 },
      ],
    },
  ],
  cena: [
    {
      name: "Salmone al forno con verdure",
      cho: 25,
      fat: 20,
      pro: 38,
      kcal: 428,
      tags: ["pesce"],
      ingredients: [
        { name: "Salmone", grams: 150 },
        { name: "Asparagi", grams: 150 },
        { name: "Limone", grams: 30 },
        { name: "Olio EVO", grams: 15 },
      ],
    },
    {
      name: "Petto di pollo alla griglia con insalata",
      cho: 18,
      fat: 12,
      pro: 42,
      kcal: 348,
      tags: ["carne"],
      ingredients: [
        { name: "Petto di pollo", grams: 180 },
        { name: "Insalata mista", grams: 150 },
        { name: "Pomodorini", grams: 80 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Orata al cartoccio con patate",
      cho: 35,
      fat: 14,
      pro: 36,
      kcal: 410,
      tags: ["pesce"],
      ingredients: [
        { name: "Orata", grams: 200 },
        { name: "Patate", grams: 150 },
        { name: "Rosmarino", grams: 5 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Frittata di verdure con pane",
      cho: 30,
      fat: 18,
      pro: 22,
      kcal: 366,
      tags: ["uova"],
      ingredients: [
        { name: "Uova", grams: 150 },
        { name: "Spinaci", grams: 100 },
        { name: "Cipolla", grams: 50 },
        { name: "Pane integrale", grams: 50 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Zuppa di legumi con crostini",
      cho: 55,
      fat: 10,
      pro: 20,
      kcal: 390,
      tags: ["legumi", "cereali"],
      ingredients: [
        { name: "Mix legumi secchi", grams: 80 },
        { name: "Carote", grams: 50 },
        { name: "Sedano", grams: 30 },
        { name: "Crostini", grams: 40 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Tagliata di manzo con rucola",
      cho: 12,
      fat: 18,
      pro: 45,
      kcal: 390,
      tags: ["carne"],
      ingredients: [
        { name: "Controfiletto di manzo", grams: 180 },
        { name: "Rucola", grams: 80 },
        { name: "Grana", grams: 20 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
    {
      name: "Risotto ai funghi",
      cho: 65,
      fat: 14,
      pro: 12,
      kcal: 430,
      tags: ["cereali", "latticini"],
      ingredients: [
        { name: "Riso arborio", grams: 90 },
        { name: "Funghi porcini", grams: 100 },
        { name: "Parmigiano", grams: 25 },
        { name: "Burro", grams: 15 },
        { name: "Brodo vegetale", grams: 200 },
      ],
    },
    {
      name: "Merluzzo con purè di cavolfiore",
      cho: 22,
      fat: 12,
      pro: 35,
      kcal: 332,
      tags: ["pesce"],
      ingredients: [
        { name: "Merluzzo", grams: 180 },
        { name: "Cavolfiore", grams: 200 },
        { name: "Latte", grams: 50 },
        { name: "Olio EVO", grams: 10 },
      ],
    },
  ],
  spuntino: [
    {
      name: "Frutta fresca con mandorle",
      cho: 25,
      fat: 12,
      pro: 5,
      kcal: 224,
      tags: ["frutta", "fruttasecca"],
      ingredients: [
        { name: "Mela", grams: 150 },
        { name: "Mandorle", grams: 25 },
      ],
    },
    {
      name: "Yogurt con miele",
      cho: 22,
      fat: 5,
      pro: 10,
      kcal: 173,
      tags: ["latticini"],
      ingredients: [
        { name: "Yogurt bianco", grams: 150 },
        { name: "Miele", grams: 15 },
      ],
    },
    {
      name: "Barretta energetica",
      cho: 30,
      fat: 8,
      pro: 8,
      kcal: 220,
      tags: ["cereali"],
      ingredients: [{ name: "Barretta energetica", grams: 50 }],
    },
    {
      name: "Toast con marmellata",
      cho: 35,
      fat: 3,
      pro: 5,
      kcal: 187,
      tags: ["cereali"],
      ingredients: [
        { name: "Pane integrale", grams: 50 },
        { name: "Marmellata", grams: 25 },
      ],
    },
    {
      name: "Banana con burro di mandorle",
      cho: 28,
      fat: 10,
      pro: 4,
      kcal: 214,
      tags: ["frutta", "fruttasecca"],
      ingredients: [
        { name: "Banana", grams: 100 },
        { name: "Burro di mandorle", grams: 15 },
      ],
    },
    {
      name: "Mix frutta secca",
      cho: 18,
      fat: 15,
      pro: 6,
      kcal: 227,
      tags: ["fruttasecca"],
      ingredients: [
        { name: "Noci", grams: 15 },
        { name: "Mandorle", grams: 15 },
        { name: "Uvetta", grams: 15 },
      ],
    },
    {
      name: "Crackers con formaggio fresco",
      cho: 22,
      fat: 8,
      pro: 8,
      kcal: 192,
      tags: ["cereali", "latticini"],
      ingredients: [
        { name: "Crackers integrali", grams: 40 },
        { name: "Formaggio fresco", grams: 40 },
      ],
    },
    {
      name: "Frullato di frutta",
      cho: 32,
      fat: 2,
      pro: 4,
      kcal: 162,
      tags: ["frutta", "latticini"],
      ingredients: [
        { name: "Banana", grams: 80 },
        { name: "Fragole", grams: 80 },
        { name: "Latte", grams: 100 },
      ],
    },
  ],
  pre_sonno: [
    {
      name: "Ricotta con cannella",
      cho: 8,
      fat: 10,
      pro: 15,
      kcal: 182,
      tags: ["latticini"],
      ingredients: [
        { name: "Ricotta", grams: 120 },
        { name: "Cannella", grams: 2 },
        { name: "Miele", grams: 5 },
      ],
    },
    {
      name: "Yogurt greco con semi di chia",
      cho: 12,
      fat: 8,
      pro: 18,
      kcal: 188,
      tags: ["latticini"],
      ingredients: [
        { name: "Yogurt greco", grams: 150 },
        { name: "Semi di chia", grams: 10 },
      ],
    },
    {
      name: "Latte caldo con miele",
      cho: 18,
      fat: 5,
      pro: 8,
      kcal: 149,
      tags: ["latticini"],
      ingredients: [
        { name: "Latte intero", grams: 200 },
        { name: "Miele", grams: 10 },
      ],
    },
    // ALTERNATIVE SENZA LATTOSIO
    {
      name: "Latte di mandorla caldo con miele",
      cho: 16,
      fat: 4,
      pro: 2,
      kcal: 108,
      tags: ["senza-lattosio", "vegan"],
      ingredients: [
        { name: "Latte di mandorla", grams: 200 },
        { name: "Miele", grams: 10 },
      ],
    },
    {
      name: "Latte di soia caldo con cannella",
      cho: 12,
      fat: 4,
      pro: 8,
      kcal: 116,
      tags: ["senza-lattosio", "vegan", "high-protein"],
      ingredients: [
        { name: "Latte di soia", grams: 200 },
        { name: "Cannella", grams: 2 },
        { name: "Miele", grams: 8 },
      ],
    },
    {
      name: "Latte di avena caldo con cacao",
      cho: 22,
      fat: 3,
      pro: 3,
      kcal: 127,
      tags: ["senza-lattosio", "vegan"],
      ingredients: [
        { name: "Latte di avena", grams: 200 },
        { name: "Cacao amaro", grams: 5 },
        { name: "Miele", grams: 8 },
      ],
    },
    {
      name: "Banana con burro di arachidi",
      cho: 30,
      fat: 16,
      pro: 8,
      kcal: 292,
      tags: ["senza-lattosio", "vegan"],
      ingredients: [
        { name: "Banana", grams: 120 },
        { name: "Burro di arachidi", grams: 20 },
      ],
    },
    {
      name: "Tofu silken con miele e semi",
      cho: 10,
      fat: 6,
      pro: 12,
      kcal: 142,
      tags: ["senza-lattosio", "vegan", "high-protein"],
      ingredients: [
        { name: "Tofu silken", grams: 150 },
        { name: "Miele", grams: 10 },
        { name: "Semi di zucca", grams: 10 },
      ],
    },
    {
      name: "Tisana con biscotti di riso",
      cho: 25,
      fat: 2,
      pro: 2,
      kcal: 126,
      tags: ["senza-lattosio", "gluten-free"],
      ingredients: [
        { name: "Tisana camomilla", grams: 200 },
        { name: "Biscotti di riso", grams: 30 },
      ],
    },
    {
      name: "Mandorle e cioccolato fondente",
      cho: 15,
      fat: 18,
      pro: 6,
      kcal: 242,
      tags: ["fruttasecca"],
      ingredients: [
        { name: "Mandorle", grams: 25 },
        { name: "Cioccolato fondente 85%", grams: 20 },
      ],
    },
    {
      name: "Cottage cheese con frutti di bosco",
      cho: 14,
      fat: 5,
      pro: 16,
      kcal: 165,
      tags: ["latticini", "frutta"],
      ingredients: [
        { name: "Cottage cheese", grams: 150 },
        { name: "Frutti di bosco", grams: 60 },
      ],
    },
    {
      name: "Frutta secca mista",
      cho: 12,
      fat: 16,
      pro: 5,
      kcal: 212,
      tags: ["fruttasecca"],
      ingredients: [
        { name: "Noci", grams: 15 },
        { name: "Mandorle", grams: 15 },
        { name: "Nocciole", grams: 10 },
      ],
    },
    {
      name: "Budino proteico",
      cho: 16,
      fat: 4,
      pro: 20,
      kcal: 180,
      tags: ["latticini"],
      ingredients: [{ name: "Budino proteico", grams: 150 }],
    },
    {
      name: "Camomilla con biscotti secchi",
      cho: 22,
      fat: 4,
      pro: 3,
      kcal: 134,
      tags: ["cereali"],
      ingredients: [
        { name: "Camomilla", grams: 200 },
        { name: "Biscotti secchi", grams: 25 },
      ],
    },
  ],
}

// Tags to exclude based on dietary constraints
const CONSTRAINT_TAG_MAP: Record<string, string[]> = {
  // Intolerances
  Lattosio: ["latticini"],
  Glutine: ["cereali"],
  Fruttosio: ["frutta"],
  // Allergies
  "Latte e derivati": ["latticini"],
  Uova: ["uova"],
  Pesce: ["pesce"],
  Crostacei: ["crostacei"],
  "Frutta a guscio": ["frutta secca"],
  Arachidi: ["arachidi"],
  Soia: ["soia"],
  Sedano: ["sedano"],
  Senape: ["senape"],
  Sesamo: ["sesamo"],
  Molluschi: ["molluschi"],
  Lupini: ["lupini"],
  // Dietary preferences
  Vegetariano: ["carne", "pesce"],
  Vegano: ["carne", "pesce", "latticini", "uova"],
  Pescetariano: ["carne"],
}

function NutritionPlan({ athleteData, userName }: NutritionPlanProps) {
  // Initialize selectedDay to current day, adjusting for Sunday (0) to be the last day (6)
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [activeTab, setActiveTab] = useState("biomap")
  const [metabolicProfile, setMetabolicProfile] = useState<MetabolicProfile | null>(null)
  const [sportSupplements, setSportSupplements] = useState<SportSupplements>({ brands: [], types: [] })
  const [weeklyActivities, setWeeklyActivities] = useState<TrainingActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [athleteConstraints, setAthleteConstraints] = useState<AthleteConstraintsData | null>(null)
  const [trainingPreferences, setTrainingPreferences] = useState<TrainingPreferences | null>(null)
  const [aiSubstitutions, setAiSubstitutions] = useState<AISubstitution[]>([])
  const [aiAdaptiveEnabled, setAiAdaptiveEnabled] = useState(false)
  const [metabolicPhase, setMetabolicPhase] = useState<'maintenance' | 'anabolic' | 'catabolic'>('maintenance')
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Used to trigger data reload after AI changes
  const [aiAdaptations, setAiAdaptations] = useState<{
    nutrition?: {
      daily_kcal: number
      kcal_adjustment: number
      cho_percent: number
      pro_percent: number
      fat_percent: number
      notes: string[]
    }
    fueling?: {
      pre_workout_cho_g: number
      intra_workout_cho_g_per_hour: number
      post_workout_cho_g: number
      notes: string[]
    }
    training?: {
      tss_adjustment_percent: number
      max_zone: string
      recommended_zone: string
      notes: string[]
    }
    daily_state?: {
      fatigue_score: number
      glycogen_status: string
      recovery_need: string
      ai_notes: string
    }
  } | null>(null)

  const [weeklyFoodUsage, setWeeklyFoodUsage] = useState<WeeklyFoodUsage>({})

  const athleteId = athleteData?.id
  const weight = athleteData?.weight || 70
  const height = athleteData?.height || 175

  // Load metabolic profile and supplements preferences
  useEffect(() => {
    const loadData = async () => {
      if (!athleteId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const supabase = createClient() // Changed getClient() to createClient()
      if (!supabase) {
        setIsLoading(false)
        return
      }

      try {
        let profileData = null

        // First try to get current profile
        const { data: currentProfile, error: currentError } = await supabase
          .from("metabolic_profiles")
          .select("ftp_watts, empathy_zones, hr_zones")
          .eq("athlete_id", athleteId)
          .eq("is_current", true)
          .single()

        if (currentError) {
          console.log("[v0] Error loading current metabolic profile:", currentError.message, currentError.code)
        }

        if (currentProfile) {
          profileData = currentProfile
          console.log("[v0] Loaded CURRENT metabolic profile, FTP:", currentProfile.ftp_watts)
        } else {
          // Fallback: get most recent profile
          const { data: recentProfile, error: recentError } = await supabase
            .from("metabolic_profiles")
            .select("ftp_watts, empathy_zones, hr_zones")
            .eq("athlete_id", athleteId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          if (recentError) {
            console.log("[v0] Error loading recent metabolic profile:", recentError.message, recentError.code)
          }

          if (recentProfile) {
            profileData = recentProfile
            console.log("[v0] Loaded RECENT metabolic profile, FTP:", recentProfile.ftp_watts)
          }
        }

        if (profileData) {
          setMetabolicProfile(profileData)
          console.log("[v0] Metabolic profile loaded:", {
            ftp_watts: profileData.ftp_watts,
            has_empathy_zones: !!profileData.empathy_zones,
            empathy_zones_keys: profileData.empathy_zones ? Object.keys(profileData.empathy_zones) : [],
            has_hr_zones: !!profileData.hr_zones,
          })

          // Log empathy_zones details if present
          if (profileData.empathy_zones) {
            const z2 = profileData.empathy_zones["z2"] || profileData.empathy_zones["Z2"]
            if (z2) {
              console.log("[v0] Z2 from empathy_zones:", z2.consumption)
            }
          }
        } else {
          console.log("[v0] No metabolic profile found for athlete:", athleteId)
        }

        const { data: constraintsData, error: constraintsError } = await supabase
          .from("athlete_constraints")
          .select("intolerances, allergies, dietary_preferences, dietary_limits, notes")
          .eq("athlete_id", athleteId)
          .single()

        if (constraintsData) {
          // Set dietary constraints
          setAthleteConstraints({
            intolerances: constraintsData.intolerances || [],
            allergies: constraintsData.allergies || [],
            dietary_preferences: constraintsData.dietary_preferences || [],
            dietary_limits: constraintsData.dietary_limits || [],
            notes: "",
            foods_to_avoid: [],
            foods_to_include: [],
          })
  
  // Build AI substitutions based on intolerances and allergies
  const substitutions: AISubstitution[] = []
  const allIssues = [
    ...(constraintsData.intolerances || []),
    ...(constraintsData.allergies || [])
  ].map(i => i.toLowerCase())
  
  // Add substitutions based on detected issues
  for (const [ingredient, sub] of Object.entries(INGREDIENT_SUBSTITUTIONS)) {
    const reasonLower = sub.reason.toLowerCase()
    // Check if any intolerance/allergy matches the substitution reason
    if (allIssues.some(issue => 
      reasonLower.includes(issue) || 
      issue.includes('lattosio') && reasonLower.includes('lattosio') ||
      issue.includes('glutine') && reasonLower.includes('glutine') ||
      issue.includes('uova') && reasonLower.includes('uova') ||
      issue.includes('frutta secca') && reasonLower.includes('frutta secca') ||
      issue.includes('nichel') && reasonLower.includes('nichel')
    )) {
      substitutions.push({
        original: ingredient,
        substitute: sub.substitute,
        reason: sub.reason
      })
    }
  }
  
          setAiSubstitutions(substitutions)

  }
  // Sport supplements are now loaded from config_json above

        // First try annual_training_plans
        const { data: annualPlan } = await supabase
          .from("annual_training_plans")
          .select("config_json")
          .eq("athlete_id", athleteId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

if (annualPlan?.config_json?.training_preferences) {
  const prefs = annualPlan.config_json.training_preferences
  setTrainingPreferences({
  preferred_training_time: prefs.preferred_training_time || "",
  preferred_rest_days: prefs.preferred_rest_days || [],
  coach_notes: prefs.coach_notes || "",
  })
  }
  
  // Load sport supplements from config_json (saved in settings)
  if (annualPlan?.config_json?.sport_supplements) {
    const supps = annualPlan.config_json.sport_supplements
    setSportSupplements({
      brands: supps.brands || [],
      types: supps.types || [],
    })
    console.log("[v0] Loaded sport supplements from annual_plan:", supps)
  } else if (constraintsData?.notes) {
    // Fallback: load from athlete_constraints.notes
    try {
      const parsedNotes = JSON.parse(constraintsData.notes)
      if (parsedNotes.sport_supplements) {
        setSportSupplements({
          brands: parsedNotes.sport_supplements.brands || [],
          types: parsedNotes.sport_supplements.types || [],
        })
        console.log("[v0] Loaded sport supplements from athlete_constraints.notes:", parsedNotes.sport_supplements)
      }
    } catch (e) {
      console.log("[v0] Error parsing sport supplements from notes:", e)
    }
  }
  
  // Load AI adaptations from config_json
  if (annualPlan?.config_json?.current_adaptations) {
    const adaptations = annualPlan.config_json.current_adaptations
    setAiAdaptations({
      nutrition: adaptations.nutrition,
      fueling: adaptations.fueling,
      training: adaptations.training,
      daily_state: annualPlan.config_json.daily_states?.[new Date().toISOString().split('T')[0]]
    })
  }
  
  if (!annualPlan?.config_json?.training_preferences) {
          // </CHANGE>
          // Fallback: try athlete_constraints.notes
          const { data: constraintsForPrefs } = await supabase
            .from("athlete_constraints")
            .select("notes")
            .eq("athlete_id", athleteId)
            .single()

          if (constraintsForPrefs?.notes) {
            try {
              const parsedNotes = JSON.parse(constraintsForPrefs.notes)
              if (parsedNotes.training_preferences) {
                const prefs = parsedNotes.training_preferences
                setTrainingPreferences({
                  preferred_training_time: prefs.preferred_training_time || "",
                  preferred_rest_days: prefs.preferred_rest_days || [],
                  coach_notes: prefs.coach_notes || "",
                })
                console.log("[v0] Loaded training preferences from athlete_constraints:", prefs)
            }
          } catch (e) {
            // Error parsing training preferences from notes
          }
        }
        // </CHANGE>
        }

        // Load activities for current week
        const today = new Date()
        const dayOfWeek = today.getDay()
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        const monday = new Date(today)
        monday.setDate(today.getDate() + mondayOffset)
        monday.setHours(0, 0, 0, 0)

        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        sunday.setHours(23, 59, 59, 999)

        const mondayStr = monday.toISOString().split("T")[0]
        const sundayStr = sunday.toISOString().split("T")[0]

        // Load activities for current week
        const { data: activitiesData } = await supabase
          .from("training_activities")
          .select("*")
          .eq("athlete_id", athleteId)
          .gte("activity_date", mondayStr)
          .lte("activity_date", sundayStr)
          .order("activity_date", { ascending: true })

        if (activitiesData && activitiesData.length > 0) {
          // Convert activity_date to day_of_week (0 = Monday)
          const converted = activitiesData.map((w: any) => {
            const activityDate = new Date(w.activity_date)
            let dow = activityDate.getDay() - 1
            if (dow < 0) dow = 6 // Sunday becomes 6

            return {
              id: w.id,
              day_of_week: dow,
              sport_type: w.activity_type || w.sport_type || "cycling",
              duration: w.duration_minutes || w.duration || 60,
              zone: Number.parseInt(w.target_zone?.replace(/[^0-9]/g, "") || "2") || 2,
              workout_name: w.title,
              target_power_min: w.target_power_min,
              target_power_max: w.target_power_max,
              activity_date: w.activity_date,
              title: w.title,
              tss: w.tss,
              primary_zone: w.primary_zone, // Keep original field for getWorkoutType
              target_zone: w.target_zone, // Keep original field for getWorkoutType
              scheduled_time: w.scheduled_time, // Use scheduled_time if available
            }
          })
          setWeeklyActivities(converted)
          console.log("[v0] Loaded and converted activities:", converted.length, "activities")
        } else {
          // Fallback: try legacy table
          const { data: legacyData } = await supabase
            .from("training_activities")
            .select("*")
            .eq("athlete_id", athleteId)
            .order("day_of_week", { ascending: true })

          if (legacyData && legacyData.length > 0) {
            const converted = legacyData.map((w: any) => ({
              id: w.id,
              day_of_week: w.day_of_week ?? 0,
              sport_type: w.activity_type || w.sport_type || "cycling",
              duration: w.duration_minutes || w.duration || 60,
              zone: Number.parseInt(w.target_zone?.replace(/[^0-9]/g, "") || "2") || 2,
              workout_name: w.title,
              target_power_min: w.target_power_min,
              target_power_max: w.target_power_max,
              title: w.title,
              tss: w.tss,
              primary_zone: w.primary_zone,
              target_zone: w.target_zone,
              scheduled_time: w.scheduled_time, // Use scheduled_time if available
            }))
            setWeeklyActivities(converted)
            console.log("[v0] Loaded legacy activities:", converted.length, "activities")
          }
        }
      } catch (error) {
        console.error("[v0] Error loading nutrition data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [athleteId, refreshTrigger]) // refreshTrigger forces reload after AI changes

  // Get zone consumption from metabolic profile or calculate it
  const getZoneConsumption = (zoneNumber: number): ZoneConsumption => {
    const zoneKeyLower = `z${zoneNumber}`
    const zoneKeyUpper = `Z${zoneNumber}`

    // 1. Try to get from empathy_zones (personalized data from metabolic-profile-generator)
    if (metabolicProfile?.empathy_zones) {
      const zone = metabolicProfile.empathy_zones[zoneKeyLower] || metabolicProfile.empathy_zones[zoneKeyUpper]
      if (zone?.consumption) {
        console.log(`[v0] Using empathy_zones consumption for ${zoneKeyLower}:`, zone.consumption)
        return zone.consumption
      }
    }

    // 2. Try to get from hr_zones
    if (metabolicProfile?.hr_zones) {
      const zone = metabolicProfile.hr_zones[zoneKeyLower] || metabolicProfile.hr_zones[zoneKeyUpper]
      if (zone?.consumption) {
        console.log(`[v0] Using hr_zones consumption for ${zoneKeyLower}:`, zone.consumption)
        return zone.consumption
      }
    }

    // 3. Calculate dynamically using FTP and GE (same formula as metabolic-profile-generator)
    const ftp = metabolicProfile?.ftp_watts || 250
    const ge = metabolicProfile?.ge || DEFAULT_GE
    const zoneDef = ZONE_DEFINITIONS[zoneNumber - 1]

    if (zoneDef) {
      const min = Math.round(ftp * zoneDef.cpMin)
      const max = Math.round(ftp * zoneDef.cpMax)
      const midPower = (min + max) / 2

      // kcal/h = W / GE × 0.86 (same formula as metabolic-profile-generator)
      const kcalH = (midPower / ge) * 0.86

      // Get substrates for this zone
      const substrates = ZONE_SUBSTRATES[zoneKeyLower] || { cho: 0.6, fat: 0.4, pro: 0 }

      // CHO g/h = (kcal × %CHO) / 4 (same formula as metabolic-profile-generator)
      // FAT g/h = (kcal × %FAT) / 9 (same formula as metabolic-profile-generator)
      // PRO g/h = (kcal × %PRO) / 4 (same formula as metabolic-profile-generator)
      const consumption = {
        kcalH: Math.round(kcalH),
        choGH: Math.round((kcalH * substrates.cho) / 4),
        fatGH: Math.round((kcalH * substrates.fat) / 9),
        proGH: Math.round((kcalH * substrates.pro) / 4),
      }

      console.log(
        `[v0] Calculated consumption for ${zoneKeyLower} (FTP=${ftp}, GE=${ge}, midPower=${midPower}):`,
        consumption,
      )
      return consumption
    }

    // 4. Fallback to default values
    console.log(`[v0] Using fallback consumption for ${zoneKeyLower}`)
    return { kcalH: 700, choGH: 100, fatGH: 30, proGH: 0 }
  }

  // Get activity for selected day
  const selectedActivity = useMemo(() => {
    return weeklyActivities.find((a) => a.day_of_week === selectedDay)
  }, [weeklyActivities, selectedDay])

  // Calculate workout metrics
  const workoutMetrics = useMemo(() => {
    if (!selectedActivity) {
      return { kcal: 0, choBurned: 0, fatBurned: 0, duration: 0, zone: 1, zoneName: "Rest" }
    }

    const zone = selectedActivity.zone || 2
    const duration = selectedActivity.duration || 60
    const durationHours = duration / 60

    // Get consumption for this zone from metabolic profile
    const consumption = getZoneConsumption(zone)

    // Calculate totals
    const kcal = Math.round(consumption.kcalH * durationHours)
    const choBurned = Math.round(consumption.choGH * durationHours)
    const fatBurned = Math.round(consumption.fatGH * durationHours)

    const zoneName = ZONE_SUBSTRATES[`z${zone}`]?.name || "Endurance"

    console.log(`[v0] Workout metrics for Z${zone} ${duration}min:`, {
      consumption,
      durationHours,
      kcal,
      choBurned,
      fatBurned,
    })

    return { kcal, choBurned, fatBurned, duration, zone, zoneName }
  }, [selectedActivity, metabolicProfile])

  // Calculate BMR using Katch-McArdle
  const bmr = useMemo(() => {
    const lbm = weight * (1 - 0.15) // Assume 15% body fat
    return Math.round(370 + 21.6 * lbm)
  }, [weight])

  // Calculate daily calories - apply AI adaptations and metabolic phase
  const dailyKcal = useMemo(() => {
    // Base: BMR + 15% TEF (this is for REST days - no workout)
    const restDayKcal = Math.round(bmr * 1.15)
    
    // For workout days: BMR + TEF + 40% workout kcal (60% comes from fueling)
    const workoutDayKcal = Math.round(bmr * 1.15 + workoutMetrics.kcal * 0.4)
    
    // Base calculation
    let baseKcal = selectedActivity ? workoutDayKcal : restDayKcal
    
    // Apply metabolic phase adjustment
    // Anabolic: +10-15% surplus for muscle building
    // Catabolic: -15-20% deficit for fat loss
    // Maintenance: no change
    if (metabolicPhase === 'anabolic') {
      baseKcal = Math.round(baseKcal * 1.12) // +12% surplus
    } else if (metabolicPhase === 'catabolic') {
      baseKcal = Math.round(baseKcal * 0.85) // -15% deficit
    }
    
    // If AI adaptive is enabled, use AI's calculated daily_kcal (already includes adjustments)
    if (aiAdaptiveEnabled && aiAdaptations?.nutrition?.daily_kcal) {
      // Apply phase adjustment to AI calculation too
      let aiKcal = aiAdaptations.nutrition.daily_kcal
      if (metabolicPhase === 'anabolic') {
        aiKcal = Math.round(aiKcal * 1.12)
      } else if (metabolicPhase === 'catabolic') {
        aiKcal = Math.round(aiKcal * 0.85)
      }
      return aiKcal
    }
    
    return baseKcal
  }, [bmr, workoutMetrics.kcal, aiAdaptations, aiAdaptiveEnabled, selectedActivity, metabolicPhase])

  // Calculate intra-workout CHO - EMPATHY LOGIC based on zone and duration
  const intraWorkCho = useMemo(() => {
    const zone = workoutMetrics.zone
    const duration = workoutMetrics.duration
    const durationHours = duration / 60
    
    // EMPATHY CHO/h rules based on intensity zone
    let choPerHour = 0
    
    if (duration < 60) {
      // Under 60 min: water is sufficient
      choPerHour = 0
    } else if (zone <= 2) {
      // Z1-Z2 (Recovery/Endurance): 30g/h - fat oxidation prioritized
      choPerHour = 30
    } else if (zone <= 3) {
      // Z3 (Tempo): 45g/h - mixed fuel
      choPerHour = 45
    } else if (zone <= 4) {
      // Z4 (Threshold): 60g/h - glycolytic demand increasing
      choPerHour = 60
    } else if (zone === 5) {
      // Z5 (VO2max): 75-90g/h - high glycolytic demand
      choPerHour = 75
    } else {
      // Z6+ (Anaerobic): 90g/h max absorption
      choPerHour = 90
    }
    
    // Adjust for duration - longer sessions need more
    if (duration > 180) {
      choPerHour = Math.min(choPerHour * 1.2, 120) // Max 120g/h with trained gut
    }
    
    const totalCho = Math.round(choPerHour * durationHours)
    return totalCho
  }, [workoutMetrics.zone, workoutMetrics.duration])

  // Determine fueling class based on zone and duration
  const fuelingClass = useMemo(() => {
    if (workoutMetrics.zone <= 2 && workoutMetrics.duration < 90) return "LOW"
    if (workoutMetrics.zone >= 4 || workoutMetrics.duration > 180) return "HIGH"
    return "MEDIUM"
  }, [workoutMetrics])

  const preWorkoutStack = useMemo(() => {
    const stack: { name: string; dose: string; note: string; timing: string }[] = []
    const preferredBrands = sportSupplements.brands.length > 0 ? sportSupplements.brands : ["Enervit"]
    const preferredTypes = sportSupplements.types
    const zone = workoutMetrics.zone
    const duration = workoutMetrics.duration

    // Creatina per allenamenti di forza (Z5-Z6) o intervalli
    if (zone >= 5 || selectedActivity?.title?.toLowerCase().includes("forza")) {
      stack.push({
        name: "Creatina Monoidrato",
        dose: "5g",
        note: "Migliora potenza e recupero tra le serie",
        timing: "30 min prima",
      })
    }

    // Beta-alanina per VO2max e intervalli intensi (Z4-Z5)
    if (
      zone >= 4 ||
      selectedActivity?.title?.toLowerCase().includes("vo2") ||
      selectedActivity?.title?.toLowerCase().includes("interval")
    ) {
      stack.push({
        name: "Beta-Alanina",
        dose: "3-4g",
        note: "Buffer acido lattico per sforzi >60s",
        timing: "30-45 min prima",
      })
    }

    // Caffeina per allenamenti intensi o lunghi
    if ((zone >= 4 || duration > 120) && preferredTypes.includes("caffeina")) {
      for (const brand of preferredBrands) {
        const brandProducts = BRAND_PRODUCTS[brand]
        if (brandProducts?.caffeina) {
          stack.push({
            name: brandProducts.caffeina[0].name,
            dose: "100-200mg (1-3mg/kg)",
            note: brandProducts.caffeina[0].note,
            timing: "45-60 min prima",
          })
          break
        }
      }
    }

    // Carboidrati pre se allenamento lungo
    if (duration > 90 && fuelingClass !== "LOW") {
      stack.push({
        name: "Carboidrati complessi",
        dose: "1-2g/kg",
        note: "Pasto 2-3h prima o snack 1h prima",
        timing: "2-3h prima",
      })
    }

    // Elettroliti pre se sudorazione prevista alta
    if (duration > 60) {
      stack.push({
        name: "Pre-idratazione",
        dose: "500ml acqua + elettroliti",
        note: "Inizia idratato",
        timing: "2h prima",
      })
    }

    return stack
  }, [workoutMetrics, selectedActivity, sportSupplements, fuelingClass])

  const intraWorkoutTiming = useMemo(() => {
    if (!selectedActivity || workoutMetrics.duration < 30) return []

    const duration = workoutMetrics.duration
    const totalCho = intraWorkCho
    const intervals: { time: number; product: string; cho: number; brand: string; details: string }[] = []

    // Determine workout start time for accurate timing
    const workoutStartTime = selectedActivity?.scheduled_time
      ? parsePreferredTimeToHour(selectedActivity.scheduled_time)
      : trainingPreferences?.preferred_training_time
        ? parsePreferredTimeToHour(trainingPreferences.preferred_training_time)
        : 10 // Default to mid-morning only if no preferences set

    // Start fueling after 20 minutes for workouts > 60min, or 30min for shorter
    const fuelingStartTime = duration > 60 ? 20 : 30
    const intervalMinutes = 20

    // Calculate CHO per interval
    const numIntervals = Math.floor((duration - fuelingStartTime) / intervalMinutes) + 1
    const choPerInterval = Math.round(totalCho / Math.max(numIntervals, 1))

  // Get athlete's preferred products for rotation
  const preferredBrands = sportSupplements.brands.length > 0 ? sportSupplements.brands : ["Enervit"]
  const preferredTypes =
  sportSupplements.types.length > 0 ? sportSupplements.types : ["gel", "barrette", "maltodestrine"]
  
  // Build product pool from REAL SUPPLEMENTS DATABASE
  const productPool: { name: string; cho: number; brand: string; type: string }[] = []
  
  // Get athlete constraints for filtering
  const isLactoseIntolerant = athleteConstraints?.intolerances?.some(i => i.toLowerCase().includes('lattosio')) || false
  const isGlutenIntolerant = athleteConstraints?.intolerances?.some(i => i.toLowerCase().includes('glutine')) || athleteConstraints?.allergies?.some(a => a.toLowerCase().includes('glutine')) || false
  const isVegan = athleteConstraints?.dietary_preferences?.some(p => p.toLowerCase().includes('vegan')) || false
  
  // Get compatible products from real database
  const compatibleProducts = getCompatibleProducts(
    SUPPLEMENTS_DATABASE.filter(p => p.type === 'intra_workout'),
    {
      is_lactose_intolerant: isLactoseIntolerant,
      is_gluten_intolerant: isGlutenIntolerant,
      is_vegan: isVegan
    }
  )
  
  // Filter by preferred brands (case-insensitive matching)
  const brandProducts = compatibleProducts.filter(p => 
    preferredBrands.some(b => 
      b.toLowerCase() === p.brand.toLowerCase() ||
      b.toLowerCase().includes(p.brand.toLowerCase()) ||
      p.brand.toLowerCase().includes(b.toLowerCase())
    )
  )
  
  // Add products from real database to pool
  for (const product of brandProducts) {
    // Match product category to preferred types
    const categoryMatch = preferredTypes.some(type => {
      const typeLower = type.toLowerCase()
      const categoryLower = product.category.toLowerCase()
      const tagsLower = product.tags.map(t => t.toLowerCase())
      return categoryLower.includes(typeLower) || 
             tagsLower.some(tag => tag.includes(typeLower)) ||
             (typeLower === 'gel' && categoryLower === 'gel') ||
             (typeLower === 'maltodestrine' && tagsLower.includes('maltodestrine')) ||
             (typeLower === 'carbo in polvere' && categoryLower === 'polvere') ||
             (typeLower === 'barrette energetiche' && categoryLower === 'barretta') ||
             (typeLower === 'elettroliti' && product.features.has_electrolytes)
    })
    
    if (categoryMatch || preferredTypes.length === 0) {
      productPool.push({
        name: product.name,
        cho: product.nutrition.cho_g,
        brand: product.brand.charAt(0).toUpperCase() + product.brand.slice(1),
        type: product.category
      })
    }
  }
  
  // Fallback to old static mapping if no products found
  if (productPool.length === 0) {
  for (const brand of preferredBrands) {
      const brandProducts = BRAND_PRODUCTS[brand]
      if (!brandProducts) continue

      // Add gels
      if (preferredTypes.includes("gel") && brandProducts.gel) {
        for (const gel of brandProducts.gel) {
          productPool.push({ name: gel.name, cho: 25, brand, type: "gel" })
        }
      }

      // Add bars
      if (preferredTypes.includes("barrette") && brandProducts.barrette) {
        for (const bar of brandProducts.barrette) {
          productPool.push({ name: bar.name, cho: 30, brand, type: "barretta" })
        }
      }

      // Add maltodestrin
      if (preferredTypes.includes("maltodestrine") && brandProducts.maltodestrine) {
        productPool.push({ name: brandProducts.maltodestrine[0].name, cho: 30, brand, type: "maltodestrina" })
      }

    // Add carbo powder
  if (preferredTypes.includes("carbo-polvere") && brandProducts["carbo-polvere"]) {
  productPool.push({ name: brandProducts["carbo-polvere"][0].name, cho: 30, brand, type: "drink" })
  }
  }
  } // Close the first fallback if (productPool.length === 0)
  
  // Ultimate fallback if still no products found
  if (productPool.length === 0) {
      productPool.push(
        { name: "Gel energetico", cho: 25, brand: "Generico", type: "gel" },
        { name: "Barretta energetica", cho: 30, brand: "Generico", type: "barretta" },
        { name: "Maltodestrina", cho: 30, brand: "Generico", type: "drink" },
      )
    }

    // Generate intervals with product rotation
    let productIndex = 0
    let accumulatedCho = 0

    for (let time = fuelingStartTime; time <= duration; time += intervalMinutes) {
      const product = productPool[productIndex % productPool.length]
      const choForThisInterval = Math.min(choPerInterval, product.cho)
      accumulatedCho += choForThisInterval

      // Determine specific details based on product type and CHO needed
      let details = ""
      if (product.type === "gel") {
        const gelsNeeded = Math.ceil(choForThisInterval / 25)
        details = gelsNeeded === 1 ? "1 gel" : `${gelsNeeded} gel`
      } else if (product.type === "barretta") {
        details = choForThisInterval > 30 ? "1 barretta intera" : "1/2 barretta"
      } else if (product.type === "maltodestrina" || product.type === "drink") {
        details = `${choForThisInterval}g in 200ml acqua`
      }

      intervals.push({
        time,
        product: product.name,
        cho: choForThisInterval,
        brand: product.brand,
        details,
      })

      productIndex++
    }

    return intervals
  }, [selectedActivity, workoutMetrics.duration, intraWorkCho, sportSupplements, trainingPreferences, athleteConstraints])

  // Placeholder for intraWorkoutStack, as intraWorkoutTiming now shows the details
  const intraWorkoutStack = useMemo(() => {
    // This could be a summary of the types of products suggested in intraWorkoutTiming
    // or a separate list if specific products are prioritized.
    // For now, returning an empty array as intraWorkoutTiming is more detailed.
    return []
  }, [])

  const postWorkoutStack = useMemo(() => {
    const stack: { name: string; dose: string; note: string; timing: string }[] = []
    const preferredBrands = sportSupplements.brands.length > 0 ? sportSupplements.brands : ["Enervit"]
    const preferredTypes = sportSupplements.types
    const zone = workoutMetrics.zone
    const duration = workoutMetrics.duration
    const choBurned = workoutMetrics.choBurned

    // Recovery drink per allenamenti lunghi o intensi
    if ((duration > 90 || zone >= 4) && preferredTypes.includes("recovery")) {
      for (const brand of preferredBrands) {
        const brandProducts = BRAND_PRODUCTS[brand]
        if (brandProducts?.recovery) {
          const proteinDose = Math.round(weight * 0.3) // 0.3g/kg
          stack.push({
            name: brandProducts.recovery[0].name,
            dose: "30-40g",
            note: "Rapporto 3:1 o 4:1 CHO:PRO per recupero ottimale",
            timing: "Entro 30 min",
          })
          break
        }
      }
    }

    // Whey protein per tutti gli allenamenti
    if (preferredTypes.includes("whey")) {
      for (const brand of preferredBrands) {
        const brandProducts = BRAND_PRODUCTS[brand]
        if (brandProducts?.whey) {
          const proteinDose = Math.round(weight * 0.3) // 0.3g/kg
          stack.push({
            name: brandProducts.whey[0].name,
            dose: `${proteinDose}-${proteinDose + 10}g`,
            note: "Sintesi proteica muscolare",
            timing: "Entro 1-2h",
          })
          break
        }
      }
    } else {
      // Fallback protein recommendation
      stack.push({
        name: "Proteine (cibo o shake)",
        dose: `${Math.round(weight * 0.3)}-${Math.round(weight * 0.4)}g`,
        note: "Uova, yogurt greco, pollo, o shake proteico",
        timing: "Entro 1-2h",
      })
    }

// Carboidrati post per ripristino glicogeno - EMPATHY: basato su peso, non CHO bruciati
  if (choBurned > 50) {
  // 0.8-1.2g/kg in base alla zona: Z5+ = 1.2, Z4 = 1.0, Z3 = 0.8, Z2 = 0.5
  const choPerKg = zone >= 5 ? 1.2 : zone >= 4 ? 1.0 : zone >= 3 ? 0.8 : 0.5
  const choToRestore = Math.round(weight * choPerKg)
  stack.push({
  name: "Carboidrati",
  dose: `${choToRestore}g`,
  note: `${choPerKg}g/kg - Riso, pasta, patate, frutta`,
  timing: "Entro 2h",
      })
    }

    // Creatina post se forza
    if (zone >= 5 || selectedActivity?.title?.toLowerCase().includes("forza")) {
      stack.push({
        name: "Creatina Monoidrato",
        dose: "3-5g",
        note: "Assorbimento migliore con carboidrati post-workout",
        timing: "Con pasto post",
      })
    }

    // Elettroliti post se allenamento lungo
    if (duration > 60) {
      stack.push({
        name: "Reidratazione",
        dose: "150% peso perso in liquidi",
        note: "Acqua + elettroliti (500-700mg Na/L)",
        timing: "Nelle 2-4h successive",
      })
    }

    return stack
  }, [workoutMetrics, weight, sportSupplements, selectedActivity])

  // Generate the weekly meal plan
  const weeklyMealPlan = useMemo(() => {
    const MAX_WEEKLY_REPETITIONS = 2 // Max times a food can repeat in a week
    const weekPlan: Record<number, typeof mealPlan> = {}
    const usedFoods: WeeklyFoodUsage = {}

  // FILTRO ATTIVO: Filtra pasti in base a intolleranze e allergie
  const filterMeals = (meals: typeof MEAL_DATABASE.colazione) => {
    if (!athleteConstraints) return meals
    
    const intolerances = (athleteConstraints.intolerances || []).map(i => i.toLowerCase())
    const allergies = (athleteConstraints.allergies || []).map(a => a.toLowerCase())
    const foodsToAvoid = (athleteConstraints.foods_to_avoid || []).map(f => f.toLowerCase())
    
    const hasLactoseIntolerance = intolerances.some(i => i.includes('lattosio') || i.includes('latticini'))
    const hasGlutenIntolerance = intolerances.some(i => i.includes('glutine')) || allergies.some(a => a.includes('glutine') || a.includes('celiac'))
    const hasEggAllergy = allergies.some(a => a.includes('uova') || a.includes('uovo'))
    const hasNutAllergy = allergies.some(a => a.includes('frutta secca') || a.includes('noci') || a.includes('arachidi'))
    const hasNickelAllergy = allergies.some(a => a.includes('nichel'))
    
    return meals.filter(meal => {
      // FIX: Extract ingredient names correctly (they are objects with {name, grams})
      const ingredientNames = (meal.ingredients || []).map(i => (i.name || '').toLowerCase())
      const tags = (meal.tags || []).map(t => t.toLowerCase())
      
      // Check tags first - quick exclusion
      if (hasLactoseIntolerance && tags.includes('latticini')) return false
      if (hasGlutenIntolerance && tags.includes('glutine') && !tags.includes('gluten-free')) return false
      if (hasNutAllergy && tags.includes('fruttasecca')) return false
      
      // Check for lactose intolerance in ingredients
      if (hasLactoseIntolerance) {
        if (ingredientNames.some(ing => 
          ing.includes('latte') || ing.includes('yogurt') || ing.includes('formaggio') || 
          ing.includes('ricotta') || ing.includes('mozzarella') || ing.includes('parmigiano') ||
          ing.includes('burro') || ing.includes('panna') || ing.includes('cottage')
        )) return false
      }
      
      // Check for gluten intolerance/celiac - only exclude if NOT gluten-free tagged
      if (hasGlutenIntolerance) {
        if (ingredientNames.some(ing => 
          ing.includes('pane') || ing.includes('pasta') || ing.includes('farina') || 
          ing.includes('avena') || ing.includes('orzo') || ing.includes('farro') ||
          ing.includes('seitan') || ing.includes('crackers')
        ) && !tags.includes('gluten-free')) return false
      }
      
      // Check for egg allergy
      if (hasEggAllergy) {
        if (ingredientNames.some(ing => ing.includes('uova') || ing.includes('uovo'))) return false
      }
      
      // Check for nut allergy
      if (hasNutAllergy) {
        if (ingredientNames.some(ing => 
          ing.includes('noci') || ing.includes('mandorle') || ing.includes('nocciole') || 
          ing.includes('arachidi') || ing.includes('pistacchi') || ing.includes('anacardi')
        )) return false
      }
      
      // Check for nickel allergy
      if (hasNickelAllergy) {
        if (ingredientNames.some(ing => 
          ing.includes('pomodoro') || ing.includes('spinaci') || ing.includes('cacao') || 
          ing.includes('cioccolato') || ing.includes('lenticchie') || ing.includes('fagioli')
        )) return false
      }
      
      // Check AI-specified foods to avoid
      if (foodsToAvoid.length > 0) {
        if (ingredientNames.some(ing => foodsToAvoid.some(avoid => ing.includes(avoid)))) return false
      }
      
      return true
    })
  }

  // EMPATHY meal selection: rotazione + adattamento al tipo di giornata + 2 alternative
  const selectMealWithRotation = (meals: typeof MEAL_DATABASE.colazione, mealType: string, targetKcal: number, dayIndex: number, workoutType: string) => {
    // Prioritize meals based on workout type
    let filteredMeals = [...meals]
    
    // High intensity days: prefer high-carb meals
    if (workoutType === 'high_intensity' || workoutType === 'intervals') {
      filteredMeals.sort((a, b) => {
        const aHighCarb = a.tags?.includes('high-carb') ? 1 : 0
        const bHighCarb = b.tags?.includes('high-carb') ? 1 : 0
        return bHighCarb - aHighCarb
      })
    }
    // Endurance days: prefer balanced or high-fat meals for fat adaptation
    else if (workoutType === 'endurance' || workoutType === 'long') {
      filteredMeals.sort((a, b) => {
        const aBalanced = a.tags?.includes('balanced') || a.tags?.includes('omega3') ? 1 : 0
        const bBalanced = b.tags?.includes('balanced') || b.tags?.includes('omega3') ? 1 : 0
        return bBalanced - aBalanced
      })
    }
    // Recovery/rest days: prefer high-protein, moderate carb
    else if (workoutType === 'recovery' || workoutType === 'rest') {
      filteredMeals.sort((a, b) => {
        const aProtein = a.tags?.includes('high-protein') ? 1 : 0
        const bProtein = b.tags?.includes('high-protein') ? 1 : 0
        return bProtein - aProtein
      })
    }
    
    // Apply rotation offset based on day + mealType for variety
    const mealTypeOffset = mealType.charCodeAt(0) % 5
    const rotationIndex = (dayIndex + mealTypeOffset) % filteredMeals.length
    const selectedMeal = filteredMeals[rotationIndex]
    
    // Get 2 alternatives (different from selected, spread across the list)
    const alternatives: typeof selectedMeal[] = []
    if (filteredMeals.length > 1) {
      const alt1Index = (rotationIndex + Math.ceil(filteredMeals.length / 3)) % filteredMeals.length
      if (alt1Index !== rotationIndex) {
        alternatives.push(filteredMeals[alt1Index])
      }
    }
    if (filteredMeals.length > 2) {
      const alt2Index = (rotationIndex + Math.ceil(filteredMeals.length * 2 / 3)) % filteredMeals.length
      if (alt2Index !== rotationIndex && !alternatives.includes(filteredMeals[alt2Index])) {
        alternatives.push(filteredMeals[alt2Index])
      }
    }
    
    return { selected: selectedMeal, alternatives }
  }

  // Generate plan for each day of the week
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayActivity = weeklyActivities.find((a) => a.day_of_week === dayIndex)
      const workoutType = getWorkoutType(dayActivity)
      // Use scheduled_time from the activity if available, otherwise infer from meal timing logic
      const workoutTime = dayActivity?.scheduled_time
        ? dayActivity.scheduled_time // Use the parsed time directly
        : dayActivity?.activity_date
          ? new Date(dayActivity.activity_date).toTimeString().substring(0, 5)
          : null
      const { meals: calculatedMeals, profile: workoutProfile } = calculateMealTiming(workoutTime, workoutType, trainingPreferences?.preferred_training_time)

      // Calculate daily kcal for this specific day
      let dayWorkoutKcal = 0
      if (dayActivity) {
        const zone = dayActivity.zone || 2
        const duration = dayActivity.duration || 60
        const durationHours = duration / 60
        const consumption = getZoneConsumption(zone)
        dayWorkoutKcal = Math.round(consumption.kcalH * durationHours)
      }

      // Apply metabolic phase multiplier to daily kcal
      const phaseMultiplier = metabolicPhase === 'anabolic' ? 1.12 : metabolicPhase === 'catabolic' ? 0.85 : 1.0
      const dayDailyKcal = Math.round((bmr + bmr * 0.15 + dayWorkoutKcal * 0.4) * phaseMultiplier)

      const mealTimes: Record<string, string> = {}
      const mealLabels: Record<string, string> = {}
      const mealDistributionConfig: Record<string, { pct: number; macro: { cho: number; pro: number; fat: number } }> =
        {}

      calculatedMeals.forEach((meal) => {
        mealTimes[meal.type] = meal.time
        mealLabels[meal.type] = meal.name
        mealDistributionConfig[meal.type] = { pct: meal.kcalPct, macro: meal.macroRatio }
      })

      // Define dayPlan with ingredients and alternatives
      const dayPlan: {
        meal: string
        name: string
        kcal: number
        cho: number
        pro: number
        fat: number
        time: string
        ingredients: { name: string; grams: number }[]
        alternatives?: { name: string; kcal: number; cho: number; pro: number; fat: number; ingredients: { name: string; grams: number }[] }[]
      }[] = []

      Object.entries(mealDistributionConfig).forEach(([mealType, config]) => {
        const dbKey = mealType === "merenda" ? "spuntino" : mealType
        const filteredMeals = filterMeals(MEAL_DATABASE[dbKey] || MEAL_DATABASE.spuntino)

  if (filteredMeals.length > 0) {
  const targetKcal = dayDailyKcal * config.pct
  const { selected: selectedMeal, alternatives } = selectMealWithRotation(filteredMeals, mealType, targetKcal, dayIndex, workoutType)
  const scale = targetKcal / selectedMeal.kcal

          const scaledIngredients = selectedMeal.ingredients.map((ing) => ({
            name: ing.name,
            grams: Math.round(ing.grams * scale),
          }))
          
          // Scale alternatives too
          const scaledAlternatives = alternatives.map(alt => {
            const altScale = targetKcal / alt.kcal
            return {
              name: alt.name,
              kcal: Math.round(alt.kcal * altScale),
              cho: Math.round(alt.cho * altScale),
              pro: Math.round(alt.pro * altScale),
              fat: Math.round(alt.fat * altScale),
              ingredients: alt.ingredients.map(ing => ({
                name: ing.name,
                grams: Math.round(ing.grams * altScale),
              }))
            }
          })

          dayPlan.push({
            meal: mealLabels[mealType] || mealType,
            name: selectedMeal.name,
            kcal: Math.round(selectedMeal.kcal * scale),
            cho: Math.round(selectedMeal.cho * scale),
            pro: Math.round(selectedMeal.pro * scale),
            fat: Math.round(selectedMeal.fat * scale),
            time: mealTimes[mealType] || "12:00",
            ingredients: scaledIngredients,
            alternatives: scaledAlternatives.length > 0 ? scaledAlternatives : undefined,
          })
        }
      })

      weekPlan[dayIndex] = dayPlan.sort((a, b) => a.time.localeCompare(b.time))
    }

    // Update state with usage tracking
    setWeeklyFoodUsage(usedFoods)

    return weekPlan
  }, [bmr, weeklyActivities, athleteConstraints, metabolicProfile, dailyKcal, calculateMealTiming, trainingPreferences, metabolicPhase])

  // Get meal plan for selected day - AI substitutions are applied inline to ingredients during rendering
  const mealPlan = useMemo(() => {
    const dayMeals = weeklyMealPlan[selectedDay] || []
    // Filter out pre_workout meals as they are shown in the Fueling tab
    return dayMeals.filter((meal: any) =>
      !meal.meal?.toLowerCase().includes('pre-workout') &&
      meal.type !== 'pre_workout'
    )
  }, [weeklyMealPlan, selectedDay])

  const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

  // Categorie ingredienti per organizzare la lista della spesa
  const INGREDIENT_CATEGORIES: Record<string, string[]> = {
    "Latticini e Uova": ["latte", "yogurt", "formaggio", "uova", "burro", "panna", "ricotta", "mozzarella", "parmigiano", "grana", "albume"],
    "Carne e Pesce": ["pollo", "tacchino", "manzo", "maiale", "salmone", "tonno", "bresaola", "prosciutto", "cotto", "crudo", "pesce"],
    "Frutta": ["banana", "mela", "arancia", "fragole", "frutti di bosco", "mirtilli", "kiwi", "mango", "pesca", "uva", "limone", "frutta"],
    "Verdura": ["spinaci", "broccoli", "zucchine", "pomodoro", "peperoni", "carote", "insalata", "rucola", "cipolla", "aglio", "verdure", "patate"],
    "Cereali e Pane": ["pane", "pasta", "riso", "avena", "fiocchi", "farina", "cereali", "muesli", "fette biscottate", "crackers", "quinoa", "orzo"],
    "Legumi e Proteine Vegetali": ["fagioli", "lenticchie", "ceci", "tofu", "tempeh", "edamame", "piselli"],
    "Frutta Secca e Semi": ["mandorle", "noci", "nocciole", "semi di chia", "semi di lino", "arachidi", "burro di arachidi", "uvetta"],
    "Condimenti e Oli": ["olio", "evo", "aceto", "sale", "pepe", "spezie", "miele", "marmellata", "sciroppo", "salsa"],
    "Bevande": ["caffè", "tè", "succo", "latte di mandorla", "latte di soia", "latte di avena", "latte di cocco"],
    "Altro": []
  }

  // Genera lista della spesa aggregando tutti gli ingredienti della settimana
  const generateShoppingList = useMemo(() => {
    const ingredientMap: Record<string, { grams: number; category: string }> = {}
    
    // Itera su tutti i giorni della settimana
    for (let day = 0; day < 7; day++) {
      const dayMeals = weeklyMealPlan[day] || []
      
      for (const meal of dayMeals) {
        if (meal.ingredients) {
          for (const ing of meal.ingredients) {
            const ingName = ing.name.toLowerCase()
            
            // Trova la categoria
            let category = "Altro"
            for (const [cat, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
              if (keywords.some(kw => ingName.includes(kw))) {
                category = cat
                break
              }
            }
            
            // Aggrega le quantita
            const key = ing.name
            if (ingredientMap[key]) {
              ingredientMap[key].grams += ing.grams
            } else {
              ingredientMap[key] = { grams: ing.grams, category }
            }
          }
        }
      }
    }
    
    // Organizza per categoria
    const byCategory: Record<string, { name: string; grams: number }[]> = {}
    for (const [name, data] of Object.entries(ingredientMap)) {
      if (!byCategory[data.category]) {
        byCategory[data.category] = []
      }
      byCategory[data.category].push({ name, grams: Math.round(data.grams) })
    }
    
    // Ordina ingredienti per quantita decrescente in ogni categoria
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) => b.grams - a.grams)
    }
    
    return byCategory
  }, [weeklyMealPlan])

  // Genera PDF della lista della spesa
  const generateShoppingListPDF = () => {
    const shoppingList = generateShoppingList
    
    // Crea contenuto HTML per il PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lista della Spesa - EMPATHY</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #1a1a2e; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #4f46e5; margin-top: 25px; font-size: 18px; }
          .category { margin-bottom: 20px; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e5e5e5; }
          .item-name { color: #333; }
          .item-qty { color: #6366f1; font-weight: bold; min-width: 80px; text-align: right; }
          .checkbox { width: 18px; height: 18px; border: 2px solid #6366f1; border-radius: 3px; margin-right: 10px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #666; font-size: 12px; text-align: center; }
          .date { color: #999; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Lista della Spesa Settimanale</h1>
          <p class="date">Generata il ${new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    `
    
    // Ordine categorie
    const categoryOrder = ["Frutta", "Verdura", "Carne e Pesce", "Latticini e Uova", "Cereali e Pane", "Legumi e Proteine Vegetali", "Frutta Secca e Semi", "Condimenti e Oli", "Bevande", "Altro"]
    
    for (const category of categoryOrder) {
      const items = shoppingList[category]
      if (items && items.length > 0) {
        htmlContent += `
          <div class="category">
            <h2>${category}</h2>
        `
        for (const item of items) {
          const qty = item.grams >= 1000 ? `${(item.grams / 1000).toFixed(1)} kg` : `${item.grams} g`
          htmlContent += `
            <div class="item">
              <div style="display: flex; align-items: center;">
                <div class="checkbox"></div>
                <span class="item-name">${item.name}</span>
              </div>
              <span class="item-qty">${qty}</span>
            </div>
          `
        }
        htmlContent += `</div>`
      }
    }
    
    htmlContent += `
          <div class="footer">
            <p>EMPATHY Performance Nutrition - Piano personalizzato</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    // Apri in nuova finestra per stampa/PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const micronutrientAnalysis = useMemo(() => {
    // Simplified estimation based on meal composition
    const meals = mealPlan
    const totalKcal = meals.reduce((sum, m) => sum + m.kcal, 0)
    const totalCho = meals.reduce((sum, m) => sum + m.cho, 0)
    const totalPro = meals.reduce((sum, m) => sum + m.pro, 0)

    // Estimate micronutrients based on macros (simplified model)
    return {
      vitamins: {
        b1: { current: Math.round(totalCho * 0.008 * 10) / 10, ...MICRONUTRIENT_TARGETS.vitamins.b1 },
        b6: { current: Math.round(totalPro * 0.02 * 10) / 10, ...MICRONUTRIENT_TARGETS.vitamins.b6 },
        b12: { current: Math.round(totalPro * 0.03 * 10) / 10, ...MICRONUTRIENT_TARGETS.vitamins.b12 },
        c: { current: Math.round(totalKcal * 0.04), ...MICRONUTRIENT_TARGETS.vitamins.c },
        d: { current: 5, ...MICRONUTRIENT_TARGETS.vitamins.d }, // Often deficient
        e: { current: Math.round(totalKcal * 0.007), ...MICRONUTRIENT_TARGETS.vitamins.e },
      },
      minerals: {
        iron: { current: Math.round(totalKcal * 0.006), ...MICRONUTRIENT_TARGETS.minerals.iron },
        zinc: { current: Math.round(totalPro * 0.15), ...MICRONUTRIENT_TARGETS.minerals.zinc },
        magnesium: { current: Math.round(totalKcal * 0.15), ...MICRONUTRIENT_TARGETS.minerals.magnesium },
        calcium: { current: Math.round(totalKcal * 0.4), ...MICRONUTRIENT_TARGETS.minerals.calcium },
        sodium: { current: Math.round(totalKcal * 0.8), ...MICRONUTRIENT_TARGETS.minerals.sodium },
        potassium: { current: Math.round(totalKcal * 1.2), ...MICRONUTRIENT_TARGETS.minerals.potassium },
      },
    }
  }, [mealPlan])

  const dailySupplementStack = useMemo(() => {
    const stack = [...DAILY_SUPPLEMENT_STACK.base]
    const workoutType = selectedActivity ? getWorkoutType(selectedActivity) : "rest"
const { meals: calculatedMeals, profile: workoutProfile } = calculateMealTiming(
  selectedActivity?.scheduled_time || // Use scheduled_time if available
  selectedActivity?.activity_date
  ? new Date(selectedActivity.activity_date).toTimeString().substring(0, 5)
  : null,
  workoutType,
  trainingPreferences?.preferred_training_time, // Athlete's preferred training slot as fallback
  )

    const preWorkoutMeal = calculatedMeals.find((m) => m.type === "pre_workout")
    const postWorkoutMeal = calculatedMeals.find((m) => m.type === "post_workout")
    const restDayMeals = calculatedMeals.filter(
      (m) =>
        m.type === "colazione" ||
        m.type === "pranzo" ||
        m.type === "cena" ||
        m.type === "spuntino" ||
        m.type === "pre_sonno",
    )

    if (selectedActivity) {
      // Add training day supplements
      stack.push(...DAILY_SUPPLEMENT_STACK.training_day)

      const zone = workoutMetrics.zone
      const duration = workoutMetrics.duration

      // High intensity (Z4+)
      if (zone >= 4) {
        stack.push(...DAILY_SUPPLEMENT_STACK.high_intensity)
      }

      // Endurance (long duration or Z2)
      if (duration >= 90 || zone <= 2) {
        stack.push(...DAILY_SUPPLEMENT_STACK.endurance)
      }

      // Always add recovery for training days
      stack.push(...DAILY_SUPPLEMENT_STACK.recovery)
    }

    // Add supplements based on training preferences and athlete constraints
    if (trainingPreferences) {
      // Example: If preferred_training_time is "morning", adjust supplement timing if needed.
      // This part can be expanded based on specific preference logic.
    }

    // Filter out supplements based on workout type focus
    // Example: If it's a "recovery" day, perhaps remove high-intensity supplements
    if (workoutType === "recovery") {
      stack.filter((s) => !s.name.includes("Citrullina") && !s.name.includes("Beta-Alanina"))
    }
    if (workoutType === "endurance") {
      stack.filter((s) => !s.name.includes("Sodio Bicarbonato"))
    }

    // Add supplements recommended by the workout profile's keyNutrients
    if (workoutProfile.keyNutrients) {
      workoutProfile.keyNutrients.forEach((nutrient) => {
        if (nutrient.toLowerCase().includes("cho") && !stack.some((s) => s.name.includes("CHO"))) {
          // Add a generic carb supplement if not already present
          // This logic might need refinement to pick specific products
        }
        if (nutrient.toLowerCase().includes("antiossidanti") && !stack.some((s) => s.name.includes("Antiossidanti"))) {
          // Add antioxidant supplement
          stack.push({
            name: "Mix Antiossidanti",
            dose: "1 dose",
            timing: "Post-workout",
            benefit: "Recupero cellulare",
          })
        }
        if (nutrient.toLowerCase().includes("ferro") && !stack.some((s) => s.name.includes("Ferro"))) {
          stack.push({ name: "Ferro", dose: "14mg", timing: "Lontano dai pasti", benefit: "Capacità aerobica" })
        }
        if (nutrient.toLowerCase().includes("vitamina c") && !stack.some((s) => s.name.includes("Vitamina C"))) {
          stack.push({
            name: "Vitamina C",
            dose: "500mg",
            timing: "Post-workout",
            benefit: "Supporto immunitario e recupero",
          })
        }
        if (nutrient.toLowerCase().includes("beta-alanina") && !stack.some((s) => s.name.includes("Beta-Alanina"))) {
          stack.push({
            name: "Beta-Alanina",
            dose: "3.2g",
            timing: "Pre-workout (-30min)",
            benefit: "Buffer acido lattico",
          })
        }
        if (nutrient.toLowerCase().includes("creatina") && !stack.some((s) => s.name.includes("Creatina"))) {
          stack.push({ name: "Creatina Monoidrato", dose: "5g", timing: "Post-workout", benefit: "Forza e recupero" })
        }
        if (nutrient.toLowerCase().includes("magnesio") && !stack.some((s) => s.name.includes("Magnesio"))) {
          stack.push({ name: "Magnesio", dose: "400mg", timing: "Pre-sonno", benefit: "Recupero muscolare" })
        }
        if (nutrient.toLowerCase().includes("sodio") && !stack.some((s) => s.name.includes("Sodio"))) {
          stack.push({
            name: "Elettroliti (Sodio)",
            dose: "500mg",
            timing: "Durante allenamento",
            benefit: "Bilancio idrico",
          })
        }
        if (nutrient.toLowerCase().includes("potassio") && !stack.some((s) => s.name.includes("Potassio"))) {
          stack.push({
            name: "Elettroliti (Potassio)",
            dose: "200mg",
            timing: "Post-workout",
            benefit: "Funzione muscolare",
          })
        }
        if (nutrient.toLowerCase().includes("vitamina b") && !stack.some((s) => s.name.includes("Vitamina B"))) {
          stack.push({
            name: "Complesso Vitamine B",
            dose: "1 dose",
            timing: "Colazione",
            benefit: "Metabolismo energetico",
          })
        }
        if (nutrient.toLowerCase().includes("omega-3") && !stack.some((s) => s.name.includes("Omega-3"))) {
          stack.push({ name: "Omega-3", dose: "1-2g", timing: "Colazione", benefit: "Anti-infiammatorio" })
        }
        if (nutrient.toLowerCase().includes("l-carnitina") && !stack.some((s) => s.name.includes("L-Carnitina"))) {
          stack.push({ name: "L-Carnitina", dose: "1-2g", timing: "Pre-workout", benefit: "Utilizzo grassi" })
        }
        if (nutrient.toLowerCase().includes("vitamina d") && !stack.some((s) => s.name.includes("Vitamina D"))) {
          stack.push({ name: "Vitamina D3", dose: "2000 UI", timing: "Colazione", benefit: "Salute ossea, immunità" })
        }
        if (nutrient.toLowerCase().includes("b12") && !stack.some((s) => s.name.includes("Vitamina B12"))) {
          stack.push({ name: "Vitamina B12", dose: "2.4μg", timing: "Colazione", benefit: "Energia" })
        }
        if (
          nutrient.toLowerCase().includes("leucina") &&
          !stack.some((s) => s.name.includes("Leucina") || s.name.includes("BCAA"))
        ) {
          stack.push({
            name: "Leucina (o BCAA)",
            dose: "3-5g",
            timing: "Post-workout",
            benefit: "Inizio sintesi proteica",
          })
        }
        if (nutrient.toLowerCase().includes("collagene") && !stack.some((s) => s.name.includes("Collagene"))) {
          stack.push({
            name: "Collagene Idrolizzato",
            dose: "10g",
            timing: "Colazione",
            benefit: "Salute articolare e cutanea",
          })
        }
        if (
          nutrient.toLowerCase().includes("zinco") &&
          !stack.some((s) => s.name.includes("ZMA") || s.name.includes("Zinco"))
        ) {
          stack.push({ name: "Zinco", dose: "15mg", timing: "Pre-sonno", benefit: "Recupero e immunità" })
        }
        if (nutrient.toLowerCase().includes("probiotici") && !stack.some((s) => s.name.includes("Probiotici"))) {
          stack.push({ name: "Probiotici", dose: "1 dose", timing: "Mattina", benefit: "Salute intestinale" })
        }
      })
    }

    // Timing adjustments based on meal timing
    stack.forEach((item) => {
      if (item.timing.includes("Colazione") && preWorkoutMeal && preWorkoutMeal.time.startsWith("06:00")) {
        item.timing = "6:00 AM (Colazione Pre-W)"
      } else if (item.timing.includes("Pre-workout") && preWorkoutMeal) {
        item.timing = `~${preWorkoutMeal.time} (${item.timing})`
      } else if (item.timing.includes("Post-workout") && postWorkoutMeal) {
        item.timing = `~${postWorkoutMeal.time} (${item.timing})`
      } else if (item.timing.includes("Pre-sonno") && restDayMeals.some((m) => m.time === "22:30")) {
        item.timing = "10:30 PM (Pre-Sonno)"
      } else if (item.timing.includes("Lontano dai pasti")) {
        // Find the best slot between meals
        const mealTimes = restDayMeals.map((m) => m.time).sort()
        let bestSlot = "Mattina (lontano dai pasti)"
        for (let i = 0; i < mealTimes.length - 1; i++) {
          if (mealTimes[i] < "12:00" && mealTimes[i + 1] > "12:00") {
            bestSlot = "Pranzo (lontano dai pasti)"
            break
          }
        }
        item.timing = bestSlot
      }
    })

    // Sort by timing
    const timingOrder = [
      "Mattina",
      "Colazione",
      "Pre-Workout",
      "6:00 AM",
      "Intra-workout",
      "Ogni 60min",
      "Post-workout",
      "Pranzo",
      "Pasto",
      "Pre-sonno",
      "Sera",
      "22:30 PM",
      "23:00 PM",
      "Lontano dai pasti",
    ]

    return stack.sort((a, b) => {
      const aTiming = a.timing.split(" ")[0]
      const bTiming = b.timing.split(" ")[0]

      const aIndex = timingOrder.findIndex((t) => aTiming.startsWith(t))
      const bIndex = timingOrder.findIndex((t) => bTiming.startsWith(t))

      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }, [selectedActivity, workoutMetrics, sportSupplements, calculateMealTiming, trainingPreferences])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {!isLoading && athleteData ? (
        <>
          {/* BioMap Section */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>BioMap & Nutrition Plan</CardTitle>
  {athleteData?.id && (
    <div className="flex gap-2 items-center">
      <Button
        variant={aiAdaptiveEnabled ? "default" : "outline"}
        size="sm"
        onClick={async () => {
          if (aiAdaptiveEnabled) {
            // Disable AI adaptive
            setAiAdaptiveEnabled(false)
            setAiAdaptations(null)
          } else {
            // Enable and calculate
            try {
              const response = await fetch('/api/ai/adaptive-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  athleteId: athleteData.id,
                  action: 'calculate'
                })
              })
              const data = await response.json()
              if (data.success) {
                setAiAdaptiveEnabled(true)
                setAiAdaptations({
                  nutrition: data.adaptations?.nutrition,
                  fueling: data.adaptations?.fueling,
                  training: data.adaptations?.training,
                  daily_state: data.state
                })
              }
            } catch (error) {
              console.error('[v0] Error calculating AI state:', error)
            }
          }
        }}
        className={aiAdaptiveEnabled 
          ? "bg-cyan-600 hover:bg-cyan-700 text-white" 
          : "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
        }
      >
        <Activity className="h-4 w-4 mr-1" />
        {aiAdaptiveEnabled ? "AI Attivo" : "AI Adattivo"}
      </Button>
      {/* Metabolic Phase Selector */}
      <div className="flex items-center gap-1 border rounded-md p-0.5">
        <Button
          variant={metabolicPhase === 'catabolic' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMetabolicPhase('catabolic')}
          className={`px-2 h-7 text-xs ${metabolicPhase === 'catabolic' ? 'bg-red-600 hover:bg-red-700' : 'text-red-400 hover:text-red-300'}`}
          title="Fase catabolica: -15% kcal per perdita grasso"
        >
          Deficit
        </Button>
        <Button
          variant={metabolicPhase === 'maintenance' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMetabolicPhase('maintenance')}
          className={`px-2 h-7 text-xs ${metabolicPhase === 'maintenance' ? 'bg-gray-600 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-300'}`}
          title="Mantenimento: calorie bilanciate"
        >
          Mantieni
        </Button>
        <Button
          variant={metabolicPhase === 'anabolic' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setMetabolicPhase('anabolic')}
          className={`px-2 h-7 text-xs ${metabolicPhase === 'anabolic' ? 'bg-green-600 hover:bg-green-700' : 'text-green-400 hover:text-green-300'}`}
          title="Fase anabolica: +12% kcal per costruzione muscolare"
        >
          Surplus
        </Button>
      </div>
  <AIAnalysisButton
  athleteId={athleteData.id}
  endpoint="nutrition"
  buttonText="AI Consigli"
  context="Analisi nutrizionale completa con focus su timing, allergie, interazioni microbioma"
  onApplied={() => setRefreshTrigger(prev => prev + 1)}
  />
  <Button
    variant="outline"
    size="sm"
    onClick={generateShoppingListPDF}
    className="border-green-500/50 text-green-400 hover:bg-green-500/10 bg-transparent"
  >
    <ShoppingCart className="h-4 w-4 mr-1" />
    Lista Spesa
  </Button>
  </div>
  )}
            </CardHeader>
            <CardContent>
<Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="biomap">BioMap</TabsTrigger>
                    <TabsTrigger value="nutrition">Nutrition Plan</TabsTrigger>
                    <TabsTrigger value="fueling">Fueling</TabsTrigger>
                  </TabsList>
                <TabsContent value="biomap">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Metabolic Profile */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Metabolic Profile</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metabolicProfile?.ftp_watts ? `${metabolicProfile.ftp_watts} W` : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">FTP: {metabolicProfile?.ftp_watts || "N/A"}</p>
                      </CardContent>
                    </Card>

                    {/* Daily Energy Expenditure */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Energy</CardTitle>
                        <Flame className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{dailyKcal} kcal</div>
                        <p className="text-xs text-muted-foreground">
                          BMR: {bmr} kcal | Workout: {workoutMetrics.kcal} kcal
                        </p>
                      </CardContent>
                    </Card>

                    {/* Macronutrient Distribution */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Macronutrients</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-2 pb-2">
                          <Badge variant="outline">C: {Math.round((dailyKcal * 0.5) / 4)}g</Badge>
                          <Badge variant="outline">P: {Math.round((dailyKcal * 0.25) / 4)}g</Badge>
                          <Badge variant="outline">F: {Math.round((dailyKcal * 0.25) / 9)}g</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Target distribution based on daily kcal</p>
                      </CardContent>
                    </Card>

                    {/* Micronutrient Analysis */}
                    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Micronutrients</CardTitle>
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h4 className="text-base font-semibold">Vitamins</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(micronutrientAnalysis.vitamins).map(([key, value]) => (
                              <div key={key} className="flex flex-col items-center">
                                <Badge variant="outline" className="mb-1">
                                  {value.name}
                                </Badge>
                                <span className="text-xs">
                                  {value.current} / {value.target} {value.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                          <h4 className="text-base font-semibold pt-4">Minerals</h4>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(micronutrientAnalysis.minerals).map(([key, value]) => (
                              <div key={key} className="flex flex-col items-center">
                                <Badge variant="outline" className="mb-1">
                                  {value.name}
                                </Badge>
                                <span className="text-xs">
                                  {value.current} / {value.target} {value.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Supplements */}
                    <Card className="col-span-1 md:col-span-2 lg:col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Supplement Stack</CardTitle>
                        <Pill className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {dailySupplementStack.length > 0 ? (
                            dailySupplementStack.map((sup, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{sup.name}</span>
                                  <Badge variant="outline">{sup.dose}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">{sup.timing}</div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-sm text-muted-foreground">
                              No supplements recommended for today.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

<TabsContent value="nutrition">
  {/* Banner Avviso Intolleranze */}
  {(athleteConstraints?.intolerances?.length > 0 || athleteConstraints?.allergies?.length > 0) && (
    <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <div className="flex items-center gap-2">
        <Pill className="h-5 w-5 text-amber-400" />
        <span className="font-semibold text-amber-400">Avviso Intolleranze/Allergie</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Ricorda di assumere cibi{' '}
        {athleteConstraints?.intolerances?.map((i, idx) => (
          <span key={idx}>
            <strong className="text-amber-300">senza {i.toLowerCase()}</strong>
            {idx < (athleteConstraints?.intolerances?.length || 0) - 1 ? ', ' : ''}
          </span>
        ))}
        {athleteConstraints?.allergies?.length > 0 && athleteConstraints?.intolerances?.length > 0 && ' e '}
        {athleteConstraints?.allergies?.map((a, idx) => (
          <span key={idx}>
            <strong className="text-red-300">evitare {a.toLowerCase()}</strong>
            {idx < (athleteConstraints?.allergies?.length || 0) - 1 ? ', ' : ''}
          </span>
        ))}
        . Le ricette mostrate sono indicative - sostituire gli ingredienti non compatibili.
      </p>
    </div>
  )}

  {/* EMPATHY Daily State Panel - Dynamic values based on selected day workout */}
  {selectedActivity ? (
    <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <span className="font-semibold text-cyan-400">EMPATHY - {dayNames[selectedDay]}</span>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={`
            ${workoutMetrics.zone >= 5 ? 'border-red-500 text-red-400' :
              workoutMetrics.zone >= 4 ? 'border-orange-500 text-orange-400' :
              workoutMetrics.zone >= 3 ? 'border-yellow-500 text-yellow-400' :
              'border-green-500 text-green-400'}
          `}>
            Zone: Z{workoutMetrics.zone}
          </Badge>
          <Badge variant="outline" className={`
            ${workoutMetrics.kcal > 1500 ? 'border-red-500 text-red-400' :
              workoutMetrics.kcal > 800 ? 'border-orange-500 text-orange-400' :
              'border-green-500 text-green-400'}
          `}>
            {workoutMetrics.kcal > 1500 ? 'High Load' : workoutMetrics.kcal > 800 ? 'Medium Load' : 'Low Load'}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="text-center p-2 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">Workout Kcal</div>
          <div className={`text-lg font-bold ${
            workoutMetrics.kcal > 1500 ? 'text-red-400' :
            workoutMetrics.kcal > 800 ? 'text-orange-400' : 'text-green-400'
          }`}>
            {workoutMetrics.kcal}
          </div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">Kcal Totali Giorno</div>
          <div className="text-lg font-bold text-cyan-400">
            {dailyKcal}
            <span className="text-xs ml-1 text-muted-foreground">
              (BMR + TEF + 40% workout)
            </span>
          </div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">CHO</div>
          <div className="text-lg font-bold">
            {workoutMetrics.zone >= 4 ? '60%' : workoutMetrics.zone >= 3 ? '55%' : '50%'}
          </div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">PRO</div>
          <div className="text-lg font-bold">
            {workoutMetrics.zone >= 5 ? '25%' : '20%'}
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {workoutMetrics.zone >= 5 
          ? `Alta intensita Z${workoutMetrics.zone}: Priorita CHO per performance, aumenta proteine per recupero muscolare.`
          : workoutMetrics.zone >= 4
          ? `Soglia Z${workoutMetrics.zone}: Bilancia CHO e grassi, focus su recupero post-workout.`
          : workoutMetrics.zone >= 3
          ? `Tempo Z${workoutMetrics.zone}: Sessione moderata, alimentazione bilanciata.`
          : workoutMetrics.duration > 120
          ? `Endurance Z${workoutMetrics.zone} lunga (${workoutMetrics.duration}min): Fat adaptation, CHO moderati, aumenta intake durante.`
          : `Endurance Z${workoutMetrics.zone}: Fat oxidation prioritaria, CHO moderati.`
        }
      </p>
      
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-xs bg-cyan-900/30">
          CHO bruciati: {workoutMetrics.choBurned}g
        </Badge>
        <Badge variant="secondary" className="text-xs bg-cyan-900/30">
          Fat bruciati: {workoutMetrics.fatBurned}g
        </Badge>
        {workoutMetrics.duration > 90 && (
          <Badge variant="secondary" className="text-xs bg-yellow-900/30">
            Sessione lunga: rifornimento necessario
          </Badge>
        )}
  </div>
  </div>
  ) : (
    <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-500/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-400" />
          <span className="font-semibold text-green-400">EMPATHY - {dayNames[selectedDay]} (Riposo)</span>
        </div>
        <Badge variant="outline" className="border-green-500 text-green-400">
          Giorno di Recupero
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">Kcal Giornaliere</div>
          <div className="text-lg font-bold text-green-400">
            {dailyKcal}
          </div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">CHO</div>
          <div className="text-lg font-bold">40%</div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">PRO</div>
          <div className="text-lg font-bold">25%</div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Giorno di riposo: focus su recupero e riparazione muscolare. Proteine elevate, carboidrati moderati, grassi sani.
        Nessun fueling pre/intra/post workout necessario.
      </p>
    </div>
  )}
  
  {/* AI Ingredient Substitutions Panel */}
  {aiSubstitutions.length > 0 && (
  <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-400">Correzioni AI Attive ({aiSubstitutions.length})</span>
        </div>
        <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-xs">
          Personalizzato
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {aiSubstitutions.slice(0, 6).map((sub, idx) => (
          <div key={idx} className="flex items-center gap-1 text-xs bg-background/50 px-2 py-1 rounded">
            <span className="line-through text-red-400/70">{sub.original}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-cyan-400">{sub.substitute}</span>
          </div>
        ))}
        {aiSubstitutions.length > 6 && (
          <span className="text-xs text-muted-foreground">+{aiSubstitutions.length - 6} altre</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Basate su: {athleteConstraints?.intolerances?.join(", ") || ""} {athleteConstraints?.allergies?.join(", ") || ""}
      </p>
    </div>
  )}
  
  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {dayNames.map((day, index) => (
                        <Button
                          key={index}
                          variant={selectedDay === index ? "default" : "outline"}
                          onClick={() => setSelectedDay(index)}
                          className="px-3 py-1 h-8"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Workout:</span>
                      <span className="text-sm text-muted-foreground">
                        {selectedActivity
                          ? `${selectedActivity.sport_type} (${selectedActivity.zoneName})`
                          : "Rest Day"}
                      </span>
                      {selectedActivity && (
                        <>
                          <span className="text-sm font-medium">Duration:</span>
                          <span className="text-sm text-muted-foreground">{selectedActivity.duration} min</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Meal Plan Section */}
                  {mealPlan.length > 0 ? (
                    mealPlan.map((meal, index) => (
                      <Card key={index} className="mb-4">
                        <CardHeader>
  <CardTitle className="flex items-center gap-2">
  {meal.meal}
  <Badge variant="secondary">{meal.time}</Badge>
  </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">{meal.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{meal.kcal} kcal</span>
                              <Badge variant="outline">C: {meal.cho}g</Badge>
                              <Badge variant="outline">P: {meal.pro}g</Badge>
                              <Badge variant="outline">F: {meal.fat}g</Badge>
                            </div>
                          </div>
  <div className="text-sm text-muted-foreground">
  {/* Two columns: Original ingredients + AI alternatives */}
  <div className="grid grid-cols-2 gap-4">
    {/* Original Ingredients Column */}
    <div>
      <strong>Ingredienti:</strong>
      <ul className="list-disc list-inside mt-1">
        {meal.ingredients.map((ing: any, ingIndex: number) => (
          <li key={ingIndex}>
            {ing.name}: {ing.grams}g
          </li>
        ))}
      </ul>
    </div>
    
    {/* Alternatives Column - for allergies/intolerances and AI suggestions */}
    {(() => {
      // Build automatic substitutions based on athlete constraints
      const autoSubstitutions: Record<string, { sub: string; reason: string }> = {
        // Lactose
        'latte': { sub: 'Latte senza lattosio / Latte di mandorla', reason: 'Intolleranza lattosio' },
        'yogurt': { sub: 'Yogurt senza lattosio / Yogurt di soia', reason: 'Intolleranza lattosio' },
        'formaggio': { sub: 'Formaggio stagionato (meno lattosio) / Tofu', reason: 'Intolleranza lattosio' },
        'ricotta': { sub: 'Ricotta senza lattosio / Hummus', reason: 'Intolleranza lattosio' },
        'mozzarella': { sub: 'Mozzarella senza lattosio', reason: 'Intolleranza lattosio' },
        'burro': { sub: 'Olio EVO / Margarina vegetale', reason: 'Intolleranza lattosio' },
        'panna': { sub: 'Panna vegetale / Latte di cocco', reason: 'Intolleranza lattosio' },
        // Gluten
        'pane': { sub: 'Pane senza glutine / Gallette di riso', reason: 'Celiachia/Glutine' },
        'pasta': { sub: 'Pasta di riso / Pasta di legumi', reason: 'Celiachia/Glutine' },
        'farina': { sub: 'Farina di riso / Farina di mandorle', reason: 'Celiachia/Glutine' },
        'avena': { sub: 'Avena certificata GF / Quinoa', reason: 'Celiachia/Glutine' },
        'crackers': { sub: 'Crackers senza glutine / Gallette', reason: 'Celiachia/Glutine' },
        // Eggs
        'uova': { sub: 'Tofu strapazzato / Semi di lino + acqua', reason: 'Allergia uova' },
        'uovo': { sub: 'Tofu strapazzato / Semi di chia', reason: 'Allergia uova' },
        // Nuts
        'noci': { sub: 'Semi di zucca / Semi di girasole', reason: 'Allergia frutta secca' },
        'mandorle': { sub: 'Semi di zucca / Cocco', reason: 'Allergia frutta secca' },
        'nocciole': { sub: 'Semi di girasole', reason: 'Allergia frutta secca' },
        'arachidi': { sub: 'Semi di zucca / Ceci tostati', reason: 'Allergia arachidi' },
        // Nickel
        'pomodoro': { sub: 'Peperoni rossi / Zucchine', reason: 'Allergia nichel' },
        'spinaci': { sub: 'Lattuga / Rucola', reason: 'Allergia nichel' },
        'cioccolato': { sub: 'Carruba', reason: 'Allergia nichel' },
        'cacao': { sub: 'Carruba in polvere', reason: 'Allergia nichel' },
      }
      
      const intolerances = (athleteConstraints?.intolerances || []).map((i: string) => i.toLowerCase())
      const allergies = (athleteConstraints?.allergies || []).map((a: string) => a.toLowerCase())
      const hasLactose = intolerances.some(i => i.includes('lattosio') || i.includes('latticini'))
      const hasGluten = intolerances.some(i => i.includes('glutine')) || allergies.some(a => a.includes('glutine') || a.includes('celiac'))
      const hasEggs = allergies.some(a => a.includes('uova') || a.includes('uovo'))
      const hasNuts = allergies.some(a => a.includes('frutta secca') || a.includes('noci') || a.includes('arachidi'))
      const hasNickel = allergies.some(a => a.includes('nichel'))
      
      const relevantSubs = meal.ingredients.map((ing: any) => {
        const ingLower = ing.name.toLowerCase()
        
        // Check AI substitutions first
        const aiSub = aiSubstitutions.find(s => ingLower.includes(s.original.toLowerCase()))
        if (aiSub) return { ing, sub: aiSub.substitute, reason: aiSub.reason, type: 'ai' }
        
        // Then check automatic substitutions based on constraints
        for (const [key, value] of Object.entries(autoSubstitutions)) {
          if (ingLower.includes(key)) {
            // Only suggest if relevant intolerance/allergy exists
            if (value.reason.includes('lattosio') && hasLactose) return { ing, ...value, type: 'auto' }
            if (value.reason.includes('Glutine') && hasGluten) return { ing, ...value, type: 'auto' }
            if (value.reason.includes('uova') && hasEggs) return { ing, ...value, type: 'auto' }
            if (value.reason.includes('frutta secca') && hasNuts) return { ing, ...value, type: 'auto' }
            if (value.reason.includes('arachidi') && hasNuts) return { ing, ...value, type: 'auto' }
            if (value.reason.includes('nichel') && hasNickel) return { ing, ...value, type: 'auto' }
          }
        }
        return null
      }).filter(Boolean)
      
      if (relevantSubs.length === 0) return null
      
      return (
        <div className="border-l border-amber-500/30 pl-4">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <strong className="text-amber-400">Alternative per allergie:</strong>
          </div>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            {relevantSubs.map((item: any, idx: number) => (
              <li key={idx} className={item.type === 'ai' ? 'text-cyan-400' : 'text-amber-300'}>
                <span className="text-muted-foreground">{item.ing.name}</span>
                <span className="mx-1">→</span>
                <span>{item.sub}: {item.ing.grams}g</span>
                <span className="text-xs text-muted-foreground ml-1">({item.reason})</span>
              </li>
            ))}
          </ul>
        </div>
      )
    })()}
  </div>
  </div>
  
  {/* Alternative Meal Options */}
  {meal.alternatives && meal.alternatives.length > 0 && (
    <div className="mt-4 pt-4 border-t border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="h-4 w-4 text-blue-400" />
        <strong className="text-blue-400 text-sm">Alternative a scelta:</strong>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {meal.alternatives.map((alt: any, altIdx: number) => (
          <div key={altIdx} className="bg-background/50 border border-border/50 rounded-lg p-3 hover:border-blue-500/50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-sm">{alt.name}</span>
              <Badge variant="outline" className="text-xs">{alt.kcal} kcal</Badge>
            </div>
            <div className="flex gap-2 mb-2 text-xs">
              <span className="text-amber-400">C: {alt.cho}g</span>
              <span className="text-red-400">P: {alt.pro}g</span>
              <span className="text-blue-400">F: {alt.fat}g</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {alt.ingredients.slice(0, 4).map((ing: any, ingIdx: number) => (
                <li key={ingIdx}>{ing.name}: {ing.grams}g</li>
              ))}
              {alt.ingredients.length > 4 && (
                <li className="text-muted-foreground/60">+{alt.ingredients.length - 4} altri...</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <h3 className="text-xl font-medium">Rest Day</h3>
                        <p className="text-sm text-muted-foreground">
                          No specific meals planned for today. Focus on balanced nutrition.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Intra-workout fueling */}
                  {intraWorkoutTiming.length > 0 && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle>Intra-Workout Fueling</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold">Carbohydrate Intake: {intraWorkCho}g</h3>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Recommended every {intraWorkoutTiming.find((t) => t.time)?.time ?? 20} min</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {intraWorkoutTiming.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{item.time} min:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {item.product} ({item.brand})
                                </span>
                                <span>{item.details}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

  {/* Fueling Tab - Pre/Intra/Post Workout Supplements */}
  <TabsContent value="fueling">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Colonna Sinistra - Fueling Stack */}
  <div className="lg:col-span-2 space-y-6">
  
  {/* EMPATHY Fueling Panel - Dynamic values based on selected workout - ONLY show for workout days */}
  {selectedActivity && workoutMetrics.duration > 0 && (
    <div className="p-4 rounded-lg bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-orange-400" />
        <span className="font-semibold text-orange-400">EMPATHY Fueling - Z{workoutMetrics.zone}</span>
        <Badge variant="outline" className={`ml-auto
          ${workoutMetrics.zone >= 5 ? 'border-red-500 text-red-400' :
            workoutMetrics.zone >= 4 ? 'border-orange-500 text-orange-400' :
            workoutMetrics.zone >= 3 ? 'border-yellow-500 text-yellow-400' :
            'border-green-500 text-green-400'}
        `}>
          {workoutMetrics.zone >= 5 ? 'Alta Intensita' :
           workoutMetrics.zone >= 4 ? 'Soglia' :
           workoutMetrics.zone >= 3 ? 'Tempo' : 'Endurance'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center p-3 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">Pre-Workout</div>
          <div className="text-xl font-bold text-orange-400">
            {workoutMetrics.duration < 60 ? 0 : 
             workoutMetrics.zone <= 2 ? 20 :
             workoutMetrics.zone <= 3 ? 30 :
             workoutMetrics.zone <= 4 ? 40 : 50}g
          </div>
          <div className="text-xs text-muted-foreground">CHO</div>
        </div>
        <div className="text-center p-3 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">Intra-Workout</div>
          <div className="text-xl font-bold text-yellow-400">
            {workoutMetrics.duration < 60 ? 0 :
             workoutMetrics.zone <= 2 ? 30 :
             workoutMetrics.zone <= 3 ? 45 :
             workoutMetrics.zone <= 4 ? 60 :
             workoutMetrics.zone <= 5 ? 75 : 90}g/h
          </div>
          <div className="text-xs text-muted-foreground">CHO ({Math.round(workoutMetrics.duration / 60 * (
            workoutMetrics.duration < 60 ? 0 :
            workoutMetrics.zone <= 2 ? 30 :
            workoutMetrics.zone <= 3 ? 45 :
            workoutMetrics.zone <= 4 ? 60 :
            workoutMetrics.zone <= 5 ? 75 : 90
          ))}g tot)</div>
        </div>
        <div className="text-center p-3 bg-background/50 rounded">
          <div className="text-xs text-muted-foreground">Post-Workout</div>
          <div className="text-xl font-bold text-green-400">
            {/* EMPATHY: Post-workout CHO = 0.8-1.2g/kg peso, non CHO bruciati */}
            {workoutMetrics.zone >= 5 ? Math.round((athleteData?.weight_kg || 70) * 1.2) :
             workoutMetrics.zone >= 4 ? Math.round((athleteData?.weight_kg || 70) * 1.0) :
             workoutMetrics.zone >= 3 ? Math.round((athleteData?.weight_kg || 70) * 0.8) :
             Math.round((athleteData?.weight_kg || 70) * 0.5)}g
          </div>
          <div className="text-xs text-muted-foreground">CHO + {Math.round((athleteData?.weight_kg || 70) * 0.3)}g PRO</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-xs bg-orange-900/30">
          Consumo: {workoutMetrics.kcal} kcal
        </Badge>
        <Badge variant="secondary" className="text-xs bg-orange-900/30">
          CHO bruciati: {workoutMetrics.choBurned}g
        </Badge>
        <Badge variant="secondary" className="text-xs bg-orange-900/30">
          Fat bruciati: {workoutMetrics.fatBurned}g
        </Badge>
        {workoutMetrics.duration > 90 && (
          <Badge variant="secondary" className="text-xs bg-yellow-900/30">
            Sessione lunga: aumenta CHO/h
          </Badge>
        )}
      </div>
    </div>
  )}
  
  {/* Workout Info Header */}
  {selectedActivity && (
  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {selectedActivity.title || selectedActivity.workout_name || "Allenamento"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedActivity.sport_type} - {workoutMetrics.duration} min - Zone {workoutMetrics.zone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Orario</p>
                          <p className="font-medium text-cyan-400">
                            {selectedActivity.scheduled_time || 
                              (trainingPreferences?.preferred_training_time ? 
                                `${parsePreferredTimeToHour(trainingPreferences.preferred_training_time)}:00` : 
                                "Da definire")}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pre-Workout Section */}
                    <Card className="border-orange-500/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-orange-400">
                          <Clock className="h-5 w-5" />
                          Pre-Workout (-45 min)
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Assumi 45 minuti prima dell'allenamento ({
                            selectedActivity?.scheduled_time ? 
                              (() => {
                                const [h, m] = selectedActivity.scheduled_time.split(':').map(Number)
                                const preH = m < 45 ? h - 1 : h
                                const preM = m < 45 ? 60 + m - 45 : m - 45
                                return `${String(preH).padStart(2, '0')}:${String(preM).padStart(2, '0')}`
                              })() :
                            trainingPreferences?.preferred_training_time ?
                              `${parsePreferredTimeToHour(trainingPreferences.preferred_training_time) - 1}:15` :
                              "calcola in base all'orario"
                          })
                        </p>
                      </CardHeader>
                      <CardContent>
                        {preWorkoutStack.length > 0 ? (
                          <div className="space-y-3">
                            {preWorkoutStack.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                                <div className="flex items-center gap-3">
                                  <Pill className="h-4 w-4 text-orange-400" />
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{item.note}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                                    {item.dose}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">{item.timing}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            Nessun integratore pre-workout consigliato per questo tipo di allenamento
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Intra-Workout Section */}
                    <Card className="border-cyan-500/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-cyan-400">
                          <Flame className="h-5 w-5" />
                          Intra-Workout Fueling
                        </CardTitle>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Carboidrati totali: <span className="text-cyan-400 font-medium">{intraWorkCho}g</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Durata: {workoutMetrics.duration} min
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {intraWorkoutTiming.length > 0 ? (
                          <div className="space-y-3">
                            {intraWorkoutTiming.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-cyan-600 text-white min-w-[60px] justify-center">
                                    {item.time} min
                                  </Badge>
                                  <div>
                                    <p className="font-medium">{item.product}</p>
                                    <p className="text-sm text-muted-foreground">{item.brand}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                                    {item.cho}g CHO
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : workoutMetrics.duration < 60 ? (
                          <p className="text-muted-foreground text-center py-4">
                            Per allenamenti sotto i 60 minuti, l'acqua e' sufficiente
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            Seleziona un allenamento per vedere il piano fueling
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Post-Workout Section */}
                    <Card className="border-green-500/30">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-green-400">
                          <Package className="h-5 w-5" />
                          Post-Workout Recovery
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Entro 30-60 minuti dalla fine dell'allenamento
                        </p>
                      </CardHeader>
                      <CardContent>
                        {postWorkoutStack.length > 0 ? (
                          <div className="space-y-3">
                            {postWorkoutStack.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                <div className="flex items-center gap-3">
                                  <Pill className="h-4 w-4 text-green-400" />
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{item.note}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                                    {item.dose}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">{item.timing}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            Nessun integratore post-workout consigliato
                          </p>
                        )}

                        {/* Recovery vs Whey recommendation based on workout type */}
                        <div className="mt-4 p-3 rounded-lg bg-secondary/50">
                          <p className="text-sm font-medium mb-2">Raccomandazione Recovery:</p>
                          <p className="text-sm text-muted-foreground">
                            {workoutMetrics.zone >= 4 || workoutMetrics.duration > 90 ? (
                              <>
                                <span className="text-green-400 font-medium">Recovery Drink</span> - 
                                Allenamento intenso ({workoutMetrics.zone >= 4 ? `Zone ${workoutMetrics.zone}` : `${workoutMetrics.duration}min`}). 
                                Rapporto CHO:PRO 3:1 per ripristino glicogeno e sintesi proteica.
                              </>
                            ) : workoutMetrics.zone <= 2 && workoutMetrics.duration < 60 ? (
                              <>
                                <span className="text-cyan-400 font-medium">Solo idratazione</span> - 
                                Allenamento leggero. Pasto normale sufficiente per il recupero.
                              </>
                            ) : (
                              <>
                                <span className="text-blue-400 font-medium">Whey Protein</span> - 
                                Allenamento moderato. 20-30g proteine per supportare il recupero muscolare.
                              </>
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Preferred Brands */}
                    {sportSupplements.brands.length > 0 && (
                      <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                        <p className="text-sm text-muted-foreground mb-2">Marchi preferiti configurati:</p>
                        <div className="flex flex-wrap gap-2">
                          {sportSupplements.brands.map((brand) => (
                            <Badge key={brand} variant="outline" className="border-purple-500/50 text-purple-400">
                              {brand}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Colonna Destra - Report Nutrigenomics */}
                  <div className="lg:col-span-1">
                    <NutrigenomicsPanel 
                      athleteId={athleteData?.id}
                      compact={true}
                    />
                  </div>
                </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : isLoading ? (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center py-20">
          <p>Loading Nutrition Plan...</p>
        </div>
      ) : (
        <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-center items-center py-20">
          <p>No athlete data available.</p>
        </div>
      )}
    </div>
  )
}

export default NutritionPlan
