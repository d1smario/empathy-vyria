"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/client"
import {
  Flower2,
  Activity,
  Brain,
  Move,
  Snowflake,
  Play,
  Clock,
  Plus,
  X,
  Save,
  Loader2,
  User,
  Calendar,
  Send,
} from "lucide-react"

interface Athlete {
  id: string
  user: {
    id: string
    full_name: string | null
    email: string
  }
  primary_sport: string | null
  weight_kg: number | null
  metabolic_profiles: Array<{
    ftp_watts: number | null
    vo2max: number | null
    is_current: boolean
  }>
}

interface CoachLink {
  id: string
  status: string
  athlete: Athlete | null
}

interface LifestyleActivity {
  id: string
  name: string
  nameIt: string
  category: string
  difficulty: string
  duration: number
  imageUrl: string
  videoUrl?: string
  instructions: string[]
  benefits: string[]
  equipment?: string[]
}

interface CoachLifestylePlannerProps {
  coachId: string
  linkedAthletes: CoachLink[]
}

const CATEGORIES = [
  { id: "yoga", label: "Yoga", icon: Flower2, color: "bg-purple-500" },
  { id: "pilates", label: "Pilates", icon: Activity, color: "bg-pink-500" },
  { id: "meditation", label: "Meditazione", icon: Brain, color: "bg-blue-500" },
  { id: "mobility", label: "Mobility", icon: Move, color: "bg-green-500" },
  { id: "stretching", label: "Stretching", icon: Move, color: "bg-yellow-500" },
  { id: "cold_therapy", label: "Cold Therapy", icon: Snowflake, color: "bg-cyan-500" },
]

const DAYS = [
  { id: "monday", label: "Lunedi", dayNumber: 0 },
  { id: "tuesday", label: "Martedi", dayNumber: 1 },
  { id: "wednesday", label: "Mercoledi", dayNumber: 2 },
  { id: "thursday", label: "Giovedi", dayNumber: 3 },
  { id: "friday", label: "Venerdi", dayNumber: 4 },
  { id: "saturday", label: "Sabato", dayNumber: 5 },
  { id: "sunday", label: "Domenica", dayNumber: 6 },
]

// Helper to convert day id to number for database
const getDayNumber = (dayId: string): number => {
  const day = DAYS.find(d => d.id === dayId)
  return day?.dayNumber ?? 0
}

export function CoachLifestylePlanner({ coachId, linkedAthletes }: CoachLifestylePlannerProps) {
  const [selectedAthlete, setSelectedAthlete] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("yoga")
  const [activities, setActivities] = useState<LifestyleActivity[]>([])
  const [selectedActivities, setSelectedActivities] = useState<LifestyleActivity[]>([])
  const [sessionName, setSessionName] = useState("")
  const [selectedDay, setSelectedDay] = useState<string>("monday")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [videoModal, setVideoModal] = useState<LifestyleActivity | null>(null)

  const supabase = createClient()
  const activeAthletes = linkedAthletes.filter((a) => a.status === "accepted" && a.athlete)

  useEffect(() => {
    loadActivities()
  }, [selectedCategory])

  const loadActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/lifestyle?category=${selectedCategory}`)
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const addActivity = (activity: LifestyleActivity) => {
    if (!selectedActivities.find((a) => a.id === activity.id)) {
      setSelectedActivities([...selectedActivities, activity])
    }
  }

  const removeActivity = (activityId: string) => {
    setSelectedActivities(selectedActivities.filter((a) => a.id !== activityId))
  }

  const getTotalDuration = () => {
    return selectedActivities.reduce((sum, a) => sum + a.duration, 0)
  }

  const handleSaveSession = async () => {
    if (!selectedAthlete || selectedActivities.length === 0) {
      alert("Seleziona un atleta e almeno un'attivita")
      return
    }

    setSaving(true)
    try {
      const athlete = activeAthletes.find((a) => a.athlete?.user.id === selectedAthlete)
      if (!athlete) {
        throw new Error("Atleta non trovato")
      }

      const sessionData = {
        name: sessionName || `Sessione ${CATEGORIES.find((c) => c.id === selectedCategory)?.label}`,
        category: selectedCategory,
        activities: selectedActivities,
        totalDuration: getTotalDuration(),
        assignedBy: coachId,
        assignedAt: new Date().toISOString(),
      }

      // Use API to save workout (bypasses RLS with service role)
      const dayNumber = getDayNumber(selectedDay)
      const response = await fetch('/api/save-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: selectedAthlete,
          dayOfWeek: dayNumber,
          sessionData,
          coachId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save workout')
      }

      alert(`Sessione assegnata a ${athlete.athlete?.user.full_name || "atleta"} per ${DAYS.find((d) => d.id === selectedDay)?.label}. L'atleta la vedra' nella sezione Lifestyle.`)
      setSelectedActivities([])
      setSessionName("")
    } catch (error) {
      console.error("Error saving session:", error)
      alert("Errore durante il salvataggio")
    } finally {
      setSaving(false)
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId)
    if (!category) return Flower2
    return category.icon
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Flower2 className="h-5 w-5 text-purple-400" />
            Pianifica Sessione Lifestyle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Seleziona Atleta</Label>
              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Scegli atleta..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {activeAthletes.map((link) => (
                    <SelectItem key={link.athlete?.user.id} value={link.athlete?.user.id || ""}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {link.athlete?.user.full_name || link.athlete?.user.email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Giorno</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {DAYS.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {day.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Nome Sessione (opzionale)</Label>
              <Input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Es: Recovery mattutino"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories and Activities */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={
                    selectedCategory === category.id
                      ? `${category.color} text-white`
                      : "bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700"
                  }
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.label}
                </Button>
              )
            })}
          </div>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">
                Attivita {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors"
                      onClick={() => addActivity(activity)}
                    >
                      <div className="relative aspect-video rounded-md overflow-hidden mb-2">
                        <Image
                          src={activity.imageUrl || "/placeholder.svg"}
                          alt={activity.nameIt}
                          fill
                          className="object-cover"
                        />
                        {activity.videoUrl && (
                          <button
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              setVideoModal(activity)
                            }}
                          >
                            <Play className="h-8 w-8 text-white" />
                          </button>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-white truncate">{activity.nameIt}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.duration} min
                        </span>
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {activity.difficulty === "beginner"
                            ? "Base"
                            : activity.difficulty === "intermediate"
                              ? "Medio"
                              : "Avanzato"}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          addActivity(activity)
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Aggiungi
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Activities */}
        <div className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Sessione ({selectedActivities.length})</CardTitle>
                {selectedActivities.length > 0 && (
                  <Badge className="bg-purple-600">{getTotalDuration()} min</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedActivities.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  Clicca sulle attivita per aggiungerle
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {selectedActivities.map((activity, index) => (
                      <div
                        key={`${activity.id}-${index}`}
                        className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-2"
                      >
                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={activity.imageUrl || "/placeholder.svg"}
                            alt={activity.nameIt}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{activity.nameIt}</p>
                          <p className="text-xs text-slate-400">{activity.duration} min</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-400"
                          onClick={() => removeActivity(activity.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {selectedActivities.length > 0 && (
                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  onClick={handleSaveSession}
                  disabled={saving || !selectedAthlete}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assegnazione...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Assegna a Atleta
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={!!videoModal} onOpenChange={() => setVideoModal(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">{videoModal?.nameIt}</DialogTitle>
          </DialogHeader>
          {videoModal?.videoUrl && (
            <div className="aspect-video">
              <iframe
                src={videoModal.videoUrl.replace("watch?v=", "embed/")}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Benefici:</h4>
            <ul className="text-sm text-slate-400 list-disc list-inside">
              {videoModal?.benefits.map((benefit, i) => (
                <li key={i}>{benefit}</li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
