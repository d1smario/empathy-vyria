"use client"

import { cn } from "@/lib/utils"
import { Clock, Zap } from "lucide-react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Library,
  Plus,
  Search,
  Bike,
  Footprints,
  Waves,
  Dumbbell,
  Trash2,
  Check,
  X,
  Loader2,
  BookOpen,
  Activity,
  Mountain,
  Pencil,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Types
interface WorkoutTemplate {
  id: string
  user_id?: string
  created_by?: string
  is_public: boolean
  is_template?: boolean
  name: string
  sport: string
  workout_type: string
  description: string
  duration_minutes?: number
  duration_min?: number
  tss_estimate?: number
  tss_target?: number
  if_estimate?: number
  intensity_factor?: number
  primary_zone?: string
  zone_distribution?: Record<string, number>
  zones_distribution?: Record<string, number>
  intervals?: WorkoutBlock[]
  structure?: any
  tags: string[]
  created_at: string
}

interface WorkoutBlock {
  id: string
  name: string
  type: "warmup" | "interval" | "steady" | "recovery" | "cooldown"
  duration: number
  durationUnit: "min" | "sec"
  zone: string
  intensity: number
  numIntervals?: number
  restBetweenIntervals?: number
  description?: string
}

interface WorkoutLibraryProps {
  athleteId?: string
  coachId?: string
  onSelectWorkout?: (workout: WorkoutTemplate, dayIndex: number) => void
  selectedDay?: number
  onAssignToDay?: (dayIndex: number, workout: WorkoutTemplate) => Promise<void>
}

// Constants
const SPORTS = [
  { id: "all", name: "Tutti", icon: Activity, color: "text-slate-500", supportsPower: false },
  { id: "cycling", name: "Ciclismo", icon: Bike, color: "text-yellow-500", supportsPower: true },
  { id: "running", name: "Corsa", icon: Footprints, color: "text-green-500", supportsPower: false },
  { id: "swimming", name: "Nuoto", icon: Waves, color: "text-blue-500", supportsPower: false },
  { id: "triathlon", name: "Triathlon", icon: Activity, color: "text-fuchsia-500", supportsPower: true },
  { id: "trail_running", name: "Trail Running", icon: Mountain, color: "text-emerald-500", supportsPower: false },
  { id: "mountain_bike", name: "MTB", icon: Bike, color: "text-orange-500", supportsPower: true },
  { id: "gravel", name: "Gravel", icon: Bike, color: "text-amber-500", supportsPower: true },
  { id: "cross_country_ski", name: "Sci Fondo", icon: Activity, color: "text-cyan-500", supportsPower: false },
  { id: "ski_mountaineering", name: "Scialpinismo", icon: Mountain, color: "text-sky-500", supportsPower: false },
  { id: "rowing", name: "Canottaggio", icon: Waves, color: "text-indigo-500", supportsPower: true },
  { id: "gym", name: "Palestra", icon: Dumbbell, color: "text-red-500", supportsPower: false },
]

const WORKOUT_TYPES = [
  { id: "all", name: "Tutti i tipi", color: "bg-slate-500" },
  { id: "recovery", name: "Recupero", color: "bg-blue-500" },
  { id: "endurance", name: "Aerobico", color: "bg-green-500" },
  { id: "tempo", name: "Tempo", color: "bg-yellow-500" },
  { id: "threshold", name: "Soglia", color: "bg-orange-500" },
  { id: "vo2max", name: "VO2max", color: "bg-red-500" },
  { id: "anaerobic", name: "Lattacido", color: "bg-red-600" },
  { id: "neuromuscular", name: "Neuromuscolare", color: "bg-purple-500" },
  { id: "strength", name: "Forza", color: "bg-amber-600" },
]

const ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5", "Z6", "Z7"]

const ZONE_COLORS: Record<string, string> = {
  Z1: "bg-slate-500",
  Z2: "bg-green-500",
  Z3: "bg-yellow-500",
  Z4: "bg-orange-500",
  Z5: "bg-red-500",
  Z6: "bg-red-600",
  Z7: "bg-purple-600",
}

const DAY_NAMES = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]

const generateId = () => Math.random().toString(36).substring(2, 9)

export function WorkoutLibrary({
  athleteId,
  coachId,
  onSelectWorkout,
  selectedDay,
  onAssignToDay,
}: WorkoutLibraryProps) {
  const supabase = createClient()

  // State
  const [workouts, setWorkouts] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tableExists, setTableExists] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [sportFilter, setSportFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Create/Edit dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutTemplate | null>(null)
  const [selectedDayForCopy, setSelectedDayForCopy] = useState<number>(selectedDay ?? 0)

  // Insert into Training dialog
  const [showInsertDialog, setShowInsertDialog] = useState(false)
  const [selectedWorkoutToInsert, setSelectedWorkoutToInsert] = useState<WorkoutTemplate | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0)

  // Form state
  const [formData, setFormData] = useState<Partial<WorkoutTemplate>>({
    name: "",
    sport: "cycling",
    workout_type: "endurance",
    description: "",
    duration_minutes: 60,
    tss_estimate: 60,
    primary_zone: "Z2",
    intervals: [],
    tags: [],
    is_public: false,
  })

  // Load workouts
  useEffect(() => {
    loadWorkouts()
  }, [])

  const loadWorkouts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("workout_library")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message?.includes("schema cache") || error.message?.includes("does not exist")) {
          setTableExists(false)
          setWorkouts([])
          return
        }
        throw error
      }
      setTableExists(true)
      
      // Map database fields to component interface
      const mappedWorkouts = (data || []).map((w: any) => ({
        id: w.id,
        user_id: w.user_id,
        created_by: w.user_id,
        is_public: w.is_public || false,
        is_template: w.is_template || false,
        name: w.name || 'Unnamed',
        sport: w.sport || 'cycling',
        workout_type: w.workout_type || 'endurance',
        description: w.description || '',
        duration_minutes: w.duration_min || w.duration_minutes || 60,
        tss_estimate: w.tss_target || w.tss_estimate || 0,
        if_estimate: w.intensity_factor || w.if_estimate || 0,
        primary_zone: w.primary_zone || 'Z2',
        zone_distribution: w.zones_distribution || w.zone_distribution || {},
        intervals: w.structure?.blocks || w.intervals || [],
        tags: w.tags || [],
        created_at: w.created_at,
      }))
      
      setWorkouts(mappedWorkouts)
    } catch (error) {
      console.error("Error loading workouts:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter workouts
  const filteredWorkouts = workouts.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSport = sportFilter === "all" || w.sport === sportFilter
    const matchesType = typeFilter === "all" || w.workout_type === typeFilter

    return matchesSearch && matchesSport && matchesType
  })

  // Group by sport
  const groupedBySport = filteredWorkouts.reduce(
    (acc, w) => {
      const sport = w.sport || "other"
      if (!acc[sport]) acc[sport] = []
      acc[sport].push(w)
      return acc
    },
    {} as Record<string, WorkoutTemplate[]>,
  )

  // Save workout
  const saveWorkout = async () => {
    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()

      const workoutData = {
        user_id: userData.user?.id,
        name: formData.name,
        sport: formData.sport,
        workout_type: formData.workout_type,
        description: formData.description,
        duration_min: formData.duration_minutes,
        tss_target: formData.tss_estimate,
        intensity_factor: formData.if_estimate,
        structure: formData.intervals ? { blocks: formData.intervals } : null,
        zones_distribution: formData.zone_distribution,
        tags: formData.tags,
        is_public: formData.is_public || false,
        is_template: true,
        updated_at: new Date().toISOString(),
      }

      if (editingWorkout) {
        const { error } = await supabase.from("workout_library").update(workoutData).eq("id", editingWorkout.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("workout_library").insert(workoutData)
        if (error) throw error
      }

      await loadWorkouts()
      setShowCreateDialog(false)
      setEditingWorkout(null)
      resetForm()
    } catch (error) {
      console.error("Error saving workout:", error)
    } finally {
      setSaving(false)
    }
  }

  // Delete workout
  const deleteWorkout = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo allenamento dalla biblioteca?")) return

    try {
      const { error } = await supabase.from("workout_library").delete().eq("id", id)

      if (error) throw error
      await loadWorkouts()
    } catch (error) {
      console.error("Error deleting workout:", error)
    }
  }

  // Insert workout into training
  const insertIntoTraining = async () => {
    if (!selectedWorkoutToInsert || !onAssignToDay) return

    try {
      // Call the parent callback to insert workout
      await onAssignToDay(selectedDayIndex, selectedWorkoutToInsert)

      alert(`Allenamento inserito in ${DAY_NAMES[selectedDayIndex]}!`)
      setShowInsertDialog(false)
      setSelectedWorkoutToInsert(null)
    } catch (error) {
      console.error("Error inserting into training:", error)
      alert("Errore nell'inserimento dell'allenamento")
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      sport: "cycling",
      workout_type: "endurance",
      description: "",
      duration_minutes: 60,
      tss_estimate: 60,
      primary_zone: "Z2",
      intervals: [],
      tags: [],
      is_public: false,
    })
  }

  // Open edit dialog
  const openEditDialog = (workout: WorkoutTemplate) => {
    setEditingWorkout(workout)
    setFormData({
      name: workout.name,
      sport: workout.sport,
      workout_type: workout.workout_type,
      description: workout.description,
      duration_minutes: workout.duration_minutes,
      tss_estimate: workout.tss_estimate,
      primary_zone: workout.primary_zone,
      intervals: workout.intervals || [],
      tags: workout.tags || [],
      is_public: workout.is_public,
    })
    setShowCreateDialog(true)
  }

  // Add interval block
  const addIntervalBlock = () => {
    const newBlock: WorkoutBlock = {
      id: generateId(),
      name: "Blocco",
      type: "interval",
      duration: 5,
      durationUnit: "min",
      zone: "Z4",
      intensity: 95,
      numIntervals: 4,
      restBetweenIntervals: 120,
    }
    setFormData((prev) => ({
      ...prev,
      intervals: [...(prev.intervals || []), newBlock],
    }))
  }

  // Remove interval block
  const removeIntervalBlock = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      intervals: (prev.intervals || []).filter((b) => b.id !== id),
    }))
  }

  // Update interval block
  const updateIntervalBlock = (id: string, updates: Partial<WorkoutBlock>) => {
    setFormData((prev) => ({
      ...prev,
      intervals: (prev.intervals || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }))
  }

  // Get sport icon
  const getSportIcon = (sport: string) => {
    const s = SPORTS.find((sp) => sp.id === sport)
    return s ? s.icon : Activity
  }

  // Get type info
  const getTypeInfo = (type: string) => {
    return WORKOUT_TYPES.find((t) => t.id === type) || WORKOUT_TYPES[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Library className="h-5 w-5 text-fuchsia-500" />
            Biblioteca Allenamenti
          </h3>
          <p className="text-sm text-muted-foreground">Template di allenamenti pronti da assegnare</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-fuchsia-600 hover:bg-fuchsia-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Allenamento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca allenamento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border">
                {SPORTS.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id} className="hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <sport.icon className={cn("h-4 w-4", sport.color)} />
                      {sport.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border">
                {WORKOUT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-3 w-3 rounded-full", type.color)} />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Workout List */}
      {!tableExists ? (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="py-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-lg font-semibold mb-2">Tabella Biblioteca non trovata</h3>
            <p className="text-muted-foreground mb-4">
              Per usare la Biblioteca Allenamenti, esegui lo script SQL su Supabase:
            </p>
            <code className="block p-3 bg-muted rounded-lg text-sm text-left overflow-x-auto mb-4">
              scripts/015-workout-library-table.sql
            </code>
            <p className="text-sm text-muted-foreground">
              Vai su Supabase Dashboard → SQL Editor → Copia e incolla il contenuto dello script → Esegui
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              {workouts.length === 0
                ? "Nessun allenamento in biblioteca. Crea il primo!"
                : "Nessun allenamento trovato con i filtri selezionati"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={sportFilter !== "all" ? sportFilter : Object.keys(groupedBySport)[0]} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {Object.entries(groupedBySport).map(([sport, items]) => {
              const SportIcon = getSportIcon(sport)
              return (
                <TabsTrigger key={sport} value={sport} className="flex items-center gap-2">
                  <SportIcon className="h-4 w-4" />
                  {SPORTS.find((s) => s.id === sport)?.name || sport}
                  <Badge variant="secondary" className="ml-1">
                    {items.length}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {Object.entries(groupedBySport).map(([sport, items]) => (
            <TabsContent key={sport} value={sport} className="mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((workout) => {
                  const typeInfo = getTypeInfo(workout.workout_type)
                  const SportIcon = getSportIcon(workout.sport)

                  return (
                    <Card key={workout.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-2">
                            <span>{SportIcon}</span>
                            <span>{workout.name}</span>
                          </div>
                          <Badge className={cn("text-xs text-white", typeInfo?.color || "bg-slate-500")}>
                            {typeInfo?.name || workout.workout_type}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{workout.duration_minutes || 60} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 text-orange-500" />
                            <span className="font-medium text-orange-500">{workout.tss_estimate || 0} TSS</span>
                          </div>
                          {workout.if_estimate && (
                            <div className="flex items-center gap-1">
                              <Activity className="h-3.5 w-3.5 text-fuchsia-500" />
                              <span className="font-medium text-fuchsia-500">IF {workout.if_estimate.toFixed(2)}</span>
                            </div>
                          )}
                          <Badge variant="outline" className="ml-auto">
                            {workout.primary_zone || "Z2"}
                          </Badge>
                        </div>
                        
                        {/* TrainingPeaks-style Block Chart */}
                        {workout.intervals && workout.intervals.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Struttura</div>
                            <div className="h-10 flex gap-0.5 rounded overflow-hidden bg-muted/30">
                              {workout.intervals.map((block, idx) => {
                                const zoneHeightMap: Record<string, string> = {
                                  Z1: "h-3", Z2: "h-4", Z3: "h-5", Z4: "h-6", Z5: "h-7", Z6: "h-8", Z7: "h-9", Z8: "h-10"
                                }
                                const durationMin = block.durationUnit === "sec" ? block.duration / 60 : block.duration
                                const totalDuration = workout.intervals!.reduce((sum, b) => 
                                  sum + (b.durationUnit === "sec" ? b.duration / 60 : b.duration), 0)
                                const widthPercent = (durationMin / totalDuration) * 100
                                
                                return (
                                  <div
                                    key={block.id || idx}
                                    className="flex items-end justify-center"
                                    style={{ width: `${widthPercent}%`, minWidth: '8px' }}
                                    title={`${block.name}: ${block.duration}${block.durationUnit} @ ${block.zone}`}
                                  >
                                    <div 
                                      className={cn(
                                        "w-full rounded-t transition-all",
                                        zoneHeightMap[block.zone] || "h-4",
                                        ZONE_COLORS[block.zone] || "bg-green-500"
                                      )}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>0'</span>
                              <span>{workout.duration_minutes}'</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-10 flex items-end rounded overflow-hidden bg-muted/30">
                            <div className={cn(
                              "w-full rounded-t h-5",
                              ZONE_COLORS[workout.primary_zone || "Z2"] || "bg-green-500"
                            )} />
                          </div>
                        )}
                        
                        {workout.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{workout.description}</p>
                        )}
                        
                        {workout.tags && workout.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {workout.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(workout)}>
                            <Pencil className="h-3 w-3 mr-1" />
                            Modifica
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteWorkout(workout.id)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Elimina
                          </Button>
                          <Button
                            size="sm"
                            className="ml-auto"
                            onClick={() => {
                              setSelectedWorkoutToInsert(workout)
                              setShowInsertDialog(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Usa in Training
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-fuchsia-500" />
              {editingWorkout ? "Modifica Allenamento" : "Crea Nuovo Allenamento"}
            </DialogTitle>
            <DialogDescription>Costruisci un allenamento strutturato con blocchi di intensita</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Sport Selection Grid - VYRIA Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sport Principale</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {SPORTS.filter((s) => s.id !== "all").map((sport) => {
                  const Icon = sport.icon
                  return (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, sport: sport.id })}
                      className={cn(
                        "p-3 rounded-lg border-2 transition flex flex-col items-center gap-1",
                        formData.sport === sport.id
                          ? "border-fuchsia-500 bg-fuchsia-500/10"
                          : "border-border bg-background hover:border-muted-foreground"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", sport.color)} />
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

            {/* Basic Info Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome Allenamento</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Soglia 4x8'"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.workout_type}
                  onValueChange={(v) => setFormData({ ...formData, workout_type: v })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {WORKOUT_TYPES.filter((t) => t.id !== "all").map((type) => (
                      <SelectItem key={type.id} value={type.id} className="hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", type.color)} />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zona Target</Label>
                <Select
                  value={formData.primary_zone}
                  onValueChange={(v) => setFormData({ ...formData, primary_zone: v })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone} className="hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", ZONE_COLORS[zone])} />
                          {zone}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Preview Block Chart */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Anteprima Struttura</Label>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formData.duration_minutes || 0} min</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-500">{formData.tss_estimate || 0} TSS</span>
                  </span>
                </div>
              </div>
              
              {/* Visual Block Chart */}
              <div className="h-20 flex gap-0.5 rounded-lg overflow-hidden bg-muted/50 border border-border">
                {formData.intervals && formData.intervals.length > 0 ? (
                  formData.intervals.map((block, idx) => {
                    const zoneHeightMap: Record<string, string> = {
                      Z1: "h-4", Z2: "h-6", Z3: "h-8", Z4: "h-10", Z5: "h-12", Z6: "h-14", Z7: "h-16", Z8: "h-20"
                    }
                    const durationMin = block.durationUnit === "sec" ? block.duration / 60 : block.duration
                    const totalDuration = formData.intervals!.reduce((sum, b) => 
                      sum + (b.durationUnit === "sec" ? b.duration / 60 : b.duration), 0)
                    const widthPercent = totalDuration > 0 ? (durationMin / totalDuration) * 100 : 0
                    
                    return (
                      <div
                        key={block.id || idx}
                        className="flex items-end justify-center relative group cursor-pointer"
                        style={{ width: `${Math.max(widthPercent, 5)}%`, minWidth: '20px' }}
                        title={`${block.name}: ${block.duration}${block.durationUnit} @ ${block.zone} (${block.intensity}%)`}
                      >
                        <div 
                          className={cn(
                            "w-full rounded-t transition-all flex items-center justify-center",
                            zoneHeightMap[block.zone] || "h-6",
                            ZONE_COLORS[block.zone] || "bg-green-500"
                          )}
                        >
                          <span className="text-[10px] text-white font-bold">{block.zone}</span>
                        </div>
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap z-10">
                          <p className="font-medium">{block.name}</p>
                          <p>{block.duration}{block.durationUnit} @ {block.intensity}% FTP</p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="w-full flex items-end justify-center">
                    <div className={cn(
                      "w-full rounded-t h-8",
                      ZONE_COLORS[formData.primary_zone] || "bg-green-500"
                    )}>
                      <div className="h-full flex items-center justify-center text-white text-sm font-medium">
                        {formData.primary_zone || "Z2"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>0 min</span>
                <span>{formData.duration_minutes || 60} min</span>
              </div>
            </div>

            {/* Interval Blocks Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Blocchi Allenamento</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIntervalBlock} className="bg-transparent">
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi Blocco
                </Button>
              </div>

              {formData.intervals && formData.intervals.length > 0 && (
                <div className="space-y-2">
                  {formData.intervals.map((block, blockIdx) => (
                    <div key={block.id} className={cn(
                      "p-3 rounded-lg border-l-4 bg-background",
                      ZONE_COLORS[block.zone]?.replace('bg-', 'border-') || "border-green-500"
                    )}>
                      <div className="flex items-center gap-3">
                        {/* Zone indicator */}
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                          ZONE_COLORS[block.zone] || "bg-green-500"
                        )}>
                          {block.zone}
                        </div>
                        
                        {/* Block name */}
                        <Input
                          value={block.name}
                          onChange={(e) => updateIntervalBlock(block.id, { name: e.target.value })}
                          className="w-32 h-9 bg-muted/50"
                          placeholder="Nome"
                        />
                        
                        {/* Duration */}
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={block.duration}
                            onChange={(e) => updateIntervalBlock(block.id, { duration: Number.parseInt(e.target.value) || 0 })}
                            className="w-16 h-9 bg-muted/50"
                          />
                          <Select
                            value={block.durationUnit}
                            onValueChange={(v) => updateIntervalBlock(block.id, { durationUnit: v as "min" | "sec" })}
                          >
                            <SelectTrigger className="w-16 h-9 bg-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border border-border">
                              <SelectItem value="min">min</SelectItem>
                              <SelectItem value="sec">sec</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Zone selector */}
                        <Select value={block.zone} onValueChange={(v) => updateIntervalBlock(block.id, { zone: v })}>
                          <SelectTrigger className="w-20 h-9 bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border border-border">
                            {ZONES.map((z) => (
                              <SelectItem key={z} value={z}>
                                <div className="flex items-center gap-2">
                                  <div className={cn("h-3 w-3 rounded-full", ZONE_COLORS[z])} />
                                  {z}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {/* Intensity */}
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={block.intensity}
                            onChange={(e) => updateIntervalBlock(block.id, { intensity: Number.parseInt(e.target.value) || 0 })}
                            className="w-16 h-9 bg-muted/50"
                          />
                          <span className="text-xs text-muted-foreground">%FTP</span>
                        </div>
                        
                        {/* Delete */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIntervalBlock(block.id)}
                          className="text-red-400 h-9 w-9 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Optional series/recovery */}
                      <div className="flex items-center gap-4 mt-2 ml-13 text-sm">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground">Serie:</Label>
                          <Input
                            type="number"
                            value={block.numIntervals || 1}
                            onChange={(e) => updateIntervalBlock(block.id, { numIntervals: Number.parseInt(e.target.value) || 1 })}
                            className="w-12 h-7 bg-muted/50 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground">Rec:</Label>
                          <Input
                            type="number"
                            value={block.restBetweenIntervals || 0}
                            onChange={(e) => updateIntervalBlock(block.id, { restBetweenIntervals: Number.parseInt(e.target.value) || 0 })}
                            className="w-12 h-7 bg-muted/50 text-xs"
                          />
                          <span className="text-xs text-muted-foreground">sec</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duration, TSS, IF Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Durata Totale (min)
                </Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number.parseInt(e.target.value) || 0 })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-orange-500" />
                  TSS Stimato
                </Label>
                <Input
                  type="number"
                  value={formData.tss_estimate}
                  onChange={(e) => setFormData({ ...formData, tss_estimate: Number.parseInt(e.target.value) || 0 })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-fuchsia-500" />
                  IF Stimato
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.if_estimate || 0}
                  onChange={(e) => setFormData({ ...formData, if_estimate: Number.parseFloat(e.target.value) || 0 })}
                  className="bg-background"
                  placeholder="0.85"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrizione / Note</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrivi l'allenamento, obiettivi, sensazioni target..."
                rows={3}
                className="bg-background"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags (separati da virgola)</Label>
              <Input
                value={(formData.tags || []).join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="es. indoor, salita, FTP test"
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setEditingWorkout(null)
                resetForm()
              }}
            >
              Annulla
            </Button>
            <Button
              onClick={saveWorkout}
              disabled={saving || !formData.name}
              className="bg-fuchsia-600 hover:bg-fuchsia-700"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {editingWorkout ? "Salva Modifiche" : "Crea Allenamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inserisci in Training</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="font-medium">{selectedWorkoutToInsert?.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedWorkoutToInsert?.duration_minutes} min • {selectedWorkoutToInsert?.tss_estimate} TSS
              </p>
            </div>
            <div>
              <Label>Seleziona giorno</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DAY_NAMES.map((dayName, index) => (
                  <Button
                    key={index}
                    variant={selectedDayIndex === index ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setSelectedDayIndex(index)}
                  >
                    {dayName}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInsertDialog(false)}>
              Annulla
            </Button>
            <Button onClick={insertIntoTraining}>Inserisci</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
