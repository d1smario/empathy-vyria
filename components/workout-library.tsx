"use client"

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
  { id: "all", name: "Tutti", icon: Activity, color: "text-slate-500" },
  { id: "cycling", name: "Ciclismo", icon: Bike, color: "text-yellow-500" },
  { id: "running", name: "Corsa", icon: Footprints, color: "text-green-500" },
  { id: "swimming", name: "Nuoto", icon: Waves, color: "text-blue-500" },
  { id: "triathlon", name: "Triathlon", icon: Activity, color: "text-fuchsia-500" },
  { id: "trail_running", name: "Trail Running", icon: Mountain, color: "text-emerald-500" },
  { id: "mountain_bike", name: "MTB", icon: Bike, color: "text-orange-500" },
  { id: "gravel", name: "Gravel", icon: Bike, color: "text-amber-500" },
  { id: "cross_country_ski", name: "Sci Fondo", icon: Activity, color: "text-cyan-500" },
  { id: "ski_mountaineering", name: "Scialpinismo", icon: Mountain, color: "text-sky-500" },
  { id: "rowing", name: "Canottaggio", icon: Waves, color: "text-indigo-500" },
  { id: "gym", name: "Palestra", icon: Dumbbell, color: "text-red-500" },
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
              <SelectContent>
                {SPORTS.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    <div className="flex items-center gap-2">
                      <sport.icon className="h-4 w-4" />
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
              <SelectContent>
                {WORKOUT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${type.color}`} />
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
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span>{SportIcon}</span>
                          <span>{workout.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          <p>
                            {workout.duration_minutes} min • {workout.tss_estimate} TSS
                          </p>
                          {workout.description && <p className="mt-1 line-clamp-2">{workout.description}</p>}
                        </div>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkout ? "Modifica Allenamento" : "Nuovo Allenamento"}</DialogTitle>
            <DialogDescription>Crea un template di allenamento riutilizzabile</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Soglia 4x8'"
                />
              </div>

              <div className="space-y-2">
                <Label>Sport</Label>
                <Select value={formData.sport} onValueChange={(v) => setFormData({ ...formData, sport: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.filter((s) => s.id !== "all").map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        <div className="flex items-center gap-2">
                          <sport.icon className="h-4 w-4" />
                          {sport.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo Allenamento</Label>
                <Select
                  value={formData.workout_type}
                  onValueChange={(v) => setFormData({ ...formData, workout_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKOUT_TYPES.filter((t) => t.id !== "all").map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${type.color}`} />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Durata (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>TSS Stimato</Label>
                <Input
                  type="number"
                  value={formData.tss_estimate}
                  onChange={(e) => setFormData({ ...formData, tss_estimate: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Zona Primaria</Label>
                <Select
                  value={formData.primary_zone}
                  onValueChange={(v) => setFormData({ ...formData, primary_zone: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${ZONE_COLORS[zone]}`} />
                          {zone}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Descrizione</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione dell'allenamento..."
                  rows={3}
                />
              </div>
            </div>

            {/* Interval Blocks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Blocchi Intervallo</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIntervalBlock}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi Blocco
                </Button>
              </div>

              {formData.intervals && formData.intervals.length > 0 && (
                <div className="space-y-2">
                  {formData.intervals.map((block) => (
                    <div key={block.id} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <Input
                          value={block.name}
                          onChange={(e) => updateIntervalBlock(block.id, { name: e.target.value })}
                          className="w-32 h-8"
                          placeholder="Nome"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIntervalBlock(block.id)}
                          className="text-red-400 h-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Durata</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              value={block.duration}
                              onChange={(e) =>
                                updateIntervalBlock(block.id, { duration: Number.parseInt(e.target.value) || 0 })
                              }
                              className="h-8"
                            />
                            <Select
                              value={block.durationUnit}
                              onValueChange={(v) => updateIntervalBlock(block.id, { durationUnit: v as "min" | "sec" })}
                            >
                              <SelectTrigger className="w-16 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="min">min</SelectItem>
                                <SelectItem value="sec">sec</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Zona</Label>
                          <Select value={block.zone} onValueChange={(v) => updateIntervalBlock(block.id, { zone: v })}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ZONES.map((z) => (
                                <SelectItem key={z} value={z}>
                                  {z}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Serie</Label>
                          <Input
                            type="number"
                            value={block.numIntervals || 1}
                            onChange={(e) =>
                              updateIntervalBlock(block.id, { numIntervals: Number.parseInt(e.target.value) || 1 })
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Rec (sec)</Label>
                          <Input
                            type="number"
                            value={block.restBetweenIntervals || 0}
                            onChange={(e) =>
                              updateIntervalBlock(block.id, {
                                restBetweenIntervals: Number.parseInt(e.target.value) || 0,
                              })
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">%FTP</Label>
                          <Input
                            type="number"
                            value={block.intensity}
                            onChange={(e) =>
                              updateIntervalBlock(block.id, { intensity: Number.parseInt(e.target.value) || 0 })
                            }
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
