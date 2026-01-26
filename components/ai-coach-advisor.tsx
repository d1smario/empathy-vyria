"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Utensils,
  Dumbbell,
  Pill,
  Moon,
  Target,
  TrendingUp,
  Activity,
  Sparkles
} from "lucide-react"

interface AICoachAdvisorProps {
  athleteId: string
  athleteName?: string
}

interface CriticalAlert {
  severity: "high" | "medium" | "low"
  title: string
  interaction: string
  consequence: string
  recommendation: string
}

interface SupplementItem {
  name: string
  dose: string
  timing: string
  reason?: string
  condition?: string
}

interface AIAnalysis {
  summary: string
  criticalAlerts: CriticalAlert[]
  metabolicInsights: {
    currentState: string
    blockedPathways: string[]
    optimizationOpportunities: string[]
  }
  trainingRecommendations: {
    preworkout: string[]
    intraworkout: string[]
    postworkout: string[]
    weeklyAdjustments: string[]
  }
  nutritionPlan: {
    dailyTargets: {
      carbsGKg: number
      proteinGKg: number
      fatGKg: number
      fiberG: number
    }
    mealTiming: string[]
    foodsToAvoid: string[]
    foodsToInclude: string[]
  }
  supplementProtocol: {
    essential: SupplementItem[]
    conditional: SupplementItem[]
  }
  recoveryProtocol: {
    sleep: string[]
    lifestyle: string[]
    gutHealth: string[]
  }
  weeklyFocus: string
}

const SEVERITY_CONFIG = {
  high: { color: "bg-red-500/20 border-red-500 text-red-400", icon: AlertTriangle, label: "Critico" },
  medium: { color: "bg-yellow-500/20 border-yellow-500 text-yellow-400", icon: AlertCircle, label: "Attenzione" },
  low: { color: "bg-blue-500/20 border-blue-500 text-blue-400", icon: CheckCircle2, label: "Info" }
}

export default function AICoachAdvisor({ athleteId, athleteName }: AICoachAdvisorProps) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai-coach-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Errore durante l'analisi")
      }

      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setLoading(false)
    }
  }

  if (!analysis) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-fuchsia-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="h-6 w-6 text-fuchsia-500" />
            EMPATHY AI Coach Advisor
          </CardTitle>
          <CardDescription className="text-gray-400">
            Analisi intelligente che incrocia microbioma, profilo metabolico, allenamento e nutrizione
            per consigli personalizzati e identificazione di interazioni critiche.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Activity className="h-4 w-4 text-green-500" />
              <span>Microbioma</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Metabolismo</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Dumbbell className="h-4 w-4 text-blue-500" />
              <span>Training</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Utensils className="h-4 w-4 text-orange-500" />
              <span>Nutrizione</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisi in corso...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Avvia Analisi AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-fuchsia-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="h-6 w-6 text-fuchsia-500" />
              EMPATHY AI Coach
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runAnalysis}
              disabled={loading}
              className="border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10 bg-transparent"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiorna"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300">{analysis.summary}</p>
          {analysis.weeklyFocus && (
            <div className="mt-3 flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-3">
              <Target className="h-5 w-5 text-fuchsia-500" />
              <div>
                <span className="text-xs text-fuchsia-400 font-medium">Focus Settimanale</span>
                <p className="text-white text-sm">{analysis.weeklyFocus}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {analysis.criticalAlerts && analysis.criticalAlerts.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alert Critici
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.criticalAlerts.map((alert, i) => {
              const config = SEVERITY_CONFIG[alert.severity]
              const Icon = config.icon
              return (
                <div key={i} className={`border rounded-lg p-3 ${config.color}`}>
                  <div className="flex items-start gap-2">
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{alert.title}</span>
                        <Badge variant="outline" className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm opacity-90"><strong>Interazione:</strong> {alert.interaction}</p>
                      <p className="text-sm opacity-90"><strong>Conseguenze:</strong> {alert.consequence}</p>
                      <p className="text-sm font-medium"><strong>Raccomandazione:</strong> {alert.recommendation}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed recommendations */}
      <Card className="bg-gray-900 border-gray-800">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="bg-gray-800 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-fuchsia-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                Metabolismo
              </TabsTrigger>
              <TabsTrigger value="training" className="data-[state=active]:bg-fuchsia-600">
                <Dumbbell className="h-4 w-4 mr-1" />
                Training
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="data-[state=active]:bg-fuchsia-600">
                <Utensils className="h-4 w-4 mr-1" />
                Nutrizione
              </TabsTrigger>
              <TabsTrigger value="supplements" className="data-[state=active]:bg-fuchsia-600">
                <Pill className="h-4 w-4 mr-1" />
                Integratori
              </TabsTrigger>
              <TabsTrigger value="recovery" className="data-[state=active]:bg-fuchsia-600">
                <Moon className="h-4 w-4 mr-1" />
                Recovery
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Metabolic Insights */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              {analysis.metabolicInsights && (
                <>
                  <div>
                    <h4 className="text-white font-medium mb-2">Stato Metabolico</h4>
                    <p className="text-gray-400 text-sm">{analysis.metabolicInsights.currentState}</p>
                  </div>
                  
                  {analysis.metabolicInsights.blockedPathways?.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Pathway Bloccati/Inibiti
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.metabolicInsights.blockedPathways.map((p, i) => (
                          <Badge key={i} variant="outline" className="bg-red-500/10 border-red-500/50 text-red-400">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.metabolicInsights.optimizationOpportunities?.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Opportunita di Ottimizzazione
                      </h4>
                      <ul className="space-y-1">
                        {analysis.metabolicInsights.optimizationOpportunities.map((o, i) => (
                          <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Training Recommendations */}
            <TabsContent value="training" className="space-y-4 mt-0">
              {analysis.trainingRecommendations && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <h4 className="text-blue-400 font-medium mb-2">Pre-Workout</h4>
                    <ul className="space-y-1">
                      {analysis.trainingRecommendations.preworkout?.map((r, i) => (
                        <li key={i} className="text-gray-300 text-sm">• {r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <h4 className="text-yellow-400 font-medium mb-2">Intra-Workout</h4>
                    <ul className="space-y-1">
                      {analysis.trainingRecommendations.intraworkout?.map((r, i) => (
                        <li key={i} className="text-gray-300 text-sm">• {r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <h4 className="text-green-400 font-medium mb-2">Post-Workout</h4>
                    <ul className="space-y-1">
                      {analysis.trainingRecommendations.postworkout?.map((r, i) => (
                        <li key={i} className="text-gray-300 text-sm">• {r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <h4 className="text-purple-400 font-medium mb-2">Aggiustamenti Settimanali</h4>
                    <ul className="space-y-1">
                      {analysis.trainingRecommendations.weeklyAdjustments?.map((r, i) => (
                        <li key={i} className="text-gray-300 text-sm">• {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Nutrition Plan */}
            <TabsContent value="nutrition" className="space-y-4 mt-0">
              {analysis.nutritionPlan && (
                <>
                  {analysis.nutritionPlan.dailyTargets && (
                    <div>
                      <h4 className="text-white font-medium mb-3">Target Giornalieri</h4>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-orange-400">
                            {analysis.nutritionPlan.dailyTargets.carbsGKg}
                          </div>
                          <div className="text-xs text-gray-400">g/kg CHO</div>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {analysis.nutritionPlan.dailyTargets.proteinGKg}
                          </div>
                          <div className="text-xs text-gray-400">g/kg PRO</div>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-yellow-400">
                            {analysis.nutritionPlan.dailyTargets.fatGKg}
                          </div>
                          <div className="text-xs text-gray-400">g/kg FAT</div>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {analysis.nutritionPlan.dailyTargets.fiberG}
                          </div>
                          <div className="text-xs text-gray-400">g Fibre</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {analysis.nutritionPlan.foodsToInclude?.length > 0 && (
                      <div>
                        <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Alimenti Consigliati
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {analysis.nutritionPlan.foodsToInclude.map((f, i) => (
                            <Badge key={i} variant="outline" className="bg-green-500/10 border-green-500/50 text-green-400">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.nutritionPlan.foodsToAvoid?.length > 0 && (
                      <div>
                        <h4 className="text-red-400 font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Alimenti da Evitare
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {analysis.nutritionPlan.foodsToAvoid.map((f, i) => (
                            <Badge key={i} variant="outline" className="bg-red-500/10 border-red-500/50 text-red-400">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {analysis.nutritionPlan.mealTiming?.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Timing Pasti</h4>
                      <ul className="space-y-1">
                        {analysis.nutritionPlan.mealTiming.map((t, i) => (
                          <li key={i} className="text-gray-400 text-sm">• {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Supplements */}
            <TabsContent value="supplements" className="space-y-4 mt-0">
              {analysis.supplementProtocol && (
                <>
                  {analysis.supplementProtocol.essential?.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <Pill className="h-4 w-4 text-fuchsia-500" />
                        Integratori Essenziali
                      </h4>
                      <div className="space-y-2">
                        {analysis.supplementProtocol.essential.map((s, i) => (
                          <div key={i} className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{s.name}</span>
                              <Badge className="bg-fuchsia-600">{s.dose}</Badge>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              <span className="text-fuchsia-400">Timing:</span> {s.timing}
                            </div>
                            {s.reason && (
                              <div className="text-sm text-gray-400">
                                <span className="text-fuchsia-400">Motivo:</span> {s.reason}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.supplementProtocol.conditional?.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-3">Integratori Condizionali</h4>
                      <div className="space-y-2">
                        {analysis.supplementProtocol.conditional.map((s, i) => (
                          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white">{s.name}</span>
                              <Badge variant="outline">{s.dose}</Badge>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              <span className="text-yellow-400">Quando:</span> {s.condition}
                            </div>
                            <div className="text-sm text-gray-400">
                              <span className="text-gray-500">Timing:</span> {s.timing}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Recovery */}
            <TabsContent value="recovery" className="space-y-4 mt-0">
              {analysis.recoveryProtocol && (
                <div className="grid md:grid-cols-3 gap-4">
                  {analysis.recoveryProtocol.sleep?.length > 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
                      <h4 className="text-indigo-400 font-medium mb-2 flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Sonno
                      </h4>
                      <ul className="space-y-1">
                        {analysis.recoveryProtocol.sleep.map((r, i) => (
                          <li key={i} className="text-gray-300 text-sm">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.recoveryProtocol.lifestyle?.length > 0 && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                      <h4 className="text-cyan-400 font-medium mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Lifestyle
                      </h4>
                      <ul className="space-y-1">
                        {analysis.recoveryProtocol.lifestyle.map((r, i) => (
                          <li key={i} className="text-gray-300 text-sm">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.recoveryProtocol.gutHealth?.length > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                      <h4 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Gut Health
                      </h4>
                      <ul className="space-y-1">
                        {analysis.recoveryProtocol.gutHealth.map((r, i) => (
                          <li key={i} className="text-gray-300 text-sm">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
