/**
 * EMPATHY Readiness Engine
 * 
 * Calculates athlete readiness based on:
 * - Internal load (HRV, HR, sleep, respiratory)
 * - External load (TSS, duration, intensity)
 * - Subjective feedback (RPE, feeling, fatigue)
 * 
 * Outputs:
 * - Readiness Score (0-100): How ready for training
 * - Strain Score (0-21): Daily training load (like Whoop)
 * - Recovery Score (0-100): How well recovered
 * - Stress Score (0-100): Overall stress level
 */

export interface BiometricsInput {
  // HRV & Heart
  hrv_rmssd?: number        // ms (typical 20-100)
  hrv_baseline?: number     // Personal baseline HRV
  hr_resting?: number       // bpm
  hr_resting_baseline?: number
  hr_sleeping_avg?: number  // bpm
  
  // Sleep
  sleep_duration_min?: number
  sleep_target_min?: number  // Personal target (default 480 = 8h)
  sleep_deep_min?: number
  sleep_rem_min?: number
  sleep_score?: number      // From device (0-100)
  
  // Respiratory
  respiratory_rate?: number // breaths/min
  spo2_avg?: number        // %
  
  // Other vitals
  body_temperature?: number // deviation from baseline
  blood_pressure_sys?: number
  blood_pressure_dia?: number
  
  // External load (from training)
  tss_yesterday?: number
  tss_7day_avg?: number
  ctl?: number              // Chronic Training Load (fitness)
  atl?: number              // Acute Training Load (fatigue)
  
  // Subjective
  rpe_yesterday?: number    // 1-10
  feeling_yesterday?: 'great' | 'good' | 'ok' | 'tired' | 'bad'
  soreness_level?: number   // 1-5
  stress_level?: number     // 1-10 subjective
  motivation_level?: number // 1-10
}

export interface TrainingLoadInput {
  duration_min: number
  tss?: number
  avg_hr?: number
  max_hr?: number
  hr_reserve_pct?: number   // % of HR reserve used
  time_in_zones?: {
    z1: number  // minutes
    z2: number
    z3: number
    z4: number
    z5: number
  }
  normalized_power?: number
  intensity_factor?: number
}

export interface ReadinessOutput {
  readiness_score: number      // 0-100
  strain_score: number         // 0-21
  recovery_score: number       // 0-100
  stress_score: number         // 0-100
  
  // Detailed breakdown
  hrv_status: 'optimal' | 'elevated' | 'suppressed' | 'unknown'
  sleep_status: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  fatigue_status: 'fresh' | 'normal' | 'fatigued' | 'overreaching'
  
  // Recommendations
  recommended_intensity: 'high' | 'moderate' | 'low' | 'rest'
  load_adjustment_pct: number  // -50 to +15
  message: string
}

/**
 * Calculate Readiness Score (0-100)
 * Weighted combination of HRV trend, sleep, and fatigue markers
 */
export function calculateReadiness(input: BiometricsInput): number {
  let score = 70 // Base score
  let factors = 0
  
  // HRV Factor (30% weight)
  if (input.hrv_rmssd && input.hrv_baseline) {
    const hrvRatio = input.hrv_rmssd / input.hrv_baseline
    // HRV within 90-110% of baseline is optimal
    if (hrvRatio >= 0.9 && hrvRatio <= 1.1) {
      score += 15
    } else if (hrvRatio >= 0.8 && hrvRatio <= 1.2) {
      score += 5
    } else if (hrvRatio < 0.8) {
      score -= 15 // Suppressed HRV = fatigue/stress
    } else {
      score -= 5 // Too elevated can indicate stress too
    }
    factors++
  } else if (input.hrv_rmssd) {
    // Without baseline, use absolute ranges
    if (input.hrv_rmssd >= 50 && input.hrv_rmssd <= 80) {
      score += 10
    } else if (input.hrv_rmssd < 40) {
      score -= 10
    }
    factors++
  }
  
  // Resting HR Factor (20% weight)
  if (input.hr_resting && input.hr_resting_baseline) {
    const hrDiff = input.hr_resting - input.hr_resting_baseline
    // Lower than baseline = good recovery
    if (hrDiff <= -3) score += 10
    else if (hrDiff <= 0) score += 5
    else if (hrDiff >= 5) score -= 10 // Elevated = stress/fatigue
    else if (hrDiff >= 3) score -= 5
    factors++
  }
  
  // Sleep Factor (25% weight)
  const sleepTarget = input.sleep_target_min || 480
  if (input.sleep_duration_min) {
    const sleepRatio = input.sleep_duration_min / sleepTarget
    if (sleepRatio >= 1.0) score += 12
    else if (sleepRatio >= 0.9) score += 8
    else if (sleepRatio >= 0.8) score += 2
    else if (sleepRatio < 0.7) score -= 15
    else score -= 8
    factors++
  }
  
  if (input.sleep_score) {
    if (input.sleep_score >= 85) score += 5
    else if (input.sleep_score >= 70) score += 2
    else if (input.sleep_score < 50) score -= 8
    factors++
  }
  
  // Training Load Factor (25% weight) - TSB proxy
  if (input.ctl && input.atl) {
    const tsb = input.ctl - input.atl // Training Stress Balance
    // Positive TSB = fresh, negative = fatigued
    if (tsb >= 10) score += 10
    else if (tsb >= 0) score += 5
    else if (tsb >= -10) score += 0
    else if (tsb >= -20) score -= 5
    else score -= 15 // Deep fatigue
    factors++
  }
  
  // Subjective Factors
  if (input.feeling_yesterday) {
    const feelingMap = { great: 10, good: 5, ok: 0, tired: -8, bad: -15 }
    score += feelingMap[input.feeling_yesterday]
    factors++
  }
  
  if (input.stress_level) {
    if (input.stress_level <= 3) score += 5
    else if (input.stress_level >= 7) score -= 10
    else if (input.stress_level >= 5) score -= 3
    factors++
  }
  
  // Normalize if we don't have all factors
  if (factors < 3) {
    // Less confident, regress toward mean
    score = 70 + (score - 70) * 0.5
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate Strain Score (0-21, like Whoop)
 * Based on cardiovascular load during training
 */
export function calculateStrain(input: TrainingLoadInput): number {
  let strain = 0
  
  // TSS-based strain (primary method)
  if (input.tss) {
    // TSS 100 ≈ strain 14, TSS 150 ≈ strain 18, TSS 200+ ≈ strain 21
    strain = Math.min(21, (input.tss / 100) * 14)
  }
  
  // Time in zones contribution
  if (input.time_in_zones) {
    const zoneStrain = 
      input.time_in_zones.z1 * 0.02 +
      input.time_in_zones.z2 * 0.05 +
      input.time_in_zones.z3 * 0.12 +
      input.time_in_zones.z4 * 0.25 +
      input.time_in_zones.z5 * 0.5
    
    // Blend with TSS-based if available
    if (input.tss) {
      strain = strain * 0.7 + zoneStrain * 0.3
    } else {
      strain = zoneStrain
    }
  }
  
  // Duration factor for long easy sessions
  if (input.duration_min > 120 && strain < 10) {
    strain = Math.min(strain + (input.duration_min - 120) * 0.03, 15)
  }
  
  // Intensity factor boost
  if (input.intensity_factor && input.intensity_factor > 0.9) {
    strain *= 1 + (input.intensity_factor - 0.9) * 2
  }
  
  return Math.max(0, Math.min(21, Math.round(strain * 10) / 10))
}

/**
 * Calculate Recovery Score (0-100)
 * How well the athlete has recovered since last training
 */
export function calculateRecovery(input: BiometricsInput): number {
  let recovery = 60 // Base
  
  // HRV recovery indicator
  if (input.hrv_rmssd && input.hrv_baseline) {
    const hrvRatio = input.hrv_rmssd / input.hrv_baseline
    if (hrvRatio >= 1.0) recovery += 20
    else if (hrvRatio >= 0.9) recovery += 10
    else if (hrvRatio < 0.8) recovery -= 15
  }
  
  // Sleep quality
  if (input.sleep_score) {
    recovery += (input.sleep_score - 70) * 0.3
  }
  
  // Deep sleep percentage
  if (input.sleep_deep_min && input.sleep_duration_min) {
    const deepPct = input.sleep_deep_min / input.sleep_duration_min
    if (deepPct >= 0.2) recovery += 10
    else if (deepPct < 0.1) recovery -= 10
  }
  
  // SpO2
  if (input.spo2_avg) {
    if (input.spo2_avg >= 97) recovery += 5
    else if (input.spo2_avg < 94) recovery -= 10
  }
  
  // Training load impact
  if (input.tss_yesterday) {
    if (input.tss_yesterday > 150) recovery -= 15
    else if (input.tss_yesterday > 100) recovery -= 8
    else if (input.tss_yesterday < 50) recovery += 5
  }
  
  return Math.max(0, Math.min(100, Math.round(recovery)))
}

/**
 * Calculate Stress Score (0-100)
 * Combines physiological and psychological stress markers
 */
export function calculateStress(input: BiometricsInput): number {
  let stress = 30 // Base stress level
  
  // HRV suppression indicates stress
  if (input.hrv_rmssd && input.hrv_baseline) {
    const hrvRatio = input.hrv_rmssd / input.hrv_baseline
    if (hrvRatio < 0.8) stress += 20
    else if (hrvRatio < 0.9) stress += 10
    else if (hrvRatio > 1.1) stress += 5 // Paradoxically elevated
  }
  
  // Elevated resting HR
  if (input.hr_resting && input.hr_resting_baseline) {
    const hrDiff = input.hr_resting - input.hr_resting_baseline
    if (hrDiff >= 5) stress += 15
    else if (hrDiff >= 3) stress += 8
  }
  
  // Respiratory rate changes
  if (input.respiratory_rate) {
    if (input.respiratory_rate > 16) stress += 10
    else if (input.respiratory_rate < 12) stress -= 5
  }
  
  // Subjective stress
  if (input.stress_level) {
    stress += (input.stress_level - 5) * 5
  }
  
  // Sleep deprivation
  const sleepTarget = input.sleep_target_min || 480
  if (input.sleep_duration_min && input.sleep_duration_min < sleepTarget * 0.75) {
    stress += 15
  }
  
  return Math.max(0, Math.min(100, Math.round(stress)))
}

/**
 * Get full readiness analysis with recommendations
 */
export function analyzeReadiness(biometrics: BiometricsInput): ReadinessOutput {
  const readiness = calculateReadiness(biometrics)
  const recovery = calculateRecovery(biometrics)
  const stress = calculateStress(biometrics)
  
  // Strain from yesterday's training (if available)
  const strain = biometrics.tss_yesterday 
    ? calculateStrain({ 
        duration_min: 0, 
        tss: biometrics.tss_yesterday 
      })
    : 0
  
  // Determine statuses
  let hrvStatus: ReadinessOutput['hrv_status'] = 'unknown'
  if (biometrics.hrv_rmssd && biometrics.hrv_baseline) {
    const ratio = biometrics.hrv_rmssd / biometrics.hrv_baseline
    if (ratio >= 0.9 && ratio <= 1.1) hrvStatus = 'optimal'
    else if (ratio > 1.1) hrvStatus = 'elevated'
    else hrvStatus = 'suppressed'
  }
  
  let sleepStatus: ReadinessOutput['sleep_status'] = 'unknown'
  if (biometrics.sleep_score) {
    if (biometrics.sleep_score >= 85) sleepStatus = 'excellent'
    else if (biometrics.sleep_score >= 70) sleepStatus = 'good'
    else if (biometrics.sleep_score >= 50) sleepStatus = 'fair'
    else sleepStatus = 'poor'
  } else if (biometrics.sleep_duration_min) {
    const target = biometrics.sleep_target_min || 480
    const ratio = biometrics.sleep_duration_min / target
    if (ratio >= 1.0) sleepStatus = 'excellent'
    else if (ratio >= 0.9) sleepStatus = 'good'
    else if (ratio >= 0.75) sleepStatus = 'fair'
    else sleepStatus = 'poor'
  }
  
  let fatigueStatus: ReadinessOutput['fatigue_status'] = 'normal'
  if (biometrics.ctl && biometrics.atl) {
    const tsb = biometrics.ctl - biometrics.atl
    if (tsb >= 10) fatigueStatus = 'fresh'
    else if (tsb >= -10) fatigueStatus = 'normal'
    else if (tsb >= -25) fatigueStatus = 'fatigued'
    else fatigueStatus = 'overreaching'
  }
  
  // Recommendations
  let recommendedIntensity: ReadinessOutput['recommended_intensity']
  let loadAdjustment: number
  let message: string
  
  if (readiness >= 80) {
    recommendedIntensity = 'high'
    loadAdjustment = 10
    message = 'Ottima forma! Puoi affrontare allenamenti intensi.'
  } else if (readiness >= 60) {
    recommendedIntensity = 'moderate'
    loadAdjustment = 0
    message = 'Buona readiness. Procedi con il piano previsto.'
  } else if (readiness >= 40) {
    recommendedIntensity = 'low'
    loadAdjustment = -20
    message = 'Readiness ridotta. Considera un allenamento più leggero.'
  } else {
    recommendedIntensity = 'rest'
    loadAdjustment = -50
    message = 'Readiness bassa. Riposo o recupero attivo consigliato.'
  }
  
  // Adjust based on stress
  if (stress > 70) {
    loadAdjustment -= 15
    message += ' Livello di stress elevato.'
  }
  
  // Adjust based on recovery
  if (recovery < 50) {
    loadAdjustment -= 10
    message += ' Recovery incompleto.'
  }
  
  return {
    readiness_score: readiness,
    strain_score: strain,
    recovery_score: recovery,
    stress_score: stress,
    hrv_status: hrvStatus,
    sleep_status: sleepStatus,
    fatigue_status: fatigueStatus,
    recommended_intensity: recommendedIntensity,
    load_adjustment_pct: Math.max(-50, Math.min(15, loadAdjustment)),
    message
  }
}

/**
 * Calculate daily strain from completed workout
 */
export function calculateDailyStrain(workouts: TrainingLoadInput[]): number {
  if (workouts.length === 0) return 0
  
  // Calculate individual strains
  const strains = workouts.map(w => calculateStrain(w))
  
  // Combine strains (not simply additive, diminishing returns)
  const sorted = strains.sort((a, b) => b - a)
  let totalStrain = sorted[0] || 0
  
  for (let i = 1; i < sorted.length; i++) {
    // Each additional workout adds diminishing strain
    totalStrain += sorted[i] * (0.5 / i)
  }
  
  return Math.min(21, Math.round(totalStrain * 10) / 10)
}
