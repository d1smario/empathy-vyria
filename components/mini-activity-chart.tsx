"use client"

import { useMemo } from "react"
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts"

interface DataPoint {
  t?: number  // timestamp
  p?: number  // power
  h?: number  // heart rate
  s?: number  // speed
  c?: number  // cadence
  a?: number  // altitude
}

interface MiniActivityChartProps {
  data: DataPoint[]
  showPower?: boolean
  showHR?: boolean
  height?: number
}

export function MiniActivityChart({ 
  data, 
  showPower = true, 
  showHR = true,
  height = 64 
}: MiniActivityChartProps) {
  // Downsample data for mini chart (max 100 points)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const step = Math.max(1, Math.floor(data.length / 100))
    const sampled = []
    
    for (let i = 0; i < data.length; i += step) {
      const point = data[i]
      sampled.push({
        power: point.p || 0,
        hr: point.h || 0,
        idx: i
      })
    }
    
    return sampled
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
        No data
      </div>
    )
  }

  const maxPower = Math.max(...chartData.map(d => d.power || 0), 1)
  const maxHR = Math.max(...chartData.map(d => d.hr || 0), 1)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="powerGradientMini" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="hrGradientMini" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        
        {showPower && (
          <YAxis 
            yAxisId="power" 
            domain={[0, maxPower * 1.1]} 
            hide 
          />
        )}
        {showHR && (
          <YAxis 
            yAxisId="hr" 
            domain={[0, maxHR * 1.1]} 
            hide 
            orientation="right"
          />
        )}
        
        {showPower && (
          <Area
            yAxisId="power"
            type="monotone"
            dataKey="power"
            stroke="#f59e0b"
            strokeWidth={1}
            fill="url(#powerGradientMini)"
            isAnimationActive={false}
          />
        )}
        
        {showHR && (
          <Area
            yAxisId="hr"
            type="monotone"
            dataKey="hr"
            stroke="#ef4444"
            strokeWidth={1}
            fill="url(#hrGradientMini)"
            isAnimationActive={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
