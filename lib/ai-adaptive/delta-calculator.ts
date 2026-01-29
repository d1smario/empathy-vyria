/**
 * EMPATHY AI Adaptive System - Delta Calculator
 * 
 * Calculates differences between planned and actual workouts.
 * Used to track training load variations and trigger adaptations.
 */

import { createBrowserClient } from "@supabase/ssr"

// Types for delta calculations
export interface PlannedWorkout {
  id: string
  day_of_week: number
  workout_type: string
  sport: string
  duration_minutes: number
  target_tss: number
  target_zone: string
  estimated_kcal: number
  scheduled_time?: string
}

export interface ActualActivity {
  id: string
  activity_date: string
  title: string
  sport: string
  duration_seconds: number
  tss: number
  avg_hr: number
  avg_power: number
  calories: number
  zones_distribution?: Record<string, number>
}

export interface ActivityDelta {
  athlete_id: string
  activity_id: string
  planned_workout_id?: string
  delta_date: string
  // Planned values
  planned_duration_min: number
  planned_tss: number
  planned_kcal: number
  planned_zone: string
  // Actual values
  actual_duration_min: number
  actual_tss: number
  actual_kcal: number
  actual_avg_zone: string
  // Calculated deltas
  delta_duration_min: number
  delta_tss: number
  delta_kcal: number
  delta_intensity: number // -1 to +1 scale
  delta_fatigue_score: number
}

// Zone mapping for intensity calculations
const ZONE_INTENSITY: Record<string, number> = {
  'z1': 1, 'recovery': 1, 'recupero': 1,
  'z2': 2, 'endurance': 2, 'resistenza': 2,
  'z3': 3, 'tempo': 3,
  'z4': 4, 'threshold': 4, 'soglia': 4,
  'z5': 5, 'vo2max': 5,
  'z6': 6, 'anaerobic': 6,
  'z7': 7, 'neuromuscular': 7
}

/**
 * Calculate the dominant zone from zones distribution
 */
function calculateDominantZone(zonesDistribution?: Record<string, number>): string {
  if (!zonesDistribution) return 'z2'
  
  let maxTime = 0
  let dominantZone = 'z2'
  
  for (const [zone, time] of Object.entries(zonesDistribution)) {
    if (time > maxTime) {
      maxTime = time
      dominantZone = zone
    }
  }
  
  return dominantZone
}

/**
 * Calculate fatigue score based on TSS and intensity delta
 */
function calculateFatigueScore(deltaTss: number, deltaIntensity: number): number {
  // Base fatigue from TSS delta
  let fatigue = deltaTss * 0.1 // 10 TSS extra = 1 fatigue point
  
  // Amplify if intensity was higher
  if (deltaIntensity > 0) {
    fatigue *= (1 + deltaIntensity * 0.5) // Up to 50% more fatigue for higher intensity
  }
  
  // Cap fatigue score between -20 and +30
  return Math.max(-20, Math.min(30, Math.round(fatigue)))
}

/**
 * Match actual activity to planned workout
 */
function matchActivityToPlanned(
  activity: ActualActivity,
  plannedWorkouts: PlannedWorkout[]
): PlannedWorkout | null {
  const activityDate = new Date(activity.activity_date)
  const dayOfWeek = activityDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Find planned workout for same day and similar sport
  const candidates = plannedWorkouts.filter(pw => {
    const plannedDay = pw.day_of_week // 0 = Monday in our system
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Convert to Monday = 0
    return plannedDay === adjustedDay
  })
  
  if (candidates.length === 0) return null
  
  // If multiple, match by sport
  const sportMatch = candidates.find(pw => 
    pw.sport?.toLowerCase() === activity.sport?.toLowerCase()
  )
  
  return sportMatch || candidates[0]
}

/**
 * Calculate delta between planned and actual workout
 */
export function calculateActivityDelta(
  athleteId: string,
  activity: ActualActivity,
  plannedWorkout: PlannedWorkout | null
): ActivityDelta {
  const actualDurationMin = Math.round(activity.duration_seconds / 60)
  const actualZone = calculateDominantZone(activity.zones_distribution)
  
  // If no planned workout, use defaults
  const planned = plannedWorkout || {
    id: '',
    day_of_week: 0,
    workout_type: 'unplanned',
    sport: activity.sport,
    duration_minutes: 0,
    target_tss: 0,
    target_zone: 'z2',
    estimated_kcal: 0
  }
  
  // Calculate deltas
  const deltaDuration = actualDurationMin - planned.duration_minutes
  const deltaTss = activity.tss - planned.target_tss
  const deltaKcal = activity.calories - planned.estimated_kcal
  
  // Calculate intensity delta (-1 to +1)
  const plannedIntensity = ZONE_INTENSITY[planned.target_zone.toLowerCase()] || 2
  const actualIntensity = ZONE_INTENSITY[actualZone.toLowerCase()] || 2
  const deltaIntensity = (actualIntensity - plannedIntensity) / 3 // Normalize to -1 to +1 range
  
  // Calculate fatigue score
  const fatigueScore = calculateFatigueScore(deltaTss, deltaIntensity)
  
  return {
    athlete_id: athleteId,
    activity_id: activity.id,
    planned_workout_id: planned.id || undefined,
    delta_date: activity.activity_date,
    // Planned
    planned_duration_min: planned.duration_minutes,
    planned_tss: planned.target_tss,
    planned_kcal: planned.estimated_kcal,
    planned_zone: planned.target_zone,
    // Actual
    actual_duration_min: actualDurationMin,
    actual_tss: activity.tss,
    actual_kcal: activity.calories,
    actual_avg_zone: actualZone,
    // Deltas
    delta_duration_min: deltaDuration,
    delta_tss: deltaTss,
    delta_kcal: deltaKcal,
    delta_intensity: Math.round(deltaIntensity * 100) / 100,
    delta_fatigue_score: fatigueScore
  }
}

/**
 * Process all activities for a date range and calculate deltas
 */
export async function calculateDeltasForDateRange(
  athleteId: string,
  startDate: string,
  endDate: string
): Promise<ActivityDelta[]> {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // Fetch actual activities
  const { data: activities, error: activitiesError } = await supabase
    .from('training_activities')
    .select('*')
    .eq('athlete_id', athleteId)
    .gte('activity_date', startDate)
    .lte('activity_date', endDate)
    .order('activity_date', { ascending: true })
  
  if (activitiesError || !activities) {
    console.error('[DeltaCalculator] Error fetching activities:', activitiesError)
    return []
  }
  
  // Fetch planned workouts for the period
  const { data: plannedData, error: plannedError } = await supabase
    .from('planned_workouts')
    .select(`
      *,
      training_weeks!inner(
        week_start_date,
        training_mesocycles!inner(
          annual_training_plans!inner(athlete_id)
        )
      )
    `)
    .eq('training_weeks.training_mesocycles.annual_training_plans.athlete_id', athleteId)
  
  const plannedWorkouts: PlannedWorkout[] = plannedData || []
  
  // Calculate deltas for each activity
  const deltas: ActivityDelta[] = []
  
  for (const activity of activities) {
    const matchedPlanned = matchActivityToPlanned(activity, plannedWorkouts)
    const delta = calculateActivityDelta(athleteId, activity, matchedPlanned)
    deltas.push(delta)
  }
  
  return deltas
}

/**
 * Calculate weekly summary of deltas
 */
export function calculateWeeklySummary(deltas: ActivityDelta[]): {
  total_delta_tss: number
  total_delta_kcal: number
  total_delta_duration: number
  avg_intensity_delta: number
  cumulative_fatigue: number
  activities_count: number
  unplanned_count: number
} {
  if (deltas.length === 0) {
    return {
      total_delta_tss: 0,
      total_delta_kcal: 0,
      total_delta_duration: 0,
      avg_intensity_delta: 0,
      cumulative_fatigue: 0,
      activities_count: 0,
      unplanned_count: 0
    }
  }
  
  const totals = deltas.reduce((acc, d) => ({
    tss: acc.tss + d.delta_tss,
    kcal: acc.kcal + d.delta_kcal,
    duration: acc.duration + d.delta_duration_min,
    intensity: acc.intensity + d.delta_intensity,
    fatigue: acc.fatigue + d.delta_fatigue_score,
    unplanned: acc.unplanned + (d.planned_workout_id ? 0 : 1)
  }), { tss: 0, kcal: 0, duration: 0, intensity: 0, fatigue: 0, unplanned: 0 })
  
  return {
    total_delta_tss: totals.tss,
    total_delta_kcal: totals.kcal,
    total_delta_duration: totals.duration,
    avg_intensity_delta: Math.round((totals.intensity / deltas.length) * 100) / 100,
    cumulative_fatigue: Math.round(totals.fatigue),
    activities_count: deltas.length,
    unplanned_count: totals.unplanned
  }
}
