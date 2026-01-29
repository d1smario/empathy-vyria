/**
 * EMPATHY Subscription Plans
 * 
 * Sistema di abbonamento a 4 livelli per accesso progressivo
 * alle funzionalità di monitoraggio bioenergetico
 */

export type PlanTier = 'free' | 'athlete' | 'pro' | 'elite'

export interface SubscriptionPlan {
  id: string
  tier: PlanTier
  name: string
  description: string
  priceMonthly: number // in cents
  priceYearly: number // in cents (sconto 20%)
  features: string[]
  limitations: string[]
  maxAthletes?: number // per coach plans
  dataRetentionDays: number
  aiRequestsPerDay: number
  integrations: string[]
  biomarkers: string[]
  comingSoon?: string[]
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'empathy-free',
    tier: 'free',
    name: 'EMPATHY Free',
    description: 'Inizia il tuo percorso di comprensione bioenergetica',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Dashboard base',
      'Profilo atleta',
      'Piano settimanale manuale',
      'Calcolo BMR e macros',
      'Database alimenti base (100 item)',
    ],
    limitations: [
      'No AI adaptive',
      'No integrazione device',
      'No nutrigenomica',
      'Dati ultimi 7 giorni',
    ],
    dataRetentionDays: 7,
    aiRequestsPerDay: 0,
    integrations: [],
    biomarkers: [],
  },
  {
    id: 'empathy-athlete',
    tier: 'athlete',
    name: 'EMPATHY Athlete',
    description: 'Per atleti che vogliono ottimizzare nutrizione e training',
    priceMonthly: 1499, // €14.99
    priceYearly: 14390, // €143.90 (20% off)
    features: [
      'Tutto di Free +',
      'AI Adaptive Engine',
      'Piano nutrizionale dinamico',
      'Fueling pre/intra/post workout',
      'Integrazione Garmin/Strava',
      'Integrazione TrainingPeaks',
      'Database alimenti completo (300 item)',
      'Lista della spesa automatica',
      'Report settimanali',
    ],
    limitations: [
      'No profilo genetico',
      'No profilo microbioma',
      'Dati ultimi 90 giorni',
    ],
    dataRetentionDays: 90,
    aiRequestsPerDay: 50,
    integrations: ['garmin', 'strava', 'trainingpeaks', 'polar', 'wahoo'],
    biomarkers: ['hrv', 'sleep', 'training_load'],
  },
  {
    id: 'empathy-pro',
    tier: 'pro',
    name: 'EMPATHY Pro',
    description: 'Comprensione profonda della risposta bioenergetica',
    priceMonthly: 3999, // €39.99
    priceYearly: 38390, // €383.90 (20% off)
    features: [
      'Tutto di Athlete +',
      'Profilo genetico (50 geni)',
      'Profilo microbioma (40 batteri)',
      'Nutrigenomica avanzata',
      'Cross-analisi gene-microbioma',
      'Integrazione Whoop/Oura',
      'Report epigenetici',
      'Analisi pathway metabolici',
      'Consigli detox xenobiotici',
      'Supporto prioritario',
    ],
    limitations: [
      'No monitoraggio continuo',
      'Dati ultimi 365 giorni',
    ],
    dataRetentionDays: 365,
    aiRequestsPerDay: 200,
    integrations: ['garmin', 'strava', 'trainingpeaks', 'polar', 'wahoo', 'whoop', 'oura', 'apple_health', 'samsung_health'],
    biomarkers: ['hrv', 'sleep', 'training_load', 'recovery_score', 'strain', 'readiness'],
    comingSoon: ['continuous_glucose'],
  },
  {
    id: 'empathy-elite',
    tier: 'elite',
    name: 'EMPATHY Elite',
    description: 'Massima efficienza bioenergetica con monitoraggio continuo',
    priceMonthly: 9999, // €99.99
    priceYearly: 95990, // €959.90 (20% off)
    features: [
      'Tutto di Pro +',
      'Monitoraggio glicemia continua (CGM)',
      'Integrazione sensori lattato',
      'Analisi pH e idratazione',
      'Pannello ormonale (cortisolo, testosterone)',
      'Monitoraggio NAD+ e metaboliti',
      'AI predittiva avanzata',
      'Consultazione mensile esperto',
      'API access per coach',
      'White-label per team',
      'Dati illimitati',
    ],
    limitations: [],
    maxAthletes: 50, // per coach/team
    dataRetentionDays: -1, // unlimited
    aiRequestsPerDay: -1, // unlimited
    integrations: [
      'garmin', 'strava', 'trainingpeaks', 'polar', 'wahoo', 
      'whoop', 'oura', 'apple_health', 'samsung_health',
      'dexcom', 'freestyle_libre', 'supersapiens', 'levels',
      'biosense', 'lumen'
    ],
    biomarkers: [
      'hrv', 'sleep', 'training_load', 'recovery_score', 'strain', 'readiness',
      'glucose', 'glucose_variability', 'time_in_range',
      'lactate', 'lactate_threshold',
      'cortisol', 'testosterone', 'testosterone_cortisol_ratio',
      'nad', 'ketones', 'ph'
    ],
  },
]

/**
 * Feature gates - controlla se una feature e' disponibile per un tier
 */
export const FEATURE_GATES: Record<string, PlanTier[]> = {
  // Dashboard
  'dashboard.basic': ['free', 'athlete', 'pro', 'elite'],
  'dashboard.ai_adaptive': ['athlete', 'pro', 'elite'],
  'dashboard.nutrigenomics': ['pro', 'elite'],
  'dashboard.biomarkers': ['elite'],
  
  // Nutrition
  'nutrition.basic_plan': ['free', 'athlete', 'pro', 'elite'],
  'nutrition.dynamic_plan': ['athlete', 'pro', 'elite'],
  'nutrition.fueling': ['athlete', 'pro', 'elite'],
  'nutrition.shopping_list': ['athlete', 'pro', 'elite'],
  'nutrition.gene_based': ['pro', 'elite'],
  'nutrition.microbiome_based': ['pro', 'elite'],
  
  // Training
  'training.manual': ['free', 'athlete', 'pro', 'elite'],
  'training.ai_suggestions': ['athlete', 'pro', 'elite'],
  'training.load_management': ['athlete', 'pro', 'elite'],
  'training.recovery_based': ['pro', 'elite'],
  'training.biomarker_based': ['elite'],
  
  // Integrations
  'integrations.manual_input': ['free', 'athlete', 'pro', 'elite'],
  'integrations.garmin_strava': ['athlete', 'pro', 'elite'],
  'integrations.whoop_oura': ['pro', 'elite'],
  'integrations.cgm': ['elite'],
  'integrations.lactate': ['elite'],
  'integrations.hormones': ['elite'],
  
  // AI
  'ai.basic': ['athlete', 'pro', 'elite'],
  'ai.advanced': ['pro', 'elite'],
  'ai.predictive': ['elite'],
  
  // Reports
  'reports.weekly': ['athlete', 'pro', 'elite'],
  'reports.genetic': ['pro', 'elite'],
  'reports.full_biomarker': ['elite'],
  
  // Coach features
  'coach.single_athlete': ['free', 'athlete', 'pro', 'elite'],
  'coach.multi_athlete': ['pro', 'elite'],
  'coach.team_management': ['elite'],
  'coach.api_access': ['elite'],
}

/**
 * Controlla se un utente ha accesso a una feature
 */
export function hasFeatureAccess(userTier: PlanTier, featureKey: string): boolean {
  const allowedTiers = FEATURE_GATES[featureKey]
  if (!allowedTiers) return false
  return allowedTiers.includes(userTier)
}

/**
 * Ottieni il piano per tier
 */
export function getPlanByTier(tier: PlanTier): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(p => p.tier === tier)
}

/**
 * Ottieni tutti i biomarkers disponibili per un tier
 */
export function getAvailableBiomarkers(tier: PlanTier): string[] {
  const plan = getPlanByTier(tier)
  return plan?.biomarkers || []
}

/**
 * Ottieni tutte le integrazioni disponibili per un tier
 */
export function getAvailableIntegrations(tier: PlanTier): string[] {
  const plan = getPlanByTier(tier)
  return plan?.integrations || []
}
