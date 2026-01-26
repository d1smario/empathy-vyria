"use client"

import React from "react"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import {
  X, Bike, Activity, Heart, Zap, Timer, Route, Mountain,
  Thermometer, Gauge, MapPin, Flame
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart
} from "recharts"

interface ActivityDetailViewProps {
  activity: any
  onClose: () => void
  athleteFTP?: number
}

export function ActivityDetailView({ activity, onClose, athleteFTP = 250 }: ActivityDetailViewProps) {
  const [activeMetrics, setActiveMetrics] = useState({
    power: true,
    hr: true,
    cadence: false,
    speed: true,
    elevation: true,
    temperature: false
  })

  // Extract and normalize dataPoints from raw_data (support array and object formats)
  const dataPoints = useMemo(() => {
    const rawData = activity?.raw_data
    if (!rawData) return []
    
    // New ultra-compact array format: d = [[time, power, hr, cadence, speed, elevation], ...]
    if (rawData.d && Array.isArray(rawData.d)) {
      return rawData.d.map((p: any) => ({
        time: p[0] || 0,
        power: p[1] || 0,
        heartRate: p[2] || 0,
        cadence: p[3] || 0,
        speed: p[4] || 0,
        elevation: p[5] || 0,
      }))
    }
    
    // Old object format with dataPoints array
    if (rawData.dataPoints && Array.isArray(rawData.dataPoints)) {
      return rawData.dataPoints.map((p: any) => ({
        time: p.t ?? p.time ?? 0,
        power: p.p ?? p.power ?? 0,
        heartRate: p.h ?? p.heartRate ?? 0,
        cadence: p.c ?? p.cadence ?? 0,
        speed: p.s ?? p.speed ?? 0,
        elevation: p.e ?? p.elevation ?? 0,
        temperature: p.temp ?? p.temperature
      }))
    }
    
    return []
  }, [activity])
  
  // Extract GPS points for map
  const gpsPoints = useMemo(() => {
    const rawData = activity?.raw_data
    if (!rawData?.gps) return []
    return rawData.gps.map((p: any) => ({ lat: p[0], lng: p[1] }))
  }, [activity])

  // Calculate all metrics from dataPoints
  const metrics = useMemo(() => {
    if (dataPoints.length === 0) return null
    
    const hrValues = dataPoints.map((p: any) => p.heartRate).filter((v: number) => v && v > 0)
    const powerValues = dataPoints.map((p: any) => p.power).filter((v: number) => v && v > 0)
    const cadenceValues = dataPoints.map((p: any) => p.cadence).filter((v: number) => v && v > 0)
    const speedValues = dataPoints.map((p: any) => p.speed).filter((v: number) => v && v > 0)
    const elevationValues = dataPoints.map((p: any) => p.elevation).filter((v: number) => v !== undefined)
    const tempValues = dataPoints.map((p: any) => p.temperature).filter((v: number) => v !== undefined)
    
    const calc = (arr: number[], fn: 'avg' | 'max' | 'min') => {
      if (arr.length === 0) return null
      if (fn === 'avg') return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
      if (fn === 'max') return Math.max(...arr)
      if (fn === 'min') return Math.min(...arr)
      return null
    }
    
    // Calculate NP
    let np = 0
    if (powerValues.length >= 30) {
      const windowSize = 30
      const rollingAvgs: number[] = []
      for (let i = windowSize - 1; i < powerValues.length; i++) {
        const window = powerValues.slice(i - windowSize + 1, i + 1)
        const avg = window.reduce((a: number, b: number) => a + b, 0) / windowSize
        rollingAvgs.push(Math.pow(avg, 4))
      }
      if (rollingAvgs.length > 0) {
        np = Math.round(Math.pow(rollingAvgs.reduce((a, b) => a + b, 0) / rollingAvgs.length, 0.25))
      }
    } else if (powerValues.length > 0) {
      np = calc(powerValues, 'avg') || 0
    }
    
    // Calculate elevation gain
    let elevGain = 0
    if (elevationValues.length > 1) {
      for (let i = 1; i < elevationValues.length; i++) {
        const diff = elevationValues[i] - elevationValues[i - 1]
        if (diff > 0) elevGain += diff
      }
    }
    
    const duration = dataPoints[dataPoints.length - 1]?.time || activity.duration_seconds || 0
    const distance = dataPoints[dataPoints.length - 1]?.distance || activity.distance_meters || 0
    const avgPower = calc(powerValues, 'avg') || 0
    const intensityFactor = athleteFTP > 0 ? np / athleteFTP : 0
    const tss = duration > 0 ? Math.round((duration * np * intensityFactor) / (athleteFTP * 3600) * 100) : 0
    const work = Math.round(avgPower * duration / 1000)
    
    return {
      duration,
      distance,
      elevationGain: Math.round(elevGain) || activity.elevation_gain_meters || 0,
      avgSpeed: speedValues.length > 0 ? calc(speedValues, 'avg') : (duration > 0 ? Math.round(distance / duration * 3.6 * 10) / 10 : 0),
      maxSpeed: calc(speedValues, 'max'),
      minSpeed: calc(speedValues, 'min'),
      avgHr: calc(hrValues, 'avg'),
      maxHr: calc(hrValues, 'max'),
      minHr: calc(hrValues, 'min'),
      avgPower,
      maxPower: calc(powerValues, 'max'),
      minPower: calc(powerValues, 'min'),
      np,
      avgCadence: calc(cadenceValues, 'avg'),
      maxCadence: calc(cadenceValues, 'max'),
      minCadence: calc(cadenceValues, 'min'),
      avgTemp: calc(tempValues, 'avg'),
      maxTemp: calc(tempValues, 'max'),
      minTemp: calc(tempValues, 'min'),
      avgElevation: calc(elevationValues, 'avg'),
      maxElevation: calc(elevationValues, 'max'),
      minElevation: calc(elevationValues, 'min'),
      tss,
      intensityFactor: Math.round(intensityFactor * 100) / 100,
      variabilityIndex: avgPower > 0 ? Math.round(np / avgPower * 100) / 100 : 1,
      work,
      calories: activity.calories || Math.round(work * 0.24)
    }
  }, [dataPoints, activity, athleteFTP])

  // Calculate power curve
  const powerCurve = useMemo(() => {
    if (dataPoints.length === 0) return []
    const powerValues = dataPoints.map((p: any) => p.power || 0)
    if (powerValues.filter((p: number) => p > 0).length === 0) return []
    
    const durations = [1, 3, 5, 10, 20, 30, 60, 120, 180, 300, 600, 1200, 1800, 3600]
    const curve: { duration: number; label: string; power: number }[] = []
    
    for (const dur of durations) {
      if (dur > powerValues.length) break
      
      let maxAvg = 0
      for (let i = 0; i <= powerValues.length - dur; i++) {
        const window = powerValues.slice(i, i + dur)
        const avg = window.reduce((a: number, b: number) => a + b, 0) / dur
        if (avg > maxAvg) maxAvg = avg
      }
      
      let label = `${dur}s`
      if (dur >= 60) {
        const mins = Math.floor(dur / 60)
        label = `${mins}'`
      }
      
      if (maxAvg > 0) {
        curve.push({ duration: dur, label, power: Math.round(maxAvg) })
      }
    }
    
    return curve
  }, [dataPoints])

  // Format chart data
  const chartData = useMemo(() => {
    if (dataPoints.length === 0) return []
    const sampleRate = Math.max(1, Math.floor(dataPoints.length / 600))
    return dataPoints
      .filter((_: any, i: number) => i % sampleRate === 0)
      .map((p: any) => ({
        time: p.timeFormatted || formatSeconds(p.time),
        power: p.power || 0,
        hr: p.heartRate || 0,
        cadence: p.cadence || 0,
        speed: p.speed ? Math.round(p.speed * 10) / 10 : 0,
        elevation: p.elevation || 0,
        temperature: p.temperature || 0
      }))
  }, [dataPoints])

  // GPS track for map
  const gpsTrack = useMemo(() => {
    return dataPoints.filter((p: any) => p.lat && p.lng).map((p: any) => [p.lat, p.lng])
  }, [dataPoints])

  if (!activity) return null

  const activityDate = activity.activity_datetime 
    ? new Date(activity.activity_datetime) 
    : new Date(activity.activity_date)

  const m = metrics

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-auto">
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Bike className="h-7 w-7 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {activity.title || `${activity.activity_type} - ${format(activityDate, "dd/MM/yyyy")}`}
              </h1>
              <p className="text-sm text-gray-400">
                {format(activityDate, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Fitness {m?.tss ? Math.round(m.tss * 0.5) : "--"}</Badge>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Fatica {m?.tss ? Math.round(m.tss * 0.7) : "--"}</Badge>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Form {m?.tss ? Math.round(m.tss * -0.2) : "--"}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-6 gap-2 p-4 border-b border-gray-800 bg-gray-950">
          <StatBox icon={<Timer className="h-4 w-4" />} label="Durata" value={formatDuration(m?.duration)} />
          <StatBox icon={<Route className="h-4 w-4" />} label="Distanza" value={`${formatDistance(m?.distance)} km`} />
          <StatBox icon={<Mountain className="h-4 w-4" />} label="Dislivello" value={`${m?.elevationGain || "--"} m`} />
          <StatBox icon={<Gauge className="h-4 w-4" />} label="Vel. Media" value={`${m?.avgSpeed || "--"} km/h`} />
          <StatBox icon={<Zap className="h-4 w-4 text-yellow-500" />} label="Potenza" value={`${m?.avgPower || "--"} W`} />
          <StatBox icon={<Activity className="h-4 w-4 text-orange-500" />} label="TSS" value={`${m?.tss || "--"}`} highlight />
        </div>

        <div className="grid grid-cols-12 gap-4 p-4">
          {/* Chart Area */}
          <div className="col-span-8 space-y-4">
            {/* Metric Toggles */}
            <div className="flex gap-2 flex-wrap">
              <MetricBtn active={activeMetrics.power} onClick={() => setActiveMetrics(p => ({...p, power: !p.power}))} color="#eab308" label="Power" />
              <MetricBtn active={activeMetrics.hr} onClick={() => setActiveMetrics(p => ({...p, hr: !p.hr}))} color="#ef4444" label="HR" />
              <MetricBtn active={activeMetrics.cadence} onClick={() => setActiveMetrics(p => ({...p, cadence: !p.cadence}))} color="#a855f7" label="RPM" />
              <MetricBtn active={activeMetrics.speed} onClick={() => setActiveMetrics(p => ({...p, speed: !p.speed}))} color="#22c55e" label="KPH" />
              <MetricBtn active={activeMetrics.elevation} onClick={() => setActiveMetrics(p => ({...p, elevation: !p.elevation}))} color="#6b7280" label="Elevation" />
              <MetricBtn active={activeMetrics.temperature} onClick={() => setActiveMetrics(p => ({...p, temperature: !p.temperature}))} color="#06b6d4" label="Temp" />
            </div>

            {/* Main Chart */}
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-2">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4b5563" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="#4b5563" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={{ stroke: '#374151' }} tickLine={false} interval="preserveStartEnd" />
                    {activeMetrics.elevation && <YAxis yAxisId="elev" orientation="right" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} domain={['dataMin - 50', 'dataMax + 50']} />}
                    <YAxis yAxisId="main" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    {activeMetrics.elevation && <Area yAxisId="elev" type="monotone" dataKey="elevation" fill="url(#elevGrad)" stroke="#9ca3af" strokeWidth={2} />}
                    {activeMetrics.power && <Line yAxisId="main" type="monotone" dataKey="power" stroke="#eab308" strokeWidth={0.5} dot={false} />}
                    {activeMetrics.hr && <Line yAxisId="main" type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={0.5} dot={false} />}
                    {activeMetrics.cadence && <Line yAxisId="main" type="monotone" dataKey="cadence" stroke="#a855f7" strokeWidth={0.5} dot={false} />}
                    {activeMetrics.speed && <Line yAxisId="main" type="monotone" dataKey="speed" stroke="#22c55e" strokeWidth={0.5} dot={false} />}
                    {activeMetrics.temperature && <Line yAxisId="main" type="monotone" dataKey="temperature" stroke="#06b6d4" strokeWidth={0.5} dot={false} />}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Power Curve */}
            {powerCurve.length > 0 && (
              <Card className="bg-gray-950 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Curva di Potenza</h3>
                  <div className="flex gap-4 mb-3 overflow-x-auto pb-2">
                    {powerCurve.map((p) => (
                      <div key={p.duration} className="text-center flex-shrink-0">
                        <div className="text-[10px] text-gray-500">{p.label}</div>
                        <div className="text-sm font-bold text-yellow-500">{p.power}W</div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={powerCurve}>
                      <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={{ stroke: '#374151' }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} />
                      <Line type="monotone" dataKey="power" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* GPS Map */}
            {gpsTrack.length > 0 && (
              <Card className="bg-gray-950 border-gray-800">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Mappa GPS
                  </h3>
                  <div className="h-48 bg-gray-900 rounded-lg overflow-hidden">
                    <img 
                      src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/path-2+f59e0b-0.8(${encodeURIComponent(gpsTrack.slice(0, 80).map((p: number[]) => `${p[1]},${p[0]}`).join(','))})/auto/800x250@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`}
                      alt="GPS Track"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="col-span-4 space-y-4">
            {/* Summary Table */}
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Riepilogo</h3>
                <div className="space-y-2 text-sm">
                  <Row label="Ore Totali" value={formatDuration(m?.duration)} />
                  <Row label="Distanza" value={`${formatDistance(m?.distance)} km`} />
                  <Row label="Vel. Media" value={`${m?.avgSpeed || "--"} km/h`} />
                  <Row label="Potenza Media" value={`${m?.avgPower || "--"} W`} />
                  <Row label="TSS" value={`${m?.tss || "--"}`} highlight />
                </div>
                <div className="border-t border-gray-800 mt-3 pt-3 space-y-2 text-sm">
                  <Row label="Lavoro" value={`${m?.work || "--"} kJ`} />
                  <Row label="NP" value={`${m?.np || "--"} W`} />
                  <Row label="IF" value={`${m?.intensityFactor || "--"}`} />
                  <Row label="VI" value={`${m?.variabilityIndex || "--"}`} />
                  <Row label="Calorie" value={`${m?.calories || "--"} kcal`} />
                </div>
              </CardContent>
            </Card>

            {/* Parameters Table */}
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Parametri</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-left pb-2 font-normal"></th>
                      <th className="text-right pb-2 font-normal">Min</th>
                      <th className="text-right pb-2 font-normal">Media</th>
                      <th className="text-right pb-2 font-normal">Max</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <ParamRow icon={<Zap className="h-3 w-3 text-yellow-500" />} label="Potenza" unit="W" min={m?.minPower} avg={m?.avgPower} max={m?.maxPower} />
                    <ParamRow icon={<Heart className="h-3 w-3 text-red-500" />} label="FC" unit="bpm" min={m?.minHr} avg={m?.avgHr} max={m?.maxHr} />
                    <ParamRow icon={<Activity className="h-3 w-3 text-purple-500" />} label="Cadenza" unit="rpm" min={m?.minCadence} avg={m?.avgCadence} max={m?.maxCadence} />
                    <ParamRow icon={<Gauge className="h-3 w-3 text-green-500" />} label="Velocità" unit="km/h" min={m?.minSpeed} avg={m?.avgSpeed} max={m?.maxSpeed} />
                    <ParamRow icon={<Mountain className="h-3 w-3 text-gray-400" />} label="Altitudine" unit="m" min={m?.minElevation} avg={m?.avgElevation} max={m?.maxElevation} />
                    <ParamRow icon={<Thermometer className="h-3 w-3 text-cyan-500" />} label="Temp" unit="°C" min={m?.minTemp} avg={m?.avgTemp} max={m?.maxTemp} />
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Altre Statistiche</h3>
                <div className="space-y-2 text-sm">
                  <Row label="Dislivello+" value={`${m?.elevationGain || "--"} m`} />
                  <Row label="Vel. Max" value={`${m?.maxSpeed || "--"} km/h`} />
                  <Row label="Potenza Max" value={`${m?.maxPower || "--"} W`} />
                  <Row label="FC Max" value={`${m?.maxHr || "--"} bpm`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Components
function StatBox({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-lg font-bold ${highlight ? 'text-orange-500' : 'text-white'}`}>{value}</div>
    </div>
  )
}

function MetricBtn({ active, onClick, color, label }: { active: boolean; onClick: () => void; color: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all border ${
        active ? 'border-transparent text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600'
      }`}
      style={{ backgroundColor: active ? color : 'transparent' }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: active ? '#fff' : color }} />
      {label}
    </button>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-800/50">
      <span className="text-gray-400">{label}</span>
      <span className={highlight ? 'font-bold text-orange-500' : 'text-white'}>{value}</span>
    </div>
  )
}

function ParamRow({ icon, label, unit, min, avg, max }: { icon: React.ReactNode; label: string; unit: string; min?: number | null; avg?: number | null; max?: number | null }) {
  return (
    <tr className="border-b border-gray-800/50">
      <td className="py-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-gray-400">{label}</span>
        </div>
      </td>
      <td className="text-right py-1.5">{min ?? "--"}</td>
      <td className="text-right py-1.5 font-medium text-white">{avg ?? "--"}</td>
      <td className="text-right py-1.5">{max ?? "--"}</td>
    </tr>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs">
      <div className="text-gray-400 mb-1">{p?.time}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {p?.power > 0 && <div><span className="text-yellow-500">Power:</span> <span className="text-white">{p.power}W</span></div>}
        {p?.hr > 0 && <div><span className="text-red-500">HR:</span> <span className="text-white">{p.hr}bpm</span></div>}
        {p?.cadence > 0 && <div><span className="text-purple-500">RPM:</span> <span className="text-white">{p.cadence}</span></div>}
        {p?.speed > 0 && <div><span className="text-green-500">Speed:</span> <span className="text-white">{p.speed}km/h</span></div>}
        {p?.elevation > 0 && <div><span className="text-gray-400">Elev:</span> <span className="text-white">{p.elevation}m</span></div>}
      </div>
    </div>
  )
}

// Utilities
function formatDuration(seconds?: number | null): string {
  if (!seconds) return "--:--:--"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatDistance(meters?: number | null): string {
  if (!meters) return "--"
  return (meters / 1000).toFixed(1)
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}
