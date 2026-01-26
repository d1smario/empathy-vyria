"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, Scale, Utensils, AlertTriangle, Heart } from "lucide-react"

interface AthleteProfileProps {
  athleteData?: {
    id: string
    user_id: string
    birth_date: string | null
    gender: string | null
    height_cm: number | null
    weight_kg: number | null
    body_fat_percent: number | null
    lean_body_mass_kg: number | null
    primary_sport: string | null
    wake_time: string | null
    breakfast_time: string | null
    training_time: string | null
    lunch_time: string | null
    dinner_time: string | null
    sleep_time: string | null
    athlete_constraints: Array<{
      intolerances: string[] | null
      allergies: string[] | null
      dietary_limits: string[] | null
      dietary_preferences: string[] | null
    }> | null
    metabolic_profiles: Array<{
      ftp_watts: number | null
      vo2max: number | null
      vlamax: number | null
      is_current: boolean
    }> | null
  } | null
  userName?: string | null
}

export const AthleteProfile = ({ athleteData, userName }: AthleteProfileProps) => {
  // Calculate age from birth_date
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Get current metabolic profile
  const currentProfile =
    athleteData?.metabolic_profiles?.find((p) => p.is_current) || athleteData?.metabolic_profiles?.[0]

  // Get constraints
  const constraints = athleteData?.athlete_constraints?.[0]

  const age = calculateAge(athleteData?.birth_date || null)

  const stats = [
    { label: "Età", value: age ? `${age} anni` : "-", icon: Clock },
    { label: "Peso", value: athleteData?.weight_kg ? `${athleteData.weight_kg} kg` : "-", icon: Scale },
    {
      label: "Massa Grassa",
      value: athleteData?.body_fat_percent ? `${athleteData.body_fat_percent}%` : "-",
      icon: Activity,
    },
    {
      label: "LBM",
      value: athleteData?.lean_body_mass_kg ? `${athleteData.lean_body_mass_kg} kg` : "-",
      icon: Activity,
    },
    { label: "VO2max", value: currentProfile?.vo2max || "-", icon: Heart },
    { label: "FTP", value: currentProfile?.ftp_watts ? `${currentProfile.ftp_watts} W` : "-", icon: Activity },
  ]

  const formatTime = (time: string | null) => {
    if (!time) return "-"
    return time.slice(0, 5) // HH:MM
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{userName || "Atleta"}</h1>
        <p className="text-muted-foreground">Profilo Performance & Configurazione BioMAP</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <stat.icon className="h-8 w-8 text-fuchsia-500 mb-2 opacity-80" />
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Routine Giornaliera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Sveglia</span>
                <span className="font-medium">{formatTime(athleteData?.wake_time || null)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Colazione</span>
                <span className="font-medium">{formatTime(athleteData?.breakfast_time || null)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Allenamento</span>
                <span className="font-medium">{formatTime(athleteData?.training_time || null)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Pranzo</span>
                <span className="font-medium">{formatTime(athleteData?.lunch_time || null)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Cena</span>
                <span className="font-medium">{formatTime(athleteData?.dinner_time || null)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Sonno</span>
                <span className="font-medium">{formatTime(athleteData?.sleep_time || null)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Profilo Alimentare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Restrizioni
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-red-950/20 p-2 rounded border border-red-900">
                  <span className="block text-xs text-red-400 font-semibold">Intolleranze</span>
                  <span>{constraints?.intolerances?.join(", ") || "Nessuna"}</span>
                </div>
                <div className="bg-orange-950/20 p-2 rounded border border-orange-900">
                  <span className="block text-xs text-orange-400 font-semibold">Limiti</span>
                  <span>{constraints?.dietary_limits?.join(", ") || "Nessuno"}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Preferenze</h4>
              <div className="text-sm">
                <span className="block text-xs text-muted-foreground">Preferenze Dietetiche</span>
                <span className="font-medium">{constraints?.dietary_preferences?.join(", ") || "Non specificate"}</span>
              </div>
            </div>

            {constraints?.allergies && constraints.allergies.length > 0 && (
              <div className="bg-red-950/30 p-3 rounded border border-red-800">
                <h4 className="text-sm font-semibold mb-1 text-red-400">Allergie</h4>
                <span className="text-sm">{constraints.allergies.join(", ")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
