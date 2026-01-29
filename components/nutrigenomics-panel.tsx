"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Utensils, 
  Dumbbell, 
  Zap, 
  Pill, 
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  Activity,
  Shield,
  Sparkles
} from "lucide-react"
import {
  analyzeNutrigenomics,
  type NutrigenomicsAnalysis,
  type Recommendation,
  type RecommendationCategory,
  type AthleteGeneticProfile,
  type AthleteMicrobiomeProfile,
  type AthleteConstraints
} from "@/lib/integrations/nutrigenomics-engine"

interface NutrigenomicsPanelProps {
  athleteId?: string
  geneticProfile?: AthleteGeneticProfile
  microbiomeProfile?: AthleteMicrobiomeProfile
  constraints?: AthleteConstraints
  compact?: boolean
}

const categoryIcons: Record<RecommendationCategory, typeof Utensils> = {
  nutrition: Utensils,
  training: Dumbbell,
  fueling: Zap,
  supplements: Pill,
  lifestyle: Heart
}

const categoryLabels: Record<RecommendationCategory, string> = {
  nutrition: "Alimentazione",
  training: "Allenamento",
  fueling: "Fueling",
  supplements: "Integratori",
  lifestyle: "Lifestyle"
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/50",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/50"
}

const priorityLabels: Record<string, string> = {
  critical: "CRITICO",
  high: "PRIORITA",
  medium: "CONSIGLIO",
  low: "OPZIONALE"
}

const actionIcons: Record<string, typeof CheckCircle> = {
  avoid: XCircle,
  reduce: AlertTriangle,
  prefer: CheckCircle,
  increase: ArrowRight,
  replace: RefreshCw,
  timing: Activity
}

export function NutrigenomicsPanel({
  athleteId,
  geneticProfile,
  microbiomeProfile,
  constraints,
  compact = false
  }: NutrigenomicsPanelProps) {
  const [activeTab, setActiveTab] = useState<RecommendationCategory | 'all'>('all')
  const [expandedRecs, setExpandedRecs] = useState<Set<string>>(new Set())

  // Demo data se non forniti
  const demoGeneticProfile: AthleteGeneticProfile = geneticProfile || {
    genes: [
      { gene_id: 'PFKM', expression_state: 'under' },
      { gene_id: 'CPT1A', expression_state: 'normal' },
      { gene_id: 'MTHFR', expression_state: 'under' },
      { gene_id: 'SOD2', expression_state: 'under' },
      { gene_id: 'IL6', expression_state: 'over' }
    ]
  }

  const demoMicrobiomeProfile: AthleteMicrobiomeProfile = microbiomeProfile || {
    bacteria: [
      { bacteria_id: 'lactobacillus', abundance: 'low' },
      { bacteria_id: 'bifidobacterium', abundance: 'low' },
      { bacteria_id: 'akkermansia', abundance: 'normal' },
      { bacteria_id: 'faecalibacterium', abundance: 'low' },
      { bacteria_id: 'enterobacteriaceae', abundance: 'high' }
    ]
  }

  const demoConstraints: AthleteConstraints = constraints || {
    intolerances: ['Lattosio'],
    allergies: [],
    dietary_preferences: []
  }

  // Calcola analisi
  const analysis = useMemo(() => {
    return analyzeNutrigenomics(
      athleteId,
      demoGeneticProfile,
      demoMicrobiomeProfile,
      demoConstraints
    )
  }, [athleteId, demoGeneticProfile, demoMicrobiomeProfile, demoConstraints])

  // Filtra raccomandazioni per tab
  const filteredRecommendations = useMemo(() => {
    if (activeTab === 'all') return analysis.recommendations
    return analysis.recommendations.filter(r => r.category === activeTab)
  }, [analysis.recommendations, activeTab])

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRecs)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRecs(newExpanded)
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-green-400'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'Alto'
    if (score >= 40) return 'Moderato'
    return 'Basso'
  }

  // Versione compatta per sidebar
  if (compact) {
    return (
      <Card className="bg-gradient-to-b from-purple-900/20 to-cyan-900/20 border-purple-500/30 sticky top-4 max-h-[80vh] flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Report Nutrigenomico
          </CardTitle>
          <CardDescription className="text-xs">
            Raccomandazioni basate su genetica e microbioma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-y-auto flex-1">
          {/* Risk Score compatto */}
          <div className="flex items-center justify-between p-2 rounded bg-background/50">
            <span className="text-sm text-muted-foreground">Risk Score</span>
            <div className="flex items-center gap-2">
              <Progress value={analysis.risk_score} className="w-16 h-2" />
              <span className={`font-bold ${getRiskColor(analysis.risk_score)}`}>
                {analysis.risk_score}
              </span>
            </div>
          </div>

          {/* Profilo metabolico compatto */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-background/50">
              <span className="text-muted-foreground">Sistema</span>
              <p className="font-medium text-blue-400">
                {analysis.metabolic_summary.energy_system === 'glycolytic' ? 'Glicolitico' : 
                 analysis.metabolic_summary.energy_system === 'oxidative' ? 'Ossidativo' : 'Misto'}
              </p>
            </div>
            <div className="p-2 rounded bg-background/50">
              <span className="text-muted-foreground">Recupero</span>
              <p className={`font-medium ${
                analysis.metabolic_summary.recovery_capacity === 'fast' ? 'text-green-400' : 
                analysis.metabolic_summary.recovery_capacity === 'slow' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {analysis.metabolic_summary.recovery_capacity === 'fast' ? 'Veloce' : 
                 analysis.metabolic_summary.recovery_capacity === 'normal' ? 'Normale' : 'Lento'}
              </p>
            </div>
          </div>

          {/* Warning principali - scrollabile */}
          {analysis.warnings.length > 0 && (
            <div className="p-2 rounded bg-red-500/10 border border-red-500/30 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-1 mb-1 sticky top-0 bg-red-500/10">
                <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                <span className="text-xs font-medium text-red-400">Attenzione</span>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {analysis.warnings[0]}
              </p>
            </div>
          )}

          <Separator />

          {/* Raccomandazioni prioritarie - scrollabile */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Priorita Alte
            </p>
            {analysis.recommendations
              .filter(r => r.priority === 'critical' || r.priority === 'high')
              .slice(0, 6)
              .map((rec, idx) => {
                const Icon = categoryIcons[rec.category]
                return (
                  <div 
                    key={idx} 
                    className={`p-2 rounded text-xs ${
                      rec.priority === 'critical' 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : 'bg-orange-500/10 border border-orange-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${
                        rec.priority === 'critical' ? 'text-red-400' : 'text-orange-400'
                      }`} />
                      <span className="font-medium">{rec.title}</span>
                    </div>
                    {rec.avoid && rec.avoid.length > 0 && (
                      <p className="text-red-300 ml-5">
                        Evita: {rec.avoid.join(', ')}
                      </p>
                    )}
                    {rec.prefer && rec.prefer.length > 0 && (
                      <p className="text-green-300 ml-5">
                        Preferisci: {rec.prefer.join(', ')}
                      </p>
                    )}
                  </div>
                )
              })}
          </div>

          {/* Contatore raccomandazioni */}
          <div className="flex justify-between text-xs text-muted-foreground pt-2">
            <span>{analysis.recommendations.filter(r => r.priority === 'critical').length} critiche</span>
            <span>{analysis.recommendations.filter(r => r.priority === 'high').length} prioritarie</span>
            <span>{analysis.recommendations.filter(r => r.priority === 'medium').length} consigli</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Versione completa
  return (
    <div className="space-y-6">
      {/* Header con Risk Score e Metabolic Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk Score */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getRiskColor(analysis.risk_score)}`}>
                {analysis.risk_score}
              </div>
              <div className="flex-1">
                <Progress 
                  value={analysis.risk_score} 
                  className="h-3"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Rischio metabolico: <span className={getRiskColor(analysis.risk_score)}>
                    {getRiskLabel(analysis.risk_score)}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metabolic Summary */}
        <Card className="bg-card/50 border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Profilo Metabolico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricBadge 
                label="Sistema" 
                value={analysis.metabolic_summary.energy_system === 'glycolytic' ? 'Glicolitico' : 
                       analysis.metabolic_summary.energy_system === 'oxidative' ? 'Ossidativo' : 'Misto'}
                color={analysis.metabolic_summary.energy_system === 'mixed' ? 'green' : 'blue'}
              />
              <MetricBadge 
                label="Fat Adapt" 
                value={analysis.metabolic_summary.fat_adaptation === 'good' ? 'Buono' : 
                       analysis.metabolic_summary.fat_adaptation === 'moderate' ? 'Moderato' : 'Scarso'}
                color={analysis.metabolic_summary.fat_adaptation === 'good' ? 'green' : 
                       analysis.metabolic_summary.fat_adaptation === 'poor' ? 'red' : 'yellow'}
              />
              <MetricBadge 
                label="Recupero" 
                value={analysis.metabolic_summary.recovery_capacity === 'fast' ? 'Veloce' : 
                       analysis.metabolic_summary.recovery_capacity === 'normal' ? 'Normale' : 'Lento'}
                color={analysis.metabolic_summary.recovery_capacity === 'fast' ? 'green' : 
                       analysis.metabolic_summary.recovery_capacity === 'slow' ? 'red' : 'yellow'}
              />
              <MetricBadge 
                label="Infiammazione" 
                value={analysis.metabolic_summary.inflammation_risk === 'low' ? 'Basso' : 
                       analysis.metabolic_summary.inflammation_risk === 'moderate' ? 'Moderato' : 'Alto'}
                color={analysis.metabolic_summary.inflammation_risk === 'low' ? 'green' : 
                       analysis.metabolic_summary.inflammation_risk === 'high' ? 'red' : 'yellow'}
              />
              <MetricBadge 
                label="Gut Health" 
                value={analysis.metabolic_summary.gut_health === 'optimal' ? 'Ottimale' : 
                       analysis.metabolic_summary.gut_health === 'moderate' ? 'Moderato' : 'Compromesso'}
                color={analysis.metabolic_summary.gut_health === 'optimal' ? 'green' : 
                       analysis.metabolic_summary.gut_health === 'compromised' ? 'red' : 'yellow'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertTitle className="text-red-400">Attenzione - Combinazioni Critiche</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            {analysis.warnings.map((warning, idx) => (
              <p key={idx} className="text-sm text-red-300">{warning}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Raccomandazioni */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Raccomandazioni Personalizzate
          </CardTitle>
          <CardDescription>
            {analysis.recommendations.length} raccomandazioni basate sul tuo profilo genetico e microbioma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs per categoria */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RecommendationCategory | 'all')}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-background/50 p-1">
              <TabsTrigger value="all" className="text-xs">
                Tutte ({analysis.recommendations.length})
              </TabsTrigger>
              {(Object.keys(categoryLabels) as RecommendationCategory[]).map(cat => {
                const count = analysis.recommendations.filter(r => r.category === cat).length
                if (count === 0) return null
                const Icon = categoryIcons[cat]
                return (
                  <TabsTrigger key={cat} value={cat} className="text-xs">
                    <Icon className="h-3 w-3 mr-1" />
                    {categoryLabels[cat]} ({count})
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <div className="mt-4 space-y-3">
              {filteredRecommendations.map((rec) => (
                <RecommendationCard 
                  key={rec.id} 
                  recommendation={rec}
                  expanded={expandedRecs.has(rec.id)}
                  onToggle={() => toggleExpand(rec.id)}
                />
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Sub-components
function MetricBadge({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }
  
  return (
    <div className={`rounded-lg border p-2 text-center ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  )
}

function RecommendationCard({ 
  recommendation, 
  expanded, 
  onToggle 
}: { 
  recommendation: Recommendation
  expanded: boolean
  onToggle: () => void 
}) {
  const Icon = categoryIcons[recommendation.category]
  const ActionIcon = actionIcons[recommendation.action] || Info
  
  const categoryColors = {
    nutrition: 'border-l-green-500',
    training: 'border-l-blue-500',
    fueling: 'border-l-orange-500',
    supplements: 'border-l-purple-500',
    lifestyle: 'border-l-pink-500'
  }

  return (
    <div 
      className={`rounded-lg border border-border/50 bg-background/30 border-l-4 ${categoryColors[recommendation.category]}`}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-background/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <ActionIcon className={`h-5 w-5 ${
              recommendation.action === 'avoid' ? 'text-red-400' :
              recommendation.action === 'prefer' || recommendation.action === 'increase' ? 'text-green-400' :
              'text-yellow-400'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[10px] ${priorityColors[recommendation.priority]}`}>
                {priorityLabels[recommendation.priority]}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <Icon className="h-3 w-3 mr-1" />
                {categoryLabels[recommendation.category]}
              </Badge>
            </div>
            
            <h4 className="font-semibold mt-2 text-foreground">
              {recommendation.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {recommendation.description}
            </p>
          </div>
          
          <Button variant="ghost" size="sm" className="shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Avoid */}
            {recommendation.avoid && recommendation.avoid.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-red-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> Evita
                </h5>
                <ul className="text-sm space-y-1">
                  {recommendation.avoid.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Prefer */}
            {recommendation.prefer && recommendation.prefer.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Preferisci
                </h5>
                <ul className="text-sm space-y-1">
                  {recommendation.prefer.map((item, idx) => (
                    <li key={idx} className="text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Replace */}
            {recommendation.replace && recommendation.replace.length > 0 && (
              <div className="space-y-2 md:col-span-2">
                <h5 className="text-sm font-medium text-cyan-400 flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" /> Sostituzioni
                </h5>
                <div className="grid gap-2">
                  {recommendation.replace.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-background/50 rounded-lg p-2">
                      <span className="text-red-400 line-through">{item.from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-green-400 font-medium">{item.to}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Timing */}
            {recommendation.timing && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-blue-400 flex items-center gap-1">
                  <Activity className="h-4 w-4" /> Timing
                </h5>
                <p className="text-sm text-muted-foreground">{recommendation.timing}</p>
              </div>
            )}
            
            {/* Dosage */}
            {recommendation.dosage && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-purple-400 flex items-center gap-1">
                  <Pill className="h-4 w-4" /> Dosaggio
                </h5>
                <p className="text-sm text-muted-foreground font-mono">{recommendation.dosage}</p>
              </div>
            )}
          </div>
          
          {/* Reasoning */}
          <Separator className="my-4" />
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Info className="h-4 w-4" /> Spiegazione Metabolica
            </h5>
            <p className="text-sm text-muted-foreground/80 italic">
              {recommendation.reasoning}
            </p>
            <div className="flex gap-1 flex-wrap mt-2">
              {recommendation.sources.map((source, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px]">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
