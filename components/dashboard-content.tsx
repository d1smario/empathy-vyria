"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  User,
  CalendarDays,
  Calculator,
  FileText,
  Activity,
  Printer,
  LogOut,
  Settings,
  Wand2,
  Dna,
  BarChart3,
  Smartphone,
  Flower2,
} from "lucide-react"
import { AthleteProfile } from "@/components/athlete-profile"
import WeeklyTraining from "@/components/weekly-training"
import NutritionPlan from "@/components/nutrition-plan"
import { BioMapReport } from "@/components/biomap-report"
import { PerformanceAnalysis } from "@/components/performance-analysis"
import { BioMapReportTemplate } from "@/components/biomap-report-template"
import { CoachDashboard } from "@/components/coach-dashboard"
import { PendingCoachInvites } from "@/components/pending-coach-invites"
import BioMapProvider from "@/context/biomap-context"
import VyriaTrainingPlan from "@/components/vyria-training-plan"
import DailyTrainingReport from "@/components/daily-training-report"
import { MicrobiomeEpigenetic } from "@/components/microbiome-epigenetic"
import { ActivityDashboard } from "@/components/activity-dashboard"
import { ActivitiesHub } from "@/components/activities-hub"
import { IntegrationsPanel } from "@/components/integrations-panel"
import LifestyleSection from "@/components/lifestyle-section"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export interface AthleteDataType {
  id: string
  user_id: string
  birth_date: string | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  body_fat_percent: number | null
  lean_body_mass_kg: number | null
  primary_sport: string | null
  wake_time: string | null
  breakfast_time: string | null
  training_time: string | null
  lunch_time: string | null
  dinner_time: string | null
  sleep_time: string | null
  athlete_constraints: Array<{
    intolerances: string[] | null
    allergies: string[] | null
    dietary_limits: string[] | null
    dietary_preferences: string[] | null
  }> | null
  metabolic_profiles: Array<{
    ftp_watts: number | null
    vo2max: number | null
    vlamax: number | null
    weight_kg: number | null
    body_fat_percent: number | null
    lean_body_mass_kg: number | null
    empathy_zones: any | null
    power_duration_curve: any | null
    is_current: boolean
    hr_max: number | null
    hr_lt2: number | null
    hr_rest: number | null
    hr_zones: Record<
      string,
      {
        name: string
        min: number
        max: number
        color: string
        consumption?: {
          choGH: number
          fatGH: number
          proGH: number
          kcalH: number
        }
      }
    > | null
  }> | null
}

export interface WorkoutType {
  id: string
  athlete_id: string
  day_of_week: number
  workout_type: string
  title: string
  description: string | null
  duration_minutes: number | null
  target_zone: string | null
  intervals: any | null
  tss?: number | null
  activity_date?: string | null
  completed?: boolean
}

interface DashboardContentProps {
  user: SupabaseUser
  profile: {
    id: string
    full_name: string | null
    role: string
    onboarding_completed: boolean
  } | null
  athleteData: AthleteDataType | null
  linkedAthletes: unknown[] | null
  weeklyWorkouts: WorkoutType[] | null // Add weeklyWorkouts prop
}

export function DashboardContent({
  user,
  profile,
  athleteData,
  linkedAthletes,
  weeklyWorkouts,
}: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/login")
    router.refresh()
  }

  const isCoach = profile?.role === "coach"

  return (
    <BioMapProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b bg-card print:hidden">
          <div className="container mx-auto py-4 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-fuchsia-600 rounded-md flex items-center justify-center text-white font-bold text-lg">
                E
              </div>
              <h1 className="text-xl font-bold tracking-tight">EMPATHY PERFORMANCE bioMAP</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{profile?.full_name || user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.role === "athlete" ? "Atleta" : profile?.role === "coach" ? "Coach" : profile?.role}
                </p>
              </div>

              <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto py-6 px-4 md:px-8 print:p-0 print:m-0 print:max-w-none">
          {isCoach ? (
            <CoachDashboard
              user={user}
              profile={profile as { id: string; full_name: string | null; role: string }}
              linkedAthletes={linkedAthletes as never}
            />
          ) : (
            // Athlete Dashboard
            <>
              <PendingCoachInvites userId={user.id} />

              <Tabs defaultValue="profile" className="space-y-6" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between overflow-x-auto pb-2 print:hidden">
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
                    <TabsTrigger value="delivery" className="flex items-center gap-2">
                      <Printer className="h-4 w-4" />
                      <span className="hidden sm:inline">Report</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="profile" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <AthleteProfile athleteData={athleteData} userName={profile?.full_name} />
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <PerformanceAnalysis athleteData={athleteData} userName={profile?.full_name} />
                </TabsContent>

                <TabsContent value="activities" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <ActivitiesHub athleteData={athleteData} userName={profile?.full_name} />
                </TabsContent>

                <TabsContent value="vyria" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <VyriaTrainingPlan athleteData={athleteData} userName={profile?.full_name} />
                </TabsContent>

                

                <TabsContent value="lifestyle" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <LifestyleSection athleteData={athleteData} userName={profile?.full_name} />
                </TabsContent>

                <TabsContent value="nutrition" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <NutritionPlan athleteData={athleteData} userName={profile?.full_name} />
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
                  <BioMapReport athleteData={athleteData} userName={profile?.full_name} />
                </TabsContent>

                <TabsContent value="devices" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <IntegrationsPanel />
                </TabsContent>

                <TabsContent value="delivery" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                  <BioMapReportTemplate athleteData={athleteData} userName={profile?.full_name} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </BioMapProvider>
  )
}
