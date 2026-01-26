"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  duration: number // seconds
  intensity: number // % FTP
  zone?: string
  repeats?: number
  recoveryDuration?: number
  recoveryIntensity?: number
  description?: string
}

interface WorkoutData {
  id: string
  title: string
  description?: string
  workout_type: string
  target_zone?: string
  duration_minutes?: number
  tss?: number
  intervals?: {
    blocks: WorkoutBlock[]
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
    default:
      return "bg-fuchsia-500"
  }
}

const getZoneName = (zone: string): string => {
  switch (zone?.toUpperCase()) {
    case "Z1":
      return "Recovery"
    case "Z2":
      return "Endurance"
    case "Z3":
      return "Tempo"
    case "Z4":
      return "Threshold"
    case "Z5":
      return "VO2max"
    case "Z6":
      return "Anaerobic"
    case "Z7":
      return "Neuromuscular"
    default:
      return zone
  }
}

const getBlockTypeName = (type: string): string => {
  switch (type) {
    case "warmup":
      return "Riscaldamento"
    case "interval":
      return "Intervallo"
    case "steady":
      return "Steady State"
    case "recovery":
      return "Recupero"
    case "cooldown":
      return "Defaticamento"
    default:
      return type
  }
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}'`
  }
  return secs > 0 ? `${mins}'${secs}"` : `${mins}'`
}

const getWorkoutIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "cycling":
    case "bike":
      return <Bike className="h-6 w-6" />
    case "gym":
    case "strength":
    case "palestra":
      return <Dumbbell className="h-6 w-6" />
    default:
      return <CalendarDays className="h-6 w-6" />
  }
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

  // Generate default blocks if none exist
  const blocks: WorkoutBlock[] = workout.intervals?.blocks || generateDefaultBlocks(workout)

  // Calculate total duration from blocks
  const totalBlockDuration = blocks.reduce((sum, block) => {
    let blockTime = block.duration
    if (block.type === "interval" && block.repeats) {
      blockTime = (block.duration + (block.recoveryDuration || 0)) * block.repeats
    }
    return sum + blockTime
  }, 0)

  // Calculate power targets
  const calculatePower = (intensity: number) => Math.round((intensity / 100) * athleteFTP)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${getZoneColor(workout.target_zone || "Z2")} text-white`}
            >
              {getWorkoutIcon(workout.workout_type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span>{dayName}</span>
                <Badge className={`${getZoneColor(workout.target_zone || "Z2")} text-white`}>
                  {workout.target_zone || "MIXED"}
                </Badge>
                {workout.completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>
              <p className="text-lg font-bold">{workout.title}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-fuchsia-500" />
                <p className="text-xs text-muted-foreground">Durata</p>
                <p className="font-bold">
                  {workout.duration_minutes
                    ? `${Math.floor(workout.duration_minutes / 60)}h ${workout.duration_minutes % 60}m`
                    : formatDuration(totalBlockDuration)}
                </p>
              </CardContent>
            </Card>
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
          </div>

          {/* Description */}
          {workout.description && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">{workout.description}</p>
            </div>
          )}

          {/* Visual Block Chart */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Play className="h-4 w-4 text-fuchsia-500" />
              Struttura Allenamento
            </h3>

            {/* Visual Timeline Bar */}
            <div className="relative h-16 bg-muted rounded-lg overflow-hidden flex">
              {blocks.map((block, idx) => {
                let blockDuration = block.duration
                if (block.type === "interval" && block.repeats) {
                  blockDuration = (block.duration + (block.recoveryDuration || 0)) * block.repeats
                }
                const widthPercent = (blockDuration / totalBlockDuration) * 100
                const zone = block.zone || getZoneFromIntensity(block.intensity)

                return (
                  <div
                    key={idx}
                    className={`relative h-full ${getZoneColor(zone)} flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80`}
                    style={{ width: `${widthPercent}%`, minWidth: "30px" }}
                    title={`${getBlockTypeName(block.type)} - ${formatDuration(blockDuration)} @ ${block.intensity}%`}
                  >
                    {widthPercent > 8 && <span className="truncate px-1">{zone}</span>}
                  </div>
                )
              })}
            </div>

            {/* Detailed Blocks List */}
            <div className="space-y-2">
              {blocks.map((block, idx) => {
                const zone = block.zone || getZoneFromIntensity(block.intensity)
                const power = calculatePower(block.intensity)
                const blockDuration = block.duration

                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`w-2 h-12 rounded-full ${getZoneColor(zone)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getBlockTypeName(block.type)}</span>
                          <Badge variant="outline" className="text-xs">
                            {zone}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDuration(block.duration)}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{block.intensity}% FTP</span>
                        <span>{power}W</span>
                        {block.type === "interval" && block.repeats && (
                          <span className="text-fuchsia-400">
                            {block.repeats}x {formatDuration(block.duration)}
                            {block.recoveryDuration && ` rec ${formatDuration(block.recoveryDuration)}`}
                          </span>
                        )}
                      </div>
                      {block.description && <p className="text-xs text-muted-foreground mt-1">{block.description}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Metabolic Goals */}
          {(workout.metabolic_goal || workout.cho_target || workout.fat_target) && (
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

          {/* Action Button */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                className="border-blue-500 text-blue-500 hover:bg-blue-500/10 bg-transparent"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifica
              </Button>
            )}
            {!workout.completed && (
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700">
                <Play className="mr-2 h-4 w-4" />
                Inizia Allenamento
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Generate default blocks based on workout type and zone
function generateDefaultBlocks(workout: WorkoutData): WorkoutBlock[] {
  const duration = (workout.duration_minutes || 60) * 60 // convert to seconds
  const zone = workout.target_zone || "Z2"

  // Base intensities per zone
  const zoneIntensities: Record<string, number> = {
    Z1: 50,
    Z2: 65,
    Z3: 80,
    Z4: 95,
    Z5: 108,
    Z6: 130,
    Z7: 150,
  }

  const baseIntensity = zoneIntensities[zone.toUpperCase()] || 70

  // Generate blocks based on zone/type
  if (zone.toUpperCase() === "Z1" || zone.toUpperCase() === "Z2") {
    // Endurance workout - simple structure
    return [
      { type: "warmup", duration: 600, intensity: 50, zone: "Z1" },
      { type: "steady", duration: duration - 900, intensity: baseIntensity, zone },
      { type: "cooldown", duration: 300, intensity: 45, zone: "Z1" },
    ]
  } else if (zone.toUpperCase() === "Z4" || zone.toUpperCase() === "Z5") {
    // Interval workout
    const warmupTime = 900
    const cooldownTime = 600
    const mainTime = duration - warmupTime - cooldownTime
    const intervalDuration = zone.toUpperCase() === "Z4" ? 480 : 180 // 8' for Z4, 3' for Z5
    const recoveryDuration = zone.toUpperCase() === "Z4" ? 240 : 180 // 4' for Z4, 3' for Z5
    const repeats = Math.floor(mainTime / (intervalDuration + recoveryDuration))

    return [
      { type: "warmup", duration: warmupTime, intensity: 55, zone: "Z2" },
      {
        type: "interval",
        duration: intervalDuration,
        intensity: baseIntensity,
        zone,
        repeats,
        recoveryDuration,
        recoveryIntensity: 50,
      },
      { type: "cooldown", duration: cooldownTime, intensity: 45, zone: "Z1" },
    ]
  } else {
    // Tempo/threshold workout
    return [
      { type: "warmup", duration: 900, intensity: 55, zone: "Z2" },
      { type: "steady", duration: (duration - 1500) / 2, intensity: baseIntensity - 5, zone: "Z3" },
      { type: "steady", duration: (duration - 1500) / 2, intensity: baseIntensity, zone },
      { type: "cooldown", duration: 600, intensity: 45, zone: "Z1" },
    ]
  }
}
