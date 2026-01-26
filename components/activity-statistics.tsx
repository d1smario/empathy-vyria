"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Trophy, Flame, Clock, Route, Mountain, Zap, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ActivityStatisticsProps {
  athleteId: string | undefined
}

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444", "#8b5cf6"]

export function ActivityStatistics({ athleteId }: ActivityStatisticsProps) {
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [yearlyStats, setYearlyStats] = useState<any>({
    totalActivities: 0,
    totalDistance: 0,
    totalDuration: 0,
    totalElevation: 0,
    totalCalories: 0,
    totalTSS: 0,
    longestRide: 0,
    highestElevation: 0,
    maxPower: 0,
  })
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
  const [activityTypes, setActivityTypes] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [personalRecords, setPersonalRecords] = useState<any[]>([])

  useEffect(() => {
    if (athleteId) {
      loadStatistics()
    }
  }, [athleteId, year])

  const loadStatistics = async () => {
    setLoading(true)
    const supabase = createClient()
    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`

    try {
      // Load planned activities
      const { data: trainingActivities } = await supabase
        .from("training_activities")
        .select("*")
        .eq("athlete_id", athleteId)
        .gte("activity_date", yearStart)
        .lte("activity_date", yearEnd)
        .order("activity_date", { ascending: true })

      // Load imported activities
      const { data: importedActivities } = await supabase
        .from("imported_activities")
        .select("*")
        .eq("athlete_id", athleteId)
        .gte("activity_date", yearStart)
        .lte("activity_date", yearEnd)
        .order("activity_date", { ascending: true })

      // Merge activities, normalizing imported data to match training format
      const activities = [
        ...(trainingActivities || []),
        ...(importedActivities || []).map(a => ({
          ...a,
          duration_minutes: a.duration_seconds ? Math.round(a.duration_seconds / 60) : 0,
          distance_km: a.distance_meters ? Math.round(a.distance_meters / 1000 * 10) / 10 : 0,
          elevation_gain: a.elevation_gain_meters || 0,
          calories: a.calories || 0,
          max_power: a.max_power_watts || 0,
        }))
      ]

      console.log("[v0] Statistics: loaded", trainingActivities?.length || 0, "training +", importedActivities?.length || 0, "imported")

      if (activities.length > 0) {
        const stats = activities.reduce(
          (acc, a) => ({
            totalActivities: acc.totalActivities + 1,
            totalDistance: acc.totalDistance + (a.distance_km || 0),
            totalDuration: acc.totalDuration + (a.duration_minutes || 0),
            totalElevation: acc.totalElevation + (a.elevation_gain || 0),
            totalCalories: acc.totalCalories + (a.calories || 0),
            totalTSS: acc.totalTSS + (a.tss || 0),
            longestRide: Math.max(acc.longestRide, a.distance_km || 0),
            highestElevation: Math.max(acc.highestElevation, a.elevation_gain || 0),
            maxPower: Math.max(acc.maxPower, a.max_power || 0),
          }),
          {
            totalActivities: 0,
            totalDistance: 0,
            totalDuration: 0,
            totalElevation: 0,
            totalCalories: 0,
            totalTSS: 0,
            longestRide: 0,
            highestElevation: 0,
            maxPower: 0,
          },
        )

        setYearlyStats(stats)

        const monthlyGroups: { [key: string]: any } = {}
        const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"]
        months.forEach((m, i) => {
          monthlyGroups[i] = { month: m, distance: 0, duration: 0, tss: 0, activities: 0 }
        })

        activities.forEach((a) => {
          const month = new Date(a.activity_date).getMonth()
          monthlyGroups[month].distance += a.distance_km || 0
          monthlyGroups[month].duration += a.duration_minutes || 0
          monthlyGroups[month].tss += a.tss || 0
          monthlyGroups[month].activities += 1
        })
        setMonthlyTrends(Object.values(monthlyGroups))

        const typeGroups: { [key: string]: number } = {}
        activities.forEach((a) => {
          const type = a.activity_type || "Cycling"
          typeGroups[type] = (typeGroups[type] || 0) + 1
        })
        setActivityTypes(Object.entries(typeGroups).map(([name, value]) => ({ name, value })))

        const dayGroups = [0, 0, 0, 0, 0, 0, 0]
        activities.forEach((a) => {
          const day = new Date(a.activity_date).getDay()
          dayGroups[day] += 1
        })
        setHeatmapData([
          { day: "Dom", activities: dayGroups[0] },
          { day: "Lun", activities: dayGroups[1] },
          { day: "Mar", activities: dayGroups[2] },
          { day: "Mer", activities: dayGroups[3] },
          { day: "Gio", activities: dayGroups[4] },
          { day: "Ven", activities: dayGroups[5] },
          { day: "Sab", activities: dayGroups[6] },
        ])

        setPersonalRecords([
          {
            title: "Longest Ride",
            value: `${stats.longestRide.toFixed(1)} km`,
            icon: Route,
            date: activities.find((a) => a.distance_km === stats.longestRide)?.activity_date,
          },
          {
            title: "Most Elevation",
            value: `${stats.highestElevation} m`,
            icon: Mountain,
            date: activities.find((a) => a.elevation_gain === stats.highestElevation)?.activity_date,
          },
          {
            title: "Max Power",
            value: `${stats.maxPower} W`,
            icon: Zap,
            date: activities.find((a) => a.max_power === stats.maxPower)?.activity_date,
          },
        ])
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Training Statistics</h3>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...Array(5)].map((_, i) => {
              const y = new Date().getFullYear() - i
              return (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearlyStats.totalActivities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearlyStats.totalDistance.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">km</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(yearlyStats.totalDuration / 60)}</div>
            <p className="text-xs text-muted-foreground">hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Elevation</CardTitle>
            <Mountain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(yearlyStats.totalElevation / 1000).toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">km</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TSS</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yearlyStats.totalTSS}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(yearlyStats.totalCalories / 1000).toFixed(0)}k</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Distance</CardTitle>
            <CardDescription>Distance covered each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)} km`, "Distance"]}
                  />
                  <Area type="monotone" dataKey="distance" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Training Load</CardTitle>
            <CardDescription>TSS accumulated each month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="tss" fill="#22c55e" radius={[4, 4, 0, 0]} name="TSS" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Types</CardTitle>
            <CardDescription>Distribution by sport type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {activityTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Days</CardTitle>
            <CardDescription>Activities by day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="activities" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Activities" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Personal Records ({year})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {personalRecords.map((record, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="p-3 bg-background rounded-full">
                  <record.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{record.title}</p>
                  <p className="text-xl font-bold">{record.value}</p>
                  {record.date && (
                    <p className="text-xs text-muted-foreground">{new Date(record.date).toLocaleDateString("it-IT")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
