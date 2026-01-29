"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Bike,
  Heart,
  Zap,
  Timer,
  Route,
  TrendingUp,
  Thermometer,
  Activity,
  Droplet,
  ChevronDown,
  ChevronUp,
  Mountain,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"

interface ActivityDetailProps {
  activityId: string
  onBack: () => void
  hrZones?: Record<string, { name: string; min: number; max: number; color: string }> | null
}

interface GpsDataPoint {
  timestamp_ms: number
  latitude: number | null
  longitude: number | null
  altitude_m: number | null
  speed_kmh: number | null
  heart_rate: number | null
  power_watts: number | null
  cadence: number | null
  core_temp_c: number | null
  smo2_percent: number | null
  glucose_mgdl: number | null
}

interface LapData {
  lap_number: number
  duration_seconds: number
  distance_m: number
  avg_power: number | null
  max_power: number | null
  avg_hr: number | null
  max_hr: number | null
  avg_cadence: number | null
  avg_speed_kmh: number | null
}

interface ActivityData {
  id: string
  activity_date: string
  activity_type: string
  title: string
  description: string | null
  duration_minutes: number | null
  distance_km: number | null
  tss: number | null
  normalized_power: number | null
  average_power: number | null
  max_power: number | null
  average_hr: number | null
  max_hr: number | null
  average_cadence: number | null
  elevation_gain: number | null
  calories: number | null
  avg_core_temp_c: number | null
  max_core_temp_c: number | null
  avg_smo2: number | null
  avg_glucose_mgdl: number | null
  source: string
  device_name: string | null
  training_effect_aerobic: number | null
  training_effect_anaerobic: number | null
}

export function ActivityDetail({ activityId, onBack, hrZones }: ActivityDetailProps) {
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [gpsData, setGpsData] = useState<GpsDataPoint[]>([])
  const [laps, setLaps] = useState<LapData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAllLaps, setShowAllLaps] = useState(false)

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true)
      const supabase = createClient()
      if (!supabase) return

      const { data: activityData } = await supabase
        .from("training_activities")
        .select("*")
        .eq("id", activityId)
        .single()

      if (activityData) {
        setActivity(activityData)
      }

      const { data: gpsPoints } = await supabase
        .from("activity_gps_data")
        .select("*")
        .eq("activity_id", activityId)
        .order("timestamp_ms", { ascending: true })

      if (gpsPoints) {
        setGpsData(gpsPoints)
      }

      const { data: lapData } = await supabase
        .from("activity_laps")
        .select("*")
        .eq("activity_id", activityId)
        .order("lap_number", { ascending: true })

      if (lapData) {
        setLaps(lapData)
      }

      setIsLoading(false)
    }

    fetchActivity()
  }, [activityId])

  const formatChartData = () => {
    if (gpsData.length === 0) return []

    const startTime = gpsData[0].timestamp_ms
    return gpsData.map((point) => ({
      time: Math.round((point.timestamp_ms - startTime) / 60000),
      hr: point.heart_rate,
      power: point.power_watts,
      cadence: point.cadence,
      speed: point.speed_kmh,
      altitude: point.altitude_m,
      coreTemp: point.core_temp_c,
      smo2: point.smo2_percent,
      glucose: point.glucose_mgdl,
    }))
  }

  const chartData = formatChartData()

  const calculateZoneTime = () => {
    if (!hrZones || gpsData.length === 0) return null

    const zoneTimes: Record<string, number> = {}
    Object.keys(hrZones).forEach((key) => {
      zoneTimes[key] = 0
    })

    gpsData.forEach((point) => {
      if (!point.heart_rate) return
      const hr = point.heart_rate

      Object.entries(hrZones).forEach(([key, zone]) => {
        if (hr >= zone.min && hr <= zone.max) {
          zoneTimes[key] += 1
        }
      })
    })

    return zoneTimes
  }

  const zoneTime = calculateZoneTime()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Attività non trovata</p>
        <Button variant="outline" onClick={onBack} className="mt-4 bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al calendario
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <Badge variant="outline">{activity.source}</Badge>
      </div>

      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bike className="h-6 w-6" />
          {activity.title}
        </h2>
        <p className="text-muted-foreground">
          {format(new Date(activity.activity_date), "EEEE d MMMM yyyy", { locale: it })}
          {activity.device_name && ` • ${activity.device_name}`}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <Timer className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">
              {activity.duration_minutes
                ? `${Math.floor(activity.duration_minutes / 60)}:${String(activity.duration_minutes % 60).padStart(2, "0")}`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Durata</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <Route className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{activity.distance_km?.toFixed(1) || "—"}</p>
            <p className="text-xs text-muted-foreground">km</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <Mountain className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{activity.elevation_gain || "—"}</p>
            <p className="text-xs text-muted-foreground">m D+</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-lg font-bold">{activity.tss || "—"}</p>
            <p className="text-xs text-muted-foreground">TSS</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold">{activity.normalized_power || activity.average_power || "—"}</p>
            <p className="text-xs text-muted-foreground">{activity.normalized_power ? "NP" : "Avg"} W</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-lg font-bold">{activity.average_hr || "—"}</p>
            <p className="text-xs text-muted-foreground">Avg HR</p>
          </CardContent>
        </Card>
      </div>

      {(activity.avg_core_temp_c || activity.avg_smo2 || activity.avg_glucose_mgdl) && (
        <div className="grid grid-cols-3 gap-3">
          {activity.avg_core_temp_c && (
            <Card className="bg-orange-500/10 border-orange-500/30">
              <CardContent className="p-3 text-center">
                <Thermometer className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                <p className="text-lg font-bold">{activity.avg_core_temp_c.toFixed(1)}°C</p>
                <p className="text-xs text-muted-foreground">
                  Core Temp (max: {activity.max_core_temp_c?.toFixed(1)}°C)
                </p>
              </CardContent>
            </Card>
          )}
          {activity.avg_smo2 && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-3 text-center">
                <Activity className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <p className="text-lg font-bold">{activity.avg_smo2.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">SmO2 (Moxy)</p>
              </CardContent>
            </Card>
          )}
          {activity.avg_glucose_mgdl && (
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-3 text-center">
                <Droplet className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                <p className="text-lg font-bold">{activity.avg_glucose_mgdl}</p>
                <p className="text-xs text-muted-foreground">mg/dL Glucose</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="power" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="power">Power</TabsTrigger>
          <TabsTrigger value="hr">Heart Rate</TabsTrigger>
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="laps">Laps</TabsTrigger>
        </TabsList>

        <TabsContent value="power">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Power & Cadence</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <YAxis yAxisId="power" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, "auto"]} />
                    <YAxis
                      yAxisId="cadence"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={[0, 150]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="power"
                      type="monotone"
                      dataKey="power"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                      name="Power (W)"
                    />
                    <Line
                      yAxisId="cadence"
                      type="monotone"
                      dataKey="cadence"
                      stroke="hsl(var(--chart-2))"
                      dot={false}
                      name="Cadence (rpm)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nessun dato disponibile per questa attività
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hr">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Heart Rate</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[80, 200]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    {hrZones &&
                      Object.entries(hrZones).map(([key, zone]) => (
                        <ReferenceLine
                          key={key}
                          y={zone.max}
                          stroke={zone.color}
                          strokeDasharray="3 3"
                          label={{ value: zone.name, position: "right", fontSize: 10 }}
                        />
                      ))}
                    <Area
                      type="monotone"
                      dataKey="hr"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                      name="Heart Rate (bpm)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nessun dato disponibile
                </div>
              )}

              {zoneTime && hrZones && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium">Tempo nelle zone</h4>
                  {Object.entries(hrZones).map(([key, zone]) => {
                    const seconds = zoneTime[key] || 0
                    const minutes = Math.round(seconds / 60)
                    const totalMinutes = activity.duration_minutes || 1
                    const percentage = Math.round((minutes / totalMinutes) * 100)

                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: zone.color }} />
                        <span className="text-xs w-24">{zone.name}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: zone.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right">
                          {minutes}m ({percentage}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensors">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sensor Data</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.some((d) => d.coreTemp || d.smo2 || d.glucose) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <YAxis yAxisId="temp" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[36, 42]} />
                    <YAxis
                      yAxisId="percent"
                      orientation="right"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="coreTemp"
                      stroke="#f97316"
                      dot={false}
                      name="Core Temp (°C)"
                    />
                    <Line
                      yAxisId="percent"
                      type="monotone"
                      dataKey="smo2"
                      stroke="#3b82f6"
                      dot={false}
                      name="SmO2 (%)"
                    />
                    <Line
                      yAxisId="percent"
                      type="monotone"
                      dataKey="glucose"
                      stroke="#a855f7"
                      dot={false}
                      name="Glucose (mg/dL)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Nessun dato sensori disponibile</p>
                    <p className="text-xs mt-1">Collega CORE, Moxy o Abbott per vedere i dati</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laps">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Laps / Intervals</CardTitle>
            </CardHeader>
            <CardContent>
              {laps.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <span>Lap</span>
                    <span>Time</span>
                    <span>Distance</span>
                    <span>Avg Power</span>
                    <span>Max Power</span>
                    <span>Avg HR</span>
                    <span>Speed</span>
                  </div>
                  {(showAllLaps ? laps : laps.slice(0, 5)).map((lap) => (
                    <div key={lap.lap_number} className="grid grid-cols-7 gap-2 text-sm py-2 border-b border-border/50">
                      <span className="font-medium">{lap.lap_number}</span>
                      <span>
                        {Math.floor(lap.duration_seconds / 60)}:{String(lap.duration_seconds % 60).padStart(2, "0")}
                      </span>
                      <span>{(lap.distance_m / 1000).toFixed(2)} km</span>
                      <span>{lap.avg_power || "—"} W</span>
                      <span>{lap.max_power || "—"} W</span>
                      <span>{lap.avg_hr || "—"} bpm</span>
                      <span>{lap.avg_speed_kmh?.toFixed(1) || "—"} km/h</span>
                    </div>
                  ))}
                  {laps.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAllLaps(!showAllLaps)}>
                      {showAllLaps ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Show All ({laps.length} laps)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Nessun lap disponibile per questa attività
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
