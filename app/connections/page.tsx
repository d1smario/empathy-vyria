"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DeviceIntegrations } from "@/components/device-integrations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Activity, Heart, Moon, Flame, TrendingUp, RefreshCw, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"

interface HealthSummary {
  total_workouts: number
  total_duration_minutes: number
  total_calories: number
  avg_heart_rate: number
  sleep_hours_avg: number
  hrv_avg: number
  last_sync: string | null
}

interface RecentActivity {
  id: string
  provider: string
  activity_type: string
  start_time: string
  duration_minutes: number
  calories: number
  distance_meters: number | null
}

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true)
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [syncStatus, setSyncStatus] = useState<{
    lastSync: string | null
    totalConnections: number
    activeConnections: number
  }>({
    lastSync: null,
    totalConnections: 0,
    activeConnections: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load connections status
      const { data: connections } = await supabase
        .from("rook_user_connections")
        .select("*")
        .eq("user_id", user.id)

      if (connections) {
        const active = connections.filter(c => c.is_authorized)
        const lastSyncDate = connections
          .filter(c => c.last_sync_at)
          .sort((a, b) => new Date(b.last_sync_at!).getTime() - new Date(a.last_sync_at!).getTime())[0]?.last_sync_at

        setSyncStatus({
          totalConnections: connections.length,
          activeConnections: active.length,
          lastSync: lastSyncDate || null,
        })
      }

      // Load health summary (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: activities } = await supabase
        .from("rook_activity_events")
        .select("*")
        .eq("user_id", user.id)
        .gte("start_datetime", sevenDaysAgo.toISOString())

      const { data: sleepData } = await supabase
        .from("rook_sleep_summaries")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_date", sevenDaysAgo.toISOString().split("T")[0])

      const { data: physicalData } = await supabase
        .from("rook_physical_summaries")
        .select("*")
        .eq("user_id", user.id)
        .gte("data_date", sevenDaysAgo.toISOString().split("T")[0])

      // Calculate summary
      if (activities || sleepData || physicalData) {
        const totalWorkouts = activities?.length || 0
        const totalDuration = activities?.reduce((sum, a) => sum + (a.active_duration_seconds || 0), 0) || 0
        const totalCalories = activities?.reduce((sum, a) => sum + (a.calories || 0), 0) || 0
        const avgHr = activities?.length 
          ? Math.round(activities.reduce((sum, a) => sum + (a.hr_avg_bpm || 0), 0) / activities.length)
          : 0
        const avgSleep = sleepData?.length
          ? sleepData.reduce((sum, s) => sum + (s.sleep_duration_seconds || 0), 0) / sleepData.length / 3600
          : 0
        const avgHrv = physicalData?.length
          ? Math.round(physicalData.reduce((sum, p) => sum + (p.hrv_avg_rmssd_ms || 0), 0) / physicalData.length)
          : 0

        setHealthSummary({
          total_workouts: totalWorkouts,
          total_duration_minutes: Math.round(totalDuration / 60),
          total_calories: totalCalories,
          avg_heart_rate: avgHr,
          sleep_hours_avg: Math.round(avgSleep * 10) / 10,
          hrv_avg: avgHrv,
          last_sync: syncStatus.lastSync,
        })
      }

      // Load recent activities
      const { data: recent } = await supabase
        .from("rook_activity_events")
        .select("id, provider, activity_type, start_datetime, active_duration_seconds, calories, distance_meters")
        .eq("user_id", user.id)
        .order("start_datetime", { ascending: false })
        .limit(10)

      if (recent) {
        setRecentActivities(recent.map(a => ({
          id: a.id,
          provider: a.provider,
          activity_type: a.activity_type || "workout",
          start_time: a.start_datetime,
          duration_minutes: Math.round((a.active_duration_seconds || 0) / 60),
          calories: a.calories || 0,
          distance_meters: a.distance_meters,
        })))
      }

    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "running":
      case "run":
        return "🏃"
      case "cycling":
      case "bike":
      case "ride":
        return "🚴"
      case "swimming":
      case "swim":
        return "🏊"
      case "strength":
      case "weight_training":
        return "🏋️"
      case "walking":
      case "walk":
        return "🚶"
      case "hiking":
        return "🥾"
      case "yoga":
        return "🧘"
      default:
        return "💪"
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDistance = (meters: number | null) => {
    if (!meters) return null
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`
    }
    return `${meters} m`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Connessioni & Dispositivi</h1>
            <p className="text-muted-foreground">
              Collega i tuoi dispositivi e app per sincronizzare automaticamente i dati
            </p>
          </div>
        </div>

        {/* Sync Status Banner */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  {syncStatus.activeConnections > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="font-medium">
                    {syncStatus.activeConnections} / {syncStatus.totalConnections} connessioni attive
                  </span>
                </div>
                {syncStatus.lastSync && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Ultima sync: {formatDistanceToNow(new Date(syncStatus.lastSync), { addSuffix: true, locale: it })}
                    </span>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aggiorna
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="connections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connections">Connessioni</TabsTrigger>
            <TabsTrigger value="data">Dati Importati</TabsTrigger>
            <TabsTrigger value="activities">Attivita Recenti</TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <DeviceIntegrations />
          </TabsContent>

          {/* Imported Data Tab */}
          <TabsContent value="data">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Workouts Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    Allenamenti
                  </CardTitle>
                  <CardDescription>Ultimi 7 giorni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthSummary?.total_workouts || 0}</div>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(healthSummary?.total_duration_minutes || 0)} totali
                  </p>
                </CardContent>
              </Card>

              {/* Calories Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-500" />
                    Calorie Bruciate
                  </CardTitle>
                  <CardDescription>Ultimi 7 giorni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthSummary?.total_calories?.toLocaleString() || 0}</div>
                  <p className="text-sm text-muted-foreground">
                    ~{Math.round((healthSummary?.total_calories || 0) / 7)} kcal/giorno
                  </p>
                </CardContent>
              </Card>

              {/* Heart Rate Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    FC Media
                  </CardTitle>
                  <CardDescription>Durante allenamenti</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthSummary?.avg_heart_rate || "--"}</div>
                  <p className="text-sm text-muted-foreground">bpm</p>
                </CardContent>
              </Card>

              {/* Sleep Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Moon className="h-5 w-5 text-indigo-500" />
                    Sonno Medio
                  </CardTitle>
                  <CardDescription>Ultimi 7 giorni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthSummary?.sleep_hours_avg || "--"}</div>
                  <p className="text-sm text-muted-foreground">ore/notte</p>
                </CardContent>
              </Card>

              {/* HRV Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    HRV Media
                  </CardTitle>
                  <CardDescription>Variabilita cardiaca</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{healthSummary?.hrv_avg || "--"}</div>
                  <p className="text-sm text-muted-foreground">ms (RMSSD)</p>
                </CardContent>
              </Card>

              {/* Data Sources Info */}
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Come funziona</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>I dati vengono sincronizzati automaticamente dai tuoi dispositivi connessi.</p>
                  <p>Supportiamo: Garmin, Whoop, Polar, Oura, Strava, TrainingPeaks e altri.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Attivita Recenti</CardTitle>
                <CardDescription>Le tue ultime 10 attivita sincronizzate</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessuna attivita importata</p>
                    <p className="text-sm">Connetti un dispositivo per iniziare a sincronizzare</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                          <div>
                            <div className="font-medium capitalize">
                              {activity.activity_type.replace(/_/g, " ")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(activity.start_time), "d MMM yyyy, HH:mm", { locale: it })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="font-medium">{formatDuration(activity.duration_minutes)}</div>
                            <div className="text-muted-foreground">durata</div>
                          </div>
                          {activity.distance_meters && (
                            <div className="text-right">
                              <div className="font-medium">{formatDistance(activity.distance_meters)}</div>
                              <div className="text-muted-foreground">distanza</div>
                            </div>
                          )}
                          {activity.calories > 0 && (
                            <div className="text-right">
                              <div className="font-medium">{activity.calories}</div>
                              <div className="text-muted-foreground">kcal</div>
                            </div>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {activity.provider}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
