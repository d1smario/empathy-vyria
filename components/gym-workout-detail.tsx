"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Dumbbell,
  Clock,
  Target,
  Flame,
  Timer,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Pencil,
  Save,
  Zap,
} from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import Image from "next/image"

interface GymExercise {
  name: string
  sets: number
  reps: number | string
  rest: number
  equipment?: string
  notes?: string
  weight?: number
  completed?: boolean[]
}

interface GymWorkoutData {
  id: string
  title: string
  description?: string
  activity_date: string
  duration_minutes?: number
  completed?: boolean
  intervals?: {
    type: string
    goal?: string
    level?: string
    exercises: GymExercise[]
    warmup?: { name: string; duration: string }[]
    cooldown?: { name: string; duration: string }[]
  }
}

interface GymWorkoutDetailProps {
  workout: GymWorkoutData | null
  isOpen: boolean
  onClose: () => void
  onSave?: (workout: GymWorkoutData) => void
}

const MUSCLE_IMAGES: Record<string, string> = {
  petto: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop",
  schiena: "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=100&h=100&fit=crop",
  spalle: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=100&h=100&fit=crop",
  bicipiti: "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=100&h=100&fit=crop",
  tricipiti: "https://images.unsplash.com/photo-1590507621108-433608c97823?w=100&h=100&fit=crop",
  gambe: "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=100&h=100&fit=crop",
  glutei: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=100&h=100&fit=crop",
  core: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop",
}

const getExerciseImage = (name: string): string => {
  const nameLower = name.toLowerCase()
  if (nameLower.includes("panca") || nameLower.includes("chest") || nameLower.includes("petto")) return MUSCLE_IMAGES.petto
  if (nameLower.includes("lat") || nameLower.includes("row") || nameLower.includes("pull") || nameLower.includes("schiena")) return MUSCLE_IMAGES.schiena
  if (nameLower.includes("spall") || nameLower.includes("shoulder") || nameLower.includes("press")) return MUSCLE_IMAGES.spalle
  if (nameLower.includes("curl") || nameLower.includes("bicip")) return MUSCLE_IMAGES.bicipiti
  if (nameLower.includes("tricip") || nameLower.includes("pushdown") || nameLower.includes("extension")) return MUSCLE_IMAGES.tricipiti
  if (nameLower.includes("squat") || nameLower.includes("leg") || nameLower.includes("gamb")) return MUSCLE_IMAGES.gambe
  if (nameLower.includes("glut") || nameLower.includes("hip")) return MUSCLE_IMAGES.glutei
  if (nameLower.includes("crunch") || nameLower.includes("plank") || nameLower.includes("core") || nameLower.includes("addom")) return MUSCLE_IMAGES.core
  return MUSCLE_IMAGES.petto
}

const formatRest = (seconds: number): string => {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}' ${secs}"` : `${mins}'`
  }
  return `${seconds}"`
}

export function GymWorkoutDetail({ workout, isOpen, onClose, onSave }: GymWorkoutDetailProps) {
  const [exercises, setExercises] = useState<GymExercise[]>([])
  const [expandedExercise, setExpandedExercise] = useState<number | null>(0)
  const [editingWeight, setEditingWeight] = useState<{ exerciseIdx: number; setIdx: number } | null>(null)
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number; exerciseIdx: number } | null>(null)
  const [weights, setWeights] = useState<Record<string, number>>({})

  // Initialize exercises from workout
  useState(() => {
    if (workout?.intervals?.exercises) {
      const exs = workout.intervals.exercises.map(ex => ({
        ...ex,
        completed: ex.completed || new Array(ex.sets).fill(false),
        weight: ex.weight || 0,
      }))
      setExercises(exs)
    }
  })

  if (!workout) return null

  const intervalData = workout.intervals
  const workoutExercises = intervalData?.exercises || []
  
  // Calculate progress
  const totalSets = workoutExercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)
  const completedSets = exercises.reduce((sum, ex) => 
    sum + (ex.completed?.filter(Boolean).length || 0), 0
  )
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  const toggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    setExercises(prev => {
      const updated = [...prev]
      if (!updated[exerciseIdx]) {
        updated[exerciseIdx] = { 
          ...workoutExercises[exerciseIdx], 
          completed: new Array(workoutExercises[exerciseIdx].sets).fill(false) 
        }
      }
      if (!updated[exerciseIdx].completed) {
        updated[exerciseIdx].completed = new Array(updated[exerciseIdx].sets).fill(false)
      }
      updated[exerciseIdx].completed![setIdx] = !updated[exerciseIdx].completed![setIdx]
      return updated
    })
  }

  const updateWeight = (exerciseIdx: number, weight: number) => {
    const key = `${exerciseIdx}`
    setWeights(prev => ({ ...prev, [key]: weight }))
  }

  const startRestTimer = (exerciseIdx: number, restSeconds: number) => {
    setRestTimer({ active: true, seconds: restSeconds, exerciseIdx })
    
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (!prev || prev.seconds <= 1) {
          clearInterval(interval)
          return null
        }
        return { ...prev, seconds: prev.seconds - 1 }
      })
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] p-0 bg-zinc-950 border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-4 border-b border-zinc-800 bg-gradient-to-r from-fuchsia-950/50 to-purple-950/50">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-white">
                  {workout.title}
                </DialogTitle>
                <p className="text-sm text-zinc-400">
                  {format(new Date(workout.activity_date), "EEEE d MMMM yyyy", { locale: it })}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {intervalData?.goal && (
                    <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
                      {intervalData.goal}
                    </Badge>
                  )}
                  {intervalData?.level && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {intervalData.level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="text-center p-3 rounded-xl bg-zinc-900/50">
              <Clock className="h-5 w-5 mx-auto mb-1 text-fuchsia-400" />
              <p className="text-xs text-zinc-500">Durata</p>
              <p className="font-bold text-white">{workout.duration_minutes || 60} min</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-zinc-900/50">
              <Target className="h-5 w-5 mx-auto mb-1 text-purple-400" />
              <p className="text-xs text-zinc-500">Esercizi</p>
              <p className="font-bold text-white">{workoutExercises.length}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-zinc-900/50">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-400" />
              <p className="text-xs text-zinc-500">Serie Totali</p>
              <p className="font-bold text-white">{totalSets}</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-zinc-900/50">
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-400" />
              <p className="text-xs text-zinc-500">Completate</p>
              <p className="font-bold text-white">{completedSets}/{totalSets}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-zinc-800" />
          </div>
        </div>

        {/* Rest Timer Overlay */}
        {restTimer && (
          <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="text-center">
              <Timer className="h-16 w-16 mx-auto mb-4 text-fuchsia-400 animate-pulse" />
              <p className="text-6xl font-bold text-white mb-2">{restTimer.seconds}</p>
              <p className="text-zinc-400 mb-6">Recupero</p>
              <Button 
                variant="outline" 
                onClick={() => setRestTimer(null)}
                className="border-zinc-600"
              >
                <X className="h-4 w-4 mr-2" />
                Salta
              </Button>
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-3">
            {/* Warmup */}
            {intervalData?.warmup && intervalData.warmup.length > 0 && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Riscaldamento
                </h3>
                <div className="space-y-1">
                  {intervalData.warmup.map((w, i) => (
                    <p key={i} className="text-sm text-zinc-300">
                      {w.name} - {w.duration}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Exercises */}
            {workoutExercises.map((exercise, exIdx) => {
              const isExpanded = expandedExercise === exIdx
              const currentExercise = exercises[exIdx] || { 
                ...exercise, 
                completed: new Array(exercise.sets).fill(false) 
              }
              const exerciseWeight = weights[`${exIdx}`] || exercise.weight || 0
              const completedCount = currentExercise.completed?.filter(Boolean).length || 0
              const allComplete = completedCount === exercise.sets

              return (
                <Card 
                  key={exIdx} 
                  className={`bg-zinc-900/50 border-zinc-800 overflow-hidden transition-all ${
                    allComplete ? 'border-green-500/50 bg-green-500/5' : ''
                  }`}
                >
                  {/* Exercise Header */}
                  <div 
                    className="p-4 cursor-pointer flex items-center gap-4"
                    onClick={() => setExpandedExercise(isExpanded ? null : exIdx)}
                  >
                    {/* Exercise Image */}
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800">
                      <Image
                        src={getExerciseImage(exercise.name) || "/placeholder.svg"}
                        alt={exercise.name}
                        fill
                        className="object-cover"
                      />
                      {allComplete && (
                        <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                          <Check className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white truncate">{exercise.name}</h4>
                        {allComplete && (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">Completato</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                        <span className="flex items-center gap-1">
                          <span className="text-fuchsia-400 font-medium">{exercise.sets}</span> serie
                        </span>
                        <span className="text-zinc-600">x</span>
                        <span className="flex items-center gap-1">
                          <span className="text-purple-400 font-medium">{exercise.reps}</span> reps
                        </span>
                        <span className="text-zinc-600">|</span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {formatRest(exercise.rest)}
                        </span>
                      </div>
                      {exercise.equipment && (
                        <Badge variant="outline" className="mt-1 text-xs text-zinc-500 border-zinc-700">
                          {exercise.equipment}
                        </Badge>
                      )}
                    </div>

                    {/* Progress & Expand */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{completedCount}/{exercise.sets}</p>
                        <p className="text-xs text-zinc-500">serie</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-zinc-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-zinc-800 pt-4">
                      {/* Weight Input */}
                      <div className="flex items-center gap-3 mb-4">
                        <label className="text-sm text-zinc-400">Carico:</label>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 border-zinc-700 bg-transparent"
                            onClick={() => updateWeight(exIdx, Math.max(0, exerciseWeight - 2.5))}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={exerciseWeight}
                            onChange={(e) => updateWeight(exIdx, Number(e.target.value))}
                            className="w-20 h-8 text-center bg-zinc-800 border-zinc-700"
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0 border-zinc-700 bg-transparent"
                            onClick={() => updateWeight(exIdx, exerciseWeight + 2.5)}
                          >
                            +
                          </Button>
                          <span className="text-sm text-zinc-500">kg</span>
                        </div>
                      </div>

                      {/* Sets Grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: exercise.sets }, (_, setIdx) => {
                          const isComplete = currentExercise.completed?.[setIdx] || false
                          return (
                            <button
                              key={setIdx}
                              onClick={() => {
                                toggleSetComplete(exIdx, setIdx)
                                if (!isComplete) {
                                  startRestTimer(exIdx, exercise.rest)
                                }
                              }}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                isComplete 
                                  ? 'bg-green-500/20 border-green-500 text-green-400' 
                                  : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-fuchsia-500/50'
                              }`}
                            >
                              <div className="text-xs mb-1">Serie {setIdx + 1}</div>
                              <div className="font-bold">{exercise.reps}</div>
                              {isComplete && <Check className="h-4 w-4 mx-auto mt-1" />}
                            </button>
                          )
                        })}
                      </div>

                      {/* Notes */}
                      {exercise.notes && (
                        <p className="mt-3 text-sm text-zinc-500 italic">
                          Note: {exercise.notes}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}

            {/* Cooldown */}
            {intervalData?.cooldown && intervalData.cooldown.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Defaticamento
                </h3>
                <div className="space-y-1">
                  {intervalData.cooldown.map((c, i) => (
                    <p key={i} className="text-sm text-zinc-300">
                      {c.name} - {c.duration}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 bg-transparent">
            Chiudi
          </Button>
          <div className="flex gap-2">
            {progressPercent === 100 ? (
              <Button className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-2" />
                Allenamento Completato!
              </Button>
            ) : (
              <Button 
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700"
                onClick={() => {
                  // Save progress
                  if (onSave) {
                    const updatedWorkout = {
                      ...workout,
                      intervals: {
                        ...workout.intervals!,
                        exercises: workoutExercises.map((ex, idx) => ({
                          ...ex,
                          weight: weights[`${idx}`] || ex.weight,
                          completed: exercises[idx]?.completed || new Array(ex.sets).fill(false),
                        })),
                      },
                    }
                    onSave(updatedWorkout)
                  }
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Salva Progresso
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
