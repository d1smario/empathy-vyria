import type { RookProvider, RookProviderInfo, RookDataType } from './types'

// =====================================================
// SUPPORTED PROVIDERS CONFIGURATION
// =====================================================

export const ROOK_PROVIDERS: Record<RookProvider, RookProviderInfo> = {
  garmin: {
    id: 'garmin',
    name: 'Garmin Connect',
    logo: '/images/providers/garmin.svg',
    category: 'wearable',
    dataTypes: ['physical_summary', 'sleep_summary', 'body_summary', 'activity_event', 'heart_rate_event'],
    requiresMobile: false,
    description: 'Sync workouts, sleep, heart rate, and body metrics from Garmin devices'
  },
  polar: {
    id: 'polar',
    name: 'Polar Flow',
    logo: '/images/providers/polar.svg',
    category: 'wearable',
    dataTypes: ['physical_summary', 'sleep_summary', 'activity_event', 'heart_rate_event'],
    requiresMobile: false,
    description: 'Import training sessions and recovery data from Polar watches'
  },
  whoop: {
    id: 'whoop',
    name: 'WHOOP',
    logo: '/images/providers/whoop.svg',
    category: 'wearable',
    dataTypes: ['physical_summary', 'sleep_summary', 'heart_rate_event', 'stress_event'],
    requiresMobile: false,
    description: 'Recovery scores, strain, HRV, and sleep data from WHOOP band'
  },
  oura: {
    id: 'oura',
    name: 'Oura Ring',
    logo: '/images/providers/oura.svg',
    category: 'wearable',
    dataTypes: ['sleep_summary', 'physical_summary', 'body_summary', 'heart_rate_event'],
    requiresMobile: false,
    description: 'Sleep quality, readiness scores, and activity from Oura Ring'
  },
  strava: {
    id: 'strava',
    name: 'Strava',
    logo: '/images/providers/strava.svg',
    category: 'app',
    dataTypes: ['activity_event'],
    requiresMobile: false,
    description: 'Import runs, rides, and other activities from Strava'
  },
  fitbit: {
    id: 'fitbit',
    name: 'Fitbit',
    logo: '/images/providers/fitbit.svg',
    category: 'wearable',
    dataTypes: ['physical_summary', 'sleep_summary', 'body_summary', 'heart_rate_event', 'oxygenation_event'],
    requiresMobile: false,
    description: 'Steps, sleep, heart rate, and SpO2 from Fitbit devices'
  },
  suunto: {
    id: 'suunto',
    name: 'Suunto',
    logo: '/images/providers/suunto.svg',
    category: 'wearable',
    dataTypes: ['physical_summary', 'sleep_summary', 'activity_event'],
    requiresMobile: false,
    description: 'Training and adventure data from Suunto watches'
  },
  coros: {
    id: 'coros',
    name: 'COROS',
    logo: '/images/providers/coros.svg',
    category: 'wearable',
    dataTypes: ['physical_summary', 'sleep_summary', 'activity_event'],
    requiresMobile: false,
    description: 'Training metrics and recovery from COROS watches'
  },
  withings: {
    id: 'withings',
    name: 'Withings',
    logo: '/images/providers/withings.svg',
    category: 'wearable',
    dataTypes: ['body_summary', 'sleep_summary', 'physical_summary'],
    requiresMobile: false,
    description: 'Smart scales, sleep tracking, and blood pressure monitors'
  },
  trainingpeaks: {
    id: 'trainingpeaks',
    name: 'TrainingPeaks',
    logo: '/images/providers/trainingpeaks.svg',
    category: 'platform',
    dataTypes: ['activity_event'],
    requiresMobile: false,
    description: 'Planned workouts and completed training from TrainingPeaks'
  },
  wahoo: {
    id: 'wahoo',
    name: 'Wahoo',
    logo: '/images/providers/wahoo.svg',
    category: 'wearable',
    dataTypes: ['activity_event', 'heart_rate_event'],
    requiresMobile: false,
    description: 'Cycling data from Wahoo bike computers and trainers'
  },
  zwift: {
    id: 'zwift',
    name: 'Zwift',
    logo: '/images/providers/zwift.svg',
    category: 'platform',
    dataTypes: ['activity_event'],
    requiresMobile: false,
    description: 'Indoor cycling and running workouts from Zwift'
  },
  peloton: {
    id: 'peloton',
    name: 'Peloton',
    logo: '/images/providers/peloton.svg',
    category: 'platform',
    dataTypes: ['activity_event', 'heart_rate_event'],
    requiresMobile: false,
    description: 'Workouts from Peloton bike, tread, and app classes'
  },
  eight_sleep: {
    id: 'eight_sleep',
    name: 'Eight Sleep',
    logo: '/images/providers/eight-sleep.svg',
    category: 'wearable',
    dataTypes: ['sleep_summary', 'body_summary'],
    requiresMobile: false,
    description: 'Sleep tracking and recovery from Eight Sleep mattress'
  },
  apple_health: {
    id: 'apple_health',
    name: 'Apple Health',
    logo: '/images/providers/apple-health.svg',
    category: 'app',
    dataTypes: ['physical_summary', 'sleep_summary', 'body_summary', 'activity_event', 'heart_rate_event', 'oxygenation_event'],
    requiresMobile: true,
    description: 'Comprehensive health data from Apple Watch and iPhone (requires mobile app)'
  },
  health_connect: {
    id: 'health_connect',
    name: 'Health Connect',
    logo: '/images/providers/health-connect.svg',
    category: 'app',
    dataTypes: ['physical_summary', 'sleep_summary', 'body_summary', 'activity_event', 'heart_rate_event'],
    requiresMobile: true,
    description: 'Android health data aggregator (requires mobile app)'
  },
  dexcom: {
    id: 'dexcom',
    name: 'Dexcom',
    logo: '/images/providers/dexcom.svg',
    category: 'cgm',
    dataTypes: ['glucose_event'],
    requiresMobile: false,
    description: 'Continuous glucose monitoring data from Dexcom CGM'
  },
  freestyle_libre: {
    id: 'freestyle_libre',
    name: 'FreeStyle Libre',
    logo: '/images/providers/freestyle-libre.svg',
    category: 'cgm',
    dataTypes: ['glucose_event'],
    requiresMobile: false,
    description: 'Glucose data from Abbott FreeStyle Libre CGM'
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get providers that support a specific data type
 */
export function getProvidersByDataType(dataType: RookDataType): RookProviderInfo[] {
  return Object.values(ROOK_PROVIDERS).filter(p => p.dataTypes.includes(dataType))
}

/**
 * Get providers by category
 */
export function getProvidersByCategory(category: RookProviderInfo['category']): RookProviderInfo[] {
  return Object.values(ROOK_PROVIDERS).filter(p => p.category === category)
}

/**
 * Get only web-connectable providers (no mobile app required)
 */
export function getWebProviders(): RookProviderInfo[] {
  return Object.values(ROOK_PROVIDERS).filter(p => !p.requiresMobile)
}

/**
 * Get provider info by ID
 */
export function getProviderInfo(providerId: RookProvider): RookProviderInfo | undefined {
  return ROOK_PROVIDERS[providerId]
}

/**
 * Map Rook activity type ID to EMPATHY activity type
 */
export function mapActivityType(activityTypeId: number, activityType: string): { type: string, subtype?: string } {
  // Common Rook activity type mappings
  const typeMap: Record<number, { type: string, subtype?: string }> = {
    // Running
    1: { type: 'run', subtype: 'easy_run' },
    2: { type: 'run', subtype: 'race' },
    3: { type: 'run', subtype: 'long_run' },
    4: { type: 'run', subtype: 'interval' },
    5: { type: 'run', subtype: 'trail' },
    
    // Cycling
    10: { type: 'bike', subtype: 'road' },
    11: { type: 'bike', subtype: 'mtb' },
    12: { type: 'bike', subtype: 'indoor' },
    13: { type: 'bike', subtype: 'gravel' },
    
    // Swimming
    20: { type: 'swim', subtype: 'pool' },
    21: { type: 'swim', subtype: 'open_water' },
    
    // Other
    30: { type: 'strength', subtype: 'gym' },
    31: { type: 'yoga' },
    32: { type: 'hiit' },
    33: { type: 'walk' },
    34: { type: 'hike' },
    35: { type: 'ski', subtype: 'downhill' },
    36: { type: 'ski', subtype: 'cross_country' },
    37: { type: 'rowing' },
    38: { type: 'elliptical' },
    
    // Multi-sport
    50: { type: 'triathlon' },
    51: { type: 'duathlon' },
  }
  
  if (typeMap[activityTypeId]) {
    return typeMap[activityTypeId]
  }
  
  // Fallback: parse from activity_type string
  const lowerType = activityType.toLowerCase()
  if (lowerType.includes('run')) return { type: 'run' }
  if (lowerType.includes('ride') || lowerType.includes('cycl') || lowerType.includes('bike')) return { type: 'bike' }
  if (lowerType.includes('swim')) return { type: 'swim' }
  if (lowerType.includes('walk')) return { type: 'walk' }
  if (lowerType.includes('hike')) return { type: 'hike' }
  if (lowerType.includes('strength') || lowerType.includes('weight')) return { type: 'strength' }
  if (lowerType.includes('yoga')) return { type: 'yoga' }
  
  return { type: 'other' }
}

/**
 * Calculate TSS estimate from activity data
 */
export function estimateTSS(
  durationSeconds: number,
  avgHeartRate?: number,
  maxHeartRate?: number,
  avgPower?: number,
  ftp?: number,
  lthr?: number
): number | undefined {
  // Power-based TSS (most accurate for cycling)
  if (avgPower && ftp && ftp > 0) {
    const intensityFactor = avgPower / ftp
    const hours = durationSeconds / 3600
    return Math.round((hours * avgPower * intensityFactor) / (ftp * 0.01))
  }
  
  // Heart rate based TSS (hrTSS)
  if (avgHeartRate && maxHeartRate && lthr && maxHeartRate > 0 && lthr > 0) {
    // Simplified hrTSS formula
    const hrReserve = maxHeartRate - 60 // Assume resting HR of 60
    const avgHrReserve = avgHeartRate - 60
    const intensity = avgHrReserve / (lthr - 60)
    const hours = durationSeconds / 3600
    return Math.round(hours * intensity * intensity * 100)
  }
  
  // Duration-based estimate (fallback)
  if (durationSeconds > 0) {
    // Assume moderate intensity, roughly 50 TSS per hour
    return Math.round((durationSeconds / 3600) * 50)
  }
  
  return undefined
}
