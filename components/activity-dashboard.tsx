"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, BarChart3, TrendingUp, Link2 } from "lucide-react"
import { ActivityCalendar } from "./activity-calendar"
import { ActivityDetail } from "./activity-detail"
import { ActivityAnalysis } from "./activity-analysis"
import { ActivityStatistics } from "./activity-statistics"
import { DeviceIntegrations } from "./device-integrations"
import type { AthleteDataType } from "./dashboard-content"

interface ActivityDashboardProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
}

export function ActivityDashboard({ athleteData, userName }: ActivityDashboardProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("calendar")

  const hrZones = athleteData?.metabolic_profiles?.[0]?.hr_zones || null

  if (selectedActivityId) {
    return (
      <ActivityDetail activityId={selectedActivityId} onBack={() => setSelectedActivityId(null)} hrZones={hrZones} />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Activities</h2>
        <p className="text-muted-foreground">Visualizza e analizza le tue attività da tutti i dispositivi collegati</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Statistics</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <ActivityCalendar
            athleteId={athleteData?.id}
            onSelectDate={setSelectedDate}
            onSelectActivity={(activity) => setSelectedActivityId(activity.id)}
            selectedDate={selectedDate}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <ActivityAnalysis athleteId={athleteData?.id} hrZones={hrZones} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <ActivityStatistics athleteId={athleteData?.id} />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <DeviceIntegrations athleteId={athleteData?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
