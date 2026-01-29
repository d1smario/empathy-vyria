declare module 'fit-file-parser' {
  interface FitParserOptions {
    force?: boolean
    speedUnit?: 'km/h' | 'm/s'
    lengthUnit?: 'm' | 'km'
    temperatureUnit?: 'celsius' | 'kelvin' | 'fahrenheit'
    elapsedRecordField?: boolean
    mode?: 'cascade' | 'list' | 'both'
  }

  interface FitRecord {
    timestamp?: Date | string
    elapsed_time?: number
    position_lat?: number
    position_long?: number
    altitude?: number
    enhanced_altitude?: number
    heart_rate?: number
    cadence?: number
    distance?: number
    speed?: number
    enhanced_speed?: number
    power?: number
    temperature?: number
    [key: string]: any
  }

  interface FitLap {
    timestamp?: Date | string
    start_time?: Date | string
    total_timer_time?: number
    total_elapsed_time?: number
    total_distance?: number
    records?: FitRecord[]
    [key: string]: any
  }

  interface FitSession {
    sport?: string
    sub_sport?: string
    start_time?: Date | string
    total_timer_time?: number
    total_elapsed_time?: number
    total_distance?: number
    total_calories?: number
    total_ascent?: number
    avg_speed?: number
    max_speed?: number
    avg_heart_rate?: number
    max_heart_rate?: number
    avg_cadence?: number
    avg_power?: number
    max_power?: number
    normalized_power?: number
    laps?: FitLap[]
    [key: string]: any
  }

  interface FitActivity {
    type?: string
    timestamp?: Date | string
    sessions?: FitSession[]
    [key: string]: any
  }

  interface FitData {
    activity?: FitActivity
    sessions?: FitSession[]
    laps?: FitLap[]
    records?: FitRecord[]
    [key: string]: any
  }

  type ParseCallback = (error: Error | null, data: FitData) => void

  class FitParser {
    constructor(options?: FitParserOptions)
    parse(content: ArrayBuffer | Buffer, callback: ParseCallback): void
  }

  export default FitParser
}
