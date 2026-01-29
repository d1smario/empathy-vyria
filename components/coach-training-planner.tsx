"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"
import * as XLSX from "xlsx"
import JSZip from "jszip"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Activity,
  Zap,
  Bike,
  Dumbbell,
  Heart,
  Loader2,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  GripVertical,
  Mountain,
  Waves,
  Footprints,
  Users,
  ChevronLeft,
  Send,
  Upload,
  Save,
  Settings,
  Pencil,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Types
interface LinkedAthlete {
  id: string
  status: string
  athlete: Athlete | null
}

type Athlete = {
  id: string | null
  user_id: string
  primary_sport: string | null
  weight_kg: number | null
  metabolic_profiles: Array<{
    ftp_watts: number | null
    vo2max: number | null
    hr_max: number | null
    hr_lt2: number | null
    hr_rest: number | null
    is_current: boolean
  }>
  user?: {
    id: string
    full_name: string
    email: string
  }
}

interface CoachTrainingPlannerProps {
  coachId: string
  linkedAthletes: LinkedAthlete[]
}

// Sport types
const SPORT_TYPES = {
  cycling: { label: "Ciclismo", icon: Bike, color: "text-blue-400", supportsPower: true },
  running: { label: "Corsa", icon: Footprints, color: "text-green-400", supportsPower: false },
  swimming: { label: "Nuoto", icon: Waves, color: "text-cyan-400", supportsPower: false },
  triathlon: { label: "Triathlon", icon: Activity, color: "text-purple-400", supportsPower: true },
  trail: { label: "Trail Running", icon: Mountain, color: "text-orange-400", supportsPower: false },
  mtb: { label: "MTB", icon: Bike, color: "text-amber-400", supportsPower: true },
  gym: { label: "Palestra", icon: Dumbbell, color: "text-red-400", supportsPower: false },
} as const

// Block types
const ADVANCED_BLOCK_TYPES = {
  warmup: { label: "Riscaldamento", icon: "↑" },
  constant: { label: "Blocco Costante", icon: "▬" },
  increment: { label: "Incremento Power", icon: "↗" },
  intervals_2: { label: "Intervalli 2 Intensità", icon: "⟷" },
  intervals_3: { label: "Intervalli 3 Intensità", icon: "⋯" },
  decrement: { label: "Decremento Power", icon: "↘" },
  cooldown: { label: "Defaticamento", icon: "↓" },
} as const

type AdvancedBlockType = keyof typeof ADVANCED_BLOCK_TYPES
type ZoneType = "hr" | "power"

interface AdvancedWorkoutBlock {
  id: string
  blockType: AdvancedBlockType
  sport: string
  zoneType: ZoneType
  totalDuration: number
  intervalDuration?: number
  numIntervals?: number
  primaryZone: string
  secondaryZone?: string
  tertiaryZone?: string
  description: string
  restBetweenIntervals?: number
}

interface GymExercise {
  id: string
  name: string
  category: "strength" | "core" | "flexibility" | "plyometric"
  sets: number
  reps: number
  weight?: number
  restBetweenSets: number
}

interface TrainingSession {
  day: number
  dayName: string
  sport: string
  duration: number
  description: string
  zoneType: ZoneType
  advancedBlocks: AdvancedWorkoutBlock[]
  gymExercises: GymExercise[]
}

// HR Zone calculation
function calculateHRZones(hrMax: number, hrThreshold: number, hrRest: number, weight = 70) {
  // Calculate estimated VO2 for each zone based on HR (Swain equation approximation)
  // VO2% ≈ 1.5 * HR% - 50 (simplified)
  const estimateVO2AtHR = (hr: number) => {
    const hrPercent = (hr / hrMax) * 100
    return Math.max(20, 1.5 * hrPercent - 50) // ml/kg/min approximation
  }

  // Estimate substrate oxidation based on intensity
  // At low intensity: ~70% fat, ~30% CHO
  // At threshold: ~50% fat, ~50% CHO
  // Above threshold: ~20% fat, ~80% CHO
  const calculateSubstrates = (hrMin: number, hrMax: number) => {
    const avgHR = (hrMin + hrMax) / 2
    const intensity = avgHR / hrThreshold // relative to threshold

    // Energy expenditure estimation (kcal/h)
    const vo2 = estimateVO2AtHR(avgHR) // ml/kg/min
    const kcalPerMin = vo2 * weight * 0.005 // approximate kcal/min
    const kcalH = Math.round(kcalPerMin * 60)

    // Fat and CHO percentages based on intensity
    let fatPercent: number
    let choPercent: number

    if (intensity < 0.7) {
      // Z1 - Recovery
      fatPercent = 70
      choPercent = 28
    } else if (intensity < 0.85) {
      // Z2 - Endurance
      fatPercent = 60
      choPercent = 38
    } else if (intensity < 0.95) {
      // Z3 - Tempo
      fatPercent = 45
      choPercent = 53
    } else if (intensity < 1.05) {
      // Z4 - Threshold
      fatPercent = 30
      choPercent = 68
    } else {
      // Z5 - VO2max
      fatPercent = 15
      choPercent = 83
    }

    const proPercent = 100 - fatPercent - choPercent

    // Convert to g/h
    const fatGH = Math.round((kcalH * (fatPercent / 100)) / 9) // 9 kcal/g fat
    const choGH = Math.round((kcalH * (choPercent / 100)) / 4) // 4 kcal/g CHO
    const proGH = Math.round((kcalH * (proPercent / 100)) / 4) // 4 kcal/g protein

    return {
      substrates: { cho: choPercent, fat: fatPercent, pro: proPercent },
      consumption: { choGH, fatGH, proGH, kcalH },
    }
  }

  const z1Min = Math.round(hrRest + (hrThreshold - hrRest) * 0.5)
  const z1Max = Math.round(hrThreshold * 0.81)
  const z2Min = Math.round(hrThreshold * 0.81)
  const z2Max = Math.round(hrThreshold * 0.89)
  const z3Min = Math.round(hrThreshold * 0.89)
  const z3Max = Math.round(hrThreshold * 0.95)
  const z4Min = Math.round(hrThreshold * 0.95)
  const z4Max = Math.round(hrThreshold * 1.05)
  const z5Min = Math.round(hrThreshold * 1.05)
  const z5Max = hrMax

  return {
    z1: {
      name: "Z1 Recupero",
      min: z1Min,
      max: z1Max,
      color: "#22c55e",
      ...calculateSubstrates(z1Min, z1Max),
    },
    z2: {
      name: "Z2 Endurance",
      min: z2Min,
      max: z2Max,
      color: "#3b82f6",
      ...calculateSubstrates(z2Min, z2Max),
    },
    z3: {
      name: "Z3 Tempo",
      min: z3Min,
      max: z3Max,
      color: "#eab308",
      ...calculateSubstrates(z3Min, z3Max),
    },
    z4: {
      name: "Z4 Soglia",
      min: z4Min,
      max: z4Max,
      color: "#f97316",
      ...calculateSubstrates(z4Min, z4Max),
    },
    z5: {
      name: "Z5 VO2max",
      min: z5Min,
      max: z5Max,
      color: "#ef4444",
      ...calculateSubstrates(z5Min, z5Max),
    },
  }
}

// Power Zone calculation
function calculatePowerZones(ftp: number) {
  return {
    z1: { name: "Recupero Attivo", min: 0, max: Math.round(ftp * 0.55) },
    z2: { name: "Endurance", min: Math.round(ftp * 0.55), max: Math.round(ftp * 0.75) },
    z3: { name: "Tempo", min: Math.round(ftp * 0.75), max: Math.round(ftp * 0.9) },
    z4: { name: "Soglia", min: Math.round(ftp * 0.9), max: Math.round(ftp * 1.05) },
    z5: { name: "VO2max", min: Math.round(ftp * 1.05), max: Math.round(ftp * 1.2) },
    z6: { name: "Anaerobico", min: Math.round(ftp * 1.2), max: Math.round(ftp * 1.5) },
    z7: { name: "Neuromuscolare", min: Math.round(ftp * 1.5), max: 9999 },
  }
}

// GYM Exercises
const GYM_EXERCISES = {
  strength: ["Squat", "Deadlift", "Leg Press", "Lunges", "Step Up", "Calf Raises"],
  core: ["Plank", "Russian Twist", "Dead Bug", "Bird Dog", "Ab Wheel", "Hanging Leg Raise"],
  flexibility: ["Hip Flexor Stretch", "Hamstring Stretch", "Quad Stretch", "Calf Stretch", "Pigeon Pose"],
  plyometric: ["Box Jump", "Jump Squat", "Burpees", "Bounding", "Single Leg Hop"],
}

const DAYS = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]

export function CoachTrainingPlanner({ coachId, linkedAthletes }: CoachTrainingPlannerProps) {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)
  const [selectedSport, setSelectedSport] = useState<string>("cycling")
  const [zoneType, setZoneType] = useState<ZoneType>("hr")
  const [manualFtp, setManualFtp] = useState<number | null>(null)
  const [manualHrMax, setManualHrMax] = useState<number | null>(null)
  const [manualHrLt2, setManualHrLt2] = useState<number | null>(null)
  const [manualHrRest, setManualHrRest] = useState<number | null>(null)
  const [showPhysioEditor, setShowPhysioEditor] = useState(false)
  const [weeklyPlan, setWeeklyPlan] = useState<TrainingSession[]>(
    DAYS.map((day, i) => ({
      day: i,
      dayName: day,
      sport: "cycling",
      duration: 0,
      description: "",
      zoneType: "hr",
      advancedBlocks: [],
      gymExercises: [],
    })),
  )
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Get active athletes only
  const activeAthletes = linkedAthletes.filter((a) => a.status === "accepted" && a.athlete)

  // Get selected athlete data
  const selectedAthlete = activeAthletes.find((a) => a.athlete?.id === selectedAthleteId)?.athlete
  const currentProfile = selectedAthlete?.metabolic_profiles?.find((p) => p.is_current)

  const effectiveFtp = manualFtp ?? currentProfile?.ftp_watts ?? null
  const effectiveHrMax = manualHrMax ?? currentProfile?.hr_max ?? null
  const effectiveHrLt2 = manualHrLt2 ?? currentProfile?.hr_lt2 ?? null
  const effectiveHrRest = manualHrRest ?? currentProfile?.hr_rest ?? null

  // Calculate zones based on athlete data (using effective values)
  const hrZones =
    effectiveHrMax && effectiveHrLt2 && effectiveHrRest
      ? calculateHRZones(effectiveHrMax, effectiveHrLt2, effectiveHrRest, selectedAthlete?.weight_kg ?? 70)
      : null

  const powerZones = effectiveFtp ? calculatePowerZones(effectiveFtp) : null

  // Check if selected sport supports power
  const sportConfig = SPORT_TYPES[selectedSport as keyof typeof SPORT_TYPES]
  const supportsPower = sportConfig?.supportsPower && powerZones

  // Current editing session
  const currentSession = selectedDay !== null ? weeklyPlan[selectedDay] : null

  useEffect(() => {
    if (selectedAthlete && currentProfile) {
      setManualFtp(currentProfile.ftp_watts)
      setManualHrMax(currentProfile.hr_max)
      setManualHrLt2(currentProfile.hr_lt2)
      setManualHrRest(currentProfile.hr_rest)
    } else {
      setManualFtp(null)
      setManualHrMax(null)
      setManualHrLt2(null)
      setManualHrRest(null)
    }
  }, [selectedAthleteId, selectedAthlete, currentProfile])

  // Add block to current day
  const handleAddBlock = (blockType: AdvancedBlockType) => {
    if (selectedDay === null) return

    const newBlock: AdvancedWorkoutBlock = {
      id: crypto.randomUUID(),
      blockType,
      sport: selectedSport,
      zoneType,
      totalDuration: 10,
      intervalDuration: blockType.includes("intervals") ? 2 : undefined,
      numIntervals: blockType.includes("intervals") ? 5 : undefined,
      primaryZone: "z2",
      secondaryZone: blockType === "intervals_2" || blockType === "intervals_3" ? "z4" : undefined,
      tertiaryZone: blockType === "intervals_3" ? "z3" : undefined,
      description: ADVANCED_BLOCK_TYPES[blockType].label,
      restBetweenIntervals: blockType.includes("intervals") ? 60 : undefined,
    }

    setWeeklyPlan((prev) => {
      const updated = [...prev]
      updated[selectedDay] = {
        ...updated[selectedDay],
        advancedBlocks: [...updated[selectedDay].advancedBlocks, newBlock],
        duration:
          updated[selectedDay].advancedBlocks.reduce((sum, b) => sum + b.totalDuration, 0) + newBlock.totalDuration,
      }
      return updated
    })
  }

  // Update block
  const handleUpdateBlock = (blockId: string, updates: Partial<AdvancedWorkoutBlock>) => {
    if (selectedDay === null) return

    setWeeklyPlan((prev) => {
      const updated = [...prev]
      const blockIndex = updated[selectedDay].advancedBlocks.findIndex((b) => b.id === blockId)
      if (blockIndex !== -1) {
        updated[selectedDay].advancedBlocks[blockIndex] = {
          ...updated[selectedDay].advancedBlocks[blockIndex],
          ...updates,
        }
        updated[selectedDay].duration = updated[selectedDay].advancedBlocks.reduce((sum, b) => sum + b.totalDuration, 0)
      }
      return updated
    })
  }

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    if (selectedDay === null) return

    setWeeklyPlan((prev) => {
      const updated = [...prev]
      updated[selectedDay].advancedBlocks = updated[selectedDay].advancedBlocks.filter((b) => b.id !== blockId)
      updated[selectedDay].duration = updated[selectedDay].advancedBlocks.reduce((sum, b) => sum + b.totalDuration, 0)
      return updated
    })
  }

  // Add gym exercise
  const handleAddGymExercise = (category: keyof typeof GYM_EXERCISES, name: string) => {
    if (selectedDay === null) return

    const newExercise: GymExercise = {
      id: crypto.randomUUID(),
      name,
      category,
      sets: 3,
      reps: 10,
      weight: 0,
      restBetweenSets: 60,
    }

    setWeeklyPlan((prev) => {
      const updated = [...prev]
      updated[selectedDay].gymExercises = [...updated[selectedDay].gymExercises, newExercise]
      return updated
    })
  }

  // Update gym exercise
  const handleUpdateGymExercise = (exerciseId: string, updates: Partial<GymExercise>) => {
    if (selectedDay === null) return

    setWeeklyPlan((prev) => {
      const updated = [...prev]
      const exerciseIndex = updated[selectedDay].gymExercises.findIndex((e) => e.id === exerciseId)
      if (exerciseIndex !== -1) {
        updated[selectedDay].gymExercises[exerciseIndex] = {
          ...updated[selectedDay].gymExercises[exerciseIndex],
          ...updates,
        }
      }
      return updated
    })
  }

  // Delete gym exercise
  const handleDeleteGymExercise = (exerciseId: string) => {
    if (selectedDay === null) return

    setWeeklyPlan((prev) => {
      const updated = [...prev]
      updated[selectedDay].gymExercises = updated[selectedDay].gymExercises.filter((e) => e.id !== exerciseId)
      return updated
    })
  }

  // Save plan to database and assign to athlete
  const handleSavePlan = async () => {
    if (!selectedAthleteId) {
      setSaveError("Seleziona un atleta")
      return
    }

    setSaving(true)
    setSaveError(null)

    try {
      // Save each training session
      for (const session of weeklyPlan) {
        if (session.advancedBlocks.length > 0 || session.gymExercises.length > 0) {
          const { error } = await supabase.from("training_activities").insert({
            athlete_id: selectedAthleteId,
            coach_id: coachId,
            activity_date: getNextWeekday(session.day),
            sport: session.sport,
            duration_minutes: session.duration,
            description: session.description || `Allenamento ${session.dayName}`,
            workout_data: {
              advancedBlocks: session.advancedBlocks,
              gymExercises: session.gymExercises,
              zoneType: session.zoneType,
            },
            source: "coach_assigned",
          })

          if (error) throw error
        }
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Errore durante il salvataggio")
    } finally {
      setSaving(false)
    }
  }

  // Get next weekday date
  const getNextWeekday = (dayIndex: number) => {
    const today = new Date()
    const currentDay = today.getDay()
    const targetDay = dayIndex + 1 // Monday = 1
    let daysUntil = targetDay - currentDay
    if (daysUntil <= 0) daysUntil += 7
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysUntil)
    return targetDate.toISOString().split("T")[0]
  }

  // Get zone display
  const getZoneDisplay = (zone: string) => {
    if (zoneType === "hr" && hrZones) {
      const z = hrZones[zone as keyof typeof hrZones]
      return z ? `${z.min}-${z.max} bpm` : zone
    } else if (zoneType === "power" && powerZones) {
      const z = powerZones[zone as keyof typeof powerZones]
      return z ? `${z.min}-${z.max}W` : zone
    }
    return zone.toUpperCase()
  }

  // Visualization component for workout
  const WorkoutVisualization = ({ blocks }: { blocks: AdvancedWorkoutBlock[] }) => {
    if (blocks.length === 0) return null

    const totalDuration = blocks.reduce((sum, b) => sum + b.totalDuration, 0)
    const zoneColors: Record<string, string> = {
      z1: "#22c55e",
      z2: "#3b82f6",
      z3: "#eab308",
      z4: "#f97316",
      z5: "#ef4444",
      z6: "#dc2626",
      z7: "#7c2d12",
    }
    const zoneHeights: Record<string, number> = { z1: 20, z2: 35, z3: 50, z4: 65, z5: 80, z6: 90, z7: 100 }

    return (
      <div className="bg-slate-900 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Visualizzazione Allenamento</h4>
        <div className="flex items-end gap-0.5 h-24 bg-slate-800 rounded p-2">
          {blocks.map((block) => {
            const widthPercent = (block.totalDuration / totalDuration) * 100
            const height = zoneHeights[block.primaryZone] || 50

            if (block.blockType.includes("intervals") && block.secondaryZone) {
              const intervals = block.numIntervals || 1
              const segments = []
              for (let i = 0; i < intervals; i++) {
                segments.push(
                  <div
                    key={`${block.id}-high-${i}`}
                    className="flex-1"
                    style={{
                      backgroundColor: zoneColors[block.primaryZone],
                      height: `${zoneHeights[block.primaryZone]}%`,
                    }}
                  />,
                )
                if (i < intervals - 1) {
                  segments.push(
                    <div
                      key={`${block.id}-low-${i}`}
                      className="flex-1"
                      style={{
                        backgroundColor: zoneColors[block.secondaryZone],
                        height: `${zoneHeights[block.secondaryZone]}%`,
                      }}
                    />,
                  )
                }
              }
              return (
                <div
                  key={block.id}
                  className="flex items-end gap-0.5"
                  style={{ width: `${widthPercent}%` }}
                  title={`${block.description} - ${block.totalDuration}min`}
                >
                  {segments}
                </div>
              )
            }

            return (
              <div
                key={block.id}
                style={{
                  width: `${widthPercent}%`,
                  height: `${height}%`,
                  backgroundColor: zoneColors[block.primaryZone] || "#64748b",
                }}
                className="rounded-sm transition-all hover:opacity-80"
                title={`${block.description} - ${block.totalDuration}min`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>0 min</span>
          <span>{totalDuration} min</span>
        </div>
      </div>
    )
  }

  // If no athlete selected, show athlete selector
  if (!selectedAthleteId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Pianifica Allenamento</h2>
          <p className="text-slate-400">Seleziona un atleta per creare il piano di allenamento</p>
        </div>

        {activeAthletes.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nessun atleta collegato</h3>
              <p className="text-slate-400">Invita degli atleti per iniziare a pianificare gli allenamenti</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAthletes.map((link) => {
              const athlete = link.athlete
              const profile = athlete?.metabolic_profiles?.find((p) => p.is_current)
              const SportIcon = SPORT_TYPES[athlete?.primary_sport as keyof typeof SPORT_TYPES]?.icon || Activity

              return (
                <Card
                  key={link.id}
                  className="bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => setSelectedAthleteId(athlete?.id || null)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <SportIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{athlete?.user?.full_name || "Atleta"}</CardTitle>
                        <CardDescription className="text-slate-400 text-xs">{athlete?.user?.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-700/50 rounded p-2">
                        <p className="text-xs text-slate-400">FTP</p>
                        <p className="text-sm font-semibold text-white">{profile?.ftp_watts || "-"}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <p className="text-xs text-slate-400">FCmax</p>
                        <p className="text-sm font-semibold text-white">{profile?.hr_max || "-"}</p>
                      </div>
                      <div className="bg-slate-700/50 rounded p-2">
                        <p className="text-xs text-slate-400">VO2max</p>
                        <p className="text-sm font-semibold text-white">{profile?.vo2max || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Added function to parse Excel files
  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        if (!data || typeof data === "string") {
          return reject(new Error("Could not read file data"))
        }
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      }
      reader.onerror = (err) => reject(err)
      reader.readAsArrayBuffer(file)
    })
  }

  // Parse TrainingPeaks CSV
  const parseTrainingPeaksCSV = (csvText: string) => {
    console.log("[v0] Starting CSV parse, text length:", csvText.length)

    const lines = csvText.trim().split("\n")
    console.log("[v0] Lines found:", lines.length)

    if (lines.length < 2) {
      console.log("[v0] Not enough lines in CSV")
      return []
    }

    // Parse header - remove quotes from each field
    const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())
    console.log("[v0] Header fields:", header)

    const titleIdx = header.findIndex((h) => h.toLowerCase() === "title")
    const typeIdx = header.findIndex((h) => h.toLowerCase() === "workouttype")
    const durationIdx = header.findIndex((h) => h.toLowerCase() === "plannedduration")
    const dayIdx = header.findIndex((h) => h.toLowerCase() === "workoutday")

    console.log("[v0] Column indices - Title:", titleIdx, "Type:", typeIdx, "Duration:", durationIdx, "Day:", dayIdx)

    if (titleIdx === -1 || dayIdx === -1) {
      console.log("[v0] Required columns not found")
      return []
    }

    const workouts: Array<{
      title: string
      type: string
      duration: number
      date: string
      dayOfWeek: number
    }> = []

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
      if (!row.trim()) continue

      // Handle CSV with quoted fields
      const values: string[] = []
      let current = ""
      let inQuotes = false
      for (const char of row) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          values.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const title = values[titleIdx] || ""
      const type = values[typeIdx] || ""
      const durationHours = Number.parseFloat(values[durationIdx]) || 0
      const date = values[dayIdx] || ""

      console.log("[v0] Row", i, "- Title:", title, "Type:", type, "Duration:", durationHours, "Date:", date)

      if (date && title) {
        const dateObj = new Date(date)
        const dayOfWeek = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1 // Monday = 0

        workouts.push({
          title,
          type,
          duration: Math.round(durationHours * 60), // Convert to minutes
          date,
          dayOfWeek,
        })
        console.log("[v0] Added workout:", title, "on day", dayOfWeek)
      }
    }

    console.log("[v0] Total workouts parsed:", workouts.length)
    return workouts
  }

  // Map workout type to sport
  const mapWorkoutTypeToSport = (type: string, title: string): string => {
    const typeLower = type.toLowerCase()
    const titleLower = title.toLowerCase()

    if (typeLower === "bike" || titleLower.includes("bike") || titleLower.includes("cycling")) return "cycling"
    if (typeLower === "run" || titleLower.includes("run") || titleLower.includes("corsa")) return "running"
    if (typeLower === "swim" || titleLower.includes("swim") || titleLower.includes("nuoto")) return "swimming"
    if (typeLower === "x-train" || titleLower.includes("gym") || titleLower.includes("palestra")) return "gym"
    if (titleLower.includes("trail")) return "trail"
    if (titleLower.includes("mtb")) return "mtb"

    return "cycling" // default
  }

  // Extract zones from title
  const extractZonesFromTitle = (title: string): string[] => {
    const zones: string[] = []
    const titleLower = title.toLowerCase()

    // Match patterns like z1, z2, z3, etc.
    const zoneMatches = titleLower.match(/z[1-7]/g)
    if (zoneMatches) {
      zones.push(...zoneMatches)
    }

    return [...new Set(zones)] // Remove duplicates
  }

  // Extract intervals from title
  const extractIntervalsFromTitle = (title: string): { count: number; duration: number } | null => {
    // Match patterns like "8 X 30"", "4x5min", "6 x 3'"
    const patterns = [/(\d+)\s*[xX]\s*(\d+)['"″]/, /(\d+)\s*[xX]\s*(\d+)\s*min/i, /(\d+)\s*[xX]\s*(\d+)/]

    for (const pattern of patterns) {
      const match = title.match(pattern)
      if (match) {
        const count = Number.parseInt(match[1])
        let duration = Number.parseInt(match[2])
        // If duration seems like seconds (< 10), keep as seconds, otherwise assume minutes
        if (duration >= 10) {
          duration = duration // seconds
        } else {
          duration = duration * 60 // minutes to seconds
        }
        return { count, duration }
      }
    }

    return null
  }

  const parseWorkoutDescription = (
    description: string,
    totalDuration: number,
    sport: string,
  ): AdvancedWorkoutBlock[] => {
    const blocks: AdvancedWorkoutBlock[] = []
    if (!description || description.trim().length < 10) {
      return blocks
    }

    console.log("[v0] Parsing workout description for structured blocks")

    const lines = description
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter((l) => l)
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      const lowerLine = line.toLowerCase()

      // WARM UP: "Warm up" followed by "20 min @ 144-180 W Zone 1"
      if (lowerLine === "warm up" || lowerLine === "warmup") {
        // Next line has duration and zone
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1]
          const durMatch = nextLine.match(/(\d+)\s*min/i)
          const zoneMatch = nextLine.match(/zone\s*(\d)/i)
          blocks.push({
            id: crypto.randomUUID(),
            blockType: "warmup",
            sport,
            zoneType: "power",
            totalDuration: durMatch ? Number.parseInt(durMatch[1]) : 10,
            primaryZone: zoneMatch ? `z${zoneMatch[1]}` : "z1",
            description: "Warm up",
          })
          console.log("[v0] Warmup:", durMatch?.[1] || 10, "min")
          i += 2
          continue
        }
      }

      // REPEAT INTERVALS: "Repeat 6 times" followed by Hard/Easy blocks
      if (lowerLine.startsWith("repeat") && lowerLine.includes("times")) {
        const numMatch = line.match(/repeat\s*(\d+)\s*times/i)
        const numRepeats = numMatch ? Number.parseInt(numMatch[1]) : 1

        let hardSec = 12,
          hardZone = "z6"
        let easySec = 120,
          easyZone = "z1"

        // Look for Hard
        if (i + 1 < lines.length && lines[i + 1].toLowerCase() === "hard") {
          if (i + 2 < lines.length) {
            const hardLine = lines[i + 2]
            const secMatch = hardLine.match(/(\d+)\s*sec/i)
            const minMatch = hardLine.match(/(\d+)\s*min/i)
            hardSec = secMatch ? Number.parseInt(secMatch[1]) : minMatch ? Number.parseInt(minMatch[1]) * 60 : 12
            const zMatch = hardLine.match(/zone\s*(\d)/i)
            if (zMatch) hardZone = `z${zMatch[1]}`
          }
        }

        // Look for Easy
        if (i + 3 < lines.length && lines[i + 3].toLowerCase() === "easy") {
          if (i + 4 < lines.length) {
            const easyLine = lines[i + 4]
            const secMatch = easyLine.match(/(\d+)\s*sec/i)
            const minMatch = easyLine.match(/(\d+)\s*min/i)
            easySec = minMatch ? Number.parseInt(minMatch[1]) * 60 : secMatch ? Number.parseInt(secMatch[1]) : 120
            const zMatch = easyLine.match(/zone\s*(\d)/i)
            if (zMatch) easyZone = `z${zMatch[1]}`
          }
        }

        const totalMin = Math.round((numRepeats * (hardSec + easySec)) / 60)
        blocks.push({
          id: crypto.randomUUID(),
          blockType: "intervals_2",
          sport,
          zoneType: "power",
          totalDuration: totalMin,
          intervalDuration: Math.round(hardSec / 6) / 10, // convert to min with 1 decimal
          numIntervals: numRepeats,
          primaryZone: hardZone,
          secondaryZone: easyZone,
          restBetweenIntervals: easySec,
          description: `${numRepeats}x ${hardSec}sec ${hardZone.toUpperCase()}`,
        })
        console.log("[v0] Intervals:", numRepeats, "x", hardSec, "sec @", hardZone, "/", easySec, "sec @", easyZone)
        i += 5 // Skip: Repeat, Hard, duration, Easy, duration
        continue
      }

      // RECOVERY: "Recovery" followed by duration
      if (lowerLine === "recovery") {
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1]
          const durMatch = nextLine.match(/(\d+)\s*min/i)
          const zoneMatch = nextLine.match(/zone\s*(\d)/i)
          blocks.push({
            id: crypto.randomUUID(),
            blockType: "constant",
            sport,
            zoneType: "power",
            totalDuration: durMatch ? Number.parseInt(durMatch[1]) : 10,
            primaryZone: zoneMatch ? `z${zoneMatch[1]}` : "z1",
            description: "Recovery",
          })
          console.log("[v0] Recovery:", durMatch?.[1] || 10, "min")
          i += 2
          continue
        }
      }

      // NAMED BLOCK: "dietro moto" followed by duration/power/zone
      // Check if it's a named section (no duration in this line, but next line has duration)
      if (!lowerLine.includes("min") && !lowerLine.includes("sec") && i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        if (nextLine.match(/\d+\s*min/i) && nextLine.includes("@")) {
          const durMatch = nextLine.match(/(\d+)\s*min/i)
          const zoneMatch = nextLine.match(/zone\s*(\d)(?:\s*-\s*(\d))?/i)

          let primaryZone = "z2"
          let secondaryZone: string | undefined
          let blockType: AdvancedBlockType = "constant"

          if (zoneMatch) {
            primaryZone = `z${zoneMatch[1]}`
            if (zoneMatch[2]) {
              secondaryZone = `z${zoneMatch[2]}`
              blockType = Number.parseInt(zoneMatch[2]) > Number.parseInt(zoneMatch[1]) ? "increment" : "constant"
            }
          }

          blocks.push({
            id: crypto.randomUUID(),
            blockType,
            sport,
            zoneType: "power",
            totalDuration: durMatch ? Number.parseInt(durMatch[1]) : 10,
            primaryZone,
            secondaryZone,
            description: line, // Use the name like "dietro moto"
          })
          console.log("[v0] Block:", line, durMatch?.[1] || 10, "min @", primaryZone)
          i += 2
          continue
        }
      }

      i++
    }

    return blocks
  }

  // Create blocks from workout
  const createBlocksFromWorkout = (workout: {
    title: string
    type: string
    duration: number
    description?: string // Added description field
  }): AdvancedWorkoutBlock[] => {
    const sport = mapWorkoutTypeToSport(workout.type, workout.title)

    // First try structured description parsing
    if (workout.description && workout.description.trim().length > 20) {
      const parsedBlocks = parseWorkoutDescription(workout.description, workout.duration, sport)
      if (parsedBlocks.length > 0) {
        console.log("[v0] Using", parsedBlocks.length, "blocks from structured description")
        return parsedBlocks
      }
    }

    // Fallback: create blocks from title
    // Skip rest days
    if (workout.type.toLowerCase() === "day off" || workout.title.toLowerCase().includes("recovery")) {
      return []
    }

    // For gym/x-train, don't create cardio blocks
    if (sport === "gym") {
      return []
    }

    const blocks: AdvancedWorkoutBlock[] = []
    const zones = extractZonesFromTitle(workout.title)
    const intervals = extractIntervalsFromTitle(workout.title)

    const totalDuration = workout.duration || 60
    let remainingDuration = totalDuration

    // Add warmup (10% of total, min 5 min, max 15 min)
    const warmupDuration = Math.min(15, Math.max(5, Math.round(totalDuration * 0.1)))
    blocks.push({
      id: crypto.randomUUID(),
      blockType: "warmup",
      sport,
      zoneType: "hr", // Default to HR for title-based parsing
      totalDuration: warmupDuration,
      primaryZone: "z1",
      description: "Riscaldamento progressivo",
    })
    remainingDuration -= warmupDuration

    // Add cooldown (10% of total, min 5 min, max 15 min)
    const cooldownDuration = Math.min(15, Math.max(5, Math.round(totalDuration * 0.1)))
    remainingDuration -= cooldownDuration

    // Main block(s)
    if (intervals) {
      // Interval workout
      // Try to allocate about 60% of remaining time to intervals, or a fixed duration based on interval count/duration
      const intervalBlockDuration = Math.min(remainingDuration * 0.6, intervals.count * (intervals.duration / 60 + 1))
      const primaryZone = zones.find((z) => ["z4", "z5", "z6", "z7"].includes(z)) || "z4"
      const recoveryZone = zones.find((z) => ["z1", "z2"].includes(z)) || "z1"

      blocks.push({
        id: crypto.randomUUID(),
        blockType: "intervals_2",
        sport,
        zoneType: "hr",
        totalDuration: Math.round(intervalBlockDuration),
        intervalDuration: Math.round(intervals.duration / 60),
        numIntervals: intervals.count,
        primaryZone,
        secondaryZone: recoveryZone, // Added to match type, though might not be used in all contexts
        restBetweenIntervals: 60, // Default rest of 60s
        description: `${intervals.count}x${Math.round(intervals.duration / 60)}min intervalli`,
      })
      remainingDuration -= intervalBlockDuration

      // Add remaining time as endurance block if significant
      if (remainingDuration > 5) {
        blocks.push({
          id: crypto.randomUUID(),
          blockType: "constant",
          sport,
          zoneType: "hr",
          totalDuration: Math.round(remainingDuration),
          primaryZone: zones.find((z) => ["z2", "z3"].includes(z)) || "z2",
          description: "Lavoro aerobico",
        })
      }
    } else if (zones.length > 1) {
      // Multiple zones specified in title - create progressive blocks
      // Distribute remaining duration among the zones
      const blockDuration = Math.round(remainingDuration / zones.length)
      zones.forEach((zone, idx) => {
        blocks.push({
          id: crypto.randomUUID(),
          blockType: idx === 0 ? "constant" : idx < zones.length - 1 ? "increment" : "constant", // First is constant, middle increment, last constant
          sport,
          zoneType: "hr",
          totalDuration: blockDuration,
          primaryZone: zone,
          description: `Blocco ${zone.toUpperCase()}`,
        })
      })
    } else {
      // Single zone or no zone specified in title - endurance block
      const mainZone = zones[0] || "z2" // Default to Z2 if no zone is found
      blocks.push({
        id: crypto.randomUUID(),
        blockType: "constant",
        sport,
        zoneType: "hr",
        totalDuration: Math.round(remainingDuration),
        primaryZone: mainZone,
        description: `Lavoro ${mainZone.toUpperCase()}`,
      })
    }

    // Add cooldown block at the end
    blocks.push({
      id: crypto.randomUUID(),
      blockType: "cooldown",
      sport,
      zoneType: "hr",
      totalDuration: cooldownDuration,
      primaryZone: "z1",
      description: "Defaticamento",
    })

    return blocks
  }

  // Handle importing training data
  const handleImportTrainingPeaks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    console.log("[v0] File selected:", file.name, "Size:", file.size, "Type:", file.type)
    setImporting(true)
    setSaveError(null)

    try {
      let csvText = ""
      const fileName = file.name.toLowerCase()

      // Step 1: Extract CSV text from file (ZIP, Excel, or plain CSV)
      if (fileName.endsWith(".zip")) {
        // Extract CSV from ZIP file
        console.log("[v0] Parsing as ZIP file")
        const arrayBuffer = await file.arrayBuffer()
        const zip = await JSZip.loadAsync(arrayBuffer)

        // Find CSV file inside ZIP
        const csvFileName = Object.keys(zip.files).find((name) => name.toLowerCase().endsWith(".csv"))
        if (!csvFileName) {
          throw new Error("Nessun file CSV trovato nel file ZIP")
        }
        console.log("[v0] Found CSV in ZIP:", csvFileName)

        csvText = await zip.files[csvFileName].async("string")
        console.log("[v0] CSV content length:", csvText.length)
        console.log("[v0] CSV first 500 chars:", csvText.substring(0, 500))
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // Parse Excel file and convert to CSV
        console.log("[v0] Parsing as Excel file")
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        csvText = XLSX.utils.sheet_to_csv(worksheet)
        console.log("[v0] Excel converted to CSV, length:", csvText.length)
      } else {
        // Plain CSV file
        console.log("[v0] Parsing as plain CSV file")
        csvText = await file.text()
      }

      // Step 2: Parse CSV text
      console.log("[v0] Parsing CSV text...")
      const lines = csvText.trim().split("\n")
      console.log("[v0] Lines found:", lines.length)

      if (lines.length < 2) {
        throw new Error("Il file non contiene dati sufficienti")
      }

      // Parse header - handle quotes and normalize
      const headerLine = lines[0]
      const header: string[] = []
      let current = ""
      let inQuotes = false

      for (const char of headerLine) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === "," && !inQuotes) {
          header.push(current.replace(/"/g, "").trim().toLowerCase())
          current = ""
        } else {
          current += char
        }
      }
      header.push(current.replace(/"/g, "").trim().toLowerCase())

      console.log("[v0] Parsed header columns:", header.length)
      console.log("[v0] Header:", header.slice(0, 10))

      // Find column indices
      const titleIdx = header.findIndex((h) => h === "title")
      const typeIdx = header.findIndex((h) => h === "workouttype" || h === "workout type" || h === "type")
      const dayIdx = header.findIndex((h) => h === "workoutday" || h === "workout day" || h === "date")
      const durationIdx = header.findIndex(
        (h) => h === "plannedduration" || h === "planned duration" || h === "duration" || h === "timetotalinhours",
      )
      // Add description column index
      const descIdx = header.findIndex(
        (h) => h === "workoutdescription" || h === "workout description" || h === "description",
      )
      console.log(
        "[v0] Column indices - Title:",
        titleIdx,
        "Type:",
        typeIdx,
        "Day:",
        dayIdx,
        "Duration:",
        durationIdx,
        "Description:",
        descIdx,
      )

      console.log("[v0] Column indices - Title:", titleIdx, "Type:", typeIdx, "Day:", dayIdx, "Duration:", durationIdx)

      if (titleIdx === -1) {
        throw new Error("Colonna 'Title' non trovata. Colonne disponibili: " + header.slice(0, 10).join(", "))
      }
      if (dayIdx === -1) {
        throw new Error(
          "Colonna 'WorkoutDay' o 'Date' non trovata. Colonne disponibili: " + header.slice(0, 10).join(", "),
        )
      }

      // Step 3: Parse data rows
      const workouts: Array<{
        title: string
        type: string
        duration: number
        dayOfWeek: number
        date: string
        description?: string // Added description field
      }> = []
      const restDays: number[] = [] // Track rest days separately to show them in UI

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue

        // Parse CSV row handling quoted values
        const values: string[] = []
        current = ""
        inQuotes = false

        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === "," && !inQuotes) {
            values.push(current.replace(/"/g, "").trim())
            current = ""
          } else {
            current += char
          }
        }
        values.push(current.replace(/"/g, "").trim())

        const title = values[titleIdx] || ""
        const workoutType = typeIdx >= 0 ? values[typeIdx] || "" : ""
        const workoutDayRaw = dayIdx >= 0 ? values[dayIdx] || "" : ""
        const durationRaw = durationIdx >= 0 ? values[durationIdx] || "0" : "0"
        // Inside the data row parsing loop, read the description
        const workoutDescription = descIdx >= 0 ? values[descIdx] || "" : ""

        // Skip empty or header rows
        if (!title || title.toLowerCase() === "title") continue

        // Parse date - use UTC to avoid timezone issues
        let dayOfWeek = -1
        let dateStr = workoutDayRaw

        if (workoutDayRaw) {
          // Parse date as UTC to avoid timezone shifting
          const parts = workoutDayRaw.split("-")
          if (parts.length === 3) {
            const year = Number.parseInt(parts[0])
            const month = Number.parseInt(parts[1]) - 1 // months are 0-indexed
            const day = Number.parseInt(parts[2])
            const dateObj = new Date(Date.UTC(year, month, day))

            if (!isNaN(dateObj.getTime())) {
              // getUTCDay: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
              // We want: 0 = Monday, ..., 6 = Sunday
              const utcDay = dateObj.getUTCDay()
              dayOfWeek = utcDay === 0 ? 6 : utcDay - 1 // Sunday becomes 6, others shift down by 1
              dateStr = workoutDayRaw
              console.log(
                "[v0] Date parsed:",
                workoutDayRaw,
                "-> UTC day:",
                utcDay,
                "-> dayOfWeek index:",
                dayOfWeek,
                "->",
                DAYS[dayOfWeek],
              )
            }
          }
        }

        if (workoutType.toLowerCase() === "day off" || title.toLowerCase().includes("recovery")) {
          if (dayOfWeek >= 0 && dayOfWeek <= 6) {
            restDays.push(dayOfWeek)
            console.log("[v0] Rest day marked:", DAYS[dayOfWeek], "- Title:", title)
          }
          continue
        }

        // Parse duration (TrainingPeaks uses decimal hours)
        let durationMinutes = 0
        const durationNum = Number.parseFloat(durationRaw)
        if (!isNaN(durationNum) && durationNum > 0) {
          // TrainingPeaks always exports duration in decimal hours (e.g., 6 = 6 hours, 1.5 = 1.5 hours)
          durationMinutes = Math.round(durationNum * 60)
          console.log("[v0] Duration parsed:", durationRaw, "hours ->", durationMinutes, "minutes")
        }

        if (dayOfWeek >= 0 && dayOfWeek <= 6) {
          workouts.push({
            title,
            type: workoutType,
            duration: durationMinutes || 60,
            dayOfWeek,
            date: dateStr,
            description: workoutDescription, // Add description field
          })
          console.log("[v0] Added workout:", title, "Day:", DAYS[dayOfWeek], "Duration:", durationMinutes, "min")
        } else {
          console.log("[v0] Skipped workout (invalid date):", title, "Date:", workoutDayRaw)
        }
      }

      console.log("[v0] Total workouts parsed:", workouts.length)
      console.log("[v0] Rest days:", restDays.map((d) => DAYS[d]).join(", "))

      if (workouts.length === 0 && restDays.length === 0) {
        throw new Error(
          "Nessun workout valido trovato nel file. Verifica che le date siano nel formato corretto (YYYY-MM-DD).",
        )
      }

      // Step 4: Create blocks and distribute to week
      setWeeklyPlan((prevPlan) => {
        const newWeekPlan = [...prevPlan]

        restDays.forEach((dayIndex) => {
          if (dayIndex >= 0 && dayIndex < 7) {
            newWeekPlan[dayIndex] = {
              ...newWeekPlan[dayIndex],
              description: "RIPOSO / RECOVERY",
              duration: 0,
              advancedBlocks: [],
              gymExercises: [],
            }
          }
        })

        workouts.forEach((workout) => {
          const blocks = createBlocksFromWorkout(workout)
          const sport = mapWorkoutTypeToSport(workout.type, workout.title)

          // Ensure workout.dayOfWeek is a valid index (0-6)
          if (workout.dayOfWeek >= 0 && workout.dayOfWeek < 7) {
            const dayIndex = workout.dayOfWeek
            const currentSession = newWeekPlan[dayIndex]

            if (
              sport === "gym" ||
              workout.type.toLowerCase() === "x-train" ||
              workout.type.toLowerCase() === "crosstrain"
            ) {
              newWeekPlan[dayIndex] = {
                ...currentSession,
                sport:
                  currentSession.sport === "cycling" && currentSession.advancedBlocks.length === 0
                    ? "gym"
                    : currentSession.sport,
                duration: currentSession.duration + workout.duration,
                description: currentSession.description
                  ? `${currentSession.description} + ${workout.title}`
                  : workout.title,
              }
              console.log("[v0] Added GYM workout to", DAYS[dayIndex], ":", workout.title)
            } else if (blocks.length > 0) {
              // Cardio workout with blocks
              newWeekPlan[dayIndex] = {
                ...currentSession,
                advancedBlocks: [...(currentSession.advancedBlocks || []), ...blocks],
                duration: (currentSession.duration || 0) + workout.duration,
                sport: sport,
                description: currentSession.description
                  ? `${currentSession.description} + ${workout.title}`
                  : workout.title,
              }
              console.log("[v0] Added", blocks.length, "blocks to", DAYS[dayIndex], ":", workout.title)
            }
          } else {
            console.log("[v0] Skipping workout with invalid dayOfWeek:", workout.title, workout.dayOfWeek)
          }
        })
        return newWeekPlan
      })

      setSaveError(null)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.log("[v0] Import error:", error)
      setSaveError(error instanceof Error ? error.message : "Errore durante l'importazione")
    } finally {
      setImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSavePhysioData = async () => {
    if (!selectedAthlete?.id) {
      console.error("[v0] No athlete selected or athlete has no ID")
      return
    }

    console.log("[v0] Saving HR data for athlete:", selectedAthlete.id)
    console.log("[v0] HR values:", { effectiveHrMax, effectiveHrLt2, effectiveHrRest, effectiveFtp })

    try {
      // Calculate HR zones to save
      const hrZonesToSave =
        effectiveHrMax && effectiveHrLt2 && effectiveHrRest
          ? calculateHRZones(effectiveHrMax, effectiveHrLt2, effectiveHrRest, selectedAthlete?.weight_kg ?? 70)
          : null

      console.log("[v0] HR zones calculated:", hrZonesToSave ? hrZonesToSave.length + " zones" : "null")

      const updateData = {
        ftp_watts: effectiveFtp || null,
        hr_max: effectiveHrMax || null,
        hr_lt2: effectiveHrLt2 || null,
        hr_rest: effectiveHrRest || null,
        hr_zones: hrZonesToSave,
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Update data:", updateData)

      const { data, error } = await supabase
        .from("metabolic_profiles")
        .update(updateData)
        .eq("athlete_id", selectedAthlete.id)
        .eq("is_current", true)
        .select()

      console.log("[v0] Update result:", { data, error })

      if (error) throw error

      if (!data || data.length === 0) {
        console.error("[v0] No rows updated - profile might not exist")
        // Try to insert instead
        const { error: insertError } = await supabase.from("metabolic_profiles").insert({
          athlete_id: selectedAthlete.id,
          is_current: true,
          ...updateData,
        })

        if (insertError) {
          console.error("[v0] Insert error:", insertError)
          throw insertError
        }
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
      setShowPhysioEditor(false)
    } catch (err) {
      console.error("[v0] Error saving physio data:", err)
    }
  }

  // Main planner view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedAthleteId(null)}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">Piano per {selectedAthlete?.user?.full_name || "Atleta"}</h2>
            <p className="text-slate-400">Crea e assegna il piano settimanale</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Salvato
            </Badge>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .zip, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleImportTrainingPeaks}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Importa Allenamenti
          </Button>

          <Button onClick={handleSavePlan} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Assegna Piano
          </Button>
        </div>
      </div>

      {/* Sport & Zone Type Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-slate-300 mb-2 block">Sport</Label>
              <Select value={selectedSport} onValueChange={setSelectedSport}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(SPORT_TYPES).map(([key, config]) => {
                    const Icon = config.icon
                    return (
                      <SelectItem key={key} value={key} className="text-white">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label className="text-slate-300 mb-2 block">Tipo Zone</Label>
              <div className="flex gap-2">
                <Button
                  variant={zoneType === "hr" ? "default" : "outline"}
                  onClick={() => setZoneType("hr")}
                  className={zoneType === "hr" ? "bg-red-600" : "border-slate-600 text-slate-300"}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  HR Zones
                </Button>
                {supportsPower && (
                  <Button
                    variant={zoneType === "power" ? "default" : "outline"}
                    onClick={() => setZoneType("power")}
                    className={zoneType === "power" ? "bg-yellow-600" : "border-slate-600 text-slate-300"}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Power Zones
                  </Button>
                )}
              </div>
            </div>

            {/* Athlete Zones Display */}
            <div className="w-full">
              <Label className="text-slate-300 mb-2 block">Zone Atleta</Label>
              <div className="flex flex-wrap gap-2">
                {zoneType === "hr" && hrZones ? (
                  Object.entries(hrZones).map(([key, zone]) => (
                    <Badge key={key} variant="outline" className="border-slate-600 text-slate-300">
                      {key.toUpperCase()} - {zone.min}-{zone.max} bpm
                    </Badge>
                  ))
                ) : zoneType === "power" && powerZones ? (
                  Object.entries(powerZones)
                    .slice(0, 5)
                    .map(([key, zone]) => (
                      <Badge key={key} variant="outline" className="border-slate-600 text-slate-300">
                        {key.toUpperCase()} - {zone.min}-{zone.max}W
                      </Badge>
                    ))
                ) : (
                  <p className="text-slate-500 text-sm">Dati fisiologici non disponibili per questo atleta</p>
                )}
              </div>
            </div>

            {/* Button to open physiological editor */}
            {selectedAthlete && (
              <div className="ml-auto">
                {/* CHANGE: Made button more visible with green color and icon */}
                <Button
                  onClick={() => setShowPhysioEditor(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Modifica Dati Fisiologici
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weeklyPlan.map((session, index) => {
          const hasWorkout = session.advancedBlocks.length > 0 || session.gymExercises.length > 0 || session.description
          const SportIcon = SPORT_TYPES[session.sport as keyof typeof SPORT_TYPES]?.icon || Activity
          const isRestDay =
            session.description?.toLowerCase().includes("riposo") ||
            session.description?.toLowerCase().includes("recovery")

          return (
            <Card
              key={index}
              className={`bg-slate-800/50 border-slate-700 transition-all hover:border-blue-500 ${
                selectedDay === index ? "border-blue-500 ring-1 ring-blue-500" : ""
              } ${isRestDay ? "opacity-60" : ""}`}
            >
              <CardHeader className="p-2 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white">{session.dayName.slice(0, 3)}</CardTitle>
                  {hasWorkout && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDay(index)
                          setBuilderOpen(true)
                        }}
                        title="Modifica"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm("Cancellare questo allenamento?")) {
                            setWeeklyPlan((prev) => {
                              const newPlan = [...prev]
                              newPlan[index] = {
                                ...newPlan[index],
                                advancedBlocks: [],
                                gymExercises: [],
                                description: "",
                                duration: 0,
                              }
                              return newPlan
                            })
                          }
                        }}
                        title="Cancella"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent
                className="p-2 pt-0 cursor-pointer"
                onClick={() => {
                  setSelectedDay(index)
                  setBuilderOpen(true)
                }}
              >
                {isRestDay ? (
                  <div className="h-12 flex items-center justify-center">
                    <span className="text-xs text-slate-500">Riposo</span>
                  </div>
                ) : hasWorkout ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <SportIcon className="h-3 w-3 text-blue-400" />
                      <span className="text-xs text-slate-300">{session.duration}min</span>
                    </div>
                    {session.description && (
                      <div className="text-xs text-slate-400 truncate" title={session.description}>
                        {session.description.length > 20
                          ? session.description.slice(0, 20) + "..."
                          : session.description}
                      </div>
                    )}
                    {session.advancedBlocks.length > 0 && (
                      <div className="text-xs text-slate-500">{session.advancedBlocks.length} blocchi</div>
                    )}
                    {session.gymExercises.length > 0 && (
                      <div className="text-xs text-slate-500">
                        <Dumbbell className="h-3 w-3 inline mr-1" />
                        {session.gymExercises.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-12 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Workout Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {currentSession?.dayName} - Workout Builder
            </DialogTitle>
            {currentSession?.description && (
              <p className="text-sm text-slate-400 mt-1">
                Allenamento importato: <span className="text-blue-400">{currentSession.description}</span>
              </p>
            )}
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            {currentSession?.description && currentSession.advancedBlocks.length <= 3 && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
                <h4 className="text-blue-300 font-medium mb-2">Allenamento Importato da TrainingPeaks</h4>
                <p className="text-slate-300 text-sm mb-2">
                  <strong>Titolo:</strong> {currentSession.description}
                </p>
                <p className="text-slate-300 text-sm mb-2">
                  <strong>Durata totale:</strong> {currentSession.duration} minuti
                </p>
                <p className="text-slate-400 text-xs">
                  Il CSV di TrainingPeaks non contiene la struttura dettagliata degli intervalli. Usa i controlli sotto
                  per aggiungere manualmente i blocchi (warm-up, intervalli, cooldown).
                </p>
              </div>
            )}

            <Tabs defaultValue="workout" className="w-full">
              <TabsList className="bg-slate-800 border-slate-700 mb-4">
                <TabsTrigger value="workout" className="data-[state=active]:bg-slate-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Allenamento
                </TabsTrigger>
                <TabsTrigger value="gym" className="data-[state=active]:bg-slate-700">
                  <Dumbbell className="h-4 w-4 mr-2" />
                  Palestra
                </TabsTrigger>
              </TabsList>

              {/* Workout Tab */}
              <TabsContent value="workout" className="space-y-4">
                {/* Add Block */}
                <div>
                  <Label className="text-slate-300 mb-2 block">Aggiungi Blocco</Label>
                  <Select onValueChange={(value) => handleAddBlock(value as AdvancedBlockType)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Seleziona tipo blocco..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.entries(ADVANCED_BLOCK_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-white">
                          <span className="mr-2">{config.icon}</span>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Blocks List */}
                <div className="space-y-2">
                  {currentSession?.advancedBlocks.map((block, index) => (
                    <Card key={block.id} className="bg-slate-800 border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <GripVertical className="h-4 w-4 text-slate-500" />
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {ADVANCED_BLOCK_TYPES[block.blockType].icon} {ADVANCED_BLOCK_TYPES[block.blockType].label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-auto text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteBlock(block.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {/* Duration */}
                          <div>
                            <Label className="text-xs text-slate-400">Durata (min)</Label>
                            <input
                              type="number"
                              value={block.totalDuration}
                              onChange={(e) =>
                                handleUpdateBlock(block.id, { totalDuration: Number.parseInt(e.target.value) || 0 })
                              }
                              className="w-full h-8 px-2 rounded bg-slate-700 border border-slate-600 text-sm"
                              style={{ color: "#ffffff" }}
                            />
                          </div>

                          {/* Primary Zone */}
                          <div>
                            <Label className="text-xs text-slate-400">Zona</Label>
                            <Select
                              value={block.primaryZone}
                              onValueChange={(value) => handleUpdateBlock(block.id, { primaryZone: value })}
                            >
                              <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {(zoneType === "power"
                                  ? ["z1", "z2", "z3", "z4", "z5", "z6", "z7"]
                                  : ["z1", "z2", "z3", "z4", "z5"]
                                ).map((z) => (
                                  <SelectItem key={z} value={z} className="text-white">
                                    {z.toUpperCase()} - {getZoneDisplay(z)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Intervals */}
                          {block.blockType.includes("intervals") && (
                            <>
                              <div>
                                <Label className="text-xs text-slate-400">N° Intervalli</Label>
                                <input
                                  type="number"
                                  value={block.numIntervals || 1}
                                  onChange={(e) =>
                                    handleUpdateBlock(block.id, { numIntervals: Number.parseInt(e.target.value) || 1 })
                                  }
                                  className="w-full h-8 px-2 rounded bg-slate-700 border border-slate-600 text-sm"
                                  style={{ color: "#ffffff" }}
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-400">Zona Recupero</Label>
                                <Select
                                  value={block.secondaryZone || "z1"}
                                  onValueChange={(value) => handleUpdateBlock(block.id, { secondaryZone: value })}
                                >
                                  <SelectTrigger className="h-8 bg-slate-700 border-slate-600 text-white text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    {["z1", "z2", "z3"].map((z) => (
                                      <SelectItem key={z} value={z} className="text-white">
                                        {z.toUpperCase()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!currentSession?.advancedBlocks || currentSession.advancedBlocks.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      Nessun blocco aggiunto. Seleziona un tipo di blocco dal menu sopra.
                    </div>
                  )}
                </div>

                {/* Workout Visualization */}
                {currentSession && <WorkoutVisualization blocks={currentSession.advancedBlocks} />}
              </TabsContent>

              {/* Gym Tab */}
              <TabsContent value="gym" className="space-y-4">
                {Object.entries(GYM_EXERCISES).map(([category, exercises]) => (
                  <div key={category}>
                    <Label className="text-slate-300 mb-2 block capitalize">{category}</Label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {exercises.map((exercise) => (
                        <Button
                          key={exercise}
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                          onClick={() => handleAddGymExercise(category as keyof typeof GYM_EXERCISES, exercise)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {exercise}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Added Exercises */}
                <div className="space-y-2">
                  {currentSession?.gymExercises.map((exercise) => (
                    <Card key={exercise.id} className="bg-slate-800 border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-slate-500" />
                            <span className="text-white font-medium">{exercise.name}</span>
                            <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                              {exercise.category}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-400 hover:text-red-300"
                            onClick={() => handleDeleteGymExercise(exercise.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs text-slate-400">Set</Label>
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) =>
                                handleUpdateGymExercise(exercise.id, { sets: Number.parseInt(e.target.value) || 0 })
                              }
                              className="w-full h-8 px-2 rounded bg-slate-700 border border-slate-600 text-sm"
                              style={{ color: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Rep</Label>
                            <input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) =>
                                handleUpdateGymExercise(exercise.id, { reps: Number.parseInt(e.target.value) || 0 })
                              }
                              className="w-full h-8 px-2 rounded bg-slate-700 border border-slate-600 text-sm"
                              style={{ color: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Kg</Label>
                            <input
                              type="number"
                              value={exercise.weight || 0}
                              onChange={(e) =>
                                handleUpdateGymExercise(exercise.id, { weight: Number.parseInt(e.target.value) || 0 })
                              }
                              className="w-full h-8 px-2 rounded bg-slate-700 border border-slate-600 text-sm"
                              style={{ color: "#ffffff" }}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-slate-400">Rest (s)</Label>
                            <input
                              type="number"
                              value={exercise.restBetweenSets}
                              onChange={(e) =>
                                handleUpdateGymExercise(exercise.id, {
                                  restBetweenSets: Number.parseInt(e.target.value) || 0,
                                })
                              }
                              className="w-full h-8 px-2 rounded bg-slate-700 border border-slate-600 text-sm"
                              style={{ color: "#ffffff" }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {(!currentSession?.gymExercises || currentSession.gymExercises.length === 0) && (
                    <div className="text-center py-8 text-slate-500">
                      Nessun esercizio aggiunto. Clicca su un esercizio sopra per aggiungerlo.
                    </div>
                  )}
                </div>

                {/* Summary */}
                {currentSession?.gymExercises && currentSession.gymExercises.length > 0 && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Totale esercizi:</span>
                        <span className="text-white">{currentSession.gymExercises.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Totale set:</span>
                        <span className="text-white">
                          {currentSession.gymExercises.reduce((sum, e) => sum + e.sets, 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuilderOpen(false)} className="border-slate-600 text-slate-300">
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Physiological Data Editor Dialog */}
      <Dialog open={showPhysioEditor} onOpenChange={setShowPhysioEditor}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Modifica Dati Fisiologici per {selectedAthlete?.user?.full_name || "Atleta"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 mb-2 block">FTP (W)</Label>
                <input
                  type="number"
                  value={manualFtp ?? ""}
                  onChange={(e) => setManualFtp(Number.parseInt(e.target.value) || null)}
                  placeholder={currentProfile?.ftp_watts?.toString() || "Non definito"}
                  className="w-full h-10 px-3 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">FC Max (bpm)</Label>
                <input
                  type="number"
                  value={manualHrMax ?? ""}
                  onChange={(e) => setManualHrMax(Number.parseInt(e.target.value) || null)}
                  placeholder={currentProfile?.hr_max?.toString() || "Non definito"}
                  className="w-full h-10 px-3 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* update dialog input to use hr_lt2 */}
              <div>
                <Label className="text-slate-300 mb-2 block">FC Soglia LT2 (bpm)</Label>
                <input
                  type="number"
                  value={manualHrLt2 ?? ""}
                  onChange={(e) => setManualHrLt2(Number.parseInt(e.target.value) || null)}
                  placeholder={currentProfile?.hr_lt2?.toString() || "Non definito"}
                  className="w-full h-10 px-3 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">FC Riposo (bpm)</Label>
                <input
                  type="number"
                  value={manualHrRest ?? ""}
                  onChange={(e) => setManualHrRest(Number.parseInt(e.target.value) || null)}
                  placeholder={currentProfile?.hr_rest?.toString() || "Non definito"}
                  className="w-full h-10 px-3 rounded-md bg-slate-700 border border-slate-600 text-white focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPhysioEditor(false)}
              className="border-slate-600 text-slate-300"
            >
              Annulla
            </Button>
            <Button onClick={handleSavePhysioData} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Calcola Zone e Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CoachTrainingPlanner
