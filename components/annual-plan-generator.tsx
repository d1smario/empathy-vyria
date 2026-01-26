"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Target,
  TrendingUp,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Flag,
  Trophy,
  Timer,
  Activity,
  BarChart3,
  Layers,
  Bike,
  Footprints,
  Waves,
  Mountain,
  Heart,
  Zap,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { AthleteDataType } from "@/components/dashboard-content"

interface EmpathyZone {
  name: string
  power_min: number
  power_max: number
  consumption?: {
    cho_g_h: number
    fat_g_h: number
    total_kcal_h: number
  }
}

interface HRZone {
  name: string
  min: number
  max: number
  color?: string
  consumption?: {
    cho_g_h: number
    fat_g_h: number
    total_kcal_h: number
  }
}

const SPORTS = [
  { id: "cycling", name: "Ciclismo", icon: Bike, supportsPower: true, color: "text-yellow-500" },
  { id: "running", name: "Corsa", icon: Footprints, supportsPower: false, color: "text-green-500" },
  { id: "swimming", name: "Nuoto", icon: Waves, supportsPower: false, color: "text-blue-500" },
  { id: "triathlon", name: "Triathlon", icon: Activity, supportsPower: true, color: "text-fuchsia-500" },
  { id: "trail_running", name: "Trail Running", icon: Mountain, supportsPower: false, color: "text-emerald-500" },
  { id: "mountain_bike", name: "MTB", icon: Bike, supportsPower: true, color: "text-orange-500" },
  { id: "gravel", name: "Gravel", icon: Bike, supportsPower: true, color: "text-amber-500" },
  { id: "cross_country_ski", name: "Sci Fondo", icon: Activity, supportsPower: false, color: "text-cyan-500" },
  { id: "ski_mountaineering", name: "Scialpinismo", icon: Mountain, supportsPower: false, color: "text-sky-500" },
  { id: "rowing", name: "Canottaggio", icon: Waves, supportsPower: true, color: "text-indigo-500" },
]

const ZONE_COLORS: Record<string, string> = {
  z1: "bg-gray-500",
  z2: "bg-blue-500",
  z3: "bg-green-500",
  z4: "bg-yellow-500",
  z5: "bg-orange-500",
  z6: "bg-red-500",
  z7: "bg-purple-500",
}

// Types
interface Event {
  id: string
  name: string
  date: string
  type: "event_a" | "event_b" | "event_c" | "training_camp" | "performance_test"
  priority: number
  powerTarget?: number
  durationMinutes?: number
  description?: string
}

interface Mesocycle {
  id: string
  name: string
  phase: "base" | "build" | "peak" | "race" | "recovery" | "transition"
  startDate: string
  endDate: string
  weeks: number
  focus: "endurance" | "threshold" | "vo2max" | "anaerobic" | "sprint" | "mixed"
  weeklyHoursTarget: number
  intensityDistribution: { [key: string]: number }
  weeksData: WeekData[]
}

interface WeekData {
  weekNumber: number
  startDate: string
  weekType: "load" | "load_high" | "recovery" | "test" | "race" | "taper"
  loadFactor: number
  plannedHours: number
  plannedTSS: number
}

interface AnnualPlanConfig {
  mesocycleLength: 3 | 4
  loadProgression: {
    week1: number
    week2: number
    week3: number
    week4?: number
  }
  baseWeeksMultiplier: number
  buildWeeksMultiplier: number
  peakWeeksMultiplier: number
  recoveryWeeksAfterRace: number
}

interface PhysiologicalGoals {
  targetFTP?: number
  targetVO2max?: number
  targetWeight?: number
  targetBodyFat?: number
  targetPowerToWeight?: number
}

interface AnnualPlanGeneratorProps {
  athleteData: AthleteDataType | null
  userName?: string | null
  onPlanGenerated?: (plan: any) => void
}

// Constants
const PHASE_COLORS: Record<string, string> = {
  base: "bg-blue-500",
  build: "bg-orange-500",
  peak: "bg-red-500",
  race: "bg-purple-500",
  recovery: "bg-green-500",
  transition: "bg-slate-500",
}

const PHASE_LABELS: Record<string, string> = {
  base: "Base",
  build: "Costruzione",
  peak: "Picco",
  race: "Gara",
  recovery: "Recupero",
  transition: "Transizione",
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  event_a: "Gara A (Obiettivo principale)",
  event_b: "Gara B (Importante)",
  event_c: "Gara C (Allenamento)",
  training_camp: "Training Camp",
  performance_test: "Test Performance",
}

const FOCUS_LABELS: Record<string, string> = {
  endurance: "Resistenza",
  threshold: "Soglia",
  vo2max: "VO2max",
  anaerobic: "Anaerobico",
  sprint: "Sprint",
  mixed: "Misto",
}

const DEFAULT_INTENSITY_DISTRIBUTION: Record<string, { [key: string]: number }> = {
  base: { z1: 25, z2: 55, z3: 15, z4: 5, z5: 0, z6: 0, z7: 0 },
  build: { z1: 15, z2: 45, z3: 20, z4: 15, z5: 5, z6: 0, z7: 0 },
  peak: { z1: 10, z2: 35, z3: 20, z4: 20, z5: 10, z6: 5, z7: 0 },
  race: { z1: 20, z2: 40, z3: 15, z4: 15, z5: 5, z6: 3, z7: 2 },
  recovery: { z1: 40, z2: 50, z3: 10, z4: 0, z5: 0, z6: 0, z7: 0 },
  transition: { z1: 50, z2: 40, z3: 10, z4: 0, z5: 0, z6: 0, z7: 0 },
}

const DEFAULT_3_WEEK_LOAD = { week1: 1.0, week2: 1.1, week3: 0.85 }
const DEFAULT_4_WEEK_LOAD = { week1: 1.0, week2: 1.1, week3: 1.15, week4: 0.8 }

export function AnnualPlanGenerator({ athleteData, userName, onPlanGenerated }: AnnualPlanGeneratorProps) {
  const supabase = createClient()

  // Plan state
  const [planName, setPlanName] = useState(`Piano ${new Date().getFullYear()}`)
  const [planYear, setPlanYear] = useState(new Date().getFullYear())
  const [mainGoalType, setMainGoalType] = useState<"event" | "performance" | "fitness">("event")
  const [mainGoalEvent, setMainGoalEvent] = useState("")
  const [mainGoalDate, setMainGoalDate] = useState("")
  const [mainGoalPower, setMainGoalPower] = useState<number | undefined>()
  const [mainGoalDuration, setMainGoalDuration] = useState<number | undefined>()

  const [primarySport, setPrimarySport] = useState("cycling")
  const [zoneType, setZoneType] = useState<"power" | "hr">("power")

  const [athleteFTP, setAthleteFTP] = useState<number | undefined>()
  const [athleteHRMax, setAthleteHRMax] = useState<number | undefined>()
  const [athleteHRThreshold, setAthleteHRThreshold] = useState<number | undefined>()
  const [athleteHRRest, setAthleteHRRest] = useState<number | undefined>()
  const [athleteVO2max, setAthleteVO2max] = useState<number | undefined>()

  const [empathyZones, setEmpathyZones] = useState<Record<string, EmpathyZone> | null>(null)
  const [hrZones, setHrZones] = useState<Record<string, HRZone> | null>(null)
  const [zonesLoaded, setZonesLoaded] = useState(false)

  // Volume targets
  const [annualHoursTarget, setAnnualHoursTarget] = useState(500)
  const [weeklyHoursMin, setWeeklyHoursMin] = useState(6)
  const [weeklyHoursMax, setWeeklyHoursMax] = useState(15)
  const [weeklyTSSCapacity, setWeeklyTSSCapacity] = useState(500)

  // Events
  const [events, setEvents] = useState<Event[]>([])

  // Mesocycles
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([])

  // Configuration
  const [config, setConfig] = useState<AnnualPlanConfig>({
    mesocycleLength: 3,
    loadProgression: DEFAULT_3_WEEK_LOAD,
    baseWeeksMultiplier: 1.2,
    buildWeeksMultiplier: 1.0,
    peakWeeksMultiplier: 0.8,
    recoveryWeeksAfterRace: 1,
  })

  // Physiological goals
  const [physioGoals, setPhysioGoals] = useState<PhysiologicalGoals>({})

  // UI state
  const [activeTab, setActiveTab] = useState("setup")
  const [expandedMesocycle, setExpandedMesocycle] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null)

  const selectedSport = SPORTS.find((s) => s.id === primarySport)
  const sportSupportsPower = selectedSport?.supportsPower ?? false

  // Load athlete zones from metabolic profile
  useEffect(() => {
    const loadAthleteZones = async () => {
      if (!athleteData?.id) return

      console.log("[v0] AnnualPlan: Loading zones from DB for athlete:", athleteData.id)

      const supabase = createClient()

      const { data: profiles, error } = await supabase
        .from("metabolic_profiles")
        .select("ftp_watts, vo2max, hr_max, hr_lt2, hr_rest, empathy_zones, hr_zones, is_current, updated_at")
        .eq("athlete_id", athleteData.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.log("[v0] AnnualPlan: Error loading profiles:", error.message)
        setZonesLoaded(true)
        return
      }

      // Find best profile: prefer one with FTP and empathy_zones
      let profile =
        profiles?.find((p) => p.ftp_watts && p.empathy_zones) || profiles?.find((p) => p.ftp_watts) || profiles?.[0]

      // Fallback to props
      if (!profile && athleteData.metabolic_profiles?.[0]) {
        console.log("[v0] AnnualPlan: Using props fallback")
        profile = athleteData.metabolic_profiles[0]
      }

      if (profile) {
        console.log(
          "[v0] AnnualPlan: Using profile with FTP:",
          profile.ftp_watts,
          "VO2max:",
          profile.vo2max,
          "HR Max:",
          profile.hr_max,
        )

        if (profile.ftp_watts) setAthleteFTP(profile.ftp_watts)
        if (profile.vo2max) setAthleteVO2max(profile.vo2max)
        if (profile.hr_max) setAthleteHRMax(profile.hr_max)
        if (profile.hr_lt2) setAthleteHRThreshold(profile.hr_lt2)
        if (profile.hr_rest) setAthleteHRRest(profile.hr_rest)

        if (profile.empathy_zones && typeof profile.empathy_zones === "object") {
          setEmpathyZones(profile.empathy_zones as Record<string, EmpathyZone>)
          console.log("[v0] AnnualPlan: Loaded empathy zones:", Object.keys(profile.empathy_zones))
        }

        if (profile.hr_zones && typeof profile.hr_zones === "object") {
          setHrZones(profile.hr_zones as Record<string, HRZone>)
          console.log("[v0] AnnualPlan: Loaded HR zones:", Object.keys(profile.hr_zones))
        }

        setZonesLoaded(true)
      } else {
        console.log("[v0] AnnualPlan: No profile found")
        setZonesLoaded(true)
      }
    }

    loadAthleteZones()

    // Load primary sport from athlete data
    if (athleteData?.primary_sport) {
      setPrimarySport(athleteData.primary_sport)
      const sport = SPORTS.find((s) => s.id === athleteData.primary_sport)
      if (sport && !sport.supportsPower) {
        setZoneType("hr")
      }
    }
  }, [athleteData])

  // Load existing plan if any
  useEffect(() => {
    const loadExistingPlan = async () => {
      if (!athleteData?.id) return

      console.log("[v0] loadExistingPlan: Loading plan for athlete", athleteData.id, "year", planYear)

      const { data: existingPlan, error } = await supabase
        .from("annual_training_plans")
        .select("*")
        .eq("athlete_id", athleteData.id)
        .eq("year", planYear)
        .maybeSingle()

      if (error) {
        console.log("[v0] loadExistingPlan: Error loading plan:", error.message)
        return
      }

      if (existingPlan) {
        console.log("[v0] loadExistingPlan: Found existing plan:", existingPlan.id, existingPlan.name)
        setExistingPlanId(existingPlan.id)
        setPlanName(existingPlan.name)

        const cfg = existingPlan.config_json || {}
        console.log("[v0] loadExistingPlan: Config keys:", Object.keys(cfg))

        setMainGoalType(cfg.main_goal_type || "event")
        setMainGoalEvent(cfg.main_goal_event || "")
        setMainGoalDate(cfg.main_goal_date || "")
        setMainGoalPower(cfg.main_goal_power_target)
        setMainGoalDuration(cfg.main_goal_duration_target)
        setAnnualHoursTarget(cfg.annual_hours_target || 500)
        setWeeklyHoursMin(cfg.weekly_hours_min || 6)
        setWeeklyHoursMax(cfg.weekly_hours_max || 15)
        setWeeklyTSSCapacity(cfg.weekly_tss_capacity || 600)
        if (cfg.plan_config) setConfig(cfg.plan_config)
        if (cfg.physio_goals) setPhysioGoals(cfg.physio_goals)
        if (cfg.sport) setPrimarySport(cfg.sport)
        if (cfg.zone_type) setZoneType(cfg.zone_type)

        // Load empathy and HR zones from config_json
        if (cfg.empathy_zones) {
          setEmpathyZones(cfg.empathy_zones)
          console.log("[v0] loadExistingPlan: Loaded empathy zones from config")
        }
        if (cfg.hr_zones) {
          setHrZones(cfg.hr_zones)
          console.log("[v0] loadExistingPlan: Loaded HR zones from config")
        }

        // Load events from config_json (since training_goals table may not exist)
        if (cfg.events && Array.isArray(cfg.events)) {
          setEvents(cfg.events)
          console.log("[v0] loadExistingPlan: Loaded", cfg.events.length, "events from config")
        }

        // Load mesocycles from config_json (since training_mesocycles table may not exist)
        if (cfg.mesocycles && Array.isArray(cfg.mesocycles)) {
          setMesocycles(cfg.mesocycles)
          console.log("[v0] loadExistingPlan: Loaded", cfg.mesocycles.length, "mesocycles from config")
        }

        console.log("[v0] loadExistingPlan: Plan loaded successfully")
      } else {
        console.log("[v0] loadExistingPlan: No existing plan found for year", planYear)
      }
    }

    loadExistingPlan()
  }, [athleteData?.id, planYear])

  // Set initial physio goals from athlete data
  useEffect(() => {
    if (athleteData?.metabolic_profiles?.[0]) {
      const profile = athleteData.metabolic_profiles[0]
      setPhysioGoals((prev) => ({
        ...prev,
        targetFTP: prev.targetFTP || (profile.ftp_watts ? Math.round(profile.ftp_watts * 1.05) : undefined),
        targetVO2max: prev.targetVO2max || (profile.vo2max ? Math.round(profile.vo2max * 1.03) : undefined),
      }))

      // Estimate weekly TSS capacity from FTP
      if (profile.ftp_watts) {
        const estimatedWeeklyTSS = Math.round(profile.ftp_watts * 1.5)
        setWeeklyTSSCapacity(estimatedWeeklyTSS)
      }
    }
    if (athleteData?.weight_kg) {
      setPhysioGoals((prev) => ({
        ...prev,
        targetWeight: prev.targetWeight || athleteData.weight_kg,
      }))
    }
  }, [athleteData])

  // Update load progression when mesocycle length changes
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      loadProgression: prev.mesocycleLength === 3 ? DEFAULT_3_WEEK_LOAD : DEFAULT_4_WEEK_LOAD,
    }))
  }, [config.mesocycleLength])

  // Add event
  const addEvent = () => {
    const newEvent: Event = {
      id: crypto.randomUUID(),
      name: "",
      date: "",
      type: "event_c",
      priority: 3,
    }
    setEvents([...events, newEvent])
  }

  // Update event
  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }

  // Remove event
  const removeEvent = (id: string) => {
    setEvents(events.filter((e) => e.id !== id))
  }

  // Calculate weeks between dates
  const weeksBetween = (start: string, end: string): number => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = endDate.getTime() - startDate.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
  }

  // Generate mesocycles automatically
  const generateMesocycles = () => {
    setGenerating(true)

    // Sort events by date
    const sortedEvents = [...events]
      .filter((e) => e.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Find main goal date (either from events or manual input)
    let targetDate = mainGoalDate
    if (!targetDate && sortedEvents.length > 0) {
      const mainEvent = sortedEvents.find((e) => e.type === "event_a") || sortedEvents[sortedEvents.length - 1]
      targetDate = mainEvent.date
    }

    if (!targetDate) {
      alert("Inserisci almeno una data obiettivo o un evento")
      setGenerating(false)
      return
    }

    const mesocycleWeeks = config.mesocycleLength
    const generatedMesocycles: Mesocycle[] = []

    // Start from beginning of year or 12 weeks before first event
    const yearStart = new Date(planYear, 0, 1)
    const firstEventDate = sortedEvents.length > 0 ? new Date(sortedEvents[0].date) : new Date(targetDate)

    // Calculate start date (Monday of that week)
    const currentDate = new Date(Math.min(yearStart.getTime(), firstEventDate.getTime() - 12 * 7 * 24 * 60 * 60 * 1000))
    const dayOfWeek = currentDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    currentDate.setDate(currentDate.getDate() + mondayOffset)

    const endOfSeason = new Date(targetDate)
    endOfSeason.setDate(endOfSeason.getDate() + 14) // 2 weeks after main goal for recovery

    // Calculate total weeks available
    const totalWeeks = weeksBetween(currentDate.toISOString().split("T")[0], endOfSeason.toISOString().split("T")[0])

    // Distribute phases
    const baseWeeks = Math.round(totalWeeks * 0.35) // 35% base
    const buildWeeks = Math.round(totalWeeks * 0.35) // 35% build
    const peakWeeks = Math.round(totalWeeks * 0.15) // 15% peak
    const raceWeeks = Math.round(totalWeeks * 0.1) // 10% race
    const recoveryWeeks = Math.round(totalWeeks * 0.05) // 5% recovery

    const phases: Array<{ phase: Mesocycle["phase"]; weeks: number; focus: Mesocycle["focus"] }> = [
      { phase: "base", weeks: baseWeeks, focus: "endurance" },
      { phase: "build", weeks: buildWeeks, focus: "threshold" },
      { phase: "peak", weeks: peakWeeks, focus: "vo2max" },
      { phase: "race", weeks: raceWeeks, focus: "mixed" },
      { phase: "recovery", weeks: recoveryWeeks, focus: "endurance" },
    ]

    let mesocycleIndex = 1
    for (const phaseInfo of phases) {
      if (phaseInfo.weeks <= 0) continue

      let remainingWeeks = phaseInfo.weeks
      let subIndex = 1

      while (remainingWeeks > 0) {
        const weeksForThisMeso = Math.min(mesocycleWeeks, remainingWeeks)
        const startDateStr = currentDate.toISOString().split("T")[0]

        const endDate = new Date(currentDate)
        endDate.setDate(endDate.getDate() + weeksForThisMeso * 7 - 1)
        const endDateStr = endDate.toISOString().split("T")[0]

        // Generate weeks data
        const weeksData: WeekData[] = []
        const baseHours = (weeklyHoursMin + weeklyHoursMax) / 2
        const loadProgression = config.loadProgression

        for (let w = 1; w <= weeksForThisMeso; w++) {
          const weekStart = new Date(currentDate)
          weekStart.setDate(weekStart.getDate() + (w - 1) * 7)

          let loadFactor: number
          let weekType: WeekData["weekType"]

          if (weeksForThisMeso === 3) {
            loadFactor = w === 1 ? loadProgression.week1 : w === 2 ? loadProgression.week2 : loadProgression.week3
            weekType = w === 3 ? "recovery" : w === 2 ? "load_high" : "load"
          } else {
            loadFactor =
              w === 1
                ? loadProgression.week1
                : w === 2
                  ? loadProgression.week2
                  : w === 3
                    ? loadProgression.week3 || 1.15
                    : loadProgression.week4 || 0.8
            weekType = w === 4 ? "recovery" : w === 3 ? "load_high" : w === 2 ? "load_high" : "load"
          }

          // Adjust for phase
          if (phaseInfo.phase === "base") loadFactor *= config.baseWeeksMultiplier
          if (phaseInfo.phase === "build") loadFactor *= config.buildWeeksMultiplier
          if (phaseInfo.phase === "peak") loadFactor *= config.peakWeeksMultiplier
          if (phaseInfo.phase === "race") weekType = "race"
          if (phaseInfo.phase === "recovery") {
            weekType = "recovery"
            loadFactor = 0.6
          }

          const plannedHours = Math.round(baseHours * loadFactor * 10) / 10
          const avgIntensity = phaseInfo.phase === "base" ? 0.65 : phaseInfo.phase === "build" ? 0.75 : 0.8
          const plannedTSS = Math.round(plannedHours * 100 * avgIntensity)

          weeksData.push({
            weekNumber: w,
            startDate: weekStart.toISOString().split("T")[0],
            weekType,
            loadFactor: Math.round(loadFactor * 100) / 100,
            plannedHours,
            plannedTSS: Math.min(plannedTSS, weeklyTSSCapacity * loadFactor),
          })
        }

        generatedMesocycles.push({
          id: crypto.randomUUID(),
          name: `${PHASE_LABELS[phaseInfo.phase]} ${subIndex}`,
          phase: phaseInfo.phase,
          startDate: startDateStr,
          endDate: endDateStr,
          weeks: weeksForThisMeso,
          focus: phaseInfo.focus,
          weeklyHoursTarget: baseHours,
          intensityDistribution: DEFAULT_INTENSITY_DISTRIBUTION[phaseInfo.phase],
          weeksData,
        })

        currentDate.setDate(currentDate.getDate() + weeksForThisMeso * 7)
        remainingWeeks -= weeksForThisMeso
        mesocycleIndex++
        subIndex++
      }
    }

    setMesocycles(generatedMesocycles)
    setGenerating(false)
  }

  // Update mesocycle
  const updateMesocycle = (id: string, updates: Partial<Mesocycle>) => {
    setMesocycles(mesocycles.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  // Update week data within mesocycle
  const updateWeekData = (mesocycleId: string, weekNumber: number, updates: Partial<WeekData>) => {
    setMesocycles(
      mesocycles.map((m) =>
        m.id === mesocycleId
          ? {
              ...m,
              weeksData: m.weeksData.map((w) => (w.weekNumber === weekNumber ? { ...w, ...updates } : w)),
            }
          : m,
      ),
    )
  }

  // Remove mesocycle
  const removeMesocycle = (id: string) => {
    setMesocycles(mesocycles.filter((m) => m.id !== id))
  }

  // Calculate totals
  const totalPlannedHours = useMemo(() => {
    return mesocycles.reduce((sum, m) => sum + m.weeksData.reduce((wSum, w) => wSum + w.plannedHours, 0), 0)
  }, [mesocycles])

  const totalPlannedTSS = useMemo(() => {
    return mesocycles.reduce((sum, m) => sum + m.weeksData.reduce((wSum, w) => wSum + w.plannedTSS, 0), 0)
  }, [mesocycles])

  const totalWeeks = useMemo(() => {
    return mesocycles.reduce((sum, m) => sum + m.weeks, 0)
  }, [mesocycles])

  // Save plan
  const savePlan = async () => {
    if (!athleteData?.id) {
      alert("Dati atleta non disponibili")
      return
    }

    setSaving(true)
    setSaveSuccess(false)
    console.log("[v0] savePlan: Starting save for athlete:", athleteData.id)

    try {
      // All other fields go into config_json to avoid schema mismatches
      const planData = {
        athlete_id: athleteData.id,
        year: planYear,
        name: planName,
        status: "active",
        config_json: {
          // Main goal data
          main_goal_type: mainGoalType,
          main_goal_event: mainGoalEvent,
          main_goal_date: mainGoalDate || null,
          main_goal_power_target: mainGoalPower || null,
          main_goal_duration_target: mainGoalDuration || null,
          // Hours and TSS
          weekly_hours_min: weeklyHoursMin,
          weekly_hours_max: weeklyHoursMax,
          annual_hours_target: annualHoursTarget,
          weekly_tss_capacity: weeklyTSSCapacity,
          // Plan configuration
          plan_config: config,
          physio_goals: physioGoals,
          // Sport and zones
          sport: primarySport,
          zone_type: zoneType,
          athlete_ftp: athleteFTP,
          athlete_hr_max: athleteHRMax,
          athlete_hr_lt2: athleteHRThreshold,
          empathy_zones: empathyZones,
          hr_zones: hrZones,
          // Save events and mesocycles in config_json
          events: events,
          mesocycles: mesocycles,
        },
      }

      console.log("[v0] savePlan: Plan data prepared", { name: planName, year: planYear })

      let planId = existingPlanId

      if (!planId) {
        const { data: existingPlan } = await supabase
          .from("annual_training_plans")
          .select("id")
          .eq("athlete_id", athleteData.id)
          .eq("year", planYear)
          .single()

        if (existingPlan?.id) {
          planId = existingPlan.id
          setExistingPlanId(planId)
          console.log("[v0] savePlan: Found existing plan for this year:", planId)
        }
      }

      if (planId) {
        console.log("[v0] savePlan: Updating existing plan:", planId)
        const { error: updateError } = await supabase.from("annual_training_plans").update(planData).eq("id", planId)

        if (updateError) {
          console.error("[v0] savePlan: Update error:", updateError.message)
          throw updateError
        }
        console.log("[v0] savePlan: Plan updated successfully")
      } else {
        console.log("[v0] savePlan: Creating new plan")
        const { data: newPlan, error: insertError } = await supabase
          .from("annual_training_plans")
          .insert(planData)
          .select("id")
          .single()

        if (insertError) {
          console.error("[v0] savePlan: Insert error:", insertError.message)
          throw insertError
        }

        planId = newPlan?.id
        setExistingPlanId(planId)
        console.log("[v0] savePlan: New plan created with id:", planId)
      }

      if (!planId) {
        throw new Error("No plan ID after save")
      }

      // Remove old related data if using separate tables
      console.log("[v0] savePlan: Cleaning up existing goals and mesocycles (if tables exist)")
      try {
        await supabase.from("training_goals").delete().eq("annual_plan_id", planId)
      } catch (e) {
        // Ignore if table doesn't exist
      }

      try {
        await supabase.from("training_mesocycles").delete().eq("annual_plan_id", planId)
      } catch (e) {
        // Ignore if table doesn't exist
      }

      // Insert new related data (events and mesocycles) into separate tables if they exist
      // NOTE: This part might need adjustment based on your actual DB schema and if you intend to use separate tables or rely solely on config_json
      if (events.length > 0) {
        console.log("[v0] savePlan: Inserting", events.length, "events into training_goals table")
        const { error: goalsError } = await supabase.from("training_goals").insert(
          events.map((e) => ({
            annual_plan_id: planId,
            name: e.name,
            goal_type: e.type,
            goal_date: e.date,
            priority: e.priority || 2,
          })),
        )
        if (goalsError) {
          console.warn("[v0] savePlan: Training goals insert failed:", goalsError.message)
        }
      }

      if (mesocycles.length > 0) {
        console.log("[v0] savePlan: Inserting", mesocycles.length, "mesocycles into training_mesocycles table")
        for (const meso of mesocycles) {
          const { data: newMeso, error: mesoError } = await supabase
            .from("training_mesocycles")
            .insert({
              annual_plan_id: planId,
              name: meso.name,
              phase: meso.phase,
              start_date: meso.startDate,
              end_date: meso.endDate,
              weeks: meso.weeks,
              // Add other relevant fields if they exist in your schema
            })
            .select("id")
            .single()

          if (mesoError) {
            console.warn("[v0] savePlan: Mesocycle insert failed:", mesoError.message)
            continue
          }

          if (newMeso?.id && meso.weeksData && meso.weeksData.length > 0) {
            const { error: weeksError } = await supabase.from("training_weeks").insert(
              meso.weeksData.map((w) => ({
                mesocycle_id: newMeso.id,
                week_number: w.weekNumber,
                start_date: w.startDate,
                week_type: w.weekType,
                load_factor: w.loadFactor,
                planned_tss: w.plannedTSS,
                // Add other relevant fields if they exist in your schema
              })),
            )

            if (weeksError) {
              console.warn("[v0] savePlan: Training weeks insert failed:", weeksError.message)
            }
          }
        }
      }

      console.log("[v0] savePlan: Plan saved successfully!")
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)

      if (onPlanGenerated) {
        onPlanGenerated({
          planId,
          mesocycles,
          events,
          config,
        })
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] savePlan: Error:", errorMessage)
      alert("Errore nel salvataggio del piano: " + errorMessage)
    }

    setSaving(false)
  }

  const deletePlan = async () => {
    if (!athleteData?.id) {
      alert("Dati atleta non disponibili")
      return
    }

    if (!existingPlanId) {
      alert("Nessun piano da eliminare")
      return
    }

    // Confirmation dialog
    const confirmed = confirm(
      `Sei sicuro di voler eliminare il piano annuale "${planName}" del ${planYear}?\n\nQuesta azione eliminerà anche tutti gli allenamenti generati dal piano e non può essere annullata.`,
    )

    if (!confirmed) return

    setSaving(true)
    console.log("[v0] deletePlan: Starting delete for plan:", existingPlanId)

    try {
      // Delete related training_activities generated from this plan
      const { error: activitiesError } = await supabase
        .from("training_activities")
        .delete()
        .eq("athlete_id", athleteData.id)
        .eq("source", "annual_plan_generated")

      if (activitiesError) {
        console.warn("[v0] deletePlan: Error deleting activities:", activitiesError.message)
      }

      // Delete training_weeks if table exists
      try {
        const { data: mesocycleIds } = await supabase
          .from("training_mesocycles")
          .select("id")
          .eq("annual_plan_id", existingPlanId)

        if (mesocycleIds && mesocycleIds.length > 0) {
          for (const meso of mesocycleIds) {
            await supabase.from("training_weeks").delete().eq("mesocycle_id", meso.id)
          }
        }
      } catch (e) {
        // Ignore if table doesn't exist
      }

      // Delete training_mesocycles if table exists
      try {
        await supabase.from("training_mesocycles").delete().eq("annual_plan_id", existingPlanId)
      } catch (e) {
        // Ignore if table doesn't exist
      }

      // Delete training_goals if table exists
      try {
        await supabase.from("training_goals").delete().eq("annual_plan_id", existingPlanId)
      } catch (e) {
        // Ignore if table doesn't exist
      }

      // Delete the annual plan itself
      const { error: planError } = await supabase.from("annual_training_plans").delete().eq("id", existingPlanId)

      if (planError) {
        console.error("[v0] deletePlan: Error deleting plan:", planError.message)
        throw planError
      }

      console.log("[v0] deletePlan: Plan deleted successfully")

      // Reset state
      setExistingPlanId(null)
      setMesocycles([])
      setEvents([])
      setPlanName(`Piano ${planYear}`)
      setMainGoalDate("")
      setPhysioGoals({})

      alert("Piano eliminato con successo!")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] deletePlan: Error:", errorMessage)
      alert("Errore nell'eliminazione del piano: " + errorMessage)
    }

    setSaving(false)
  }

  const generateWeeklyWorkouts = async () => {
    if (!athleteData?.id || mesocycles.length === 0) {
      alert("Prima genera i mesocicli cliccando 'Genera Piano'")
      return
    }

    setGenerating(true)
    console.log("[v0] generateWeeklyWorkouts: Starting workout generation for", mesocycles.length, "mesocycles")

    try {
      // First, delete existing planned workouts for this athlete in the plan period
      const firstMeso = mesocycles[0]
      const lastMeso = mesocycles[mesocycles.length - 1]

      if (firstMeso?.startDate && lastMeso?.endDate) {
        console.log(
          "[v0] generateWeeklyWorkouts: Deleting existing workouts from",
          firstMeso.startDate,
          "to",
          lastMeso.endDate,
        )
        await supabase
          .from("training_activities")
          .delete()
          .eq("athlete_id", athleteData.id)
          .gte("activity_date", firstMeso.startDate)
          .lte("activity_date", lastMeso.endDate)
      }

      const workoutsToInsert: any[] = []

      // Workout templates by phase and intensity
      const phaseWorkouts: Record<
        string,
        Array<{
          dayOffset: number
          type: string
          zone: string
          durationFactor: number
          description: string
        }>
      > = {
        base: [
          { dayOffset: 0, type: "endurance", zone: "Z2", durationFactor: 0.8, description: "Endurance Z2" },
          { dayOffset: 1, type: "recovery", zone: "Z1", durationFactor: 0.5, description: "Recupero attivo" },
          { dayOffset: 2, type: "endurance", zone: "Z2", durationFactor: 1.0, description: "Fondo lungo Z2" },
          { dayOffset: 3, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 4, type: "tempo", zone: "Z3", durationFactor: 0.7, description: "Tempo Z3" },
          { dayOffset: 5, type: "long", zone: "Z2", durationFactor: 1.5, description: "Lungo Z2" },
          { dayOffset: 6, type: "recovery", zone: "Z1", durationFactor: 0.4, description: "Recupero" },
        ],
        build: [
          { dayOffset: 0, type: "threshold", zone: "Z4", durationFactor: 0.8, description: "Soglia Z4" },
          { dayOffset: 1, type: "recovery", zone: "Z1", durationFactor: 0.5, description: "Recupero" },
          { dayOffset: 2, type: "intervals", zone: "Z5", durationFactor: 0.7, description: "Intervalli VO2max" },
          { dayOffset: 3, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 4, type: "tempo", zone: "Z3", durationFactor: 0.8, description: "Tempo Z3" },
          { dayOffset: 5, type: "long", zone: "Z2", durationFactor: 1.3, description: "Lungo con progressione" },
          { dayOffset: 6, type: "recovery", zone: "Z1", durationFactor: 0.4, description: "Recupero" },
        ],
        peak: [
          { dayOffset: 0, type: "vo2max", zone: "Z5", durationFactor: 0.7, description: "VO2max intervals" },
          { dayOffset: 1, type: "recovery", zone: "Z1", durationFactor: 0.5, description: "Recupero" },
          { dayOffset: 2, type: "threshold", zone: "Z4", durationFactor: 0.8, description: "Soglia" },
          { dayOffset: 3, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 4, type: "anaerobic", zone: "Z6", durationFactor: 0.6, description: "Anaerobico" },
          { dayOffset: 5, type: "endurance", zone: "Z2", durationFactor: 1.0, description: "Endurance" },
          { dayOffset: 6, type: "recovery", zone: "Z1", durationFactor: 0.4, description: "Recupero" },
        ],
        race: [
          { dayOffset: 0, type: "openers", zone: "Z4", durationFactor: 0.5, description: "Openers pre-gara" },
          { dayOffset: 1, type: "recovery", zone: "Z1", durationFactor: 0.4, description: "Recupero leggero" },
          { dayOffset: 2, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 3, type: "activation", zone: "Z3", durationFactor: 0.4, description: "Attivazione" },
          { dayOffset: 4, type: "rest", zone: "", durationFactor: 0, description: "Riposo pre-gara" },
          { dayOffset: 5, type: "race", zone: "Z4", durationFactor: 1.0, description: "GARA" },
          { dayOffset: 6, type: "recovery", zone: "Z1", durationFactor: 0.3, description: "Recupero post-gara" },
        ],
        recovery: [
          { dayOffset: 0, type: "recovery", zone: "Z1", durationFactor: 0.4, description: "Recupero" },
          { dayOffset: 1, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 2, type: "recovery", zone: "Z1", durationFactor: 0.5, description: "Recupero attivo" },
          { dayOffset: 3, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 4, type: "endurance", zone: "Z2", durationFactor: 0.5, description: "Endurance leggero" },
          { dayOffset: 5, type: "recovery", zone: "Z1", durationFactor: 0.4, description: "Recupero" },
          { dayOffset: 6, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
        ],
        transition: [
          { dayOffset: 0, type: "cross_training", zone: "Z1", durationFactor: 0.5, description: "Cross training" },
          { dayOffset: 1, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 2, type: "recovery", zone: "Z1", durationFactor: 0.4, description: "Attività leggera" },
          { dayOffset: 3, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 4, type: "cross_training", zone: "Z1", durationFactor: 0.5, description: "Cross training" },
          { dayOffset: 5, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
          { dayOffset: 6, type: "rest", zone: "", durationFactor: 0, description: "Riposo" },
        ],
      }

      // Calculate TSS based on zone and duration
      const calculateTSS = (zone: string, durationMinutes: number): number => {
        const tssPerHour: Record<string, number> = {
          Z1: 40,
          Z2: 55,
          Z3: 70,
          Z4: 90,
          Z5: 110,
          Z6: 140,
          Z7: 180,
          "": 0,
        }
        return Math.round((durationMinutes / 60) * (tssPerHour[zone] || 50))
      }

      // Get power/HR range for zone
      const getZoneRange = (zone: string): { powerMin?: number; powerMax?: number; hrMin?: number; hrMax?: number } => {
        if (zoneType === "power" && empathyZones) {
          const zoneKey = zone.toLowerCase()
          const zoneData = empathyZones[zoneKey]
          if (zoneData) {
            return { powerMin: zoneData.power_min, powerMax: zoneData.power_max }
          }
        } else if (zoneType === "hr" && hrZones) {
          const zoneKey = zone.toLowerCase()
          const zoneData = hrZones[zoneKey]
          if (zoneData) {
            return { hrMin: zoneData.min, hrMax: zoneData.max }
          }
        }
        return {}
      }

      // Generate workouts for each mesocycle and week
      for (const meso of mesocycles) {
        const phaseTemplate = phaseWorkouts[meso.phase] || phaseWorkouts.base
        const baseHoursPerDay = (meso.weeklyHoursTarget / 7) * 60 // Convert to minutes

        for (const weekData of meso.weeksData || []) {
          const weekStartDate = new Date(weekData.startDate)

          for (const workout of phaseTemplate) {
            if (workout.durationFactor === 0) continue // Skip rest days

            const workoutDate = new Date(weekStartDate)
            workoutDate.setDate(workoutDate.getDate() + workout.dayOffset)
            const dateStr = workoutDate.toISOString().split("T")[0]

            // Adjust duration based on week load factor
            const baseDuration = baseHoursPerDay * workout.durationFactor
            const adjustedDuration = Math.round(baseDuration * weekData.loadFactor)

            if (adjustedDuration < 15) continue // Skip very short workouts

            const zoneRange = getZoneRange(workout.zone)
            const tss = calculateTSS(workout.zone, adjustedDuration)

            workoutsToInsert.push({
              athlete_id: athleteData.id,
              activity_date: dateStr,
              sport: primarySport,
              activity_type: workout.type,
              duration_minutes: adjustedDuration,
              title: `${PHASE_LABELS[meso.phase]} - ${workout.description}`,
              description: `${workout.description} (${meso.name} - Sett.${weekData.weekNumber})`,
              target_zone: workout.zone,
              tss: tss,
              completed: false,
              source: "annual_plan_generated", // Mark as generated by the plan
              workout_data: {
                phase: meso.phase,
                mesocycleName: meso.name,
                weekNumber: weekData.weekNumber,
                weekType: weekData.weekType,
                loadFactor: weekData.loadFactor,
                zoneType: zoneType,
                ...zoneRange,
              },
            })
          }
        }
      }

      console.log("[v0] generateWeeklyWorkouts: Inserting", workoutsToInsert.length, "workouts")

      // Insert in batches of 100
      const batchSize = 100
      for (let i = 0; i < workoutsToInsert.length; i += batchSize) {
        const batch = workoutsToInsert.slice(i, i + batchSize)
        const { error } = await supabase.from("training_activities").insert(batch)

        if (error) {
          console.error("[v0] generateWeeklyWorkouts: Batch insert error:", error.message)
          throw error
        }
        console.log("[v0] generateWeeklyWorkouts: Inserted batch", Math.floor(i / batchSize) + 1)
      }

      console.log("[v0] generateWeeklyWorkouts: All workouts generated successfully!")
      alert(`Piano generato con ${workoutsToInsert.length} allenamenti! Vai in Activities per visualizzarli.`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] generateWeeklyWorkouts: Error:", errorMessage)
      alert("Errore nella generazione degli allenamenti: " + errorMessage)
    }

    setGenerating(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-fuchsia-500" />
            Piano Annuale {planYear}
          </h2>
          <p className="text-muted-foreground">Genera e personalizza il tuo piano di periodizzazione</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {existingPlanId && (
            <Button
              onClick={deletePlan}
              disabled={saving}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10 bg-transparent"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Elimina Piano
            </Button>
          )}
          <Button
            onClick={generateMesocycles}
            disabled={generating}
            variant="outline"
            className="border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/10 bg-transparent"
          >
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Genera Piano
          </Button>
          <Button
            onClick={() => generateWeeklyWorkouts()}
            disabled={generating || mesocycles.length === 0}
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-500/10 bg-transparent"
          >
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
            Genera Allenamenti
          </Button>
          <Button onClick={savePlan} disabled={saving} className="bg-fuchsia-600 hover:bg-fuchsia-700">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveSuccess ? "Salvato!" : "Salva Piano"}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
                <Timer className="h-6 w-6 text-fuchsia-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ore Pianificate</p>
                <p className="text-2xl font-bold">{Math.round(totalPlannedHours)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TSS Totale</p>
                <p className="text-2xl font-bold">{totalPlannedTSS.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Layers className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mesocicli</p>
                <p className="text-2xl font-bold">{mesocycles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Settimane</p>
                <p className="text-2xl font-bold">{totalWeeks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Setup</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Eventi</span>
          </TabsTrigger>
          <TabsTrigger value="mesocycles" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Mesocicli</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Obiettivi</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Plan Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informazioni Piano</CardTitle>
                <CardDescription>Configura i dettagli del piano annuale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Piano</Label>
                  <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Piano 2024" />
                </div>
                <div className="space-y-2">
                  <Label>Anno</Label>
                  <Select value={planYear.toString()} onValueChange={(v) => setPlanYear(Number.parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Obiettivo Principale</Label>
                  <Select value={mainGoalType} onValueChange={(v: any) => setMainGoalType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Gara/Evento</SelectItem>
                      <SelectItem value="performance">Performance Target</SelectItem>
                      <SelectItem value="fitness">Fitness Generale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {mainGoalType === "event" && (
                  <>
                    <div className="space-y-2">
                      <Label>Nome Evento</Label>
                      <Input
                        value={mainGoalEvent}
                        onChange={(e) => setMainGoalEvent(e.target.value)}
                        placeholder="Es. Maratona Roma"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Evento</Label>
                      <Input type="date" value={mainGoalDate} onChange={(e) => setMainGoalDate(e.target.value)} />
                    </div>
                  </>
                )}

                {mainGoalType === "performance" && (
                  <>
                    <div className="space-y-2">
                      <Label>Target Potenza (W)</Label>
                      <Input
                        type="number"
                        value={mainGoalPower || ""}
                        onChange={(e) => setMainGoalPower(Number.parseInt(e.target.value) || undefined)}
                        placeholder="Es. 300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Durata Target (min)</Label>
                      <Input
                        type="number"
                        value={mainGoalDuration || ""}
                        onChange={(e) => setMainGoalDuration(Number.parseInt(e.target.value) || undefined)}
                        placeholder="Es. 60"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-fuchsia-500" />
                  Sport e Parametro
                </CardTitle>
                <CardDescription>Seleziona lo sport principale e il parametro di riferimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sport Selection Grid */}
                <div className="space-y-3">
                  <Label>Sport Principale</Label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {SPORTS.map((sport) => {
                      const Icon = sport.icon
                      return (
                        <button
                          key={sport.id}
                          onClick={() => {
                            setPrimarySport(sport.id)
                            // Switch to HR if sport doesn't support power
                            if (!sport.supportsPower && zoneType === "power") {
                              setZoneType("hr")
                            }
                          }}
                          className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                            primarySport === sport.id
                              ? "border-fuchsia-500 bg-fuchsia-500/10"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <Icon className={`h-5 w-5 ${sport.color}`} />
                          <span className="text-xs">{sport.name}</span>
                          {sport.supportsPower && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              PWR
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Parameter Selection */}
                <div className="space-y-3">
                  <Label>Parametro di Riferimento</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setZoneType("hr")}
                      className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                        zoneType === "hr"
                          ? "border-red-500 bg-red-500/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <Heart className="h-6 w-6 text-red-500" />
                      <div className="text-left">
                        <div className="font-semibold">Frequenza Cardiaca</div>
                        <div className="text-sm text-muted-foreground">Zone basate su HR</div>
                      </div>
                    </button>
                    <button
                      onClick={() => sportSupportsPower && setZoneType("power")}
                      disabled={!sportSupportsPower}
                      className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                        zoneType === "power"
                          ? "border-yellow-500 bg-yellow-500/10"
                          : sportSupportsPower
                            ? "border-border hover:border-muted-foreground"
                            : "border-border opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <Zap className="h-6 w-6 text-yellow-500" />
                      <div className="text-left">
                        <div className="font-semibold">Potenza</div>
                        <div className="text-sm text-muted-foreground">
                          {sportSupportsPower ? "Zone basate su FTP" : "Non disponibile"}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Athlete Values from Analysis/VYRIA Zones */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Valori Atleta (da Analisi/Zone VYRIA)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {zoneType === "power" ? (
                      <>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground">FTP Attuale</div>
                          <div className="text-lg font-bold text-yellow-500">
                            {athleteFTP ? `${athleteFTP}W` : "N/D"}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground">VO2max</div>
                          <div className="text-lg font-bold text-blue-500">
                            {athleteVO2max ? `${athleteVO2max}` : "N/D"}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground">HR Max</div>
                          <div className="text-lg font-bold text-red-500">
                            {athleteHRMax ? `${athleteHRMax} bpm` : "N/D"}
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <div className="text-xs text-muted-foreground">HR Soglia</div>
                          <div className="text-lg font-bold text-orange-500">
                            {athleteHRThreshold ? `${athleteHRThreshold} bpm` : "N/D"}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {zoneType === "power" && empathyZones && Object.keys(empathyZones).length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <Label className="text-xs text-muted-foreground">Zone Potenza (Empathy)</Label>
                      <div className="grid grid-cols-7 gap-1">
                        {["z1", "z2", "z3", "z4", "z5", "z6", "z7"].map((zoneKey) => {
                          const zone = empathyZones[zoneKey] || empathyZones[zoneKey.toUpperCase()]
                          if (!zone) return null
                          return (
                            <div
                              key={zoneKey}
                              className={`p-2 rounded text-center text-white text-xs ${ZONE_COLORS[zoneKey]}`}
                            >
                              <div className="font-bold">{zoneKey.toUpperCase()}</div>
                              <div className="text-[10px] opacity-90">
                                {zone.power_min}-{zone.power_max}W
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : zoneType === "hr" && hrZones && Object.keys(hrZones).length > 0 ? (
                    <div className="mt-4 space-y-2">
                      <Label className="text-xs text-muted-foreground">Zone Frequenza Cardiaca</Label>
                      <div className="grid grid-cols-5 gap-1">
                        {["z1", "z2", "z3", "z4", "z5"].map((zoneKey) => {
                          const zone = hrZones[zoneKey] || hrZones[zoneKey.toUpperCase()]
                          if (!zone) return null
                          return (
                            <div
                              key={zoneKey}
                              className={`p-2 rounded text-center text-white text-xs ${ZONE_COLORS[zoneKey]}`}
                            >
                              <div className="font-bold">{zoneKey.toUpperCase()}</div>
                              <div className="text-[10px] opacity-90">
                                {zone.min}-{zone.max} bpm
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-amber-500">
                        {zoneType === "power"
                          ? "Zone potenza non trovate. Vai alla sezione Zone in VYRIA o Analisi per configurarle."
                          : "Zone HR non trovate. Vai alla sezione Zone in VYRIA o Analisi per configurarle."}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Volume Config */}
            <Card>
              <CardHeader>
                <CardTitle>Volume e Carico</CardTitle>
                <CardDescription>Configura i parametri di volume settimanale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ore Annuali Target: {annualHoursTarget}h</Label>
                  <Slider
                    value={[annualHoursTarget]}
                    onValueChange={([v]) => setAnnualHoursTarget(v)}
                    min={200}
                    max={1000}
                    step={50}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ore/Sett Min: {weeklyHoursMin}h</Label>
                    <Slider
                      value={[weeklyHoursMin]}
                      onValueChange={([v]) => setWeeklyHoursMin(v)}
                      min={3}
                      max={15}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ore/Sett Max: {weeklyHoursMax}h</Label>
                    <Slider
                      value={[weeklyHoursMax]}
                      onValueChange={([v]) => setWeeklyHoursMax(v)}
                      min={5}
                      max={30}
                      step={1}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>TSS Settimanale Sostenibile: {weeklyTSSCapacity}</Label>
                  <Slider
                    value={[weeklyTSSCapacity]}
                    onValueChange={([v]) => setWeeklyTSSCapacity(v)}
                    min={200}
                    max={1200}
                    step={50}
                  />
                  <p className="text-xs text-muted-foreground">Capacita massima di carico settimanale sostenibile</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Durata Mesociclo</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={config.mesocycleLength === 3 ? "default" : "outline"}
                      onClick={() => setConfig({ ...config, mesocycleLength: 3 })}
                      className={config.mesocycleLength === 3 ? "bg-fuchsia-600" : ""}
                    >
                      3 Settimane
                    </Button>
                    <Button
                      variant={config.mesocycleLength === 4 ? "default" : "outline"}
                      onClick={() => setConfig({ ...config, mesocycleLength: 4 })}
                      className={config.mesocycleLength === 4 ? "bg-fuchsia-600" : ""}
                    >
                      4 Settimane
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Progressione Carico</Label>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-medium">Sett 1</p>
                      <p className="text-fuchsia-400">{Math.round(config.loadProgression.week1 * 100)}%</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-medium">Sett 2</p>
                      <p className="text-fuchsia-400">{Math.round(config.loadProgression.week2 * 100)}%</p>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <p className="font-medium">Sett 3</p>
                      <p className="text-fuchsia-400">{Math.round(config.loadProgression.week3 * 100)}%</p>
                    </div>
                    {config.mesocycleLength === 4 && (
                      <div className="text-center p-2 bg-muted rounded">
                        <p className="font-medium">Sett 4</p>
                        <p className="text-green-400">{Math.round((config.loadProgression.week4 || 0.8) * 100)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Eventi e Gare</CardTitle>
                <CardDescription>Aggiungi gli eventi chiave della stagione</CardDescription>
              </div>
              <Button onClick={addEvent} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Evento
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun evento aggiunto</p>
                  <p className="text-sm">Aggiungi gare e obiettivi per generare il piano</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label>Nome Evento</Label>
                          <Input
                            value={event.name}
                            onChange={(e) => updateEvent(event.id, { name: e.target.value })}
                            placeholder="Nome evento"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Data</Label>
                          <Input
                            type="date"
                            value={event.date}
                            onChange={(e) => updateEvent(event.id, { date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select value={event.type} onValueChange={(v: any) => updateEvent(event.id, { type: v })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEvent(event.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mesocycles Tab */}
        <TabsContent value="mesocycles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mesocicli</CardTitle>
              <CardDescription>Visualizza e modifica i blocchi di allenamento generati</CardDescription>
            </CardHeader>
            <CardContent>
              {mesocycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun mesociclo generato</p>
                  <p className="text-sm mb-4">Configura il piano e clicca "Genera Piano"</p>
                  <Button onClick={generateMesocycles} disabled={generating}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
                    Genera Mesocicli
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {mesocycles.map((meso) => (
                      <Card
                        key={meso.id}
                        className="border-l-4"
                        style={{
                          borderLeftColor: `var(--${meso.phase === "base" ? "blue" : meso.phase === "build" ? "orange" : meso.phase === "peak" ? "red" : meso.phase === "race" ? "purple" : meso.phase === "recovery" ? "green" : "slate"}-500)`,
                        }}
                      >
                        <CardHeader className="pb-2">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedMesocycle(expandedMesocycle === meso.id ? null : meso.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Badge className={`${PHASE_COLORS[meso.phase]} text-white`}>
                                {PHASE_LABELS[meso.phase]}
                              </Badge>
                              <div>
                                <CardTitle className="text-lg">{meso.name}</CardTitle>
                                <CardDescription>
                                  {new Date(meso.startDate).toLocaleDateString("it-IT")} -{" "}
                                  {new Date(meso.endDate).toLocaleDateString("it-IT")} ({meso.weeks} sett)
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right text-sm">
                                <p className="font-medium">
                                  {meso.weeksData.reduce((s, w) => s + w.plannedHours, 0).toFixed(1)}h
                                </p>
                                <p className="text-muted-foreground">
                                  {meso.weeksData.reduce((s, w) => s + w.plannedTSS, 0)} TSS
                                </p>
                              </div>
                              {expandedMesocycle === meso.id ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {expandedMesocycle === meso.id && (
                          <CardContent className="pt-4 space-y-4">
                            {/* Mesocycle settings */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Focus</Label>
                                <Select
                                  value={meso.focus}
                                  onValueChange={(v: any) => updateMesocycle(meso.id, { focus: v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(FOCUS_LABELS).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Ore/Sett Target</Label>
                                <Input
                                  type="number"
                                  value={meso.weeklyHoursTarget}
                                  onChange={(e) =>
                                    updateMesocycle(meso.id, { weeklyHoursTarget: Number.parseFloat(e.target.value) })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Settimane</Label>
                                <Input
                                  type="number"
                                  value={meso.weeks}
                                  onChange={(e) => updateMesocycle(meso.id, { weeks: Number.parseInt(e.target.value) })}
                                  min={2}
                                  max={6}
                                />
                              </div>
                            </div>

                            {/* Weeks table */}
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="px-4 py-2 text-left">Settimana</th>
                                    <th className="px-4 py-2 text-left">Tipo</th>
                                    <th className="px-4 py-2 text-center">Carico %</th>
                                    <th className="px-4 py-2 text-center">Ore</th>
                                    <th className="px-4 py-2 text-center">TSS</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {meso.weeksData.map((week) => (
                                    <tr key={week.weekNumber} className="border-t">
                                      <td className="px-4 py-2">
                                        Sett {week.weekNumber}
                                        <span className="text-xs text-muted-foreground ml-2">
                                          {new Date(week.startDate).toLocaleDateString("it-IT", {
                                            day: "numeric",
                                            month: "short",
                                          })}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Select
                                          value={week.weekType}
                                          onValueChange={(v: any) =>
                                            updateWeekData(meso.id, week.weekNumber, { weekType: v })
                                          }
                                        >
                                          <SelectTrigger className="h-8 w-28">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="load">Carico</SelectItem>
                                            <SelectItem value="load_high">Carico Alto</SelectItem>
                                            <SelectItem value="recovery">Recupero</SelectItem>
                                            <SelectItem value="test">Test</SelectItem>
                                            <SelectItem value="race">Gara</SelectItem>
                                            <SelectItem value="taper">Taper</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <Input
                                          type="number"
                                          value={Math.round(week.loadFactor * 100)}
                                          onChange={(e) =>
                                            updateWeekData(meso.id, week.weekNumber, {
                                              loadFactor: Number.parseInt(e.target.value) / 100,
                                            })
                                          }
                                          className="h-8 w-16 mx-auto text-center"
                                          min={50}
                                          max={150}
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <Input
                                          type="number"
                                          value={week.plannedHours}
                                          onChange={(e) =>
                                            updateWeekData(meso.id, week.weekNumber, {
                                              plannedHours: Number.parseFloat(e.target.value),
                                            })
                                          }
                                          className="h-8 w-16 mx-auto text-center"
                                          step={0.5}
                                        />
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <Input
                                          type="number"
                                          value={week.plannedTSS}
                                          onChange={(e) =>
                                            updateWeekData(meso.id, week.weekNumber, {
                                              plannedTSS: Number.parseInt(e.target.value),
                                            })
                                          }
                                          className="h-8 w-20 mx-auto text-center"
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMesocycle(meso.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Rimuovi Mesociclo
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-fuchsia-500" />
                  Obiettivi Fisiologici
                </CardTitle>
                <CardDescription>Target di performance da raggiungere</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>FTP Target (W)</Label>
                    <Input
                      type="number"
                      value={physioGoals.targetFTP || ""}
                      onChange={(e) =>
                        setPhysioGoals({ ...physioGoals, targetFTP: Number.parseInt(e.target.value) || undefined })
                      }
                      placeholder={athleteData?.metabolic_profiles?.[0]?.ftp_watts?.toString() || ""}
                    />
                    {athleteData?.metabolic_profiles?.[0]?.ftp_watts && (
                      <p className="text-xs text-muted-foreground">
                        Attuale: {athleteData.metabolic_profiles[0].ftp_watts}W
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>VO2max Target</Label>
                    <Input
                      type="number"
                      value={physioGoals.targetVO2max || ""}
                      onChange={(e) =>
                        setPhysioGoals({ ...physioGoals, targetVO2max: Number.parseFloat(e.target.value) || undefined })
                      }
                      placeholder={athleteData?.metabolic_profiles?.[0]?.vo2max?.toString() || ""}
                    />
                    {athleteData?.metabolic_profiles?.[0]?.vo2max && (
                      <p className="text-xs text-muted-foreground">
                        Attuale: {athleteData.metabolic_profiles[0].vo2max} ml/kg/min
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Peso Target (kg)</Label>
                    <Input
                      type="number"
                      value={physioGoals.targetWeight || ""}
                      onChange={(e) =>
                        setPhysioGoals({ ...physioGoals, targetWeight: Number.parseFloat(e.target.value) || undefined })
                      }
                      placeholder={athleteData?.weight_kg?.toString() || ""}
                      step={0.1}
                    />
                    {athleteData?.weight_kg && (
                      <p className="text-xs text-muted-foreground">Attuale: {athleteData.weight_kg}kg</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>% Grasso Target</Label>
                    <Input
                      type="number"
                      value={physioGoals.targetBodyFat || ""}
                      onChange={(e) =>
                        setPhysioGoals({
                          ...physioGoals,
                          targetBodyFat: Number.parseFloat(e.target.value) || undefined,
                        })
                      }
                      placeholder="Es. 12"
                      step={0.5}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>W/kg Target</Label>
                  <Input
                    type="number"
                    value={physioGoals.targetPowerToWeight || ""}
                    onChange={(e) =>
                      setPhysioGoals({
                        ...physioGoals,
                        targetPowerToWeight: Number.parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="Es. 4.5"
                    step={0.1}
                  />
                  {athleteData?.metabolic_profiles?.[0]?.ftp_watts && athleteData?.weight_kg && (
                    <p className="text-xs text-muted-foreground">
                      Attuale: {(athleteData.metabolic_profiles[0].ftp_watts / athleteData.weight_kg).toFixed(2)} W/kg
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Riepilogo Obiettivi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mainGoalEvent && (
                    <div className="p-4 bg-fuchsia-500/10 rounded-lg border border-fuchsia-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Flag className="h-5 w-5 text-fuchsia-500" />
                        <span className="font-medium">Obiettivo Principale</span>
                      </div>
                      <p className="text-lg font-bold">{mainGoalEvent}</p>
                      {mainGoalDate && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(mainGoalDate).toLocaleDateString("it-IT", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {events.filter((e) => e.type === "event_a" || e.type === "event_b").length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Gare Principali</h4>
                      <div className="space-y-2">
                        {events
                          .filter((e) => e.type === "event_a" || e.type === "event_b")
                          .map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Badge className={event.type === "event_a" ? "bg-purple-500" : "bg-blue-500"}>
                                  {event.type === "event_a" ? "A" : "B"}
                                </Badge>
                                <span>{event.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {event.date && new Date(event.date).toLocaleDateString("it-IT")}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Volume Annuale</p>
                      <p className="font-medium">{annualHoursTarget}h target</p>
                      <p className="text-fuchsia-400">{Math.round(totalPlannedHours)}h pianificate</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">TSS Annuale</p>
                      <p className="font-medium">{totalPlannedTSS.toLocaleString()} pianificato</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline Visuale</CardTitle>
              <CardDescription>Panoramica del piano annuale</CardDescription>
            </CardHeader>
            <CardContent>
              {mesocycles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Genera il piano per visualizzare la timeline</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Phase legend */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PHASE_LABELS).map(([key, label]) => (
                      <Badge key={key} className={`${PHASE_COLORS[key]} text-white`}>
                        {label}
                      </Badge>
                    ))}
                  </div>

                  {/* Timeline bar */}
                  <div className="flex h-16 rounded-lg overflow-hidden">
                    {mesocycles.map((meso, index) => {
                      const totalMesoWeeks = mesocycles.reduce((s, m) => s + m.weeks, 0)
                      const width = (meso.weeks / totalMesoWeeks) * 100
                      return (
                        <div
                          key={meso.id}
                          className={`${PHASE_COLORS[meso.phase]} flex items-center justify-center text-white text-xs font-medium relative group cursor-pointer`}
                          style={{ width: `${width}%` }}
                          onClick={() => {
                            setActiveTab("mesocycles")
                            setExpandedMesocycle(meso.id)
                          }}
                        >
                          {width > 8 && <span className="truncate px-1">{meso.name}</span>}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-xs">
                            <p className="font-medium">{meso.name}</p>
                            <p>{meso.weeks} settimane</p>
                            <p>{meso.weeksData.reduce((s, w) => s + w.plannedHours, 0).toFixed(1)}h</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Events markers */}
                  {events.length > 0 && (
                    <div className="relative h-8">
                      {events
                        .filter((e) => e.date)
                        .map((event) => {
                          const eventDate = new Date(event.date)
                          const startDate = mesocycles.length > 0 ? new Date(mesocycles[0].startDate) : new Date()
                          const endDate =
                            mesocycles.length > 0 ? new Date(mesocycles[mesocycles.length - 1].endDate) : new Date()
                          const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                          const eventDays = (eventDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                          const position = Math.max(0, Math.min(100, (eventDays / totalDays) * 100))

                          return (
                            <div
                              key={event.id}
                              className="absolute top-0 -translate-x-1/2 flex flex-col items-center group"
                              style={{ left: `${position}%` }}
                            >
                              <Flag
                                className={`h-5 w-5 ${
                                  event.type === "event_a"
                                    ? "text-purple-500"
                                    : event.type === "event_b"
                                      ? "text-blue-500"
                                      : "text-slate-400"
                                }`}
                              />
                              <div className="absolute top-full mt-1 bg-popover text-popover-foreground p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-xs">
                                <p className="font-medium">{event.name}</p>
                                <p>{new Date(event.date).toLocaleDateString("it-IT")}</p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Weekly TSS chart */}
                  <div className="mt-8">
                    <h4 className="font-medium mb-4">Distribuzione TSS Settimanale</h4>
                    <div className="h-40 flex items-end gap-1">
                      {mesocycles.flatMap((meso) =>
                        meso.weeksData.map((week, wIndex) => {
                          const maxTSS = Math.max(...mesocycles.flatMap((m) => m.weeksData.map((w) => w.plannedTSS)))
                          const height = (week.plannedTSS / maxTSS) * 100
                          return (
                            <div
                              key={`${meso.id}-${week.weekNumber}`}
                              className={`flex-1 ${PHASE_COLORS[meso.phase]} rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer group relative`}
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-xs">
                                <p className="font-medium">
                                  {meso.name} - Sett {week.weekNumber}
                                </p>
                                <p>{week.plannedTSS} TSS</p>
                                <p>{week.plannedHours}h</p>
                                <p className="text-muted-foreground">{week.weekType}</p>
                              </div>
                            </div>
                          )
                        }),
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>
                        {mesocycles.length > 0 &&
                          new Date(mesocycles[0].startDate).toLocaleDateString("it-IT", {
                            month: "short",
                          })}
                      </span>
                      <span>
                        {mesocycles.length > 0 &&
                          new Date(mesocycles[mesocycles.length - 1].endDate).toLocaleDateString("it-IT", {
                            month: "short",
                          })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
