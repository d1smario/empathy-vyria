"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Activity,
  Clock,
  Utensils,
  Link,
  Check,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface OnboardingWizardProps {
  user: SupabaseUser
  initialProfile: {
    full_name: string | null
    role: string
  } | null
}

const SPORTS = [
  { value: "cycling", label: "Ciclismo", icon: "🚴" },
  { value: "running", label: "Running", icon: "🏃" },
  { value: "triathlon", label: "Triathlon", icon: "🏊" },
  { value: "swimming", label: "Nuoto", icon: "🏊‍♂️" },
  { value: "gym", label: "Palestra", icon: "🏋️" },
  { value: "other", label: "Altro", icon: "⚡" },
]

const INTOLERANCES = [
  "Lattosio",
  "Glutine",
  "Frutta a guscio",
  "Uova",
  "Soia",
  "Pesce",
  "Crostacei",
  "Arachidi",
  "Sesamo",
  "Senape",
]

const DIETARY_PREFERENCES = ["Vegetariano", "Vegano", "Pescetariano", "Keto", "Paleo", "Mediterranea", "Nessuna"]

const STEPS = [
  { id: "personal", title: "Dati Personali", icon: User },
  { id: "physical", title: "Dati Fisici", icon: Activity },
  { id: "routine", title: "Routine Giornaliera", icon: Clock },
  { id: "dietary", title: "Alimentazione", icon: Utensils },
  { id: "connections", title: "Connessioni", icon: Link },
]

export function OnboardingWizard({ user, initialProfile }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    fullName: initialProfile?.full_name || "",
    birthDate: "",
    gender: "male" as "male" | "female" | "other",
    primarySport: "cycling",
    secondarySports: [] as string[],
    experienceYears: "",
    heightCm: "",
    weightKg: "",
    bodyFatPercent: "",
    wakeTime: "06:30",
    breakfastTime: "07:30",
    trainingTime: "09:00",
    lunchTime: "13:00",
    dinnerTime: "20:00",
    sleepTime: "23:00",
    intolerances: [] as string[],
    allergies: [] as string[],
    dietaryPreferences: [] as string[],
    dietaryNotes: "",
    ftpWatts: "",
    vo2max: "",
    maxHr: "",
  })

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleArrayItem = (field: string, item: string) => {
    const current = formData[field as keyof typeof formData] as string[]
    if (current.includes(item)) {
      updateFormData(
        field,
        current.filter((i) => i !== item),
      )
    } else {
      updateFormData(field, [...current, item])
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          onboarding_completed: true,
        })
        .eq("id", user.id)

      if (userError) throw userError

      const { data: athlete, error: athleteError } = await supabase
        .from("athletes")
        .insert({
          user_id: user.id,
          birth_date: formData.birthDate || null,
          gender: formData.gender,
          height_cm: formData.heightCm ? Number.parseFloat(formData.heightCm) : null,
          weight_kg: formData.weightKg ? Number.parseFloat(formData.weightKg) : null,
          body_fat_percent: formData.bodyFatPercent ? Number.parseFloat(formData.bodyFatPercent) : null,
          primary_sport: formData.primarySport,
          secondary_sports: formData.secondarySports,
          experience_years: formData.experienceYears ? Number.parseInt(formData.experienceYears) : null,
          wake_time: formData.wakeTime,
          breakfast_time: formData.breakfastTime,
          training_time: formData.trainingTime,
          lunch_time: formData.lunchTime,
          dinner_time: formData.dinnerTime,
          sleep_time: formData.sleepTime,
        })
        .select()
        .single()

      if (athleteError) throw athleteError

      const { error: constraintsError } = await supabase.from("athlete_constraints").insert({
        athlete_id: athlete.id,
        intolerances: formData.intolerances,
        allergies: formData.allergies,
        dietary_preferences: formData.dietaryPreferences,
      })

      if (constraintsError) throw constraintsError

      if (formData.ftpWatts || formData.vo2max) {
        const lbm =
          formData.weightKg && formData.bodyFatPercent
            ? Number.parseFloat(formData.weightKg) * (1 - Number.parseFloat(formData.bodyFatPercent) / 100)
            : null

        await supabase.from("metabolic_profiles").insert({
          athlete_id: athlete.id,
          ftp_watts: formData.ftpWatts ? Number.parseInt(formData.ftpWatts) : null,
          vo2max: formData.vo2max ? Number.parseFloat(formData.vo2max) : null,
          weight_kg: formData.weightKg ? Number.parseFloat(formData.weightKg) : null,
          body_fat_percent: formData.bodyFatPercent ? Number.parseFloat(formData.bodyFatPercent) : null,
          lean_body_mass_kg: lbm,
          test_type: "estimated",
          is_current: true,
        })
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore durante il salvataggio")
      setLoading(false)
    }
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 bg-fuchsia-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-fuchsia-600/30">
            E
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">EMPATHY</h1>
            <p className="text-sm text-gray-400">Configura il tuo profilo</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${index <= currentStep ? "text-fuchsia-400" : "text-gray-600"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      index < currentStep
                        ? "bg-fuchsia-600 text-white"
                        : index === currentStep
                          ? "bg-fuchsia-600/20 border-2 border-fuchsia-500 text-fuchsia-400"
                          : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {index < currentStep ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2 bg-gray-700" />
        </div>

        {/* Card */}
        <Card className="border-gray-700 bg-gray-900/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-white">{STEPS[currentStep].title}</CardTitle>
            <CardDescription className="text-gray-400">
              {currentStep === 0 && "Inserisci le tue informazioni personali"}
              {currentStep === 1 && "I tuoi dati fisici per calcoli metabolici precisi"}
              {currentStep === 2 && "La tua routine giornaliera per ottimizzare nutrizione e allenamento"}
              {currentStep === 3 && "Le tue preferenze e restrizioni alimentari"}
              {currentStep === 4 && "Collega i tuoi account per sincronizzare i dati"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Personal */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Nome completo</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => updateFormData("fullName", e.target.value)}
                    placeholder="Mario Rossi"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Data di nascita</Label>
                    <Input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateFormData("birthDate", e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-200">Anni di esperienza</Label>
                    <Input
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) => updateFormData("experienceYears", e.target.value)}
                      placeholder="5"
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Genere</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(v) => updateFormData("gender", v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="text-gray-300">
                        Maschio
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="text-gray-300">
                        Femmina
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="text-gray-300">
                        Altro
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Sport principale</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {SPORTS.map((sport) => (
                      <button
                        key={sport.value}
                        type="button"
                        onClick={() => updateFormData("primarySport", sport.value)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          formData.primarySport === sport.value
                            ? "border-fuchsia-500 bg-fuchsia-600/20"
                            : "border-gray-600 bg-gray-800/30 hover:border-gray-500"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{sport.icon}</span>
                        <span className="text-sm text-white">{sport.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Physical */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Altezza (cm)</Label>
                    <Input
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => updateFormData("heightCm", e.target.value)}
                      placeholder="175"
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-200">Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.weightKg}
                      onChange={(e) => updateFormData("weightKg", e.target.value)}
                      placeholder="74"
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Massa grassa (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.bodyFatPercent}
                    onChange={(e) => updateFormData("bodyFatPercent", e.target.value)}
                    placeholder="18"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                  <p className="text-xs text-gray-500">Opzionale - se non conosci il valore esatto, lascia vuoto</p>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Dati performance (opzionali)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">FTP (watt)</Label>
                      <Input
                        type="number"
                        value={formData.ftpWatts}
                        onChange={(e) => updateFormData("ftpWatts", e.target.value)}
                        placeholder="250"
                        className="bg-gray-800/50 border-gray-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-200">VO2max</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.vo2max}
                        onChange={(e) => updateFormData("vo2max", e.target.value)}
                        placeholder="55"
                        className="bg-gray-800/50 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Routine */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Sveglia</Label>
                    <Input
                      type="time"
                      value={formData.wakeTime}
                      onChange={(e) => updateFormData("wakeTime", e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-200">Colazione</Label>
                    <Input
                      type="time"
                      value={formData.breakfastTime}
                      onChange={(e) => updateFormData("breakfastTime", e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Orario allenamento abituale</Label>
                  <Input
                    type="time"
                    value={formData.trainingTime}
                    onChange={(e) => updateFormData("trainingTime", e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Pranzo</Label>
                    <Input
                      type="time"
                      value={formData.lunchTime}
                      onChange={(e) => updateFormData("lunchTime", e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-200">Cena</Label>
                    <Input
                      type="time"
                      value={formData.dinnerTime}
                      onChange={(e) => updateFormData("dinnerTime", e.target.value)}
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Orario sonno</Label>
                  <Input
                    type="time"
                    value={formData.sleepTime}
                    onChange={(e) => updateFormData("sleepTime", e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Dietary */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-gray-200">Intolleranze</Label>
                  <div className="flex flex-wrap gap-2">
                    {INTOLERANCES.map((item) => (
                      <Badge
                        key={item}
                        variant={formData.intolerances.includes(item) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.intolerances.includes(item)
                            ? "bg-fuchsia-600 hover:bg-fuchsia-700"
                            : "hover:bg-gray-700"
                        }`}
                        onClick={() => toggleArrayItem("intolerances", item)}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-200">Preferenze dietetiche</Label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_PREFERENCES.map((item) => (
                      <Badge
                        key={item}
                        variant={formData.dietaryPreferences.includes(item) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.dietaryPreferences.includes(item)
                            ? "bg-fuchsia-600 hover:bg-fuchsia-700"
                            : "hover:bg-gray-700"
                        }`}
                        onClick={() => toggleArrayItem("dietaryPreferences", item)}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Allergie (scrivi separate da virgola)</Label>
                  <Input
                    placeholder="es. Arachidi, Frutta secca"
                    className="bg-gray-800/50 border-gray-600 text-white"
                    onChange={(e) =>
                      updateFormData(
                        "allergies",
                        e.target.value
                          .split(",")
                          .map((a) => a.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 5: Connections */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-gray-400">
                  Collega i tuoi account per importare automaticamente i dati di allenamento e performance.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                        S
                      </div>
                      <div>
                        <p className="font-medium text-white">Strava</p>
                        <p className="text-sm text-gray-400">Attività e potenza</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Presto disponibile
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                        G
                      </div>
                      <div>
                        <p className="font-medium text-white">Garmin Connect</p>
                        <p className="text-sm text-gray-400">HRV, sonno, stress</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Presto disponibile
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                        TP
                      </div>
                      <div>
                        <p className="font-medium text-white">TrainingPeaks</p>
                        <p className="text-sm text-gray-400">Piani allenamento</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Presto disponibile
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  Puoi collegare questi account successivamente dalla pagina Impostazioni.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="border-gray-600 hover:bg-gray-800 bg-transparent"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Indietro
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                  Avanti <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Completa
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
