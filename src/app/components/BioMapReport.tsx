import { athleteData } from "../../data/athleteData"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { CheckCircle2, FileText } from "lucide-react"
import { ScrollArea } from "../components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export const BioMapReport = () => {
  const { weekly_biomap } = athleteData

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "to_fill":
        return "To Fill"
      case "completed":
        return "Done"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "to_fill":
        return "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
      case "completed":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900"
      default:
        return "bg-gray-100"
    }
  }

  const reportData = weekly_biomap.map((day) => ({
    day: day.meta.day_name,
    report_type: `Daily BioMAP Analysis (${day.meta.type})`,
    modules: [
      { id: 1, title: "Daily BioMAP Analysis", status: "completed" },
      { id: 2, title: "Training Load Analysis", status: "completed" },
      { id: 3, title: "Carbohydrate Strategy", status: "completed" },
      { id: 4, title: "Intra-Workout Protocol", status: day.meta.type === "REST" ? "to_fill" : "completed" },
      { id: 5, title: "Recovery Meals", status: "completed" },
      { id: 6, title: "Supplement Stack", status: "completed" },
    ],
  }))

  const defaultDay = reportData.length > 0 ? reportData[0].day : ""

  if (!defaultDay) return <div>Loading Report Data...</div>

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">BioMAP Reports</h2>
        <p className="text-muted-foreground">Daily scientific executive reporting status</p>
      </div>

      <Tabs defaultValue={defaultDay} className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start inline-flex">
            {reportData.map((day) => (
              <TabsTrigger key={day.day} value={day.day} className="min-w-[100px]">
                {day.day}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {reportData.map((dailyReport) => (
          <TabsContent key={dailyReport.day} value={dailyReport.day} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>BioMAP: {dailyReport.day}</CardTitle>
                    <CardDescription>{dailyReport.report_type}</CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {dailyReport.modules.filter((m) => m.status === "completed").length} / {dailyReport.modules.length}{" "}
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dailyReport.modules.map((module) => (
                    <div
                      key={module.id}
                      className="flex flex-col p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{module.id.toString().padStart(2, "0")}
                        </span>
                        <Badge variant="secondary" className={getStatusColor(module.status)}>
                          {getStatusLabel(module.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 font-medium text-sm">
                        {module.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span>{module.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
