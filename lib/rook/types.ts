// =====================================================
// ROOK CONNECT API TYPES
// Based on TryRook.io documentation
// =====================================================

export type RookEnvironment = 'sandbox' | 'production'

export type RookProvider = 
  | 'garmin'
  | 'polar'
  | 'fitbit'
  | 'oura'
  | 'whoop'
  | 'withings'
  | 'strava'
  | 'suunto'
  | 'coros'
  | 'health_connect' // Android
  | 'apple_health'   // iOS
  | 'trainingpeaks'
  | 'wahoo'
  | 'zwift'
  | 'peloton'
  | 'eight_sleep'
  | 'dexcom'
  | 'freestyle_libre'

export interface RookProviderInfo {
  id: RookProvider
  name: string
  logo: string
  category: 'wearable' | 'app' | 'platform' | 'cgm'
  dataTypes: RookDataType[]
  requiresMobile: boolean
  description: string
}

export type RookDataType = 
  | 'physical_summary'
  | 'physical_event'
  | 'sleep_summary'
  | 'body_summary'
  | 'activity_event'
  | 'heart_rate_event'
  | 'oxygenation_event'
  | 'stress_event'
  | 'temperature_event'
  | 'glucose_event'

// =====================================================
// API RESPONSES
// =====================================================

export interface RookAuthorizationResponse {
  authorization_url: string
  state: string
}

export interface RookUserResponse {
  user_id: string
  created_at: string
  data_sources: RookDataSource[]
}

export interface RookDataSource {
  data_source: RookProvider
  authorized: boolean
  connected_at?: string
  last_sync?: string
}

export interface RookRevokeResponse {
  success: boolean
  message: string
}

// =====================================================
// WEBHOOK PAYLOADS
// =====================================================

export type RookWebhookEventType = 
  | 'user.authorized'
  | 'user.revoked'
  | 'physical.summary.created'
  | 'physical.event.created'
  | 'sleep.summary.created'
  | 'body.summary.created'
  | 'activity.event.created'
  | 'heart_rate.event.created'
  | 'oxygenation.event.created'
  | 'stress.event.created'
  | 'temperature.event.created'
  | 'glucose.event.created'

export interface RookWebhookPayload {
  event_type: RookWebhookEventType
  client_uuid: string
  user_id: string
  data_source: RookProvider
  data: unknown
  timestamp: string
}

// =====================================================
// DATA STRUCTURES (Summaries)
// =====================================================

export interface RookPhysicalSummary {
  date: string
  data_source: RookProvider
  
  // Activity
  steps: number
  active_seconds: number
  inactive_seconds: number
  low_intensity_seconds: number
  moderate_intensity_seconds: number
  vigorous_intensity_seconds: number
  
  // Calories
  calories_expenditure_kcal: number
  active_calories_kcal: number
  bmr_calories_kcal: number
  
  // Distance
  distance_meters: number
  floors_climbed: number
  
  // Heart Rate
  hr_max_bpm: number
  hr_min_bpm: number
  hr_avg_bpm: number
  
  // Oxygen
  saturation_avg_percentage?: number
  vo2_max_ml_kg_min?: number
  
  // Stress
  stress_duration_seconds?: number
  recovery_duration_seconds?: number
  
  // HRV
  hrv_avg_sdnn_ms?: number
  hrv_avg_rmssd_ms?: number
}

export interface RookSleepSummary {
  date: string
  data_source: RookProvider
  
  // Timing
  sleep_start_time: string
  sleep_end_time: string
  
  // Duration (seconds)
  sleep_duration_seconds: number
  time_in_bed_seconds: number
  time_asleep_seconds: number
  time_awake_seconds: number
  time_to_fall_asleep_seconds: number
  
  // Stages (seconds)
  light_sleep_seconds: number
  deep_sleep_seconds: number
  rem_sleep_seconds: number
  out_of_bed_seconds: number
  
  // Quality
  sleep_efficiency?: number
  sleep_score?: number
  
  // Physiological
  hr_avg_bpm?: number
  hr_min_bpm?: number
  hr_max_bpm?: number
  hrv_avg_rmssd_ms?: number
  respiratory_rate_avg?: number
  saturation_avg_percentage?: number
  
  // Temperature
  temperature_delta_celsius?: number
}

export interface RookBodySummary {
  date: string
  data_source: RookProvider
  
  // Composition
  weight_kg?: number
  height_cm?: number
  bmi?: number
  body_fat_percentage?: number
  muscle_mass_kg?: number
  bone_mass_kg?: number
  water_percentage?: number
  
  // Vitals
  blood_glucose_mg_dl?: number
  blood_pressure_systolic_mmhg?: number
  blood_pressure_diastolic_mmhg?: number
  
  // Metabolic
  waist_circumference_cm?: number
  hip_circumference_cm?: number
  basal_metabolic_rate_kcal?: number
}

export interface RookActivityEvent {
  date: string
  data_source: RookProvider
  
  // Identification
  activity_id: string
  activity_type: string
  activity_type_id: number
  
  // Timing
  start_time: string
  end_time: string
  duration_seconds: number
  active_duration_seconds: number
  
  // Distance & Elevation
  distance_meters?: number
  elevation_gain_meters?: number
  elevation_loss_meters?: number
  
  // Calories
  calories_kcal?: number
  
  // Heart Rate
  hr_avg_bpm?: number
  hr_max_bpm?: number
  hr_min_bpm?: number
  
  // Speed
  speed_avg_mps?: number
  speed_max_mps?: number
  
  // Cadence
  cadence_avg_rpm?: number
  cadence_max_rpm?: number
  
  // Power (cycling)
  power_avg_watts?: number
  power_max_watts?: number
  
  // Swim specific
  swim_strokes?: number
  pool_length_meters?: number
  
  // Location
  start_location?: {
    latitude: number
    longitude: number
  }
  end_location?: {
    latitude: number
    longitude: number
  }
  
  // Route (encoded polyline)
  route?: string
}

// =====================================================
// CONNECTION STATE
// =====================================================

export interface UserDataConnection {
  id: string
  user_id: string
  athlete_id?: string
  provider: RookProvider
  provider_user_id?: string
  rook_user_id: string
  authorized: boolean
  connected_at?: string
  last_sync_at?: string
  sync_status: 'pending' | 'syncing' | 'success' | 'error' | 'disconnected'
  sync_error?: string
  scopes?: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// =====================================================
// EMPATHY MAPPED TYPES
// =====================================================

export interface MappedActivity {
  source_provider: RookProvider
  source_id: string
  activity_date: string
  activity_datetime: string
  activity_type: string
  activity_subtype?: string
  title?: string
  duration_seconds?: number
  distance_meters?: number
  elevation_gain_meters?: number
  calories?: number
  avg_heart_rate?: number
  max_heart_rate?: number
  avg_power_watts?: number
  normalized_power?: number
  tss?: number
  raw_data: RookActivityEvent
}

export interface MappedSleep {
  source_provider: RookProvider
  sleep_date: string
  bed_time: string
  wake_time: string
  total_sleep_minutes: number
  light_sleep_minutes: number
  deep_sleep_minutes: number
  rem_sleep_minutes: number
  awake_minutes: number
  sleep_efficiency?: number
  sleep_score?: number
  avg_heart_rate?: number
  avg_hrv_ms?: number
  raw_data: RookSleepSummary
}

export interface MappedBodyMetrics {
  source_provider: RookProvider
  metric_date: string
  weight_kg?: number
  body_fat_percentage?: number
  resting_heart_rate?: number
  hrv_ms?: number
  steps?: number
  active_calories?: number
  recovery_score?: number
  readiness_score?: number
  raw_data: RookPhysicalSummary | RookBodySummary
}
