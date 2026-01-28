"use client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Bike,
  Footprints,
  Waves,
  Activity,
  Mountain,
  Dumbbell,
  Save,
  RefreshCw,
  Loader2,
  Trash2,
  CalendarRange,
  Target,
  Zap,
  Heart,
  BookOpen,
  Settings,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  Flame,
  TrendingUp,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AnnualPlanGenerator } from "./annual-plan-generator"
import { WorkoutLibrary } from "./workout-library"
import GymExerciseLibrary from "./gym-exercise-library"

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface AthleteDataType {
  id: string
  user_id: string
  primary_sport?: string
  metabolic_profiles?: Array<{
    id?: string
    ftp_watts?: number
    hr_max?: number
    hr_lt2?: number
    hr_rest?: number
    hr_zones?: Record<string, unknown>
    is_current?: boolean
    empathy_zones?: Record<string, unknown>
  }>
  user?: {
    full_name?: string
  }
  weight_kg?: number
  [key: string]: unknown
}

interface HRZoneData {
  z1: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z2: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z3: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z4: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z5: { name: string; min: number; max: number; percent: { min: number; max: number } }
}

interface PowerZoneData {
  z1: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z2: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z3: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z4: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z5: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z6: { name: string; min: number; max: number; percent: { min: number; max: number } }
  z7: { name: string; min: number; max: number; percent: { min: number; max: number } }
}

interface WorkoutBlock {
  id: string
  type: string
  duration: number
  zone: string
  intensity?: number
  intervalDuration?: number
  intervalDurationUnit?: "min" | "sec"
  numIntervals?: number
  restBetweenIntervals?: number
  description?: string
}

interface TrainingSession {
  sessionId: string
  dayIndex: number // Changed from day to dayIndex
  activityDate?: string // YYYY-MM-DD format
  sport: string
  workoutType: string
  title: string
  description: string
  duration: number
  targetZone: string
  blocks: WorkoutBlock[]
  tss?: number
  avgPower?: number
  kcal?: number
  gymExercises?: Array<{
    name: string
    sets: number
    reps: number
    weight?: number
    rest?: number
    notes?: string
  }>
  completed?: boolean
}

interface VyriaTrainingPlanProps {
  athleteData: AthleteDataType | null
  userName?: string | null
  onUpdate?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SPORTS = [
  { id: "cycling", name: "Ciclismo", icon: Bike, color: "text-yellow-500", supportsPower: true },
  { id: "running", name: "Corsa", icon: Footprints, color: "text-green-500", supportsPower: false },
  { id: "swimming", name: "Nuoto", icon: Waves, color: "text-blue-500", supportsPower: false },
  { id: "triathlon", name: "Triathlon", icon: Activity, color: "text-fuchsia-500", supportsPower: true },
  { id: "trail_running", name: "Trail Running", icon: Mountain, color: "text-emerald-500", supportsPower: false },
  { id: "mountain_bike", name: "MTB", icon: Bike, color: "text-orange-500", supportsPower: true },
  { id: "gravel", name: "Gravel", icon: Bike, color: "text-amber-500", supportsPower: true },
  { id: "cross_country_ski", name: "Sci Fondo", icon: Activity, color: "text-cyan-500", supportsPower: false },
  { id: "ski_mountaineering", name: "Scialpinismo", icon: Mountain, color: "text-sky-500", supportsPower: false },
  { id: "rowing", name: "Canottaggio", icon: Waves, color: "text-indigo-500", supportsPower: true },
  { id: "gym", name: "Palestra", icon: Dumbbell, color: "text-red-500", supportsPower: false },
  ]

const DAY_NAMES = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]

// TSS Calculation - Formula: TSS = (seconds × IF²) / 3600 × 100
// IF values per zone based on typical power zones
const ZONE_IF: Record<string, number> = {
  Z1: 0.55,  // Recovery
  Z2: 0.70,  // Endurance
  Z3: 0.85,  // Tempo
  Z4: 0.95,  // Threshold
  Z5: 1.05,  // VO2max
  Z6: 1.20,  // Anaerobic
  Z7: 1.50,  // Neuromuscular
}

// Calculate TSS for a single block
const calculateBlockTSS = (durationMin: number, zone: string): number => {
  const IF = ZONE_IF[zone] || 0.70
  // TSS = (duration_seconds * IF²) / 3600 * 100
  return (durationMin * 60 * IF * IF) / 3600 * 100
}

// Calculate total TSS for all blocks
const calculateTotalTSS = (blocks: any[], calculateBlockDurationFn: (b: any) => number): number => {
  return blocks.reduce((sum, block) => {
    const duration = calculateBlockDurationFn(block)
    return sum + calculateBlockTSS(duration, block.zone)
  }, 0)
}

// Calculate kcal based on average power and duration
// Formula: Work (kJ) = Power (W) × Time (s) / 1000
// Energy expenditure = Work / efficiency (25% for cycling)
// kcal = kJ / 4.184
const calculateKcal = (avgPowerWatts: number, durationMin: number): number => {
  const durationSeconds = durationMin * 60
  const workKJ = (avgPowerWatts * durationSeconds) / 1000 // Work in kJ
  const efficiency = 0.25 // 25% mechanical efficiency
  const totalEnergyKJ = workKJ / efficiency
  const kcal = totalEnergyKJ / 4.184 // Convert kJ to kcal
  return Math.round(kcal)
}

// Estimate average power based on FTP and zones
const estimateAvgPower = (blocks: any[], ftp: number, calculateBlockDurationFn: (b: any) => number): number => {
  const totalDuration = blocks.reduce((sum, b) => sum + calculateBlockDurationFn(b), 0)
  if (totalDuration === 0) return 0
  
  const weightedPower = blocks.reduce((sum, block) => {
    const duration = calculateBlockDurationFn(block)
    const zonePercent: Record<string, number> = {
      Z1: 0.55, Z2: 0.70, Z3: 0.85, Z4: 0.95, Z5: 1.05, Z6: 1.20, Z7: 1.50
    }
    const powerForZone = ftp * (zonePercent[block.zone] || 0.70)
    return sum + (powerForZone * duration)
  }, 0)
  
  return Math.round(weightedPower / totalDuration)
}

const ZONE_COLORS: Record<string, string> = {
  Z1: "bg-slate-500",
  Z2: "bg-green-500",
  Z3: "bg-yellow-500",
  Z4: "bg-orange-500",
  Z5: "bg-red-500",
  Z6: "bg-red-600",
  Z7: "bg-red-800",
  GYM: "bg-purple-600",
}

const BLOCK_TYPES = [
  { id: "warmup", name: "Riscaldamento", color: "bg-green-500", defaultZone: "Z1", defaultDuration: 10 },
  { id: "endurance", name: "Endurance", color: "bg-blue-500", defaultZone: "Z2", defaultDuration: 30 },
  { id: "tempo", name: "Tempo", color: "bg-yellow-500", defaultZone: "Z3", defaultDuration: 20 },
  { id: "threshold", name: "Soglia", color: "bg-orange-500", defaultZone: "Z4", defaultDuration: 15 },
  { id: "vo2max", name: "VO2max", color: "bg-red-500", defaultZone: "Z5", defaultDuration: 8 },
  {
    id: "intervals",
    name: "Intervalli",
    color: "bg-purple-500",
    defaultZone: "Z4",
    defaultDuration: 20,
    hasIntervals: true,
  },
  { id: "cooldown", name: "Defaticamento", color: "bg-slate-500", defaultZone: "Z1", defaultDuration: 10 },
]

const ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z7"]

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const generateId = () => Math.random().toString(36).substring(2, 9)

const getWeekDateRange = () => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

function VyriaTrainingPlan({ athleteData, userName, onUpdate }: VyriaTrainingPlanProps) {
  const supabase = createClient()

  // State
  const [activeTab, setActiveTab] = useState("zones")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  // Zones State
  const [hrMax, setHrMax] = useState(190)
  const [hrThreshold, setHrThreshold] = useState(170)
  const [hrRest, setHrRest] = useState(50)
  const [ftpWatts, setFtpWatts] = useState(250)
  const [hrZones, setHrZones] = useState<HRZoneData | null>(null)
  const [powerZones, setPowerZones] = useState<PowerZoneData | null>(null)
  const [zonesCalculated, setZonesCalculated] = useState(false)

  // Weekly Plan State
  const [generatedPlan, setGeneratedPlan] = useState<TrainingSession[]>([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [resetWeekDialogOpen, setResetWeekDialogOpen] = useState(false)
  // Removed showWorkoutBuilder state
  // const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false)

  const [showInlineEditor, setShowInlineEditor] = useState(false)
  const [editorSport, setEditorSport] = useState("cycling")
  const [editorTitle, setEditorTitle] = useState("")
  const [editorNotes, setEditorNotes] = useState("")
  const [editorBlocks, setEditorBlocks] = useState<WorkoutBlock[]>([])
  const [editorZoneType, setEditorZoneType] = useState<"hr" | "power">("power")

  // State - add training preferences state after existing state declarations
  const [trainingPreferences, setTrainingPreferences] = useState<{
    restDays: number[]
    preferredTime: string
    coachNotes: string
  }>({
    restDays: [],
    preferredTime: "morning",
    coachNotes: "",
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DATA
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (athleteData?.metabolic_profiles) {
      const currentProfile =
        athleteData.metabolic_profiles.find((p) => p.is_current) || athleteData.metabolic_profiles[0]
      if (currentProfile) {
        if (currentProfile.hr_max) setHrMax(currentProfile.hr_max)
        if (currentProfile.hr_lt2) setHrThreshold(currentProfile.hr_lt2)
        if (currentProfile.hr_rest) setHrRest(currentProfile.hr_rest)
        if (currentProfile.ftp_watts) setFtpWatts(currentProfile.ftp_watts)
        if (currentProfile.empathy_zones) {
          const zones = currentProfile.empathy_zones as { hr?: { zones: HRZoneData }; power?: { zones: PowerZoneData } }
          if (zones.hr?.zones) {
            setHrZones(zones.hr.zones)
            setZonesCalculated(true)
          }
          if (zones.power?.zones) setPowerZones(zones.power.zones)
        }
      }
    }
  }, [athleteData])

  useEffect(() => {
    const loadTrainingPreferences = async () => {
      if (!athleteData?.id) return

      try {
        // First try to load from annual_training_plans
        const { data: planData } = await supabase
          .from("annual_training_plans")
          .select("config_json")
          .eq("athlete_id", athleteData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (planData?.config_json?.training_preferences) {
          const prefs = planData.config_json.training_preferences
          // Convert day names to indices (Mon=0, Tue=1, etc.)
          const dayNameToIndex: Record<string, number> = {
            Mon: 0,
            Tue: 1,
            Wed: 2,
            Thu: 3,
            Fri: 4,
            Sat: 5,
            Sun: 6,
          }
          const restDayIndices = (prefs.preferred_rest_days || [])
            .map((d: string) => dayNameToIndex[d])
            .filter((i: number | undefined) => i !== undefined)

          setTrainingPreferences({
            restDays: restDayIndices,
            preferredTime: prefs.preferred_training_time || "morning",
            coachNotes: prefs.coach_notes || "",
          })
          console.log("[v0] Loaded training preferences from annual plan:", prefs)
          return
        }

        // Fallback: load from athlete_constraints.notes
        const { data: constraintsData } = await supabase
          .from("athlete_constraints")
          .select("notes")
          .eq("athlete_id", athleteData.id)
          .single()

        if (constraintsData?.notes) {
          try {
            const notes =
              typeof constraintsData.notes === "string" ? JSON.parse(constraintsData.notes) : constraintsData.notes

            if (notes.training_preferences) {
              const prefs = notes.training_preferences
              const dayNameToIndex: Record<string, number> = {
                Mon: 0,
                Tue: 1,
                Wed: 2,
                Thu: 3,
                Fri: 4,
                Sat: 5,
                Sun: 6,
              }
              const restDayIndices = (prefs.preferred_rest_days || [])
                .map((d: string) => dayNameToIndex[d])
                .filter((i: number | undefined) => i !== undefined)

              setTrainingPreferences({
                restDays: restDayIndices,
                preferredTime: prefs.preferred_training_time || "morning",
                coachNotes: prefs.coach_notes || "",
              })
              console.log("[v0] Loaded training preferences from constraints:", prefs)
            }
          } catch (e) {
            console.error("[v0] Error parsing training preferences:", e)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading training preferences:", error)
      }
    }

    loadTrainingPreferences()
  }, [athleteData?.id, supabase])

  useEffect(() => {
    const loadWeeklyWorkouts = async () => {
      if (!athleteData?.id) return
      setLoading(true)
      try {
        const { monday, sunday } = getWeekDateRange()
        const { data: workouts, error } = await supabase
          .from("training_activities")
          .select("*")
          .eq("athlete_id", athleteData.id)
          .gte("activity_date", monday.toISOString().split("T")[0])
          .lte("activity_date", sunday.toISOString().split("T")[0])
          .order("activity_date", { ascending: true })

        if (error) throw error
        if (workouts && workouts.length > 0) {
          const sessions: TrainingSession[] = workouts.map((w: any) => {
            const activityDate = new Date(w.activity_date)
            const dayOfWeek = activityDate.getDay()
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            return {
              sessionId: w.id || generateId(),
              dayIndex, // Correctly mapped to dayIndex
              sport: w.activity_type || w.workout_type || "cycling",
              workoutType: w.workout_type || "endurance",
              title: w.title || "Allenamento",
              description: w.description || "",
              duration: w.duration_minutes || 60,
              targetZone: w.target_zone || "Z2",
              blocks: w.intervals?.blocks || [],
              tss: w.tss,
              gymExercises: w.gym_exercises || [],
              completed: w.completed,
            }
          })
          setGeneratedPlan(sessions)
        }
      } catch (err) {
        console.error("Error loading workouts:", err)
      } finally {
        setLoading(false)
      }
    }
    loadWeeklyWorkouts()
  }, [athleteData?.id, supabase])

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const calculateZones = () => {
    const calculatedHRZones: HRZoneData = {
      z1: { name: "Recupero", min: hrRest, max: Math.round(hrThreshold * 0.81), percent: { min: 0, max: 81 } },
      z2: {
        name: "Endurance",
        min: Math.round(hrThreshold * 0.81),
        max: Math.round(hrThreshold * 0.89),
        percent: { min: 81, max: 89 },
      },
      z3: {
        name: "Tempo",
        min: Math.round(hrThreshold * 0.9),
        max: Math.round(hrThreshold * 0.93),
        percent: { min: 90, max: 93 },
      },
      z4: {
        name: "Soglia",
        min: Math.round(hrThreshold * 0.94),
        max: Math.round(hrThreshold * 0.99),
        percent: { min: 94, max: 99 },
      },
      z5: { name: "VO2max", min: Math.round(hrThreshold * 1.0), max: hrMax, percent: { min: 100, max: 106 } },
    }
    const calculatedPowerZones: PowerZoneData = {
      z1: { name: "Recupero", min: 0, max: Math.round(ftpWatts * 0.55), percent: { min: 0, max: 55 } },
      z2: {
        name: "Endurance",
        min: Math.round(ftpWatts * 0.56),
        max: Math.round(ftpWatts * 0.75),
        percent: { min: 56, max: 75 },
      },
      z3: {
        name: "Tempo",
        min: Math.round(ftpWatts * 0.76),
        max: Math.round(ftpWatts * 0.9),
        percent: { min: 76, max: 90 },
      },
      z4: {
        name: "Soglia",
        min: Math.round(ftpWatts * 0.91),
        max: Math.round(ftpWatts * 1.05),
        percent: { min: 91, max: 105 },
      },
      z5: {
        name: "VO2max",
        min: Math.round(ftpWatts * 1.06),
        max: Math.round(ftpWatts * 1.2),
        percent: { min: 106, max: 120 },
      },
      z6: {
        name: "Anaerobico",
        min: Math.round(ftpWatts * 1.21),
        max: Math.round(ftpWatts * 1.5),
        percent: { min: 121, max: 150 },
      },
      z7: { name: "Neuromuscolare", min: Math.round(ftpWatts * 1.5), max: 9999, percent: { min: 150, max: 999 } },
    }
    setHrZones(calculatedHRZones)
    setPowerZones(calculatedPowerZones)
    setZonesCalculated(true)
  }

  const saveZones = async () => {
    if (!athleteData?.id || !athleteData.metabolic_profiles?.[0]?.id) return
    setSaving(true)
    try {
      const profileId = athleteData.metabolic_profiles[0].id
      const empathyZones = {
        hr: { hr_max: hrMax, hr_threshold: hrThreshold, hr_rest: hrRest, zones: hrZones },
        power: { ftp_watts: ftpWatts, zones: powerZones },
      }
      const { error } = await supabase
        .from("metabolic_profiles")
        .update({
          hr_max: hrMax,
          hr_lt2: hrThreshold,
          hr_rest: hrRest,
          ftp_watts: ftpWatts,
          empathy_zones: empathyZones,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId)
      if (error) throw error
      alert("Zone salvate con successo!")
    } catch (err) {
      console.error("Error saving zones:", err)
      alert("Errore nel salvataggio delle zone")
    } finally {
      setSaving(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKOUT FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const addWorkoutToDay = (dayIndex: number, workout?: Partial<TrainingSession>) => {
    const newSession: TrainingSession = {
      sessionId: generateId(),
      dayIndex, // Correctly mapped to dayIndex
      sport: workout?.sport || "cycling",
      workoutType: workout?.workoutType || "endurance",
      title: workout?.title || "Allenamento",
      description: workout?.description || "",
      duration: workout?.duration || 60,
      targetZone: workout?.targetZone || "Z2",
      blocks: workout?.blocks || [],
      tss: workout?.tss,
      gymExercises: workout?.gymExercises,
      completed: false,
    }
    setGeneratedPlan((prev) => [...prev, newSession])
  }

  const deleteSession = (sessionId: string) => {
    setGeneratedPlan((prev) => prev.filter((s) => s.sessionId !== sessionId))
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  const resetWeek = () => {
    setGeneratedPlan([])
    setResetWeekDialogOpen(false)
  }

const saveWeekToTraining = async () => {
  if (!athleteData?.id || generatedPlan.length === 0) return
  
  setSaving(true)
  try {
  const { monday } = getWeekDateRange()
  
  const workoutsToInsert = generatedPlan.map((session) => {
        // Use activityDate if available, otherwise calculate from dayIndex
        let activityDateStr: string
        if (session.activityDate) {
          activityDateStr = session.activityDate
        } else {
          const activityDate = new Date(monday)
          activityDate.setDate(monday.getDate() + session.dayIndex)
          activityDateStr = activityDate.toISOString().split("T")[0]
        }
        
return {
  athlete_id: athleteData.id,
  activity_date: activityDateStr,
  activity_type: session.sport,
  workout_type: session.workoutType,
  title: session.title,
  description: session.description,
  duration_minutes: session.duration,
  target_zone: session.targetZone,
  tss: session.tss || Math.round(session.duration * 0.8),
  average_power: session.avgPower || null,
  calories: session.kcal || null,
  intervals: session.gymExercises 
    ? { blocks: session.blocks, gymExercises: session.gymExercises }
    : { blocks: session.blocks },
  planned: true,
  completed: session.completed || false,
  source: "vyria_generated",
  }
      })
      const { error } = await supabase.from("training_activities").insert(workoutsToInsert)
      if (error) throw error
      alert("Piano settimanale salvato!")
      onUpdate?.()
    } catch (err) {
      console.error("Error saving week:", err)
      alert("Errore nel salvataggio")
    } finally {
      setSaving(false)
    }
  }

  const handleGymWorkoutSave = async (workout: any) => {
    if (!athleteData?.id) {
      console.log("[v0] handleGymWorkoutSave: No athleteData.id, cannot save")
      alert("Errore: dati atleta non disponibili")
      return
    }

    console.log("[v0] handleGymWorkoutSave called with:", workout)

    // Calcola la data per il giorno selezionato
    const today = new Date()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    const activityDate = new Date(monday)
    activityDate.setDate(monday.getDate() + selectedDay)

    const gymExercises =
      workout.exercises?.map((ex: any) => ({
        name: ex.exercise?.name || ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        rest: ex.rest,
        notes: ex.notes,
      })) || []

    const workoutData = {
      athlete_id: athleteData.id,
      activity_date: activityDate.toISOString().split("T")[0],
      activity_type: "gym",
      workout_type: "strength",
      title: workout.name || "Scheda Palestra",
      description: workout.notes || "",
      duration_minutes: workout.estimatedTime || 60,
      target_zone: "GYM",
      intervals: { gymExercises }, // Assuming 'intervals' is the correct field for gym exercises in the DB schema
      planned: true,
      completed: false,
      source: "vyria_gym",
    }

    console.log("[v0] Saving gym workout to database:", workoutData)

    try {
      const { data, error } = await supabase.from("training_activities").insert(workoutData).select()

      if (error) {
        console.error("[v0] Error saving gym workout:", error)
        alert("Errore nel salvataggio: " + error.message)
        return
      }

      console.log("[v0] Gym workout saved successfully:", data)
      alert("Scheda palestra salvata in Training!")

      // Aggiorna anche lo stato locale per feedback immediato
      const newSession: TrainingSession = {
        sessionId: generateId(),
        dayIndex: selectedDay,
        sport: "gym",
        workoutType: "strength",
        title: workout.name || "Scheda Palestra",
        description: workout.notes || "",
        duration: workout.estimatedTime || 60,
        targetZone: "GYM",
        blocks: [],
        gymExercises,
        completed: false,
      }
      setGeneratedPlan((prev) => [...prev, newSession])

      // Notifica il parent component per aggiornare la vista
      onUpdate?.()
    } catch (err) {
      console.error("[v0] Exception saving gym workout:", err)
      alert("Errore nel salvataggio")
    }
  }

  // Removed handleAdvancedWorkoutSave function
  // const handleAdvancedWorkoutSave = (workout: GeneratedWorkout, dayIndex: number) => {
  //   const newSession: TrainingSession = {
  //     sessionId: generateId(),
  //     dayIndex,
  //     sport: workout.sport,
  //     workoutType: workout.zoneType === "power" ? "power" : "hr",
  //     title: workout.name,
  //     description: workout.notes,
  //     duration: workout.totalDuration,
  //     targetZone: workout.blocks[0]?.primaryZone || "Z2",
  //     blocks: workout.blocks.map((b) => ({
  //       id: b.id,
  //       type: b.blockType,
  //       zone: b.primaryZone,
  //       duration: b.totalDuration,
  //       intervalDuration: b.intervalDuration,
  //       intervalDurationUnit: b.durationUnit,
  //       numIntervals: b.numIntervals,
  //       restBetweenIntervals: b.restBetweenIntervals,
  //     })),
  //     tss: workout.estimatedTSS,
  //     completed: false,
  //   }
  //   setGeneratedPlan((prev) => [...prev, newSession])
  //   setShowWorkoutBuilder(false)
  // }

  const addBlock = (blockType: (typeof BLOCK_TYPES)[0]) => {
    const newBlock: WorkoutBlock = {
      id: generateId(),
      type: blockType.id,
      duration: blockType.defaultDuration,
      zone: blockType.defaultZone,
      intervalDuration: blockType.hasIntervals ? 3 : undefined,
      intervalDurationUnit: "min",
      numIntervals: blockType.hasIntervals ? 4 : undefined,
      restBetweenIntervals: blockType.hasIntervals ? 2 : undefined,
    }
    setEditorBlocks((prev) => [...prev, newBlock])
  }

  const updateBlock = (blockId: string, updates: Partial<WorkoutBlock>) => {
    setEditorBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b)))
  }

  const removeBlock = (blockId: string) => {
    setEditorBlocks((prev) => prev.filter((b) => b.id !== blockId))
  }

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    setEditorBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId)
      if (idx === -1) return prev
      if (direction === "up" && idx === 0) return prev
      if (direction === "down" && idx === prev.length - 1) return prev
      const newBlocks = [...prev]
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      ;[newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]]
      return newBlocks
    })
  }

  const calculateBlockDuration = (block: WorkoutBlock): number => {
    if (block.numIntervals && block.intervalDuration && block.restBetweenIntervals !== undefined) {
      const intervalSec = block.intervalDurationUnit === "sec" ? block.intervalDuration : block.intervalDuration * 60
      const totalWorkSec = intervalSec * block.numIntervals
      const totalRestSec = block.restBetweenIntervals * 60 * (block.numIntervals - 1)
      return Math.ceil((totalWorkSec + totalRestSec) / 60)
    }
    return block.duration
  }

  const getTotalDuration = () => editorBlocks.reduce((sum, b) => sum + calculateBlockDuration(b), 0)

  const resetEditor = () => {
    setEditorTitle("")
    setEditorNotes("")
    setEditorBlocks([])
    setShowInlineEditor(false)
  }

const saveEditorWorkout = async () => {
  if (editorBlocks.length === 0) {
  alert("Aggiungi almeno un blocco")
  return
  }
  
  if (!athleteData?.id) {
  alert("Errore: dati atleta non disponibili")
  return
  }
  
  // Get user_id from auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
  alert("Errore: utente non autenticato")
  return
  }
  
  const totalDuration = getTotalDuration()
  const mainZone = editorBlocks.find((b) => b.type !== "warmup" && b.type !== "cooldown")?.zone || "Z2"
  
  // Calculate metrics
  const calculatedTSS = Math.round(calculateTotalTSS(editorBlocks, calculateBlockDuration))
  const avgPower = estimateAvgPower(editorBlocks, ftpWatts, calculateBlockDuration)
  const kcal = calculateKcal(avgPower, totalDuration)
  
  const activityDateStr = selectedDate.toISOString().split('T')[0]
  
  // Save directly to database
  try {
  setSaving(true)
  const workoutData = {
  athlete_id: athleteData.id,
  activity_date: activityDateStr,
  activity_type: editorSport,
      workout_type: editorBlocks.some((b) => b.type === "intervals")
        ? "intervals"
        : editorBlocks[0]?.type || "endurance",
      title: editorTitle || `Allenamento ${DAY_NAMES[selectedDay]}`,
      description: editorNotes,
      duration_minutes: totalDuration,
      target_zone: mainZone,
      tss: calculatedTSS,
      average_power: avgPower,
      calories: kcal,
      intervals: { blocks: editorBlocks },
      planned: true,
      completed: false,
      source: "vyria_builder",
    }
    
    console.log("[v0] Saving workout to DB:", workoutData)
    
    const { error } = await supabase.from("training_activities").insert(workoutData)
    
    if (error) {
      console.error("[v0] Error saving workout:", error)
      throw error
    }
    
    // Also add to local state for immediate UI update
    const newSession: TrainingSession = {
      sessionId: generateId(),
      dayIndex: selectedDay,
      activityDate: activityDateStr,
      sport: editorSport,
      workoutType: editorBlocks.some((b) => b.type === "intervals")
        ? "intervals"
        : editorBlocks[0]?.type || "endurance",
      title: editorTitle || `Allenamento ${DAY_NAMES[selectedDay]}`,
      description: editorNotes,
      duration: totalDuration,
      targetZone: mainZone,
      blocks: editorBlocks,
      tss: calculatedTSS,
      avgPower: avgPower,
      kcal: kcal,
      completed: false,
    }
    setGeneratedPlan((prev) => [...prev, newSession])
    
    alert(`Allenamento salvato per ${activityDateStr}!`)
    onUpdate?.() // Refresh calendar data
    resetEditor()
  } catch (err) {
    console.error("[v0] saveEditorWorkout error:", err)
    alert("Errore nel salvataggio dell'allenamento")
  } finally {
    setSaving(false)
  }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER ZONE BAR
  // ═══════════════════════════════════════════════════════════════════════════

  const renderZoneBar = (zones: HRZoneData | PowerZoneData | null, type: "hr" | "power") => {
    if (!zones) return null
    const zoneKeys = Object.keys(zones) as (keyof typeof zones)[]
    return (
      <div className="space-y-2">
        {zoneKeys.map((key, idx) => {
          const zone = zones[key]
          const zoneNum = idx + 1
          const color = ZONE_COLORS[`Z${zoneNum}`] || "bg-gray-500"
          return (
            <div key={key} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}
              >
                Z{zoneNum}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{zone.name}</span>
                  <span className="text-muted-foreground">
                    {zone.min} - {zone.max === 9999 ? "Max" : zone.max} {type === "hr" ? "bpm" : "W"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${color}`}
                    style={{ width: `${Math.min(100, (zone.max / (type === "hr" ? hrMax : ftpWatts * 1.5)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER WEEKLY CALENDAR
  // ═══════════════════════════════════════════════════════════════════════════

  const renderWeeklyCalendar = () => {
    const today = new Date()
    const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1

    return (
      <div className="grid grid-cols-7 gap-2">
        {DAY_NAMES.map((day, idx) => {
          const daySessions = generatedPlan.filter((s) => s.dayIndex === idx)
          const isToday = idx === todayIndex
          const isSelected = idx === selectedDay
          const isRestDay = trainingPreferences.restDays.includes(idx)

          return (
            <Card
              key={idx}
              className={`cursor-pointer transition-all hover:shadow-md ${isToday ? "ring-2 ring-fuchsia-500" : ""} ${isSelected ? "bg-fuchsia-500/10 border-fuchsia-500" : ""} ${isRestDay ? "bg-slate-100/50 dark:bg-slate-800/50 border-dashed border-muted" : ""}`}
              onClick={() => setSelectedDay(idx)}
            >
              <CardHeader className="p-2 pb-1">
                <CardTitle className="text-xs font-medium flex items-center justify-between">
                  <span className={isToday ? "text-fuchsia-500" : ""}>{day.slice(0, 3)}</span>
                  {daySessions.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1">
                      {daySessions.length}
                    </Badge>
                  )}
                  {isRestDay && !daySessions.length && <Activity className="h-3 w-3 text-gray-400" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0 min-h-[80px]">
                {daySessions.length > 0 ? (
                  <div className="space-y-1">
                    {daySessions.map((session) => {
                      const SportIcon = SPORTS.find((s) => s.id === session.sport)?.icon || Activity
                      return (
                        <div key={session.sessionId} className="flex items-center justify-between group">
                          <div
                            className={`w-6 h-6 rounded-full ${ZONE_COLORS[session.targetZone] || "bg-fuchsia-500"} flex items-center justify-center`}
                          >
                            <SportIcon className="h-3 w-3 text-white" />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSessionToDelete(session.sessionId)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground text-center py-2">
                    {isRestDay ? "Riposo" : "Riposo"}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  const renderInlineEditor = () => {
    const blockType = (type: string) => BLOCK_TYPES.find((b) => b.id === type)

    return (
      <Card className="border-fuchsia-500/50 bg-fuchsia-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-fuchsia-500" />
              Crea Allenamento
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={resetEditor}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Date Picker */}
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs">Data:</Label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value)
                  setSelectedDate(newDate)
                  // Update day of week
                  const dayOfWeek = newDate.getDay()
                  setSelectedDay(dayOfWeek === 0 ? 6 : dayOfWeek - 1)
                }}
                className="bg-background border border-border rounded px-2 py-1 text-sm"
              />
            </div>
            <Badge variant="outline" className="text-xs">
              {DAY_NAMES[selectedDay]} {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Badge>
          </div>
        </CardHeader>
        <div className="max-h-[500px] overflow-y-auto px-6">
          <div className="space-y-4 pb-4">
            {/* Sport Selection Grid - VYRIA Style */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Sport Principale</Label>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {SPORTS.filter((s) => s.id !== "gym").map((sport) => {
                  const Icon = sport.icon
                  return (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => setEditorSport(sport.id)}
                      className={cn(
                        "p-2 rounded-lg border-2 transition flex flex-col items-center gap-1",
                        editorSport === sport.id
                          ? "border-fuchsia-500 bg-fuchsia-500/20"
                          : "border-border bg-background hover:border-muted-foreground"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", sport.color)} />
                      <span className="text-[10px]">{sport.name}</span>
                      {sport.supportsPower && (
                        <span className="text-[8px] text-fuchsia-400 font-bold">PWR</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Config Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Parametro Zone</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant={editorZoneType === "power" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorZoneType("power")}
                    className={cn("flex-1 h-9", editorZoneType === "power" ? "bg-fuchsia-600" : "bg-transparent")}
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Potenza
                  </Button>
                  <Button
                    type="button"
                    variant={editorZoneType === "hr" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorZoneType("hr")}
                    className={cn("flex-1 h-9", editorZoneType === "hr" ? "bg-red-600" : "bg-transparent")}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    HR
                  </Button>
                </div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Nome Allenamento</Label>
                <Input
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="es. Soglia 2x20"
                  className="h-9 bg-background"
                />
              </div>
            </div>

            {/* Live Visual Block Chart Preview */}
            <div className="space-y-3 p-4 bg-background rounded-lg border border-border">
              {/* Stats Row - Style like statistics cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] mb-1">
                    <Clock className="h-3 w-3" />
                    <span>Durata</span>
                  </div>
                  <span className="font-bold text-sm">{getTotalDuration()} min</span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-500 text-[10px] mb-1">
                    <Zap className="h-3 w-3" />
                    <span>TSS</span>
                  </div>
                  <span className="font-bold text-sm text-orange-500">
                    {Math.round(calculateTotalTSS(editorBlocks, calculateBlockDuration))}
                  </span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-fuchsia-500 text-[10px] mb-1">
                    <Activity className="h-3 w-3" />
                    <span>Avg Power</span>
                  </div>
                  <span className="font-bold text-sm text-fuchsia-500">
                    {estimateAvgPower(editorBlocks, ftpWatts, calculateBlockDuration)}W
                  </span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-red-500 text-[10px] mb-1">
                    <Flame className="h-3 w-3" />
                    <span>kcal</span>
                  </div>
                  <span className="font-bold text-sm text-red-500">
                    {calculateKcal(estimateAvgPower(editorBlocks, ftpWatts, calculateBlockDuration), getTotalDuration())}
                  </span>
                </div>
                <div className="bg-muted/30 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-cyan-500 text-[10px] mb-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>IF</span>
                  </div>
                  <span className="font-bold text-sm text-cyan-500">
                    {editorBlocks.length > 0 
                      ? (Math.sqrt(calculateTotalTSS(editorBlocks, calculateBlockDuration) * 3600 / (getTotalDuration() * 60 * 100))).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Grafico Struttura</Label>
              </div>
              
              {/* Visual Block Chart */}
              <div className="h-16 flex gap-0.5 rounded overflow-hidden bg-muted/30">
                {editorBlocks.length > 0 ? (
                  editorBlocks.map((block, idx) => {
                    const bt = BLOCK_TYPES.find(b => b.id === block.type)
                    const duration = calculateBlockDuration(block)
                    const totalDur = getTotalDuration() || 1
                    const widthPercent = (duration / totalDur) * 100
                    const zoneHeights: Record<string, string> = {
                      Z1: "h-4", Z2: "h-6", Z3: "h-8", Z4: "h-10", Z5: "h-12", Z6: "h-14", Z7: "h-16"
                    }
                    
                    return (
                      <div
                        key={block.id}
                        className="flex items-end justify-center group relative cursor-pointer"
                        style={{ width: `${Math.max(widthPercent, 3)}%`, minWidth: '12px' }}
                        onClick={() => {
                          // Could open edit for this block
                        }}
                      >
                        <div 
                          className={cn(
                            "w-full rounded-t transition-all flex items-center justify-center",
                            zoneHeights[block.zone] || "h-6",
                            bt?.color || ZONE_COLORS[block.zone] || "bg-green-500"
                          )}
                        >
                          <span className="text-[9px] text-white font-bold drop-shadow">{block.zone}</span>
                        </div>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-[10px] p-1.5 rounded shadow-lg whitespace-nowrap z-20 border">
                          <p className="font-medium">{bt?.name || block.type}</p>
                          <p>{duration} min @ {block.zone}</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Aggiungi blocchi per vedere l'anteprima
                  </div>
                )}
              </div>
              {editorBlocks.length > 0 && (
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 min</span>
                  <span>{getTotalDuration()} min</span>
                </div>
              )}
            </div>

            {/* Block Type Buttons */}
            <div>
              <Label className="text-xs mb-2 block">Aggiungi Blocco</Label>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map((bt) => (
                  <Button key={bt.id} variant="outline" size="sm" onClick={() => addBlock(bt)} className="h-8 bg-transparent">
                    <div className={`w-3 h-3 rounded-full ${bt.color} mr-2`} />
                    {bt.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Blocks List */}
            {editorBlocks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    Blocchi ({editorBlocks.length}) - Durata totale: {getTotalDuration()} min
                  </Label>
                </div>
                <div className="space-y-2">
                  {editorBlocks.map((block, idx) => {
                    const bt = blockType(block.type)
                    const hasIntervals = bt?.hasIntervals || block.numIntervals
                    return (
                      <div key={block.id} className="p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-4 h-4 rounded ${bt?.color || "bg-gray-500"}`} />
                          <span className="font-medium text-sm flex-1">{bt?.name || block.type}</span>
                          <span className="text-xs text-muted-foreground">{calculateBlockDuration(block)} min</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveBlock(block.id, "up")}
                              disabled={idx === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveBlock(block.id, "down")}
                              disabled={idx === editorBlocks.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={() => removeBlock(block.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {!hasIntervals && (
                            <div>
                              <Label className="text-[10px]">Durata (min)</Label>
                              <Input
                                type="number"
                                value={block.duration}
                                onChange={(e) =>
                                  updateBlock(block.id, { duration: Number.parseInt(e.target.value) || 0 })
                                }
                                className="h-7 text-xs"
                              />
                            </div>
                          )}
                          <div>
                            <Label className="text-[10px]">Zona</Label>
                            <Select value={block.zone} onValueChange={(v) => updateBlock(block.id, { zone: v })}>
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ZONES.map((z) => (
                                  <SelectItem key={z} value={z}>
                                    {z}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {hasIntervals && (
                            <>
                              <div>
                                <Label className="text-[10px]">Ripetute</Label>
                                <Input
                                  type="number"
                                  value={block.numIntervals || 4}
                                  onChange={(e) =>
                                    updateBlock(block.id, { numIntervals: Number.parseInt(e.target.value) || 1 })
                                  }
                                  className="h-7 text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px]">Durata</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={block.intervalDuration || 3}
                                    onChange={(e) =>
                                      updateBlock(block.id, { intervalDuration: Number.parseInt(e.target.value) || 1 })
                                    }
                                    className="h-7 text-xs w-14"
                                  />
                                  <Select
                                    value={block.intervalDurationUnit || "min"}
                                    onValueChange={(v) =>
                                      updateBlock(block.id, { intervalDurationUnit: v as "min" | "sec" })
                                    }
                                  >
                                    <SelectTrigger className="h-7 text-xs w-16">
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
                                <Label className="text-[10px]">Rec (min)</Label>
                                <Input
                                  type="number"
                                  value={block.restBetweenIntervals || 2}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      restBetweenIntervals: Number.parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="h-7 text-xs"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-xs">Note</Label>
              <Textarea
                value={editorNotes}
                onChange={(e) => setEditorNotes(e.target.value)}
                placeholder="Note aggiuntive..."
                className="h-16 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="flex gap-2 justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {editorBlocks.length > 0
                ? `${editorBlocks.length} blocchi - ${getTotalDuration()} min totali`
                : "Nessun blocco"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetEditor}>
                Annulla
              </Button>
              <Button
                onClick={saveEditorWorkout}
                className="bg-fuchsia-600 hover:bg-fuchsia-700"
                disabled={editorBlocks.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Salva Allenamento
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-fuchsia-500" />
            VYRIA Training System
          </h2>
          <p className="text-muted-foreground">Pianificazione e periodizzazione per {userName || "Atleta"}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="zones" className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Zone</span>
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Builder</span>
          </TabsTrigger>
          <TabsTrigger value="gym" className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Palestra</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Biblioteca</span>
          </TabsTrigger>
          <TabsTrigger value="annual" className="flex items-center gap-1">
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">Piano Annuale</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Impostazioni</span>
          </TabsTrigger>
        </TabsList>
        {/* TAB: ZONE */}
        <TabsContent value="zones" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-fuchsia-500" />
                  Parametri Fisiologici
                </CardTitle>
                <CardDescription>Inserisci i tuoi valori per calcolare le zone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="flex justify-between">
                      <span>FC Massima</span>
                      <span className="text-fuchsia-500 font-bold">{hrMax} bpm</span>
                    </Label>
                    <Slider
                      value={[hrMax]}
                      onValueChange={([v]) => setHrMax(v)}
                      min={150}
                      max={220}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="flex justify-between">
                      <span>FC Soglia (LTHR)</span>
                      <span className="text-fuchsia-500 font-bold">{hrThreshold} bpm</span>
                    </Label>
                    <Slider
                      value={[hrThreshold]}
                      onValueChange={([v]) => setHrThreshold(v)}
                      min={120}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="flex justify-between">
                      <span>FC Riposo</span>
                      <span className="text-fuchsia-500 font-bold">{hrRest} bpm</span>
                    </Label>
                    <Slider
                      value={[hrRest]}
                      onValueChange={([v]) => setHrRest(v)}
                      min={35}
                      max={80}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <Label className="flex justify-between">
                      <span>FTP (Potenza Soglia)</span>
                      <span className="text-fuchsia-500 font-bold">{ftpWatts} W</span>
                    </Label>
                    <Slider
                      value={[ftpWatts]}
                      onValueChange={([v]) => setFtpWatts(v)}
                      min={100}
                      max={450}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={calculateZones} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Calcola Zone
                  </Button>
                  {zonesCalculated && (
                    <Button onClick={saveZones} disabled={saving} variant="outline">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Zone Frequenza Cardiaca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hrZones ? (
                    renderZoneBar(hrZones, "hr")
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Calcola le zone per visualizzarle</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Zone Potenza (Coggan)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {powerZones ? (
                    renderZoneBar(powerZones, "power")
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Calcola le zone per visualizzarle</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* TAB: BUILDER - Crea allenamenti singoli */}
        <TabsContent value="builder" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-fuchsia-500" />
                Workout Builder
              </CardTitle>
              <CardDescription>
                Crea allenamenti personalizzati multisport e salvali nel calendario
              </CardDescription>
            </CardHeader>
            <CardContent>
{/* Date Selector */}
  <div className="mb-6 space-y-3">
  <Label className="text-sm font-medium">Seleziona Data</Label>
  <div className="flex items-center gap-4 flex-wrap">
    <div className="flex items-center gap-2">
      <CalendarRange className="h-4 w-4 text-muted-foreground" />
      <input
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={(e) => {
          const newDate = new Date(e.target.value)
          setSelectedDate(newDate)
          const dayOfWeek = newDate.getDay()
          setSelectedDay(dayOfWeek === 0 ? 6 : dayOfWeek - 1)
        }}
        className="bg-background border border-border rounded px-3 py-2 text-sm"
      />
    </div>
    <Badge variant="outline" className="text-sm py-1.5 px-3">
      {DAY_NAMES[selectedDay]} {selectedDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
    </Badge>
  </div>
  {/* Quick day buttons */}
  <div className="flex gap-2 flex-wrap">
  {DAY_NAMES.map((day, idx) => {
    // Calculate the actual date for this day of the current week
    const today = new Date()
    const currentDayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
    const diff = idx - currentDayOfWeek
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + diff)
    
    return (
      <Button
        key={day}
        variant={selectedDay === idx ? "default" : "outline"}
        size="sm"
        onClick={() => {
          setSelectedDay(idx)
          setSelectedDate(targetDate)
        }}
        className={selectedDay === idx ? "bg-fuchsia-600 hover:bg-fuchsia-700" : "bg-transparent"}
      >
        {day.slice(0, 3)}
      </Button>
    )
  })}
  </div>
  </div>
              
              {/* Show inline editor or button to create */}
              {showInlineEditor ? (
                renderInlineEditor()
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Crea Nuovo Allenamento</h3>
                  <p className="text-muted-foreground mb-4">
                    Seleziona il giorno e crea un allenamento personalizzato per {DAY_NAMES[selectedDay]}
                  </p>
                  <Button 
                    onClick={() => setShowInlineEditor(true)}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Crea Allenamento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Show created workouts for this week */}
          {generatedPlan.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-fuchsia-500" />
                  Allenamenti Creati ({generatedPlan.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {generatedPlan.map((session) => {
                    const sportInfo = SPORTS.find(s => s.id === session.sport)
                    const SportIcon = sportInfo?.icon || Activity
                    return (
                      <div 
                        key={session.sessionId} 
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
                        onClick={() => {
                          // Load session into editor
                          setSelectedDay(session.dayIndex)
                          setEditorSport(session.sport)
                          setEditorTitle(session.title)
                          setEditorNotes(session.description)
                          setEditorBlocks(session.blocks || [])
                          setShowInlineEditor(true)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${ZONE_COLORS[session.targetZone] || 'bg-blue-500'}`}>
                            <SportIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{session.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {DAY_NAMES[session.dayIndex]} - {session.duration}min - {session.targetZone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{session.tss || 0} TSS</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSessionToDelete(session.sessionId)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Save to Calendar button */}
                <Button 
                  className="w-full mt-4 bg-fuchsia-600 hover:bg-fuchsia-700"
                  onClick={saveWeekToTraining}
                  disabled={saving || generatedPlan.length === 0}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salva nel Calendario
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* TAB: PALESTRA */}
        <TabsContent value="gym" className="space-y-6 mt-6">
          <GymExerciseLibrary
            onSaveWorkout={handleGymWorkoutSave}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            dayNames={DAY_NAMES}
          />
        </TabsContent>
        {/* TAB: BIBLIOTECA */}
        <TabsContent value="library" className="space-y-6 mt-6">
          <WorkoutLibrary
            athleteId={athleteData?.id || ""}
            onSelectWorkout={(workout) => {
              if (workout) {
                addWorkoutToDay(selectedDay, {
                  sport: workout.sport,
                  workoutType: workout.workout_type,
                  title: workout.name,
                  description: workout.description,
                  duration: workout.duration_minutes,
                  targetZone: workout.primary_zone,
                  blocks: workout.intervals?.blocks || [],
                  tss: workout.tss_estimate,
                })
              }
            }}
            selectedDay={selectedDay}
            dayNames={DAY_NAMES}
          />
        </TabsContent>
        {/* TAB: PIANO ANNUALE */}
        <TabsContent value="annual" className="space-y-6 mt-6">
          <AnnualPlanGenerator
            athleteData={athleteData}
            userName={userName}
            onPlanGenerated={(mesocycles) => console.log("Plan generated:", mesocycles)}
          />
        </TabsContent>
        {/* TAB: IMPOSTAZIONI */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Impostazioni VYRIA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sport Principale</Label>
                <Select value={athleteData?.primary_sport || "cycling"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((sport) => {
                      const SportIcon = sport.icon
                      return (
                        <SelectItem key={sport.id} value={sport.id}>
                          <div className="flex items-center gap-2">
                            <SportIcon className="h-4 w-4" />
                            {sport.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Label>Giorni di Riposo Preferiti</Label>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((day, idx) => (
                  <Button
                    key={idx}
                    variant={trainingPreferences.restDays.includes(idx) ? "default" : "outline"}
                    size="sm"
                    className={trainingPreferences.restDays.includes(idx) ? "bg-red-500 hover:bg-red-600" : ""}
                    onClick={() => {
                      setTrainingPreferences((prev) => {
                        const restDays = prev.restDays.includes(idx)
                          ? prev.restDays.filter((d) => d !== idx)
                          : [...prev.restDays, idx]
                        return { ...prev, restDays }
                      })
                    }}
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
              <div>
                <Label>Orario Allenamento Preferito</Label>
                <Select
                  value={trainingPreferences.preferredTime}
                  onValueChange={(v) => setTrainingPreferences({ ...trainingPreferences, preferredTime: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Mattina</SelectItem>
                    <SelectItem value="afternoon">Pomeriggio</SelectItem>
                    <SelectItem value="evening">Sera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Note Allenatore</Label>
                <Textarea
                  value={trainingPreferences.coachNotes}
                  onChange={(e) => setTrainingPreferences({ ...trainingPreferences, coachNotes: e.target.value })}
                  placeholder="Note per l'atleta..."
                  className="min-h-[100px]"
                />
              </div>
              <Button
                className="bg-fuchsia-600 hover:bg-fuchsia-700"
                onClick={async () => {
                  console.log("Saving training preferences:", trainingPreferences)
                  alert("Salvataggio preferenze da implementare!")
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Salva Preferenze
              </Button>
              <p className="text-sm text-muted-foreground">Altre impostazioni verranno aggiunte in futuro.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare allenamento?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione non può essere annullata.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToDelete && deleteSession(sessionToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Week Dialog */}
      <AlertDialog open={resetWeekDialogOpen} onOpenChange={setResetWeekDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset settimana?</AlertDialogTitle>
            <AlertDialogDescription>Tutti gli allenamenti della settimana verranno eliminati.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={resetWeek} className="bg-red-600 hover:bg-red-700">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Removed AdvancedWorkoutBuilder component rendering */}
      {/* <AdvancedWorkoutBuilder
        open={showWorkoutBuilder}
        onClose={() => setShowWorkoutBuilder(false)}
        onSave={handleAdvancedWorkoutSave}
        dayIndex={selectedDay}
        dayName={DAY_NAMES[selectedDay]}
        athleteWeight={athleteData?.weight_kg || 70}
      /> */}
    </div>
  )
}

export default VyriaTrainingPlan
