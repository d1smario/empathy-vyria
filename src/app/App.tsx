import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { AthleteProfile } from './components/AthleteProfile';
import { WeeklyTraining } from './components/WeeklyTraining';
import { NutritionPlan } from './components/NutritionPlan';
import { BioMapReport } from './components/BioMapReport';
import { PerformanceAnalysis } from './components/PerformanceAnalysis';
import { BioMapReportTemplate } from './components/BioMapReportTemplate';
import { User, CalendarDays, Calculator, FileText, Activity, Printer } from 'lucide-react';
import { BioMapProvider } from './context/BioMapContext';

export default function App() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <BioMapProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b bg-card sticky top-0 z-10 print:hidden">
        <div className="container mx-auto py-4 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-lg">E</div>
                <h1 className="text-xl font-bold tracking-tight">EMPATHY PERFORMANCE bioMAP</h1>
            </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4 md:px-8 print:p-0 print:m-0 print:max-w-none">
        <Tabs defaultValue="profile" className="space-y-6" onValueChange={setActiveTab}>
          <div className="flex items-center justify-between overflow-x-auto pb-2 print:hidden">
            <TabsList className="grid w-full grid-cols-6 lg:w-[800px]">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Training</span>
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Nutrition</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Daily Log</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Delivery</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <AthleteProfile />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <PerformanceAnalysis />
          </TabsContent>

          <TabsContent value="training" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <WeeklyTraining />
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <NutritionPlan />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <BioMapReport />
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
            <BioMapReportTemplate />
          </TabsContent>
        </Tabs>
      </main>
      </div>
    </BioMapProvider>
  );
}
