import { athleteData } from "../../data/athleteData"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Dumbbell, Bike, Flame, Activity, Bed } from "lucide-react"
import { cn } from "../../lib/utils"

export const WeeklyTraining = () => {
  const { weekly_biomap } = athleteData

  const getDayColor = (fuelClass: string) => {
    switch (fuelClass) {
      case "LOW":
        return "border-l-4 border-l-green-500"
      case "MEDIUM":
        return "border-l-4 border-l-yellow-500"
      case "HIGH":
        return "border-l-4 border-l-red-500"
      default:
        return "border-l-4 border-l-gray-300"
    }
  }

  const getSessionIcon = (type: string) => {
    const lower = type.toLowerCase()
    if (lower.includes("gym") || lower.includes("strength")) return <Dumbbell className="h-4 w-4" />
    if (lower.includes("rest")) return <Bed className="h-4 w-4" />
    if (
      lower.includes("interval") ||
      lower.includes("tempo") ||
      lower.includes("endurance") ||
      lower.includes("distance")
    )
      return <Bike className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  return (
    <div className="space-y-6 p-4 md:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Weekly Training Plan</h2>
          <p className="text-muted-foreground">Session breakdown and caloric demands</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30">
            LOW
          </Badge>
          <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30">
            MEDIUM
          </Badge>
          <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30">
            HIGH
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {weekly_biomap.map((dayPlan: any) => {
          const { meta, training_load } = dayPlan
          const isRest = meta.type === "REST"

          return (
            <Card key={meta.day_name} className={cn("flex flex-col h-full", getDayColor(meta.fueling_class))}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{meta.day_name}</CardTitle>
                  {meta.fueling_class === "HIGH" && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      Performance
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-1 text-xs">
                  <Flame className="h-3 w-3 text-orange-500" />~{training_load.total_kcal} kcal
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="bg-muted/50 p-3 rounded-md text-sm flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 font-semibold">
                      {getSessionIcon(meta.type)}
                      <span>{meta.type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                      {meta.time}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground italic mb-2">{meta.session_title}</div>

                  {!isRest && (
                    <>
                      <div className="flex gap-2 text-xs mb-3">
                        <Badge variant="outline" className="h-5">
                          {meta.duration}
                        </Badge>
                        <Badge variant="outline" className="h-5">
                          TSS {meta.tss}
                        </Badge>
                      </div>

                      {training_load.structure && training_load.structure.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {training_load.structure.map((phase: string, idx: number) => (
                            <div
                              key={idx}
                              className={cn(
                                "text-xs px-2 py-1 rounded",
                                phase === "Warmup" &&
                                  "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
                                phase === "Work" && "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
                                phase === "Cooldown" && "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
                              )}
                            >
                              {phase}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
