"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Bike,
  Footprints,
  Waves,
  Mountain,
  Heart,
  Zap,
  Clock,
  TrendingUp,
  Flame,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  X,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type BlockType = "warmup" | "constant" | "increment" | "intervals_2" | "intervals_3" | "decrement" | "cooldown" | "free"

export interface WorkoutBlock {
  id: string
  blockType: BlockType
  primaryZone: string
  secondaryZone?: string
  tertiaryZone?: string
  duration: number
  durationUnit: "min" | "sec"
  numIntervals: number
  intervalDuration: number
  restBetweenIntervals: number
}

export interface GeneratedWorkout {
  id: string
  name: string
  sport: string
  zoneType: "hr" | "power"
  blocks: WorkoutBlock[]
  totalDuration: number
  estimatedTSS: number
  estimatedKcal: number
  notes: string
}

interface AdvancedWorkoutBuilderProps {
  open: boolean
  onClose: () => void
  onSave: (workout: GeneratedWorkout, dayIndex: number) => void
  dayIndex: number
  dayName: string
  athleteWeight?: number
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const SPORTS = [
  { id: "cycling", label: "Ciclismo", icon: Bike, supportsPower: true },
  { id: "running", label: "Corsa", icon: Footprints, supportsPower: false },
  { id: "swimming", label: "Nuoto", icon: Waves, supportsPower: false },
  { id: "triathlon", label: "Triathlon", icon: Activity, supportsPower: true },
  { id: "trail_running", label: "Trail", icon: Mountain, supportsPower: false },
  { id: "mtb", label: "MTB", icon: Bike, supportsPower: true },
  { id: "gravel", label: "Gravel", icon: Bike, supportsPower: true },
]

const BLOCK_TYPES: Record<BlockType, { label: string; color: string; description: string }> = {
  warmup: { label: "Riscaldamento", color: "bg-green-500", description: "Progressivo Z1-Z2" },
  constant: { label: "Costante", color: "bg-blue-500", description: "Intensità fissa" },
  increment: { label: "Incrementale", color: "bg-yellow-500", description: "Crescente" },
  intervals_2: { label: "Intervalli 2 zone", color: "bg-orange-500", description: "Lavoro + recupero" },
  intervals_3: { label: "Intervalli 3 zone", color: "bg-red-500", description: "Lavoro + recupero + picco" },
  decrement: { label: "Decrementale", color: "bg-purple-500", description: "Decrescente" },
  cooldown: { label: "Defaticamento", color: "bg-teal-500", description: "Progressivo Z2-Z1" },
  free: { label: "Libero", color: "bg-gray-500", description: "Configurazione libera" },
}

const ZONES_HR = [
  { id: "Z1", label: "Z1 - Recovery", color: "bg-gray-400", intensity: 0.5 },
  { id: "Z2", label: "Z2 - Endurance", color: "bg-blue-400", intensity: 0.65 },
  { id: "Z3", label: "Z3 - Tempo", color: "bg-green-400", intensity: 0.8 },
  { id: "Z4", label: "Z4 - Soglia", color: "bg-yellow-400", intensity: 0.9 },
  { id: "Z5", label: "Z5 - VO2max", color: "bg-orange-400", intensity: 1.0 },
  { id: "Z6", label: "Z6 - Anaerobico", color: "bg-red-400", intensity: 1.1 },
  { id: "Z7", label: "Z7 - Neuromuscolare", color: "bg-red-600", intensity: 1.2 },
]

const ZONES_POWER = [
  { id: "Z1", label: "Z1 - Recovery", color: "bg-gray-400", intensity: 0.55 },
  { id: "Z2", label: "Z2 - Endurance", color: "bg-blue-400", intensity: 0.75 },
  { id: "Z3", label: "Z3 - Tempo", color: "bg-green-400", intensity: 0.9 },
  { id: "Z4", label: "Z4 - Soglia", color: "bg-yellow-400", intensity: 1.0 },
  { id: "Z5", label: "Z5 - VO2max", color: "bg-orange-400", intensity: 1.18 },
  { id: "Z6", label: "Z6 - Anaerobico", color: "bg-red-400", intensity: 1.5 },
  { id: "Z7", label: "Z7 - Neuromuscolare", color: "bg-red-600", intensity: 2.0 },
]

const generateId = () => Math.random().toString(36).substring(2, 9)

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AdvancedWorkoutBuilder({
  open,
  onClose,
  onSave,
  dayIndex,
  dayName,
  athleteWeight = 70,
}: AdvancedWorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState("")
  const [sport, setSport] = useState("cycling")
  const [zoneType, setZoneType] = useState<"hr" | "power">("hr")
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([])
  const [notes, setNotes] = useState("")
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const sportConfig = SPORTS.find((s) => s.id === sport)
  const supportsPower = sportConfig?.supportsPower ?? false
  const zones = zoneType === "power" ? ZONES_POWER : ZONES_HR

  // Reset power to HR if sport doesn't support power
  useEffect(() => {
    if (!supportsPower && zoneType === "power") {
      setZoneType("hr")
    }
  }, [sport, supportsPower, zoneType])

  // Calculate totals
  const totalDuration = blocks.reduce((sum, block) => {
    if (block.blockType === "intervals_2" || block.blockType === "intervals_3") {
      const intervalSec = block.durationUnit === "min" ? block.intervalDuration * 60 : block.intervalDuration
      const totalSec = block.numIntervals * intervalSec + (block.numIntervals - 1) * block.restBetweenIntervals
      return sum + Math.round(totalSec / 60)
    }
    return sum + (block.durationUnit === "min" ? block.duration : Math.round(block.duration / 60))
  }, 0)

  const estimatedTSS = Math.round(
    blocks.reduce((sum, block) => {
      const zone = zones.find((z) => z.id === block.primaryZone)
      const intensity = zone?.intensity || 0.7
      const duration = block.durationUnit === "min" ? block.duration : block.duration / 60
      return sum + duration * intensity * intensity
    }, 0),
  )

  const estimatedKcal = Math.round(totalDuration * 10 * (athleteWeight / 70))

  // ═══════════════════════════════════════════════════════════════════
  // BLOCK MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  const addBlock = (type: BlockType) => {
    const newBlock: WorkoutBlock = {
      id: generateId(),
      blockType: type,
      primaryZone: type === "warmup" ? "Z1" : type === "cooldown" ? "Z2" : "Z3",
      secondaryZone: type === "intervals_2" || type === "intervals_3" ? "Z1" : undefined,
      tertiaryZone: type === "intervals_3" ? "Z5" : undefined,
      duration: type === "warmup" || type === "cooldown" ? 10 : 15,
      durationUnit: "min",
      numIntervals: type === "intervals_2" || type === "intervals_3" ? 5 : 1,
      intervalDuration: 3,
      restBetweenIntervals: 60,
    }
    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  const updateBlock = (id: string, updates: Partial<WorkoutBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id))
    if (selectedBlockId === id) setSelectedBlockId(null)
  }

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  // ═══════════════════════════════════════════════════════════════════
  // CANVAS DRAWING
  // ═══════════════════════════════════════════════════════════════════

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 30
    const graphHeight = height - padding * 2

    // Clear
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 7; i++) {
      const y = padding + (graphHeight / 7) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Zone labels
    ctx.fillStyle = "#666"
    ctx.font = "10px sans-serif"
    zones.forEach((zone, i) => {
      const y = padding + (graphHeight / 7) * (7 - i - 1) + 10
      ctx.fillText(zone.id, 5, y)
    })

    if (blocks.length === 0) {
      ctx.fillStyle = "#666"
      ctx.font = "14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Aggiungi blocchi per visualizzare il grafico", width / 2, height / 2)
      return
    }

    // Draw blocks
    const graphWidth = width - padding * 2
    const totalTime = totalDuration || 1
    let currentX = padding

    const getZoneY = (zoneId: string) => {
      const zoneIndex = zones.findIndex((z) => z.id === zoneId)
      return padding + graphHeight - ((zoneIndex + 1) / 7) * graphHeight
    }

    const getZoneColor = (zoneId: string) => {
      const zone = zones.find((z) => z.id === zoneId)
      return zone?.color.replace("bg-", "#").replace("-400", "") || "#888"
    }

    blocks.forEach((block) => {
      let blockDuration = block.durationUnit === "min" ? block.duration : block.duration / 60
      if (block.blockType === "intervals_2" || block.blockType === "intervals_3") {
        const intervalSec = block.durationUnit === "min" ? block.intervalDuration * 60 : block.intervalDuration
        const totalSec = block.numIntervals * intervalSec + (block.numIntervals - 1) * block.restBetweenIntervals
        blockDuration = totalSec / 60
      }

      const blockWidth = (blockDuration / totalTime) * graphWidth

      if (block.blockType === "constant" || block.blockType === "free") {
        const y = getZoneY(block.primaryZone)
        ctx.fillStyle = getZoneColor(block.primaryZone)
        ctx.globalAlpha = 0.7
        ctx.fillRect(currentX, y, blockWidth, graphHeight + padding - y)
      } else if (block.blockType === "warmup" || block.blockType === "increment") {
        const gradient = ctx.createLinearGradient(currentX, 0, currentX + blockWidth, 0)
        gradient.addColorStop(0, getZoneColor("Z1"))
        gradient.addColorStop(1, getZoneColor(block.primaryZone))
        ctx.fillStyle = gradient
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(currentX, graphHeight + padding)
        ctx.lineTo(currentX, getZoneY("Z1"))
        ctx.lineTo(currentX + blockWidth, getZoneY(block.primaryZone))
        ctx.lineTo(currentX + blockWidth, graphHeight + padding)
        ctx.closePath()
        ctx.fill()
      } else if (block.blockType === "cooldown" || block.blockType === "decrement") {
        const gradient = ctx.createLinearGradient(currentX, 0, currentX + blockWidth, 0)
        gradient.addColorStop(0, getZoneColor(block.primaryZone))
        gradient.addColorStop(1, getZoneColor("Z1"))
        ctx.fillStyle = gradient
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(currentX, graphHeight + padding)
        ctx.lineTo(currentX, getZoneY(block.primaryZone))
        ctx.lineTo(currentX + blockWidth, getZoneY("Z1"))
        ctx.lineTo(currentX + blockWidth, graphHeight + padding)
        ctx.closePath()
        ctx.fill()
      } else if (block.blockType === "intervals_2" || block.blockType === "intervals_3") {
        const intervalWidth = blockWidth / (block.numIntervals * 2 - 1)
        for (let i = 0; i < block.numIntervals; i++) {
          // Work
          ctx.fillStyle = getZoneColor(block.primaryZone)
          ctx.globalAlpha = 0.8
          const workY = getZoneY(block.primaryZone)
          ctx.fillRect(currentX + i * intervalWidth * 2, workY, intervalWidth, graphHeight + padding - workY)
          // Rest
          if (i < block.numIntervals - 1) {
            ctx.fillStyle = getZoneColor(block.secondaryZone || "Z1")
            ctx.globalAlpha = 0.5
            const restY = getZoneY(block.secondaryZone || "Z1")
            ctx.fillRect(
              currentX + i * intervalWidth * 2 + intervalWidth,
              restY,
              intervalWidth,
              graphHeight + padding - restY,
            )
          }
        }
      }

      ctx.globalAlpha = 1
      currentX += blockWidth
    })

    // Time axis
    ctx.fillStyle = "#888"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "left"
    ctx.fillText("0'", padding, height - 5)
    ctx.textAlign = "right"
    ctx.fillText(`${totalTime}'`, width - padding, height - 5)
  }, [blocks, zones, totalDuration])

  useEffect(() => {
    drawGraph()
  }, [drawGraph])

  // ═══════════════════════════════════════════════════════════════════
  // SAVE
  // ═══════════════════════════════════════════════════════════════════

  const handleSave = () => {
    if (blocks.length === 0) return

    const workout: GeneratedWorkout = {
      id: generateId(),
      name: workoutName || `Allenamento ${dayName}`,
      sport,
      zoneType,
      blocks,
      totalDuration,
      estimatedTSS,
      estimatedKcal,
      notes,
    }

    onSave(workout, dayIndex)
    onClose()
    setWorkoutName("")
    setBlocks([])
    setNotes("")
    setSelectedBlockId(null)
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId)

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-fuchsia-500" />
            Crea Allenamento - {dayName}
          </DialogTitle>
          <DialogDescription>
            Costruisci l'allenamento aggiungendo blocchi e configurando le intensità
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
          <div className="px-6 py-4 space-y-4">
            {/* ROW 1: Config + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Config */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Configurazione</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Nome Allenamento</Label>
                    <Input
                      value={workoutName}
                      onChange={(e) => setWorkoutName(e.target.value)}
                      placeholder="Es: Intervalli VO2max"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Sport</Label>
                      <Select value={sport} onValueChange={setSport}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPORTS.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <s.icon className="h-4 w-4" />
                                {s.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo Zone</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={zoneType === "hr" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setZoneType("hr")}
                          className="flex-1"
                        >
                          <Heart className="h-3 w-3 mr-1" />
                          FC
                        </Button>
                        <Button
                          variant={zoneType === "power" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setZoneType("power")}
                          disabled={!supportsPower}
                          className="flex-1"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Power
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Riepilogo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Clock className="h-5 w-5 mx-auto text-blue-400" />
                      <div className="text-2xl font-bold mt-1">{totalDuration}'</div>
                      <div className="text-xs text-muted-foreground">Durata</div>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 mx-auto text-orange-400" />
                      <div className="text-2xl font-bold mt-1">{estimatedTSS}</div>
                      <div className="text-xs text-muted-foreground">TSS</div>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <Flame className="h-5 w-5 mx-auto text-red-400" />
                      <div className="text-2xl font-bold mt-1">{estimatedKcal}</div>
                      <div className="text-xs text-muted-foreground">kcal</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ROW 2: Block Types */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aggiungi Blocco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {Object.entries(BLOCK_TYPES).map(([type, info]) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock(type as BlockType)}
                      className="flex-col h-auto py-2 px-2"
                    >
                      <div className={`w-4 h-4 rounded mb-1 ${info.color}`} />
                      <span className="text-[10px] leading-tight text-center">{info.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ROW 3: Graph */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Grafico Allenamento</CardTitle>
              </CardHeader>
              <CardContent>
                <canvas ref={canvasRef} width={700} height={200} className="w-full rounded border border-border" />
              </CardContent>
            </Card>

            {/* ROW 4: Blocks List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Blocchi ({blocks.length})</span>
                  {blocks.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setBlocks([])} className="text-red-500 h-6">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Svuota
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Clicca sui tipi di blocco sopra per iniziare</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                          selectedBlockId === block.id
                            ? "border-fuchsia-500 bg-fuchsia-500/5"
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="text-[10px]" variant="outline">
                              {index + 1}
                            </Badge>
                            <div className={`w-3 h-3 rounded ${BLOCK_TYPES[block.blockType].color}`} />
                            <span className="text-sm font-medium">{BLOCK_TYPES[block.blockType].label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveBlock(block.id, "up")
                              }}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                moveBlock(block.id, "down")
                              }}
                              disabled={index === blocks.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeBlock(block.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Block Configuration - Inline */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">Zona</Label>
                            <Select
                              value={block.primaryZone}
                              onValueChange={(v) => updateBlock(block.id, { primaryZone: v })}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {zones.map((z) => (
                                  <SelectItem key={z.id} value={z.id}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded ${z.color}`} />
                                      {z.id}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {block.blockType === "intervals_2" || block.blockType === "intervals_3" ? (
                            <>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Ripetute</Label>
                                <Input
                                  type="number"
                                  value={block.numIntervals}
                                  onChange={(e) =>
                                    updateBlock(block.id, { numIntervals: Number.parseInt(e.target.value) || 1 })
                                  }
                                  className="h-7 text-xs"
                                  min={1}
                                  max={30}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Durata</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={block.intervalDuration}
                                    onChange={(e) =>
                                      updateBlock(block.id, { intervalDuration: Number.parseInt(e.target.value) || 1 })
                                    }
                                    className="h-7 text-xs w-14"
                                    min={1}
                                  />
                                  <Select
                                    value={block.durationUnit}
                                    onValueChange={(v) => updateBlock(block.id, { durationUnit: v as "min" | "sec" })}
                                  >
                                    <SelectTrigger className="h-7 w-14 text-xs">
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
                                <Label className="text-[10px] text-muted-foreground">Rec (sec)</Label>
                                <Input
                                  type="number"
                                  value={block.restBetweenIntervals}
                                  onChange={(e) =>
                                    updateBlock(block.id, {
                                      restBetweenIntervals: Number.parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="h-7 text-xs"
                                  min={0}
                                  step={10}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Durata</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={block.duration}
                                    onChange={(e) =>
                                      updateBlock(block.id, { duration: Number.parseInt(e.target.value) || 1 })
                                    }
                                    className="h-7 text-xs w-14"
                                    min={1}
                                  />
                                  <Select
                                    value={block.durationUnit}
                                    onValueChange={(v) => updateBlock(block.id, { durationUnit: v as "min" | "sec" })}
                                  >
                                    <SelectTrigger className="h-7 w-14 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="min">min</SelectItem>
                                      <SelectItem value="sec">sec</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Secondary zone for intervals */}
                        {(block.blockType === "intervals_2" || block.blockType === "intervals_3") && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-muted-foreground">Zona Recupero</Label>
                                <Select
                                  value={block.secondaryZone || "Z1"}
                                  onValueChange={(v) => updateBlock(block.id, { secondaryZone: v })}
                                >
                                  <SelectTrigger className="h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {zones.map((z) => (
                                      <SelectItem key={z.id} value={z.id}>
                                        {z.id}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {block.blockType === "intervals_3" && (
                                <div>
                                  <Label className="text-[10px] text-muted-foreground">Zona Picco</Label>
                                  <Select
                                    value={block.tertiaryZone || "Z5"}
                                    onValueChange={(v) => updateBlock(block.id, { tertiaryZone: v })}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {zones.map((z) => (
                                        <SelectItem key={z.id} value={z.id}>
                                          {z.id}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ROW 5: Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Note</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note aggiuntive per l'allenamento..."
                  rows={2}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={blocks.length === 0} className="bg-fuchsia-600 hover:bg-fuchsia-700">
            <Save className="h-4 w-4 mr-2" />
            Salva Allenamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdvancedWorkoutBuilder
