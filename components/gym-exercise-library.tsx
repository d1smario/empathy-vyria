"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dumbbell, Plus, Clock, Flame, X, RotateCcw, Save, Calendar, FileDown, Info, Loader2 } from "lucide-react"
import Image from "next/image"

// Gruppi muscolari - nomi ESATTI dall'API ExerciseDB (AscendAPI)
// bodyPart validi: back, cardio, chest, lower arms, lower legs, neck, shoulders, upper arms, upper legs, waist
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
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch exercises from API
  const fetchExercises = useCallback(async (bodyPart: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/exercises?bodyPart=${encodeURIComponent(bodyPart)}&limit=50`)
      const data = await response.json()
      if (data.exercises) {
        setExercises(data.exercises)
      } else {
        setError("Nessun esercizio trovato")
        setExercises([])
      }
    } catch (err) {
      setError("Errore nel caricamento degli esercizi")
      setExercises([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Search exercises
  const searchExercises = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchExercises(selectedGroup)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/exercises?search=${encodeURIComponent(query)}&limit=50`)
      const data = await response.json()
      if (data.exercises) {
        setExercises(data.exercises)
      } else {
        setError("Nessun esercizio trovato")
        setExercises([])
      }
    } catch (err) {
      setError("Errore nella ricerca")
      setExercises([])
    } finally {
      setLoading(false)
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Exercise list */}
        <div className="lg:col-span-3">
          <Card className="bg-card">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getMuscleGroupColor(selectedGroup) }}
                />
                {MUSCLE_GROUPS.find(g => g.id === selectedGroup)?.name || selectedGroup} 
                {!loading && ` (${exercises.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {loading ? (
                <div className="flex items-center justify-center h-[500px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                  {error}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
                    {exercises.map((exercise) => (
                      <Card
                        key={exercise.id}
                        className={`cursor-pointer hover:border-primary transition-colors ${
                          selectedExercises.find((e) => e.id === exercise.id) ? "border-primary bg-primary/10" : ""
                        }`}
                        onClick={() => addExercise(exercise)}
                      >
                        <CardContent className="p-2">
                          <div className="relative aspect-square mb-2 rounded overflow-hidden bg-muted">
                            <Image
                              src={exercise.gifUrl || exercise.imageUrl || "/placeholder.svg"}
                              alt={exercise.name}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = "/placeholder.svg?height=150&width=150"
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/50 hover:bg-black/70"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowExerciseDetail(exercise)
                              }}
                            >
                              <Info className="h-3 w-3 text-white" />
                            </Button>
                          </div>
                          <p className="text-xs font-medium truncate">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {exercise.target || exercise.bodyPart}
                          </p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {exercise.equipment && (
                              <Badge variant="outline" className="text-xs px-1">
                                {exercise.equipment}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workout builder */}
        <div className="lg:col-span-2">
          <Card className="bg-card">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Scheda ({selectedExercises.length})</span>
                {selectedExercises.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-3">
              <Input
                placeholder="Nome scheda..."
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="bg-background"
              />

              <ScrollArea className="h-[350px]">
                {selectedExercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Clicca sugli esercizi per aggiungerli
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedExercises.map((ex, idx) => (
                      <Card key={ex.id} className="p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium truncate flex-1">
                            {idx + 1}. {ex.name}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => removeExercise(ex.id)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Label className="text-xs">Serie</Label>
                            <Input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(ex.id, "sets", Number.parseInt(e.target.value) || 0)}
                              className="h-8 text-sm text-center"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              value={ex.reps}
                              onChange={(e) => updateExercise(ex.id, "reps", Number.parseInt(e.target.value) || 0)}
                              className="h-8 text-sm text-center"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Kg</Label>
                            <Input
                              type="number"
                              value={ex.weight}
                              onChange={(e) => updateExercise(ex.id, "weight", Number.parseInt(e.target.value) || 0)}
                              className="h-8 text-sm text-center"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Rec</Label>
                            <Input
                              type="number"
                              value={ex.restSeconds}
                              onChange={(e) =>
                                updateExercise(ex.id, "restSeconds", Number.parseInt(e.target.value) || 0)
                              }
                              className="h-8 text-sm text-center"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {selectedExercises.length > 0 && (
                <>
                  <Input
                    placeholder="Note aggiuntive..."
                    value={workoutNotes}
                    onChange={(e) => setWorkoutNotes(e.target.value)}
                    className="bg-background"
                  />
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {totals.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-4 w-4" /> {totals.calories} kcal
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Salva in Training
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF}>
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Exercise detail modal */}
      <Dialog open={!!showExerciseDetail} onOpenChange={() => setShowExerciseDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showExerciseDetail?.name}</DialogTitle>
          </DialogHeader>
          {showExerciseDetail && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded overflow-hidden bg-muted">
                <Image
                  src={showExerciseDetail.gifUrl || showExerciseDetail.imageUrl || "/placeholder.svg"}
                  alt={showExerciseDetail.name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Badge style={{ backgroundColor: getMuscleGroupColor(showExerciseDetail.bodyPart) }}>
                    {showExerciseDetail.bodyPartIt || showExerciseDetail.bodyPart}
                  </Badge>
                  {showExerciseDetail.target && (
                    <Badge variant="outline">{showExerciseDetail.target}</Badge>
                  )}
                  {showExerciseDetail.equipment && (
                    <Badge variant="secondary">{showExerciseDetail.equipment}</Badge>
                  )}
                </div>
                {showExerciseDetail.secondaryMuscles && showExerciseDetail.secondaryMuscles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Muscoli secondari:</p>
                    <div className="flex gap-1 flex-wrap">
                      {showExerciseDetail.secondaryMuscles.map((muscle, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {showExerciseDetail.instructions && showExerciseDetail.instructions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Istruzioni:</p>
                    <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                      {showExerciseDetail.instructions.map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => {
                addExercise(showExerciseDetail)
                setShowExerciseDetail(null)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi alla scheda
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
