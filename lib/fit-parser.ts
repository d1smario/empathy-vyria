// FIT Parser using official Garmin FIT SDK
import { Decoder, Stream } from "@garmin/fitsdk"

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

// Convert Garmin semicircles to degrees
function semicirclesToDegrees(semicircles: number): number {
  return semicircles * (180 / Math.pow(2, 31))
}

export async function parseFitFile(buffer: ArrayBuffer): Promise<ParsedActivityFile> {
  console.log('[FIT Parser] Starting with Garmin SDK, buffer size:', buffer.byteLength)
  
  try {
    const stream = Stream.fromArrayBuffer(buffer)
    const decoder = new Decoder(stream)
    
    if (!decoder.isFIT()) {
      console.error('[FIT Parser] Not a valid FIT file')
      throw new Error('Not a valid FIT file')
    }
    
    const integrity = decoder.checkIntegrity()
    console.log('[FIT Parser] Integrity check:', integrity)
    
    const { messages, errors } = decoder.read()
    
    if (errors && errors.length > 0) {
      console.warn('[FIT Parser] Decoder warnings:', errors.length)
    }
    
    console.log('[FIT Parser] Message types found:', Object.keys(messages))
    
    // Extract session info
    const sessions = messages.sessionMesgs || []
    const session = sessions[0] || {}
    
    console.log('[FIT Parser] Sessions found:', sessions.length)
    console.log('[FIT Parser] Session sport:', session.sport, 'subSport:', session.subSport)
    
    // Extract laps
    const laps = messages.lapMesgs || []
    console.log('[FIT Parser] Laps found:', laps.length)
    
    // Extract records (the main data points)
    const records = messages.recordMesgs || []
    console.log('[FIT Parser] Records found:', records.length)
    
    if (records.length > 0) {
      console.log('[FIT Parser] First record keys:', Object.keys(records[0]))
    }
    
    // Get start time
    let startTime: Date | undefined
    if (session.startTime) {
      startTime = new Date(session.startTime)
    } else if (records[0]?.timestamp) {
      startTime = new Date(records[0].timestamp)
    }
    console.log('[FIT Parser] Start time:', startTime)
    
    // Convert records to dataPoints
    const dataPoints: DataPoint[] = []
    const powers: number[] = []
    const heartRates: number[] = []
    const cadences: number[] = []
    const speeds: number[] = []
    const elevations: number[] = []
    let maxPower = 0, maxHr = 0, maxSpeed = 0
    let totalDistance = 0
    
    for (const record of records) {
      // Calculate elapsed time from start
      let timeFromStart = 0
      if (record.timestamp && startTime) {
        const recordTime = new Date(record.timestamp)
        timeFromStart = Math.floor((recordTime.getTime() - startTime.getTime()) / 1000)
      }
      
      // Extract values - Garmin SDK uses camelCase
      const power = record.power
      const hr = record.heartRate
      const cadence = record.cadence
      const speedMps = record.speed // m/s in Garmin SDK
      const speed = speedMps !== undefined ? speedMps * 3.6 : undefined // convert to km/h
      const elevation = record.altitude ?? record.enhancedAltitude
      const distance = record.distance
      const temp = record.temperature
      const lat = record.positionLat !== undefined ? semicirclesToDegrees(record.positionLat) : undefined
      const lng = record.positionLong !== undefined ? semicirclesToDegrees(record.positionLong) : undefined
      
      // Collect for averages
      if (power !== undefined && power > 0) {
        powers.push(power)
        if (power > maxPower) maxPower = power
      }
      if (hr !== undefined && hr > 0) {
        heartRates.push(hr)
        if (hr > maxHr) maxHr = hr
      }
      if (cadence !== undefined && cadence > 0) cadences.push(cadence)
      if (speed !== undefined && speed > 0) {
        speeds.push(speed)
        if (speed > maxSpeed) maxSpeed = speed
      }
      if (elevation !== undefined && !isNaN(elevation)) elevations.push(elevation)
      if (distance !== undefined) totalDistance = distance
      
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
    console.log('[FIT Parser] Stats - Powers:', powers.length, 'HRs:', heartRates.length, 'Speeds:', speeds.length)
    
    if (dataPoints.length > 0) {
      console.log('[FIT Parser] First dataPoint:', JSON.stringify(dataPoints[0]))
      console.log('[FIT Parser] Last dataPoint:', JSON.stringify(dataPoints[dataPoints.length - 1]))
    }
    
    // Calculate averages from dataPoints
    const avgPower = powers.length > 0 ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length) : 0
    const avgHr = heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length) : 0
    const avgCadence = cadences.length > 0 ? Math.round(cadences.reduce((a, b) => a + b, 0) / cadences.length) : 0
    const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10 : 0
    
    // Calculate elevation gain
    let elevationGain = 0
    if (elevations.length > 1) {
      for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1]
        if (diff > 0 && diff < 50) elevationGain += diff
      }
    }
    
    // Calculate Normalized Power
    const normalizedPower = calculateNP(powers)
    
    // Duration
    const durationFromRecords = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].time : 0
    const duration = session.totalTimerTime || session.totalElapsedTime || durationFromRecords
    
    // Build merged session with all data
    const mergedSession = {
      sport: session.sport || 'cycling',
      sub_sport: session.subSport,
      start_time: startTime,
      total_timer_time: duration,
      total_elapsed_time: session.totalElapsedTime || duration,
      total_distance: session.totalDistance || totalDistance,
      total_ascent: session.totalAscent || Math.round(elevationGain),
      total_descent: session.totalDescent || 0,
      total_calories: session.totalCalories || 0,
      avg_power: session.avgPower || avgPower,
      max_power: session.maxPower || maxPower,
      avg_heart_rate: session.avgHeartRate || avgHr,
      max_heart_rate: session.maxHeartRate || maxHr,
      avg_cadence: session.avgCadence || avgCadence,
      max_cadence: session.maxCadence || 0,
      avg_speed: session.avgSpeed ? session.avgSpeed * 3.6 : avgSpeed,
      max_speed: session.maxSpeed ? session.maxSpeed * 3.6 : maxSpeed,
      normalized_power: session.normalizedPower || normalizedPower,
      training_stress_score: session.trainingStressScore,
      intensity_factor: session.intensityFactor,
      total_work: session.totalWork,
    }
    
    console.log('[FIT Parser] Final session:', JSON.stringify(mergedSession))
    
    return {
      format: 'fit',
      parsed: true,
      session: mergedSession,
      records,
      laps: laps.map((lap: any) => ({
        startTime: lap.startTime,
        totalElapsedTime: lap.totalElapsedTime,
        totalDistance: lap.totalDistance,
        avgSpeed: lap.avgSpeed ? lap.avgSpeed * 3.6 : undefined,
        avgHeartRate: lap.avgHeartRate,
        avgCadence: lap.avgCadence,
        avgPower: lap.avgPower,
        maxPower: lap.maxPower,
      })),
      dataPoints,
      startTime,
    }
  } catch (error) {
    console.error('[FIT Parser] Error:', error)
    throw error
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
  let activityType = 'cycling'
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
  const avgSpeed = session.avg_speed || 0
  const maxSpeed = session.max_speed || 0
  const normalizedPower = session.normalized_power || 0
  
  // Calculate TSS and IF
  const ftp = 200 // Default FTP - will be overwritten by athlete's FTP
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
    tss,
    intensity_factor: Math.round(intensityFactor * 100) / 100,
    variability_index: Math.round(vi * 100) / 100,
    start_lat: firstGpsPoint?.lat,
    start_lng: firstGpsPoint?.lng,
  }
}
