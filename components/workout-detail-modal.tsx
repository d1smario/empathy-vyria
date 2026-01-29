"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  Target,
  Flame,
  Zap,
  TrendingUp,
  Bike,
  Dumbbell,
  CalendarDays,
  CheckCircle2,
  Play,
  Pencil,
} from "lucide-react"

interface WorkoutBlock {
  type: "warmup" | "interval" | "steady" | "recovery" | "cooldown"
  duration: number
  intensity: number
  zone?: string
  repeats?: number
  recoveryDuration?: number
  recoveryIntensity?: number
  description?: string
}

interface GymExercise {
  name: string
  sets: number
  reps: number | string
  rest: number
  equipment: string
  notes?: string
}

interface WorkoutData {
  id: string
  title: string
  description?: string
  workout_type: string
  activity_type?: string
  target_zone?: string
  duration_minutes?: number
  tss?: number
  intervals?: {
    blocks?: WorkoutBlock[]
    type?: string
    goal?: string
    level?: string
    exercises?: GymExercise[]
    warmup?: { name: string; duration: string }[]
    cooldown?: { name: string; duration: string }[]
  }
  metabolic_goal?: string
  cho_target?: number
  fat_target?: number
  completed?: boolean
}

interface WorkoutDetailModalProps {
  workout: WorkoutData | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  dayName?: string
  athleteFTP?: number
}

const getZoneFromIntensity = (intensity: number): string => {
  if (intensity < 55) return "Z1"
  if (intensity < 75) return "Z2"
  if (intensity < 90) return "Z3"
  if (intensity < 105) return "Z4"
  if (intensity < 120) return "Z5"
  if (intensity < 150) return "Z6"
  return "Z7"
}

const getZoneColor = (zone: string): string => {
  const colors: Record<string, string> = {
    Z1: "bg-slate-500", Z2: "bg-green-500", Z3: "bg-yellow-500",
    Z4: "bg-orange-500", Z5: "bg-red-500", Z6: "bg-red-600", Z7: "bg-red-800",
  }
  return colors[zone?.toUpperCase()] || "bg-fuchsia-500"
}

const getZoneName = (zone: string): string => {
  const names: Record<string, string> = {
    Z1: "Recovery", Z2: "Endurance", Z3: "Tempo",
    Z4: "Threshold", Z5: "VO2max", Z6: "Anaerobic", Z7: "Neuromuscular",
  }
  return names[zone?.toUpperCase()] || zone
}

const getBlockTypeName = (type: string): string => {
  const names: Record<string, string> = {
    warmup: "Riscaldamento", interval: "Intervallo", steady: "Steady State",
    recovery: "Recupero", cooldown: "Defaticamento",
  }
  return names[type] || type
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    return `${Math.floor(mins / 60)}h ${mins % 60}'`
  }
  return secs > 0 ? `${mins}'${secs}"` : `${mins}'`
}

const getWorkoutIcon = (type: string) => {
  if (type?.toLowerCase().includes("cycling") || type?.toLowerCase().includes("bike")) {
    return <Bike className="h-6 w-6" />
  }
  if (type?.toLowerCase().includes("gym") || type?.toLowerCase().includes("strength") || type?.toLowerCase().includes("palestra")) {
    return <Dumbbell className="h-6 w-6" />
  }
  return <CalendarDays className="h-6 w-6" />
}

export function WorkoutDetailModal({
  workout,
  isOpen,
  onClose,
  onEdit,
  dayName,
  athleteFTP = 300,
}: WorkoutDetailModalProps) {
  if (!workout) return null

  const isGymWorkout = workout.activity_type === 'strength' || 
                       workout.workout_type === 'gym' || 
                       workout.intervals?.type === 'gym'
  
  const gymExercises = workout.intervals?.exercises || []
  const blocks: WorkoutBlock[] = workout.intervals?.blocks || []
  
  const totalBlockDuration = blocks.reduce((sum, block) => {
    let blockTime = block.duration
    if (block.type === "interval" && block.repeats) {
      blockTime = (block.duration + (block.recoveryDuration || 0)) * block.repeats
    }
    return sum + blockTime
  }, 0)

  const calculatePower = (intensity: number) => Math.round((intensity / 100) * athleteFTP)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isGymWorkout ? 'bg-violet-600' : getZoneColor(workout.target_zone || "Z2")} text-white`}>
              {getWorkoutIcon(workout.activity_type || workout.workout_type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>{dayName}</span>
                {isGymWorkout ? (
                  <Badge className="bg-violet-600 text-white">PALESTRA</Badge>
                ) : (
                  <Badge className={`${getZoneColor(workout.target_zone || "Z2")} text-white`}>
                    {workout.target_zone || "MIXED"}
                  </Badge>
                )}
                {workout.completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>
              <p className="text-lg font-bold">{workout.title}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Summary Stats */}
          <div className={`grid ${isGymWorkout ? 'grid-cols-3' : 'grid-cols-4'} gap-3`}>
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-fuchsia-500" />
                <p className="text-xs text-muted-foreground">Durata</p>
                <p className="font-bold">{workout.duration_minutes ? `${workout.duration_minutes}'` : 'N/D'}</p>
              </CardContent>
            </Card>
            {isGymWorkout ? (
              <>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <Dumbbell className="h-5 w-5 mx-auto mb-1 text-violet-500" />
                    <p className="text-xs text-muted-foreground">Esercizi</p>
                    <p className="font-bold">{gymExercises.length}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-muted-foreground">Serie Tot.</p>
                    <p className="font-bold">{gymExercises.reduce((sum, ex) => sum + ex.sets, 0)}</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-muted-foreground">TSS</p>
                    <p className="font-bold">{workout.tss || "N/D"}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-xs text-muted-foreground">FTP Rif.</p>
                    <p className="font-bold">{athleteFTP}W</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-muted-foreground">Zona Target</p>
                    <p className="font-bold">{getZoneName(workout.target_zone || "Z2")}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Description */}
          {workout.description && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">{workout.description}</p>
            </div>
          )}

          {/* GYM WORKOUT CONTENT */}
          {isGymWorkout && gymExercises.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-violet-500" />
                Esercizi
              </h3>
              
              {/* Goal & Level */}
              <div className="flex gap-2 flex-wrap">
                {workout.intervals?.goal && (
                  <Badge className="bg-violet-600 text-white capitalize">{workout.intervals.goal}</Badge>
                )}
                {workout.intervals?.level && (
                  <Badge variant="outline" className="border-violet-500 text-violet-400 capitalize">{workout.intervals.level}</Badge>
                )}
              </div>
              
              {/* Warmup */}
              {workout.intervals?.warmup && workout.intervals.warmup.length > 0 && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h4 className="text-sm font-medium text-green-400 mb-2">Riscaldamento</h4>
                  {workout.intervals.warmup.map((w, i) => (
                    <div key={i} className="text-sm text-muted-foreground flex justify-between">
                      <span>{w.name}</span>
                      <span>{w.duration}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Exercises */}
              <ScrollArea className="max-h-[350px]">
                <div className="space-y-3 pr-4">
                  {gymExercises.map((exercise, idx) => (
                    <div key={idx} className="flex items-stretch bg-muted/30 rounded-xl overflow-hidden border border-border/50">
                      <div className="w-12 bg-violet-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 p-4">
                        <h4 className="font-semibold text-lg">{exercise.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize mb-3">{exercise.equipment}</p>
                        <div className="flex gap-6">
                          <div className="text-center">
                            <div className="text-[10px] text-muted-foreground uppercase">Serie</div>
                            <div className="text-2xl font-bold text-violet-400">{exercise.sets}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-muted-foreground uppercase">Reps</div>
                            <div className="text-2xl font-bold">{exercise.reps}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-muted-foreground uppercase">Recupero</div>
                            <div className="text-xl font-bold text-muted-foreground">{exercise.rest}s</div>
                          </div>
                        </div>
                        {exercise.notes && (
                          <p className="text-xs text-muted-foreground italic mt-2 pt-2 border-t border-dashed">{exercise.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Cooldown */}
              {workout.intervals?.cooldown && workout.intervals.cooldown.length > 0 && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Defaticamento</h4>
                  {workout.intervals.cooldown.map((c, i) => (
                    <div key={i} className="text-sm text-muted-foreground flex justify-between">
                      <span>{c.name}</span>
                      <span>{c.duration}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CYCLING WORKOUT CONTENT */}
          {!isGymWorkout && blocks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Play className="h-4 w-4 text-fuchsia-500" />
                Struttura Allenamento
              </h3>
              
              {/* Visual Timeline */}
              <div className="relative h-16 bg-muted rounded-lg overflow-hidden flex">
                {blocks.map((block, idx) => {
                  let blockDuration = block.duration
                  if (block.type === "interval" && block.repeats) {
                    blockDuration = (block.duration + (block.recoveryDuration || 0)) * block.repeats
                  }
                  const widthPercent = totalBlockDuration > 0 ? (blockDuration / totalBlockDuration) * 100 : 0
                  const zone = block.zone || getZoneFromIntensity(block.intensity)
                  return (
                    <div
                      key={idx}
                      className={`relative h-full ${getZoneColor(zone)} flex items-center justify-center text-white text-xs font-medium`}
                      style={{ width: `${widthPercent}%`, minWidth: "30px" }}
                    >
                      {widthPercent > 8 && <span>{zone}</span>}
                    </div>
                  )
                })}
              </div>
              
              {/* Blocks List */}
              <div className="space-y-2">
                {blocks.map((block, idx) => {
                  const zone = block.zone || getZoneFromIntensity(block.intensity)
                  const power = calculatePower(block.intensity)
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className={`w-2 h-12 rounded-full ${getZoneColor(zone)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getBlockTypeName(block.type)}</span>
                            <Badge variant="outline" className="text-xs">{zone}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDuration(block.duration)}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{block.intensity}% FTP</span>
                          <span>{power}W</span>
                          {block.type === "interval" && block.repeats && (
                            <span className="text-fuchsia-400">
                              {block.repeats}x {formatDuration(block.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Metabolic Goals (for cycling) */}
          {!isGymWorkout && (workout.metabolic_goal || workout.cho_target || workout.fat_target) && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Obiettivo Metabolico
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {workout.metabolic_goal && (
                  <Card className="bg-orange-500/10 border-orange-500/30">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-orange-400">Focus</p>
                      <p className="font-bold text-orange-300">{workout.metabolic_goal}</p>
                    </CardContent>
                  </Card>
                )}
                {workout.cho_target && (
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-blue-400">CHO Target</p>
                      <p className="font-bold text-blue-300">{workout.cho_target}g/h</p>
                    </CardContent>
                  </Card>
                )}
                {workout.fat_target && (
                  <Card className="bg-yellow-500/10 border-yellow-500/30">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-yellow-400">FAT Target</p>
                      <p className="font-bold text-yellow-300">{workout.fat_target}g/h</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>Chiudi</Button>
            {onEdit && (
              <Button variant="outline" onClick={onEdit} className="border-blue-500 text-blue-500 hover:bg-blue-500/10 bg-transparent">
                <Pencil className="mr-2 h-4 w-4" />
                Modifica
              </Button>
            )}
            {!workout.completed && (
              <Button className={isGymWorkout ? "bg-violet-600 hover:bg-violet-700" : "bg-fuchsia-600 hover:bg-fuchsia-700"}>
                <Play className="mr-2 h-4 w-4" />
                {isGymWorkout ? "Inizia Scheda" : "Inizia Allenamento"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
