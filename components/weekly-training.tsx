"use client"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import {
  Bike,
  Dumbbell,
  Clock,
  Target,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Footprints,
  Waves,
  Activity,
  Mountain,
  Heart,
  Zap,
  Library,
} from "lucide-react"
import { WorkoutDetailModal } from "@/components/workout-detail-modal"
import { createClient } from "@/lib/supabase/client"
import GymExerciseLibrary from "./gym-exercise-library"
import type { AthleteDataType, WorkoutType } from "@/components/dashboard-content"
import { AIAnalysisButton } from "@/components/ai-analysis-button"

interface WeeklyTrainingProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
  workouts: WorkoutType[] | null
}

const SPORTS = [
  { id: "cycling", name: "Ciclismo", icon: Bike, hasPower: true },
  { id: "running", name: "Corsa", icon: Footprints, hasPower: false },
  { id: "swimming", name: "Nuoto", icon: Waves, hasPower: false },
  { id: "triathlon", name: "Triathlon", icon: Activity, hasPower: true },
  { id: "trail_running", name: "Trail Running", icon: Mountain, hasPower: false },
  { id: "mountain_bike", name: "MTB", icon: Bike, hasPower: true },
  { id: "gravel", name: "Gravel", icon: Bike, hasPower: true },
  { id: "cross_country_ski", name: "Sci Fondo", icon: Activity, hasPower: false },
  { id: "ski_mountaineering", name: "Scialpinismo", icon: Mountain, hasPower: false },
  { id: "rowing", name: "Canottaggio", icon: Waves, hasPower: true },
  { id: "gym", name: "Palestra", icon: Dumbbell, hasPower: false },
]

const BLOCK_TYPES = [
  { id: "warmup", name: "Riscaldamento", color: "bg-blue-500", defaultZone: "Z1", defaultDuration: 10 },
  { id: "endurance", name: "Endurance", color: "bg-green-500", defaultZone: "Z2", defaultDuration: 30 },
  { id: "tempo", name: "Tempo", color: "bg-yellow-500", defaultZone: "Z3", defaultDuration: 20 },
  { id: "threshold", name: "Soglia", color: "bg-orange-500", defaultZone: "Z4", defaultDuration: 15 },
  { id: "vo2max", name: "VO2max", color: "bg-red-500", defaultZone: "Z5", defaultDuration: 8 },
  {
    id: "intervals",
    name: "Intervalli",
    color: "bg-purple-500",
    defaultZone: "Z5",
    defaultDuration: 5,
    hasIntervals: true,
  },
  { id: "cooldown", name: "Defaticamento", color: "bg-slate-500", defaultZone: "Z1", defaultDuration: 10 },
]

interface WorkoutBlock {
  id: string
  type: string
  zone: string
  duration: number
  durationUnit: "min" | "sec"
  intervals?: number
  recoveryDuration?: number
  recoveryZone?: string
}

interface ZoneData {
  min: number
  max: number
  name?: string
}

interface PowerZones {
  z1?: ZoneData
  z2?: ZoneData
  z3?: ZoneData
  z4?: ZoneData
  z5?: ZoneData
  z6?: ZoneData
  z7?: ZoneData
}

interface HRZones {
  z1?: ZoneData
  z2?: ZoneData
  z3?: ZoneData
  z4?: ZoneData
  z5?: ZoneData
}

const dayNames = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]

const getZoneColor = (zone: string | null) => {
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

const getWorkoutIcon = (type: string) => {
  const sport = SPORTS.find((s) => s.id === type?.toLowerCase())
  if (sport) {
    const Icon = sport.icon
    return <Icon className="h-5 w-5" />
  }
  return <Bike className="h-5 w-5" />
}

function WeeklyTraining({ athleteData, userName, workouts }: WeeklyTrainingProps) {
  const supabase = createClient()
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutType | null>(null)
  const [localWorkouts, setLocalWorkouts] = useState<WorkoutType[]>(workouts || [])

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDayIndex, setEditingDayIndex] = useState<number | null>(null)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutType | null>(null)
  const [showGymDialog, setShowGymDialog] = useState(false)
  const [selectedGymDay, setSelectedGymDay] = useState(0)

  // Form state
  const [workoutName, setWorkoutName] = useState("")
  const [workoutSport, setWorkoutSport] = useState("cycling")
  const [workoutDescription, setWorkoutDescription] = useState("")
  const [workoutBlocks, setWorkoutBlocks] = useState<WorkoutBlock[]>([])
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)

  const [usePower, setUsePower] = useState(true)
  const [powerZones, setPowerZones] = useState<PowerZones>({})
  const [hrZones, setHRZones] = useState<HRZones>({})
  const [ftpWatts, setFtpWatts] = useState(0)
  const [hrMax, setHrMax] = useState(0)

  const [showSaveToLibraryDialog, setShowSaveToLibraryDialog] = useState(false)
  const [libraryWorkoutName, setLibraryWorkoutName] = useState("")
  const [libraryWorkoutTags, setLibraryWorkoutTags] = useState<string[]>([])

  useEffect(() => {
    if (athleteData?.metabolic_profiles?.[0]) {
      const profile = athleteData.metabolic_profiles[0]
      if (profile.ftp_watts) setFtpWatts(profile.ftp_watts)
      if (profile.hr_max) setHrMax(profile.hr_max)

      if (profile.empathy_zones) {
        const zones = profile.empathy_zones as {
          hr?: { zones?: HRZones }
          power?: { zones?: PowerZones; ftp_watts?: number }
        }
        if (zones.power?.zones) setPowerZones(zones.power.zones)
        if (zones.hr?.zones) setHRZones(zones.hr.zones)
        if (zones.power?.ftp_watts) setFtpWatts(zones.power.ftp_watts)
      }
    }
  }, [athleteData])

  const getZoneIntensity = (zone: string): string => {
    const zoneKey = zone.toLowerCase() as keyof PowerZones
    if (usePower && powerZones[zoneKey]) {
      const z = powerZones[zoneKey]!
      return `${z.min}-${z.max}W`
    } else if (!usePower && hrZones[zoneKey as keyof HRZones]) {
      const z = hrZones[zoneKey as keyof HRZones]!
      return `${z.min}-${z.max}bpm`
    }
    return ""
  }

  // Check if selected sport supports power
  const selectedSportData = useMemo(() => {
    return SPORTS.find((s) => s.id === workoutSport)
  }, [workoutSport])

  // Auto-switch to HR if sport doesn't support power
  useEffect(() => {
    if (selectedSportData && !selectedSportData.hasPower && usePower) {
      setUsePower(false)
    }
  }, [selectedSportData, usePower])

  useEffect(() => {
    if (workouts) setLocalWorkouts(workouts)
  }, [workouts])

  const getWeekDates = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  const getWorkoutsForDay = (date: Date) => {
    return localWorkouts.filter((w) => {
      if (!w.activity_date) return false
      const workoutDate = new Date(w.activity_date)
      return workoutDate.toDateString() === date.toDateString()
    })
  }

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    let totalDuration = 0
    let totalTSS = 0
    let bikeSessions = 0
    let gymSessions = 0
    let completed = 0

    localWorkouts.forEach((w) => {
      totalDuration += w.duration_minutes || 0
      totalTSS += w.tss || 0
      if (w.activity_type === "cycling" || w.workout_type === "cycling") bikeSessions++
      if (w.activity_type === "gym" || w.workout_type === "gym") gymSessions++
      if (w.completed) completed++
    })

    return {
      totalDuration,
      totalTSS,
      bikeSessions,
      gymSessions,
      completed,
      total: localWorkouts.length,
    }
  }, [localWorkouts])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Open dialog to create new workout
  const handleAddWorkout = (dayIndex: number) => {
    setEditingDayIndex(dayIndex)
    setEditingWorkout(null)
    setWorkoutName("")
    setWorkoutSport("cycling")
    setWorkoutDescription("")
    setWorkoutBlocks([])
    setExpandedBlockId(null)
    setDialogOpen(true)
  }

  // Open dialog to edit existing workout
  const handleEditWorkout = (workout: WorkoutType, dayIndex: number) => {
    setEditingDayIndex(dayIndex)
    setEditingWorkout(workout)
    setWorkoutName(workout.title || "")
    setWorkoutSport(workout.activity_type || workout.workout_type || "cycling")
    setWorkoutDescription(workout.description || "")
    // Parse existing blocks if available
    if (workout.intervals?.blocks) {
      setWorkoutBlocks(workout.intervals.blocks)
    } else {
      setWorkoutBlocks([])
    }
    setExpandedBlockId(null)
    setDialogOpen(true)
  }

  // Delete workout
  const handleDeleteWorkout = async (workout: WorkoutType) => {
    if (!confirm("Eliminare questo allenamento?")) return

    if (workout.id) {
      const { error } = await supabase.from("training_activities").delete().eq("id", workout.id)

      if (error) {
        console.error("Error deleting workout:", error)
        alert("Errore nell'eliminazione")
        return
      }
    }

    setLocalWorkouts((prev) => prev.filter((w) => w.id !== workout.id))
  }

  // Add block to workout
  const addBlock = (blockType: (typeof BLOCK_TYPES)[0]) => {
    const newBlock: WorkoutBlock = {
      id: `block-${Date.now()}`,
      type: blockType.id,
      zone: blockType.defaultZone,
      duration: blockType.defaultDuration,
      durationUnit: "min",
      ...(blockType.hasIntervals && { intervals: 4, recoveryDuration: 2, recoveryZone: "Z1" }),
    }
    setWorkoutBlocks((prev) => [...prev, newBlock])
    setExpandedBlockId(newBlock.id)
  }

  // Update block
  const updateBlock = (blockId: string, updates: Partial<WorkoutBlock>) => {
    setWorkoutBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b)))
  }

  // Delete block
  const deleteBlock = (blockId: string) => {
    setWorkoutBlocks((prev) => prev.filter((b) => b.id !== blockId))
    if (expandedBlockId === blockId) setExpandedBlockId(null)
  }

  // Move block up/down
  const moveBlock = (blockId: string, direction: "up" | "down") => {
    setWorkoutBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === blockId)
      if (index === -1) return prev
      if (direction === "up" && index === 0) return prev
      if (direction === "down" && index === prev.length - 1) return prev
      const newBlocks = [...prev]
      const swapIndex = direction === "up" ? index - 1 : index + 1
      ;[newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]]
      return newBlocks
    })
  }

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return workoutBlocks.reduce((total, block) => {
      let blockDuration = block.durationUnit === "sec" ? block.duration / 60 : block.duration
      if (block.intervals) {
        const recoveryTime = (block.recoveryDuration || 0) * (block.intervals - 1)
        blockDuration = blockDuration * block.intervals + recoveryTime
      }
      return total + blockDuration
    }, 0)
  }, [workoutBlocks])

  // Estimate TSS based on duration and average zone intensity
  const estimatedTSS = useMemo(() => {
    if (workoutBlocks.length === 0) return 0

    // Calculate average intensity factor based on zones
    const avgIntensityFactor =
      workoutBlocks.reduce((total, block) => {
        const zoneNum = Number.parseInt(block.zone.replace(/[^0-9]/g, "")) || 2
        // Intensity factors by zone: Z1=0.55, Z2=0.75, Z3=0.90, Z4=1.0, Z5=1.15, Z6=1.2, Z7=1.3
        const intensityFactors: Record<number, number> = { 1: 0.55, 2: 0.75, 3: 0.9, 4: 1.0, 5: 1.15, 6: 1.2, 7: 1.3 }
        return total + (intensityFactors[zoneNum] || 0.75)
      }, 0) / workoutBlocks.length

    // TSS = (duration in hours) * (intensity factor^2) * 100
    const durationHours = totalDuration / 60
    return Math.round(durationHours * avgIntensityFactor * avgIntensityFactor * 100)
  }, [workoutBlocks, totalDuration])

  // Save workout
  const handleSaveWorkout = async () => {
    if (!athleteData?.id || editingDayIndex === null) return

    const date = weekDates[editingDayIndex]
    const workoutData = {
      athlete_id: athleteData.id,
      activity_date: date.toISOString().split("T")[0],
      activity_type: workoutSport,
      workout_type: workoutBlocks.length > 0 ? workoutBlocks[0].type : "endurance",
      title:
        workoutName ||
        `${SPORTS.find((s) => s.id === workoutSport)?.name || "Allenamento"} - ${dayNames[editingDayIndex]}`,
      description: workoutDescription,
      duration_minutes: Math.round(totalDuration),
      target_zone: workoutBlocks.length > 0 ? workoutBlocks[Math.floor(workoutBlocks.length / 2)].zone : "Z2",
      intervals: {
        blocks: workoutBlocks,
        usePower,
        ftpWatts: usePower ? ftpWatts : null,
        hrMax: !usePower ? hrMax : null,
      },
      planned: true,
      completed: false,
    }

    try {
      if (editingWorkout?.id) {
        // Update existing
        const { error } = await supabase.from("training_activities").update(workoutData).eq("id", editingWorkout.id)

        if (error) throw error

        setLocalWorkouts((prev) => prev.map((w) => (w.id === editingWorkout.id ? { ...w, ...workoutData } : w)))
      } else {
        // Insert new
        const { data, error } = await supabase.from("training_activities").insert(workoutData).select().single()

        if (error) throw error

        setLocalWorkouts((prev) => [...prev, data])
      }

      setDialogOpen(false)
    } catch (error) {
      console.error("Error saving workout:", error)
      alert("Errore nel salvataggio")
    }
  }

  const handleSaveGymWorkout = async (gymData: any) => {
    console.log("[v0] handleSaveGymWorkout called with:", gymData)
    console.log("[v0] athleteData:", athleteData?.id)

    if (!athleteData?.id) {
      console.log("[v0] No athleteData.id, returning")
      return
    }

    const targetDate = new Date()
    const currentDay = targetDate.getDay()
    const diff = selectedGymDay - (currentDay === 0 ? 6 : currentDay - 1)
    targetDate.setDate(targetDate.getDate() + diff)

    const workoutData = {
      athlete_id: athleteData.id,
      title: gymData.name || "Scheda Palestra",
      activity_type: "gym",
      workout_type: "strength",
      description: `${gymData.exercises?.length || 0} esercizi`,
      duration_minutes: gymData.duration || 60,
      target_zone: "GYM",
      activity_date: targetDate.toISOString().split("T")[0],
      intervals: {
        blocks: [],
        gymExercises: gymData.exercises,
        estimatedCalories: gymData.estimatedCalories,
      },
      planned: true,
      completed: false,
    }

    console.log("[v0] Saving to training_activities:", workoutData)

    try {
      const { data, error } = await supabase.from("training_activities").insert(workoutData).select().single()

      console.log("[v0] Supabase response:", { data, error })

      if (error) throw error

      setLocalWorkouts((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.title,
          activity_type: data.activity_type,
          workout_type: data.workout_type,
          description: data.description,
          duration_minutes: data.duration_minutes,
          target_zone: data.target_zone,
          activity_date: data.activity_date,
          intervals: data.intervals,
          tss_planned: 0,
        },
      ])

      setShowGymDialog(false)
      alert("Scheda palestra salvata!")
    } catch (err) {
      console.error("[v0] Errore salvataggio palestra:", err)
      alert("Errore nel salvataggio")
    }
  }

  const handleSaveToLibrary = async () => {
    if (!libraryWorkoutName.trim()) {
      alert("Inserisci un nome per l'allenamento")
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()

      const workoutData = {
        name: libraryWorkoutName,
        sport: workoutSport,
        workout_type: workoutBlocks.length > 0 ? workoutBlocks[0].type : "endurance",
        description: workoutDescription,
        duration_minutes: Math.round(totalDuration),
        tss_estimate: estimatedTSS,
        intervals: { blocks: workoutBlocks },
        tags: libraryWorkoutTags,
        created_by: userData.user?.id,
        is_public: false,
      }

      const { error } = await supabase.from("workout_library").insert(workoutData)

      if (error) throw error

      alert("Allenamento salvato in biblioteca!")
      setShowSaveToLibraryDialog(false)
      setLibraryWorkoutName("")
      setLibraryWorkoutTags([])
    } catch (error) {
      console.error("Error saving to library:", error)
      alert("Errore nel salvataggio in biblioteca")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Piano Settimanale</h2>
          <p className="text-muted-foreground">
            {format(weekStart, "d MMM", { locale: it })} - {format(weekEnd, "d MMM", { locale: it })} - {userName}
          </p>
        </div>
        <div className="flex gap-2">
          {athleteData?.id && (
            <AIAnalysisButton
              athleteId={athleteData.id}
              endpoint="training"
              buttonText="AI Coach"
              context="Analisi carico, periodizzazione, consigli settimanali basati su metabolismo e microbioma"
            />
          )}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedGymDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
              setShowGymDialog(true)
            }}
            className="flex items-center gap-2"
          >
            <Dumbbell className="h-4 w-4" />
            Importa Palestra
          </Button>
        </div>
      </div>

      {/* Weekly Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Volume Settimanale</p>
              <p className="text-xl font-bold">{formatDuration(weeklyStats.totalDuration)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-full">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">TSS Settimanale</p>
              <p className="text-xl font-bold">{weeklyStats.totalTSS}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full">
              <Bike className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sessioni Bike</p>
              <p className="text-xl font-bold">{weeklyStats.bikeSessions} allenamenti</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-full">
              <Dumbbell className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sessioni Palestra</p>
              <p className="text-xl font-bold">{weeklyStats.gymSessions} allenamenti</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, index) => {
          const dayWorkouts = getWorkoutsForDay(date)
          const isToday = date.toDateString() === today.toDateString()

          return (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                isToday ? "ring-2 ring-primary" : ""
              } ${dayWorkouts.length === 0 ? "opacity-60" : ""}`}
              onClick={() => (dayWorkouts.length > 0 ? setSelectedWorkout(dayWorkouts[0]) : handleAddWorkout(index))}
            >
              <CardHeader className="p-2 pb-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {dayNames[index]} {isToday && "(Oggi)"}
                  </span>
                  {dayWorkouts.length > 1 && (
                    <Badge variant="secondary" className="text-[10px] px-1">
                      {dayWorkouts.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-1">
                {dayWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {dayWorkouts.map((workout, wIndex) => (
                      <div
                        key={workout.id || wIndex}
                        className={`space-y-1 ${wIndex > 0 ? "pt-2 border-t border-border/50" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedWorkout(workout)
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {getWorkoutIcon(workout.activity_type || workout.workout_type || "")}
                          <span className="text-xs font-medium truncate flex-1">
                            {workout.title?.split(" - ")[0] || "Allenamento"}
                          </span>
                          <Badge className={`text-[10px] px-1 ${getZoneColor(workout.target_zone)}`}>
                            {workout.target_zone || "Z2"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(workout.duration_minutes || 0)}
                          </span>
                          {workout.tss && <span>{workout.tss} TSS</span>}
                        </div>
                        {workout.completed && (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px]">Completato</span>
                          </div>
                        )}
                        {/* Action buttons for each workout */}
                        <div className="flex gap-1 mt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditWorkout(workout, index)
                            }}
                          >
                            <Pencil className="h-3 w-3 text-blue-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteWorkout(workout)
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center pt-1 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddWorkout(index)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1 text-green-500" />
                        <span className="text-xs">Aggiungi</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-muted-foreground">
                    <span className="text-xs">Riposo</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-6 px-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddWorkout(index)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      <span className="text-xs">Aggiungi</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Workout Builder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
<DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 bg-zinc-900 border-zinc-700">
  {/* Fixed Header */}
  <DialogHeader className="shrink-0 p-4 border-b border-zinc-700">
            <DialogTitle>
              {editingWorkout ? "Modifica" : "Nuovo"} Allenamento -{" "}
              {editingDayIndex !== null ? dayNames[editingDayIndex] : ""}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Name, Sport, FC/Power */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome Allenamento</Label>
                <Input
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Es: Endurance Z2"
                />
              </div>
              <div>
                <Label>Sport</Label>
                <Select value={workoutSport} onValueChange={setWorkoutSport}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        <div className="flex items-center gap-2">
                          <sport.icon className="h-4 w-4" />
                          {sport.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Heart className={`h-4 w-4 ${!usePower ? "text-red-500" : "text-muted-foreground"}`} />
                  <span className={!usePower ? "font-medium" : "text-muted-foreground"}>FC</span>
                </div>
                <Switch checked={usePower} onCheckedChange={setUsePower} disabled={!selectedSportData?.hasPower} />
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${usePower ? "text-yellow-500" : "text-muted-foreground"}`} />
                  <span className={usePower ? "font-medium" : "text-muted-foreground"}>Power</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {usePower
                  ? ftpWatts > 0
                    ? `FTP: ${ftpWatts}W`
                    : "FTP non impostato"
                  : hrMax > 0
                    ? `HR Max: ${hrMax}bpm`
                    : "HR Max non impostato"}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Descrizione</Label>
              <Textarea
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                placeholder="Note sull'allenamento..."
                rows={2}
              />
            </div>

            {/* Add Block Buttons */}
            <div>
              <Label className="mb-2 block">Aggiungi Blocco</Label>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map((blockType) => (
                  <Button
                    key={blockType.id}
                    size="sm"
                    variant="outline"
                    className={`${blockType.color} text-white border-0`}
                    onClick={() => addBlock(blockType)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {blockType.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Blocks List */}
            {workoutBlocks.length > 0 && (
              <div>
                <Label className="mb-2 block">
                  Blocchi ({workoutBlocks.length}) - Durata: {Math.round(totalDuration)} min
                </Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {workoutBlocks.map((block, index) => {
                    const blockType = BLOCK_TYPES.find((t) => t.id === block.type)
                    const isExpanded = expandedBlockId === block.id
                    const zoneIntensity = getZoneIntensity(block.zone)

                    return (
                      <div key={block.id} className={`${blockType?.color || "bg-gray-500"} rounded-lg p-3 text-white`}>
                        {/* Collapsed view - clickable header */}
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{blockType?.name}</span>
                            <span className="text-sm opacity-80">
                              {block.intervals ? `${block.intervals}x ` : ""}
                              {block.duration}
                              {block.durationUnit === "sec" ? "s" : "m"} {block.zone}
                              {zoneIntensity && <span className="ml-1 text-xs opacity-70">({zoneIntensity})</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveBlock(block.id, "up")
                              }}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveBlock(block.id, "down")
                              }}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-white hover:bg-white/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteBlock(block.id)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded view - edit controls */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-white/80 text-xs">Durata</Label>
                              <div className="flex gap-1">
                                <Input
                                  type="number"
                                  value={block.duration}
                                  onChange={(e) =>
                                    updateBlock(block.id, { duration: Number.parseInt(e.target.value) || 0 })
                                  }
                                  className="bg-white/20 border-0 text-white h-8"
                                />
                                <Select
                                  value={block.durationUnit}
                                  onValueChange={(v) => updateBlock(block.id, { durationUnit: v as "min" | "sec" })}
                                >
                                  <SelectTrigger className="bg-white/20 border-0 text-white w-16 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="min">min</SelectItem>
                                    <SelectItem value="sec">sec</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label className="text-white/80 text-xs">
                                Zona {getZoneIntensity(block.zone) && `(${getZoneIntensity(block.zone)})`}
                              </Label>
                              <Select value={block.zone} onValueChange={(v) => updateBlock(block.id, { zone: v })}>
                                <SelectTrigger className="bg-white/20 border-0 text-white h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z7"].map((z) => (
                                    <SelectItem key={z} value={z}>
                                      {z} {getZoneIntensity(z) && `- ${getZoneIntensity(z)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {block.intervals !== undefined && (
                              <>
                                <div>
                                  <Label className="text-white/80 text-xs">Ripetute</Label>
                                  <Input
                                    type="number"
                                    value={block.intervals}
                                    onChange={(e) =>
                                      updateBlock(block.id, { intervals: Number.parseInt(e.target.value) || 1 })
                                    }
                                    className="bg-white/20 border-0 text-white h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white/80 text-xs">Recupero (min)</Label>
                                  <div className="flex gap-1">
                                    <Input
                                      type="number"
                                      value={block.recoveryDuration}
                                      onChange={(e) =>
                                        updateBlock(block.id, {
                                          recoveryDuration: Number.parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="bg-white/20 border-0 text-white h-8"
                                    />
                                    <Select
                                      value={block.recoveryZone || "Z1"}
                                      onValueChange={(v) => updateBlock(block.id, { recoveryZone: v })}
                                    >
                                      <SelectTrigger className="bg-white/20 border-0 text-white w-16 h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {["Z1", "Z2"].map((z) => (
                                          <SelectItem key={z} value={z}>
                                            {z}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="shrink-0 p-4 border-t border-zinc-700 bg-zinc-900 flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setLibraryWorkoutName(workoutName)
                setShowSaveToLibraryDialog(true)
              }}
            >
              <Library className="h-4 w-4 mr-2" />
              Salva in Biblioteca
            </Button>
            <Button onClick={handleSaveWorkout}>Salva Allenamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Importa Palestra */}
      <Dialog open={showGymDialog} onOpenChange={setShowGymDialog}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 bg-zinc-900 border border-zinc-700 overflow-hidden z-50 [&>button]:text-white">
          <div className="fixed inset-0 bg-black/80 -z-10" />
          <DialogHeader className="p-6 pb-0 shrink-0 bg-zinc-900">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Dumbbell className="h-5 w-5 text-orange-500" />
              Importa Scheda Palestra - {dayNames[selectedGymDay]}
            </DialogTitle>
          </DialogHeader>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4 bg-zinc-900">
            <GymExerciseLibrary
              onSaveWorkout={handleSaveGymWorkout}
              selectedDay={selectedGymDay}
              onDayChange={setSelectedGymDay}
              dayNames={dayNames}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveToLibraryDialog} onOpenChange={setShowSaveToLibraryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Salva in Biblioteca</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Template</Label>
              <Input
                value={libraryWorkoutName}
                onChange={(e) => setLibraryWorkoutName(e.target.value)}
                placeholder="Es: Fondo Lungo Z2"
              />
            </div>
            <div>
              <Label>Tags (separati da virgola)</Label>
              <Input
                value={libraryWorkoutTags.join(", ")}
                onChange={(e) =>
                  setLibraryWorkoutTags(
                    e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter((t) => t),
                  )
                }
                placeholder="Es: base, aerobico, lungo"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                Durata: {Math.floor(totalDuration / 60)}h {totalDuration % 60}min
              </p>
              <p>TSS: ~{estimatedTSS}</p>
              <p>Blocchi: {workoutBlocks.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveToLibraryDialog(false)}>
              Annulla
            </Button>
            <Button onClick={handleSaveToLibrary}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <WorkoutDetailModal
          workout={selectedWorkout}
          isOpen={!!selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          onEdit={() => {
            // Find the day index for this workout
            const workoutDate = selectedWorkout.activity_date ? new Date(selectedWorkout.activity_date) : null
            if (workoutDate) {
              const dayIndex = weekDates.findIndex((d) => d.toDateString() === workoutDate.toDateString())
              if (dayIndex !== -1) {
                setSelectedWorkout(null) // Close detail modal
                handleEditWorkout(selectedWorkout, dayIndex) // Open edit dialog
              }
            }
          }}
          dayName={
            selectedWorkout.activity_date
              ? dayNames[
                  weekDates.findIndex(
                    (d) => d.toDateString() === new Date(selectedWorkout.activity_date!).toDateString(),
                  )
                ] || ""
              : ""
          }
          athleteFTP={ftpWatts || 250}
        />
      )}
    </div>
  )
}

export default WeeklyTraining
