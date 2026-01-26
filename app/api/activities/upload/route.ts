"use server"

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseFitFile, extractActivitySummary } from "@/lib/fit-parser"

// Decompress gzip using Web Streams API (works in serverless)
async function decompressGzip(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const ds = new DecompressionStream('gzip')
  const decompressedStream = new Blob([buffer]).stream().pipeThrough(ds)
  const decompressedBlob = await new Response(decompressedStream).blob()
  return await decompressedBlob.arrayBuffer()
}

// TCX file parser
function parseTcxFile(content: string): any {
  // TCX is XML-based
  const activities: any[] = []
  
  // Extract activity type
  const sportMatch = content.match(/Sport="([^"]+)"/)
  const sport = sportMatch ? sportMatch[1] : 'Unknown'
  
  // Extract total time
  const totalTimeMatch = content.match(/<TotalTimeSeconds>([^<]+)<\/TotalTimeSeconds>/)
  const totalTimeSeconds = totalTimeMatch ? parseFloat(totalTimeMatch[1]) : 0
  
  // Extract distance
  const distanceMatch = content.match(/<DistanceMeters>([^<]+)<\/DistanceMeters>/)
  const distanceMeters = distanceMatch ? parseFloat(distanceMatch[1]) : 0
  
  // Extract calories
  const caloriesMatch = content.match(/<Calories>([^<]+)<\/Calories>/)
  const calories = caloriesMatch ? parseInt(caloriesMatch[1]) : 0
  
  // Extract start time
  const startTimeMatch = content.match(/<Id>([^<]+)<\/Id>/)
  const startTime = startTimeMatch ? startTimeMatch[1] : null
  
  // Extract average HR
  const avgHrMatch = content.match(/<AverageHeartRateBpm>\s*<Value>([^<]+)<\/Value>\s*<\/AverageHeartRateBpm>/)
  const avgHr = avgHrMatch ? parseInt(avgHrMatch[1]) : null
  
  // Extract max HR
  const maxHrMatch = content.match(/<MaximumHeartRateBpm>\s*<Value>([^<]+)<\/Value>\s*<\/MaximumHeartRateBpm>/)
  const maxHr = maxHrMatch ? parseInt(maxHrMatch[1]) : null
  
  return {
    format: 'tcx',
    sport,
    startTime,
    totalTimeSeconds,
    distanceMeters,
    calories,
    avgHr,
    maxHr
  }
}

// GPX file parser
function parseGpxFile(content: string): any {
  // GPX is XML-based
  const nameMatch = content.match(/<name>([^<]+)<\/name>/)
  const name = nameMatch ? nameMatch[1] : 'GPX Activity'
  
  const typeMatch = content.match(/<type>([^<]+)<\/type>/)
  const type = typeMatch ? typeMatch[1] : 'Unknown'
  
  // Extract track points for distance calculation
  const trkptRegex = /<trkpt lat="([^"]+)" lon="([^"]+)">/g
  const points: { lat: number; lon: number }[] = []
  let match
  while ((match = trkptRegex.exec(content)) !== null) {
    points.push({
      lat: parseFloat(match[1]),
      lon: parseFloat(match[2])
    })
  }
  
  // Calculate distance using Haversine formula
  let totalDistance = 0
  for (let i = 1; i < points.length; i++) {
    const R = 6371000 // Earth radius in meters
    const lat1 = points[i-1].lat * Math.PI / 180
    const lat2 = points[i].lat * Math.PI / 180
    const deltaLat = (points[i].lat - points[i-1].lat) * Math.PI / 180
    const deltaLon = (points[i].lon - points[i-1].lon) * Math.PI / 180
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon/2) * Math.sin(deltaLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    totalDistance += R * c
  }
  
  // Extract time info
  const timeRegex = /<time>([^<]+)<\/time>/g
  const times: string[] = []
  while ((match = timeRegex.exec(content)) !== null) {
    times.push(match[1])
  }
  
  let durationSeconds = 0
  let startTime = null
  if (times.length > 1) {
    startTime = times[0]
    const start = new Date(times[0]).getTime()
    const end = new Date(times[times.length - 1]).getTime()
    durationSeconds = (end - start) / 1000
  }
  
  return {
    format: 'gpx',
    name,
    type,
    startTime,
    durationSeconds,
    distanceMeters: totalDistance,
    trackPoints: points.length
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get athlete ID
    const { data: athlete } = await supabase
      .from('athletes')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    const athleteId = athlete?.id
    
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    const fileName = file.name.toLowerCase()
    
    // Handle gzipped files
    let isGzipped = fileName.endsWith('.gz')
    let actualExtension = ''
    
    if (isGzipped) {
      // Get the extension before .gz (e.g., .fit.gz -> fit)
      const parts = fileName.replace('.gz', '').split('.')
      actualExtension = parts[parts.length - 1]
    } else {
      actualExtension = fileName.split('.').pop() || ''
    }
    
    if (!['fit', 'tcx', 'gpx', 'json'].includes(actualExtension)) {
      return NextResponse.json({ 
        error: "Unsupported file format. Supported: FIT, TCX, GPX, JSON (also .gz compressed)" 
      }, { status: 400 })
    }
    
    let parsedData: any = null
    let fileBuffer = await file.arrayBuffer()
    
    // Decompress if gzipped
    if (isGzipped) {
      try {
        fileBuffer = await decompressGzip(fileBuffer)
        console.log('[v0] Decompressed gzip file, size:', fileBuffer.byteLength)
      } catch (gzipError: any) {
        console.error('[v0] Gzip decompression failed:', gzipError)
        return NextResponse.json({ 
          error: "Failed to decompress gzipped file",
          details: gzipError.message 
        }, { status: 400 })
      }
    }
    
    let summary: any = null
    
    if (actualExtension === 'fit') {
      parsedData = await parseFitFile(fileBuffer)
      summary = extractActivitySummary(parsedData)
      console.log('[v0] FIT parsed - summary:', summary)
    } else {
      // Convert buffer to text for XML/JSON formats
      const decoder = new TextDecoder('utf-8')
      const content = decoder.decode(fileBuffer)
      
      if (actualExtension === 'tcx') {
        parsedData = parseTcxFile(content)
      } else if (actualExtension === 'gpx') {
        parsedData = parseGpxFile(content)
      } else if (actualExtension === 'json') {
        parsedData = JSON.parse(content)
        parsedData.format = 'json'
      }
    }
    
    if (!parsedData) {
      return NextResponse.json({ error: "Failed to parse file" }, { status: 400 })
    }
    
    // Determine activity type from FIT summary or parsed data
    let activityType = summary?.activity_type || 'other'
    if (!summary && parsedData.sport) {
      const sport = parsedData.sport.toLowerCase()
      if (sport.includes('run')) activityType = 'running'
      else if (sport.includes('cycl') || sport.includes('bik')) activityType = 'cycling'
      else if (sport.includes('swim')) activityType = 'swimming'
      else if (sport.includes('walk')) activityType = 'walking'
      else activityType = sport
    } else if (!summary && parsedData.type) {
      activityType = parsedData.type.toLowerCase()
    }
    
    // Determine date - priority: filename > summary > session > records > now
    let activityDate = new Date()
    let dateSource = 'current'
    
    // Try to extract date from filename (format: tp-XXXXX.YYYY-MM-DD-HH-mm-ss-mmmZ or similar)
    console.log('[v0] Extracting date from filename:', file.name)
    const fileNameDateMatch = file.name.match(/\.(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/)
    if (fileNameDateMatch) {
      const [, year, month, day, hour, min, sec] = fileNameDateMatch
      const dateStr = `${year}-${month}-${day}T${hour}:${min}:${sec}Z`
      activityDate = new Date(dateStr)
      dateSource = 'filename'
      console.log('[v0] Extracted date from filename:', dateStr, '->', activityDate.toISOString())
    } else if (summary?.start_time) {
      activityDate = new Date(summary.start_time)
      dateSource = 'summary'
      console.log('[v0] Using summary start_time:', summary.start_time)
    } else if (parsedData.session?.start_time) {
      activityDate = new Date(parsedData.session.start_time)
      dateSource = 'session'
      console.log('[v0] Using session start_time:', parsedData.session.start_time)
    } else if (parsedData.records?.length > 0 && parsedData.records[0]?.timestamp) {
      activityDate = new Date(parsedData.records[0].timestamp)
      dateSource = 'first_record'
      console.log('[v0] Using first record timestamp:', parsedData.records[0].timestamp)
    } else if (parsedData.startTime) {
      activityDate = new Date(parsedData.startTime)
      dateSource = 'parsedData'
      console.log('[v0] Using parsedData startTime:', parsedData.startTime)
    } else {
      console.log('[v0] No start time found, using current date')
    }
    
    // Validate date is reasonable (not in future, not too old)
    const now = new Date()
    if (activityDate > now) {
      console.log('[v0] Date is in future, using current date instead')
      activityDate = now
    }
    
    console.log('[v0] Final activity date:', activityDate.toISOString(), 'source:', dateSource)
    
    // Helper to safely convert to integer
    const toInt = (val: any): number | null => {
      if (val === null || val === undefined) return null
      const num = Number(val)
      return isNaN(num) ? null : Math.round(num)
    }
    
    // Helper to safely convert to float (rounded to 2 decimals)
    const toFloat = (val: any): number | null => {
      if (val === null || val === undefined) return null
      const num = Number(val)
      return isNaN(num) ? null : Math.round(num * 100) / 100
    }
    
    // Create activity record with full metrics from FIT file
    const activityRecord = {
      user_id: user.id,
      athlete_id: athleteId,
      source_provider: 'manual_upload',
      source_id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activity_date: activityDate.toISOString().split('T')[0],
      activity_datetime: activityDate.toISOString(),
      activity_type: activityType,
      title: parsedData.name || `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} - ${activityDate.toLocaleDateString('it-IT')}`,
      // Use summary data from FIT parser if available - integers must be rounded
      duration_seconds: toInt(summary?.duration_seconds || parsedData.totalTimeSeconds || parsedData.durationSeconds),
      distance_meters: toFloat(summary?.distance_meters || parsedData.distanceMeters),
      elevation_gain_meters: toFloat(summary?.elevation_gain_meters || parsedData.elevationGain),
      calories: toInt(summary?.calories || parsedData.calories),
      avg_heart_rate: toInt(summary?.avg_heart_rate || parsedData.avgHr),
      max_heart_rate: toInt(summary?.max_heart_rate || parsedData.maxHr),
      avg_power_watts: toFloat(summary?.avg_power_watts || parsedData.avgPower),
      max_power_watts: toFloat(summary?.max_power_watts || parsedData.maxPower),
      normalized_power: toFloat(summary?.normalized_power),
      avg_cadence: toFloat(summary?.avg_cadence || parsedData.avgCadence),
      avg_speed_mps: toFloat(summary?.avg_speed_mps || parsedData.avgSpeed),
      max_speed_mps: toFloat(summary?.max_speed_mps || parsedData.maxSpeed),
      tss: toFloat(summary?.tss || parsedData.tss),
      intensity_factor: toFloat(summary?.intensity_factor),
      variability_index: toFloat(summary?.variability_index),
      start_lat: toFloat(summary?.start_lat || parsedData.startLat),
      start_lng: toFloat(summary?.start_lng || parsedData.startLng),
      // Store activity data with sampled dataPoints (keep under 500KB for REST API limit)
      raw_data: (() => {
        // Sample dataPoints: max 300 points, ultra-compact format
        const maxPoints = 300
        const totalPoints = parsedData.dataPoints?.length || 0
        const sampleRate = Math.max(1, Math.ceil(totalPoints / maxPoints))
        
        // Extract GPS route separately (every 10th point for map)
        const gpsPoints = parsedData.dataPoints?.length > 0 
          ? parsedData.dataPoints
              .filter((_: any, i: number) => i % Math.max(1, Math.ceil(totalPoints / 100)) === 0)
              .filter((p: any) => p.lat && p.lng)
              .slice(0, 100)
              .map((p: any) => [Math.round(p.lat * 100000) / 100000, Math.round(p.lng * 100000) / 100000])
          : []
        
        const sampledPoints = parsedData.dataPoints?.length > 0 
          ? parsedData.dataPoints
              .filter((_: any, i: number) => i % sampleRate === 0)
              .slice(0, maxPoints)
              .map((p: any) => {
                // Ultra-compact: array format [time, power, hr, cadence, speed, elevation]
                return [
                  Math.round(p.time || 0),
                  Math.round(p.power || 0),
                  Math.round(p.heartRate || 0),
                  Math.round(p.cadence || 0),
                  Math.round((p.speed || 0) * 10) / 10,
                  Math.round(p.elevation || 0)
                ]
              })
          : []
        
        return {
          sport: parsedData.sport,
          n: totalPoints, // total point count
          r: sampleRate,  // sample rate
          gps: gpsPoints, // GPS route for map
          d: sampledPoints // data points as arrays
        }
      })()
    }
    
    console.log('[v0] Activity record raw_data size:', JSON.stringify(activityRecord.raw_data).length, 'bytes')
    
    // Insert the activity record
    const { data: inserted, error: insertError } = await supabase
      .from('imported_activities')
      .insert(activityRecord)
      .select()
      .single()
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ 
        error: "Failed to save activity",
        details: insertError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Activity uploaded successfully",
      activity: {
        id: inserted.id,
        type: activityType,
        date: activityRecord.activity_date,
        duration: activityRecord.duration_seconds,
        distance: activityRecord.distance_meters,
        format: parsedData.format
      }
    })
    
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: "Failed to process upload",
      details: error.message 
    }, { status: 500 })
  }
}
