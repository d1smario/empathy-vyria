"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Award,
  Users,
  Link,
  Check,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface OnboardingWizardCoachProps {
  user: SupabaseUser
  initialProfile: {
    full_name: string | null
    role: string
  } | null
}

const COACHING_SPORTS = [
  { value: "cycling", label: "Ciclismo", icon: "🚴" },
  { value: "running", label: "Running", icon: "🏃" },
  { value: "triathlon", label: "Triathlon", icon: "🏊" },
  { value: "swimming", label: "Nuoto", icon: "🏊‍♂️" },
  { value: "strength", label: "Forza & Conditioning", icon: "🏋️" },
  { value: "multisport", label: "Multisport", icon: "⚡" },
]

const CERTIFICATIONS = [
  "FCI (Federazione Ciclistica Italiana)",
  "FIDAL (Atletica Leggera)",
  "FIN (Nuoto)",
  "FITRI (Triathlon)",
  "NSCA-CSCS",
  "NASM-CPT",
  "ACE Personal Trainer",
  "TrainingPeaks Certified",
  "WKO Certified",
  "Altra certificazione",
]

const EXPERIENCE_LEVELS = [
  { value: "1-3", label: "1-3 anni" },
  { value: "3-5", label: "3-5 anni" },
  { value: "5-10", label: "5-10 anni" },
  { value: "10+", label: "10+ anni" },
]

const STEPS = [
  { id: "personal", title: "Dati Personali", icon: User },
  { id: "expertise", title: "Specializzazioni", icon: Award },
  { id: "athletes", title: "Gestione Atleti", icon: Users },
  { id: "connections", title: "Connessioni", icon: Link },
]

export function OnboardingWizardCoach({ user, initialProfile }: OnboardingWizardCoachProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    fullName: initialProfile?.full_name || "",
    phone: "",
    bio: "",
    primarySport: "cycling",
    secondarySports: [] as string[],
    certifications: [] as string[],
    otherCertification: "",
    experienceYears: "3-5",
    maxAthletes: "10",
    coachingPhilosophy: "",
    website: "",
    instagram: "",
    linkedIn: "",
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
      // Update user profile
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          onboarding_completed: true,
        })
        .eq("id", user.id)

      if (userError) throw userError

      // Create coach profile
      const allCertifications = formData.otherCertification 
        ? [...formData.certifications, formData.otherCertification]
        : formData.certifications

      const { error: coachError } = await supabase
        .from("coaches")
        .insert({
          user_id: user.id,
          phone: formData.phone || null,
          bio: formData.bio || null,
          primary_sport: formData.primarySport,
          secondary_sports: formData.secondarySports,
          certifications: allCertifications,
          experience_years: formData.experienceYears,
          max_athletes: parseInt(formData.maxAthletes) || 10,
          coaching_philosophy: formData.coachingPhilosophy || null,
          website: formData.website || null,
          social_links: {
            instagram: formData.instagram || null,
            linkedIn: formData.linkedIn || null,
          },
        })

      if (coachError) throw coachError

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
          <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-600/30">
            E
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">EMPATHY</h1>
            <p className="text-sm text-orange-400">Profilo Coach</p>
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
                  className={`flex flex-col items-center ${index <= currentStep ? "text-orange-400" : "text-gray-600"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-colors ${
                      index < currentStep
                        ? "bg-orange-600 text-white"
                        : index === currentStep
                          ? "bg-orange-600/20 border-2 border-orange-500 text-orange-400"
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
              {currentStep === 1 && "Le tue specializzazioni e certificazioni"}
              {currentStep === 2 && "Come gestisci i tuoi atleti"}
              {currentStep === 3 && "Collega i tuoi account per sincronizzare i dati"}
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

                <div className="space-y-2">
                  <Label className="text-gray-200">Telefono (opzionale)</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="+39 333 1234567"
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Bio / Presentazione</Label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => updateFormData("bio", e.target.value)}
                    placeholder="Descrivi brevemente la tua esperienza e background come coach..."
                    className="bg-gray-800/50 border-gray-600 text-white min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200">Sito web</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => updateFormData("website", e.target.value)}
                      placeholder="https://..."
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-200">Instagram</Label>
                    <Input
                      value={formData.instagram}
                      onChange={(e) => updateFormData("instagram", e.target.value)}
                      placeholder="@username"
                      className="bg-gray-800/50 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Expertise */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-200">Sport principale</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COACHING_SPORTS.map((sport) => (
                      <button
                        key={sport.value}
                        type="button"
                        onClick={() => updateFormData("primarySport", sport.value)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          formData.primarySport === sport.value
                            ? "border-orange-500 bg-orange-600/20"
                            : "border-gray-600 bg-gray-800/30 hover:border-gray-500"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{sport.icon}</span>
                        <span className="text-sm text-white">{sport.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Sport secondari (opzionale)</Label>
                  <div className="flex flex-wrap gap-2">
                    {COACHING_SPORTS.filter(s => s.value !== formData.primarySport).map((sport) => (
                      <Badge
                        key={sport.value}
                        variant={formData.secondarySports.includes(sport.value) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.secondarySports.includes(sport.value)
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "hover:bg-gray-700"
                        }`}
                        onClick={() => toggleArrayItem("secondarySports", sport.value)}
                      >
                        {sport.icon} {sport.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Anni di esperienza</Label>
                  <div className="flex gap-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <Badge
                        key={level.value}
                        variant={formData.experienceYears === level.value ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.experienceYears === level.value
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "hover:bg-gray-700"
                        }`}
                        onClick={() => updateFormData("experienceYears", level.value)}
                      >
                        {level.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-200">Certificazioni</Label>
                  <div className="flex flex-wrap gap-2">
                    {CERTIFICATIONS.map((cert) => (
                      <Badge
                        key={cert}
                        variant={formData.certifications.includes(cert) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors text-xs ${
                          formData.certifications.includes(cert)
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "hover:bg-gray-700"
                        }`}
                        onClick={() => toggleArrayItem("certifications", cert)}
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                  {formData.certifications.includes("Altra certificazione") && (
                    <Input
                      value={formData.otherCertification}
                      onChange={(e) => updateFormData("otherCertification", e.target.value)}
                      placeholder="Specifica la certificazione..."
                      className="bg-gray-800/50 border-gray-600 text-white mt-2"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Athletes Management */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-200">Numero massimo atleti da gestire</Label>
                  <Input
                    type="number"
                    value={formData.maxAthletes}
                    onChange={(e) => updateFormData("maxAthletes", e.target.value)}
                    placeholder="10"
                    className="bg-gray-800/50 border-gray-600 text-white w-32"
                  />
                  <p className="text-xs text-gray-500">Quanti atleti puoi seguire contemporaneamente?</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-200">Filosofia di coaching</Label>
                  <Textarea
                    value={formData.coachingPhilosophy}
                    onChange={(e) => updateFormData("coachingPhilosophy", e.target.value)}
                    placeholder="Descrivi il tuo approccio al coaching, i principi che segui, il tuo metodo di lavoro..."
                    className="bg-gray-800/50 border-gray-600 text-white min-h-[120px]"
                  />
                </div>

                <div className="p-4 bg-orange-900/20 border border-orange-600/30 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-400 mb-2">Funzionalita Coach</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Dashboard per gestire tutti i tuoi atleti</li>
                    <li>• Visualizza piani nutrizionali e di allenamento</li>
                    <li>• Monitora progressi e metriche in tempo reale</li>
                    <li>• Ricevi notifiche su eventi importanti degli atleti</li>
                    <li>• Comunica direttamente con gli atleti</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Connections */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <p className="text-gray-400">
                  Collega i tuoi account per sincronizzare automaticamente i dati degli atleti e i piani di allenamento.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                        TP
                      </div>
                      <div>
                        <p className="font-medium text-white">TrainingPeaks</p>
                        <p className="text-sm text-gray-400">Importa atleti e piani</p>
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
                        <p className="text-sm text-gray-400">Monitora atleti Garmin</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Presto disponibile
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                        S
                      </div>
                      <div>
                        <p className="font-medium text-white">Strava</p>
                        <p className="text-sm text-gray-400">Visualizza attivita atleti</p>
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
                <Button onClick={handleNext} className="bg-orange-600 hover:bg-orange-700">
                  Avanti <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
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
