"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, CheckCircle2, Clock } from "lucide-react"
import type { AthleteDataType } from "@/components/dashboard-content"

interface BioMapReportProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
}

export const BioMapReport = ({ athleteData, userName }: BioMapReportProps) => {
  const today = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })

  const modules = [
    { id: 1, title: "Check-in Mattutino", status: "pending", description: "HRV, qualità sonno, sensazioni" },
    { id: 2, title: "Nutrizione Pre-Allenamento", status: "pending", description: "Conferma pasto consumato" },
    { id: 3, title: "Dati Allenamento", status: "pending", description: "Import da Strava/Garmin" },
    { id: 4, title: "Protocollo Intra-Workout", status: "pending", description: "CHO consumati durante" },
    { id: 5, title: "Recovery Post-Allenamento", status: "pending", description: "Pasto recovery + sensazioni" },
    { id: 6, title: "Check-in Serale", status: "pending", description: "Riepilogo giornata" },
  ]

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Daily Log</h2>
        <p className="text-muted-foreground capitalize">{today}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>BioMAP Daily Check</CardTitle>
              <CardDescription>Monitora il tuo stato giornaliero</CardDescription>
            </div>
            <span className="text-sm text-muted-foreground">0 / {modules.length} completati</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.id}
                className="flex flex-col p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    #{module.id.toString().padStart(2, "0")}
                  </span>
                  {module.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <h4 className="font-medium text-sm mb-1">{module.title}</h4>
                <p className="text-xs text-muted-foreground">{module.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-900/50 bg-fuchsia-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-fuchsia-400" />
            Come Funziona il Daily Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="font-semibold mb-2">Mattina</h4>
              <p className="text-sm text-muted-foreground">
                Registra HRV, qualità del sonno e sensazioni al risveglio per calcolare la readiness
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="font-semibold mb-2">Allenamento</h4>
              <p className="text-sm text-muted-foreground">
                Conferma nutrizione pre/intra/post workout e importa i dati dell'attività
              </p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="font-semibold mb-2">Sera</h4>
              <p className="text-sm text-muted-foreground">
                Riepilogo della giornata, carico accumulato e preparazione per domani
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
