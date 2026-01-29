"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Activity, 
  Heart, 
  Moon, 
  Brain, 
  Thermometer, 
  Wind,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  RefreshCw,
  Pill
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { 
  analyzeReadiness, 
  calculateStress, 
  calculateRecovery,
  type BiometricsInput 
} from "@/lib/readiness-engine"
import type { AthleteDataType } from "@/components/dashboard-content"

interface BioMapReportProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
}

interface BiometricData {
  hrv_ms?: number
  hrv_baseline?: number
  hr_resting?: number
  hr_resting_baseline?: number
  sleep_duration_min?: number
  sleep_score?: number
  sleep_deep_min?: number
  sleep_rem_min?: number
  respiratory_rate?: number
  spo2_avg?: number
  body_temperature_deviation?: number
  recovery_score?: number
  readiness_score?: number
  steps?: number
  active_calories?: number
}

interface TrainingData {
  tss_yesterday?: number
  tss_7day_avg?: number
  ctl?: number
  atl?: number
}

interface AISuggestion {
  category: 'supplement' | 'nutrition' | 'lifestyle' | 'training'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

export function BioMapReport({ athleteData, userName }: BioMapReportProps) {
  const [loading, setLoading] = useState(true)
  const [biometrics, setBiometrics] = useState<BiometricData | null>(null)
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  
  const today = new Date().toLocaleDateString("it-IT", { 
    weekday: "long", 
    day: "numeric", 
    month: "long",
    year: "numeric"
  })

  // Load biometric and training data
  useEffect(() => {
    if (!athleteData?.id) return
    
    const loadData = async () => {
      setLoading(true)
      const supabase = createClient()
      const todayDate = new Date().toISOString().split('T')[0]
      const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      
      try {
        // Load latest body metrics (HRV, HR, etc.) from Rook
        const { data: bodyMetrics } = await supabase
          .from('imported_body_metrics')
          .select('*')
          .eq('athlete_id', athleteData.id)
          .gte('metric_date', yesterdayDate)
          .order('metric_date', { ascending: false })
          .limit(1)
          .single()
        
        // Load latest sleep data
        const { data: sleepData } = await supabase
          .from('imported_sleep_data')
          .select('*')
          .eq('athlete_id', athleteData.id)
          .gte('sleep_date', yesterdayDate)
          .order('sleep_date', { ascending: false })
          .limit(1)
          .single()
        
        // Load training data for TSS/CTL/ATL
        const { data: pmcData } = await supabase
          .from('athlete_pmc')
          .select('ctl, atl, tsb')
          .eq('athlete_id', athleteData.id)
          .order('date', { ascending: false })
          .limit(1)
          .single()
        
        // Load yesterday's training TSS
        const { data: yesterdayTraining } = await supabase
          .from('imported_activities')
          .select('tss')
          .eq('athlete_id', athleteData.id)
          .eq('activity_date', yesterdayDate)
        
        const tssYesterday = yesterdayTraining?.reduce((sum, a) => sum + (a.tss || 0), 0) || 0
        
        // Combine biometric data
        const biometricInput: BiometricData = {
          hrv_ms: bodyMetrics?.hrv_ms,
          hrv_baseline: athleteData.hrv_baseline || 50,
          hr_resting: bodyMetrics?.resting_heart_rate,
          hr_resting_baseline: athleteData.resting_hr || 55,
          sleep_duration_min: sleepData?.total_sleep_minutes,
          sleep_score: sleepData?.sleep_score,
          sleep_deep_min: sleepData?.deep_sleep_minutes,
          sleep_rem_min: sleepData?.rem_sleep_minutes,
          respiratory_rate: bodyMetrics?.respiratory_rate,
          spo2_avg: bodyMetrics?.spo2,
          recovery_score: bodyMetrics?.recovery_score,
          readiness_score: bodyMetrics?.readiness_score,
          steps: bodyMetrics?.steps,
          active_calories: bodyMetrics?.active_calories,
        }
        
        setBiometrics(biometricInput)
        setTrainingData({
          tss_yesterday: tssYesterday,
          ctl: pmcData?.ctl,
          atl: pmcData?.atl,
        })
        
      } catch (error) {
        console.error('[BioMap] Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [athleteData?.id])
  
  // Calculate scores using readiness engine
  const scores = useMemo(() => {
    if (!biometrics) return null
    
    const input: BiometricsInput = {
      hrv_rmssd: biometrics.hrv_ms,
      hrv_baseline: biometrics.hrv_baseline,
      hr_resting: biometrics.hr_resting,
      hr_resting_baseline: biometrics.hr_resting_baseline,
      sleep_duration_min: biometrics.sleep_duration_min,
      sleep_score: biometrics.sleep_score,
      sleep_deep_min: biometrics.sleep_deep_min,
      respiratory_rate: biometrics.respiratory_rate,
      spo2_avg: biometrics.spo2_avg,
      tss_yesterday: trainingData?.tss_yesterday,
      ctl: trainingData?.ctl,
      atl: trainingData?.atl,
    }
    
    return analyzeReadiness(input)
  }, [biometrics, trainingData])
  
  // Generate AI suggestions
  const generateAISuggestions = async () => {
    if (!scores || !athleteData) return
    
    setAiLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/ai/biomap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          athleteId: athleteData.id,
          scores,
          biometrics,
          trainingData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('[BioMap] AI analysis error:', error)
    } finally {
      setAiLoading(false)
    }
  }
  
  // Score color helpers
  const getScoreColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score <= 30) return 'text-green-400'
      if (score <= 60) return 'text-amber-400'
      return 'text-red-400'
    }
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }
  
  const getScoreBg = (score: number, inverse = false) => {
    if (inverse) {
      if (score <= 30) return 'bg-green-500/20 border-green-500/30'
      if (score <= 60) return 'bg-amber-500/20 border-amber-500/30'
      return 'bg-red-500/20 border-red-500/30'
    }
    if (score >= 70) return 'bg-green-500/20 border-green-500/30'
    if (score >= 40) return 'bg-amber-500/20 border-amber-500/30'
    return 'bg-red-500/20 border-red-500/30'
  }
  
  const getTrendIcon = (status: string) => {
    if (status === 'optimal' || status === 'excellent' || status === 'fresh') 
      return <TrendingUp className="h-4 w-4 text-green-400" />
    if (status === 'suppressed' || status === 'poor' || status === 'overreaching')
      return <TrendingDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-amber-400" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">BioMap Report</h2>
          <p className="text-muted-foreground capitalize">{today}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>
      
      {/* Main Score Cards */}
      {scores ? (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Stress Score (Internal Load) */}
          <Card className={`border ${getScoreBg(scores.stress_score, true)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Stress Score
              </CardTitle>
              <CardDescription className="text-xs">Carico Interno</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getScoreColor(scores.stress_score, true)}`}>
                {scores.stress_score}
              </div>
              <Progress 
                value={scores.stress_score} 
                className="mt-2 h-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {scores.stress_score <= 30 ? 'Basso' : scores.stress_score <= 60 ? 'Moderato' : 'Elevato'}
              </p>
            </CardContent>
          </Card>
          
          {/* Recovery Score */}
          <Card className={`border ${getScoreBg(scores.recovery_score)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Battery className="h-4 w-4 text-green-400" />
                Recovery
              </CardTitle>
              <CardDescription className="text-xs">Recupero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getScoreColor(scores.recovery_score)}`}>
                {scores.recovery_score}
              </div>
              <Progress 
                value={scores.recovery_score} 
                className="mt-2 h-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {scores.recovery_score >= 70 ? 'Ottimo' : scores.recovery_score >= 40 ? 'Parziale' : 'Insufficiente'}
              </p>
            </CardContent>
          </Card>
          
          {/* Readiness Score */}
          <Card className={`border ${getScoreBg(scores.readiness_score)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-fuchsia-400" />
                Readiness
              </CardTitle>
              <CardDescription className="text-xs">Prontezza</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${getScoreColor(scores.readiness_score)}`}>
                {scores.readiness_score}
              </div>
              <Progress 
                value={scores.readiness_score} 
                className="mt-2 h-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                Intensita consigliata: <span className="font-medium capitalize">{scores.recommended_intensity}</span>
              </p>
            </CardContent>
          </Card>
          
          {/* Strain Score */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-400" />
                Strain
              </CardTitle>
              <CardDescription className="text-xs">Carico Ieri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-orange-400">
                {scores.strain_score.toFixed(1)}
              </div>
              <Progress 
                value={(scores.strain_score / 21) * 100} 
                className="mt-2 h-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                Max 21 (scala Whoop)
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nessun dato biometrico disponibile. Collega un dispositivo dalla sezione Devices.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Status Indicators */}
      {scores && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Dettagliato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* HRV Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <Heart className="h-5 w-5 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">HRV</p>
                  <p className="text-xs text-muted-foreground capitalize">{scores.hrv_status}</p>
                </div>
                {getTrendIcon(scores.hrv_status)}
              </div>
              
              {/* Sleep Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <Moon className="h-5 w-5 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Sonno</p>
                  <p className="text-xs text-muted-foreground capitalize">{scores.sleep_status}</p>
                </div>
                {getTrendIcon(scores.sleep_status)}
              </div>
              
              {/* Fatigue Status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <Brain className="h-5 w-5 text-purple-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Fatica</p>
                  <p className="text-xs text-muted-foreground capitalize">{scores.fatigue_status}</p>
                </div>
                {getTrendIcon(scores.fatigue_status)}
              </div>
            </div>
            
            {/* Recommendation Message */}
            <div className="mt-4 p-4 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/30">
              <p className="text-sm">{scores.message}</p>
              {scores.load_adjustment_pct !== 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aggiustamento carico suggerito: {scores.load_adjustment_pct > 0 ? '+' : ''}{scores.load_adjustment_pct}%
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Biometric Details */}
      {biometrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dati Biometrici</CardTitle>
            <CardDescription>Ultimi dati dai dispositivi collegati</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {biometrics.hrv_ms && (
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Heart className="h-4 w-4 mx-auto text-red-400 mb-1" />
                  <p className="text-2xl font-bold">{Math.round(biometrics.hrv_ms)}</p>
                  <p className="text-xs text-muted-foreground">HRV (ms)</p>
                </div>
              )}
              {biometrics.hr_resting && (
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Activity className="h-4 w-4 mx-auto text-orange-400 mb-1" />
                  <p className="text-2xl font-bold">{biometrics.hr_resting}</p>
                  <p className="text-xs text-muted-foreground">HR Riposo (bpm)</p>
                </div>
              )}
              {biometrics.sleep_duration_min && (
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Moon className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                  <p className="text-2xl font-bold">
                    {Math.floor(biometrics.sleep_duration_min / 60)}h {biometrics.sleep_duration_min % 60}m
                  </p>
                  <p className="text-xs text-muted-foreground">Sonno</p>
                </div>
              )}
              {biometrics.spo2_avg && (
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Wind className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
                  <p className="text-2xl font-bold">{biometrics.spo2_avg}%</p>
                  <p className="text-xs text-muted-foreground">SpO2</p>
                </div>
              )}
              {biometrics.respiratory_rate && (
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Wind className="h-4 w-4 mx-auto text-teal-400 mb-1" />
                  <p className="text-2xl font-bold">{biometrics.respiratory_rate.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Resp Rate</p>
                </div>
              )}
              {biometrics.steps && (
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Activity className="h-4 w-4 mx-auto text-green-400 mb-1" />
                  <p className="text-2xl font-bold">{biometrics.steps.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Passi</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* AI Suggestions */}
      {scores && (
        <Card className="border-fuchsia-900/50 bg-gradient-to-br from-fuchsia-950/20 to-purple-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-fuchsia-400" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Consigli personalizzati basati sui tuoi dati
                </CardDescription>
              </div>
              <Button 
                onClick={generateAISuggestions}
                disabled={aiLoading}
                className="bg-fuchsia-600 hover:bg-fuchsia-700"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Genera Consigli
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {aiSuggestions.length > 0 ? (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      suggestion.priority === 'high' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : suggestion.priority === 'medium'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-secondary/30 border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {suggestion.category === 'supplement' && <Pill className="h-4 w-4 text-purple-400 mt-0.5" />}
                      {suggestion.category === 'nutrition' && <Activity className="h-4 w-4 text-green-400 mt-0.5" />}
                      {suggestion.category === 'lifestyle' && <Moon className="h-4 w-4 text-blue-400 mt-0.5" />}
                      {suggestion.category === 'training' && <Zap className="h-4 w-4 text-orange-400 mt-0.5" />}
                      <div>
                        <p className="font-medium text-sm">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Clicca "Genera Consigli" per ricevere raccomandazioni AI personalizzate basate sul tuo stress score, recupero, e dati biometrici.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
