/**
 * Performance Management Chart (PMC) Calculator
 * 
 * Calculates CTL (Chronic Training Load), ATL (Acute Training Load), and TSB (Training Stress Balance)
 * using exponential weighted moving averages, similar to TrainingPeaks methodology.
 */

interface ActivityData {
  date: string
  tss: number
  duration: number
}

interface PMCResult {
  dailyData: {
    date: string
    ctl: number
    atl: number
    tsb: number
    tss: number
  }[]
  currentCTL: number
  currentATL: number
  currentTSB: number
  rampRate: number
  totalTSS: number
  avgTSS: number
  peakTSS: number
  totalHours: number
}

export function calculatePMC(activities: ActivityData[], periodDays: number): PMCResult {
  const CTL_CONSTANT = 42 // Chronic Training Load time constant (days)
  const ATL_CONSTANT = 7  // Acute Training Load time constant (days)
  
  // Group activities by date
  const dailyTSS: { [date: string]: number } = {}
  const dailyDuration: { [date: string]: number } = {}
  
  activities.forEach(a => {
    dailyTSS[a.date] = (dailyTSS[a.date] || 0) + (a.tss || 0)
    dailyDuration[a.date] = (dailyDuration[a.date] || 0) + (a.duration || 0)
  })
  
  // Generate all dates in period
  const today = new Date()
  const dates: string[] = []
  for (let i = periodDays; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  
  // Calculate CTL and ATL using exponential moving average
  let ctl = 0
  let atl = 0
  const dailyData: PMCResult['dailyData'] = []
  let totalTSS = 0
  let peakTSS = 0
  let totalDuration = 0
  let activeDays = 0
  
  dates.forEach(date => {
    const tss = dailyTSS[date] || 0
    const duration = dailyDuration[date] || 0
    
    // Exponential decay formula (same as TrainingPeaks)
    // CTL(today) = CTL(yesterday) + (TSS(today) - CTL(yesterday)) / CTL_CONSTANT
    ctl = ctl + (tss - ctl) / CTL_CONSTANT
    atl = atl + (tss - atl) / ATL_CONSTANT
    const tsb = ctl - atl
    
    if (tss > 0) {
      totalTSS += tss
      peakTSS = Math.max(peakTSS, tss)
      activeDays++
    }
    totalDuration += duration
    
    dailyData.push({
      date: new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }),
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
      tss: tss,
    })
  })
  
  // Calculate ramp rate (CTL change per week)
  const weekAgo = dailyData.length > 7 ? dailyData[dailyData.length - 8]?.ctl || 0 : 0
  const currentCTL = dailyData[dailyData.length - 1]?.ctl || 0
  const rampRate = currentCTL - weekAgo
  
  return {
    dailyData,
    currentCTL,
    currentATL: dailyData[dailyData.length - 1]?.atl || 0,
    currentTSB: dailyData[dailyData.length - 1]?.tsb || 0,
    rampRate: Math.round(rampRate * 10) / 10,
    totalTSS,
    avgTSS: activeDays > 0 ? Math.round(totalTSS / activeDays) : 0,
    peakTSS,
    totalHours: Math.round(totalDuration / 60 * 10) / 10,
  }
}

/**
 * Estimate TSS from activity data when not provided
 * Uses heart rate or duration-based estimation
 */
export function estimateTSS(params: {
  durationMinutes: number
  avgHeartRate?: number
  maxHeartRate?: number
  thresholdHeartRate?: number
  avgPower?: number
  ftp?: number
  intensityFactor?: number
}): number {
  const { durationMinutes, avgHeartRate, maxHeartRate, thresholdHeartRate, avgPower, ftp, intensityFactor } = params
  
  // If we have power data and FTP, use power-based TSS (most accurate)
  if (avgPower && ftp && ftp > 0) {
    const np = avgPower // Assuming avgPower is already normalized power
    const ifCalc = np / ftp
    return Math.round((durationMinutes * np * ifCalc) / (ftp * 36))
  }
  
  // If we have intensity factor directly
  if (intensityFactor && ftp) {
    const np = intensityFactor * ftp
    return Math.round((durationMinutes * np * intensityFactor) / (ftp * 36))
  }
  
  // If we have heart rate data, use hrTSS
  if (avgHeartRate && thresholdHeartRate && thresholdHeartRate > 0) {
    const hrRatio = avgHeartRate / thresholdHeartRate
    // Simplified hrTSS formula
    return Math.round(durationMinutes * hrRatio * hrRatio * 100 / 60)
  }
  
  // Fallback: estimate based on duration only (assumes moderate intensity ~0.7 IF)
  // This is a rough estimate: TSS ≈ duration * 0.7^2 * 100 / 60
  return Math.round(durationMinutes * 0.49 * 100 / 60)
}
