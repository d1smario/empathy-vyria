"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Printer, Dumbbell, Bike, CalendarIcon, Clock, Flame, Zap, Target, Activity, Flower2 } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { format } from "date-fns"
import { it } from "date-fns/locale"

// Types
interface TrainingActivity {
  id: string
  activity_date: string
  activity_type: string
  title: string
  description?: string
  duration_minutes?: number
  tss?: number
  target_zone?: string
  workout_type?: string
  intervals?: any
  parsedBlocks?: any[]
  planned?: boolean
  completed?: boolean
  parsedGymSession?: any
  parsedExercises?: any[]
}

interface GymExercise {
  id: string
  exercise: {
    id: string
    name: string
    equipment: string
    muscle_group: string[]
    image_url?: string
  }
  sets: number
  reps: number
  weight?: string
  rest_seconds: number
  tempo?: string
  notes?: string
}

interface DailyTrainingReportProps {
  athleteId: string
  athleteName?: string
}

// Muscle group labels
const MUSCLE_LABELS: Record<string, string> = {
  quadricipiti: "Quadricipiti",
  femorali: "Femorali",
  glutei: "Glutei",
  polpacci: "Polpacci",
  gambe: "Gambe",
  petto: "Petto",
  dorsali: "Dorsali",
  schiena: "Schiena",
  spalle: "Spalle",
  bicipiti: "Bicipiti",
  tricipiti: "Tricipiti",
  braccia: "Braccia",
  addominali: "Addominali",
  core: "Core",
  lombari: "Lombari",
}

// Stimulus info
const STIMULUS_INFO: Record<string, { label: string; color: string; description: string }> = {
  forza: { label: "Forza", color: "bg-red-500", description: "3-6 rep, 80-90% 1RM, 3-5 min rest" },
  forza_massima: { label: "Forza Massimale", color: "bg-red-700", description: "1-3 rep, 90-100% 1RM, 5+ min rest" },
  neuromuscolare: { label: "Neuromuscolare", color: "bg-purple-600", description: "3-5 rep esplosive, 70-80% 1RM" },
  ipertrofia: { label: "Ipertrofia", color: "bg-blue-600", description: "8-12 rep, 65-75% 1RM, 60-90s rest" },
  esplosivo: { label: "Esplosivo", color: "bg-orange-500", description: "3-6 rep veloci, 50-70% 1RM" },
  resistenza: { label: "Resistenza", color: "bg-green-600", description: "15-20+ rep, 50-65% 1RM" },
  mobilita: { label: "Mobilità", color: "bg-teal-500", description: "Movimenti controllati" },
  stretching: { label: "Stretching", color: "bg-cyan-500", description: "Allungamenti statici" },
}

// Exercise database for gym exercises with images
const EXERCISE_DATABASE: Record<string, { name: string; equipment: string; muscle_group: string[]; image: string }> = {
  squat: {
    name: "Squat",
    equipment: "bilanciere",
    muscle_group: ["quadricipiti", "glutei"],
    image: "/barbell-squat.png",
  },
  leg_press: {
    name: "Leg Press",
    equipment: "macchina",
    muscle_group: ["quadricipiti", "glutei"],
    image: "/leg-press-machine-exercise.jpg",
  },
  leg_extension: {
    name: "Leg Extension",
    equipment: "macchina",
    muscle_group: ["quadricipiti"],
    image: "/leg-extension-machine.jpg",
  },
  front_squat: {
    name: "Front Squat",
    equipment: "bilanciere",
    muscle_group: ["quadricipiti", "core"],
    image: "/front-squat-barbell.jpg",
  },
  goblet_squat: {
    name: "Goblet Squat",
    equipment: "kettlebell",
    muscle_group: ["quadricipiti", "core"],
    image: "/goblet-squat-kettlebell.jpg",
  },
  bulgarian_split: {
    name: "Bulgarian Split Squat",
    equipment: "manubri",
    muscle_group: ["quadricipiti", "glutei"],
    image: "/bulgarian-split-squat.jpg",
  },
  step_up: {
    name: "Step Up",
    equipment: "box",
    muscle_group: ["quadricipiti", "glutei"],
    image: "/step-up-box-exercise.jpg",
  },
  romanian_deadlift: {
    name: "Romanian Deadlift",
    equipment: "bilanciere",
    muscle_group: ["femorali", "glutei"],
    image: "/romanian-deadlift.jpg",
  },
  leg_curl: {
    name: "Leg Curl",
    equipment: "macchina",
    muscle_group: ["femorali"],
    image: "/leg-curl-machine.jpg",
  },
  stiff_deadlift: {
    name: "Stiff Leg Deadlift",
    equipment: "bilanciere",
    muscle_group: ["femorali", "glutei"],
    image: "/stiff-leg-deadlift.jpg",
  },
  good_morning: {
    name: "Good Morning",
    equipment: "bilanciere",
    muscle_group: ["femorali", "lombari"],
    image: "/good-morning-barbell.jpg",
  },
  nordic_curl: {
    name: "Nordic Curl",
    equipment: "corpo libero",
    muscle_group: ["femorali"],
    image: "/nordic-hamstring-curl.jpg",
  },
  hip_thrust: {
    name: "Hip Thrust",
    equipment: "bilanciere",
    muscle_group: ["glutei"],
    image: "/hip-thrust-barbell.jpg",
  },
  glute_bridge: {
    name: "Glute Bridge",
    equipment: "corpo libero",
    muscle_group: ["glutei"],
    image: "/glute-bridge-exercise.png",
  },
  cable_kickback: {
    name: "Cable Kickback",
    equipment: "cavo",
    muscle_group: ["glutei"],
    image: "/cable-glute-kickback.jpg",
  },
  calf_raise: {
    name: "Calf Raise",
    equipment: "macchina",
    muscle_group: ["polpacci"],
    image: "/calf-raise-machine.jpg",
  },
  seated_calf: {
    name: "Seated Calf Raise",
    equipment: "macchina",
    muscle_group: ["polpacci"],
    image: "/seated-calf-raise.jpg",
  },
  donkey_calf: {
    name: "Donkey Calf Raise",
    equipment: "macchina",
    muscle_group: ["polpacci"],
    image: "/donkey-calf-raise.jpg",
  },
  bench_press: {
    name: "Bench Press",
    equipment: "bilanciere",
    muscle_group: ["petto", "tricipiti"],
    image: "/barbell-bench-press.jpg",
  },
  incline_press: {
    name: "Incline Bench Press",
    equipment: "bilanciere",
    muscle_group: ["petto"],
    image: "/incline-bench-press.png",
  },
  dumbbell_fly: {
    name: "Dumbbell Fly",
    equipment: "manubri",
    muscle_group: ["petto"],
    image: "/dumbbell-chest-fly.jpg",
  },
  cable_crossover: {
    name: "Cable Crossover",
    equipment: "cavo",
    muscle_group: ["petto"],
    image: "/cable-crossover-chest.jpg",
  },
  push_up: {
    name: "Push Up",
    equipment: "corpo libero",
    muscle_group: ["petto", "tricipiti"],
    image: "/push-up-exercise.png",
  },
  pull_up: {
    name: "Pull Up",
    equipment: "sbarra",
    muscle_group: ["dorsali", "bicipiti"],
    image: "/pull-up-exercise.png",
  },
  lat_pulldown: {
    name: "Lat Pulldown",
    equipment: "cavo",
    muscle_group: ["dorsali"],
    image: "/lat-pulldown-machine.jpg",
  },
  barbell_row: {
    name: "Barbell Row",
    equipment: "bilanciere",
    muscle_group: ["dorsali", "bicipiti"],
    image: "/barbell-bent-over-row.jpg",
  },
  seated_row: { name: "Seated Row", equipment: "cavo", muscle_group: ["dorsali"], image: "/seated-cable-row.jpg" },
  deadlift: {
    name: "Deadlift",
    equipment: "bilanciere",
    muscle_group: ["dorsali", "glutei", "femorali"],
    image: "/barbell-deadlift.jpg",
  },
  shoulder_press: {
    name: "Shoulder Press",
    equipment: "bilanciere",
    muscle_group: ["spalle", "tricipiti"],
    image: "/overhead-shoulder-press.jpg",
  },
  lateral_raise: {
    name: "Lateral Raise",
    equipment: "manubri",
    muscle_group: ["spalle"],
    image: "/dumbbell-lateral-raise.jpg",
  },
  front_raise: {
    name: "Front Raise",
    equipment: "manubri",
    muscle_group: ["spalle"],
    image: "/dumbbell-front-raise.jpg",
  },
  face_pull: {
    name: "Face Pull",
    equipment: "cavo",
    muscle_group: ["spalle", "dorsali"],
    image: "/cable-face-pull.jpg",
  },
  rear_delt_fly: {
    name: "Rear Delt Fly",
    equipment: "manubri",
    muscle_group: ["spalle"],
    image: "/rear-delt-fly.jpg",
  },
  barbell_curl: {
    name: "Barbell Curl",
    equipment: "bilanciere",
    muscle_group: ["bicipiti"],
    image: "/barbell-bicep-curl.jpg",
  },
  dumbbell_curl: {
    name: "Dumbbell Curl",
    equipment: "manubri",
    muscle_group: ["bicipiti"],
    image: "/dumbbell-bicep-curl.jpg",
  },
  hammer_curl: {
    name: "Hammer Curl",
    equipment: "manubri",
    muscle_group: ["bicipiti"],
    image: "/hammer-curl-exercise.png",
  },
  preacher_curl: {
    name: "Preacher Curl",
    equipment: "bilanciere",
    muscle_group: ["bicipiti"],
    image: "/preacher-curl.jpg",
  },
  tricep_pushdown: {
    name: "Tricep Pushdown",
    equipment: "cavo",
    muscle_group: ["tricipiti"],
    image: "/tricep-cable-pushdown.jpg",
  },
  tricep_dip: {
    name: "Tricep Dip",
    equipment: "parallele",
    muscle_group: ["tricipiti", "petto"],
    image: "/placeholder.svg?height=120&width=120",
  },
  overhead_extension: {
    name: "Overhead Extension",
    equipment: "manubrio",
    muscle_group: ["tricipiti"],
    image: "/placeholder.svg?height=120&width=120",
  },
  skull_crusher: {
    name: "Skull Crusher",
    equipment: "bilanciere",
    muscle_group: ["tricipiti"],
    image: "/placeholder.svg?height=120&width=120",
  },
  plank: {
    name: "Plank",
    equipment: "corpo libero",
    muscle_group: ["core", "addominali"],
    image: "/placeholder.svg?height=120&width=120",
  },
  crunch: {
    name: "Crunch",
    equipment: "corpo libero",
    muscle_group: ["addominali"],
    image: "/placeholder.svg?height=120&width=120",
  },
  leg_raise: {
    name: "Leg Raise",
    equipment: "corpo libero",
    muscle_group: ["addominali"],
    image: "/placeholder.svg?height=120&width=120",
  },
  russian_twist: {
    name: "Russian Twist",
    equipment: "peso",
    muscle_group: ["addominali", "core"],
    image: "/placeholder.svg?height=120&width=120",
  },
  back_extension: {
    name: "Back Extension",
    equipment: "panca",
    muscle_group: ["lombari", "glutei"],
    image: "/placeholder.svg?height=120&width=120",
  },
  bird_dog: {
    name: "Bird Dog",
    equipment: "corpo libero",
    muscle_group: ["lombari", "core"],
    image: "/placeholder.svg?height=120&width=120",
  },
}

// Bike Blocks Chart component for power profile visualization
function BikeBlocksChart({ blocks }: { blocks: any[] }) {
  if (!blocks || blocks.length === 0) return null

  // Calculate total duration and create data for chart
  let currentTime = 0
  const chartData: { start: number; end: number; intensity: number; type: string; label: string }[] = []

  blocks.forEach((block) => {
    const durationSeconds = block.duration_seconds || block.duration || 0
    const intensity = block.intensity_percent || block.intensity || 50
    const repeatCount = block.repeat || block.reps || 1
    const restSeconds = block.rest_seconds || block.recoveryDuration || 0
    const restIntensity = block.rest_intensity_percent || block.recoveryIntensity || 50

    if (block.type === "interval" && repeatCount > 1) {
      // Intervals with repetitions
      for (let i = 0; i < repeatCount; i++) {
        // Work interval
        chartData.push({
          start: currentTime,
          end: currentTime + durationSeconds,
          intensity,
          type: "interval",
          label: block.name || `Interval ${i + 1}`,
        })
        currentTime += durationSeconds

        // Recovery between intervals (if not last rep)
        if (i < repeatCount - 1 && restSeconds > 0) {
          chartData.push({
            start: currentTime,
            end: currentTime + restSeconds,
            intensity: restIntensity,
            type: "recovery",
            label: "Recupero",
          })
          currentTime += restSeconds
        }
      }
    } else {
      chartData.push({
        start: currentTime,
        end: currentTime + durationSeconds,
        intensity,
        type: block.type,
        label: block.name || block.type,
      })
      currentTime += durationSeconds
    }
  })

  const totalDuration = currentTime
  const maxIntensity = 130 // Max FTP % to show full range

  // Color mapping
  const getColor = (type: string) => {
    switch (type) {
      case "warmup":
        return "#22c55e"
      case "interval":
        return "#ef4444"
      case "steady":
        return "#3b82f6"
      case "recovery":
        return "#a855f7"
      case "cooldown":
        return "#06b6d4"
      case "rest":
        return "#9ca3af"
      default:
        return "#6b7280"
    }
  }

  if (totalDuration === 0) {
    return (
      <div className="w-full p-4 bg-muted/30 rounded-lg border text-center text-muted-foreground">
        Nessun blocco di allenamento configurato
      </div>
    )
  }

  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Profilo Potenza</h4>
      <div className="relative h-48 bg-muted/30 rounded-lg border overflow-hidden">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between py-2 text-[10px] text-muted-foreground bg-background/50 z-10">
          <span className="px-1">130%</span>
          <span className="px-1">100%</span>
          <span className="px-1">70%</span>
          <span className="px-1">40%</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative pb-6">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-b border-muted/40" style={{ height: "25%" }} />
            ))}
          </div>

          {/* FTP 100% reference line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-orange-500 z-10"
            style={{ top: `${((maxIntensity - 100) / maxIntensity) * 100}%` }}
          >
            <span className="absolute right-1 -top-3 text-[9px] text-orange-500 font-medium">FTP</span>
          </div>

          {/* Blocks */}
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${totalDuration} ${maxIntensity}`}>
            {chartData.map((block, idx) => {
              const x = block.start
              const width = block.end - block.start
              const height = block.intensity
              const y = maxIntensity - height

              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(width, totalDuration * 0.005)}
                    height={height}
                    fill={getColor(block.type)}
                    opacity={0.9}
                  />
                  {/* Add subtle border for each block */}
                  <rect
                    x={x}
                    y={y}
                    width={Math.max(width, totalDuration * 0.005)}
                    height={height}
                    fill="none"
                    stroke={getColor(block.type)}
                    strokeWidth={totalDuration * 0.001}
                    opacity={0.5}
                  />
                </g>
              )
            })}
          </svg>
        </div>

        {/* X-axis (time) */}
        <div className="absolute bottom-0 left-12 right-0 h-6 flex justify-between items-center px-2 text-[10px] text-muted-foreground bg-background/80 border-t">
          <span>0'</span>
          <span>{Math.round(totalDuration / 60 / 4)}'</span>
          <span>{Math.round(totalDuration / 60 / 2)}'</span>
          <span>{Math.round((totalDuration / 60 / 4) * 3)}'</span>
          <span>{Math.round(totalDuration / 60)}'</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs">
        {[
          { type: "warmup", label: "Warmup" },
          { type: "steady", label: "Steady State" },
          { type: "interval", label: "Interval" },
          { type: "recovery", label: "Recovery" },
          { type: "cooldown", label: "Cooldown" },
        ].map((item) => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: getColor(item.type) }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DailyTrainingReport({ athleteId, athleteName }: DailyTrainingReportProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [bikeWorkout, setBikeWorkout] = useState<TrainingActivity | null>(null)
  const [gymWorkout, setGymWorkout] = useState<TrainingActivity | null>(null)
  const [lifestyleWorkout, setLifestyleWorkout] = useState<TrainingActivity | null>(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Load workouts for selected date
  useEffect(() => {
    const loadWorkouts = async () => {
      if (!athleteId) return
      setLoading(true)

      const dateStr = format(selectedDate, "yyyy-MM-dd")

      console.log("[v0] DailyTrainingReport loading workouts for:", dateStr, "athlete:", athleteId)

      try {
        const { data, error } = await supabase
          .from("training_activities")
          .select("*")
          .eq("athlete_id", athleteId)
          .eq("activity_date", dateStr)

        if (error) {
          console.error("[v0] Error loading workouts:", error)
        } else if (data) {
          console.log("[v0] Loaded workouts:", data)

          const bike = data.find((w: any) => w.activity_type === "cycling" || w.activity_type === "bike")
          const gym = data.find((w: any) => w.activity_type === "gym" || w.activity_type === "strength")
          const lifestyle = data.find((w: any) => w.sport === "lifestyle")

          if (gym && gym.intervals) {
            try {
              const parsed = typeof gym.intervals === "string" ? JSON.parse(gym.intervals) : gym.intervals
              console.log("[v0] Parsed gym intervals:", parsed)
              gym.parsedGymSession = parsed.gym_session || parsed
              gym.parsedExercises = parsed.gymExercises || parsed.exercises || parsed.gym_session?.exercises || []
            } catch (e) {
              console.error("[v0] Error parsing gym intervals:", e)
            }
          }

          if (bike && bike.intervals) {
            try {
              const parsed = typeof bike.intervals === "string" ? JSON.parse(bike.intervals) : bike.intervals
              console.log("[v0] Parsed bike intervals:", parsed)
              bike.parsedBlocks = Array.isArray(parsed) ? parsed : parsed.blocks || []
            } catch (e) {
              console.error("[v0] Error parsing bike intervals:", e)
            }
          }

          if (lifestyle && lifestyle.workout_data) {
            try {
              const parsed = typeof lifestyle.workout_data === "string" ? JSON.parse(lifestyle.workout_data) : lifestyle.workout_data
              lifestyle.parsedLifestyleActivities = parsed.activities || []
              lifestyle.lifestyleCategory = parsed.category || "yoga"
              lifestyle.lifestyleSessionName = parsed.sessionName || lifestyle.title || "Sessione Lifestyle"
            } catch (e) {
              console.error("Error parsing lifestyle workout_data:", e)
            }
          }

          setBikeWorkout(bike || null)
          setGymWorkout(gym || null)
          setLifestyleWorkout(lifestyle || null)
        }
      } catch (err) {
        console.error("[v0] Exception loading workouts:", err)
      }

      setLoading(false)
    }

    loadWorkouts()
  }, [athleteId, selectedDate])

  const handlePrint = () => {
    window.print()
  }

  const bikeBlocks = bikeWorkout?.parsedBlocks || []

  const rawGymExercises = gymWorkout?.parsedExercises || []
  const gymExercises = rawGymExercises.map((ex: any) => {
    // Map to expected structure for rendering
    return {
      ...ex,
      exercise: {
        id: ex.id,
        name: ex.nameIt || ex.name || "Esercizio",
        equipment: ex.equipment || "corpo libero",
        image_url:
          ex.gifUrl || `/placeholder.svg?height=120&width=120&query=${encodeURIComponent(ex.name || "exercise")}`,
        muscle_group: ex.secondaryMuscles || [ex.target] || [],
        target: ex.target,
        instructions: ex.instructions || [],
      },
      sets: ex.sets || 3,
      reps: ex.reps || 10,
      weight: ex.weight || 0,
      rest_seconds: ex.restSeconds || 60,
      notes: ex.notes || "",
    }
  })

  const gymSettings = gymWorkout?.parsedGymSession?.gym_settings || {}

  const stimulusInfo = STIMULUS_INFO[gymSettings.stimulus_type] || STIMULUS_INFO.forza

  const lifestyleActivities = lifestyleWorkout?.parsedLifestyleActivities || []

  const hasWorkouts = bikeWorkout || gymWorkout || lifestyleWorkout

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold">Report Allenamento Giornaliero</h2>
          <p className="text-sm text-muted-foreground">Sessione bike e scheda palestra per {athleteName || "Atleta"}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedDate, "d MMMM yyyy", { locale: it })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={it}
              />
            </PopoverContent>
          </Popover>

          <Button variant="default" onClick={handlePrint} disabled={!hasWorkouts}>
            <Printer className="h-4 w-4 mr-2" />
            Stampa PDF
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* No Workouts */}
      {!loading && !hasWorkouts && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Activity className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Nessun allenamento</h3>
          <p className="text-muted-foreground">
            Non ci sono allenamenti pianificati per {format(selectedDate, "d MMMM yyyy", { locale: it })}
          </p>
        </div>
      )}

      {/* Printable Report */}
      {!loading && hasWorkouts && (
        <div
          ref={printRef}
          className="bg-white dark:bg-zinc-950 text-black dark:text-white p-6 rounded-xl shadow-lg print:shadow-none print:rounded-none"
        >
          {/* Report Header */}
          <header className="border-b-4 border-violet-600 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">
                  Training Report <span className="text-violet-600">EMPATHY</span>
                </h1>
                <p className="text-lg font-medium mt-1">{athleteName || "Atleta"}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{format(selectedDate, "d MMMM", { locale: it })}</p>
                <p className="text-muted-foreground">{format(selectedDate, "EEEE yyyy", { locale: it })}</p>
              </div>
            </div>
          </header>

          {/* Summary Row */}
          <div className="grid grid-cols-4 gap-4 mb-8 p-4 bg-muted/50 dark:bg-zinc-900 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Sessioni</div>
              <div className="text-2xl font-bold text-violet-600">{(bikeWorkout ? 1 : 0) + (gymWorkout ? 1 : 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Durata Totale</div>
              <div className="text-2xl font-bold text-violet-600">
                {(bikeWorkout?.duration_minutes || 0) + (gymWorkout?.duration_minutes || 0)}'
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">TSS Bike</div>
              <div className="text-2xl font-bold text-orange-500">{bikeWorkout?.tss || "—"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase">Esercizi Gym</div>
              <div className="text-2xl font-bold text-fuchsia-500">{gymExercises.length || "—"}</div>
            </div>
          </div>

          {/* BIKE SESSION */}
          {bikeWorkout && (
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Sessione Bike</h2>
                  <p className="text-sm text-muted-foreground">{bikeWorkout.title}</p>
                </div>
              </div>

              {/* Bike Meta */}
              <div className="grid grid-cols-5 gap-3 mb-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <div className="text-center">
                  <Clock className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                  <div className="text-xs text-muted-foreground">Durata</div>
                  <div className="font-bold">{bikeWorkout.duration_minutes}'</div>
                </div>
                <div className="text-center">
                  <Flame className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                  <div className="text-xs text-muted-foreground">TSS</div>
                  <div className="font-bold">{bikeWorkout.tss || "—"}</div>
                </div>
                <div className="text-center">
                  <Zap className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                  <div className="text-xs text-muted-foreground">Zona Target</div>
                  <div className="font-bold">{bikeWorkout.target_zone || "—"}</div>
                </div>
                <div className="text-center">
                  <Target className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                  <div className="text-xs text-muted-foreground">Tipo</div>
                  <div className="font-bold capitalize">{bikeWorkout.workout_type || "—"}</div>
                </div>
                <div className="text-center">
                  <Activity className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                  <div className="text-xs text-muted-foreground">Stato</div>
                  <div className="font-bold">{bikeWorkout.completed ? "✓ Fatto" : "Pianificato"}</div>
                </div>
              </div>

              {/* Bike Blocks Chart */}
              {bikeBlocks.length > 0 && (
                <div className="mb-6">
                  <BikeBlocksChart blocks={bikeBlocks} />
                </div>
              )}

              {/* Bike Blocks List */}
              {bikeBlocks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">Struttura Workout</h4>
                  <div className="grid gap-2">
                    {bikeBlocks.map((block: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border-l-4"
                        style={{
                          borderLeftColor:
                            block.type === "warmup"
                              ? "#22c55e"
                              : block.type === "interval"
                                ? "#ef4444"
                                : block.type === "steady"
                                  ? "#3b82f6"
                                  : block.type === "recovery"
                                    ? "#a855f7"
                                    : block.type === "cooldown"
                                      ? "#06b6d4"
                                      : "#6b7280",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {block.type}
                          </Badge>
                          <span className="font-medium">{Math.round((block.duration_seconds || 0) / 60)}'</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-orange-600">
                            {block.intensity_percent || block.intensity || 50}%
                          </span>
                          <span className="text-muted-foreground ml-1">FTP</span>
                          {block.type === "interval" && block.repeat && (
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({block.repeat}x, rec {Math.round((block.rest_seconds || 0) / 60)}')
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {bikeWorkout.description && (
                <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <p className="text-sm">{bikeWorkout.description}</p>
                </div>
              )}
            </section>
          )}

          {bikeWorkout && gymWorkout && <Separator className="my-8" />}

          {/* GYM SESSION */}
          {gymWorkout && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-full bg-fuchsia-500 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Scheda Palestra</h2>
                  <p className="text-sm text-muted-foreground">{gymWorkout.title}</p>
                </div>
              </div>

              {/* Gym Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {gymSettings.stimulus_type && (
                  <Badge className={`${stimulusInfo.color} text-white`}>{stimulusInfo.label}</Badge>
                )}
                {gymSettings.muscle_groups?.map((m: string) => (
                  <Badge key={m} variant="outline" className="border-fuchsia-500 text-fuchsia-600">
                    {MUSCLE_LABELS[m] || m}
                  </Badge>
                ))}
              </div>

              {/* Exercises Grid */}
              {gymExercises.length > 0 ? (
                <div className="grid gap-4">
                  {gymExercises.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="flex items-stretch border rounded-xl overflow-hidden bg-card shadow-sm"
                    >
                      {/* Number */}
                      <div className="flex items-center justify-center w-14 bg-gradient-to-b from-fuchsia-500 to-fuchsia-600 text-white text-2xl font-bold">
                        {idx + 1}
                      </div>

                      {/* Image */}
                      <div className="w-28 h-28 flex-shrink-0 bg-muted relative overflow-hidden">
                        <img
                          src={item.exercise?.image_url || "/placeholder.svg"}
                          alt={item.exercise?.name || "Esercizio"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              `/placeholder.svg?height=120&width=120&query=gym exercise`
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{item.exercise?.name || "Esercizio"}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {item.exercise?.equipment || "attrezzatura"}
                            </p>
                          </div>
                        </div>

                        {/* Muscles */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(item.exercise?.muscle_group || []).slice(0, 4).map((m: string) => (
                            <Badge key={m} variant="secondary" className="text-[10px] px-2 py-0">
                              {MUSCLE_LABELS[m] || m}
                            </Badge>
                          ))}
                        </div>

                        {/* Params Grid */}
                        <div className="grid grid-cols-4 gap-3">
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Serie</div>
                            <div className="text-xl font-black text-fuchsia-600">{item.sets || 3}</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Rep</div>
                            <div className="text-xl font-black text-fuchsia-600">{item.reps || 10}</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Carico</div>
                            <div className="text-xl font-black text-orange-500">{item.weight || "—"}</div>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Rest</div>
                            <div className="text-xl font-black">{item.rest_seconds || 90}s</div>
                          </div>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic mt-3 pt-2 border-t border-dashed">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessun esercizio configurato per questa sessione</p>
                  <p className="text-sm mt-1">Vai al Gym Workout Builder per aggiungere esercizi</p>
                </div>
              )}

              {/* Stimulus Guidelines */}
              {gymSettings.stimulus_type && (
                <div className="mt-6 p-4 bg-fuchsia-50 dark:bg-fuchsia-950/30 rounded-lg border-l-4 border-fuchsia-600">
                  <h4 className="text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-400 mb-1">
                    Linee Guida - {stimulusInfo.label}
                  </h4>
                  <p className="text-sm text-muted-foreground">{stimulusInfo.description}</p>
                </div>
              )}
            </section>
          )}

          {/* LIFESTYLE SECTION */}
          {lifestyleWorkout && (
            <section className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <Flower2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {lifestyleWorkout.lifestyleSessionName || lifestyleWorkout.title || "Sessione Lifestyle"}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {lifestyleWorkout.lifestyleCategory || "Benessere"} - {lifestyleWorkout.duration_minutes || 0} minuti
                  </p>
                </div>
              </div>

              {lifestyleActivities.length > 0 ? (
                <div className="space-y-4">
                  {lifestyleActivities.map((activity: any, idx: number) => (
                    <div
                      key={activity.id || idx}
                      className="flex items-stretch border rounded-xl overflow-hidden bg-card shadow-sm"
                    >
                      {/* Number */}
                      <div className="flex items-center justify-center w-14 bg-gradient-to-b from-purple-500 to-purple-600 text-white text-2xl font-bold">
                        {idx + 1}
                      </div>

                      {/* Image */}
                      <div className="w-28 h-28 flex-shrink-0 bg-muted relative overflow-hidden">
                        <img
                          src={activity.imageUrl || "/placeholder.svg"}
                          alt={activity.nameIt || activity.name || "Attivita"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              `/placeholder.svg?height=120&width=120&query=lifestyle wellness`
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-lg">{activity.nameIt || activity.name || "Attivita"}</h4>
                            <p className="text-sm text-muted-foreground">
                              {activity.duration} minuti - {activity.difficulty === "beginner" ? "Principiante" : activity.difficulty === "intermediate" ? "Intermedio" : "Avanzato"}
                            </p>
                          </div>
                        </div>

                        {/* Benefits */}
                        {activity.benefits && activity.benefits.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {activity.benefits.slice(0, 4).map((b: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0">
                                {b}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Instructions preview */}
                        {activity.instructions && activity.instructions.length > 0 && (
                          <p className="text-xs text-muted-foreground italic line-clamp-2">
                            {activity.instructions[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                  <Flower2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessuna attivita configurata per questa sessione</p>
                </div>
              )}
            </section>
          )}

          {/* Footer */}
          <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>EMPATHY Training System - Report generato il {format(new Date(), "d/M/yyyy HH:mm")}</p>
          </footer>
        </div>
      )}
    </div>
  )
}

export default DailyTrainingReport
