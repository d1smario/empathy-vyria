"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  CheckCircle2,
  Loader2,
  TrendingUp,
  FileText,
  AlertTriangle,
  Zap,
  Target,
  Save,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ═══════════════════════════════════════════════════════════════════════════
// EMPATHY PERFORMANCE ANALYSIS - Metabolic Power-Based Profiling
// ═══════════════════════════════════════════════════════════════════════════

interface PowerDurationPoint {
  duration: number
  label: string
  power: number | null
}

interface ModelOutput {
  cp: number
  wal: number
  tau_al: number
  wlac: number
  tau_lac: number
  pGlyPeak: number
  fatMax: number
  lt1: number
  lt2: number
  energySplit: {
    aerobic: number
    alactic: number
    lactic: number
  }
}

interface EmpathyZone {
  id: string
  name: string
  min: number
  max: number
  cpPercent: { min: number; max: number }
  color: string
  substrates: {
    cho: number
    fat: number
    pro: number
  }
  consumption: {
    kcalH: number
    choGH: number
    fatGH: number
    proGH: number
  }
}

interface MetabolicProfileGeneratorProps {
  athleteId: string
  athleteName: string
  currentProfile?: {
    ftp_watts: number | null
    vo2max: number | null
    vlamax: number | null
    weight_kg: number | null
    body_fat_percent: number | null
  } | null
  weight: number
  bodyFat: number
  age: number
  height: number
  onProfileGenerated?: () => void
}

const DEFAULT_POWER_POINTS: PowerDurationPoint[] = [
  { duration: 5, label: '5"', power: null },
  { duration: 10, label: '10"', power: null },
  { duration: 20, label: '20"', power: null },
  { duration: 30, label: '30"', power: null },
  { duration: 60, label: "1'", power: null },
  { duration: 120, label: "2'", power: null },
  { duration: 180, label: "3'", power: null },
  { duration: 360, label: "6'", power: null },
  { duration: 480, label: "8'", power: null },
  { duration: 720, label: "12'", power: null },
  { duration: 1200, label: "20'", power: null },
]

const ZONE_DEFINITIONS = [
  { id: "Z1", name: "Recovery", cpMin: 0, cpMax: 0.7, color: "#94a3b8" },
  { id: "Z2", name: "Endurance", cpMin: 0.7, cpMax: 0.76, color: "#22c55e" },
  { id: "Z3", name: "Tempo", cpMin: 0.88, cpMax: 0.92, color: "#eab308" },
  { id: "Z4", name: "Threshold", cpMin: 0.98, cpMax: 1.02, color: "#f97316" },
  { id: "Z5", name: "VO2max", cpMin: 1.1, cpMax: 1.2, color: "#ef4444" },
  { id: "Z6", name: "Anaerobic", cpMin: 1.25, cpMax: 1.8, color: "#dc2626" },
  { id: "Z7", name: "Neuromuscular", cpMin: 1.8, cpMax: 3.0, color: "#991b1b" },
]

const ZONE_SUBSTRATES: Record<string, { cho: number; fat: number; pro: number }> = {
  Z1: { cho: 0.4, fat: 0.6, pro: 0 },
  Z2: { cho: 0.6, fat: 0.4, pro: 0 },
  Z3: { cho: 0.8, fat: 0.2, pro: 0 },
  Z4: { cho: 0.9, fat: 0.08, pro: 0.02 },
  Z5: { cho: 0.98, fat: 0, pro: 0.02 },
  Z6: { cho: 1.0, fat: 0, pro: 0 },
  Z7: { cho: 1.0, fat: 0, pro: 0 },
}

const VLAMAX_CLASSIFICATION = [
  { max: 0.4, label: "Endurance Puro", color: "text-green-500" },
  { max: 0.6, label: "Endurance Potente", color: "text-emerald-500" },
  { max: 0.8, label: "All-round", color: "text-yellow-500" },
  { max: 1.0, label: "Anaerobico", color: "text-orange-500" },
  { max: Number.POSITIVE_INFINITY, label: "Sprint / Lattacido", color: "text-red-500" },
]

const DEFAULT_GE = 0.23
const K_VLAMAX = 0.5

export function MetabolicProfileGenerator({
  athleteId,
  athleteName,
  currentProfile,
  weight,
  bodyFat,
  age,
  height,
  onProfileGenerated,
}: MetabolicProfileGeneratorProps) {
  const [powerPoints, setPowerPoints] = useState<PowerDurationPoint[]>(DEFAULT_POWER_POINTS)
  const [manualCP, setManualCP] = useState<number>(currentProfile?.ftp_watts || 0)
  const [manualVlamax, setManualVlamax] = useState<number>(currentProfile?.vlamax || 0)
  const [ge, setGe] = useState<number>(DEFAULT_GE)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("input")
  const [generatedProfile, setGeneratedProfile] = useState<ModelOutput | null>(null)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")

  const athleteIdExists = !!athleteId
  const lbm = useMemo(() => weight * (1 - bodyFat / 100), [weight, bodyFat])
  const validPointsCount = useMemo(
    () => powerPoints.filter((p) => p.power !== null && p.power > 0).length,
    [powerPoints],
  )

  const fitModel = (points: PowerDurationPoint[]): ModelOutput | null => {
    const validPoints = points.filter((p) => p.power !== null && p.power > 0)

    // Usa CP manuale se non ci sono abbastanza punti
    if (validPoints.length < 5 && manualCP <= 0) {
      console.log("[v0] fitModel: not enough points and no manual CP")
      return null
    }

    let cp: number
    let wal: number
    let tau_al: number
    let wlac: number
    let tau_lac: number
    let vlamax: number

    if (validPoints.length < 5) {
      // Modalità manuale
      console.log("[v0] fitModel: using manual mode with CP =", manualCP)
      cp = manualCP
      wal = cp * 25
      tau_al = 10
      wlac = cp * 180
      tau_lac = 180
      vlamax = manualVlamax > 0 ? manualVlamax : 0.5
    } else {
      // Fit dal modello Power-Duration
      console.log("[v0] fitModel: using power-duration fit with", validPoints.length, "points")

      const best20 = validPoints.find((p) => p.duration === 1200)?.power

      const longEfforts = validPoints.filter((p) => p.duration >= 720)
      if (longEfforts.length >= 2) {
        cp = longEfforts.reduce((sum, p) => sum + (p.power || 0), 0) / longEfforts.length
      } else {
        const bestLong = Math.min(...validPoints.filter((p) => p.duration >= 360).map((p) => p.power || 999))
        cp = best20 ? best20 * 0.95 : bestLong * 0.9
      }

      if (best20 && cp > best20 * 0.95) {
        console.log("[v0] fitModel: limiting CP to 95% of CP20'", best20 * 0.95)
        cp = best20 * 0.95
      }

      const shortEfforts = validPoints.filter((p) => p.duration <= 30 && p.duration >= 5)
      if (shortEfforts.length >= 2) {
        const maxShort = shortEfforts.reduce((max, p) => Math.max(max, p.power || 0), 0)
        wal = (maxShort - cp) * 15
        tau_al = 10
      } else {
        wal = cp * 25
        tau_al = 10
      }

      const mediumEfforts = validPoints.filter((p) => p.duration >= 60 && p.duration <= 360)
      if (mediumEfforts.length >= 2) {
        const avgMedium = mediumEfforts.reduce((sum, p) => sum + (p.power || 0), 0) / mediumEfforts.length
        wlac = (avgMedium - cp) * 180
        tau_lac = 180
      } else {
        wlac = cp * 180
        tau_lac = 180
      }

      cp = Math.max(cp, 100)
      wal = Math.max(wal, 1000)
      wlac = Math.max(wlac, 5000)

      // VLamax modellata: VLamax = P_gly,peak / (LBM × k)
      const pGlyPeak = wlac / tau_lac
      vlamax = pGlyPeak / (lbm * K_VLAMAX)
      vlamax = Math.min(Math.max(vlamax, 0.2), 1.5)
    }

    // Calcoli comuni per entrambe le modalità
    const pGlyPeak = wlac / tau_lac

    // FatMax a ~70% CP
    const fatMax = cp * 0.7

    // LT1 dinamico basato su VLamax (72-82% CP)
    const lt1Factor = vlamax > 0.8 ? 0.72 : vlamax < 0.4 ? 0.82 : 0.82 - (vlamax - 0.4) * 0.25
    const lt1 = cp * lt1Factor

    // LT2 = CP (100%)
    const lt2 = cp * 1.0

    const totalCapacity = wal + wlac + cp * 3600
    const energySplit = {
      aerobic: Math.round(((cp * 3600) / totalCapacity) * 100),
      alactic: Math.round((wal / totalCapacity) * 100),
      lactic: Math.round((wlac / totalCapacity) * 100),
    }

    const result = {
      cp: Math.round(cp),
      wal: Math.round(wal),
      tau_al: Math.round(tau_al * 10) / 10,
      wlac: Math.round(wlac),
      tau_lac: Math.round(tau_lac),
      pGlyPeak: Math.round(pGlyPeak),
      vlamax: Math.round(vlamax * 100) / 100,
      fatMax: Math.round(fatMax),
      lt1: Math.round(lt1),
      lt2: Math.round(lt2),
      energySplit,
    }

    console.log("[v0] fitModel: generated profile", result)
    return result
  }

  const calculateZones = (model: ModelOutput): EmpathyZone[] => {
    console.log("[v0] calculateZones: calculating zones for CP =", model.cp)
    return ZONE_DEFINITIONS.map((zone) => {
      const min = Math.round(model.cp * zone.cpMin)
      const max = Math.round(model.cp * zone.cpMax)
      const midPower = (min + max) / 2

      // kcal/h = W / GE × 0.86
      const kcalH = (midPower / ge) * 0.86

      const substrates = ZONE_SUBSTRATES[zone.id]

      // CHO g/h = (kcal × %CHO) / 4
      // FAT g/h = (kcal × %FAT) / 9
      // PRO g/h = (kcal × %PRO) / 4
      const choGH = (kcalH * substrates.cho) / 4
      const fatGH = (kcalH * substrates.fat) / 9
      const proGH = (kcalH * substrates.pro) / 4

      return {
        id: zone.id,
        name: zone.name,
        min,
        max,
        cpPercent: { min: zone.cpMin * 100, max: zone.cpMax * 100 },
        color: zone.color,
        substrates,
        consumption: {
          kcalH: Math.round(kcalH),
          choGH: Math.round(choGH),
          fatGH: Math.round(fatGH),
          proGH: Math.round(proGH),
        },
      }
    })
  }

  const getVlamaxClass = (v: number) => {
    return VLAMAX_CLASSIFICATION.find((c) => v < c.max) || VLAMAX_CLASSIFICATION[VLAMAX_CLASSIFICATION.length - 1]
  }

  const handleGenerate = () => {
    console.log("[v0] handleGenerate: starting generation")
    setIsGenerating(true) // Added loading state
    setErrorMessage("")

    setTimeout(() => {
      const model = fitModel(powerPoints)
      if (!model) {
        console.log("[v0] handleGenerate: model is null, cannot generate")
        setErrorMessage("Inserisci almeno 5 punti power-duration o un CP manuale")
        setIsGenerating(false)
        return
      }

      console.log("[v0] handleGenerate: model generated successfully", model)
      setGeneratedProfile(model)
      setSaveStatus("idle")
      setIsGenerating(false)
      setActiveTab("report")
    }, 100)
  }

  const handleSave = async () => {
    if (!generatedProfile || !athleteIdExists) {
      console.log("[v0] handleSave: cannot save - no profile or no athleteId")
      return
    }

    setIsSaving(true)
    setSaveStatus("idle")
    setErrorMessage("")

    try {
      console.log("[v0] handleSave: getting Supabase client")
      const supabase = createClient()
      if (!supabase) {
        console.log("[v0] handleSave: Supabase client is null")
        setSaveStatus("error")
        setErrorMessage("Database non configurato")
        setIsSaving(false)
        return
      }

      const zonesArray = calculateZones(generatedProfile)

      const zonesObject: Record<string, EmpathyZone> = {}
      zonesArray.forEach((zone) => {
        const key = zone.id.toLowerCase() // z1, z2, etc.
        zonesObject[key] = zone
      })

      zonesObject["fatmax"] = {
        id: "fatmax",
        name: "FatMax",
        min: Math.round(generatedProfile.cp * 0.7),
        max: Math.round(generatedProfile.cp * 0.72),
        cpPercent: { min: 70, max: 72 },
        color: "#f97316",
        substrates: { cho: 0.45, fat: 0.55, pro: 0 },
        consumption: {
          kcalH: Math.round(((generatedProfile.cp * 0.71) / ge) * 0.86),
          choGH: Math.round((((generatedProfile.cp * 0.71) / ge) * 0.86 * 0.45) / 4),
          fatGH: Math.round((((generatedProfile.cp * 0.71) / ge) * 0.86 * 0.55) / 9),
          proGH: 0,
        },
      }
      zonesObject["lt1"] = {
        id: "lt1",
        name: "LT1",
        min: generatedProfile.lt1,
        max: generatedProfile.lt1,
        cpPercent: { min: 72, max: 82 },
        color: "#22c55e",
        substrates: { cho: 0.6, fat: 0.4, pro: 0 },
        consumption: {
          kcalH: Math.round((generatedProfile.lt1 / ge) * 0.86),
          choGH: Math.round(((generatedProfile.lt1 / ge) * 0.86 * 0.6) / 4),
          fatGH: Math.round(((generatedProfile.lt1 / ge) * 0.86 * 0.4) / 9),
          proGH: 0,
        },
      }
      zonesObject["lt2"] = {
        id: "lt2",
        name: "LT2",
        min: generatedProfile.lt2,
        max: generatedProfile.lt2,
        cpPercent: { min: 100, max: 100 },
        color: "#eab308",
        substrates: { cho: 0.9, fat: 0.08, pro: 0.02 },
        consumption: {
          kcalH: Math.round((generatedProfile.lt2 / ge) * 0.86),
          choGH: Math.round(((generatedProfile.lt2 / ge) * 0.86 * 0.9) / 4),
          fatGH: Math.round(((generatedProfile.lt2 / ge) * 0.86 * 0.08) / 9),
          proGH: Math.round(((generatedProfile.lt2 / ge) * 0.86 * 0.02) / 4),
        },
      }

      console.log("[v0] handleSave: saving zones object", zonesObject)

      const { error: updateError } = await supabase
        .from("metabolic_profiles")
        .update({ is_current: false })
        .eq("athlete_id", athleteId)

      if (updateError) {
        console.log("[v0] handleSave: error updating old profiles", updateError)
      }

      const { error } = await supabase.from("metabolic_profiles").insert({
        athlete_id: athleteId,
        version: 1,
        is_current: true,
        ftp_watts: generatedProfile.cp,
        vo2max: currentProfile?.vo2max || null,
        vlamax: generatedProfile.vlamax,
        weight_kg: weight,
        body_fat_percent: bodyFat,
        lean_body_mass_kg: lbm,
        empathy_zones: zonesObject, // Save as object instead of array
        fat_max_watts: generatedProfile.fatMax,
        test_date: new Date().toISOString().split("T")[0],
        test_type: validPointsCount >= 5 ? "field" : "estimated",
      })

      if (error) {
        console.log("[v0] handleSave: database error", error)
        setSaveStatus("error")
        setErrorMessage(error.message)
      } else {
        console.log("[v0] handleSave: saved successfully")
        setSaveStatus("success")
        onProfileGenerated?.()
      }
    } catch (e) {
      console.log("[v0] handleSave: exception", e)
      setSaveStatus("error")
      setErrorMessage(e instanceof Error ? e.message : "Errore sconosciuto")
    }

    setIsSaving(false)
  }

  const zones = useMemo(() => {
    if (generatedProfile) return calculateZones(generatedProfile)
    return null
  }, [generatedProfile])

  if (!athleteIdExists) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6 text-center text-gray-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
          <p>Completa il profilo atleta per generare l'analisi metabolica.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="input" className="data-[state=active]:bg-fuchsia-600">
            <Activity className="h-4 w-4 mr-2" />
            Input Dati
          </TabsTrigger>
          <TabsTrigger value="report" className="data-[state=active]:bg-fuchsia-600" disabled={!generatedProfile}>
            <FileText className="h-4 w-4 mr-2" />
            Report EMPATHY
          </TabsTrigger>
        </TabsList>

        {/* TAB INPUT */}
        <TabsContent value="input" className="space-y-6">
          {/* Power-Duration Input */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-fuchsia-500" />
                Power-Duration Curve
              </CardTitle>
              <CardDescription className="text-gray-400">
                Inserisci i tuoi best power per ogni durata (minimo 5 punti per il fit automatico)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {powerPoints.map((point, idx) => (
                  <div key={point.duration} className="space-y-1">
                    <Label className="text-gray-400 text-xs">{point.label}</Label>
                    <Input
                      type="number"
                      placeholder="W"
                      value={point.power || ""}
                      onChange={(e) => {
                        const newPoints = [...powerPoints]
                        newPoints[idx].power = e.target.value ? Number(e.target.value) : null
                        setPowerPoints(newPoints)
                      }}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Punti inseriti: {validPointsCount}/11{" "}
                {validPointsCount >= 5 && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
              </p>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-fuchsia-500" />
                Input Manuale (opzionale)
              </CardTitle>
              <CardDescription className="text-gray-400">
                Usa questi campi se hai meno di 5 punti power-duration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400">CP / FTP (W)</Label>
                  <Input
                    type="number"
                    value={manualCP || ""}
                    onChange={(e) => setManualCP(Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">VLamax (mmol/L/s)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualVlamax || ""}
                    onChange={(e) => setManualVlamax(Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="0.48"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">Efficienza Meccanica (GE)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ge}
                    onChange={(e) => setGe(Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="0.23"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-400">LBM (kg)</Label>
                  <Input
                    type="number"
                    value={lbm.toFixed(1)}
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (validPointsCount < 5 && manualCP <= 0)}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-8 py-3"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generazione...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Genera Profilo EMPATHY
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* TAB REPORT */}
        <TabsContent value="report" className="space-y-6">
          {generatedProfile && zones && (
            <>
              {/* Header Report */}
              <Card className="bg-gradient-to-r from-fuchsia-900/50 to-gray-900 border-fuchsia-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{athleteName}</h2>
                      <p className="text-gray-400">EMPATHY Performance Report</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-fuchsia-400">{generatedProfile.cp}W</p>
                      <p className="text-gray-400">Critical Power</p>
                      <p className="text-xs text-gray-500">{(generatedProfile.cp / weight).toFixed(2)} W/kg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parametri Chiave */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-fuchsia-400">{generatedProfile.cp}W</p>
                    <p className="text-sm text-gray-400">CP / FTP</p>
                    <p className="text-xs text-gray-500">{(generatedProfile.cp / weight).toFixed(2)} W/kg</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4 text-center">
                    <p className={`text-2xl font-bold ${getVlamaxClass(generatedProfile.vlamax).color}`}>
                      {generatedProfile.vlamax}
                    </p>
                    <p className="text-sm text-gray-400">VLamax</p>
                    <p className="text-xs text-gray-500">{getVlamaxClass(generatedProfile.vlamax).label}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{generatedProfile.fatMax}W</p>
                    <p className="text-sm text-gray-400">FatMax</p>
                    <p className="text-xs text-gray-500">70% CP</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-400">{generatedProfile.lt1}W</p>
                    <p className="text-sm text-gray-400">LT1</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((generatedProfile.lt1 / generatedProfile.cp) * 100)}% CP
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Energy System Split */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Energy System Contribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-8 rounded-lg overflow-hidden">
                    <div
                      className="bg-blue-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${generatedProfile.energySplit.aerobic}%` }}
                    >
                      Aerobico {generatedProfile.energySplit.aerobic}%
                    </div>
                    <div
                      className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-gray-900"
                      style={{ width: `${generatedProfile.energySplit.alactic}%` }}
                    >
                      {generatedProfile.energySplit.alactic}%
                    </div>
                    <div
                      className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${generatedProfile.energySplit.lactic}%` }}
                    >
                      Lattacido {generatedProfile.energySplit.lactic}%
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Aerobico</span>
                    <span>Alattacido</span>
                    <span>Lattacido</span>
                  </div>
                </CardContent>
              </Card>

              {/* ZONE + CONSUMI SUBSTRATI */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-fuchsia-500" />
                    Zone EMPATHY + Consumi Substrati
                  </CardTitle>
                  <CardDescription className="text-gray-400">g/h di CHO, FAT, PRO per zona</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-2 text-gray-400">Zona</th>
                          <th className="text-center py-3 px-2 text-gray-400">Range (W)</th>
                          <th className="text-center py-3 px-2 text-gray-400">% CP</th>
                          <th className="text-center py-3 px-2 text-gray-400">CHO g/h</th>
                          <th className="text-center py-3 px-2 text-gray-400">FAT g/h</th>
                          <th className="text-center py-3 px-2 text-gray-400">PRO g/h</th>
                          <th className="text-center py-3 px-2 text-gray-400">kcal/h</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(zones).map((zone) => (
                          <tr key={zone.id} className="border-b border-gray-800">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                                <span className="text-white font-medium">{zone.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-2 text-gray-300">
                              {zone.min} - {zone.max}
                            </td>
                            <td className="text-center py-3 px-2 text-gray-400">
                              {zone.cpPercent.min.toFixed(0)}-{zone.cpPercent.max.toFixed(0)}%
                            </td>
                            <td className="text-center py-3 px-2 text-orange-400 font-medium">
                              {zone.consumption.choGH}
                            </td>
                            <td className="text-center py-3 px-2 text-green-400 font-medium">
                              {zone.consumption.fatGH}
                            </td>
                            <td className="text-center py-3 px-2 text-blue-400 font-medium">
                              {zone.consumption.proGH}
                            </td>
                            <td className="text-center py-3 px-2 text-gray-300">{zone.consumption.kcalH}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button + Status */}
              <div className="flex flex-col items-center gap-4">
                {saveStatus === "success" && (
                  <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Profilo salvato con successo!</span>
                  </div>
                )}
                {saveStatus === "error" && (
                  <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>Errore nel salvataggio: {errorMessage}</span>
                  </div>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Salva nel Database
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
