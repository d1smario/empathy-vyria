// FIT Parser using @garmin-fit/sdk (Official Garmin SDK)
// Supports files from Garmin, Polar, Wahoo, Strava, TrainingPeaks, etc.

import { Decoder, Stream } from '@garmin-fit/sdk'

export interface DataPoint {
  time: number // seconds from start
  power?: number
  heartRate?: number
  cadence?: number
  speed?: number // km/h
  elevation?: number // meters
  lat?: number
  lng?: number
  temperature?: number
  distance?: number // meters cumulative
}

export interface ParsedActivityFile {
  format: 'fit' | 'tcx' | 'gpx'
  parsed: true
  session: any
  laps: any[]
  records: any[]
  dataPoints: DataPoint[]
  startTime?: Date
}

export type ParsedFitFile = ParsedActivityFile

export async function parseFitFile(buffer: ArrayBuffer): Promise<ParsedActivityFile> {
  console.log('[FIT Parser] Starting parse, buffer size:', buffer.byteLength)
  
  try {
    const stream = Stream.fromArrayBuffer(buffer)
    const decoder = new Decoder(stream)
    
    console.log('[FIT Parser] Decoder created, checking FIT...')
    
    if (!decoder.isFIT()) {
      throw new Error('Not a valid FIT file')
    }
    
    if (!decoder.checkIntegrity()) {
      console.warn('[FIT Parser] FIT file integrity check failed, attempting to parse anyway')
    }
    
    const { messages, errors } = decoder.read({
      applyScaleAndOffset: true,
      expandSubFields: true,
      expandComponents: true,
      convertTypesToStrings: true,
      convertDateTimesToDates: true,
      mergeHeartRates: true,
    })
    
    if (errors.length > 0) {
      console.warn('[FIT Parser] Errors:', errors)
    }
    
    console.log('[FIT Parser] Message types:', Object.keys(messages))
    
    // Extract session
    const sessions = messages.sessionMesgs || []
    const session = sessions[0] || {}
    console.log('[FIT Parser] Sessions found:', sessions.length)
    
    // Extract records
    const recordMesgs = messages.recordMesgs || []
    console.log('[FIT Parser] Records found:', recordMesgs.length)
    
    // Get start time
    let startTime: Date | undefined
    if (recordMesgs.length > 0 && recordMesgs[0].timestamp) {
      startTime = new Date(recordMesgs[0].timestamp)
    } else if (session.startTime) {
      startTime = new Date(session.startTime)
    }
    
    // Convert records to dataPoints
    const dataPoints: DataPoint[] = []
    const powers: number[] = []
    const heartRates: number[] = []
    const cadences: number[] = []
    const speeds: number[] = []
    const elevations: number[] = []
    let maxPower = 0, maxHr = 0, maxSpeed = 0
    let totalDistance = 0
    
    for (let i = 0; i < recordMesgs.length; i++) {
      const rec = recordMesgs[i]
      
      // Calculate time from start
      let timeFromStart = 0
      if (startTime && rec.timestamp) {
        timeFromStart = (new Date(rec.timestamp).getTime() - startTime.getTime()) / 1000
      }
      
      // Extract values - Garmin SDK field names
      const power = rec.power
      const hr = rec.heartRate
      const cadence = rec.cadence
      // Speed is in m/s, convert to km/h
      const speedMps = rec.speed || rec.enhancedSpeed || 0
      const speed = speedMps * 3.6
      const elevation = rec.altitude || rec.enhancedAltitude
      // Position is in semicircles, convert to degrees
      const lat = rec.positionLat !== undefined ? rec.positionLat * (180 / Math.pow(2, 31)) : undefined
      const lng = rec.positionLong !== undefined ? rec.positionLong * (180 / Math.pow(2, 31)) : undefined
      const temp = rec.temperature
      const distance = rec.distance
      
      // Collect for averages
      if (power && power > 0) {
        powers.push(power)
        if (power > maxPower) maxPower = power
      }
      if (hr && hr > 0) {
        heartRates.push(hr)
        if (hr > maxHr) maxHr = hr
      }
      if (cadence && cadence > 0) cadences.push(cadence)
      if (speed > 0) {
        speeds.push(speed)
        if (speed > maxSpeed) maxSpeed = speed
      }
      if (elevation !== undefined && !isNaN(elevation)) elevations.push(elevation)
      if (distance) totalDistance = distance
      
      dataPoints.push({
        time: timeFromStart,
        power: power || undefined,
        heartRate: hr || undefined,
        cadence: cadence || undefined,
        speed: speed || undefined,
        elevation: elevation,
        lat: lat,
        lng: lng,
        temperature: temp || undefined,
        distance: distance || undefined,
      })
    }
    
    console.log('[FIT Parser] DataPoints created:', dataPoints.length)
    console.log('[FIT Parser] Stats - Power:', powers.length, 'HR:', heartRates.length, 'Speed:', speeds.length, 'Elevation:', elevations.length)
    
    // Calculate averages
    const avgPower = powers.length > 0 ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : 0
    const avgHr = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : 0
    const avgCadence = cadences.length > 0 ? Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length) : 0
    const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10 : 0
    
    // Calculate elevation gain
    let elevationGain = 0
    if (elevations.length > 1) {
      for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1]
        if (diff > 0 && diff < 50) elevationGain += diff // Filter out GPS spikes
      }
    }
    
    // Duration from session or last record
    const durationFromRecords = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].time : 0
    const duration = session.totalTimerTime || session.totalElapsedTime || durationFromRecords
    
    // Merge session with calculated values
    const mergedSession = {
      sport: session.sport || 'unknown',
      sub_sport: session.subSport,
      start_time: startTime,
      total_timer_time: duration,
      total_elapsed_time: session.totalElapsedTime || duration,
      total_distance: session.totalDistance || totalDistance,
      total_ascent: session.totalAscent || Math.round(elevationGain),
      total_calories: session.totalCalories || 0,
      avg_power: session.avgPower || avgPower,
      max_power: session.maxPower || maxPower,
      avg_heart_rate: session.avgHeartRate || avgHr,
      max_heart_rate: session.maxHeartRate || maxHr,
      avg_cadence: session.avgCadence || avgCadence,
      avg_speed: session.avgSpeed ? session.avgSpeed * 3.6 : avgSpeed, // Convert m/s to km/h
      max_speed: session.maxSpeed ? session.maxSpeed * 3.6 : maxSpeed,
      normalized_power: session.normalizedPower || 0,
    }
    
    console.log('[FIT Parser] Merged session:', JSON.stringify({
      sport: mergedSession.sport,
      duration: mergedSession.total_timer_time,
      distance: mergedSession.total_distance,
      avgPower: mergedSession.avg_power,
      avgHr: mergedSession.avg_heart_rate,
      avgSpeed: mergedSession.avg_speed,
      elevation: mergedSession.total_ascent,
    }))
    
    return {
      format: 'fit',
      parsed: true,
      session: mergedSession,
      records: recordMesgs,
      laps: messages.lapMesgs || [],
      dataPoints,
      startTime,
    }
  } catch (err) {
    console.error('[FIT Parser] Exception:', err)
    throw err
  }
}

function calculateNP(powers: number[]): number {
  if (powers.length < 30) {
    return powers.length > 0 ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : 0
  }
  
  const windowSize = 30
  const rollingAvgs: number[] = []
  
  for (let i = windowSize - 1; i < powers.length; i++) {
    const window = powers.slice(i - windowSize + 1, i + 1)
    const avg = window.reduce((a, b) => a + b, 0) / windowSize
    rollingAvgs.push(Math.pow(avg, 4))
  }
  
  if (rollingAvgs.length === 0) return 0
  const avgOfFourthPowers = rollingAvgs.reduce((a, b) => a + b, 0) / rollingAvgs.length
  return Math.round(Math.pow(avgOfFourthPowers, 0.25))
}

export function extractActivitySummary(parsed: ParsedActivityFile) {
  const { session, dataPoints, startTime } = parsed
  
  const firstGpsPoint = dataPoints.find(p => p.lat && p.lng)
  
  // Determine activity type
  let activityType = 'other'
  const sport = (session.sport || '').toString().toLowerCase()
  if (sport.includes('cycling') || sport.includes('biking') || sport === 'cycling') activityType = 'cycling'
  else if (sport.includes('running') || sport.includes('run') || sport === 'running') activityType = 'running'
  else if (sport.includes('swimming') || sport.includes('swim')) activityType = 'swimming'
  else if (sport.includes('walking') || sport.includes('walk')) activityType = 'walking'
  else if (sport.includes('hiking') || sport.includes('hike')) activityType = 'hiking'
  else if (sport) activityType = sport
  
  // Get values from session
  const durationSeconds = session.total_timer_time || session.total_elapsed_time || 0
  const distanceMeters = session.total_distance || 0
  const elevationGain = session.total_ascent || 0
  const calories = session.total_calories || 0
  const avgHr = session.avg_heart_rate || 0
  const maxHr = session.max_heart_rate || 0
  const avgPower = session.avg_power || 0
  const maxPower = session.max_power || 0
  const avgCadence = session.avg_cadence || 0
  const avgSpeed = session.avg_speed || 0 // km/h
  const maxSpeed = session.max_speed || 0
  
  // Calculate NP from dataPoints if not in session
  const powerValues = dataPoints.map(p => p.power).filter((v): v is number => v !== undefined && v > 0)
  const normalizedPower = session.normalized_power || calculateNP(powerValues)
  
  // Calculate TSS and IF
  const ftp = 200 // Default FTP
  const intensityFactor = normalizedPower && ftp ? normalizedPower / ftp : 0
  const tss = normalizedPower && durationSeconds && ftp 
    ? Math.round((durationSeconds * normalizedPower * intensityFactor) / (ftp * 3600) * 100) 
    : 0
  const vi = normalizedPower && avgPower ? normalizedPower / avgPower : 1
  
  return {
    activity_type: activityType,
    start_time: startTime,
    duration_seconds: Math.round(durationSeconds),
    distance_meters: Math.round(distanceMeters),
    elevation_gain_meters: Math.round(elevationGain),
    calories: Math.round(calories),
    avg_heart_rate: Math.round(avgHr),
    max_heart_rate: Math.round(maxHr),
    avg_power_watts: Math.round(avgPower),
    max_power_watts: Math.round(maxPower),
    normalized_power: Math.round(normalizedPower),
    avg_cadence: Math.round(avgCadence),
    avg_speed_kmh: Math.round(avgSpeed * 10) / 10,
    max_speed_kmh: Math.round(maxSpeed * 10) / 10,
    avg_speed_mps: Math.round(avgSpeed / 3.6 * 100) / 100,
    max_speed_mps: Math.round(maxSpeed / 3.6 * 100) / 100,
    tss,
    intensity_factor: Math.round(intensityFactor * 100) / 100,
    variability_index: Math.round(vi * 100) / 100,
    start_lat: firstGpsPoint?.lat,
    start_lng: firstGpsPoint?.lng,
  }
}
