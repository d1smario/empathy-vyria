"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, ChevronUp, ChevronDown, Search, X, Check, Copy, Sparkles, Save } from "lucide-react"

// Types
export interface GymExercise {
  id: string
  name: string
  muscle_group: string[]
  stimulus_type: string[]
  equipment: string
  image_url?: string
  description?: string
}

export interface WorkoutExercise {
  id: string
  exercise: GymExercise
  sets: number
  reps: string
  weight?: string
  rest_seconds: number
  tempo?: string
  notes?: string
  completed: boolean
}

export interface GymWorkoutSession {
  id: string
  name: string
  stimulus_type: string
  target_muscles: string[]
  duration_minutes: number
  exercises: WorkoutExercise[]
  notes?: string
  created_at?: string
}

// Exercise Database
const EXERCISE_DATABASE: GymExercise[] = [
  // Quadriceps
  {
    id: "squat",
    name: "Squat con Bilanciere",
    muscle_group: ["quadricipiti", "glutei", "gambe"],
    stimulus_type: ["forza", "forza_massima", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/barbell-squat.png",
  },
  {
    id: "leg_press",
    name: "Leg Press",
    muscle_group: ["quadricipiti", "glutei"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "macchina",
    image_url: "/leg-press-machine.jpg",
  },
  {
    id: "leg_ext",
    name: "Leg Extension",
    muscle_group: ["quadricipiti"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "macchina",
    image_url: "/leg-extension-machine.jpg",
  },
  {
    id: "front_squat",
    name: "Front Squat",
    muscle_group: ["quadricipiti", "core"],
    stimulus_type: ["forza", "neuromuscolare"],
    equipment: "bilanciere",
    image_url: "/front-squat-barbell.jpg",
  },
  {
    id: "goblet_squat",
    name: "Goblet Squat",
    muscle_group: ["quadricipiti", "glutei"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "kettlebell",
    image_url: "/goblet-squat-kettlebell.jpg",
  },
  {
    id: "split_squat",
    name: "Bulgarian Split Squat",
    muscle_group: ["quadricipiti", "glutei"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "manubri",
    image_url: "/bulgarian-split-squat.jpg",
  },
  {
    id: "step_up",
    name: "Step Up",
    muscle_group: ["quadricipiti", "glutei"],
    stimulus_type: ["forza", "neuromuscolare"],
    equipment: "box",
    image_url: "/step-up-box-exercise.jpg",
  },

  // Hamstrings
  {
    id: "rdl",
    name: "Romanian Deadlift",
    muscle_group: ["femorali", "glutei", "lombari"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/romanian-deadlift.jpg",
  },
  {
    id: "leg_curl",
    name: "Leg Curl",
    muscle_group: ["femorali"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "macchina",
    image_url: "/leg-curl-machine.jpg",
  },
  {
    id: "nordic_curl",
    name: "Nordic Hamstring Curl",
    muscle_group: ["femorali"],
    stimulus_type: ["forza", "neuromuscolare"],
    equipment: "corpo libero",
    image_url: "/nordic-hamstring-curl.jpg",
  },
  {
    id: "deadlift",
    name: "Stacco da Terra",
    muscle_group: ["femorali", "glutei", "dorsali", "lombari"],
    stimulus_type: ["forza", "forza_massima"],
    equipment: "bilanciere",
    image_url: "/deadlift-barbell.jpg",
  },

  // Glutes
  {
    id: "hip_thrust",
    name: "Hip Thrust",
    muscle_group: ["glutei", "femorali"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/hip-thrust-barbell.jpg",
  },
  {
    id: "glute_bridge",
    name: "Glute Bridge",
    muscle_group: ["glutei"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "corpo libero",
    image_url: "/glute-bridge-exercise.png",
  },
  {
    id: "cable_kickback",
    name: "Cable Kickback",
    muscle_group: ["glutei"],
    stimulus_type: ["ipertrofia"],
    equipment: "cavi",
    image_url: "/cable-kickback-glute.jpg",
  },

  // Calves
  {
    id: "calf_raise",
    name: "Calf Raise in Piedi",
    muscle_group: ["polpacci"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "macchina",
    image_url: "/standing-calf-raise.jpg",
  },
  {
    id: "seated_calf",
    name: "Calf Raise Seduto",
    muscle_group: ["polpacci"],
    stimulus_type: ["ipertrofia"],
    equipment: "macchina",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Chest
  {
    id: "bench_press",
    name: "Panca Piana",
    muscle_group: ["petto", "tricipiti", "spalle"],
    stimulus_type: ["forza", "forza_massima", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "incline_bench",
    name: "Panca Inclinata",
    muscle_group: ["petto", "spalle"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "db_press",
    name: "Chest Press Manubri",
    muscle_group: ["petto", "tricipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "cable_fly",
    name: "Cable Fly",
    muscle_group: ["petto"],
    stimulus_type: ["ipertrofia"],
    equipment: "cavi",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "pushup",
    name: "Push Up",
    muscle_group: ["petto", "tricipiti", "core"],
    stimulus_type: ["resistenza", "neuromuscolare"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "dips",
    name: "Dips",
    muscle_group: ["petto", "tricipiti"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "parallele",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Back
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    muscle_group: ["dorsali", "bicipiti"],
    stimulus_type: ["ipertrofia", "forza"],
    equipment: "cavi",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "row",
    name: "Rematore con Bilanciere",
    muscle_group: ["dorsali", "bicipiti", "lombari"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "cable_row",
    name: "Cable Row",
    muscle_group: ["dorsali", "bicipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "cavi",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "pullup",
    name: "Trazioni",
    muscle_group: ["dorsali", "bicipiti"],
    stimulus_type: ["forza", "neuromuscolare"],
    equipment: "sbarra",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "db_row",
    name: "Rematore Manubrio",
    muscle_group: ["dorsali", "bicipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "face_pull",
    name: "Face Pull",
    muscle_group: ["dorsali", "spalle"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "cavi",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Shoulders
  {
    id: "ohp",
    name: "Military Press",
    muscle_group: ["spalle", "tricipiti"],
    stimulus_type: ["forza", "forza_massima"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "db_shoulder",
    name: "Shoulder Press Manubri",
    muscle_group: ["spalle", "tricipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "lateral_raise",
    name: "Alzate Laterali",
    muscle_group: ["spalle"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "front_raise",
    name: "Alzate Frontali",
    muscle_group: ["spalle"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "rear_delt",
    name: "Rear Delt Fly",
    muscle_group: ["spalle", "dorsali"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Biceps
  {
    id: "barbell_curl",
    name: "Curl con Bilanciere",
    muscle_group: ["bicipiti"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "db_curl",
    name: "Curl Manubri",
    muscle_group: ["bicipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "hammer_curl",
    name: "Hammer Curl",
    muscle_group: ["bicipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubri",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "preacher_curl",
    name: "Preacher Curl",
    muscle_group: ["bicipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "panca scott",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Triceps
  {
    id: "tricep_pushdown",
    name: "Tricep Pushdown",
    muscle_group: ["tricipiti"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "cavi",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "skull_crusher",
    name: "Skull Crusher",
    muscle_group: ["tricipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "bilanciere EZ",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "overhead_ext",
    name: "Overhead Tricep Extension",
    muscle_group: ["tricipiti"],
    stimulus_type: ["ipertrofia"],
    equipment: "manubrio",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "close_grip_bench",
    name: "Close Grip Bench Press",
    muscle_group: ["tricipiti", "petto"],
    stimulus_type: ["forza", "ipertrofia"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Core
  {
    id: "plank",
    name: "Plank",
    muscle_group: ["core", "addominali"],
    stimulus_type: ["resistenza", "neuromuscolare"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "crunch",
    name: "Crunch",
    muscle_group: ["addominali"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "leg_raise",
    name: "Leg Raise",
    muscle_group: ["addominali", "core"],
    stimulus_type: ["ipertrofia"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "russian_twist",
    name: "Russian Twist",
    muscle_group: ["addominali", "core"],
    stimulus_type: ["resistenza"],
    equipment: "peso",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "cable_crunch",
    name: "Cable Crunch",
    muscle_group: ["addominali"],
    stimulus_type: ["ipertrofia"],
    equipment: "cavi",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "ab_wheel",
    name: "Ab Wheel Rollout",
    muscle_group: ["addominali", "core"],
    stimulus_type: ["forza", "neuromuscolare"],
    equipment: "ab wheel",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Lower Back
  {
    id: "hyperext",
    name: "Hyperextension",
    muscle_group: ["lombari", "glutei"],
    stimulus_type: ["ipertrofia", "resistenza"],
    equipment: "panca romana",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "good_morning",
    name: "Good Morning",
    muscle_group: ["lombari", "femorali"],
    stimulus_type: ["forza"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Explosive
  {
    id: "box_jump",
    name: "Box Jump",
    muscle_group: ["gambe", "glutei"],
    stimulus_type: ["esplosivo", "neuromuscolare"],
    equipment: "box",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "jump_squat",
    name: "Jump Squat",
    muscle_group: ["quadricipiti", "glutei"],
    stimulus_type: ["esplosivo", "neuromuscolare"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "power_clean",
    name: "Power Clean",
    muscle_group: ["gambe", "dorsali", "spalle"],
    stimulus_type: ["esplosivo", "forza"],
    equipment: "bilanciere",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "med_ball_throw",
    name: "Medicine Ball Throw",
    muscle_group: ["core", "spalle"],
    stimulus_type: ["esplosivo"],
    equipment: "palla medica",
    image_url: "/placeholder.svg?height=120&width=120",
  },

  // Mobility/Stretching
  {
    id: "hip_flexor_stretch",
    name: "Hip Flexor Stretch",
    muscle_group: ["mobilità", "gambe"],
    stimulus_type: ["stretching", "mobilità"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "pigeon_pose",
    name: "Pigeon Pose",
    muscle_group: ["mobilità", "glutei"],
    stimulus_type: ["stretching", "mobilità"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "cat_cow",
    name: "Cat-Cow Stretch",
    muscle_group: ["mobilità", "lombari"],
    stimulus_type: ["mobilità"],
    equipment: "corpo libero",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "foam_roll_quad",
    name: "Foam Roll Quadricipiti",
    muscle_group: ["mobilità", "quadricipiti"],
    stimulus_type: ["recupero"],
    equipment: "foam roller",
    image_url: "/placeholder.svg?height=120&width=120",
  },
  {
    id: "foam_roll_it",
    name: "Foam Roll IT Band",
    muscle_group: ["mobilità", "gambe"],
    stimulus_type: ["recupero"],
    equipment: "foam roller",
    image_url: "/placeholder.svg?height=120&width=120",
  },
]

// Stimulus Types
const STIMULUS_TYPES = [
  {
    id: "forza",
    name: "Forza",
    description: "4-6 rep, 80-90% 1RM, 3-5 min rest",
    color: "bg-red-600",
    defaultSets: 4,
    defaultReps: "5",
    defaultRest: 180,
  },
  {
    id: "forza_massima",
    name: "Forza Max",
    description: "1-3 rep, 90-100% 1RM, 5+ min rest",
    color: "bg-red-800",
    defaultSets: 5,
    defaultReps: "2",
    defaultRest: 300,
  },
  {
    id: "ipertrofia",
    name: "Ipertrofia",
    description: "8-12 rep, 65-75% 1RM, 60-90s rest",
    color: "bg-blue-600",
    defaultSets: 4,
    defaultReps: "10",
    defaultRest: 90,
  },
  {
    id: "resistenza",
    name: "Resistenza",
    description: "15-20+ rep, 50-65% 1RM, 30-60s rest",
    color: "bg-green-600",
    defaultSets: 3,
    defaultReps: "15",
    defaultRest: 60,
  },
  {
    id: "neuromuscolare",
    name: "Neuromuscolare",
    description: "3-5 rep esplosive, 70-80% 1RM, 2-3 min rest",
    color: "bg-purple-600",
    defaultSets: 4,
    defaultReps: "4",
    defaultRest: 150,
  },
  {
    id: "esplosivo",
    name: "Esplosivo",
    description: "3-6 rep veloci, 50-70% 1RM, 2-3 min rest",
    color: "bg-orange-600",
    defaultSets: 4,
    defaultReps: "5",
    defaultRest: 150,
  },
  {
    id: "mobilità",
    name: "Mobilità",
    description: "30-60s per posizione, movimenti controllati",
    color: "bg-teal-600",
    defaultSets: 2,
    defaultReps: "45s",
    defaultRest: 30,
  },
  {
    id: "stretching",
    name: "Stretching",
    description: "30-60s per muscolo, allungamenti statici",
    color: "bg-cyan-600",
    defaultSets: 2,
    defaultReps: "45s",
    defaultRest: 30,
  },
  {
    id: "recupero",
    name: "Recupero",
    description: "1-2 min per gruppo, foam rolling",
    color: "bg-slate-600",
    defaultSets: 1,
    defaultReps: "60s",
    defaultRest: 0,
  },
]

// Muscle Groups - allineati con API ExerciseDB (AscendAPI)
// bodyPart validi: back, cardio, chest, lower arms, lower legs, neck, shoulders, upper arms, upper legs, waist
const MUSCLE_GROUPS = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "shoulders", name: "Shoulders" },
  { id: "upper arms", name: "Upper Arms" },
  { id: "upper legs", name: "Upper Legs" },
  { id: "waist", name: "Waist / Core" },
  { id: "lower legs", name: "Lower Legs" },
  { id: "lower arms", name: "Lower Arms" },
  { id: "cardio", name: "Cardio" },
  { id: "neck", name: "Neck" },
]

function getDefaultWeight(stimulus: string): string {
  const weights: Record<string, string> = {
    forza: "80-85%",
    forza_massima: "90-100%",
    neuromuscolare: "70-80%",
    ipertrofia: "65-75%",
    esplosivo: "50-70%",
    resistenza: "50-65%",
    stretching: "-",
    mobilità: "-",
    recupero: "-",
  }
  return weights[stimulus] || "70%"
}

interface GymWorkoutBuilderProps {
  open?: boolean
  onClose?: () => void
  onSave: (workout: GymWorkoutSession) => void
  onCancel?: () => void
  initialWorkout?: GymWorkoutSession | null
  athleteFtp?: number
  initialStrengthType?: string
  initialMuscleGroups?: string[]
}

export function GymWorkoutBuilder({
  open,
  onClose,
  onSave,
  onCancel,
  initialWorkout,
  athleteFtp = 250,
  initialStrengthType,
  initialMuscleGroups,
}: GymWorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState(initialWorkout?.name || "Sessione Palestra")
  const [selectedStimulus, setSelectedStimulus] = useState<string>(
    initialWorkout?.stimulus_type || initialStrengthType || "forza",
  )
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(
    initialWorkout?.target_muscles || initialMuscleGroups || [],
  )
  const [exercises, setExercises] = useState<WorkoutExercise[]>(initialWorkout?.exercises || [])
  const [workoutNotes, setWorkoutNotes] = useState(initialWorkout?.notes || "")
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterMuscle, setFilterMuscle] = useState<string>("all")
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualExercise, setManualExercise] = useState({ name: "", sets: 3, reps: "10", rest: 90, notes: "" })

  const stimulusConfig = STIMULUS_TYPES.find((s) => s.id === selectedStimulus) || STIMULUS_TYPES[0]

  useEffect(() => {
    if (initialStrengthType && !initialWorkout) {
      setSelectedStimulus(initialStrengthType)
    }
  }, [initialStrengthType, initialWorkout])

  useEffect(() => {
    if (initialMuscleGroups && initialMuscleGroups.length > 0 && !initialWorkout) {
      setSelectedMuscles(initialMuscleGroups)
    }
  }, [initialMuscleGroups, initialWorkout])

  useEffect(() => {
    if (initialWorkout) {
      setWorkoutName(initialWorkout.name)
      setSelectedStimulus(initialWorkout.stimulus_type)
      setSelectedMuscles(initialWorkout.target_muscles)
      setExercises(initialWorkout.exercises)
      setWorkoutNotes(initialWorkout.notes || "")
    }
  }, [initialWorkout])

  const filteredExercises = EXERCISE_DATABASE.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscle_group.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesMuscle = filterMuscle === "all" || ex.muscle_group.includes(filterMuscle)
    return matchesSearch && matchesMuscle
  })

  const addExercise = (exercise: GymExercise) => {
    const newExercise: WorkoutExercise = {
      id: `${exercise.id}-${Date.now()}`,
      exercise,
      sets: stimulusConfig.defaultSets,
      reps: stimulusConfig.defaultReps,
      weight: getDefaultWeight(selectedStimulus),
      rest_seconds: stimulusConfig.defaultRest,
      completed: false,
    }
    setExercises([...exercises, newExercise])
    exercise.muscle_group.forEach((m) => {
      if (!selectedMuscles.includes(m)) {
        setSelectedMuscles((prev) => [...prev, m])
      }
    })
    setShowExercisePicker(false)
  }

  const addManualExercise = () => {
    if (!manualExercise.name.trim()) return
    const customExercise: GymExercise = {
      id: `custom-${Date.now()}`,
      name: manualExercise.name,
      muscle_group: selectedMuscles.length > 0 ? selectedMuscles : ["full_body"],
      stimulus_type: [selectedStimulus],
      equipment: "vario",
      image_url: `/placeholder.svg?height=120&width=120&query=${encodeURIComponent(manualExercise.name)}`,
    }
    const newExercise: WorkoutExercise = {
      id: `${customExercise.id}-${Date.now()}`,
      exercise: customExercise,
      sets: manualExercise.sets,
      reps: manualExercise.reps,
      weight: getDefaultWeight(selectedStimulus),
      rest_seconds: manualExercise.rest,
      notes: manualExercise.notes,
      completed: false,
    }
    setExercises([...exercises, newExercise])
    setManualExercise({ name: "", sets: 3, reps: "10", rest: 90, notes: "" })
    setShowManualInput(false)
  }

  const removeExercise = (id: string) => setExercises(exercises.filter((e) => e.id !== id))

  const updateExercise = (id: string, updates: Partial<WorkoutExercise>) => {
    setExercises(exercises.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }

  const moveExercise = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === exercises.length - 1)) return
    const newExercises = [...exercises]
    const newIndex = direction === "up" ? index - 1 : index + 1
    ;[newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]]
    setExercises(newExercises)
  }

  const duplicateExercise = (exercise: WorkoutExercise) => {
    const duplicate: WorkoutExercise = { ...exercise, id: `${exercise.exercise.id}-${Date.now()}`, completed: false }
    setExercises([...exercises, duplicate])
  }

  const generateWorkout = () => {
    const relevantExercises = EXERCISE_DATABASE.filter(
      (ex) =>
        ex.stimulus_type.includes(selectedStimulus) &&
        (selectedMuscles.length === 0 || ex.muscle_group.some((m) => selectedMuscles.includes(m))),
    )
    const shuffled = relevantExercises.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(6, shuffled.length))
    const generatedExercises: WorkoutExercise[] = selected.map((ex) => ({
      id: `${ex.id}-${Date.now()}-${Math.random()}`,
      exercise: ex,
      sets: stimulusConfig.defaultSets,
      reps: stimulusConfig.defaultReps,
      weight: getDefaultWeight(selectedStimulus),
      rest_seconds: stimulusConfig.defaultRest,
      completed: false,
    }))
    setExercises(generatedExercises)
    const allMuscles = new Set<string>()
    selected.forEach((ex) => ex.muscle_group.forEach((m) => allMuscles.add(m)))
    setSelectedMuscles(Array.from(allMuscles).filter((m) => MUSCLE_GROUPS.some((mg) => mg.id === m)))
  }

  const calculateDuration = () => {
    let totalSeconds = 0
    exercises.forEach((ex) => {
      const repsNum = Number.parseInt(ex.reps) || 10
      const timePerRep = ex.reps.includes("s") ? Number.parseInt(ex.reps) : 3
      totalSeconds += ex.sets * (repsNum * timePerRep + ex.rest_seconds)
    })
    return Math.ceil(totalSeconds / 60)
  }

  const handleSave = () => {
    const workout: GymWorkoutSession = {
      id: initialWorkout?.id || `gym-${Date.now()}`,
      name: workoutName,
      stimulus_type: selectedStimulus,
      target_muscles: selectedMuscles,
      duration_minutes: calculateDuration(),
      exercises,
      notes: workoutNotes,
      created_at: new Date().toISOString(),
    }
    onSave(workout)
  }

  const handleClose = () => {
    if (onCancel) onCancel()
    else if (onClose) onClose()
  }

  const toggleMuscle = (muscleId: string) => {
    setSelectedMuscles((prev) => (prev.includes(muscleId) ? prev.filter((m) => m !== muscleId) : [...prev, muscleId]))
  }

  return (
    <div className="space-y-6">
      <ScrollArea className="max-h-[55vh] pr-4">
        <div className="space-y-6">
          {/* Workout Name */}
          <div className="space-y-2">
            <Label>Nome Sessione</Label>
            <Input
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Es. Upper Body Strength"
              className="bg-slate-800 border-slate-600"
            />
          </div>

          {/* Stimulus Type Selection */}
          <div className="space-y-2">
            <Label>Tipo di Stimolo</Label>
            <div className="grid grid-cols-3 gap-2">
              {STIMULUS_TYPES.map((stim) => (
                <Button
                  key={stim.id}
                  variant={selectedStimulus === stim.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStimulus(stim.id)}
                  className={selectedStimulus === stim.id ? `${stim.color} text-white` : "border-slate-600"}
                >
                  {stim.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{stimulusConfig.description}</p>
          </div>

          {/* Muscle Groups */}
          <div className="space-y-2">
            <Label>Gruppi Muscolari Target</Label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((muscle) => (
                <Badge
                  key={muscle.id}
                  variant={selectedMuscles.includes(muscle.id) ? "default" : "outline"}
                  className={`cursor-pointer ${selectedMuscles.includes(muscle.id) ? "bg-violet-600" : "border-slate-600"}`}
                  onClick={() => toggleMuscle(muscle.id)}
                >
                  {muscle.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-700" />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => setShowExercisePicker(true)} className="flex-1 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Esercizio
            </Button>
            <Button onClick={() => setShowManualInput(true)} variant="outline" className="border-slate-600">
              <Plus className="h-4 w-4 mr-2" />
              Manuale
            </Button>
            <Button onClick={generateWorkout} className="bg-orange-600 hover:bg-orange-700 text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Genera
            </Button>
          </div>

          {/* Manual Input */}
          {showManualInput && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome Esercizio</Label>
                    <Input
                      value={manualExercise.name}
                      onChange={(e) => setManualExercise({ ...manualExercise, name: e.target.value })}
                      placeholder="Es. Squat con bilanciere"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Serie</Label>
                    <Input
                      type="number"
                      value={manualExercise.sets}
                      onChange={(e) =>
                        setManualExercise({ ...manualExercise, sets: Number.parseInt(e.target.value) || 3 })
                      }
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Ripetizioni</Label>
                    <Input
                      value={manualExercise.reps}
                      onChange={(e) => setManualExercise({ ...manualExercise, reps: e.target.value })}
                      placeholder="10 o 30s"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Recupero (sec)</Label>
                    <Input
                      type="number"
                      value={manualExercise.rest}
                      onChange={(e) =>
                        setManualExercise({ ...manualExercise, rest: Number.parseInt(e.target.value) || 60 })
                      }
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Note</Label>
                    <Input
                      value={manualExercise.notes}
                      onChange={(e) => setManualExercise({ ...manualExercise, notes: e.target.value })}
                      placeholder="Note opzionali"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addManualExercise} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4 mr-2" />
                    Aggiungi
                  </Button>
                  <Button onClick={() => setShowManualInput(false)} variant="ghost" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Annulla
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exercises List */}
          {exercises.length > 0 && (
            <div className="space-y-3">
              <Label>Esercizi ({exercises.length})</Label>
              {exercises.map((workout, index) => (
                <Card key={workout.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => moveExercise(index, "up")}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => moveExercise(index, "down")}
                            disabled={index === exercises.length - 1}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                        <img
                          src={
                            workout.exercise.image_url ||
                            `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(workout.exercise.name) || "/placeholder.svg"}`
                          }
                          alt={workout.exercise.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=80&width=80&query=${encodeURIComponent(workout.exercise.name)}`
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">{workout.exercise.name}</h4>
                        <p className="text-xs text-slate-400 capitalize">{workout.exercise.equipment}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {workout.exercise.muscle_group.slice(0, 2).map((m) => (
                            <Badge key={m} variant="secondary" className="text-[10px] bg-slate-700">
                              {m}
                            </Badge>
                          ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          <div>
                            <Label className="text-[10px] text-slate-500">Serie</Label>
                            <Input
                              type="number"
                              value={workout.sets}
                              onChange={(e) =>
                                updateExercise(workout.id, { sets: Number.parseInt(e.target.value) || 1 })
                              }
                              className="h-7 text-sm bg-slate-700 border-slate-600"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-500">Rep</Label>
                            <Input
                              value={workout.reps}
                              onChange={(e) => updateExercise(workout.id, { reps: e.target.value })}
                              className="h-7 text-sm bg-slate-700 border-slate-600"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-500">Carico %</Label>
                            <Input
                              value={workout.weight || ""}
                              onChange={(e) => updateExercise(workout.id, { weight: e.target.value })}
                              placeholder="75%"
                              className="h-7 text-sm bg-slate-700 border-slate-600"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-slate-500">Rest</Label>
                            <Input
                              type="number"
                              value={workout.rest_seconds}
                              onChange={(e) =>
                                updateExercise(workout.id, { rest_seconds: Number.parseInt(e.target.value) || 60 })
                              }
                              className="h-7 text-sm bg-slate-700 border-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => duplicateExercise(workout)}
                          className="h-7 w-7"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeExercise(workout.id)}
                          className="h-7 w-7 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Note Generali</Label>
            <Textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              placeholder="Indicazioni generali per la sessione..."
              className="bg-slate-800 border-slate-600"
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          {exercises.length} esercizi • ~{calculateDuration()} min
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} className="border-slate-600 bg-transparent">
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={exercises.length === 0} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Salva Scheda
          </Button>
        </div>
      </div>

      {/* Exercise Picker Dialog */}
      <Dialog open={showExercisePicker} onOpenChange={setShowExercisePicker}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Seleziona Esercizio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca esercizio..."
                  className="pl-9 bg-slate-800 border-slate-600"
                />
              </div>
              <select
                value={filterMuscle}
                onChange={(e) => setFilterMuscle(e.target.value)}
                className="px-3 py-2 rounded-md bg-slate-800 border border-slate-600 text-sm"
              >
                <option value="all">Tutti i muscoli</option>
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-2">
                {filteredExercises.map((ex) => (
                  <Card
                    key={ex.id}
                    className="bg-slate-800 border-slate-700 cursor-pointer hover:border-violet-500 transition-colors"
                    onClick={() => addExercise(ex)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                        <img
                          src={
                            ex.image_url || `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(ex.name)}`
                          }
                          alt={ex.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(ex.name)}`
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{ex.name}</h4>
                        <p className="text-xs text-slate-400 capitalize">{ex.equipment}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ex.muscle_group.slice(0, 2).map((m) => (
                            <Badge key={m} variant="secondary" className="text-[9px] bg-slate-700">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GymWorkoutBuilder
