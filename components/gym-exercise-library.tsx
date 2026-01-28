"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Dumbbell, Plus, Clock, Flame, X, RotateCcw, Save, Calendar, FileDown, Info, Loader2, Sparkles, Zap, CalendarPlus, Check } from "lucide-react"
import Image from "next/image"
import { EXERCISE_DATABASE, type Exercise as LocalExercise } from "@/lib/exercise-database"
import { createClient } from "@/lib/supabase/client"
import { format, addDays, startOfWeek } from "date-fns"
import { it } from "date-fns/locale"

// Gruppi muscolari - nomi ESATTI dall'API ExerciseDB
const MUSCLE_GROUPS = [
  { id: "chest", name: "Chest", color: "#ef4444" },
  { id: "back", name: "Back", color: "#3b82f6" },
  { id: "shoulders", name: "Shoulders", color: "#f97316" },
  { id: "upper arms", name: "Upper Arms", color: "#22c55e" },
  { id: "upper legs", name: "Upper Legs", color: "#06b6d4" },
  { id: "waist", name: "Waist / Core", color: "#eab308" },
  { id: "lower legs", name: "Lower Legs", color: "#8b5cf6" },
  { id: "lower arms", name: "Lower Arms", color: "#ec4899" },
  { id: "cardio", name: "Cardio", color: "#14b8a6" },
  { id: "neck", name: "Neck", color: "#6366f1" },
]

interface Exercise {
  id: string
  name: string
  nameIt?: string
  bodyPart: string
  bodyPartIt?: string
  target?: string
  secondaryMuscles?: string[]
  equipment?: string
  gifUrl?: string
  imageUrl?: string
  instructions?: string[]
}

interface SelectedExercise extends Exercise {
  sets: number
  reps: number
  weight: number
  restSeconds: number
  notes: string
}

export interface GymWorkout {
  name: string
  exercises: SelectedExercise[]
  estimatedDuration: number
  estimatedCalories: number
  notes?: string
}

interface GymExerciseLibraryProps {
  onSaveWorkout?: (workout: GymWorkout) => void
  selectedDay?: number
  onDayChange?: (day: number) => void
  dayNames?: string[]
  athleteId?: string
}

export default function GymExerciseLibrary({
  onSaveWorkout,
  selectedDay = 0,
  onDayChange,
  dayNames = ["Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato", "Domenica"],
  athleteId,
}: GymExerciseLibraryProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("chest")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([])
  const [showExerciseDetail, setShowExerciseDetail] = useState<Exercise | null>(null)
  const [workoutName, setWorkoutName] = useState("")
  const [workoutNotes, setWorkoutNotes] = useState("")
  
  // AI Generator State
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiGoal, setAiGoal] = useState<string>("ipertrofia")
  const [aiLevel, setAiLevel] = useState<string>("intermedio")
  const [aiDuration, setAiDuration] = useState<number>(60)
  const [aiMuscleGroups, setAiMuscleGroups] = useState<string[]>(["petto", "tricipiti"])
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiSelectedDate, setAiSelectedDate] = useState<Date>(new Date())
  const [aiSaving, setAiSaving] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentAthleteId, setCurrentAthleteId] = useState<string | null>(null) // Declare currentAthleteId

  // athleteId comes from parent component (VYRIA -> GymExerciseLibrary)
  const effectiveAthleteId = athleteId

// Mapping gruppi muscolari per database locale
  const MUSCLE_GROUP_MAP: Record<string, string[]> = {
    "chest": ["chest"],
    "back": ["back"],
    "shoulders": ["shoulders"],
    "upper arms": ["biceps", "triceps"],
    "upper legs": ["legs", "glutes"],
    "waist": ["core"],
    "lower legs": ["calves"],
    "lower arms": ["forearms"],
    "cardio": ["cardio"],
    "neck": ["neck"],
  }

  // Fetch exercises from LOCAL DATABASE
  const fetchExercises = useCallback((bodyPart: string) => {
    setLoading(true)
    setError(null)
    
    const dbGroups = MUSCLE_GROUP_MAP[bodyPart] || [bodyPart]
    const filtered = EXERCISE_DATABASE.filter(ex => 
      dbGroups.includes(ex.muscleGroup)
    ).map(ex => ({
      id: ex.id,
      name: ex.name,
      nameIt: ex.name,
      bodyPart: ex.muscleGroup,
      target: ex.musclesActivated.primary[0] || ex.muscleGroup,
      secondaryMuscles: ex.musclesActivated.secondary,
      equipment: ex.equipment,
      gifUrl: ex.image,
      imageUrl: ex.image,
      instructions: ex.instructions,
    }))
    
    if (filtered.length > 0) {
      setExercises(filtered)
    } else {
      setError("Nessun esercizio trovato")
      setExercises([])
    }
    setLoading(false)
  }, [])
  
  // Generate workout with AI and save to calendar
  const generateAIWorkout = async () => {
    if (!effectiveAthleteId) {
      alert("Errore: Nessun utente loggato. Effettua il login e riprova.")
      return
    }
    
    setAiGenerating(true)
    try {
      const response = await fetch("/api/ai/gym-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: aiGoal,
          muscleGroups: aiMuscleGroups,
          level: aiLevel,
          duration: aiDuration,
          equipment: ["bilanciere", "manubri", "macchine", "cavi"],
        }),
      })
      
      const data = await response.json()
      
      if (data.success && data.workout) {
        // Convert AI workout to selectedExercises format
        const aiExercises: SelectedExercise[] = data.workout.exercises.map((ex: any, idx: number) => ({
          id: `ai-${idx}-${Date.now()}`,
          name: ex.name,
          nameIt: ex.name,
          bodyPart: ex.muscleGroup,
          target: ex.muscleGroup,
          equipment: ex.equipment,
          sets: ex.sets,
          reps: parseInt(ex.reps) || 12,
          weight: 0,
          restSeconds: ex.rest,
          notes: ex.notes || "",
        }))
        
        setSelectedExercises(aiExercises)
        setWorkoutName(data.workout.name)
        setWorkoutNotes(data.workout.description)
        
        // Save to calendar (training_activities)
        setAiSaving(true)
        const activityData = {
          athlete_id: effectiveAthleteId,
          activity_date: format(aiSelectedDate, 'yyyy-MM-dd'),
          activity_type: 'strength',
          title: data.workout.name,
          description: data.workout.description,
          duration_minutes: aiDuration,
          planned: true,
          completed: false,
          source: 'ai_generated',
          intervals: {
            type: 'gym',
            goal: aiGoal,
            level: aiLevel,
            exercises: aiExercises.map(ex => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.restSeconds,
              equipment: ex.equipment,
              notes: ex.notes,
            })),
            warmup: data.workout.warmup,
            cooldown: data.workout.cooldown,
          },
        }
        
        console.log("[v0] Saving to training_activities:", activityData)
        
        const supabaseClient = createClient()
        const { data: insertData, error: insertError } = await supabaseClient
          .from('training_activities')
          .insert(activityData)
          .select()
        
        console.log("[v0] Insert result:", insertData, insertError)
        
        if (insertError) {
          console.error("[v0] Save error:", insertError)
          alert(`Scheda generata ma errore nel salvataggio: ${insertError.message}`)
        } else {
          setShowAIGenerator(false)
          alert(`Scheda "${data.workout.name}" salvata nel calendario per ${format(aiSelectedDate, 'EEEE d MMMM', { locale: it })}!`)
        }
        setAiSaving(false)
      } else {
        alert("Errore nella generazione: " + (data.error || "Riprova"))
      }
    } catch (err) {
      console.error("AI generation error:", err)
      alert("Errore nella generazione della scheda")
    } finally {
      setAiGenerating(false)
      setAiSaving(false)
    }
  }

  // Search exercises in LOCAL DATABASE
  const searchExercises = useCallback((query: string) => {
    if (!query.trim()) {
      fetchExercises(selectedGroup)
      return
    }
    setLoading(true)
    setError(null)
    
    const searchLower = query.toLowerCase()
    const filtered = EXERCISE_DATABASE.filter(ex =>
      ex.name.toLowerCase().includes(searchLower) ||
      ex.nameEn.toLowerCase().includes(searchLower) ||
      ex.muscleGroup.toLowerCase().includes(searchLower) ||
      ex.equipment.toLowerCase().includes(searchLower)
    ).map(ex => ({
      id: ex.id,
      name: ex.name,
      nameIt: ex.name,
      bodyPart: ex.muscleGroup,
      target: ex.musclesActivated.primary[0] || ex.muscleGroup,
      secondaryMuscles: ex.musclesActivated.secondary,
      equipment: ex.equipment,
      gifUrl: ex.image,
      imageUrl: ex.image,
      instructions: ex.instructions,
    }))
    
    if (filtered.length > 0) {
      setExercises(filtered)
    } else {
      setError("Nessun esercizio trovato")
      setExercises([])
    }
    setLoading(false)
  }, [selectedGroup, fetchExercises])

  // Load exercises when muscle group changes
  useEffect(() => {
    if (!searchQuery) {
      fetchExercises(selectedGroup)
    }
  }, [selectedGroup, fetchExercises, searchQuery])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchExercises(searchQuery)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, searchExercises])

  // Get color for muscle group
  const getMuscleGroupColor = (groupId: string) => {
    return MUSCLE_GROUPS.find(g => g.id === groupId)?.color || "#6b7280"
  }

  // Add exercise to workout
  const addExercise = (exercise: Exercise) => {
    if (selectedExercises.find((e) => e.id === exercise.id)) return
    setSelectedExercises([
      ...selectedExercises,
      {
        ...exercise,
        sets: 3,
        reps: 12,
        weight: 0,
        restSeconds: 60,
        notes: "",
      },
    ])
  }

  // Remove exercise from workout
  const removeExercise = (exerciseId: string) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== exerciseId))
  }

  // Update exercise in workout
  const updateExercise = (exerciseId: string, field: keyof SelectedExercise, value: number | string) => {
    setSelectedExercises(selectedExercises.map((e) => (e.id === exerciseId ? { ...e, [field]: value } : e)))
  }

  // Calculate totals
  const totals = {
    duration: Math.round(selectedExercises.reduce((acc, ex) => {
      const setTime = ex.sets * (ex.reps * 3 + ex.restSeconds)
      return acc + setTime / 60
    }, 0)),
    calories: Math.round(selectedExercises.reduce((acc, ex) => {
      return acc + ex.sets * ex.reps * 0.5
    }, 0) * 6),
  }

  // Save workout
  const handleSave = () => {
    if (!workoutName.trim() || selectedExercises.length === 0) {
      alert("Inserisci un nome e almeno un esercizio")
      return
    }
    const workout: GymWorkout = {
      name: workoutName,
      exercises: selectedExercises,
      estimatedDuration: totals.duration,
      estimatedCalories: totals.calories,
      notes: workoutNotes,
    }
    if (onSaveWorkout) {
      onSaveWorkout(workout)
    }
    alert("Scheda salvata!")
    setWorkoutName("")
    setWorkoutNotes("")
    setSelectedExercises([])
  }

  // Reset workout
  const handleReset = () => {
    setWorkoutName("")
    setWorkoutNotes("")
    setSelectedExercises([])
  }

  // PDF generation
  const handleDownloadPDF = () => {
    if (!workoutName.trim() || selectedExercises.length === 0) {
      alert("Inserisci un nome e almeno un esercizio")
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scheda Palestra - ${workoutName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; padding: 10px; background: #f3f4f6; border-radius: 8px; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #7c3aed; }
          .stat-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #7c3aed; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9fafb; }
          .exercise-name { font-weight: bold; }
          .muscle { color: #666; font-size: 12px; }
          .notes { margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>Scheda Palestra: ${workoutName}</h1>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${selectedExercises.length}</div>
            <div class="stat-label">Esercizi</div>
          </div>
          <div class="stat">
            <div class="stat-value">${totals.duration}</div>
            <div class="stat-label">Minuti</div>
          </div>
          <div class="stat">
            <div class="stat-value">${totals.calories}</div>
            <div class="stat-label">Kcal stimate</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Esercizio</th>
              <th>Muscolo</th>
              <th>Serie</th>
              <th>Reps</th>
              <th>Peso</th>
              <th>Rec</th>
            </tr>
          </thead>
          <tbody>
            ${selectedExercises.map((ex, i) => `
              <tr>
                <td>${i + 1}</td>
                <td class="exercise-name">${ex.name}</td>
                <td class="muscle">${ex.target || ex.bodyPart}</td>
                <td>${ex.sets}</td>
                <td>${ex.reps}</td>
                <td>${ex.weight || "-"} kg</td>
                <td>${ex.restSeconds}s</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${workoutNotes ? `<div class="notes"><strong>Note:</strong> ${workoutNotes}</div>` : ""}
        <div class="footer">
          Generato da EMPATHY Performance - ${new Date().toLocaleDateString("it-IT")}
        </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <div className="space-y-4 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Libreria Esercizi</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowAIGenerator(true)}
            className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Genera con AI
          </Button>
          <Select value={selectedDay.toString()} onValueChange={(v) => onDayChange?.(Number.parseInt(v))}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayNames.map((day, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Muscle Group Buttons */}
      <div className="grid grid-cols-5 gap-2">
        {MUSCLE_GROUPS.map((group) => (
          <Button
            key={group.id}
            variant={selectedGroup === group.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedGroup(group.id)
              setSearchQuery("")
            }}
            style={selectedGroup === group.id ? { backgroundColor: group.color } : {}}
          >
            {group.name}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Cerca esercizio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Exercise List */}
      <ScrollArea className="max-h-[600px]">
        {exercises.map((exercise, index) => (
          <div key={exercise.id} className="flex items-center justify-between gap-4 p-4 border-b">
            <div className="flex items-center gap-4">
              {exercise.gifUrl && (
                <Image src={exercise.gifUrl || "/placeholder.svg"} alt={exercise.name} width={50} height={50} className="rounded" />
              )}
              <div>
                <h3 className="font-semibold">{exercise.name}</h3>
                <p className="text-sm text-muted-foreground">{exercise.bodyPart}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => addExercise(exercise)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {loading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="ml-2 text-sm text-muted-foreground">Caricamento esercizi...</p>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center p-4 text-red-600">
            {error}
          </div>
        )}
      </ScrollArea>

      {/* AI Workout Generator Dialog */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-700 p-0 gap-0 max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b border-zinc-700">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-fuchsia-500" />
              Genera Scheda con AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            <div className="space-y-4">
              {/* Obiettivo */}
              <div>
                <Label>Obiettivo</Label>
                <Select value={aiGoal} onValueChange={setAiGoal}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="ipertrofia">Ipertrofia (massa muscolare)</SelectItem>
                    <SelectItem value="forza">Forza massimale</SelectItem>
                    <SelectItem value="resistenza">Resistenza muscolare</SelectItem>
                    <SelectItem value="dimagrimento">Dimagrimento / Tono</SelectItem>
                    <SelectItem value="funzionale">Allenamento funzionale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Livello */}
              <div>
                <Label>Livello</Label>
                <Select value={aiLevel} onValueChange={setAiLevel}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="principiante">Principiante</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="avanzato">Avanzato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Durata */}
              <div>
                <Label>Durata (minuti)</Label>
                <Select value={aiDuration.toString()} onValueChange={(v) => setAiDuration(Number(v))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="75">75 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Gruppi Muscolari */}
              <div>
                <Label>Gruppi Muscolari</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["petto", "schiena", "spalle", "bicipiti", "tricipiti", "gambe", "glutei", "core", "polpacci"].map(group => (
                    <Button
                      key={group}
                      size="sm"
                      variant={aiMuscleGroups.includes(group) ? "default" : "outline"}
                      className={aiMuscleGroups.includes(group) ? "bg-fuchsia-500 hover:bg-fuchsia-600" : ""}
                      onClick={() => {
                        if (aiMuscleGroups.includes(group)) {
                          setAiMuscleGroups(aiMuscleGroups.filter(g => g !== group))
                        } else {
                          setAiMuscleGroups([...aiMuscleGroups, group])
                        }
                      }}
                    >
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Data */}
              <div>
                <Label className="flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-fuchsia-500" />
                  Data nel Calendario
                </Label>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(new Date(), i)
                    const isSelected = format(aiSelectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                    return (
                      <Button
                        key={i}
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className={`flex flex-col p-1 h-auto ${isSelected ? "bg-fuchsia-500 hover:bg-fuchsia-600" : ""}`}
                        onClick={() => setAiSelectedDate(date)}
                      >
                        <span className="text-[10px]">{format(date, 'EEE', { locale: it })}</span>
                        <span className="text-sm font-bold">{format(date, 'd')}</span>
                      </Button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(aiSelectedDate, 'EEEE d MMMM', { locale: it })}
                </p>
              </div>
              
              {!effectiveAthleteId && (
                <div className="p-2 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-400">
                  Effettua il login per salvare la scheda
                </div>
)}
            </div>
          </div>
          
          <DialogFooter className="flex-shrink-0 p-6 pt-4 border-t border-zinc-700 gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAIGenerator(false)}>
              Annulla
            </Button>
            <Button 
              size="sm"
              onClick={generateAIWorkout}
              disabled={aiGenerating || aiSaving || aiMuscleGroups.length === 0 || !effectiveAthleteId}
              className="bg-gradient-to-r from-fuchsia-500 to-purple-600"
            >
              {aiGenerating || aiSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {aiGenerating ? "Generando..." : "Salvando..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Genera e Salva
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
