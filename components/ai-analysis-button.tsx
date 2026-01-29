"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X, AlertTriangle, CheckCircle, Info, Loader2, Wand2, Check, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AIAnalysisButtonProps {
  athleteId: string
  endpoint: "nutrition" | "microbiome" | "epigenetics" | "training"
  context?: string
  buttonText?: string
  buttonVariant?: "default" | "outline" | "ghost"
  buttonSize?: "default" | "sm" | "lg" | "icon"
  onApplied?: () => void // Callback when changes are applied successfully
}

interface Alert {
  type?: string
  severity?: string
  title?: string
  interaction?: string
  description?: string
  mechanism?: string
  consequence?: string
  solution?: string
}

export function AIAnalysisButton({
  athleteId,
  endpoint,
  context,
  buttonText = "AI Analisi",
  buttonVariant = "outline",
  buttonSize = "sm",
  onApplied
}: AIAnalysisButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [proposedChanges, setProposedChanges] = useState<any>(null)
  const [isProposing, setIsProposing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Download plan as PDF
  const downloadPlanPDF = async () => {
    if (!proposedChanges) return
    setIsDownloading(true)
    
    try {
      const response = await fetch("/api/ai/generate-plan-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId,
          planType: endpoint === "training" ? "training" : "nutrition",
          planData: proposedChanges
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || "Generazione PDF fallita")
      }

      // Open HTML in new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(data.html)
        printWindow.document.close()
        // Auto-trigger print dialog
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }
    } catch (err) {
      console.error("[v0] PDF download error:", err)
      setError(err instanceof Error ? err.message : "Errore download PDF")
    } finally {
      setIsDownloading(false)
    }
  }

  const runAnalysis = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/ai/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId, context })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Analisi fallita")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (!result && !isLoading) {
      runAnalysis()
    }
  }

  // Propose structured changes based on analysis
  const proposeChanges = async () => {
    setIsProposing(true)
    setApplyResult(null)
    
    try {
      const response = await fetch("/api/ai/propose-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          athleteId, 
          type: endpoint,
          currentAnalysis: result?.analysis 
        })
      })

      const data = await response.json()
      console.log("[v0] Propose changes response:", data)
      
      if (!data.success) {
        throw new Error(data.error || "Proposta modifiche fallita")
      }

      // API returns proposedChanges, not changes
      setProposedChanges(data.proposedChanges)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore nella proposta modifiche")
    } finally {
      setIsProposing(false)
    }
  }

  // Apply the proposed changes
  const applyChanges = async () => {
    if (!proposedChanges) return
    
    setIsApplying(true)
    
    try {
      const applyEndpoint = endpoint === "nutrition" || endpoint === "microbiome" || endpoint === "epigenetics"
        ? "/api/ai/apply-nutrition"
        : "/api/ai/apply-training"

      const response = await fetch(applyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          athleteId, 
          changes: proposedChanges
        })
      })

      const data = await response.json()
      setApplyResult(data)
      
      if (data.success) {
        // Close dialog and notify parent to refresh data
        setTimeout(() => {
          setIsOpen(false) // Close the dialog
          setProposedChanges(null)
          setResult(null)
          setApplyResult(null)
          // Call the onApplied callback to refresh parent data
          if (onApplied) {
            onApplied()
          }
        }, 1500) // Short delay to show success message
      }
    } catch (err) {
      setApplyResult({ 
        success: false, 
        message: err instanceof Error ? err.message : "Errore nell'applicazione modifiche" 
      })
    } finally {
      setIsApplying(false)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "danger":
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case "danger":
      case "high":
        return "bg-red-500/10 border-red-500/20"
      case "warning":
      case "medium":
        return "bg-yellow-500/10 border-yellow-500/20"
      case "success":
        return "bg-green-500/10 border-green-500/20"
      default:
        return "bg-blue-500/10 border-blue-500/20"
    }
  }

  const renderAlerts = (alerts: Alert[]) => {
    if (!alerts || alerts.length === 0) return null
    
    return (
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${getAlertBg(alert.type || alert.severity || "info")}`}
          >
            <div className="flex items-start gap-2">
              {getAlertIcon(alert.type || alert.severity || "info")}
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {alert.title || alert.interaction}
                </p>
                {alert.description && (
                  <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                )}
                {alert.mechanism && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Meccanismo:</span> {alert.mechanism}
                  </p>
                )}
                {alert.consequence && (
                  <p className="text-xs text-red-400 mt-1">
                    <span className="font-medium">Conseguenza:</span> {alert.consequence}
                  </p>
                )}
                {alert.solution && (
                  <p className="text-xs text-green-400 mt-1">
                    <span className="font-medium">Soluzione:</span> {alert.solution}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderNutritionResult = () => {
    const analysis = result?.analysis
    if (!analysis) return null

    return (
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="alerts">Alert</TabsTrigger>
          <TabsTrigger value="foods">Cibi</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="supplements">Integratori</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          {renderAlerts(analysis.alerts)}
          {analysis.microbiomeInteractions && analysis.microbiomeInteractions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-2">Interazioni Microbioma</h4>
              <div className="space-y-2">
                {analysis.microbiomeInteractions.map((item: any, i: number) => (
                  <div key={i} className={`p-2 rounded text-xs ${item.effect === 'positive' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <span className="font-medium">{item.food}</span>: {item.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="foods">
          {analysis.foodsToAvoid && analysis.foodsToAvoid.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-sm mb-2 text-red-400">Cibi da Evitare</h4>
              <div className="space-y-2">
                {analysis.foodsToAvoid.map((item: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-red-500/10 text-xs">
                    <span className="font-medium">{item.food}</span>: {item.reason}
                    {item.alternatives && (
                      <p className="text-green-400 mt-1">Alternative: {item.alternatives.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {analysis.foodsToInclude && analysis.foodsToInclude.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 text-green-400">Cibi da Includere</h4>
              <div className="space-y-2">
                {analysis.foodsToInclude.map((item: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-green-500/10 text-xs">
                    <span className="font-medium">{item.food}</span>: {item.benefit}
                    {item.timing && <p className="text-muted-foreground">Timing: {item.timing}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="timing">
          {analysis.mealTiming && (
            <div className="space-y-4">
              {analysis.mealTiming.preWorkout && (
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <h4 className="font-medium text-sm mb-1">Pre-Workout</h4>
                  <p className="text-xs text-muted-foreground">{analysis.mealTiming.preWorkout.timing}</p>
                  <p className="text-xs mt-1">{analysis.mealTiming.preWorkout.foods?.join(", ")}</p>
                  {analysis.mealTiming.preWorkout.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{analysis.mealTiming.preWorkout.notes}</p>
                  )}
                </div>
              )}
              {analysis.mealTiming.duringWorkout && (
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <h4 className="font-medium text-sm mb-1">Durante Workout</h4>
                  <p className="text-xs text-muted-foreground">{analysis.mealTiming.duringWorkout.timing}</p>
                  <p className="text-xs mt-1">{analysis.mealTiming.duringWorkout.foods?.join(", ")}</p>
                </div>
              )}
              {analysis.mealTiming.postWorkout && (
                <div className="p-3 rounded-lg bg-green-500/10">
                  <h4 className="font-medium text-sm mb-1">Post-Workout</h4>
                  <p className="text-xs text-muted-foreground">{analysis.mealTiming.postWorkout.timing}</p>
                  <p className="text-xs mt-1">{analysis.mealTiming.postWorkout.foods?.join(", ")}</p>
                </div>
              )}
            </div>
          )}
          {analysis.macroTargets && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/50">
              <h4 className="font-medium text-sm mb-2">Target Macro</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Carbo</p>
                  <p className="font-medium">{analysis.macroTargets.carbs?.grams}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Proteine</p>
                  <p className="font-medium">{analysis.macroTargets.protein?.grams}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Grassi</p>
                  <p className="font-medium">{analysis.macroTargets.fat?.grams}g</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="supplements">
          {analysis.supplementProtocol && analysis.supplementProtocol.length > 0 ? (
            <div className="space-y-2">
              {analysis.supplementProtocol.map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.dosage}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Timing: {item.timing}</p>
                  <p className="text-xs mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun integratore suggerito</p>
          )}
        </TabsContent>
      </Tabs>
    )
  }

  const renderMicrobiomeResult = () => {
    const analysis = result?.analysis
    if (!analysis) return null

    return (
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="alerts">Alert</TabsTrigger>
          <TabsTrigger value="pathways">Pathway</TabsTrigger>
          <TabsTrigger value="protocol">Protocollo</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          {renderAlerts(analysis.criticalAlerts)}
        </TabsContent>

        <TabsContent value="pathways">
          {analysis.pathwayAnalysis && analysis.pathwayAnalysis.length > 0 ? (
            <div className="space-y-3">
              {analysis.pathwayAnalysis.map((item: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  item.status === 'blocked' ? 'bg-red-500/10 border-red-500/20' :
                  item.status === 'impaired' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-green-500/10 border-green-500/20'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{item.pathway}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      item.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                      item.status === 'impaired' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>{item.status}</span>
                  </div>
                  <p className="text-xs mt-1">{item.impact}</p>
                  {item.intervention && (
                    <p className="text-xs text-green-400 mt-1">Intervento: {item.intervention}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun pathway analizzato</p>
          )}
        </TabsContent>

        <TabsContent value="protocol">
          <div className="space-y-4">
            {analysis.probioticProtocol && analysis.probioticProtocol.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Probiotici</h4>
                <div className="space-y-2">
                  {analysis.probioticProtocol.map((item: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-blue-500/10 text-xs">
                      <span className="font-medium">{item.strain}</span> - {item.cfu}
                      <p className="text-muted-foreground">Timing: {item.timing}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.prebioticProtocol && analysis.prebioticProtocol.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Prebiotici</h4>
                <div className="space-y-2">
                  {analysis.prebioticProtocol.map((item: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-green-500/10 text-xs">
                      <span className="font-medium">{item.fiber_type}</span> - {item.amount}
                      <p className="text-muted-foreground">Fonte: {item.source}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recovery">
          {analysis.recoveryImpact && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-sm mb-2">Impatto sul Recupero</h4>
                <div className="space-y-2 text-xs">
                  <p><span className="text-muted-foreground">Permeabilita intestinale:</span> {analysis.recoveryImpact.gutPermeability}</p>
                  <p><span className="text-muted-foreground">Rischio infiammazione:</span> {analysis.recoveryImpact.inflammationRisk}</p>
                  <p><span className="text-muted-foreground">Assorbimento nutrienti:</span> {analysis.recoveryImpact.nutrientAbsorption}</p>
                </div>
              </div>
              {analysis.recoveryImpact.recommendations && (
                <div className="p-3 rounded-lg bg-green-500/10">
                  <h4 className="font-medium text-sm mb-2">Raccomandazioni</h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {analysis.recoveryImpact.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    )
  }

  const renderEpigeneticsResult = () => {
    const analysis = result?.analysis
    if (!analysis) return null

    return (
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="profile">Profilo</TabsTrigger>
          <TabsTrigger value="genes">Geni</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="nutrients">Nutrienti</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {analysis.geneticProfile && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-sm mb-2">Capacita di Adattamento: {analysis.geneticProfile.adaptationCapacity}</h4>
              </div>
              {analysis.geneticProfile.strengths && analysis.geneticProfile.strengths.length > 0 && (
                <div className="p-3 rounded-lg bg-green-500/10">
                  <h4 className="font-medium text-sm mb-2 text-green-400">Punti di Forza</h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {analysis.geneticProfile.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {analysis.geneticProfile.weaknesses && analysis.geneticProfile.weaknesses.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/10">
                  <h4 className="font-medium text-sm mb-2 text-red-400">Punti Deboli</h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {analysis.geneticProfile.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="genes">
          {analysis.methylationStatus && analysis.methylationStatus.length > 0 ? (
            <div className="space-y-2">
              {analysis.methylationStatus.map((item: any, i: number) => (
                <div key={i} className={`p-3 rounded-lg border ${
                  item.status === 'hyper' ? 'bg-red-500/10 border-red-500/20' :
                  item.status === 'hypo' ? 'bg-yellow-500/10 border-yellow-500/20' :
                  'bg-green-500/10 border-green-500/20'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{item.gene}</span>
                    <span className="text-xs">{item.status}</span>
                  </div>
                  <p className="text-xs mt-1">{item.impact}</p>
                  {item.intervention && (
                    <p className="text-xs text-green-400 mt-1">Intervento: {item.intervention}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun dato metilazione disponibile</p>
          )}
        </TabsContent>

        <TabsContent value="training">
          {analysis.trainingResponse && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Capacita Endurance</p>
                  <p className="font-medium text-sm">{analysis.trainingResponse.enduranceCapacity}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Capacita Forza</p>
                  <p className="font-medium text-sm">{analysis.trainingResponse.strengthCapacity}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Velocita Recupero</p>
                  <p className="font-medium text-sm">{analysis.trainingResponse.recoveryRate}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Rischio Infortuni</p>
                  <p className="font-medium text-sm">{analysis.trainingResponse.injuryRisk}</p>
                </div>
              </div>
              {analysis.trainingResponse.recommendations && (
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <h4 className="font-medium text-sm mb-2">Raccomandazioni</h4>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {analysis.trainingResponse.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="nutrients">
          {analysis.nutrigenomicProtocol && analysis.nutrigenomicProtocol.length > 0 ? (
            <div className="space-y-2">
              {analysis.nutrigenomicProtocol.map((item: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{item.nutrient}</span>
                    <span className="text-xs text-muted-foreground">{item.dosage}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Target: {item.target_gene}</p>
                  <p className="text-xs mt-1">{item.mechanism}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun protocollo nutrigenomico</p>
          )}
        </TabsContent>
      </Tabs>
    )
  }

  const renderTrainingResult = () => {
    const analysis = result?.analysis
    const metrics = result?.metrics
    if (!analysis) return null

    return (
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="status">Stato</TabsTrigger>
          <TabsTrigger value="plan">Piano</TabsTrigger>
          <TabsTrigger value="metabolic">Metabolico</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          {analysis.currentStatus && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <p className="text-xs text-muted-foreground">CTL (Fitness)</p>
                  <p className="font-bold text-lg">{metrics?.ctl?.toFixed(1) || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-center">
                  <p className="text-xs text-muted-foreground">ATL (Fatica)</p>
                  <p className="font-bold text-lg">{metrics?.atl?.toFixed(1) || 'N/A'}</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${
                  (metrics?.tsb || 0) > 10 ? 'bg-green-500/10' :
                  (metrics?.tsb || 0) < -20 ? 'bg-red-500/10' :
                  'bg-yellow-500/10'
                }`}>
                  <p className="text-xs text-muted-foreground">TSB (Form)</p>
                  <p className="font-bold text-lg">{metrics?.tsb?.toFixed(1) || 'N/A'}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Livello Fitness</span>
                  <span className="text-sm font-medium">{analysis.currentStatus.fitnessLevel}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Livello Fatica</span>
                  <span className="text-sm font-medium">{analysis.currentStatus.fatigueLevel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Prontezza</span>
                  <span className={`text-sm font-medium ${
                    analysis.currentStatus.readiness === 'ready' ? 'text-green-400' :
                    analysis.currentStatus.readiness === 'rest' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>{analysis.currentStatus.readiness}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.currentStatus.summary}</p>
            </div>
          )}
          {renderAlerts(analysis.alerts)}
        </TabsContent>

        <TabsContent value="plan">
          {analysis.weeklyPlan && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-sm">TSS Settimanale Target: <span className="font-bold">{analysis.weeklyPlan.totalTSS}</span></p>
              </div>
              {analysis.weeklyPlan.sessions && analysis.weeklyPlan.sessions.length > 0 && (
                <div className="space-y-2">
                  {analysis.weeklyPlan.sessions.map((session: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{session.day}</span>
                        <span className="text-xs text-muted-foreground">{session.duration} min</span>
                      </div>
                      <p className="text-xs">{session.type} - {session.intensity}</p>
                      <p className="text-xs text-muted-foreground mt-1">{session.focus}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="metabolic">
          {analysis.metabolicFocus && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <h4 className="font-medium text-sm mb-2">Obiettivo Primario</h4>
                <p className="text-sm">{analysis.metabolicFocus.primaryGoal}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-sm mb-2">Strategia VLamax</h4>
                <p className="text-xs">{analysis.metabolicFocus.vlmaxStrategy}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-sm mb-2">Strategia FatMax</h4>
                <p className="text-xs">{analysis.metabolicFocus.fatmaxStrategy}</p>
              </div>
              {analysis.intensityGuidelines && (
                <div className="p-3 rounded-lg bg-secondary/50">
                  <h4 className="font-medium text-sm mb-2">Zone di Potenza</h4>
                  <div className="text-xs space-y-1">
                    <p>Z2: {analysis.intensityGuidelines.z2Power?.min}-{analysis.intensityGuidelines.z2Power?.max}W</p>
                    <p>Z4: {analysis.intensityGuidelines.z4Power?.min}-{analysis.intensityGuidelines.z4Power?.max}W</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recovery">
          {analysis.recoveryProtocol && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Ore Sonno Raccomandate</p>
                <p className="font-medium">{analysis.recoveryProtocol.sleepHours}h</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Timing Nutrizione</p>
                <p className="text-sm">{analysis.recoveryProtocol.nutritionTiming}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Recovery Attivo</p>
                <p className="text-sm">{analysis.recoveryProtocol.activeRecovery}</p>
              </div>
              {analysis.recoveryProtocol.gutHealthConsiderations && (
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <p className="text-xs text-muted-foreground">Considerazioni Gut Health</p>
                  <p className="text-sm">{analysis.recoveryProtocol.gutHealthConsiderations}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    )
  }

  const renderResult = () => {
    switch (endpoint) {
      case "nutrition":
        return renderNutritionResult()
      case "microbiome":
        return renderMicrobiomeResult()
      case "epigenetics":
        return renderEpigeneticsResult()
      case "training":
        return renderTrainingResult()
      default:
        return <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
    }
  }

  const renderProposedChanges = () => {
    if (!proposedChanges) return null

    return (
      <div className="mt-4 p-4 rounded-lg border-2 border-cyan-500/50 bg-cyan-500/5">
        <div className="flex items-center gap-2 mb-3">
          <Wand2 className="h-5 w-5 text-cyan-400" />
          <h4 className="font-medium">Modifiche Proposte</h4>
        </div>

        {/* Summary */}
        {proposedChanges.summary && (
          <div className="mb-3 p-2 rounded bg-cyan-500/10">
            <p className="text-sm">{proposedChanges.summary}</p>
          </div>
        )}

        {/* Warnings */}
        {proposedChanges.warnings && proposedChanges.warnings.length > 0 && (
          <div className="mb-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm font-medium mb-1 text-yellow-400">Avvisi</p>
            <ul className="text-xs list-disc list-inside">
              {proposedChanges.warnings.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Changes List */}
        {proposedChanges.changes && proposedChanges.changes.length > 0 && (
          <div className="mb-3 p-2 rounded bg-secondary/50">
            <p className="text-sm font-medium mb-2">Modifiche Proposte</p>
            <ul className="text-xs space-y-2">
              {proposedChanges.changes.map((c: any, i: number) => (
                <li key={i} className={`p-2 rounded ${
                  c.priority === 'alta' ? 'bg-red-500/10 border-l-2 border-red-500' :
                  c.priority === 'media' ? 'bg-yellow-500/10 border-l-2 border-yellow-500' :
                  'bg-green-500/10 border-l-2 border-green-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-medium capitalize">{c.category}: {c.field}</span>
                    <span className="text-[10px] uppercase px-1 rounded bg-background">{c.priority}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {c.currentValue && <span className="line-through mr-2">{c.currentValue}</span>}
                    <span className="text-cyan-400">{c.proposedValue}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground italic">{c.reason}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weekly Plan - Nutrition */}
        {proposedChanges.weeklyPlan && typeof proposedChanges.weeklyPlan === 'object' && !Array.isArray(proposedChanges.weeklyPlan) && (
          <div className="mb-3 p-2 rounded bg-secondary/50">
            <p className="text-sm font-medium mb-2">Piano Settimanale Nutrizione</p>
            <div className="space-y-2 text-xs">
              {Object.entries(proposedChanges.weeklyPlan).map(([day, meals]: [string, any]) => (
                <div key={day} className="p-2 rounded bg-background/50">
                  <p className="font-medium capitalize mb-1">{day}</p>
                  <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                    {meals?.colazione && <span>Colazione: {meals.colazione}</span>}
                    {meals?.pranzo && <span>Pranzo: {meals.pranzo}</span>}
                    {meals?.cena && <span>Cena: {meals.cena}</span>}
                    {meals?.snack && <span>Snack: {meals.snack}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Plan - Training */}
        {proposedChanges.weeklyPlan && Array.isArray(proposedChanges.weeklyPlan) && (
          <div className="mb-3 p-2 rounded bg-secondary/50">
            <p className="text-sm font-medium mb-2">Piano Settimanale Allenamento</p>
            <div className="space-y-1 text-xs">
              {proposedChanges.weeklyPlan.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50">
                  <span className="font-medium w-20">{d.name || `Giorno ${d.day + 1}`}</span>
                  <span className="flex-1">{d.workout}</span>
                  <span className="text-cyan-400">{d.duration}min</span>
                  <span className="text-muted-foreground ml-2">{d.zone}</span>
                  <span className="text-yellow-400 ml-2">TSS: {d.tss}</span>
                </div>
              ))}
            </div>
            {proposedChanges.weeklyTSS && (
              <div className="mt-2 pt-2 border-t border-border text-xs">
                <span>TSS Settimanale: </span>
                <span className="line-through text-muted-foreground mr-2">{proposedChanges.weeklyTSS.current}</span>
                <span className="text-cyan-400 font-medium">{proposedChanges.weeklyTSS.proposed}</span>
                {proposedChanges.weeklyTSS.rationale && (
                  <p className="mt-1 text-muted-foreground italic">{proposedChanges.weeklyTSS.rationale}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Apply Result */}
        {applyResult && (
          <div className={`mt-3 p-2 rounded ${applyResult.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className="flex items-center gap-2">
              {applyResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{applyResult.message}</span>
            </div>
            {applyResult.results && (
              <div className="mt-2 text-xs">
                {applyResult.results.success?.map((s: string, i: number) => (
                  <p key={i} className="text-green-400">+ {s}</p>
                ))}
                {applyResult.results.errors?.map((e: string, i: number) => (
                  <p key={i} className="text-red-400">- {e}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!applyResult?.success && (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <Button 
                onClick={applyChanges} 
                disabled={isApplying}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applicando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Applica Modifiche
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setProposedChanges(null)}
                className="bg-transparent"
              >
                Annulla
              </Button>
            </div>
            <Button 
              variant="outline"
              onClick={downloadPlanPDF} 
              disabled={isDownloading}
              className="w-full bg-transparent border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Scarica Piano PDF
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const getTitle = () => {
    switch (endpoint) {
      case "nutrition":
        return "AI Analisi Nutrizionale"
      case "microbiome":
        return "AI Analisi Microbioma"
      case "epigenetics":
        return "AI Analisi Epigenetica"
      case "training":
        return "AI Analisi Training"
      default:
        return "AI Analisi"
    }
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleOpen}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
        <DialogContent className="max-w-2xl max-h-[80vh] bg-background border border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              {getTitle()}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <p className="mt-4 text-sm text-muted-foreground">Analisi in corso...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <p className="font-medium">Errore</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={runAnalysis}>
                  Riprova
                </Button>
              </div>
            )}

            {result && !isLoading && renderResult()}

            {/* Propose Changes Button */}
            {result && !isLoading && !proposedChanges && (
              <div className="mt-4 pt-4 border-t border-border">
                <Button 
                  onClick={proposeChanges} 
                  disabled={isProposing}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  {isProposing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando proposte...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Vuoi che applichi queste modifiche?
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Render Proposed Changes */}
            {proposedChanges && renderProposedChanges()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
