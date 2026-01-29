import type {
  RookActivityEvent,
  RookSleepSummary,
  RookPhysicalSummary,
  RookBodySummary,
  MappedActivity,
  MappedSleep,
  MappedBodyMetrics,
  RookProvider,
} from './types'
import { mapActivityType, estimateTSS } from './providers'

// =====================================================
// DATA MAPPERS
// Maps Rook data structures to EMPATHY database schema
// =====================================================

/**
 * Map Rook activity event to EMPATHY imported_activities format
 */
export function mapActivityEvent(
  event: RookActivityEvent,
  userFtp?: number,
  userLthr?: number
): MappedActivity {
  const { type, subtype } = mapActivityType(event.activity_type_id, event.activity_type)
  
  // Calculate TSS if we have the data
  const tss = estimateTSS(
    event.duration_seconds,
    event.hr_avg_bpm,
    event.hr_max_bpm,
    event.power_avg_watts,
    userFtp,
    userLthr
  )
  
  // Calculate normalized power if we have power data
  let normalizedPower: number | undefined
  if (event.power_avg_watts && event.power_max_watts) {
    // Simplified NP estimate (actual NP requires second-by-second data)
    // Use variability index approximation
    const variability = event.power_max_watts / event.power_avg_watts
    normalizedPower = Math.round(event.power_avg_watts * (1 + (variability - 1) * 0.1))
  }

  return {
    source_provider: event.data_source,
    source_id: event.activity_id,
    activity_date: event.date,
    activity_datetime: event.start_time,
    activity_type: type,
    activity_subtype: subtype,
    title: `${event.activity_type} - ${formatDuration(event.duration_seconds)}`,
    duration_seconds: event.duration_seconds,
    distance_meters: event.distance_meters,
    elevation_gain_meters: event.elevation_gain_meters,
    calories: event.calories_kcal,
    avg_heart_rate: event.hr_avg_bpm,
    max_heart_rate: event.hr_max_bpm,
    avg_power_watts: event.power_avg_watts,
    normalized_power: normalizedPower,
    tss,
    raw_data: event,
  }
}

/**
 * Map Rook sleep summary to EMPATHY imported_sleep_data format
 */
export function mapSleepSummary(summary: RookSleepSummary): MappedSleep {
  return {
    source_provider: summary.data_source,
    sleep_date: summary.date,
    bed_time: summary.sleep_start_time,
    wake_time: summary.sleep_end_time,
    total_sleep_minutes: Math.round(summary.sleep_duration_seconds / 60),
    light_sleep_minutes: Math.round(summary.light_sleep_seconds / 60),
    deep_sleep_minutes: Math.round(summary.deep_sleep_seconds / 60),
    rem_sleep_minutes: Math.round(summary.rem_sleep_seconds / 60),
    awake_minutes: Math.round(summary.time_awake_seconds / 60),
    sleep_efficiency: summary.sleep_efficiency,
    sleep_score: summary.sleep_score,
    avg_heart_rate: summary.hr_avg_bpm,
    avg_hrv_ms: summary.hrv_avg_rmssd_ms,
    raw_data: summary,
  }
}

/**
 * Map Rook physical/body summary to EMPATHY imported_body_metrics format
 */
export function mapPhysicalSummary(
  summary: RookPhysicalSummary,
  bodySummary?: RookBodySummary
): MappedBodyMetrics {
  return {
    source_provider: summary.data_source,
    metric_date: summary.date,
    weight_kg: bodySummary?.weight_kg,
    body_fat_percentage: bodySummary?.body_fat_percentage,
    resting_heart_rate: summary.hr_min_bpm, // Approximate resting HR
    hrv_ms: summary.hrv_avg_rmssd_ms,
    steps: summary.steps,
    active_calories: summary.active_calories_kcal,
    recovery_score: calculateRecoveryScore(summary),
    readiness_score: undefined, // Provider-specific, set separately if available
    raw_data: summary,
  }
}

/**
 * Calculate a recovery score from physical metrics
 * Scale 0-100
 */
function calculateRecoveryScore(summary: RookPhysicalSummary): number | undefined {
  // If provider gives HRV, use it as primary indicator
  if (summary.hrv_avg_rmssd_ms) {
    // Normalize HRV (typical range 20-100ms)
    const hrvScore = Math.min(100, Math.max(0, (summary.hrv_avg_rmssd_ms - 20) * 1.25))
    return Math.round(hrvScore)
  }
  
  // If we have recovery duration, use ratio of recovery to stress
  if (summary.recovery_duration_seconds && summary.stress_duration_seconds) {
    const totalTime = summary.recovery_duration_seconds + summary.stress_duration_seconds
    if (totalTime > 0) {
      return Math.round((summary.recovery_duration_seconds / totalTime) * 100)
    }
  }
  
  return undefined
}

/**
 * Format duration in seconds to human readable string
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// =====================================================
// DATABASE INSERT FORMATTERS
// =====================================================

/**
 * Format mapped activity for database insert
 */
export function formatActivityForInsert(
  activity: MappedActivity,
  userId: string,
  athleteId?: string
): Record<string, unknown> {
  return {
    user_id: userId,
    athlete_id: athleteId,
    source_provider: activity.source_provider,
    source_id: activity.source_id,
    activity_date: activity.activity_date,
    activity_datetime: activity.activity_datetime,
    activity_type: activity.activity_type,
    activity_subtype: activity.activity_subtype,
    title: activity.title,
    duration_seconds: activity.duration_seconds,
    distance_meters: activity.distance_meters,
    elevation_gain_meters: activity.elevation_gain_meters,
    calories: activity.calories,
    avg_heart_rate: activity.avg_heart_rate,
    max_heart_rate: activity.max_heart_rate,
    avg_power_watts: activity.avg_power_watts,
    normalized_power: activity.normalized_power,
    tss: activity.tss,
    raw_data: activity.raw_data,
  }
}

/**
 * Format mapped sleep for database insert
 */
export function formatSleepForInsert(
  sleep: MappedSleep,
  userId: string,
  athleteId?: string
): Record<string, unknown> {
  return {
    user_id: userId,
    athlete_id: athleteId,
    source_provider: sleep.source_provider,
    sleep_date: sleep.sleep_date,
    bed_time: sleep.bed_time,
    wake_time: sleep.wake_time,
    total_sleep_minutes: sleep.total_sleep_minutes,
    light_sleep_minutes: sleep.light_sleep_minutes,
    deep_sleep_minutes: sleep.deep_sleep_minutes,
    rem_sleep_minutes: sleep.rem_sleep_minutes,
    awake_minutes: sleep.awake_minutes,
    sleep_efficiency: sleep.sleep_efficiency,
    sleep_score: sleep.sleep_score,
    avg_heart_rate: sleep.avg_heart_rate,
    avg_hrv_ms: sleep.avg_hrv_ms,
    raw_data: sleep.raw_data,
  }
}

/**
 * Format mapped body metrics for database insert
 */
export function formatBodyMetricsForInsert(
  metrics: MappedBodyMetrics,
  userId: string,
  athleteId?: string
): Record<string, unknown> {
  return {
    user_id: userId,
    athlete_id: athleteId,
    source_provider: metrics.source_provider,
    metric_date: metrics.metric_date,
    weight_kg: metrics.weight_kg,
    body_fat_percentage: metrics.body_fat_percentage,
    resting_heart_rate: metrics.resting_heart_rate,
    hrv_ms: metrics.hrv_ms,
    steps: metrics.steps,
    active_calories: metrics.active_calories,
    recovery_score: metrics.recovery_score,
    readiness_score: metrics.readiness_score,
    raw_data: metrics.raw_data,
  }
}

// =====================================================
// ACTIVITY TYPE MAPPINGS
// =====================================================

export const ACTIVITY_TYPE_DISPLAY: Record<string, string> = {
  run: 'Corsa',
  bike: 'Ciclismo',
  swim: 'Nuoto',
  walk: 'Camminata',
  hike: 'Escursionismo',
  strength: 'Forza',
  yoga: 'Yoga',
  hiit: 'HIIT',
  rowing: 'Canottaggio',
  elliptical: 'Ellittica',
  ski: 'Sci',
  triathlon: 'Triathlon',
  duathlon: 'Duathlon',
  other: 'Altro',
}

export const ACTIVITY_SUBTYPE_DISPLAY: Record<string, string> = {
  easy_run: 'Corsa facile',
  long_run: 'Lungo',
  interval: 'Intervalli',
  tempo: 'Tempo',
  race: 'Gara',
  trail: 'Trail',
  road: 'Strada',
  mtb: 'MTB',
  gravel: 'Gravel',
  indoor: 'Indoor',
  pool: 'Piscina',
  open_water: 'Acque libere',
  gym: 'Palestra',
  downhill: 'Discesa',
  cross_country: 'Fondo',
}

/**
 * Get display name for activity type
 */
export function getActivityTypeDisplay(type: string, subtype?: string): string {
  const typeDisplay = ACTIVITY_TYPE_DISPLAY[type] || type
  const subtypeDisplay = subtype ? ACTIVITY_SUBTYPE_DISPLAY[subtype] : undefined
  
  if (subtypeDisplay) {
    return `${typeDisplay} - ${subtypeDisplay}`
  }
  return typeDisplay
}
