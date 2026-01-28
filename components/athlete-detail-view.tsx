"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  User,
  Activity,
  Wand2,
  CalendarDays,
  Calculator,
  Dna,
  FileText,
  BarChart3,
  RefreshCw,
  Zap,
  Flower2, // Import Flower2
  Smartphone, // Import Smartphone
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AthleteProfile } from "@/components/athlete-profile"
import { PerformanceAnalysis } from "@/components/performance-analysis"
import { ActivitiesHub } from "@/components/activities-hub"
import VyriaTrainingPlan from "@/components/vyria-training-plan"
import NutritionPlan from "@/components/nutrition-plan"
import { MicrobiomeEpigenetic } from "@/components/microbiome-epigenetic"
import { BioMapReport } from "@/components/biomap-report"
import { IntegrationsPanel } from "@/components/integrations-panel"
import LifestyleSection from "@/components/lifestyle-section"
import ActivityDashboard from "@/components/activity-dashboard" // Import ActivityDashboard
import WeeklyTraining from "@/components/weekly-training" // Import WeeklyTraining
import DailyTrainingReport from "@/components/daily-training-report" // Import DailyTrainingReport
import PowerZonesEditor from "@/components/power-zones-editor" // Import PowerZonesEditor
import type { AthleteDataType, WorkoutType } from "@/components/dashboard-content"

interface AthleteDetailViewProps {
  athleteUserId: string
  athleteName: string | null
  onBack: () => void
}

export function AthleteDetailView({ athleteUserId, athleteName, onBack }: AthleteDetailViewProps) {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [athleteData, setAthleteData] = useState<AthleteDataType | null>(null)
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WorkoutType[] | null>(null)
  const [activeTab, setActiveTab] = useState("profile")

  const loadAthleteData = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const supabase = createClient()
      if (!supabase) return

      try {
        // Load complete athlete data with all relations
        const { data: athlete, error: athleteError } = await supabase
          .from("athletes")
          .select(`
          *,
          athlete_constraints(*),
          metabolic_profiles(*)
        `)
          .eq("user_id", athleteUserId)
          .maybeSingle()

        if (athleteError) {
          console.error("[v0] Error loading athlete:", athleteError)
          return
        }

        if (athlete) {
          // Sort metabolic profiles to get current first
          if (athlete.metabolic_profiles && Array.isArray(athlete.metabolic_profiles)) {
            athlete.metabolic_profiles.sort((a: any, b: any) => {
              if (a.is_current && !b.is_current) return -1
              if (!a.is_current && b.is_current) return 1
              return 0
            })
          }

          setAthleteData(athlete)
          console.log("[v0] Loaded athlete data:", {
            id: athlete.id,
            weight: athlete.weight_kg,
            hasMetabolicProfiles: athlete.metabolic_profiles?.length > 0,
            currentProfile: athlete.metabolic_profiles?.[0],
          })

          // Load weekly workouts
          const today = new Date()
          const dayOfWeek = today.getDay()
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
          const monday = new Date(today)
          monday.setDate(today.getDate() + mondayOffset)
          monday.setHours(0, 0, 0, 0)

          const sunday = new Date(monday)
          sunday.setDate(monday.getDate() + 6)
          sunday.setHours(23, 59, 59, 999)

          const mondayStr = monday.toISOString().split("T")[0]
          const sundayStr = sunday.toISOString().split("T")[0]

          const { data: vyriaWorkouts } = await supabase
            .from("training_activities")
            .select("*")
            .eq("athlete_id", athlete.id)
            .gte("activity_date", mondayStr)
            .lte("activity_date", sundayStr)
            .order("activity_date", { ascending: true })

          if (vyriaWorkouts && vyriaWorkouts.length > 0) {
            setWeeklyWorkouts(
              vyriaWorkouts.map((w) => {
                const activityDate = new Date(w.activity_date)
                let dow = activityDate.getDay() - 1
                if (dow < 0) dow = 6

                return {
                  id: w.id,
                  athlete_id: w.athlete_id,
                  day_of_week: dow,
                  workout_type: w.activity_type || w.workout_type || "cycling",
                  title: w.title,
                  description: w.description,
                  duration_minutes: w.duration_minutes,
                  target_zone: w.target_zone,
                  intervals: w.intervals,
                  tss: w.tss,
                  activity_date: w.activity_date,
                  completed: w.completed,
                }
              }),
            )
          } else {
            const { data: legacyWorkouts } = await supabase
              .from("weekly_workouts")
              .select("*")
              .eq("athlete_id", athlete.id)
              .order("day_of_week", { ascending: true })

            setWeeklyWorkouts(legacyWorkouts)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading athlete data:", error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [athleteUserId],
  )

  useEffect(() => {
    loadAthleteData()
  }, [loadAthleteData])

  const handleRefresh = () => {
    loadAthleteData(true)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Refresh data when switching to tabs that depend on updated data
    if (tab === "vyria" || tab === "training" || tab === "nutrition" || tab === "zones") {
      loadAthleteData(true)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!athleteData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Dati atleta non trovati</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{athleteName || "Atleta"}</h2>
            <p className="text-sm text-muted-foreground">Visualizzazione completa profilo atleta</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Aggiorna Dati
        </Button>
      </div>

      {/* Athlete tabs - same as athlete dashboard */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex flex-wrap gap-1 w-full h-auto p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profilo</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Analisi</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Activities</span>
            </TabsTrigger>
            <TabsTrigger value="vyria" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">VYRIA</span>
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="flex items-center gap-2">
              <Flower2 className="h-4 w-4" />
              <span className="hidden sm:inline">Lifestyle</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Nutrizione</span>
            </TabsTrigger>
            <TabsTrigger value="microbiome" className="flex items-center gap-2">
              <Dna className="h-4 w-4" />
              <span className="hidden sm:inline">Microbiome</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">BioMap</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Devices</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <AthleteProfile athleteData={athleteData} userName={athleteName} />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <PerformanceAnalysis athleteData={athleteData} userName={athleteName} />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <ActivitiesHub athleteData={athleteData} userName={athleteName} />
        </TabsContent>

        <TabsContent value="vyria" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <VyriaTrainingPlan
            key={`vyria-${athleteData.id}-${athleteData.metabolic_profiles?.[0]?.ftp_watts || 0}`}
            athleteData={athleteData}
            userName={athleteName}
          />
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <LifestyleSection athleteData={athleteData} userName={athleteName} />
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <NutritionPlan athleteData={athleteData} userName={athleteName} />
        </TabsContent>

        <TabsContent value="microbiome" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <MicrobiomeEpigenetic
            athleteId={athleteData?.id}
            metabolicProfile={{
              ftp: athleteData?.metabolic_profiles?.[0]?.ftp_watts ?? undefined,
              vo2max: athleteData?.metabolic_profiles?.[0]?.vo2max ?? undefined,
              vlamax: athleteData?.metabolic_profiles?.[0]?.vlamax ?? undefined,
              hr_max: athleteData?.metabolic_profiles?.[0]?.hr_max ?? undefined,
              hr_lt2: athleteData?.metabolic_profiles?.[0]?.hr_lt2 ?? undefined,
              hr_rest: athleteData?.metabolic_profiles?.[0]?.hr_rest ?? undefined,
              hr_zones: athleteData?.metabolic_profiles?.[0]?.hr_zones ?? undefined,
            }}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <BioMapReport athleteData={athleteData} userName={athleteName} />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
          <IntegrationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
