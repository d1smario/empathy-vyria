"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Flower2, Activity, Brain, Move, Speech as Stretch, Snowflake, Play, Clock, Plus, X, Save, ChevronRight, Timer, Dumbbell, Info, Calendar, Printer } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface LifestyleActivity {
  id: string
  name: string
  nameIt: string
  category: "yoga" | "pilates" | "meditation" | "mobility" | "stretching" | "cold_therapy"
  subcategory?: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  imageUrl: string
  videoUrl?: string
  instructions: string[]
  benefits: string[]
  equipment?: string[]
}

interface LifestyleSession {
  id: string
  name: string
  activities: LifestyleActivity[]
  totalDuration: number
  category: string
}

interface LifestyleSectionProps {
  athleteData?: {
    id: string
  } | null
  userName?: string | null
}

const CATEGORIES = [
  { id: "yoga", label: "Yoga", icon: Flower2, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "pilates", label: "Pilates", icon: Activity, color: "text-pink-500", bgColor: "bg-pink-500/10" },
  { id: "meditation", label: "Meditazione", icon: Brain, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "mobility", label: "Mobility", icon: Move, color: "text-green-500", bgColor: "bg-green-500/10" },
  { id: "stretching", label: "Stretching", icon: Stretch, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { id: "cold_therapy", label: "Cold Therapy", icon: Snowflake, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
]

const DIFFICULTY_COLORS = {
  beginner: "bg-green-500/20 text-green-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-red-500/20 text-red-400",
}

const DIFFICULTY_LABELS = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzato",
}

const DAYS_OF_WEEK = [
  { id: 0, short: "Dom", full: "Domenica" },
  { id: 1, short: "Lun", full: "Lunedi" },
  { id: 2, short: "Mar", full: "Martedi" },
  { id: 3, short: "Mer", full: "Mercoledi" },
  { id: 4, short: "Gio", full: "Giovedi" },
  { id: 5, short: "Ven", full: "Venerdi" },
  { id: 6, short: "Sab", full: "Sabato" },
]

export default function LifestyleSection({ athleteData, userName }: LifestyleSectionProps) {
  const [activeCategory, setActiveCategory] = useState("yoga")
  const [activities, setActivities] = useState<LifestyleActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<LifestyleActivity | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showSessionBuilder, setShowSessionBuilder] = useState(false)
  const [sessionActivities, setSessionActivities] = useState<LifestyleActivity[]>([])
  const [sessionName, setSessionName] = useState("")
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
  const [sessionStep, setSessionStep] = useState<"category" | "activities">("category")
  const [sessionCategory, setSessionCategory] = useState<string>("")
  const [sessionCategoryActivities, setSessionCategoryActivities] = useState<LifestyleActivity[]>([])
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const [savedSessions, setSavedSessions] = useState<Record<number, LifestyleSession[]>>({})

  const supabase = createClient()

  const fetchActivities = useCallback(async (category: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ category })
      if (difficultyFilter !== "all") {
        params.append("difficulty", difficultyFilter)
      }
      const response = await fetch(`/api/lifestyle?${params}`)
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error("Error fetching lifestyle activities:", error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }, [difficultyFilter])

  useEffect(() => {
    fetchActivities(activeCategory)
  }, [activeCategory, difficultyFilter, fetchActivities])

  useEffect(() => {
    if (athleteData?.id) {
      loadSavedSessions()
    }
  }, [athleteData?.id])

  const loadSavedSessions = async () => {
    if (!athleteData?.id) return
    try {
      const { data, error } = await supabase
        .from("training_activities")
        .select("*")
        .eq("athlete_id", athleteData.id)
        .eq("sport", "lifestyle")

      if (!error && data) {
        const sessionsByDay: Record<number, LifestyleSession[]> = {}
        data.forEach((workout: any) => {
          const activityDate = new Date(workout.activity_date)
          const day = activityDate.getDay()
          if (!sessionsByDay[day]) sessionsByDay[day] = []
          const workoutData = typeof workout.workout_data === "string" ? JSON.parse(workout.workout_data) : workout.workout_data
          sessionsByDay[day].push({
            id: workout.id,
            name: workout.description || "Sessione Lifestyle",
            activities: workoutData?.activities || [],
            totalDuration: workout.duration_minutes || 0,
            category: workoutData?.category || "yoga",
          })
        })
        setSavedSessions(sessionsByDay)
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
    }
  }

  const fetchSessionCategoryActivities = async (category: string) => {
    try {
      const response = await fetch(`/api/lifestyle?category=${category}`)
      const data = await response.json()
      setSessionCategoryActivities(data.activities || [])
    } catch (error) {
      console.error("Error fetching session activities:", error)
      setSessionCategoryActivities([])
    }
  }

  const selectSessionCategory = (categoryId: string) => {
    setSessionCategory(categoryId)
    fetchSessionCategoryActivities(categoryId)
    setSessionStep("activities")
  }

  const openSessionBuilder = () => {
    setShowSessionBuilder(true)
    setSessionStep("category")
    setSessionCategory("")
    setSessionActivities([])
    setSessionName("")
    setSessionCategoryActivities([])
  }

  const addToSession = (activity: LifestyleActivity) => {
    if (!sessionActivities.find(a => a.id === activity.id)) {
      setSessionActivities([...sessionActivities, activity])
    }
  }

  const removeFromSession = (activityId: string) => {
    setSessionActivities(sessionActivities.filter(a => a.id !== activityId))
  }

  const getTotalDuration = () => {
    return sessionActivities.reduce((acc, a) => acc + a.duration, 0)
  }

  const saveSession = async () => {
    if (!athleteData?.id || !sessionName || sessionActivities.length === 0) return

    try {
      const categoryLabel = CATEGORIES.find(c => c.id === sessionCategory)?.label || sessionCategory
      
      // Calculate the target date based on selected day
      const today = new Date()
      const currentDay = today.getDay()
      let daysUntil = selectedDay - currentDay
      if (daysUntil < 0) daysUntil += 7
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + daysUntil)
      
      const sessionData = {
        athlete_id: athleteData.id,
        activity_date: targetDate.toISOString().split("T")[0],
        sport: "lifestyle",
        title: sessionName,
        description: `${sessionName} - ${categoryLabel}`,
        duration_minutes: getTotalDuration(),
        workout_data: JSON.stringify({
          activities: sessionActivities,
          category: sessionCategory,
          sessionName: sessionName,
        }),
        source: "user_created",
      }

      const { error } = await supabase.from("training_activities").insert(sessionData).select()

      if (error) throw error

      await loadSavedSessions()
      setShowSessionBuilder(false)
      setSessionActivities([])
      setSessionName("")
    } catch (error) {
      console.error("Error saving session:", error)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("training_activities")
        .delete()
        .eq("id", sessionId)

      if (!error) {
        await loadSavedSessions()
      }
    } catch (error) {
      console.error("Error deleting session:", error)
    }
  }

  const printSession = (session: LifestyleSession) => {
    const cat = CATEGORIES.find(c => c.id === session.category)
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${session.name} - EMPATHY Lifestyle</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #fff; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; }
          .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .meta { display: flex; justify-content: center; gap: 30px; margin: 20px 0; }
          .meta-item { text-align: center; }
          .meta-item .label { font-size: 12px; color: #888; text-transform: uppercase; }
          .meta-item .value { font-size: 18px; font-weight: 600; color: #1a1a1a; }
          .activities { margin-top: 30px; }
          .activity { display: flex; gap: 20px; padding: 20px; border: 1px solid #e5e5e5; border-radius: 12px; margin-bottom: 15px; }
          .activity-img { width: 120px; height: 90px; object-fit: cover; border-radius: 8px; background: #f5f5f5; }
          .activity-info { flex: 1; }
          .activity-info h3 { font-size: 18px; margin-bottom: 5px; }
          .activity-info .duration { color: #666; font-size: 14px; margin-bottom: 10px; }
          .activity-info .benefits { display: flex; gap: 8px; flex-wrap: wrap; }
          .benefit { background: #f0f0f0; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
          .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #e5e5e5; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${session.name}</h1>
          <p>EMPATHY Performance Biomap - ${cat?.label || "Lifestyle"}</p>
        </div>
        <div class="meta">
          <div class="meta-item">
            <div class="label">Categoria</div>
            <div class="value">${cat?.label || session.category}</div>
          </div>
          <div class="meta-item">
            <div class="label">Durata Totale</div>
            <div class="value">${session.totalDuration} min</div>
          </div>
          <div class="meta-item">
            <div class="label">Attivita</div>
            <div class="value">${session.activities.length}</div>
          </div>
        </div>
        <div class="activities">
          ${session.activities.map((a, i) => `
            <div class="activity">
              <img src="${a.imageUrl || "/placeholder.svg"}" alt="${a.nameIt}" class="activity-img" />
              <div class="activity-info">
                <h3>${i + 1}. ${a.nameIt}</h3>
                <div class="duration">${a.duration} minuti - ${DIFFICULTY_LABELS[a.difficulty]}</div>
                <div class="benefits">
                  ${a.benefits.slice(0, 3).map(b => `<span class="benefit">${b}</span>`).join("")}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="footer">
          <p>Generato da EMPATHY Performance Biomap</p>
          <p>${new Date().toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  const CategoryIcon = CATEGORIES.find(c => c.id === activeCategory)?.icon || Flower2

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lifestyle & Benessere</h2>
          <p className="text-muted-foreground">
            Yoga, Pilates, Meditazione, Mobility e Cold Therapy
          </p>
        </div>
        <Button onClick={openSessionBuilder} className="gap-2">
          <Plus className="h-4 w-4" />
          Crea Sessione
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className={`flex flex-col gap-1 p-3 data-[state=active]:${cat.bgColor} border rounded-lg`}
              >
                <Icon className={`h-5 w-5 ${cat.color}`} />
                <span className="text-xs">{cat.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Filter */}
        <div className="flex items-center gap-4 mt-4">
          <Label className="text-sm text-muted-foreground">Difficolta:</Label>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i livelli</SelectItem>
              <SelectItem value="beginner">Principiante</SelectItem>
              <SelectItem value="intermediate">Intermedio</SelectItem>
              <SelectItem value="advanced">Avanzato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities Grid */}
        {CATEGORIES.map(cat => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 bg-muted rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activities.map(activity => (
                  <Card
                    key={activity.id}
                    className="group overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="relative h-40 bg-muted">
                      <img
                        src={activity.imageUrl || "/placeholder.svg"}
                        alt={activity.nameIt}
                        className="w-full h-full object-cover"
                      />
                      {activity.videoUrl && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedActivity(activity)
                            setShowVideoModal(true)
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge
                        className={`absolute bottom-2 left-2 ${DIFFICULTY_COLORS[activity.difficulty]}`}
                      >
                        {DIFFICULTY_LABELS[activity.difficulty]}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{activity.nameIt}</h3>
                          <p className="text-sm text-muted-foreground truncate">{activity.name}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addToSession(activity)}
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.duration} min
                        </span>
                        {activity.equipment && activity.equipment.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" />
                            {activity.equipment.length}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {activity.benefits.slice(0, 2).map((benefit, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Saved Sessions */}
      {Object.keys(savedSessions).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sessioni Programmate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.id} className="text-center">
                  <div className="text-xs font-medium text-muted-foreground mb-2">{day.short}</div>
                  <div className="space-y-1">
                    {savedSessions[day.id]?.map(session => {
                      const cat = CATEGORIES.find(c => c.id === session.category)
                      const Icon = cat?.icon || Flower2
                      return (
                        <div
                          key={session.id}
                          className={`p-2 rounded-lg ${cat?.bgColor || "bg-muted"} text-xs group relative`}
                        >
                          <Icon className={`h-3 w-3 mx-auto mb-1 ${cat?.color}`} />
                          <div className="truncate font-medium">{session.name}</div>
                          <div className="text-muted-foreground">{session.totalDuration}m</div>
<div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100">
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-5 w-5 bg-slate-800"
                                              onClick={() => printSession(session)}
                                            >
                                              <Printer className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-5 w-5 bg-slate-800"
                                              onClick={() => deleteSession(session.id)}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedActivity?.nameIt}</DialogTitle>
            <DialogDescription>{selectedActivity?.name}</DialogDescription>
          </DialogHeader>
          {selectedActivity?.videoUrl && (
            <div className="aspect-video">
              <iframe
                src={selectedActivity.videoUrl}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Istruzioni
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {selectedActivity?.instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Benefici</h4>
              <div className="flex flex-wrap gap-2">
                {selectedActivity?.benefits.map((benefit, i) => (
                  <Badge key={i} variant="secondary">
                    {benefit}
                  </Badge>
                ))}
              </div>
              {selectedActivity?.equipment && selectedActivity.equipment.length > 0 && (
                <>
                  <h4 className="font-semibold mt-4 mb-2">Attrezzatura</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.equipment.map((eq, i) => (
                      <Badge key={i} variant="outline">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Builder Modal - Step Based */}
      <Dialog open={showSessionBuilder} onOpenChange={setShowSessionBuilder}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-slate-900 border-slate-700 flex flex-col overflow-hidden">
          {sessionStep === "category" ? (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <Flower2 className="h-5 w-5 text-purple-500" />
                  Crea Sessione Lifestyle
                </DialogTitle>
                <DialogDescription>
                  Seleziona una categoria per iniziare
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon
                    return (
                      <Card
                        key={cat.id}
                        className={`cursor-pointer hover:border-primary/50 transition-all hover:scale-105 ${cat.bgColor} border-2 border-transparent`}
                        onClick={() => selectSessionCategory(cat.id)}
                      >
                        <CardContent className="p-6 text-center">
                          <Icon className={`h-12 w-12 mx-auto mb-3 ${cat.color}`} />
                          <h3 className="font-semibold text-lg">{cat.label}</h3>
                          <p className="text-xs text-muted-foreground mt-1">6 attivita disponibili</p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-end pt-4 border-t border-slate-700">
                <Button variant="outline" onClick={() => setShowSessionBuilder(false)} className="bg-transparent">
                  Annulla
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.id === sessionCategory)
                    const Icon = cat?.icon || Flower2
                    return (
                      <>
                        <Icon className={`h-5 w-5 ${cat?.color}`} />
                        Crea Sessione {cat?.label}
                      </>
                    )
                  })()}
                </DialogTitle>
                <DialogDescription>
                  Seleziona le attivita e crea la tua sessione personalizzata
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Sessione</Label>
                    <Input
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder={`Es. ${CATEGORIES.find(c => c.id === sessionCategory)?.label} Mattutino`}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label>Giorno</Label>
                    <Select value={String(selectedDay)} onValueChange={(v) => setSelectedDay(Number(v))}>
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(day => (
                          <SelectItem key={day.id} value={String(day.id)}>
                            {day.full}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Available Activities */}
                <div>
                  <Label className="mb-2 block">Attivita Disponibili</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sessionCategoryActivities.map(activity => {
                      const isAdded = sessionActivities.find(a => a.id === activity.id)
                      return (
                        <Card
                          key={activity.id}
                          className={`cursor-pointer transition-all ${isAdded ? "border-green-500 bg-green-500/10" : "hover:border-primary/50"}`}
                          onClick={() => isAdded ? removeFromSession(activity.id) : addToSession(activity)}
                        >
                          <div className="relative h-20 bg-muted rounded-t-lg overflow-hidden">
                            <img
                              src={activity.imageUrl || "/placeholder.svg"}
                              alt={activity.nameIt}
                              className="w-full h-full object-cover"
                            />
                            {isAdded && (
                              <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                                <div className="bg-green-500 rounded-full p-1">
                                  <Plus className="h-4 w-4 text-white rotate-45" />
                                </div>
                              </div>
                            )}
                            {activity.videoUrl && (
                              <Play className="absolute bottom-1 right-1 h-4 w-4 text-white drop-shadow-lg" />
                            )}
                          </div>
                          <CardContent className="p-2">
                            <p className="font-medium text-xs truncate">{activity.nameIt}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {activity.duration}m
                              </span>
                              <Badge className={`text-xs scale-75 ${DIFFICULTY_COLORS[activity.difficulty]}`}>
                                {DIFFICULTY_LABELS[activity.difficulty].slice(0, 4)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Activities */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Sessione ({sessionActivities.length} attivita)</Label>
                    <Badge variant="secondary" className="bg-slate-700">
                      <Timer className="h-3 w-3 mr-1" />
                      {getTotalDuration()} min totali
                    </Badge>
                  </div>
                  <div className="border border-slate-600 rounded-lg p-2 bg-slate-800 max-h-40 overflow-y-auto">
                    {sessionActivities.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        <p className="text-sm">Clicca sulle attivita sopra per aggiungerle</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sessionActivities.map((activity, index) => (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-2 bg-slate-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-primary w-6">
                                {index + 1}.
                              </span>
                              <img
                                src={activity.imageUrl || "/placeholder.svg"}
                                alt={activity.nameIt}
                                className="w-8 h-8 rounded object-cover"
                              />
                              <div>
                                <p className="font-medium text-sm">{activity.nameIt}</p>
                                <p className="text-xs text-muted-foreground">{activity.duration} min</p>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromSession(activity.id)
                              }}
                              className="h-6 w-6"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex justify-between gap-2 pt-4 border-t border-slate-700">
                <Button variant="outline" onClick={() => setSessionStep("category")} className="bg-transparent">
                  Indietro
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowSessionBuilder(false)} className="bg-transparent">
                    Annulla
                  </Button>
                  <Button
                    onClick={saveSession}
                    disabled={!sessionName || sessionActivities.length === 0}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salva Sessione
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
