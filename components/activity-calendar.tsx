"use client"

import { useCallback } from "react"

import { useRef } from "react"

import type React from "react"
import { X } from "lucide-react"

import { useState, useEffect, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
} from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Bike, Sun as Run, Dumbbell, Waves, Calendar, TrendingUp, Heart, Zap, Plus, RefreshCw, Target, CalendarRange, Upload, FileUp, Check, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { WorkoutDetailModal } from "@/components/workout-detail-modal"
import { ActivityDetailView } from "@/components/activity-detail-view"
import { GymWorkoutDetail } from "@/components/gym-workout-detail"

interface Activity {
  id: string
  activity_date: string
  activity_type: string
  title: string
  duration_minutes: number | null
  distance_km: number | null
  tss: number | null
  average_power: number | null
  average_hr: number | null
  completed: boolean
  source: string
}

interface DailyMetric {
  metric_date: string
  tss_total: number
  ctl: number | null
  atl: number | null
  tsb: number | null
  recovery_score: number | null
  hrv_ms: number | null
  activities_count: number
}

interface AnnualPlanPhase {
  id: string
  name: string
  startWeek: number
  endWeek: number
  type: "preparation" | "base" | "build" | "peak" | "race" | "recovery" | "transition"
  focus: string
  weeklyHours: number
  intensity: "low" | "moderate" | "high" | "very_high"
  keyWorkouts: string[]
  objectives: string[]
  color: string
}

interface AnnualPlan {
  id: string
  athlete_id: string
  plan_name: string
  start_date: string
  total_weeks: number
  phases: AnnualPlanPhase[]
  main_goal: string
  target_event: string | null
  target_event_date: string | null
  created_at: string
  is_active: boolean
}

interface PlannedWorkout {
  id: string
  activity_date: string
  activity_type: string
  title: string
  description?: string
  duration_minutes: number | null
  tss: number | null
  target_zone?: string
  intervals?: {
    blocks?: Array<{
      type: string
      duration: number
      intensity: number
      repeats?: number
    }>
  }
  completed: boolean
  day_of_week?: number
}

interface TrainingActivity {
  id: string
  title: string
  description?: string
  activity_date?: string
  workout_type: string
  activity_type?: string
  target_zone?: string
  duration_minutes: number | null
  tss: number | null
  intervals: any
  metabolic_goal?: string
  cho_target?: number
  fat_target?: number
  completed: boolean
}

interface ActivityCalendarProps {
  athleteId: string
  activities: Activity[]
  dailyMetrics?: DailyMetric[]
  onDateSelect?: (date: Date) => void
}

const activityIcons: Record<string, React.ReactNode> = {
  cycling: <Bike className="h-3 w-3" />,
  running: <Run className="h-3 w-3" />,
  swimming: <Waves className="h-3 w-3" />,
  strength: <Dumbbell className="h-3 w-3" />,
}

const getTssColor = (tss: number): string => {
  if (tss === 0) return "bg-muted"
  if (tss < 50) return "bg-emerald-500/20 border-emerald-500/50"
  if (tss < 100) return "bg-yellow-500/20 border-yellow-500/50"
  if (tss < 150) return "bg-orange-500/20 border-orange-500/50"
  return "bg-red-500/20 border-red-500/50"
}

const getTsbColor = (tsb: number | null): string => {
  if (tsb === null) return "text-muted-foreground"
  if (tsb > 25) return "text-emerald-400"
  if (tsb > 5) return "text-emerald-500"
  if (tsb > -10) return "text-yellow-500"
  if (tsb > -30) return "text-orange-500"
  return "text-red-500"
}

const getZoneColor = (zone: string | null | undefined) => {
  switch (zone?.toUpperCase()) {
    case "Z1":
      return "bg-slate-500"
    case "Z2":
      return "bg-green-500"
    case "Z3":
      return "bg-yellow-500"
    case "Z4":
      return "bg-orange-500"
    case "Z5":
      return "bg-red-500"
    case "Z6":
      return "bg-red-600"
    case "Z7":
      return "bg-red-800"
    case "MIXED":
      return "bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
    case "GYM":
    case "STRENGTH":
      return "bg-orange-600"
    default:
      return "bg-fuchsia-500"
  }
}

const getZoneBorderColor = (zone: string | null | undefined) => {
  switch (zone?.toUpperCase()) {
    case "Z1":
      return "border-slate-500"
    case "Z2":
      return "border-green-500"
    case "Z3":
      return "border-yellow-500"
    case "Z4":
      return "border-orange-500"
    case "Z5":
      return "border-red-500"
    case "Z6":
      return "border-red-600"
    case "Z7":
      return "border-red-800"
    default:
      return "border-fuchsia-500"
  }
}

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  preparation: { bg: "bg-slate-500/20", border: "border-slate-500", text: "text-slate-400" },
  base: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-400" },
  build: { bg: "bg-orange-500/20", border: "border-orange-500", text: "text-orange-400" },
  peak: { bg: "bg-red-500/20", border: "border-red-500", text: "text-red-400" },
  race: { bg: "bg-fuchsia-500/20", border: "border-fuchsia-500", text: "text-fuchsia-400" },
  recovery: { bg: "bg-green-500/20", border: "border-green-500", text: "text-green-400" },
  transition: { bg: "bg-cyan-500/20", border: "border-cyan-500", text: "text-cyan-400" },
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  athleteId,
  activities: initialActivities,
  dailyMetrics = [],
  onDateSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activities, setActivities] = useState<Activity[]>(initialActivities || [])
  const [annualPlan, setAnnualPlan] = useState<AnnualPlan | null>(null)
  const [trainingActivities, setTrainingActivities] = useState<TrainingActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<TrainingActivity | null>(null)
  const [selectedDayName, setSelectedDayName] = useState<string>("")
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null)
  const [athleteFTP, setAthleteFTP] = useState<number>(300)
  // Upload FIT state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<{file: File, status: 'pending' | 'uploading' | 'success' | 'error', progress: number, error?: string, result?: any}[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()
  const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
  const dayNamesLong = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const firstDayOfWeek = startOfMonth(currentMonth).getDay()
  const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  useEffect(() => {
    if (athleteId) {
      loadAnnualPlan()
      loadTrainingActivities()
      loadAthleteFTP()
    }
  }, [athleteId])

  const loadAnnualPlan = async () => {
    try {
      const { data: planData } = await supabase
        .from("annual_training_plans")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (planData) {
        setAnnualPlan(planData as AnnualPlan)
      }
    } catch (error) {
      console.error("[v0] ActivityCalendar: Error loading annual plan:", error)
    }
  }

  const loadTrainingActivities = async () => {
    try {
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd")
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd")

      // Load planned/manual activities from training_activities
      const { data: activitiesData } = await supabase
        .from("training_activities")
        .select(
          "id, activity_date, activity_type, title, description, duration_minutes, distance_km, tss, average_power, average_hr, completed, source, target_zone, intervals, day_of_week",
        )
        .eq("athlete_id", athleteId)
        .gte("activity_date", startDate)
        .lte("activity_date", endDate)
        .order("activity_date", { ascending: true })

      // Also load imported activities from device uploads
      const { data: importedData } = await supabase
        .from("imported_activities")
        .select(
          "id, activity_date, activity_type, title, duration_seconds, distance_meters, tss, avg_power_watts, avg_heart_rate, source_provider",
        )
        .eq("athlete_id", athleteId)
        .gte("activity_date", startDate)
        .lte("activity_date", endDate)
        .order("activity_date", { ascending: true })

      // Merge and transform imported activities to match the Activity interface
      const transformedImported = (importedData || []).map(imp => ({
        id: imp.id,
        activity_date: imp.activity_date,
        activity_type: imp.activity_type || 'other',
        title: imp.title || 'Imported Activity',
        duration_minutes: imp.duration_seconds ? Math.round(imp.duration_seconds / 60) : null,
        distance_km: imp.distance_meters ? Math.round(imp.distance_meters / 1000 * 10) / 10 : null,
        tss: imp.tss,
        average_power: imp.avg_power_watts,
        average_hr: imp.avg_heart_rate,
        completed: true, // Imported activities are always completed
        source: imp.source_provider || 'imported',
      }))

      // Combine both sources
      const allActivities = [...(activitiesData || []), ...transformedImported]
        .sort((a, b) => a.activity_date.localeCompare(b.activity_date))

      console.log("[v0] Loaded activities:", activitiesData?.length || 0, "planned,", importedData?.length || 0, "imported")
      if (importedData && importedData.length > 0) {
        console.log("[v0] Imported activities dates:", importedData.map(i => i.activity_date + " - " + i.title))
      }
      setActivities(allActivities)
    } catch (error) {
      console.error("[v0] ActivityCalendar: Error loading training activities:", error)
    }
  }

  const loadAthleteFTP = async () => {
    if (!athleteId) return

    try {
      const { data: dbProfiles } = await supabase
        .from("metabolic_profiles")
        .select("ftp_watts")
        .eq("athlete_id", athleteId)
        .not("ftp_watts", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)

      if (dbProfiles && dbProfiles.length > 0 && dbProfiles[0].ftp_watts) {
        console.log("[v0] ActivityCalendar: Loaded FTP from DB:", dbProfiles[0].ftp_watts)
        setAthleteFTP(dbProfiles[0].ftp_watts)
      }
    } catch (error) {
      console.error("[v0] ActivityCalendar: Error loading FTP:", error)
    }
  }

  const getActivitiesForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return activities.filter((a) => a.activity_date === dateStr)
  }

  const getMetricsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return dailyMetrics.find((m) => m.metric_date === dateStr)
  }

  const getCurrentPhaseForDate = (date: Date): AnnualPlanPhase | null => {
    if (!annualPlan || !annualPlan.phases || !annualPlan.start_date) return null

    const planStartDate = parseISO(annualPlan.start_date)
    const daysDiff = Math.floor((date.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const currentWeek = Math.floor(daysDiff / 7) + 1

    if (currentWeek < 1 || currentWeek > annualPlan.total_weeks) return null

    return annualPlan.phases.find((phase) => currentWeek >= phase.startWeek && currentWeek <= phase.endWeek) || null
  }

  const currentPhase = useMemo(() => {
    return getCurrentPhaseForDate(new Date())
  }, [annualPlan])

  const currentWeekNumber = useMemo(() => {
    if (!annualPlan || !annualPlan.start_date) return null
    const planStartDate = parseISO(annualPlan.start_date)
    const today = new Date()
    const daysDiff = Math.floor((today.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const week = Math.floor(daysDiff / 7) + 1
    if (week < 1 || week > annualPlan.total_weeks) return null
    return week
  }, [annualPlan])

  const handleSync = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
  }

  const currentWeekStats = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)

    const weekActivities = activities.filter((a) => {
      if (!a.activity_date) return false
      const actDate = parseISO(a.activity_date)
      return actDate >= weekStart && actDate <= now
    })

    return {
      totalTss: weekActivities.reduce((sum, a) => sum + (a.tss || 0), 0),
      totalDuration: weekActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
      totalDistance: weekActivities.reduce((sum, a) => sum + (a.distance_km || 0), 0),
      activitiesCount: weekActivities.length,
    }
  }, [activities])

  const latestMetrics = useMemo(() => {
    if (dailyMetrics.length === 0) return null
    return dailyMetrics.reduce((latest, m) => {
      if (!latest || m.metric_date > latest.metric_date) return m
      return latest
    }, dailyMetrics[0])
  }, [dailyMetrics])

  const getCurrentWeekRange = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const formatDate = (d: Date) => d.toLocaleDateString("it-IT", { day: "numeric", month: "short" })
    return `${formatDate(monday)} - ${formatDate(sunday)}`
  }

  const getWorkoutForDay = (dayIndex: number) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const targetDate = new Date(monday)
    targetDate.setDate(monday.getDate() + dayIndex)
    const targetDateStr = format(targetDate, "yyyy-MM-dd")

    return trainingActivities.find((w) => w.activity_date === targetDateStr)
  }

  const todayIndex = (() => {
    const today = new Date()
    const day = today.getDay()
    return day === 0 ? 6 : day - 1
  })()

  const weeklyStats = useMemo(() => {
    const totalMinutes = trainingActivities.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
    const totalTSS = trainingActivities.reduce((sum, w) => sum + (w.tss || 0), 0)
    const cyclingWorkouts = trainingActivities.filter(
      (w) => w.activity_type === "cycling" || w.activity_type === "bike",
    )
    const completedWorkouts = trainingActivities.filter((w) => w.completed)

    return {
      totalMinutes,
      totalTSS,
      cyclingCount: cyclingWorkouts.length,
      completedCount: completedWorkouts.length,
      totalCount: trainingActivities.length,
    }
  }, [trainingActivities])

  const handleWorkoutClick = (workout: TrainingActivity, date: Date) => {
    setSelectedWorkout(workout)
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
    setSelectedDayName(dayNamesLong[dayIndex])
  }
  
  // Load and show detailed activity view
  const handleActivityClick = async (activity: Activity) => {
    // For strength/gym workouts, load full details including intervals/exercises
    if (activity.activity_type === 'strength' || activity.source === 'ai_generated') {
      try {
        const { data, error } = await supabase
          .from('training_activities')
          .select('*')
          .eq('id', activity.id)
          .single()
        
        if (data && !error) {
          setSelectedActivity(data)
          return
        }
      } catch (e) {
        console.error('[v0] Error loading strength activity:', e)
      }
    }
    
    // If this activity has an 'imported' source, load full details from imported_activities
    if (activity.source === 'imported' || activity.source === 'manual_upload') {
      try {
        const { data, error } = await supabase
          .from('imported_activities')
          .select('*')
          .eq('id', activity.id)
          .single()
        
        if (data && !error) {
          setSelectedActivity(data)
          return
        }
      } catch (e) {
        console.error('[v0] Error loading imported activity:', e)
      }
    }
    // Otherwise use the basic activity data
    setSelectedActivity({
      ...activity,
      duration_seconds: activity.duration_minutes ? activity.duration_minutes * 60 : undefined,
      distance_meters: activity.distance_km ? activity.distance_km * 1000 : undefined,
    })
  }

  // Upload FIT file handling
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => {
      const name = f.name.toLowerCase()
      return name.endsWith('.fit') || name.endsWith('.tcx') || name.endsWith('.gpx') || 
             name.endsWith('.fit.gz') || name.endsWith('.tcx.gz') || name.endsWith('.gpx.gz')
    })
    if (files.length > 0) {
      setUploadingFiles(files.map(file => ({ file, status: 'pending', progress: 0 })))
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setUploadingFiles(files.map(file => ({ file, status: 'pending', progress: 0 })))
    }
  }

  const uploadSingleFile = async (file: File, index: number) => {
    console.log('[v0] uploadSingleFile called for:', file.name, 'size:', file.size)
    
    const { data: { session } } = await supabase.auth.getSession()
    console.log('[v0] Session:', session ? 'exists' : 'null')
    
    if (!session?.access_token) {
      console.log('[v0] No access token, throwing error')
      throw new Error('Not authenticated')
    }
    
    setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'uploading', progress: 20 } : f))
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      console.log('[v0] Sending fetch to /api/activities/upload')
      const response = await fetch('/api/activities/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: formData
      })
      
      console.log('[v0] Response status:', response.status)
      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, progress: 80 } : f))
      
      const result = await response.json()
      console.log('[v0] Response result:', result)
      
      if (!response.ok) throw new Error(result.error || 'Upload failed')
      
      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'success', progress: 100, result } : f))
      return result
    } catch (error: any) {
      console.log('[v0] Upload error:', error.message)
      setUploadingFiles(prev => prev.map((f, i) => i === index ? { ...f, status: 'error', error: error.message } : f))
      throw error
    }
  }

  const uploadAllFiles = async () => {
    for (let i = 0; i < uploadingFiles.length; i++) {
      if (uploadingFiles[i].status === 'pending') {
        try {
          await uploadSingleFile(uploadingFiles[i].file, i)
        } catch (e) {
          console.error('Upload error:', e)
        }
      }
    }
    // Refresh activities after upload
    loadTrainingActivities()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {annualPlan && currentPhase && (
        <Card className={cn("border-l-4", PHASE_COLORS[currentPhase.type]?.border || "border-fuchsia-500")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", PHASE_COLORS[currentPhase.type]?.bg || "bg-fuchsia-500/20")}>
                  <CalendarRange
                    className={cn("h-5 w-5", PHASE_COLORS[currentPhase.type]?.text || "text-fuchsia-400")}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{currentPhase.name}</h3>
                    <Badge variant="outline" className={cn("text-xs", PHASE_COLORS[currentPhase.type]?.text)}>
                      {currentPhase.type.charAt(0).toUpperCase() + currentPhase.type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {annualPlan.plan_name} - Settimana {currentWeekNumber} di {annualPlan.total_weeks}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Ore/Sett</p>
                  <p className="font-bold">{currentPhase.weeklyHours}h</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground text-xs">Intensità</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      currentPhase.intensity === "low" && "border-green-500 text-green-400",
                      currentPhase.intensity === "moderate" && "border-yellow-500 text-yellow-400",
                      currentPhase.intensity === "high" && "border-orange-500 text-orange-400",
                      currentPhase.intensity === "very_high" && "border-red-500 text-red-400",
                    )}
                  >
                    {currentPhase.intensity === "low" && "Bassa"}
                    {currentPhase.intensity === "moderate" && "Moderata"}
                    {currentPhase.intensity === "high" && "Alta"}
                    {currentPhase.intensity === "very_high" && "Molto Alta"}
                  </Badge>
                </div>
                {annualPlan.target_event && (
                  <div className="text-center hidden md:block">
                    <p className="text-muted-foreground text-xs">Obiettivo</p>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-fuchsia-400" />
                      <span className="font-medium text-xs">{annualPlan.target_event}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {currentPhase.keyWorkouts && currentPhase.keyWorkouts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Allenamenti chiave questa fase:</p>
                <div className="flex flex-wrap gap-1">
                  {currentPhase.keyWorkouts.slice(0, 4).map((workout, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {workout}
                    </Badge>
                  ))}
                  {currentPhase.keyWorkouts.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{currentPhase.keyWorkouts.length - 4} altri
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <TrendingUp className="h-3 w-3" />
              <span>CTL (Fitness)</span>
            </div>
            <p className="text-xl font-bold">{latestMetrics?.ctl?.toFixed(0) || "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="h-3 w-3" />
              <span>ATL (Fatigue)</span>
            </div>
            <p className="text-xl font-bold">{latestMetrics?.atl?.toFixed(0) || "—"}</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Heart className="h-3 w-3" />
              <span>TSB (Form)</span>
            </div>
            <p className={cn("text-xl font-bold", getTsbColor(latestMetrics?.tsb ?? null))}>
              {latestMetrics?.tsb !== null && latestMetrics?.tsb !== undefined
                ? (latestMetrics.tsb > 0 ? "+" : "") + latestMetrics.tsb.toFixed(0)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>Week TSS</span>
            </div>
            <p className="text-xl font-bold">{currentWeekStats.totalTss}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">{format(currentMonth, "MMMM yyyy", { locale: it })}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import FIT
              </Button>
              <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Sync
              </Button>
              <Button size="sm" onClick={() => setSelectedDate(new Date())}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const dayActivities = getActivitiesForDay(day)
              const metrics = getMetricsForDay(day)
              const totalTss = dayActivities.reduce((sum, a) => sum + (a.tss || 0), 0)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const dayPhase = getCurrentPhaseForDate(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square p-1 rounded-lg border transition-all relative",
                    "hover:border-primary/50 hover:bg-accent/50",
                    isToday(day) && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    isSelected && "border-primary bg-primary/10",
                    dayActivities.length > 0 ? getTssColor(totalTss) : "border-border/30",
                    loading && "animate-pulse",
                  )}
                >
                  <div className="flex flex-col h-full">
                    <span className={cn("text-xs font-medium", isToday(day) && "text-primary")}>
                      {format(day, "d")}
                    </span>

                    {dayActivities.length > 0 && (() => {
                      const totalDuration = dayActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)
                      const totalDistance = dayActivities.reduce((sum, a) => sum + (a.distance_km || 0), 0)
                      const avgSpeed = totalDuration > 0 ? Math.round(totalDistance / (totalDuration / 60) * 10) / 10 : 0
                      // Calculate work in kJ (Power * Duration / 1000)
                      const totalKj = dayActivities.reduce((sum, a) => {
                        const power = a.average_power || 0
                        const duration = (a.duration_minutes || 0) * 60
                        return sum + Math.round(power * duration / 1000)
                      }, 0)
                      return (
                        <div className="flex-1 flex flex-col justify-end gap-0.5 text-[8px]">
                          <div className="flex items-center justify-center gap-0.5 mb-0.5">
                            {dayActivities.slice(0, 2).map((activity, i) => (
                              <span key={i} className="text-primary">
                                {activityIcons[activity.activity_type] || <Bike className="h-2.5 w-2.5" />}
                              </span>
                            ))}
                          </div>
                          {totalDuration > 0 && (
                            <div className="text-muted-foreground truncate">
                              {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                          {totalDistance > 0 && (
                            <div className="text-muted-foreground truncate">{totalDistance.toFixed(1)}km</div>
                          )}
                          {totalTss > 0 && (
                            <div className="font-medium text-orange-500">{totalTss} TSS</div>
                          )}
                          {avgSpeed > 0 && (
                            <div className="text-muted-foreground truncate">{avgSpeed}km/h</div>
                          )}
                          {totalKj > 0 && (
                            <div className="text-blue-400 truncate">{totalKj} kJ</div>
                          )}
                        </div>
                      )
                    })()}

                    {metrics?.recovery_score && (
                      <div className="absolute top-0.5 right-0.5">
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            metrics.recovery_score >= 67
                              ? "bg-emerald-500"
                              : metrics.recovery_score >= 34
                                ? "bg-yellow-500"
                                : "bg-red-500",
                          )}
                        />
                      </div>
                    )}

                    {dayPhase && (
                      <div className="absolute bottom-0.5 left-0.5">
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            dayPhase.type === "preparation" && "bg-slate-400",
                            dayPhase.type === "base" && "bg-blue-400",
                            dayPhase.type === "build" && "bg-orange-400",
                            dayPhase.type === "peak" && "bg-red-400",
                            dayPhase.type === "race" && "bg-fuchsia-400",
                            dayPhase.type === "recovery" && "bg-green-400",
                            dayPhase.type === "transition" && "bg-cyan-400",
                          )}
                        />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
              <span>{"<50 TSS"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/50" />
              <span>50-100</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/50" />
              <span>100-150</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
              <span>{">150"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Activities Panel */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {getActivitiesForDay(selectedDate).length} attività - Clicca per vedere i dettagli
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {getActivitiesForDay(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getActivitiesForDay(selectedDate).map((activity) => (
                  <Card 
                    key={activity.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {activityIcons[activity.activity_type] || <Bike className="h-5 w-5 text-primary" />}
                          </div>
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {activity.duration_minutes && (
                                <span>{Math.floor(activity.duration_minutes / 60)}:{(activity.duration_minutes % 60).toString().padStart(2, '0')}</span>
                              )}
                              {activity.distance_km && (
                                <span>{activity.distance_km.toFixed(1)} km</span>
                              )}
                              {activity.average_power && (
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-yellow-500" />
                                  {activity.average_power} W
                                </span>
                              )}
                              {activity.average_hr && (
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3 text-red-500" />
                                  {activity.average_hr} bpm
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {activity.tss && (
                            <Badge variant="outline" className="border-orange-500 text-orange-500">
                              {activity.tss} TSS
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{activity.source}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Nessuna attività in questo giorno</p>
                <Button variant="outline" size="sm" className="mt-4 bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi attività
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {trainingActivities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-fuchsia-500" />
                  Piano Settimanale
                </CardTitle>
                <p className="text-sm text-muted-foreground">{getCurrentWeekRange()}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="border-fuchsia-500 text-fuchsia-400">
                  {Math.round(weeklyStats.totalMinutes / 60)}h totali
                </Badge>
                {weeklyStats.totalTSS > 0 && (
                  <Badge variant="outline" className="border-purple-500 text-purple-400">
                    {weeklyStats.totalTSS} TSS
                  </Badge>
                )}
                <Badge variant="outline" className="border-green-500 text-green-400">
                  {weeklyStats.completedCount}/{weeklyStats.totalCount} completati
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-7">
              {dayNames.map((dayName, dayIndex) => {
                const dayWorkout = getWorkoutForDay(dayIndex)
                const isToday = dayIndex === todayIndex
                const isPast = dayIndex < todayIndex

                return (
                  <Card
                    key={dayIndex}
                    className={cn(
                      "border transition-all cursor-pointer hover:border-fuchsia-500/50",
                      dayWorkout ? getZoneBorderColor(dayWorkout.target_zone) : "opacity-60",
                      isToday && "ring-2 ring-fuchsia-500 ring-offset-2 ring-offset-background",
                      dayWorkout?.completed && "bg-green-500/5",
                    )}
                    onClick={() => {
                      const today = new Date()
                      const dayOfWeek = today.getDay()
                      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
                      const monday = new Date(today)
                      monday.setDate(today.getDate() + mondayOffset)
                      const targetDate = new Date(monday)
                      targetDate.setDate(monday.getDate() + dayIndex)
                      setSelectedDate(targetDate)
                      if (dayWorkout) {
                        handleWorkoutClick(dayWorkout as TrainingActivity, targetDate)
                      }
                    }}
                  >
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs font-medium flex items-center justify-between">
                        <span className={isToday ? "text-fuchsia-500 font-bold" : ""}>
                          {dayName}
                          {isToday && <span className="ml-1 text-[10px]">(Oggi)</span>}
                        </span>
                        {dayWorkout && (
                          <Badge className={cn(getZoneColor(dayWorkout.target_zone), "text-white text-[10px] px-1.5")}>
                            {dayWorkout.target_zone || "Z2"}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      {dayWorkout ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {dayWorkout.activity_type === "cycling" || dayWorkout.activity_type === "bike" ? (
                              <Bike className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="font-semibold text-xs line-clamp-1">{dayWorkout.title}</span>
                          </div>
                          {dayWorkout.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{dayWorkout.description}</p>
                          )}
                          {dayWorkout.intervals?.blocks && dayWorkout.intervals.blocks.length > 0 && (
                            <div className="flex gap-0.5 h-2 mt-1">
                              {dayWorkout.intervals.blocks.slice(0, 8).map((block, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "flex-1 rounded-sm",
                                    block.intensity < 60 && "bg-slate-500",
                                    block.intensity >= 60 && block.intensity < 75 && "bg-green-500",
                                    block.intensity >= 75 && block.intensity < 88 && "bg-yellow-500",
                                    block.intensity >= 88 && block.intensity < 100 && "bg-orange-500",
                                    block.intensity >= 100 && "bg-red-500",
                                  )}
                                  title={`${block.type}: ${Math.floor(block.duration / 60)}' @ ${block.intensity}%`}
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                            {dayWorkout.duration_minutes && (
                              <span>
                                {dayWorkout.duration_minutes >= 60
                                  ? `${Math.floor(dayWorkout.duration_minutes / 60)}h ${dayWorkout.duration_minutes % 60}m`
                                  : `${dayWorkout.duration_minutes}m`}
                              </span>
                            )}
                            {dayWorkout.tss && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                {dayWorkout.tss} TSS
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-muted-foreground text-xs">Riposo</div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <WorkoutDetailModal
        workout={
          selectedWorkout
            ? {
                id: selectedWorkout.id,
                title: selectedWorkout.title,
                description: selectedWorkout.description || undefined,
                workout_type: selectedWorkout.workout_type,
                activity_type: selectedWorkout.activity_type,
                target_zone: selectedWorkout.target_zone || undefined,
                duration_minutes: selectedWorkout.duration_minutes || undefined,
                tss: selectedWorkout.tss || undefined,
                intervals: selectedWorkout.intervals,
                metabolic_goal: selectedWorkout.metabolic_goal || undefined,
                cho_target: selectedWorkout.cho_target || undefined,
                fat_target: selectedWorkout.fat_target || undefined,
                completed: selectedWorkout.completed,
              }
            : null
        }
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        dayName={selectedDayName}
        athleteFTP={athleteFTP}
      />
  
{/* Activity Detail View Modal - Gym or Cycling */}
  {selectedActivity && selectedActivity.activity_type === 'strength' ? (
    <GymWorkoutDetail
      workout={{
        id: selectedActivity.id,
        title: selectedActivity.title,
        description: selectedActivity.description,
        activity_date: selectedActivity.activity_date,
        duration_minutes: selectedActivity.duration_minutes,
        completed: selectedActivity.completed,
        intervals: selectedActivity.intervals,
      }}
      isOpen={!!selectedActivity}
      onClose={() => setSelectedActivity(null)}
    />
  ) : selectedActivity ? (
    <ActivityDetailView
      activity={selectedActivity}
      onClose={() => setSelectedActivity(null)}
      athleteFTP={athleteFTP}
    />
  ) : null}

  {/* Upload FIT Dialog */}
  <Dialog open={showUploadDialog} onOpenChange={(open) => {
    setShowUploadDialog(open)
    if (!open) setUploadingFiles([])
  }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Attivita
        </DialogTitle>
        <DialogDescription>
          Carica file FIT, TCX o GPX dal tuo computer o device
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/50"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".fit,.tcx,.gpx,.fit.gz,.tcx.gz,.gpx.gz"
            onChange={handleFileSelect}
            className="hidden"
          />
          <FileUp className={cn("h-10 w-10 mx-auto mb-3", isDragging ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm font-medium">
            {isDragging ? "Rilascia qui" : "Trascina file o clicca per selezionare"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">FIT, TCX, GPX (anche .gz)</p>
        </div>

        {/* File list */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploadingFiles.map((f, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 p-3 rounded-lg border",
                f.status === 'success' && "bg-green-500/5 border-green-500/30",
                f.status === 'error' && "bg-red-500/5 border-red-500/30",
                f.status === 'uploading' && "bg-blue-500/5 border-blue-500/30",
                f.status === 'pending' && "bg-muted/30"
              )}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(f.file.size)}</p>
                  {f.status === 'uploading' && <Progress value={f.progress} className="h-1 mt-1" />}
                  {f.error && <p className="text-xs text-red-500 mt-1">{f.error}</p>}
                  {f.result?.activity && (
                    <p className="text-xs text-green-600 mt-1">
                      {f.result.activity.type} - {f.result.activity.date}
                    </p>
                  )}
                </div>
                {f.status === 'success' && <Check className="h-5 w-5 text-green-500" />}
                {f.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {uploadingFiles.filter(f => f.status === 'pending').length > 0 && (
          <Button onClick={uploadAllFiles} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Carica {uploadingFiles.filter(f => f.status === 'pending').length} file
          </Button>
        )}
        
        {/* Success message */}
        {uploadingFiles.length > 0 && uploadingFiles.every(f => f.status === 'success') && (
          <Button variant="outline" onClick={() => { setShowUploadDialog(false); setUploadingFiles([]) }} className="w-full">
            Fatto - Chiudi
          </Button>
        )}
      </div>
    </DialogContent>
  </Dialog>
    </div>
  )
}
