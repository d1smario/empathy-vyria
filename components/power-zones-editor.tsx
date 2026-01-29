"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Zap, Heart, Save, Calculator, Loader2, CheckCircle2, AlertCircle, Bike, Footprints, Waves } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PowerZone {
  name: string
  percentMin: number
  percentMax: number | null
  wattsMin: number
  wattsMax: number | null
}

interface HRZone {
  name: string
  percentMin: number
  percentMax: number
  hrMin: number
  hrMax: number
}

interface PowerZonesEditorProps {
  athleteId: string
  athleteName?: string
  initialFTP?: number
  initialHRMax?: number
  initialHRThreshold?: number
  sport?: string
  onSave?: () => void
}

// Coggan Power Zones defaults
const DEFAULT_POWER_ZONES: Omit<PowerZone, "wattsMin" | "wattsMax">[] = [
  { name: "Z1 - Recovery", percentMin: 0, percentMax: 55 },
  { name: "Z2 - Endurance", percentMin: 56, percentMax: 75 },
  { name: "Z3 - Tempo", percentMin: 76, percentMax: 90 },
  { name: "Z4 - Threshold", percentMin: 91, percentMax: 105 },
  { name: "Z5 - VO2max", percentMin: 106, percentMax: 120 },
  { name: "Z6 - Anaerobic", percentMin: 121, percentMax: 150 },
  { name: "Z7 - Neuromuscular", percentMin: 151, percentMax: null },
]

// HR Zones defaults (Friel based on LTHR)
const DEFAULT_HR_ZONES: Omit<HRZone, "hrMin" | "hrMax">[] = [
  { name: "Z1 - Recovery", percentMin: 0, percentMax: 81 },
  { name: "Z2 - Endurance", percentMin: 81, percentMax: 89 },
  { name: "Z3 - Tempo", percentMin: 89, percentMax: 93 },
  { name: "Z4 - Threshold", percentMin: 93, percentMax: 99 },
  { name: "Z5 - VO2max", percentMin: 99, percentMax: 106 },
]

const ZONE_COLORS = [
  "bg-slate-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-red-600",
  "bg-red-800",
]

const SPORTS = [
  { id: "cycling", name: "Ciclismo", icon: Bike, hasPower: true },
  { id: "running", name: "Corsa", icon: Footprints, hasPower: false },
  { id: "swimming", name: "Nuoto", icon: Waves, hasPower: false },
]

export function PowerZonesEditor({
  athleteId,
  athleteName,
  initialFTP,
  initialHRMax,
  initialHRThreshold,
  sport = "cycling",
  onSave,
}: PowerZonesEditorProps) {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<"power" | "hr">("power")
  const [selectedSport, setSelectedSport] = useState(sport)

  // Power zones state
  const [ftp, setFtp] = useState<number>(initialFTP || 250)
  const [powerZones, setPowerZones] = useState<PowerZone[]>([])
  const [customPowerZones, setCustomPowerZones] = useState(false)

  // HR zones state
  const [hrMax, setHrMax] = useState<number>(initialHRMax || 185)
  const [hrThreshold, setHrThreshold] = useState<number>(initialHRThreshold || 170)
  const [hrZones, setHrZones] = useState<HRZone[]>([])
  const [hrZoneModel, setHrZoneModel] = useState<"threshold" | "max_hr">("threshold")
  const [customHRZones, setCustomHRZones] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")

  // Load existing zones on mount
  useEffect(() => {
    loadExistingZones()
  }, [athleteId, selectedSport])

  // Calculate power zones when FTP changes (if not custom)
  useEffect(() => {
    if (!customPowerZones) {
      calculatePowerZones()
    }
  }, [ftp, customPowerZones])

  // Calculate HR zones when HR values change (if not custom)
  useEffect(() => {
    if (!customHRZones) {
      calculateHRZones()
    }
  }, [hrMax, hrThreshold, hrZoneModel, customHRZones])

  const loadExistingZones = async () => {
    setLoading(true)
    try {
      // Load power zones
      const { data: powerData } = await supabase
        .from("power_zones")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("sport", selectedSport)
        .single()

      if (powerData) {
        setFtp(powerData.ftp_watts)
        const loadedPowerZones: PowerZone[] = []
        for (let i = 1; i <= 7; i++) {
          loadedPowerZones.push({
            name: powerData[`z${i}_name`] || DEFAULT_POWER_ZONES[i - 1].name,
            percentMin: powerData[`z${i}_percent_ftp_min`] || DEFAULT_POWER_ZONES[i - 1].percentMin,
            percentMax: powerData[`z${i}_percent_ftp_max`] || DEFAULT_POWER_ZONES[i - 1].percentMax,
            wattsMin: powerData[`z${i}_watts_min`] || 0,
            wattsMax: powerData[`z${i}_watts_max`] || null,
          })
        }
        setPowerZones(loadedPowerZones)
      } else {
        calculatePowerZones()
      }

      // Load HR zones
      const { data: hrData } = await supabase
        .from("hr_zones")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("sport", selectedSport)
        .single()

      if (hrData) {
        setHrZoneModel(hrData.zone_model || "threshold")
        const loadedHRZones: HRZone[] = []
        for (let i = 1; i <= 5; i++) {
          loadedHRZones.push({
            name: hrData[`z${i}_name`] || DEFAULT_HR_ZONES[i - 1].name,
            percentMin: hrData[`z${i}_percent_lthr_min`] || DEFAULT_HR_ZONES[i - 1].percentMin,
            percentMax: hrData[`z${i}_percent_lthr_max`] || DEFAULT_HR_ZONES[i - 1].percentMax,
            hrMin: hrData[`z${i}_hr_min`] || 0,
            hrMax: hrData[`z${i}_hr_max`] || 0,
          })
        }
        setHrZones(loadedHRZones)
      } else {
        calculateHRZones()
      }
    } catch (error) {
      console.error("Error loading zones:", error)
      calculatePowerZones()
      calculateHRZones()
    } finally {
      setLoading(false)
    }
  }

  const calculatePowerZones = () => {
    const zones: PowerZone[] = DEFAULT_POWER_ZONES.map((zone) => ({
      ...zone,
      wattsMin: Math.round((zone.percentMin / 100) * ftp),
      wattsMax: zone.percentMax ? Math.round((zone.percentMax / 100) * ftp) : null,
    }))
    setPowerZones(zones)
  }

  const calculateHRZones = () => {
    const baseHR = hrZoneModel === "threshold" ? hrThreshold : hrMax
    const zones: HRZone[] = DEFAULT_HR_ZONES.map((zone) => ({
      ...zone,
      hrMin: Math.round((zone.percentMin / 100) * baseHR),
      hrMax: Math.round((zone.percentMax / 100) * baseHR),
    }))
    // Cap Z5 max at HRmax
    if (zones[4]) {
      zones[4].hrMax = hrMax
    }
    setHrZones(zones)
  }

  const updatePowerZone = (index: number, field: keyof PowerZone, value: number | string | null) => {
    const updated = [...powerZones]
    updated[index] = { ...updated[index], [field]: value }
    setPowerZones(updated)
    setCustomPowerZones(true)
  }

  const updateHRZone = (index: number, field: keyof HRZone, value: number | string) => {
    const updated = [...hrZones]
    updated[index] = { ...updated[index], [field]: value }
    setHrZones(updated)
    setCustomHRZones(true)
  }

  const saveZones = async () => {
    setSaving(true)
    setSaveStatus("idle")

    try {
      // Save power zones
      const powerZonesData: Record<string, any> = {
        athlete_id: athleteId,
        sport: selectedSport,
        ftp_watts: ftp,
      }

      powerZones.forEach((zone, i) => {
        const idx = i + 1
        powerZonesData[`z${idx}_name`] = zone.name
        powerZonesData[`z${idx}_watts_min`] = zone.wattsMin
        powerZonesData[`z${idx}_watts_max`] = zone.wattsMax
        powerZonesData[`z${idx}_percent_ftp_min`] = zone.percentMin
        powerZonesData[`z${idx}_percent_ftp_max`] = zone.percentMax
      })

      const { error: powerError } = await supabase
        .from("power_zones")
        .upsert(powerZonesData, { onConflict: "athlete_id,sport" })

      if (powerError) throw powerError

      // Save HR zones
      const hrZonesData: Record<string, any> = {
        athlete_id: athleteId,
        sport: selectedSport,
        zone_model: hrZoneModel,
      }

      hrZones.forEach((zone, i) => {
        const idx = i + 1
        hrZonesData[`z${idx}_name`] = zone.name
        hrZonesData[`z${idx}_hr_min`] = zone.hrMin
        hrZonesData[`z${idx}_hr_max`] = zone.hrMax
        hrZonesData[`z${idx}_percent_lthr_min`] = zone.percentMin
        hrZonesData[`z${idx}_percent_lthr_max`] = zone.percentMax
      })

      const { error: hrError } = await supabase.from("hr_zones").upsert(hrZonesData, { onConflict: "athlete_id,sport" })

      if (hrError) throw hrError

      // Update metabolic profile with FTP
      await supabase
        .from("metabolic_profiles")
        .update({ ftp_watts: ftp, updated_at: new Date().toISOString() })
        .eq("athlete_id", athleteId)
        .eq("is_current", true)

      setSaveStatus("success")
      onSave?.()
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving zones:", error)
      setSaveStatus("error")
    } finally {
      setSaving(false)
    }
  }

  const sportConfig = SPORTS.find((s) => s.id === selectedSport)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-fuchsia-500" />
              Zone di Allenamento
            </CardTitle>
            <CardDescription>
              {athleteName
                ? `Configura le zone per ${athleteName}`
                : "Configura le zone di potenza e frequenza cardiaca"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-4 w-4" />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {saveStatus === "success" && (
          <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Zone salvate con successo!
          </div>
        )}

        {saveStatus === "error" && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Errore nel salvataggio delle zone
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "power" | "hr")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="power" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Zone Potenza
            </TabsTrigger>
            <TabsTrigger value="hr" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Zone FC
            </TabsTrigger>
          </TabsList>

          {/* Power Zones Tab */}
          <TabsContent value="power" className="space-y-4 mt-4">
            {!sportConfig?.hasPower ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Le zone di potenza non sono disponibili per {sportConfig?.name}</p>
                <p className="text-sm">Usa le zone di frequenza cardiaca</p>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>FTP (Functional Threshold Power)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={ftp}
                        onChange={(e) => setFtp(Number.parseInt(e.target.value) || 0)}
                        className="w-32"
                      />
                      <span className="text-muted-foreground">watts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={customPowerZones} onCheckedChange={setCustomPowerZones} id="custom-power" />
                    <Label htmlFor="custom-power" className="text-sm">
                      Zone personalizzate
                    </Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomPowerZones(false)
                      calculatePowerZones()
                    }}
                  >
                    <Calculator className="h-4 w-4 mr-1" />
                    Ricalcola
                  </Button>
                </div>

                {/* Power Zones Visual Bar */}
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {powerZones.map((zone, idx) => (
                    <div
                      key={idx}
                      className={`${ZONE_COLORS[idx]} flex items-center justify-center text-white text-xs font-medium flex-1`}
                      title={`${zone.name}: ${zone.wattsMin}-${zone.wattsMax || "MAX"}W`}
                    >
                      Z{idx + 1}
                    </div>
                  ))}
                </div>

                {/* Power Zones Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-left">Zona</th>
                        <th className="p-2 text-center">% FTP</th>
                        <th className="p-2 text-center">Watts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {powerZones.map((zone, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${ZONE_COLORS[idx]}`} />
                              {customPowerZones ? (
                                <Input
                                  value={zone.name}
                                  onChange={(e) => updatePowerZone(idx, "name", e.target.value)}
                                  className="h-8 w-40"
                                />
                              ) : (
                                <span>{zone.name}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            {customPowerZones ? (
                              <div className="flex items-center justify-center gap-1">
                                <Input
                                  type="number"
                                  value={zone.percentMin}
                                  onChange={(e) =>
                                    updatePowerZone(idx, "percentMin", Number.parseInt(e.target.value) || 0)
                                  }
                                  className="h-8 w-16 text-center"
                                />
                                <span>-</span>
                                <Input
                                  type="number"
                                  value={zone.percentMax || ""}
                                  onChange={(e) =>
                                    updatePowerZone(
                                      idx,
                                      "percentMax",
                                      e.target.value ? Number.parseInt(e.target.value) : null,
                                    )
                                  }
                                  className="h-8 w-16 text-center"
                                  placeholder="MAX"
                                />
                              </div>
                            ) : (
                              <span>
                                {zone.percentMin}-{zone.percentMax || "MAX"}%
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center font-medium">
                            <Badge variant="secondary">
                              {zone.wattsMin}-{zone.wattsMax || "MAX"}W
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabsContent>

          {/* HR Zones Tab */}
          <TabsContent value="hr" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>FC Massima</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={hrMax}
                    onChange={(e) => setHrMax(Number.parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">bpm</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>FC Soglia (LTHR)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={hrThreshold}
                    onChange={(e) => setHrThreshold(Number.parseInt(e.target.value) || 0)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">bpm</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Modello Zone</Label>
                <Select value={hrZoneModel} onValueChange={(v) => setHrZoneModel(v as "threshold" | "max_hr")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="threshold">Basato su LTHR</SelectItem>
                    <SelectItem value="max_hr">Basato su FCmax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={customHRZones} onCheckedChange={setCustomHRZones} id="custom-hr" />
                <Label htmlFor="custom-hr" className="text-sm">
                  Zone personalizzate
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomHRZones(false)
                  calculateHRZones()
                }}
              >
                <Calculator className="h-4 w-4 mr-1" />
                Ricalcola
              </Button>
            </div>

            {/* HR Zones Visual Bar */}
            <div className="h-8 rounded-lg overflow-hidden flex">
              {hrZones.map((zone, idx) => (
                <div
                  key={idx}
                  className={`${ZONE_COLORS[idx]} flex items-center justify-center text-white text-xs font-medium flex-1`}
                  title={`${zone.name}: ${zone.hrMin}-${zone.hrMax} bpm`}
                >
                  Z{idx + 1}
                </div>
              ))}
            </div>

            {/* HR Zones Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left">Zona</th>
                    <th className="p-2 text-center">% {hrZoneModel === "threshold" ? "LTHR" : "FCmax"}</th>
                    <th className="p-2 text-center">FC (bpm)</th>
                  </tr>
                </thead>
                <tbody>
                  {hrZones.map((zone, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${ZONE_COLORS[idx]}`} />
                          {customHRZones ? (
                            <Input
                              value={zone.name}
                              onChange={(e) => updateHRZone(idx, "name", e.target.value)}
                              className="h-8 w-40"
                            />
                          ) : (
                            <span>{zone.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        {customHRZones ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              value={zone.percentMin}
                              onChange={(e) => updateHRZone(idx, "percentMin", Number.parseInt(e.target.value) || 0)}
                              className="h-8 w-16 text-center"
                            />
                            <span>-</span>
                            <Input
                              type="number"
                              value={zone.percentMax}
                              onChange={(e) => updateHRZone(idx, "percentMax", Number.parseInt(e.target.value) || 0)}
                              className="h-8 w-16 text-center"
                            />
                          </div>
                        ) : (
                          <span>
                            {zone.percentMin}-{zone.percentMax}%
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center font-medium">
                        <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                          {zone.hrMin}-{zone.hrMax} bpm
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={saveZones} disabled={saving} className="bg-fuchsia-600 hover:bg-fuchsia-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salva Zone
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
