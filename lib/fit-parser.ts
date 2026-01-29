// FIT Parser using fit-file-parser (more robust)
// Supports files from Garmin, Polar, Wahoo, Strava, TrainingPeaks, etc.

import FitParser from 'fit-file-parser'

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
  rawData?: any // For debugging
}

export type ParsedFitFile = ParsedActivityFile

export async function parseFitFile(buffer: ArrayBuffer): Promise<ParsedActivityFile> {
  console.log('[FIT Parser] Starting parse, buffer size:', buffer.byteLength)
  
  return new Promise((resolve, reject) => {
    try {
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'km/h',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'list',  // 'list' mode puts records directly in data.records
      })
      
      fitParser.parse(buffer, (error: Error | null, data: any) => {
        if (error) {
          console.error('[FIT Parser] Parse error:', error)
          reject(error)
          return
        }
        
        console.log('[FIT Parser] Parse complete, keys:', Object.keys(data || {}))
        
        if (!data) {
          reject(new Error('FIT parser returned no data'))
          return
        }
        
        // Get activity/sessions
        const activity = data.activity || {}
        const sessions = activity.sessions || data.sessions || []
        const session = sessions[0] || {}
        
        console.log('[FIT Parser] Activity type:', session.sport)
        console.log('[FIT Parser] Sessions count:', sessions.length)
        
        // Get records from activity, session laps, or direct
        let records: any[] = []
        
        // Debug: log all available keys at each level
        console.log('[FIT Parser] Top level keys:', Object.keys(data))
        console.log('[FIT Parser] Activity keys:', Object.keys(activity))
        if (sessions.length > 0) {
          console.log('[FIT Parser] Session[0] keys:', Object.keys(sessions[0]))
        }
        
        // Try to get records from different locations (in priority order)
        // 1. Direct records array (most common for simple files)
        if (data.records && Array.isArray(data.records) && data.records.length > 0) {
          records = data.records
          console.log('[FIT Parser] Found records at data.records:', records.length)
        }
        // 2. Cascade mode - records inside laps inside sessions inside activity
        else if (activity.sessions?.[0]?.laps?.[0]?.records) {
          activity.sessions.forEach((s: any) => {
            s.laps?.forEach((lap: any) => {
              if (lap.records && Array.isArray(lap.records)) {
                records = records.concat(lap.records)
              }
            })
          })
          console.log('[FIT Parser] Found records in activity.sessions.laps:', records.length)
        }
        // 3. Records inside session laps
        else if (session.laps?.[0]?.records) {
          session.laps.forEach((lap: any) => {
            if (lap.records && Array.isArray(lap.records)) {
              records = records.concat(lap.records)
            }
          })
          console.log('[FIT Parser] Found records in session.laps:', records.length)
        }
        // 4. Records directly in laps array
        else if (data.laps && Array.isArray(data.laps)) {
          data.laps.forEach((lap: any) => {
            if (lap.records && Array.isArray(lap.records)) {
              records = records.concat(lap.records)
            }
          })
          console.log('[FIT Parser] Found records in data.laps:', records.length)
        }
        // 5. Activity records
        else if (activity.records && Array.isArray(activity.records)) {
          records = activity.records
          console.log('[FIT Parser] Found records at activity.records:', records.length)
        }
        
        // If still no records, try to find any array that looks like records
        if (records.length === 0) {
          console.log('[FIT Parser] No records found in standard locations, searching...')
          for (const key of Object.keys(data)) {
            const val = data[key]
            if (Array.isArray(val) && val.length > 0 && val[0] && (val[0].timestamp || val[0].heart_rate || val[0].power)) {
              records = val
              console.log('[FIT Parser] Found records at data.' + key + ':', records.length)
              break
            }
          }
        }
        
        console.log('[FIT Parser] Total records extracted:', records.length)
        if (records.length > 0) {
          console.log('[FIT Parser] First record sample:', JSON.stringify(records[0]).substring(0, 300))
        }
        
        // Get start time
        let startTime: Date | undefined
        if (records.length > 0 && records[0].timestamp) {
          startTime = new Date(records[0].timestamp)
        } else if (session.start_time) {
          startTime = new Date(session.start_time)
        } else if (activity.timestamp) {
          startTime = new Date(activity.timestamp)
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
        
        for (let i = 0; i < records.length; i++) {
          const rec = records[i]
          
          // Calculate time from start
          let timeFromStart = 0
          if (rec.elapsed_time !== undefined) {
            timeFromStart = rec.elapsed_time
          } else if (startTime && rec.timestamp) {
            timeFromStart = (new Date(rec.timestamp).getTime() - startTime.getTime()) / 1000
          }
          
          // Extract values
          const power = rec.power
          const hr = rec.heart_rate
          const cadence = rec.cadence
          const speed = rec.speed // already in km/h from parser options
          const elevation = rec.altitude || rec.enhanced_altitude
          const lat = rec.position_lat
          const lng = rec.position_long
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
          if (speed && speed > 0) {
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
        
        // Sample first 3 data points for debugging
        if (dataPoints.length > 0) {
          console.log('[FIT Parser] Sample dataPoints:', JSON.stringify(dataPoints.slice(0, 3)))
        }
        
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
            if (diff > 0 && diff < 50) elevationGain += diff
          }
        }
        
        // Calculate NP
        const normalizedPower = calculateNP(powers)
        
        // Duration
        const durationFromRecords = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].time : 0
        const duration = session.total_timer_time || session.total_elapsed_time || durationFromRecords
        
        // Build merged session
        const mergedSession = {
          sport: session.sport || activity.type || 'cycling',
          sub_sport: session.sub_sport,
          start_time: startTime,
          total_timer_time: duration,
          total_elapsed_time: session.total_elapsed_time || duration,
          total_distance: session.total_distance || totalDistance,
          total_ascent: session.total_ascent || Math.round(elevationGain),
          total_calories: session.total_calories || 0,
          avg_power: session.avg_power || avgPower,
          max_power: session.max_power || maxPower,
          avg_heart_rate: session.avg_heart_rate || avgHr,
          max_heart_rate: session.max_heart_rate || maxHr,
          avg_cadence: session.avg_cadence || avgCadence,
          avg_speed: session.avg_speed || avgSpeed,
          max_speed: session.max_speed || maxSpeed,
          normalized_power: session.normalized_power || normalizedPower,
        }
        
        console.log('[FIT Parser] Session summary:', JSON.stringify({
          sport: mergedSession.sport,
          duration: mergedSession.total_timer_time,
          distance: mergedSession.total_distance,
          avgPower: mergedSession.avg_power,
          avgHr: mergedSession.avg_heart_rate,
          avgSpeed: mergedSession.avg_speed,
        }))
        
        // Get laps
        const laps = session.laps || activity.sessions?.[0]?.laps || data.laps || []
        
        resolve({
          format: 'fit',
          parsed: true,
          session: mergedSession,
          records,
          laps,
          dataPoints,
          startTime,
          rawData: data, // For debugging
        })
      })
    } catch (err) {
      console.error('[FIT Parser] Exception:', err)
      reject(err)
    }
  })
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
