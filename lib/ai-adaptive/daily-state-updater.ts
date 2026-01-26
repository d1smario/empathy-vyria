/**
 * EMPATHY AI Adaptive System - Daily State Updater
 * 
 * Calculates and updates the athlete's daily state based on:
 * - Activity deltas (planned vs actual)
 * - Accumulated fatigue
 * - Glycogen status
 * - Recovery needs
 * 
 * This state drives all adaptive regeneration of plans.
 */

import { createBrowserClient } from "@supabase/ssr"
import { ActivityDelta, calculateWeeklySummary } from "./delta-calculator"

// Types for daily state
export interface AthleteDailyState {
  athlete_id: string
  state_date: string
  // Fatigue & Recovery
  fatigue_score: number // 0-100
  recovery_need: 'low' | 'medium' | 'high' | 'critical'
  glycogen_status: 'depleted' | 'low' | 'normal' | 'loaded'
  hydration_status: 'dehydrated' | 'low' | 'normal' | 'optimal'
  // Caloric Balance
  kcal_target: number
  kcal_adjustment: number // delta from base
  kcal_debt: number // accumulated deficit/surplus
  // Macro Adjustments
  cho_ratio_adjustment: number // % adjustment
  pro_ratio_adjustment: number
  fat_ratio_adjustment: number
  // Training Adjustments
  tss_capacity: number // max TSS athlete can handle today
  tss_adjustment_percent: number // % of planned TSS
  recommended_zone: string
  max_zone_today: string
  // Context
  training_phase: string
  days_to_event: number | null
  // AI Notes
  ai_notes: string
  adaptation_reasons: string[]
  factors: Record<string, any>
}

// EMPATHY adaptation rules
const EMPATHY_RULES = {
  // Fatigue thresholds
  FATIGUE_LOW: 30,
  FATIGUE_MEDIUM: 50,
  FATIGUE_HIGH: 70,
  FATIGUE_CRITICAL: 85,
  
  // Glycogen depletion thresholds (based on TSS and CHO intake)
  GLYCOGEN_DEPLETION_PER_TSS: 0.5, // grams per TSS point
  GLYCOGEN_RESTORE_RATE: 5, // grams per hour of recovery
  GLYCOGEN_MAX: 500, // grams
  GLYCOGEN_LOW_THRESHOLD: 200,
  GLYCOGEN_DEPLETED_THRESHOLD: 100,
  
  // Recovery multipliers
  RECOVERY_SLEEP_FACTOR: 0.3,
  RECOVERY_NUTRITION_FACTOR: 0.3,
  RECOVERY_TIME_FACTOR: 0.4,
  
  // TSS capacity based on fatigue
  TSS_CAPACITY_BASE: 150,
  TSS_REDUCTION_PER_FATIGUE: 1.5, // reduce 1.5 TSS per fatigue point
}

/**
 * Calculate glycogen status based on recent activity and recovery
 */
function calculateGlycogenStatus(
  recentDeltas: ActivityDelta[],
  hoursRecovery: number,
  choIntake: number // estimated CHO intake in grams
): { status: AthleteDailyState['glycogen_status'], level: number } {
  // Start with full glycogen
  let glycogen = EMPATHY_RULES.GLYCOGEN_MAX
  
  // Deplete based on TSS from recent activities
  const totalTss = recentDeltas.reduce((sum, d) => sum + d.actual_tss, 0)
  glycogen -= totalTss * EMPATHY_RULES.GLYCOGEN_DEPLETION_PER_TSS
  
  // Restore based on recovery time and CHO intake
  glycogen += hoursRecovery * EMPATHY_RULES.GLYCOGEN_RESTORE_RATE
  glycogen += choIntake * 0.8 // 80% absorption rate
  
  // Cap at max
  glycogen = Math.max(0, Math.min(EMPATHY_RULES.GLYCOGEN_MAX, glycogen))
  
  // Determine status
  let status: AthleteDailyState['glycogen_status']
  if (glycogen < EMPATHY_RULES.GLYCOGEN_DEPLETED_THRESHOLD) {
    status = 'depleted'
  } else if (glycogen < EMPATHY_RULES.GLYCOGEN_LOW_THRESHOLD) {
    status = 'low'
  } else if (glycogen < EMPATHY_RULES.GLYCOGEN_MAX * 0.9) {
    status = 'normal'
  } else {
    status = 'loaded'
  }
  
  return { status, level: Math.round(glycogen) }
}

/**
 * Calculate recovery need based on fatigue and recent load
 */
function calculateRecoveryNeed(
  fatigueScore: number,
  deltaTssYesterday: number
): AthleteDailyState['recovery_need'] {
  // High delta yesterday increases recovery need
  const loadFactor = deltaTssYesterday > 30 ? 20 : deltaTssYesterday > 0 ? 10 : 0
  const effectiveFatigue = fatigueScore + loadFactor
  
  if (effectiveFatigue >= EMPATHY_RULES.FATIGUE_CRITICAL) return 'critical'
  if (effectiveFatigue >= EMPATHY_RULES.FATIGUE_HIGH) return 'high'
  if (effectiveFatigue >= EMPATHY_RULES.FATIGUE_MEDIUM) return 'medium'
  return 'low'
}

/**
 * Calculate TSS capacity for today
 */
function calculateTssCapacity(fatigueScore: number): number {
  const reduction = fatigueScore * EMPATHY_RULES.TSS_REDUCTION_PER_FATIGUE
  return Math.max(20, Math.round(EMPATHY_RULES.TSS_CAPACITY_BASE - reduction))
}

/**
 * Determine recommended zone based on state
 */
function calculateRecommendedZone(
  recoveryNeed: AthleteDailyState['recovery_need'],
  glycogenStatus: AthleteDailyState['glycogen_status'],
  plannedZone: string
): { recommended: string, max: string } {
  // Critical recovery = only Z1
  if (recoveryNeed === 'critical') {
    return { recommended: 'z1', max: 'z1' }
  }
  
  // High recovery or depleted glycogen = max Z2
  if (recoveryNeed === 'high' || glycogenStatus === 'depleted') {
    return { recommended: 'z2', max: 'z2' }
  }
  
  // Medium recovery or low glycogen = max Z3
  if (recoveryNeed === 'medium' || glycogenStatus === 'low') {
    return { recommended: 'z2', max: 'z3' }
  }
  
  // Normal state - can follow plan
  return { recommended: plannedZone, max: 'z5' }
}

/**
 * Calculate caloric adjustments based on state
 */
function calculateCaloricAdjustments(
  baseKcal: number,
  deltaTss: number,
  deltaKcal: number,
  glycogenStatus: AthleteDailyState['glycogen_status'],
  recoveryNeed: AthleteDailyState['recovery_need']
): {
  target: number
  adjustment: number
  choAdjust: number
  proAdjust: number
  fatAdjust: number
} {
  let adjustment = 0
  let choAdjust = 0
  let proAdjust = 0
  let fatAdjust = 0
  
  // Compensate for caloric debt from yesterday
  if (deltaKcal > 200) {
    adjustment += Math.min(400, deltaKcal * 0.5) // Recover 50% of debt, max 400
  }
  
  // Glycogen restoration needs more CHO
  if (glycogenStatus === 'depleted') {
    choAdjust = 15 // +15% CHO
    adjustment += 200 // Extra calories for glycogen
  } else if (glycogenStatus === 'low') {
    choAdjust = 10 // +10% CHO
    adjustment += 100
  }
  
  // Recovery needs more protein
  if (recoveryNeed === 'high' || recoveryNeed === 'critical') {
    proAdjust = 10 // +10% protein
    adjustment += 150 // Extra for recovery
  }
  
  // High TSS delta needs compensation
  if (deltaTss > 30) {
    adjustment += deltaTss * 3 // ~3 kcal per extra TSS
  }
  
  return {
    target: Math.round(baseKcal + adjustment),
    adjustment: Math.round(adjustment),
    choAdjust,
    proAdjust,
    fatAdjust: -choAdjust - proAdjust // Balance by reducing fat
  }
}

/**
 * Generate AI notes explaining the adaptations
 */
function generateAiNotes(state: Partial<AthleteDailyState>): {
  notes: string
  reasons: string[]
} {
  const reasons: string[] = []
  
  if (state.fatigue_score && state.fatigue_score > EMPATHY_RULES.FATIGUE_HIGH) {
    reasons.push(`Fatica elevata (${state.fatigue_score}/100) - riduzione carico consigliata`)
  }
  
  if (state.glycogen_status === 'depleted') {
    reasons.push('Glicogeno esaurito - priorità ripristino scorte con CHO extra')
  } else if (state.glycogen_status === 'low') {
    reasons.push('Glicogeno basso - aumentare apporto carboidrati')
  }
  
  if (state.recovery_need === 'critical') {
    reasons.push('Recupero critico necessario - solo attività rigenerativa')
  } else if (state.recovery_need === 'high') {
    reasons.push('Alto bisogno di recupero - limitare intensità')
  }
  
  if (state.kcal_adjustment && state.kcal_adjustment > 200) {
    reasons.push(`Deficit calorico da compensare (+${state.kcal_adjustment} kcal)`)
  }
  
  const notes = reasons.length > 0 
    ? `Adattamenti EMPATHY: ${reasons.join('. ')}`
    : 'Stato ottimale - seguire piano standard'
  
  return { notes, reasons }
}

/**
 * Calculate complete daily state for an athlete
 */
export async function calculateDailyState(
  athleteId: string,
  date: string,
  recentDeltas: ActivityDelta[],
  metabolicProfile?: { bmr: number, daily_kcal: number },
  plannedWorkout?: { zone: string, tss: number }
): Promise<AthleteDailyState> {
  // Get yesterday's delta for immediate recovery calculation
  const yesterday = new Date(date)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const yesterdayDelta = recentDeltas.find(d => d.delta_date === yesterdayStr)
  
  // Calculate weekly summary
  const weeklySummary = calculateWeeklySummary(recentDeltas)
  
  // Calculate fatigue score (base + accumulated from deltas)
  const baseFatigue = 30 // Starting point
  const accumulatedFatigue = Math.min(50, weeklySummary.cumulative_fatigue)
  const fatigueScore = Math.min(100, baseFatigue + accumulatedFatigue)
  
  // Calculate glycogen status
  const hoursRecovery = yesterdayDelta ? 12 : 24 // Assume 12h if trained yesterday
  const estimatedChoIntake = metabolicProfile ? metabolicProfile.daily_kcal * 0.5 / 4 : 300 // ~50% from CHO
  const { status: glycogenStatus, level: glycogenLevel } = calculateGlycogenStatus(
    recentDeltas.slice(-3), // Last 3 days
    hoursRecovery,
    estimatedChoIntake
  )
  
  // Calculate recovery need
  const recoveryNeed = calculateRecoveryNeed(
    fatigueScore,
    yesterdayDelta?.delta_tss || 0
  )
  
  // Calculate TSS capacity
  const tssCapacity = calculateTssCapacity(fatigueScore)
  const tssAdjustment = plannedWorkout 
    ? Math.round((tssCapacity / Math.max(plannedWorkout.tss, 50)) * 100)
    : 100
  
  // Calculate zone recommendations
  const { recommended, max } = calculateRecommendedZone(
    recoveryNeed,
    glycogenStatus,
    plannedWorkout?.zone || 'z2'
  )
  
  // Calculate caloric adjustments
  const baseKcal = metabolicProfile?.daily_kcal || 2500
  const caloric = calculateCaloricAdjustments(
    baseKcal,
    weeklySummary.total_delta_tss,
    weeklySummary.total_delta_kcal,
    glycogenStatus,
    recoveryNeed
  )
  
  // Generate AI notes
  const partialState = {
    fatigue_score: fatigueScore,
    glycogen_status: glycogenStatus,
    recovery_need: recoveryNeed,
    kcal_adjustment: caloric.adjustment
  }
  const { notes, reasons } = generateAiNotes(partialState)
  
  return {
    athlete_id: athleteId,
    state_date: date,
    // Fatigue & Recovery
    fatigue_score: fatigueScore,
    recovery_need: recoveryNeed,
    glycogen_status: glycogenStatus,
    hydration_status: 'normal', // TODO: integrate with wearables
    // Caloric Balance
    kcal_target: caloric.target,
    kcal_adjustment: caloric.adjustment,
    kcal_debt: weeklySummary.total_delta_kcal,
    // Macro Adjustments
    cho_ratio_adjustment: caloric.choAdjust,
    pro_ratio_adjustment: caloric.proAdjust,
    fat_ratio_adjustment: caloric.fatAdjust,
    // Training Adjustments
    tss_capacity: tssCapacity,
    tss_adjustment_percent: Math.min(120, Math.max(50, tssAdjustment)),
    recommended_zone: recommended,
    max_zone_today: max,
    // Context
    training_phase: 'build', // TODO: read from mesocycle
    days_to_event: null, // TODO: calculate from goals
    // AI Notes
    ai_notes: notes,
    adaptation_reasons: reasons,
    factors: {
      weekly_summary: weeklySummary,
      glycogen_level: glycogenLevel,
      yesterday_delta: yesterdayDelta
    }
  }
}

/**
 * Save daily state to database (in annual_training_plans.config_json)
 */
export async function saveDailyState(
  athleteId: string,
  state: AthleteDailyState
): Promise<boolean> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const currentYear = new Date().getFullYear()
  
  // Get existing annual plan
  const { data: existingPlan, error: fetchError } = await supabase
    .from('annual_training_plans')
    .select('id, config_json')
    .eq('athlete_id', athleteId)
    .eq('year', currentYear)
    .maybeSingle()
  
  if (fetchError) {
    console.error('[DailyState] Error fetching annual plan:', fetchError)
    return false
  }
  
  // Merge state into config_json
  const existingConfig = existingPlan?.config_json || {}
  const dailyStates = existingConfig.daily_states || {}
  dailyStates[state.state_date] = state
  
  // Keep only last 14 days of states
  const sortedDates = Object.keys(dailyStates).sort().reverse()
  const recentStates: Record<string, AthleteDailyState> = {}
  for (const date of sortedDates.slice(0, 14)) {
    recentStates[date] = dailyStates[date]
  }
  
  const updatedConfig = {
    ...existingConfig,
    daily_states: recentStates,
    last_state_update: new Date().toISOString()
  }
  
  if (existingPlan) {
    // Update existing
    const { error } = await supabase
      .from('annual_training_plans')
      .update({ config_json: updatedConfig })
      .eq('id', existingPlan.id)
    
    if (error) {
      console.error('[DailyState] Error updating:', error)
      return false
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('annual_training_plans')
      .insert({
        athlete_id: athleteId,
        year: currentYear,
        name: `Piano ${currentYear}`,
        config_json: updatedConfig
      })
    
    if (error) {
      console.error('[DailyState] Error creating:', error)
      return false
    }
  }
  
  return true
}

/**
 * Load daily state from database
 */
export async function loadDailyState(
  athleteId: string,
  date: string
): Promise<AthleteDailyState | null> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const currentYear = new Date().getFullYear()
  
  const { data, error } = await supabase
    .from('annual_training_plans')
    .select('config_json')
    .eq('athlete_id', athleteId)
    .eq('year', currentYear)
    .maybeSingle()
  
  if (error || !data?.config_json?.daily_states) {
    return null
  }
  
  return data.config_json.daily_states[date] || null
}
