"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Upload, Calculator, Zap, Activity, Flame, Target, Percent } from "lucide-react"
import { MetabolicProfileGenerator } from "./metabolic-profile-generator"
import type { AthleteDataType } from "@/components/dashboard-content"

const EMPATHY_ZONE_PERCENTS: Record<string, { min: number; max: number }> = {
  z1: { min: 0, max: 70 },
  fatmax: { min: 70, max: 72 },
  z2: { min: 70, max: 76 },
  z3: { min: 88, max: 92 },
  z4: { min: 98, max: 102 },
  z5: { min: 110, max: 120 },
  z6: { min: 125, max: 180 },
  z7: { min: 180, max: 300 },
}

interface PerformanceAnalysisProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
}

export const PerformanceAnalysis = ({ athleteData, userName }: PerformanceAnalysisProps) => {
  const [showGenerator, setShowGenerator] = useState(false)

  if (!athleteData?.id) {
    return (
      <div className="p-4 md:p-8">
        <Card className="border-yellow-900/50 bg-yellow-950/20">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Caricamento dati atleta...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentProfile =
    athleteData?.metabolic_profiles?.find((p) => p.is_current) || athleteData?.metabolic_profiles?.[0]

  const hasMetabolicData = currentProfile && (currentProfile.ftp_watts || currentProfile.vo2max)

  const ftp = currentProfile?.ftp_watts || 0
  const vo2max = currentProfile?.vo2max || 0
  const weight = athleteData?.weight_kg || currentProfile?.weight_kg || 70
  const bodyFat = athleteData?.body_fat_percent || currentProfile?.body_fat_percent || 15
  const vlamax = currentProfile?.vlamax || 0.48
  const empathyZones = currentProfile?.empathy_zones as Record<string, unknown> | null

  const hrMax = currentProfile?.hr_max || 0
  const hrLt2 = currentProfile?.hr_lt2 || 0
  const hrRest = currentProfile?.hr_rest || 0
  const hrZones = currentProfile?.hr_zones as Record<
    string,
    { min: number; max: number; name: string; color: string }
  > | null

  const calculateAge = () => {
    if (!athleteData?.birth_date) return 30
    const birth = new Date(athleteData.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = calculateAge()
  const height = athleteData?.height_cm || 175

  const getZoneValue = (zoneKey: string, field: string) => {
    if (empathyZones && empathyZones[zoneKey]) {
      const zone = empathyZones[zoneKey] as Record<string, number>
      return zone[field]
    }
    return null
  }

  const fatMaxWatts = currentProfile?.fat_max_watts || getZoneValue("fatmax", "min") || Math.round(ftp * 0.7)

  const calculateLT1Percent = (v: number) => {
    // VLamax alta (>0.6) → LT1 più basso (72%)
    // VLamax bassa (<0.4) → LT1 più alto (82%)
    if (v >= 0.6) return 0.72
    if (v <= 0.4) return 0.82
    return 0.82 - ((v - 0.4) / 0.2) * 0.1
  }

  const lt1Percent = calculateLT1Percent(vlamax)
  const lt1Watts = getZoneValue("lt1", "watts") || Math.round(ftp * lt1Percent)
  const lt2Watts = getZoneValue("lt2", "watts") || Math.round(ftp * 1.0)

  const hasEmpathyZones = empathyZones && Object.keys(empathyZones).length > 0

  const getVlamaxClass = (v: number) => {
    if (v < 0.4) return { label: "Endurance Puro", color: "text-green-400" }
    if (v < 0.6) return { label: "Endurance Potente", color: "text-emerald-400" }
    if (v < 0.8) return { label: "All-round", color: "text-yellow-400" }
    if (v < 1.0) return { label: "Anaerobico", color: "text-orange-400" }
    return { label: "Sprint / Lattacido", color: "text-red-400" }
  }

  if (!hasMetabolicData || showGenerator) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">EMPATHY Performance Analysis</h2>
            <p className="text-muted-foreground">Genera il tuo profilo metabolico power-based</p>
          </div>
          {hasMetabolicData && (
            <Button variant="outline" onClick={() => setShowGenerator(false)}>
              Torna all'Analisi
            </Button>
          )}
        </div>

        <MetabolicProfileGenerator
          athleteId={athleteData?.id || ""}
          athleteName={userName || "Atleta"}
          currentProfile={currentProfile}
          weight={weight}
          bodyFat={bodyFat}
          age={age}
          height={height}
          onProfileGenerated={() => {
            setShowGenerator(false)
            // Small delay to ensure state updates before reload
            setTimeout(() => {
              window.location.reload()
            }, 500)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">EMPATHY Performance Analysis</h2>
          <p className="text-muted-foreground">Profilo metabolico di {userName || "Atleta"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGenerator(true)}>
            <Calculator className="mr-2 h-4 w-4" />
            Rigenera Profilo
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Importa Test
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-fuchsia-950/50 to-fuchsia-900/20 border-fuchsia-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-fuchsia-400" />
              CP (Critical Power)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ftp} W</div>
            <p className="text-xs text-muted-foreground">{(ftp / weight).toFixed(2)} W/kg</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950/50 to-red-900/20 border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-400" />
              VO2max
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vo2max || "—"}</div>
            <p className="text-xs text-muted-foreground">ml/kg/min</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950/50 to-orange-900/20 border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" />
              VLamax (modellata)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vlamax || "—"}</div>
            <p className={`text-xs ${getVlamaxClass(vlamax).color}`}>{getVlamaxClass(vlamax).label}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950/50 to-green-900/20 border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-400" />
              FatMax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fatMaxWatts} W</div>
            <p className="text-xs text-muted-foreground">70% CP</p>
          </CardContent>
        </Card>
      </div>

      {/* Thresholds - EMPATHY style */}
      <Card>
        <CardHeader>
          <CardTitle>Marker Metabolici</CardTitle>
          <CardDescription>
            {hasEmpathyZones
              ? "Calcolati con modello EMPATHY power-based"
              : "Stimate da CP - genera profilo per valori precisi"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col p-4 bg-orange-950/30 rounded-lg border border-orange-900">
              <span className="text-sm font-semibold text-orange-400">FatMax</span>
              <span className="text-2xl font-mono font-bold">{fatMaxWatts} W</span>
              <span className="text-xs text-muted-foreground">70% CP</span>
            </div>
            <div className="flex flex-col p-4 bg-green-950/30 rounded-lg border border-green-900">
              <span className="text-sm font-semibold text-green-400">LT1</span>
              <span className="text-2xl font-mono font-bold">{lt1Watts} W</span>
              <span className="text-xs text-muted-foreground">
                {Math.round(lt1Percent * 100)}% CP (VLamax: {vlamax})
              </span>
            </div>
            <div className="flex flex-col p-4 bg-yellow-950/30 rounded-lg border border-yellow-900">
              <span className="text-sm font-semibold text-yellow-400">LT2</span>
              <span className="text-2xl font-mono font-bold">{lt2Watts} W</span>
              <span className="text-xs text-muted-foreground">100% CP</span>
            </div>
            <div className="flex flex-col p-4 bg-fuchsia-950/30 rounded-lg border border-fuchsia-900">
              <span className="text-sm font-semibold text-fuchsia-400">LBM</span>
              <span className="text-2xl font-mono font-bold">{(weight * (1 - bodyFat / 100)).toFixed(1)} kg</span>
              <span className="text-xs text-muted-foreground">Massa magra</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HR Zones Section */}
      {(hrMax > 0 || hrZones) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              Zone Frequenza Cardiaca
            </CardTitle>
            <CardDescription>
              {hrZones ? "Zone HR salvate dal Coach Training Planner" : "Valori base - configura nel Training Planner"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div className="flex flex-col p-4 bg-red-950/30 rounded-lg border border-red-900">
                <span className="text-sm font-semibold text-red-400">FC Max</span>
                <span className="text-2xl font-mono font-bold">{hrMax || "—"} bpm</span>
              </div>
              <div className="flex flex-col p-4 bg-orange-950/30 rounded-lg border border-orange-900">
                <span className="text-sm font-semibold text-orange-400">FC Soglia (LT2)</span>
                <span className="text-2xl font-mono font-bold">{hrLt2 || "—"} bpm</span>
                {hrMax > 0 && hrLt2 > 0 && (
                  <span className="text-xs text-muted-foreground">{Math.round((hrLt2 / hrMax) * 100)}% FCmax</span>
                )}
              </div>
              <div className="flex flex-col p-4 bg-blue-950/30 rounded-lg border border-blue-900">
                <span className="text-sm font-semibold text-blue-400">FC Riposo</span>
                <span className="text-2xl font-mono font-bold">{hrRest || "—"} bpm</span>
              </div>
            </div>

            {hrZones && Object.keys(hrZones).length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3">Zona</th>
                      <th className="text-right p-3">Range (bpm)</th>
                      <th className="text-right p-3">% FCmax</th>
                      <th className="text-right p-3 text-amber-400">CHO g/h</th>
                      <th className="text-right p-3 text-green-400">FAT g/h</th>
                      <th className="text-right p-3 text-blue-400">PRO g/h</th>
                      <th className="text-right p-3">kcal/h</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(hrZones).map(([key, zone]) => {
                      const zoneData = zone as {
                        name: string
                        min: number
                        max: number
                        color?: string
                        cho_g_h?: number
                        fat_g_h?: number
                        pro_g_h?: number
                        kcal_h?: number
                        consumption?: { choGH: number; fatGH: number; proGH: number; kcalH: number }
                      }
                      const bgColor = zoneData.color ? `${zoneData.color}10` : "transparent"
                      const dotColor = zoneData.color || "#666666"

                      // Support both formats
                      const choGH = zoneData.consumption?.choGH ?? zoneData.cho_g_h ?? "—"
                      const fatGH = zoneData.consumption?.fatGH ?? zoneData.fat_g_h ?? "—"
                      const proGH = zoneData.consumption?.proGH ?? zoneData.pro_g_h ?? "—"
                      const kcalH = zoneData.consumption?.kcalH ?? zoneData.kcal_h ?? "—"

                      return (
                        <tr key={key} className="border-b border-gray-800/50" style={{ backgroundColor: bgColor }}>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
                              <span className="font-medium">{zoneData.name || key}</span>
                            </div>
                          </td>
                          <td className="text-right p-3 font-mono">
                            {zoneData.min} - {zoneData.max}
                          </td>
                          <td className="text-right p-3 text-muted-foreground">
                            {hrMax > 0
                              ? `${Math.round((zoneData.min / hrMax) * 100)}-${Math.round((zoneData.max / hrMax) * 100)}%`
                              : "—"}
                          </td>
                          <td className="text-right p-3 font-mono text-amber-400">{choGH}</td>
                          <td className="text-right p-3 font-mono text-green-400">{fatGH}</td>
                          <td className="text-right p-3 font-mono text-blue-400">{proGH}</td>
                          <td className="text-right p-3 font-mono">{kcalH}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Message if no HR zones saved */}
            {(!hrZones || Object.keys(hrZones).length === 0) && hrMax > 0 && (
              <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-muted-foreground text-sm">
                  Zone HR non ancora calcolate. Vai al <strong>Coach Training Planner</strong> e clicca "Modifica Dati
                  Fisiologici" per calcolare e salvare le zone con i consumi di substrati.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* EMPATHY Zones with Substrate Consumption */}
      {hasEmpathyZones && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-fuchsia-500" />
              Zone EMPATHY + Consumi Substrati
            </CardTitle>
            <CardDescription>g/h di CHO, FAT, PRO per zona</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-3">Zona</th>
                    <th className="text-right p-3">Range (W)</th>
                    <th className="text-right p-3">% CP</th>
                    <th className="text-right p-3 text-amber-400">CHO g/h</th>
                    <th className="text-right p-3 text-green-400">FAT g/h</th>
                    <th className="text-right p-3 text-blue-400">PRO g/h</th>
                    <th className="text-right p-3">kcal/h</th>
                  </tr>
                </thead>
                <tbody>
                  {["z1", "fatmax", "z2", "z3", "z4", "z5", "z6", "z7"].map((zoneKey) => {
                    const zone = empathyZones[zoneKey] as
                      | {
                          name: string
                          min: number
                          max: number
                          color: string
                          substrates?: { cho: number; fat: number; pro: number }
                          consumption?: { choGH: number; fatGH: number; proGH: number; kcalH: number }
                        }
                      | undefined
                    if (!zone) return null

                    const zonePercents = EMPATHY_ZONE_PERCENTS[zoneKey] || { min: 0, max: 100 }

                    return (
                      <tr
                        key={zoneKey}
                        className="border-b border-gray-800/50"
                        style={{ backgroundColor: `${zone.color}10` }}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                            <span className="font-medium">{zone.name}</span>
                          </div>
                        </td>
                        <td className="text-right p-3 font-mono">
                          {zone.min} - {zone.max > 900 ? "max" : zone.max}
                        </td>
                        <td className="text-right p-3 text-muted-foreground">
                          {zonePercents.min}-{zonePercents.max}%
                        </td>
                        <td className="text-right p-3 font-mono text-amber-400">{zone.consumption?.choGH || "—"}</td>
                        <td className="text-right p-3 font-mono text-green-400">{zone.consumption?.fatGH || "—"}</td>
                        <td className="text-right p-3 font-mono text-blue-400">{zone.consumption?.proGH || "—"}</td>
                        <td className="text-right p-3 font-mono">{zone.consumption?.kcalH || "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center italic">
        EMPATHY PERFORMANCE ANALYSIS non misura il lattato. Modella la fisiologia che lo genera.
        <br />
        Marker stimati power-based — ricalibrabili con test lattato/VO2
      </p>

      {/* Next Steps */}
      <Card className="border-fuchsia-900/50 bg-fuchsia-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-fuchsia-400">
            <Percent className="h-5 w-5" />
            Prossimi Passi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="font-semibold mb-2">1. Piano Allenamento</h4>
              <p className="text-sm text-muted-foreground">Genera o importa il piano da TrainingPeaks/VYRIA</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="font-semibold mb-2">2. Nutrizione EMPATHY</h4>
              <p className="text-sm text-muted-foreground">Piano nutrizionale basato sui consumi per zona</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h4 className="font-semibold mb-2">3. Intra-Workout</h4>
              <p className="text-sm text-muted-foreground">Strategia CHO durante l'allenamento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
