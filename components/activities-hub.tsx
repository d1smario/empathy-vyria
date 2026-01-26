"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
  getWeek,
  differenceInDays,
} from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { 
  ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange,
  Bike, Footprints, Dumbbell, Waves, Activity, Mountain,
  TrendingUp, Heart, Zap, Clock, Target, Plus, RefreshCw,
  Trash2, Copy, MoveHorizontal, Edit, MoreVertical, X,
  Sparkles, User, Library, GripVertical, Check, AlertTriangle,
  Moon, Sun, Thermometer, Wind, Brain, Upload, BarChart3, Link2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { WorkoutDetailModal } from "@/components/workout-detail-modal"
import { ActivityDetailView } from "@/components/activity-detail-view"
import { WorkoutLibrary } from "@/components/workout-library"
import { ActivityAnalysis } from "@/components/activity-analysis"
import { ActivityStatistics } from "@/components/activity-statistics"
import { analyzeReadiness, type BiometricsInput } from "@/lib/readiness-engine"
import type { AthleteDataType } from "@/components/dashboard-content"

// Types
interface DailyBiometrics {
  date: string
  hrv_rmssd?: number
  hr_resting?: number
  hr_sleeping_avg?: number
  sleep_duration_min?: number
  sleep_score?: number
  readiness_score?: number
  strain_score?: number
  recovery_score?: number
  stress_score?: number
  respiratory_rate?: number
  spo2_avg?: number
  body_temperature?: number
}

interface DayData {
  date: Date
  activities: any[]
  biometrics?: DailyBiometrics
  tssTotal: number
  isToday: boolean
  isCurrentMonth: boolean
}

interface ActivitiesHubProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
}

// Constants
const SPORTS = [
  { id: "cycling", name: "Ciclismo", icon: Bike, color: "text-yellow-500" },
  { id: "running", name: "Corsa", icon: Footprints, color: "text-blue-500" },
  { id: "swimming", name: "Nuoto", icon: Waves, color: "text-cyan-500" },
  { id: "gym", name: "Palestra", icon: Dumbbell, color: "text-orange-500" },
  { id: "trail_running", name: "Trail", icon: Mountain, color: "text-green-500" },
  { id: "triathlon", name: "Triathlon", icon: Activity, color: "text-purple-500" },
]

const SOURCE_BADGES = {
  vyria: { label: "AI", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50" },
  coach: { label: "C", color: "bg-amber-500/20 text-amber-400 border-amber-500/50" },
  imported: { label: "IMP", color: "bg-green-500/20 text-green-400 border-green-500/50" },
  manual: { label: "M", color: "bg-gray-500/20 text-gray-400 border-gray-500/50" },
}

const getZoneColor = (zone: string) => {
  switch (zone?.toUpperCase()) {
    case "Z1": return "bg-slate-500"
    case "Z2": return "bg-green-500"
    case "Z3": return "bg-yellow-500"
    case "Z4": return "bg-orange-500"
    case "Z5": return "bg-red-500"
    case "Z6": return "bg-red-600"
    default: return "bg-purple-500"
  }
}

const getSportIcon = (type: string) => {
  const sport = SPORTS.find(s => s.id === type?.toLowerCase())
  return sport ? sport.icon : Bike
}

const getSportColor = (type: string) => {
  const sport = SPORTS.find(s => s.id === type?.toLowerCase())
  return sport?.color || "text-gray-500"
}

// Format duration as Xh Ym
const formatDuration = (minutes: number | null) => {
  if (!minutes) return "--"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}'`
  if (m === 0) return `${h}h`
  return `${h}h${m}'`
}

// Readiness color
const getReadinessColor = (score: number | undefined) => {
  if (!score) return "text-gray-500"
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-yellow-500"
  if (score >= 40) return "text-orange-500"
  return "text-red-500"
}

// Mini intensity bar for calendar view
function IntensityBar({ blocks }: { blocks?: any['intervals']['blocks'] }) {
  if (!blocks || blocks.length === 0) return null
  
  return (
    <div className="flex h-1.5 w-full gap-0.5 mt-1">
      {blocks.slice(0, 8).map((block, i) => (
        <div 
          key={i} 
          className={cn("flex-1 rounded-sm", getZoneColor(block.zone))}
          style={{ opacity: 0.7 + (block.duration / 60) * 0.3 }}
        />
      ))}
    </div>
  )
}

// Source badge component
function SourceBadge({ source }: { source: any['source'] }) {
  const badge = SOURCE_BADGES[source] || SOURCE_BADGES.manual
  return (
    <span className={cn("text-[9px] px-1 py-0.5 rounded border font-medium", badge.color)}>
      {badge.label}
    </span>
  )
}

export function ActivitiesHub({ athleteData, userName }: ActivitiesHubProps) {
  const supabase = createClient()
  
  // View state
  const [view, setView] = useState<'month' | 'week' | 'day' | 'analysis' | 'statistics'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // Data state
  const [activities, setActivities] = useState<any[]>([])
  const [biometrics, setBiometrics] = useState<DailyBiometrics[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null)
  const [showActivityDetail, setShowActivityDetail] = useState(false)
  const [showDayDetail, setShowDayDetail] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [contextMenuActivity, setContextMenuActivity] = useState<any | null>(null)
  
  // Feedback state for day view
  const [dayFeedback, setDayFeedback] = useState<{
    rpe: number
    feeling: string
    notes: string
  }>({ rpe: 5, feeling: 'ok', notes: '' })

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      return { start, end }
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return { start, end }
    } else {
      return { start: selectedDate || currentDate, end: selectedDate || currentDate }
    }
  }, [view, currentDate, selectedDate])

  // Fetch activities
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch activities from training_activities
        const { data: trainingData } = await supabase
          .from('training_activities')
          .select('*')
          .eq('user_id', user.id)
          .gte('activity_date', format(dateRange.start, 'yyyy-MM-dd'))
          .lte('activity_date', format(dateRange.end, 'yyyy-MM-dd'))
          .order('activity_date', { ascending: true })

        // Fetch imported activities
        const { data: importedData } = await supabase
          .from('imported_activities')
          .select('*')
          .eq('user_id', user.id)
          .gte('activity_date', format(dateRange.start, 'yyyy-MM-dd'))
          .lte('activity_date', format(dateRange.end, 'yyyy-MM-dd'))

        // Merge and transform
        const merged: any[] = [
          ...(trainingData || []).map(a => ({
            ...a,
            source: a.source || 'vyria' as const,
          })),
          ...(importedData || []).map(a => ({
            id: a.id,
            activity_date: a.activity_date,
            activity_type: a.activity_type || 'cycling',
            title: a.title || a.file_name || 'Imported Activity',
            duration_minutes: a.duration_seconds ? Math.round(a.duration_seconds / 60) : null,
            distance_km: a.distance_meters ? a.distance_meters / 1000 : null,
            tss: a.tss,
            average_power: a.avg_power_watts,
            normalized_power: a.normalized_power,
            average_hr: a.avg_heart_rate,
            max_hr: a.max_heart_rate,
            elevation_gain: a.elevation_gain_meters,
            completed: true,
            source: 'imported' as const,
            actual_duration_min: a.duration_seconds ? Math.round(a.duration_seconds / 60) : null,
            actual_tss: a.tss,
            actual_np: a.normalized_power,
          }))
        ]

        setActivities(merged)

        // TODO: Fetch biometrics when table exists
        // const { data: bioData } = await supabase
        //   .from('daily_biometrics')
        //   .select('*')
        //   .eq('user_id', user.id)
        //   .gte('date', format(dateRange.start, 'yyyy-MM-dd'))
        //   .lte('date', format(dateRange.end, 'yyyy-MM-dd'))
        // setBiometrics(bioData || [])

      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, supabase])

  // Build day data
  const daysData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
    
    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayActivities = activities.filter(a => a.activity_date === dateStr)
      const dayBiometrics = biometrics.find(b => b.date === dateStr)
      
      return {
        date,
        activities: dayActivities,
        biometrics: dayBiometrics,
        tssTotal: dayActivities.reduce((sum, a) => sum + (a.tss || a.actual_tss || 0), 0),
        isToday: isToday(date),
        isCurrentMonth: isSameMonth(date, currentDate),
      } as DayData
    })
  }, [dateRange, activities, biometrics, currentDate])

  // Navigation handlers
  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      const newDate = new Date(selectedDate || currentDate)
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1))
      setSelectedDate(newDate)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  // Day click handler
  const handleDayClick = (day: DayData) => {
    setSelectedDate(day.date)
    if (view === 'month') {
      setView('day')
    } else {
      setShowDayDetail(true)
    }
  }

  // Activity actions
  const handleDeleteActivity = async (activity: any) => {
    if (!confirm('Vuoi eliminare questa sessione?')) return
    
    try {
      const table = activity.source === 'imported' ? 'imported_activities' : 'training_activities'
      await supabase.from(table).delete().eq('id', activity.id)
      setActivities(prev => prev.filter(a => a.id !== activity.id))
    } catch (error) {
      console.error('Error deleting activity:', error)
    }
  }

  const handleDuplicateActivity = async (activity: any) => {
    // TODO: Implement duplicate
    alert('Funzione in arrivo: Duplica sessione')
  }

  const handleMoveActivity = async (activity: any, newDate: Date) => {
    // TODO: Implement move
    alert('Funzione in arrivo: Sposta sessione')
  }

  // Render month view
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {/* Header */}
      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
          {day}
        </div>
      ))}
      
      {/* Days */}
      {daysData.map((day, idx) => {
        const Icon = day.activities[0] ? getSportIcon(day.activities[0].activity_type) : null
        
        return (
          <div
            key={idx}
            onClick={() => handleDayClick(day)}
            className={cn(
              "min-h-[80px] p-1 border rounded cursor-pointer transition-colors",
              day.isCurrentMonth ? "bg-card" : "bg-muted/30",
              day.isToday && "ring-2 ring-primary",
              "hover:bg-accent/50"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-xs font-medium",
                day.isToday && "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center",
                !day.isCurrentMonth && "text-muted-foreground"
              )}>
                {format(day.date, 'd')}
              </span>
              {day.biometrics?.readiness_score && (
                <span className={cn("text-[10px] font-bold", getReadinessColor(day.biometrics.readiness_score))}>
                  {day.biometrics.readiness_score}
                </span>
              )}
            </div>
            
            {day.activities.length > 0 && (
              <div className="space-y-0.5">
                {day.activities.slice(0, 2).map((activity, aIdx) => {
                  const SportIcon = getSportIcon(activity.activity_type)
                  return (
                    <div key={aIdx} className="flex items-center gap-1 text-[10px]">
                      <SportIcon className={cn("h-3 w-3", getSportColor(activity.activity_type))} />
                      <span className="truncate flex-1">{formatDuration(activity.duration_minutes || activity.actual_duration_min)}</span>
                      <SourceBadge source={activity.source} />
                    </div>
                  )
                })}
                {day.activities.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">+{day.activities.length - 2}</div>
                )}
                {day.tssTotal > 0 && (
                  <div className="text-[10px] text-amber-500 font-medium">TSS: {Math.round(day.tssTotal)}</div>
                )}
                <IntensityBar blocks={day.activities[0]?.intervals?.blocks} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  // Render week view
  const renderWeekView = () => {
    const weekDays = daysData.slice(0, 7)
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          return (
            <Card 
              key={idx}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                day.isToday && "ring-2 ring-primary"
              )}
              onClick={() => handleDayClick(day)}
            >
              <CardHeader className="p-2 pb-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {format(day.date, 'EEE', { locale: it })}
                    </div>
                    <div className={cn(
                      "text-lg font-bold",
                      day.isToday && "text-primary"
                    )}>
                      {format(day.date, 'd')}
                    </div>
                  </div>
                  {day.biometrics?.readiness_score && (
                    <div className={cn(
                      "text-2xl font-bold",
                      getReadinessColor(day.biometrics.readiness_score)
                    )}>
                      {day.biometrics.readiness_score}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-2">
                {day.activities.map((activity, aIdx) => {
                  const SportIcon = getSportIcon(activity.activity_type)
                  return (
                    <div 
                      key={aIdx}
                      className={cn(
                        "p-2 rounded border bg-background/50",
                        activity.completed && "border-green-500/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <SportIcon className={cn("h-4 w-4", getSportColor(activity.activity_type))} />
                        <span className="text-sm font-medium truncate flex-1">{activity.title}</span>
                        <SourceBadge source={activity.source} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(activity.duration_minutes || activity.actual_duration_min)}
                        {activity.tss && (
                          <>
                            <Zap className="h-3 w-3 ml-1" />
                            TSS {activity.tss}
                          </>
                        )}
                      </div>
                      <IntensityBar blocks={activity.intervals?.blocks} />
                    </div>
                  )
                })}
                
                {day.activities.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Riposo
                  </div>
                )}
                
                {day.tssTotal > 0 && (
                  <div className="text-xs font-medium text-amber-500 text-center">
                    Totale TSS: {Math.round(day.tssTotal)}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Render day view
  const renderDayView = () => {
    const day = daysData.find(d => selectedDate && isSameDay(d.date, selectedDate)) || daysData[0]
    if (!day) return null

    return (
      <div className="space-y-4">
        {/* Readiness Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-cyan-500" />
              Readiness Mattutino
            </CardTitle>
          </CardHeader>
          <CardContent>
            {day.biometrics ? (
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <div className="text-xs text-muted-foreground">HRV</div>
                  <div className="text-xl font-bold">{day.biometrics.hrv_rmssd || '--'}ms</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Activity className="h-5 w-5 mx-auto mb-1 text-pink-500" />
                  <div className="text-xs text-muted-foreground">HR Riposo</div>
                  <div className="text-xl font-bold">{day.biometrics.hr_resting || '--'}bpm</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <Moon className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-xs text-muted-foreground">Sonno</div>
                  <div className="text-xl font-bold">
                    {day.biometrics.sleep_duration_min ? `${Math.round(day.biometrics.sleep_duration_min / 60 * 10) / 10}h` : '--'}
                  </div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <div className="text-xs text-muted-foreground">Recovery</div>
                  <div className="text-xl font-bold">{day.biometrics.recovery_score || '--'}%</div>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg border-2 border-primary/50">
                  <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <div className="text-xs text-muted-foreground">Readiness</div>
                  <div className={cn("text-2xl font-bold", getReadinessColor(day.biometrics.readiness_score))}>
                    {day.biometrics.readiness_score || '--'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nessun dato biometrico disponibile</p>
                <p className="text-xs">Collega un dispositivo per vedere HRV, sonno e recovery</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Allenamenti
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowLibrary(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Aggiungi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {day.activities.length > 0 ? (
              day.activities.map((activity, idx) => {
                const SportIcon = getSportIcon(activity.activity_type)
                const hasActualData = activity.source === 'imported' || activity.actual_duration_min
                
                return (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg bg-background", getSportColor(activity.activity_type))}>
                          <SportIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {activity.title}
                            <SourceBadge source={activity.source} />
                            {activity.completed && <Check className="h-4 w-4 text-green-500" />}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(activity.activity_date), "EEEE d MMMM", { locale: it })}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedActivity(activity)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateActivity(activity)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplica
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MoveHorizontal className="h-4 w-4 mr-2" />
                            Sposta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDeleteActivity(activity)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Planned vs Actual comparison */}
                    {hasActualData && activity.source !== 'imported' && (
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <div className="text-xs text-muted-foreground mb-1">Pianificato</div>
                          <div className="text-lg font-bold">{formatDuration(activity.duration_minutes)}</div>
                          {activity.tss && <div className="text-xs">TSS: {activity.tss}</div>}
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                          <div className="text-xs text-green-500 mb-1">Completato</div>
                          <div className="text-lg font-bold">{formatDuration(activity.actual_duration_min || activity.duration_minutes)}</div>
                          {activity.actual_tss && <div className="text-xs">TSS: {activity.actual_tss}</div>}
                        </div>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div className="p-2 bg-background/50 rounded">
                        <div className="text-xs text-muted-foreground">Durata</div>
                        <div className="font-bold">{formatDuration(activity.actual_duration_min || activity.duration_minutes)}</div>
                      </div>
                      <div className="p-2 bg-background/50 rounded">
                        <div className="text-xs text-muted-foreground">TSS</div>
                        <div className="font-bold text-amber-500">{activity.actual_tss || activity.tss || '--'}</div>
                      </div>
                      <div className="p-2 bg-background/50 rounded">
                        <div className="text-xs text-muted-foreground">NP</div>
                        <div className="font-bold text-yellow-500">{activity.actual_np || activity.normalized_power || '--'}W</div>
                      </div>
                      <div className="p-2 bg-background/50 rounded">
                        <div className="text-xs text-muted-foreground">HR Avg</div>
                        <div className="font-bold text-red-500">{activity.average_hr || '--'}bpm</div>
                      </div>
                    </div>

                    {/* Intensity blocks */}
                    {activity.intervals?.blocks && activity.intervals.blocks.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground mb-1">Struttura</div>
                        <div className="flex gap-1 h-6">
                          {activity.intervals.blocks.map((block, bIdx) => (
                            <div
                              key={bIdx}
                              className={cn(
                                "rounded flex items-center justify-center text-[9px] text-white font-medium",
                                getZoneColor(block.zone)
                              )}
                              style={{ flex: block.duration }}
                              title={`${block.type} - ${block.duration}' ${block.zone}`}
                            >
                              {block.duration > 5 && block.zone}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nessun allenamento pianificato</p>
                <Button variant="outline" className="mt-2 bg-transparent" onClick={() => setShowLibrary(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi dalla Biblioteca
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              Feedback Post-Workout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">RPE (Sforzo Percepito)</span>
                <span className="text-2xl font-bold text-primary">{dayFeedback.rpe}</span>
              </div>
              <Slider
                value={[dayFeedback.rpe]}
                onValueChange={([value]) => setDayFeedback(prev => ({ ...prev, rpe: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Facile</span>
                <span>Massimale</span>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium mb-2 block">Come ti sei sentito?</span>
              <div className="flex gap-2">
                {[
                  { id: 'great', label: 'Ottimo', color: 'bg-green-500' },
                  { id: 'good', label: 'Bene', color: 'bg-lime-500' },
                  { id: 'ok', label: 'OK', color: 'bg-yellow-500' },
                  { id: 'tired', label: 'Stanco', color: 'bg-orange-500' },
                  { id: 'bad', label: 'Male', color: 'bg-red-500' },
                ].map(feeling => (
                  <Button
                    key={feeling.id}
                    variant={dayFeedback.feeling === feeling.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDayFeedback(prev => ({ ...prev, feeling: feeling.id }))}
                    className={dayFeedback.feeling === feeling.id ? feeling.color : ''}
                  >
                    {feeling.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm font-medium mb-2 block">Note</span>
              <Textarea
                placeholder="Aggiungi note su dolori, sensazioni, condizioni meteo..."
                value={dayFeedback.notes}
                onChange={(e) => setDayFeedback(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <Button className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Salva Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* View Switcher */}
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
              <TabsList>
                <TabsTrigger value="month" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Mese</span>
                </TabsTrigger>
                <TabsTrigger value="week" className="flex items-center gap-1">
                  <CalendarRange className="h-4 w-4" />
                  <span className="hidden sm:inline">Settimana</span>
                </TabsTrigger>
                <TabsTrigger value="day" className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Giorno</span>
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="statistics" className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Statistics</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Navigation - only show for calendar views */}
            {(view === 'month' || view === 'week' || view === 'day') && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goToToday}>
                  Oggi
                </Button>
                <h2 className="text-lg font-semibold min-w-[180px] text-center">
                  {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: it })}
                  {view === 'week' && `Settimana ${getWeek(currentDate)} - ${format(currentDate, 'yyyy')}`}
                  {view === 'day' && format(selectedDate || currentDate, "EEEE d MMMM yyyy", { locale: it })}
                </h2>
                <Button variant="outline" size="icon" onClick={() => navigate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLibrary(true)}>
                <Library className="h-4 w-4 mr-1" />
                Biblioteca
              </Button>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('fit-import-input')?.click()}>
                <Upload className="h-4 w-4 mr-1" />
                Import FIT
              </Button>
              <input
                id="fit-import-input"
                type="file"
                accept=".fit,.FIT,.fit.gz"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append('file', file)
                  try {
                    const res = await fetch('/api/import-fit', { method: 'POST', body: formData })
                    if (res.ok) {
                      // Refresh activities
                      window.location.reload()
                    }
                  } catch (err) {
                    console.error('Import error:', err)
                  }
                  e.target.value = ''
                }}
              />
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nuovo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {view === 'analysis' ? (
        <ActivityAnalysis athleteId={athleteData?.id} hrZones={athleteData?.metabolic_profiles?.[0]?.hr_zones || null} />
      ) : view === 'statistics' ? (
        <ActivityStatistics athleteId={athleteData?.id} />
      ) : (
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <WorkoutDetailModal
          workout={selectedActivity}
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          athleteData={athleteData}
        />
      )}

      {/* Library Dialog with full WorkoutLibrary */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <WorkoutLibrary 
            onAssignToDay={async (dayIndex, workout) => {
              // Calculate target date from dayIndex (0 = Monday of current week)
              const weekStart = startOfWeek(selectedDate || currentDate, { weekStartsOn: 1 })
              const targetDate = new Date(weekStart)
              targetDate.setDate(targetDate.getDate() + dayIndex)
              
              // Create activity from workout template
              try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                
                const newActivity = {
                  user_id: user.id,
                  activity_date: format(targetDate, 'yyyy-MM-dd'),
                  activity_type: workout.sport,
                  title: workout.name,
                  description: workout.description,
                  duration_minutes: workout.duration_minutes,
                  tss: workout.tss_estimate,
                  target_zone: workout.primary_zone,
                  intervals: workout.intervals ? { blocks: workout.intervals } : null,
                  completed: false,
                  source: 'coach',
                }
                
                const { error } = await supabase
                  .from('training_activities')
                  .insert(newActivity)
                
                if (error) throw error
                
                // Refresh activities
                setActivities(prev => [...prev, { ...newActivity, id: crypto.randomUUID() } as Activity])
                setShowLibrary(false)
              } catch (error) {
                console.error('Error assigning workout:', error)
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ActivitiesHub
