"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Camera, Plus, Trash2, Clock, Flame, Apple, 
  TrendingUp, BarChart3, Calendar, ChevronLeft, ChevronRight,
  Beef, Wheat, Droplets, Zap, Heart, Activity,
  Coffee, Sun, Moon, Utensils, X, Upload, Loader2,
  PieChart, Target, AlertCircle
} from "lucide-react"
import { format, startOfDay, endOfDay, subDays, addDays, isSameDay } from "date-fns"
import { it } from "date-fns/locale"
import { cn } from "@/lib/utils"

// Types
interface FoodEntry {
  id: string
  athlete_id: string
  image_url?: string
  name: string
  meal_type: "colazione" | "pranzo" | "cena" | "snack"
  logged_at: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber?: number
  sugar?: number
  saturated_fat?: number
  unsaturated_fat?: number
  trans_fat?: number
  glycemic_index?: number
  insulin_load?: number
  notes?: string
}

interface DailyTarget {
  calories: number
  protein: number
  carbs: number
  fats: number
}

interface FoodDiaryProps {
  athleteData: any
}

// Meal type config
const MEAL_TYPES = [
  { id: "colazione", label: "Colazione", icon: Coffee, color: "text-amber-500", bgColor: "bg-amber-500/20" },
  { id: "pranzo", label: "Pranzo", icon: Sun, color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { id: "cena", label: "Cena", icon: Moon, color: "text-indigo-500", bgColor: "bg-indigo-500/20" },
  { id: "snack", label: "Snack", icon: Apple, color: "text-green-500", bgColor: "bg-green-500/20" },
]

// Macro colors
const MACRO_COLORS = {
  protein: { color: "text-red-500", bg: "bg-red-500", label: "Proteine" },
  carbs: { color: "text-amber-500", bg: "bg-amber-500", label: "Carboidrati" },
  fats: { color: "text-blue-500", bg: "bg-blue-500", label: "Grassi" },
}

export function FoodDiary({ athleteData }: FoodDiaryProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [activeView, setActiveView] = useState<"dashboard" | "diary" | "reports">("dashboard")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>("colazione")
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    glycemic_index: 0,
    notes: "",
    image_url: "",
  })
  
  // Calculate daily targets based on athlete profile
  const dailyTarget: DailyTarget = {
    calories: athleteData?.metabolic_profiles?.[0]?.tdee || 2500,
    protein: Math.round((athleteData?.weight || 70) * 1.8), // 1.8g/kg for athletes
    carbs: Math.round(((athleteData?.metabolic_profiles?.[0]?.tdee || 2500) * 0.5) / 4), // 50% from carbs
    fats: Math.round(((athleteData?.metabolic_profiles?.[0]?.tdee || 2500) * 0.25) / 9), // 25% from fats
  }
  
  // Load entries for selected date
  useEffect(() => {
    loadEntries()
  }, [selectedDate, athleteData?.id])
  
const loadEntries = async () => {
  if (!athleteData?.id) return
  setLoading(true)
  
  try {
  const dateStr = format(selectedDate, "yyyy-MM-dd")
  const { data, error } = await supabase
  .from("food_logs")
  .select("*")
  .eq("athlete_id", athleteData.id)
.eq("meal_date", dateStr)
  .order("logged_at", { ascending: true })
      
      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error("Error loading food entries:", error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate daily totals
  const dailyTotals = entries.reduce((acc, entry) => ({
    calories: acc.calories + (entry.calories || 0),
    protein: acc.protein + (entry.protein || 0),
    carbs: acc.carbs + (entry.carbs || 0),
    fats: acc.fats + (entry.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 })
  
  // Calculate percentages
  const percentages = {
    calories: Math.min(100, (dailyTotals.calories / dailyTarget.calories) * 100),
    protein: Math.min(100, (dailyTotals.protein / dailyTarget.protein) * 100),
    carbs: Math.min(100, (dailyTotals.carbs / dailyTarget.carbs) * 100),
    fats: Math.min(100, (dailyTotals.fats / dailyTarget.fats) * 100),
  }
  
  // Group entries by meal type
  const entriesByMeal = MEAL_TYPES.map(meal => ({
    ...meal,
    entries: entries.filter(e => e.meal_type === meal.id),
    totalCalories: entries.filter(e => e.meal_type === meal.id).reduce((sum, e) => sum + (e.calories || 0), 0),
  }))
  
  // Handle add entry
  const handleAddEntry = async () => {
    if (!athleteData?.id || !newEntry.name) return
    setSaving(true)
    
    try {
const entryData = {
  athlete_id: athleteData.id,
  meal_name: newEntry.name,
  meal_type: selectedMealType,
  meal_date: format(selectedDate, 'yyyy-MM-dd'),
  logged_at: new Date().toISOString(),
  calories: newEntry.calories,
  protein: newEntry.protein,
  carbs: newEntry.carbs,
  fats: newEntry.fats,
  fiber: newEntry.fiber,
  glycemic_index: newEntry.glycemic_index,
  notes: newEntry.notes,
  image_url: newEntry.image_url,
  }
      
      const { error } = await supabase.from("food_logs").insert(entryData)
      if (error) throw error
      
      await loadEntries()
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error("Error adding food entry:", error)
      alert("Errore nel salvataggio")
    } finally {
      setSaving(false)
    }
  }
  
  // Handle delete entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Eliminare questo alimento?")) return
    
    try {
      const { error } = await supabase.from("food_logs").delete().eq("id", id)
      if (error) throw error
      await loadEntries()
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }
  
  // Reset form
  const resetForm = () => {
    setNewEntry({
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      sugar: 0,
      glycemic_index: 0,
      notes: "",
      image_url: "",
    })
  }
  
  // Navigate dates
  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1))
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1))
  const goToToday = () => setSelectedDate(new Date())
  
  // Render Dashboard View
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Daily Summary Card */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-fuchsia-500" />
              Obiettivi Giornalieri
            </CardTitle>
            <Badge variant="outline" className={cn(
              percentages.calories >= 90 && percentages.calories <= 110 
                ? "border-green-500 text-green-500" 
                : percentages.calories > 110 
                  ? "border-red-500 text-red-500"
                  : "border-zinc-500 text-zinc-400"
            )}>
              {Math.round(percentages.calories)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calories Ring */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-zinc-800"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - percentages.calories / 100)}
                  className={cn(
                    "transition-all duration-500",
                    percentages.calories > 100 ? "text-red-500" : "text-fuchsia-500"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{dailyTotals.calories}</span>
                <span className="text-sm text-zinc-400">/ {dailyTarget.calories} kcal</span>
              </div>
            </div>
          </div>
          
          {/* Macros Progress */}
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(MACRO_COLORS).map(([key, config]) => (
              <div key={key} className="text-center space-y-2">
                <div className="text-xs text-zinc-400">{config.label}</div>
                <div className={cn("text-xl font-bold", config.color)}>
                  {dailyTotals[key as keyof typeof dailyTotals]}g
                </div>
                <Progress 
                  value={percentages[key as keyof typeof percentages]} 
                  className="h-2 bg-zinc-800"
                />
                <div className="text-[10px] text-zinc-500">
                  / {dailyTarget[key as keyof DailyTarget]}g
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Meals Overview */}
      <div className="grid grid-cols-2 gap-3">
        {entriesByMeal.map((meal) => {
          const MealIcon = meal.icon
          return (
            <Card 
              key={meal.id} 
              className={cn(
                "bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors",
                meal.entries.length > 0 && "border-l-4",
                meal.entries.length > 0 && meal.id === "colazione" && "border-l-amber-500",
                meal.entries.length > 0 && meal.id === "pranzo" && "border-l-orange-500",
                meal.entries.length > 0 && meal.id === "cena" && "border-l-indigo-500",
                meal.entries.length > 0 && meal.id === "snack" && "border-l-green-500",
              )}
              onClick={() => {
                setSelectedMealType(meal.id)
                setShowAddModal(true)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", meal.bgColor)}>
                    <MealIcon className={cn("h-4 w-4", meal.color)} />
                  </div>
                  <span className="text-lg font-bold text-white">{meal.totalCalories}</span>
                </div>
                <div className="text-sm font-medium text-white">{meal.label}</div>
                <div className="text-xs text-zinc-400">
                  {meal.entries.length === 0 ? "Nessun alimento" : `${meal.entries.length} alimenti`}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Quick Add Button */}
      <Button 
        onClick={() => setShowAddModal(true)}
        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 h-12"
      >
        <Plus className="h-5 w-5 mr-2" />
        Aggiungi Alimento
      </Button>
    </div>
  )
  
  // Render Diary View
  const renderDiary = () => (
    <div className="space-y-4">
      {entriesByMeal.map((meal) => {
        const MealIcon = meal.icon
        if (meal.entries.length === 0) return null
        
        return (
          <Card key={meal.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg", meal.bgColor)}>
                    <MealIcon className={cn("h-4 w-4", meal.color)} />
                  </div>
                  <CardTitle className="text-base">{meal.label}</CardTitle>
                </div>
                <span className={cn("text-sm font-bold", meal.color)}>
                  {meal.totalCalories} kcal
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {meal.entries.map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {entry.image_url ? (
                      <img 
                        src={entry.image_url || "/placeholder.svg"} 
                        alt={entry.meal_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center">
                        <Utensils className="h-5 w-5 text-zinc-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white">{entry.meal_name}</div>
                      <div className="text-xs text-zinc-400">
                        P: {entry.protein}g | C: {entry.carbs}g | F: {entry.fats}g
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{entry.calories}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-red-500"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
      
      {entries.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-12 text-center">
            <Apple className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400">Nessun alimento registrato</p>
            <Button 
              onClick={() => setShowAddModal(true)}
              variant="outline"
              className="mt-4 bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi il primo pasto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
  
  // Render Reports View
  const renderReports = () => (
    <div className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-fuchsia-500" />
            Ripartizione Macronutrienti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Macro bars */}
            {Object.entries(MACRO_COLORS).map(([key, config]) => {
              const value = dailyTotals[key as keyof typeof dailyTotals]
              const target = dailyTarget[key as keyof DailyTarget]
              const pct = Math.round((value / target) * 100)
              
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">{config.label}</span>
                    <span className={config.color}>{value}g / {target}g ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full transition-all", config.bg)}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Calorie Balance */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-500" />
            Bilancio Energetico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">{dailyTarget.calories}</div>
              <div className="text-xs text-zinc-400">Target</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{dailyTotals.calories}</div>
              <div className="text-xs text-zinc-400">Consumate</div>
            </div>
            <div>
              <div className={cn(
                "text-2xl font-bold",
                dailyTarget.calories - dailyTotals.calories >= 0 ? "text-amber-500" : "text-red-500"
              )}>
                {dailyTarget.calories - dailyTotals.calories}
              </div>
              <div className="text-xs text-zinc-400">Rimanenti</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  
  return (
    <div className="space-y-4">
      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-3 border border-zinc-800">
        <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="bg-transparent">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <div className="font-semibold text-white">
            {format(selectedDate, "EEEE", { locale: it })}
          </div>
          <div className="text-sm text-zinc-400">
            {format(selectedDate, "d MMMM yyyy", { locale: it })}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToToday}
            className={cn(
              "text-xs bg-transparent",
              isSameDay(selectedDate, new Date()) && "text-fuchsia-500"
            )}
          >
            Oggi
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextDay} className="bg-transparent">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-fuchsia-600">
            <Target className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="diary" className="data-[state=active]:bg-fuchsia-600">
            <Utensils className="h-4 w-4 mr-2" />
            Diario
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-fuchsia-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            Report
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
            </div>
          ) : (
            renderDashboard()
          )}
        </TabsContent>
        
        <TabsContent value="diary" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
            </div>
          ) : (
            renderDiary()
          )}
        </TabsContent>
        
        <TabsContent value="reports" className="mt-4">
          {renderReports()}
        </TabsContent>
      </Tabs>
      
      {/* Add Food Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-fuchsia-500" />
              Aggiungi Alimento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Meal Type Selector */}
            <div className="space-y-2">
              <Label>Pasto</Label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((meal) => {
                  const MealIcon = meal.icon
                  return (
                    <Button
                      key={meal.id}
                      variant={selectedMealType === meal.id ? "default" : "outline"}
                      className={cn(
                        "flex flex-col h-16 gap-1",
                        selectedMealType === meal.id 
                          ? "bg-fuchsia-600 hover:bg-fuchsia-700" 
                          : "bg-transparent hover:bg-zinc-800"
                      )}
                      onClick={() => setSelectedMealType(meal.id)}
                    >
                      <MealIcon className="h-4 w-4" />
                      <span className="text-[10px]">{meal.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
            
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Foto Alimento</Label>
              <div className="flex gap-3">
                {newEntry.image_url ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-700">
                    <img 
                      src={newEntry.image_url || "/placeholder.svg"} 
                      alt="Food preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70"
                      onClick={() => setNewEntry({ ...newEntry, image_url: "" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-fuchsia-500 hover:bg-zinc-800/50 transition-colors">
                    <Camera className="h-6 w-6 text-zinc-500 mb-1" />
                    <span className="text-[10px] text-zinc-500">Carica foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        
                        setUploadingImage(true)
                        // Convert to base64
                        const reader = new FileReader()
                        reader.onload = async (ev) => {
                          const base64Image = ev.target?.result as string
                          setNewEntry(prev => ({ ...prev, image_url: base64Image }))
                          setUploadingImage(false)
                          
                          // Analyze with AI
                          setAnalyzingImage(true)
                          try {
                            const res = await fetch('/api/analyze-food', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ imageBase64: base64Image })
                            })
                            
                            if (res.ok) {
                              const { analysis } = await res.json()
                              if (analysis) {
                                setNewEntry(prev => ({
                                  ...prev,
                                  name: analysis.name || prev.name,
                                  calories: analysis.calories || prev.calories,
                                  protein: analysis.protein || prev.protein,
                                  carbs: analysis.carbs || prev.carbs,
                                  fats: analysis.fats || prev.fats,
                                  fiber: analysis.fiber || prev.fiber,
                                  sugar: analysis.sugar || prev.sugar,
                                  glycemic_index: analysis.glycemic_index || prev.glycemic_index,
                                }))
                              }
                            }
                          } catch (err) {
                            console.error('AI analysis error:', err)
                          } finally {
                            setAnalyzingImage(false)
                          }
                        }
                        reader.onerror = () => {
                          setUploadingImage(false)
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                )}
                {uploadingImage && (
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-fuchsia-500 border-t-transparent rounded-full" />
                    Caricamento...
                  </div>
                )}
                {analyzingImage && (
                  <div className="flex items-center gap-2 text-fuchsia-400 text-sm">
                    <div className="animate-spin h-4 w-4 border-2 border-fuchsia-500 border-t-transparent rounded-full" />
                    Analisi AI in corso...
                  </div>
                )}
              </div>
            </div>
            
            {/* Food Name */}
            <div className="space-y-2">
              <Label>Nome Alimento</Label>
              <Input
                value={newEntry.name}
                onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                placeholder="es. Pasta al pomodoro"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            {/* Calories */}
            <div className="space-y-2">
              <Label>Calorie (kcal)</Label>
              <Input
                type="number"
                value={newEntry.calories || ""}
                onChange={(e) => setNewEntry({ ...newEntry, calories: Number(e.target.value) })}
                placeholder="0"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-red-500">Proteine (g)</Label>
                <Input
                  type="number"
                  value={newEntry.protein || ""}
                  onChange={(e) => setNewEntry({ ...newEntry, protein: Number(e.target.value) })}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-amber-500">Carbo (g)</Label>
                <Input
                  type="number"
                  value={newEntry.carbs || ""}
                  onChange={(e) => setNewEntry({ ...newEntry, carbs: Number(e.target.value) })}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-500">Grassi (g)</Label>
                <Input
                  type="number"
                  value={newEntry.fats || ""}
                  onChange={(e) => setNewEntry({ ...newEntry, fats: Number(e.target.value) })}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            
            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fibre (g)</Label>
                <Input
                  type="number"
                  value={newEntry.fiber || ""}
                  onChange={(e) => setNewEntry({ ...newEntry, fiber: Number(e.target.value) })}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Zuccheri (g)</Label>
                <Input
                  type="number"
                  value={newEntry.sugar || ""}
                  onChange={(e) => setNewEntry({ ...newEntry, sugar: Number(e.target.value) })}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
            
            {/* Glycemic Index */}
            <div className="space-y-2">
              <Label>Indice Glicemico</Label>
              <Input
                type="number"
                value={newEntry.glycemic_index || ""}
                onChange={(e) => setNewEntry({ ...newEntry, glycemic_index: Number(e.target.value) })}
                placeholder="0-100"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={newEntry.notes}
                onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                className="bg-zinc-800 border-zinc-700"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAddModal(false)}
              className="bg-transparent"
            >
              Annulla
            </Button>
            <Button 
              onClick={handleAddEntry}
              disabled={!newEntry.name || saving}
              className="bg-fuchsia-600 hover:bg-fuchsia-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FoodDiary
