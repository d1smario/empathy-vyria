/**
 * EMPATHY AI Adaptive Engine API
 * 
 * Main orchestrator for the adaptive system:
 * 1. Calculates activity deltas
 * 2. Updates daily state
 * 3. Generates adaptation parameters for all sections
 * 
 * POST /api/ai/adaptive-engine
 * Body: { athleteId, action: 'calculate' | 'get_state' | 'sync_activities' }
 */

import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { 
  calculateActivityDelta, 
  calculateDeltasForDateRange,
  calculateWeeklySummary,
  type ActivityDelta 
} from "@/lib/ai-adaptive/delta-calculator"
import { 
  calculateDailyState, 
  saveDailyState, 
  loadDailyState,
  type AthleteDailyState 
} from "@/lib/ai-adaptive/daily-state-updater"

// Response types
interface AdaptationOutput {
  nutrition: NutritionAdaptation
  fueling: FuelingAdaptation
  training: TrainingAdaptation
  recovery: RecoveryAdaptation
}

interface NutritionAdaptation {
  daily_kcal: number
  kcal_adjustment: number
  cho_percent: number
  pro_percent: number
  fat_percent: number
  cho_grams: number
  pro_grams: number
  fat_grams: number
  hydration_liters: number
  notes: string[]
}

interface FuelingAdaptation {
  pre_workout_cho_g: number
  intra_workout_cho_g_per_hour: number
  post_workout_cho_g: number
  post_workout_pro_g: number
  caffeine_mg: number
  electrolytes_needed: boolean
  notes: string[]
}

interface TrainingAdaptation {
  tss_target: number
  tss_adjustment_percent: number
  max_zone: string
  recommended_zone: string
  max_duration_min: number
  intensity_cap: number // 0-1 scale
  suggested_workout_type: string
  notes: string[]
}

interface RecoveryAdaptation {
  recovery_priority: 'low' | 'medium' | 'high' | 'critical'
  sleep_target_hours: number
  active_recovery_recommended: boolean
  stretching_minutes: number
  foam_rolling_recommended: boolean
  cold_therapy_recommended: boolean
  notes: string[]
}

/**
 * Generate nutrition adaptations from daily state
 */
function generateNutritionAdaptation(
  state: AthleteDailyState,
  baseProfile: { bmr: number, daily_kcal: number, weight_kg: number }
): NutritionAdaptation {
  const notes: string[] = []
  
  // Base macros (standard endurance: 55% CHO, 20% PRO, 25% FAT)
  let choPercent = 55 + state.cho_ratio_adjustment
  let proPercent = 20 + state.pro_ratio_adjustment
  let fatPercent = 25 + state.fat_ratio_adjustment
  
  // Normalize to 100%
  const total = choPercent + proPercent + fatPercent
  choPercent = Math.round(choPercent / total * 100)
  proPercent = Math.round(proPercent / total * 100)
  fatPercent = 100 - choPercent - proPercent
  
  // Calculate grams
  const dailyKcal = state.kcal_target
  const choGrams = Math.round((dailyKcal * choPercent / 100) / 4)
  const proGrams = Math.round((dailyKcal * proPercent / 100) / 4)
  const fatGrams = Math.round((dailyKcal * fatPercent / 100) / 9)
  
  // Hydration based on weight and activity
  let hydration = baseProfile.weight_kg * 0.035 // Base: 35ml per kg
  if (state.glycogen_status === 'depleted' || state.glycogen_status === 'low') {
    hydration += 0.5 // Extra 500ml for glycogen restoration
    notes.push('Aumentare idratazione per ripristino glicogeno')
  }
  
  // Add state-based notes
  if (state.kcal_adjustment > 200) {
    notes.push(`Compensazione deficit calorico: +${state.kcal_adjustment} kcal`)
  }
  if (state.cho_ratio_adjustment > 5) {
    notes.push('Priorità carboidrati per ripristino scorte')
  }
  if (state.pro_ratio_adjustment > 5) {
    notes.push('Proteine aumentate per recupero muscolare')
  }
  
  return {
    daily_kcal: dailyKcal,
    kcal_adjustment: state.kcal_adjustment,
    cho_percent: choPercent,
    pro_percent: proPercent,
    fat_percent: fatPercent,
    cho_grams: choGrams,
    pro_grams: proGrams,
    fat_grams: fatGrams,
    hydration_liters: Math.round(hydration * 10) / 10,
    notes
  }
}

/**
 * Generate fueling adaptations from daily state
 */
function generateFuelingAdaptation(
  state: AthleteDailyState,
  plannedWorkout?: { duration_min: number, zone: string }
): FuelingAdaptation {
  const notes: string[] = []
  const workoutDuration = plannedWorkout?.duration_min || 60
  const workoutZone = plannedWorkout?.zone || state.recommended_zone
  
  // Pre-workout CHO based on glycogen status and workout intensity
  let preWorkoutCho = 30 // Base
  if (state.glycogen_status === 'depleted') {
    preWorkoutCho = 60
    notes.push('Glicogeno basso: aumentare CHO pre-workout')
  } else if (state.glycogen_status === 'low') {
    preWorkoutCho = 45
  }
  
  // Intra-workout CHO based on duration and intensity
  let intraCho = 30 // Base for <90min
  if (workoutDuration > 90) {
    intraCho = 60 // 60g/h for longer sessions
    if (workoutZone === 'z4' || workoutZone === 'z5') {
      intraCho = 90 // Up to 90g/h for high intensity
      notes.push('Allenamento intenso lungo: massimizzare CHO intra-workout')
    }
  }
  
  // Post-workout based on recovery need
  let postCho = 50
  let postPro = 25
  if (state.recovery_need === 'high' || state.recovery_need === 'critical') {
    postCho = 80
    postPro = 35
    notes.push('Recupero prioritario: finestra anabolica importante')
  }
  
  // Caffeine (skip if high fatigue or afternoon workout)
  let caffeine = 100 // mg, standard
  if (state.fatigue_score > 70) {
    caffeine = 0
    notes.push('Fatica elevata: evitare caffeina per favorire recupero')
  }
  
  // Electrolytes
  const electrolytesNeeded = workoutDuration > 60 || state.hydration_status !== 'optimal'
  
  return {
    pre_workout_cho_g: preWorkoutCho,
    intra_workout_cho_g_per_hour: intraCho,
    post_workout_cho_g: postCho,
    post_workout_pro_g: postPro,
    caffeine_mg: caffeine,
    electrolytes_needed: electrolytesNeeded,
    notes
  }
}

/**
 * Generate training adaptations from daily state
 */
function generateTrainingAdaptation(
  state: AthleteDailyState,
  plannedWorkout?: { tss: number, duration_min: number, zone: string }
): TrainingAdaptation {
  const notes: string[] = []
  
  const plannedTss = plannedWorkout?.tss || 80
  const plannedDuration = plannedWorkout?.duration_min || 60
  
  // Adjust TSS based on capacity
  const tssTarget = Math.min(plannedTss, state.tss_capacity)
  const tssAdjustment = state.tss_adjustment_percent
  
  // Duration cap based on recovery need
  let maxDuration = plannedDuration
  if (state.recovery_need === 'critical') {
    maxDuration = 45
    notes.push('Recupero critico: limitare durata a 45min')
  } else if (state.recovery_need === 'high') {
    maxDuration = Math.min(plannedDuration, 90)
    notes.push('Alto bisogno recupero: max 90min')
  }
  
  // Intensity cap
  let intensityCap = 1.0
  if (state.recovery_need === 'critical') {
    intensityCap = 0.6
  } else if (state.recovery_need === 'high') {
    intensityCap = 0.75
  } else if (state.glycogen_status === 'depleted') {
    intensityCap = 0.7
    notes.push('Glicogeno basso: limitare intensità')
  }
  
  // Suggested workout type
  let suggestedType = plannedWorkout?.zone || 'endurance'
  if (state.recovery_need === 'critical') {
    suggestedType = 'recovery'
    notes.push('Consigliato: recupero attivo o riposo completo')
  } else if (state.recovery_need === 'high') {
    suggestedType = 'endurance'
    notes.push('Consigliato: allenamento aerobico leggero')
  }
  
  // Add zone-based notes
  if (state.max_zone_today !== state.recommended_zone) {
    notes.push(`Zona max oggi: ${state.max_zone_today} (consigliata: ${state.recommended_zone})`)
  }
  
  return {
    tss_target: tssTarget,
    tss_adjustment_percent: tssAdjustment,
    max_zone: state.max_zone_today,
    recommended_zone: state.recommended_zone,
    max_duration_min: maxDuration,
    intensity_cap: intensityCap,
    suggested_workout_type: suggestedType,
    notes
  }
}

/**
 * Generate recovery adaptations from daily state
 */
function generateRecoveryAdaptation(state: AthleteDailyState): RecoveryAdaptation {
  const notes: string[] = []
  
  // Sleep target based on recovery need
  let sleepTarget = 7.5
  if (state.recovery_need === 'critical') {
    sleepTarget = 9
    notes.push('Priorità assoluta: sonno di qualità')
  } else if (state.recovery_need === 'high') {
    sleepTarget = 8.5
    notes.push('Aumentare ore di sonno')
  }
  
  // Active recovery
  const activeRecovery = state.recovery_need !== 'critical' && state.fatigue_score < 80
  
  // Stretching
  let stretching = 10
  if (state.recovery_need === 'high' || state.recovery_need === 'critical') {
    stretching = 20
    notes.push('Stretching prolungato consigliato')
  }
  
  // Cold therapy for high fatigue
  const coldTherapy = state.fatigue_score > 70
  if (coldTherapy) {
    notes.push('Crioterapia/doccia fredda può accelerare recupero')
  }
  
  return {
    recovery_priority: state.recovery_need,
    sleep_target_hours: sleepTarget,
    active_recovery_recommended: activeRecovery,
    stretching_minutes: stretching,
    foam_rolling_recommended: state.fatigue_score > 50,
    cold_therapy_recommended: coldTherapy,
    notes
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { athleteId, action, date } = body
    
    if (!athleteId) {
      return NextResponse.json({ error: "athleteId required" }, { status: 400 })
    }
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        }
      }
    )
    
    const targetDate = date || new Date().toISOString().split('T')[0]
    
    // Get athlete data
    const { data: athlete } = await supabase
      .from('athletes')
      .select('*, metabolic_profiles(*)')
      .eq('id', athleteId)
      .single()
    
    if (!athlete) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 })
    }
    
    // Calculate base metabolic data
    const weight = athlete.weight_kg || 70
    const bmr = athlete.metabolic_profiles?.bmr || (weight * 24) // Simple BMR estimate
    const dailyKcal = bmr * 1.5 // Moderate activity multiplier
    const baseProfile = { bmr, daily_kcal: dailyKcal, weight_kg: weight }
    
    if (action === 'get_state') {
      // Just return current state
      const state = await loadDailyState(athleteId, targetDate)
      return NextResponse.json({ 
        success: true,
        state,
        date: targetDate
      })
    }
    
    if (action === 'calculate' || action === 'sync_activities') {
      // Calculate deltas for last 7 days
      const startDate = new Date(targetDate)
      startDate.setDate(startDate.getDate() - 7)
      
      // Fetch activities
      const { data: activities } = await supabase
        .from('training_activities')
        .select('*')
        .eq('athlete_id', athleteId)
        .gte('activity_date', startDate.toISOString().split('T')[0])
        .lte('activity_date', targetDate)
        .order('activity_date', { ascending: true })
      
      // Fetch planned workouts
      const { data: plannedData } = await supabase
        .from('planned_workouts')
        .select('*')
        .eq('athlete_id', athleteId)
      
      // Calculate deltas
      const deltas: ActivityDelta[] = []
      for (const activity of activities || []) {
        const delta = calculateActivityDelta(athleteId, activity, null) // Simplified matching
        deltas.push(delta)
      }
      
      // Get planned workout for today
      const todayDow = new Date(targetDate).getDay()
      const adjustedDow = todayDow === 0 ? 6 : todayDow - 1
      const plannedToday = plannedData?.find(p => p.day_of_week === adjustedDow)
      
      // Calculate daily state
      const state = await calculateDailyState(
        athleteId,
        targetDate,
        deltas,
        { bmr, daily_kcal: dailyKcal },
        plannedToday ? { zone: plannedToday.target_zone || 'z2', tss: plannedToday.target_tss || 80 } : undefined
      )
      
      // Save state
      await saveDailyState(athleteId, state)
      
      // Generate adaptations
      const adaptations: AdaptationOutput = {
        nutrition: generateNutritionAdaptation(state, baseProfile),
        fueling: generateFuelingAdaptation(state, plannedToday ? {
          duration_min: plannedToday.duration_minutes || 60,
          zone: plannedToday.target_zone || 'z2'
        } : undefined),
        training: generateTrainingAdaptation(state, plannedToday ? {
          tss: plannedToday.target_tss || 80,
          duration_min: plannedToday.duration_minutes || 60,
          zone: plannedToday.target_zone || 'z2'
        } : undefined),
        recovery: generateRecoveryAdaptation(state)
      }
      
      // Save adaptations to config_json
      const { data: existingPlan } = await supabase
        .from('annual_training_plans')
        .select('id, config_json')
        .eq('athlete_id', athleteId)
        .eq('year', new Date().getFullYear())
        .maybeSingle()
      
      if (existingPlan) {
        const updatedConfig = {
          ...existingPlan.config_json,
          current_adaptations: {
            date: targetDate,
            ...adaptations,
            updated_at: new Date().toISOString()
          }
        }
        
        await supabase
          .from('annual_training_plans')
          .update({ config_json: updatedConfig })
          .eq('id', existingPlan.id)
      }
      
      return NextResponse.json({
        success: true,
        date: targetDate,
        state,
        adaptations,
        deltas_summary: calculateWeeklySummary(deltas)
      })
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    
  } catch (error) {
    console.error('[AdaptiveEngine] Error:', error)
    return NextResponse.json({ 
      error: "Internal error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const athleteId = searchParams.get('athleteId')
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  if (!athleteId) {
    return NextResponse.json({ error: "athleteId required" }, { status: 400 })
  }
  
  const state = await loadDailyState(athleteId, date)
  
  return NextResponse.json({
    success: true,
    date,
    state
  })
}
