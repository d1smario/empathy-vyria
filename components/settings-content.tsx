"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  User,
  Link,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  RefreshCw,
  Apple,
  Calendar,
  Download,
  CalendarDays,
  Pill,
  Beaker,
  Plus,
  X,
  Zap,
} from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface ExternalAccount {
  id: string
  provider: string
  provider_user_id: string
  last_sync_at: string | null
  sync_enabled: boolean
}

interface AthleteData {
  id: string
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
}

interface AthleteConstraints {
  id?: string
  intolerances: string[]
  allergies: string[]
  dietary_limits: string[]
  dietary_preferences: string[]
  notes?: string | null // Added for fallback storage
}

interface Supplement {
  id: string
  name: string
  dosage: string
  frequency: string
  timing: string
  notes?: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribedBy?: string
  notes?: string
}

// Added Sport Supplement types
const SPORT_SUPPLEMENT_BRANDS = [
  "Enervit",
  "SIS",
  "+Watt",
  "Ethic Sport",
  "4Endurance",
  "ESN",
  "MuscleTech",
  "Isostar",
  "PowerBar",
  "Maurten",
  "226ERS",
  "NamedSport",
  "MyProtein",
  "Prozis",
  "Bulk",
  "MNSTRY",
  // New brands added
  "Precision Hydration",
  "HIGH5",
  "Nduranz",
  "TORQ",
  "Hammer Nutrition",
  "Tailwind",
  "Skratch Labs",
]

const SPORT_SUPPLEMENT_TYPES = [
  { id: "gel", label: "Gel Energetici", category: "intra" },
  { id: "maltodestrine", label: "Maltodestrine", category: "intra" },
  { id: "carbo_powder", label: "Carbo in Polvere", category: "intra" },
  { id: "fruttosio", label: "Fruttosio", category: "intra" },
  { id: "electrolytes", label: "Elettroliti", category: "intra" },
  { id: "whey", label: "Whey Protein", category: "post" },
  { id: "bcaa", label: "BCAA", category: "intra" },
  { id: "eaa", label: "EAA", category: "intra" },
  { id: "creatina", label: "Creatina", category: "pre" },
  { id: "beta_alanina", label: "Beta Alanina", category: "pre" },
  { id: "recovery", label: "Recovery Drink", category: "post" },
  { id: "pre_workout", label: "Pre-Workout", category: "pre" },
  { id: "bhb", label: "BHB (Chetoni)", category: "pre" },
  { id: "mct", label: "MCT Oil", category: "pre" },
  { id: "caffeina", label: "Caffeina", category: "pre" },
  { id: "barrette", label: "Barrette Energetiche", category: "intra" },
]

interface SettingsContentProps {
  user: SupabaseUser
  profile: {
    id: string
    full_name: string | null
    email: string
    role: string
  } | null
  externalAccounts: ExternalAccount[]
  athleteData?: AthleteData | null
  athleteConstraints?: AthleteConstraints | null
}

const INTOLERANCES = ["Lattosio", "Glutine", "Fruttosio", "Nichel", "Istamina"]
const ALLERGIES = ["Arachidi", "Frutta a guscio", "Uova", "Latte", "Pesce", "Crostacei", "Soia", "Grano", "Sesamo"]
const DIETARY_PREFERENCES = ["Vegetariano", "Vegano", "Pescetariano", "Keto", "Paleo", "Low-carb", "High-carb"]
const DIETARY_LIMITS = ["Senza zucchero", "Basso sodio", "Senza caffeina", "Senza alcol"]

const INTEGRATIONS = [
  {
    id: "strava",
    name: "Strava",
    icon: "🟠",
    description: "Sincronizza attivita, potenza, GPS",
    available: true,
    connectUrl: "/api/integrations/strava/connect",
  },
  {
    id: "garmin",
    name: "Garmin Connect",
    icon: "🔵",
    description: "HRV, sonno, stress, recupero",
    available: false,
    connectUrl: null,
  },
  {
    id: "trainingpeaks",
    name: "TrainingPeaks",
    icon: "🟣",
    description: "Piani allenamento, TSS, CTL/ATL",
    available: false,
    connectUrl: null,
  },
  {
    id: "whoop",
    name: "Whoop",
    icon: "⚫",
    description: "Recovery, strain, sonno",
    available: false,
    connectUrl: null,
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: "⚪",
    description: "Sonno, readiness, attivita",
    available: false,
    connectUrl: null,
  },
]

export function SettingsContent({
  user,
  profile,
  externalAccounts,
  athleteData,
  athleteConstraints,
}: SettingsContentProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [birthDate, setBirthDate] = useState(athleteData?.birth_date || "")
  const [intolerances, setIntolerances] = useState<string[]>(athleteConstraints?.intolerances || [])
  const [allergies, setAllergies] = useState<string[]>(athleteConstraints?.allergies || [])
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(athleteConstraints?.dietary_preferences || [])
  const [dietaryLimits, setDietaryLimits] = useState<string[]>(athleteConstraints?.dietary_limits || [])

  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success?: boolean
    activitiesCount?: number
    powerActivities?: number
    bestPowers?: { [key: string]: number }
    error?: string
  } | null>(null)

  const [supplements, setSupplements] = useState<Supplement[]>([
    { id: "1", name: "Vitamina D3", dosage: "2000 UI", frequency: "Giornaliera", timing: "Mattina" },
    { id: "2", name: "Omega-3", dosage: "1000mg", frequency: "Giornaliera", timing: "Pranzo" },
    { id: "3", name: "Magnesio", dosage: "400mg", frequency: "Giornaliera", timing: "Sera" },
  ])
  const [medications, setMedications] = useState<Medication[]>([])
  const [newSupplement, setNewSupplement] = useState({
    name: "",
    dosage: "",
    frequency: "Giornaliera",
    timing: "Mattina",
  })
  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "Giornaliera",
    prescribedBy: "",
  })
  const [showAddSupplement, setShowAddSupplement] = useState(false)
  const [showAddMedication, setShowAddMedication] = useState(false)

  const [preferredRestDays, setPreferredRestDays] = useState<number[]>([0, 4]) // Mon=0, Fri=4
  const [preferredTrainingTime, setPreferredTrainingTime] = useState("Mattina presto (6-8)")
  const [coachNotes, setCoachNotes] = useState("")
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)
  const [loadingPreferences, setLoadingPreferences] = useState(true)

  const [sportSupplementBrands, setSportSupplementBrands] = useState<string[]>([])
  const [sportSupplementTypes, setSportSupplementTypes] = useState<string[]>([])
  const [savingSportSupplements, setSavingSportSupplements] = useState(false)
  const [sportSupplementsSuccess, setSportSupplementsSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const success = searchParams.get("success")
  const error = searchParams.get("error")

  const toggleItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item))
    } else {
      setArray([...array, item])
    }
  }

  const toggleRestDay = (dayIndex: number) => {
    if (preferredRestDays.includes(dayIndex)) {
      setPreferredRestDays(preferredRestDays.filter((d) => d !== dayIndex))
    } else {
      setPreferredRestDays([...preferredRestDays, dayIndex])
    }
  }

  // Load training preferences from database
  useEffect(() => {
    const loadTrainingPreferences = async () => {
      if (!athleteData?.id) {
        setLoadingPreferences(false)
        return
      }

      try {
        // Try to load from annual_training_plans first
        const { data: plan } = await supabase
          .from("annual_training_plans")
          .select("preferred_rest_days, config_json")
          .eq("athlete_id", athleteData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (plan) {
          // Load from config_json first, then preferred_rest_days as fallback
          const configPrefs = plan.config_json?.training_preferences

          if (configPrefs) {
            // Convert day names back to indices
            const dayNameToIndex: Record<string, number> = {
              Mon: 0,
              Tue: 1,
              Wed: 2,
              Thu: 3,
              Fri: 4,
              Sat: 5,
              Sun: 6,
              Lun: 0,
              Mar: 1,
              Mer: 2,
              Gio: 3,
              Ven: 4,
              Sab: 5,
              Dom: 6,
            }

            if (configPrefs.preferred_rest_days && Array.isArray(configPrefs.preferred_rest_days)) {
              const dayIndices = configPrefs.preferred_rest_days
                .map((d: string) => dayNameToIndex[d])
                .filter((i: number | undefined) => i !== undefined)
              if (dayIndices.length > 0) {
                setPreferredRestDays(dayIndices)
              }
            }

            if (configPrefs.preferred_training_time) {
              setPreferredTrainingTime(configPrefs.preferred_training_time)
            }

            if (configPrefs.coach_notes) {
              setCoachNotes(configPrefs.coach_notes)
            }
          } else if (plan.preferred_rest_days && Array.isArray(plan.preferred_rest_days)) {
            // Fallback to preferred_rest_days column
            const dayNameToIndex: Record<string, number> = {
              Mon: 0,
              Tue: 1,
              Wed: 2,
              Thu: 3,
              Fri: 4,
              Sat: 5,
              Sun: 6,
            }
            const dayIndices = plan.preferred_rest_days
              .map((d: string) => dayNameToIndex[d])
              .filter((i: number | undefined) => i !== undefined)
            if (dayIndices.length > 0) {
              setPreferredRestDays(dayIndices)
            }
          }
        } else {
          // Try loading from athlete_constraints as last fallback
          const { data: constraints } = await supabase
            .from("athlete_constraints")
            .select("notes")
            .eq("athlete_id", athleteData.id)
            .single()

          if (constraints?.notes) {
            try {
              const parsedNotes = JSON.parse(constraints.notes)
              if (parsedNotes.training_preferences) {
                const prefs = parsedNotes.training_preferences
                const dayNameToIndex: Record<string, number> = {
                  Mon: 0,
                  Tue: 1,
                  Wed: 2,
                  Thu: 3,
                  Fri: 4,
                  Sat: 5,
                  Sun: 6,
                }
                if (prefs.preferred_rest_days) {
                  const dayIndices = prefs.preferred_rest_days
                    .map((d: string) => dayNameToIndex[d])
                    .filter((i: number | undefined) => i !== undefined)
                  if (dayIndices.length > 0) {
                    setPreferredRestDays(dayIndices)
                  }
                }
                if (prefs.preferred_training_time) {
                  setPreferredTrainingTime(prefs.preferred_training_time)
                }
                if (prefs.coach_notes) {
                  setCoachNotes(prefs.coach_notes)
                }
              }
            } catch (e) {
              console.error("Error parsing athlete constraints notes:", e)
            }
          }
        }
      } catch (err) {
        console.error("Error loading training preferences:", err)
      } finally {
        setLoadingPreferences(false)
      }
    }

    loadTrainingPreferences()
  }, [athleteData?.id])

  useEffect(() => {
    const loadSportSupplements = async () => {
      if (!athleteData?.id) return

      try {
        const { data: constraints } = await supabase
          .from("athlete_constraints")
          .select("notes")
          .eq("athlete_id", athleteData.id)
          .single()

        if (constraints?.notes) {
          try {
            const parsedNotes = JSON.parse(constraints.notes)
            if (parsedNotes.sport_supplements) {
              setSportSupplementBrands(parsedNotes.sport_supplements.brands || [])
              setSportSupplementTypes(parsedNotes.sport_supplements.types || [])
            }
          } catch (e) {
            console.error("Error parsing sport supplements:", e)
          }
        }
      } catch (err) {
        console.error("Error loading sport supplements:", err)
      }
    }

    loadSportSupplements()
  }, [athleteData?.id])

  // Save training preferences to database
  const handleSaveTrainingPreferences = async () => {
    setSavingPreferences(true)
    setPreferencesSuccess(false)

    try {
      if (athleteData?.id) {
        // Map day indices to day names for database
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        const restDayNames = preferredRestDays.map((i) => dayNames[i])

        // Check if there's an existing annual plan to update
        const { data: existingPlan } = await supabase
          .from("annual_training_plans")
          .select("id, config_json")
          .eq("athlete_id", athleteData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (existingPlan) {
          // Update existing plan with preferences
          const updatedConfig = {
            ...(existingPlan.config_json || {}),
            training_preferences: {
              preferred_rest_days: restDayNames,
              preferred_training_time: preferredTrainingTime,
              coach_notes: coachNotes,
            },
          }

          await supabase
            .from("annual_training_plans")
            .update({
              // preferred_rest_days: restDayNames, // This field might not exist directly in annual_training_plans, use config_json
              config_json: updatedConfig,
            })
            .eq("id", existingPlan.id)
        } else {
          // Store in athlete_constraints as fallback if no annual plan exists
          const { data: constraints } = await supabase
            .from("athlete_constraints")
            .select("id, notes")
            .eq("athlete_id", athleteData.id)
            .single()

          if (constraints) {
            // Parse existing notes to merge new preferences
            let existingNotes = {}
            if (constraints.notes) {
              try {
                existingNotes = JSON.parse(constraints.notes)
              } catch (e) {
                console.error("Error parsing existing notes:", e)
                existingNotes = {} // Reset if parsing fails
              }
            }

            const updatedNotes = {
              ...existingNotes,
              training_preferences: {
                preferred_rest_days: restDayNames,
                preferred_training_time: preferredTrainingTime,
                coach_notes: coachNotes,
              },
            }

            await supabase
              .from("athlete_constraints")
              .update({
                notes: JSON.stringify(updatedNotes),
              })
              .eq("id", constraints.id)
          } else {
            // If no constraints exist, create a new one (or handle as appropriate)
            // This part might need adjustment based on how athlete_constraints are managed
            console.warn("No athlete_constraints found to store fallback training preferences.")
          }
        }

        setPreferencesSuccess(true)
        setTimeout(() => setPreferencesSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Error saving training preferences:", err)
    }

    setSavingPreferences(false)
  }

  const handleSaveSportSupplements = async () => {
    setSavingSportSupplements(true)
    setSportSupplementsSuccess(false)

    try {
      if (athleteData?.id) {
        const sportSupplementsData = {
          brands: sportSupplementBrands,
          types: sportSupplementTypes,
        }

        // 1. Save to athlete_constraints.notes (primary storage)
        const { data: constraints } = await supabase
          .from("athlete_constraints")
          .select("id, notes")
          .eq("athlete_id", athleteData.id)
          .single()

        let existingNotes = {}
        if (constraints?.notes) {
          try {
            existingNotes = JSON.parse(constraints.notes)
          } catch (e) {
            existingNotes = {}
          }
        }

        const updatedNotes = {
          ...existingNotes,
          sport_supplements: sportSupplementsData,
        }

        if (constraints?.id) {
          await supabase
            .from("athlete_constraints")
            .update({ notes: JSON.stringify(updatedNotes) })
            .eq("id", constraints.id)
        } else {
          await supabase.from("athlete_constraints").insert({
            athlete_id: athleteData.id,
            intolerances: [],
            allergies: [],
            dietary_preferences: [],
            dietary_limits: [],
            notes: JSON.stringify(updatedNotes),
          })
        }

        // 2. Also save to annual_training_plans.config_json for nutrition-plan component
        const { data: existingPlan } = await supabase
          .from("annual_training_plans")
          .select("id, config_json")
          .eq("athlete_id", athleteData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (existingPlan) {
          const updatedConfig = {
            ...(existingPlan.config_json || {}),
            sport_supplements: sportSupplementsData,
          }

          await supabase
            .from("annual_training_plans")
            .update({ config_json: updatedConfig })
            .eq("id", existingPlan.id)
          
          console.log("[v0] Sport supplements saved to annual_training_plans:", sportSupplementsData)
        }

        setSportSupplementsSuccess(true)
        setTimeout(() => setSportSupplementsSuccess(false), 3000)
      }
    } catch (err) {
      console.error("Error saving sport supplements:", err)
    }

    setSavingSportSupplements(false)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      // Update users table
      await supabase.from("users").update({ full_name: fullName }).eq("id", user.id)

      // Update athletes table with birth_date
      if (athleteData?.id) {
        await supabase
          .from("athletes")
          .update({
            birth_date: birthDate || null,
          })
          .eq("id", athleteData.id)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving profile:", err)
    }

    setSaving(false)
  }

  const handleSaveDietary = async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      if (athleteData?.id) {
        if (athleteConstraints?.id) {
          // Update existing constraints
          await supabase
            .from("athlete_constraints")
            .update({
              intolerances,
              allergies,
              dietary_preferences: dietaryPreferences,
              dietary_limits: dietaryLimits,
            })
            .eq("id", athleteConstraints.id)
        } else {
          // Create new constraints
          await supabase.from("athlete_constraints").insert({
            athlete_id: athleteData.id,
            intolerances,
            allergies,
            dietary_preferences: dietaryPreferences,
            dietary_limits: dietaryLimits,
          })
        }
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      router.refresh()
    } catch (err) {
      console.error("Error saving dietary info:", err)
    }

    setSaving(false)
  }

  const handleAddSupplement = () => {
    if (newSupplement.name && newSupplement.dosage) {
      setSupplements([...supplements, { ...newSupplement, id: Date.now().toString() }])
      setNewSupplement({ name: "", dosage: "", frequency: "Giornaliera", timing: "Mattina" })
      setShowAddSupplement(false)
    }
  }

  const handleRemoveSupplement = (id: string) => {
    setSupplements(supplements.filter((s) => s.id !== id))
  }

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setMedications([...medications, { ...newMedication, id: Date.now().toString() }])
      setNewMedication({ name: "", dosage: "", frequency: "Giornaliera", prescribedBy: "" })
      setShowAddMedication(false)
    }
  }

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((m) => m.id !== id))
  }

  const handleDisconnect = async (accountId: string) => {
    await supabase.from("external_accounts").delete().eq("id", accountId)
    router.refresh()
  }

  const handleStravaImport = async () => {
    setImporting(true)
    setImportResult(null)

    try {
      const response = await fetch("/api/integrations/strava/import", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setImportResult({
          success: true,
          activitiesCount: data.activitiesCount,
          powerActivities: data.powerActivities,
          bestPowers: data.bestPowers,
        })
      } else {
        setImportResult({ error: data.error })
      }
    } catch (err) {
      setImportResult({ error: "Errore di connessione" })
    }

    setImporting(false)
  }

  const getConnectedAccount = (provider: string) => {
    return externalAccounts.find((acc) => acc.provider === provider)
  }

  // Toggle functions for sport supplement brands and types
  const toggleSportBrand = (brand: string) => {
    if (sportSupplementBrands.includes(brand)) {
      setSportSupplementBrands(sportSupplementBrands.filter((b) => b !== brand))
    } else {
      setSportSupplementBrands([...sportSupplementBrands, brand])
    }
  }

  const toggleSportType = (type: string) => {
    if (sportSupplementTypes.includes(type)) {
      setSportSupplementTypes(sportSupplementTypes.filter((t) => t !== type))
    } else {
      setSportSupplementTypes([...sportSupplementTypes, type])
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 md:px-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="text-muted-foreground hover:text-foreground bg-transparent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Impostazioni</h1>
            <p className="text-muted-foreground">Gestisci il tuo profilo e le integrazioni</p>
          </div>
        </div>

        {/* Alerts */}
        {success === "strava_connected" && (
          <Alert className="mb-6 bg-green-900/50 border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-200">Strava collegato con successo!</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Errore durante la connessione. Riprova.</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="profile" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <User className="h-4 w-4 mr-2" />
              Profilo
            </TabsTrigger>
            <TabsTrigger value="dietary" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Apple className="h-4 w-4 mr-2" />
              Alimentazione
            </TabsTrigger>
            <TabsTrigger value="planning" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <CalendarDays className="h-4 w-4 mr-2" />
              Pianificazione
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white"
            >
              <Link className="h-4 w-4 mr-2" />
              Integrazioni
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Sicurezza
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Informazioni Profilo</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Aggiorna le tue informazioni personali
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <Input value={user.email || ""} disabled className="bg-muted border-border text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">L'email non puo essere modificata</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Nome completo</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-muted border-border text-foreground"
                    placeholder="Mario Rossi"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data di nascita
                  </Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="bg-muted border-border text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Altezza (cm)</Label>
                    <Input
                      value={athleteData?.height_cm || ""}
                      disabled
                      className="bg-muted border-border text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Peso (kg)</Label>
                    <Input
                      value={athleteData?.weight_kg || ""}
                      disabled
                      className="bg-muted border-border text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Ruolo</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-fuchsia-500 text-fuchsia-400 capitalize">
                      {profile?.role}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvataggio...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Salvato!
                      </>
                    ) : (
                      "Salva modifiche"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dietary">
            <div className="space-y-6">
              {/* Preferenze Alimentari Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Apple className="h-5 w-5 text-fuchsia-500" />
                    Preferenze Alimentari
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Indica le tue intolleranze, allergie e preferenze per una nutrizione personalizzata
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Intolleranze */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Intolleranze</Label>
                    <div className="flex flex-wrap gap-2">
                      {INTOLERANCES.map((item) => (
                        <Badge
                          key={item}
                          variant={intolerances.includes(item) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            intolerances.includes(item)
                              ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                              : "border-border text-muted-foreground hover:border-fuchsia-500 hover:text-fuchsia-400"
                          }`}
                          onClick={() => toggleItem(intolerances, setIntolerances, item)}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Allergie */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Allergie</Label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGIES.map((item) => (
                        <Badge
                          key={item}
                          variant={allergies.includes(item) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            allergies.includes(item)
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "border-border text-muted-foreground hover:border-red-500 hover:text-red-400"
                          }`}
                          onClick={() => toggleItem(allergies, setAllergies, item)}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Preferenze dietetiche */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Preferenze dietetiche</Label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_PREFERENCES.map((item) => (
                        <Badge
                          key={item}
                          variant={dietaryPreferences.includes(item) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            dietaryPreferences.includes(item)
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "border-border text-muted-foreground hover:border-green-500 hover:text-green-400"
                          }`}
                          onClick={() => toggleItem(dietaryPreferences, setDietaryPreferences, item)}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Limitazioni */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Limitazioni</Label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_LIMITS.map((item) => (
                        <Badge
                          key={item}
                          variant={dietaryLimits.includes(item) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            dietaryLimits.includes(item)
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "border-border text-muted-foreground hover:border-amber-500 hover:text-amber-400"
                          }`}
                          onClick={() => toggleItem(dietaryLimits, setDietaryLimits, item)}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {(intolerances.length > 0 ||
                    allergies.length > 0 ||
                    dietaryPreferences.length > 0 ||
                    dietaryLimits.length > 0) && (
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <h4 className="text-sm font-medium text-foreground mb-2">Riepilogo selezioni</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {intolerances.length > 0 && (
                          <p>
                            <span className="text-fuchsia-400">Intolleranze:</span> {intolerances.join(", ")}
                          </p>
                        )}
                        {allergies.length > 0 && (
                          <p>
                            <span className="text-red-400">Allergie:</span> {allergies.join(", ")}
                          </p>
                        )}
                        {dietaryPreferences.length > 0 && (
                          <p>
                            <span className="text-green-400">Preferenze:</span> {dietaryPreferences.join(", ")}
                          </p>
                        )}
                        {dietaryLimits.length > 0 && (
                          <p>
                            <span className="text-amber-400">Limitazioni:</span> {dietaryLimits.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveDietary}
                      disabled={saving}
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Salvato!
                        </>
                      ) : (
                        "Salva preferenze alimentari"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-500" />
                    Integratori Sport
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Seleziona le marche e i tipi di integratori che usi per generare nutrizione intra/pre/post workout
                    personalizzata
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Marche preferite */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Marche Preferite</Label>
                    <p className="text-xs text-muted-foreground">
                      Seleziona le marche di integratori che utilizzi abitualmente
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_SUPPLEMENT_BRANDS.map((brand) => (
                        <Badge
                          key={brand}
                          variant={sportSupplementBrands.includes(brand) ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            sportSupplementBrands.includes(brand)
                              ? "bg-orange-600 text-white hover:bg-orange-700"
                              : "border-border text-muted-foreground hover:border-orange-500 hover:text-orange-400"
                          }`}
                          onClick={() => toggleSportBrand(brand)}
                        >
                          {brand}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tipi di prodotti */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium">Tipi di Prodotti</Label>
                    <p className="text-xs text-muted-foreground">Seleziona i tipi di integratori che hai disponibili</p>

                    {/* Pre-Workout */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">Pre-Workout</span>
                      <div className="flex flex-wrap gap-2">
                        {SPORT_SUPPLEMENT_TYPES.filter((t) => t.category === "pre").map((type) => (
                          <Badge
                            key={type.id}
                            variant={sportSupplementTypes.includes(type.id) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              sportSupplementTypes.includes(type.id)
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "border-border text-muted-foreground hover:border-blue-500 hover:text-blue-400"
                            }`}
                            onClick={() => toggleSportType(type.id)}
                          >
                            {type.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Intra-Workout */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Intra-Workout</span>
                      <div className="flex flex-wrap gap-2">
                        {SPORT_SUPPLEMENT_TYPES.filter((t) => t.category === "intra").map((type) => (
                          <Badge
                            key={type.id}
                            variant={sportSupplementTypes.includes(type.id) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              sportSupplementTypes.includes(type.id)
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "border-border text-muted-foreground hover:border-green-500 hover:text-green-400"
                            }`}
                            onClick={() => toggleSportType(type.id)}
                          >
                            {type.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Post-Workout */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">Post-Workout</span>
                      <div className="flex flex-wrap gap-2">
                        {SPORT_SUPPLEMENT_TYPES.filter((t) => t.category === "post").map((type) => (
                          <Badge
                            key={type.id}
                            variant={sportSupplementTypes.includes(type.id) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              sportSupplementTypes.includes(type.id)
                                ? "bg-purple-600 text-white hover:bg-purple-700"
                                : "border-border text-muted-foreground hover:border-purple-500 hover:text-purple-400"
                            }`}
                            onClick={() => toggleSportType(type.id)}
                          >
                            {type.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {(sportSupplementBrands.length > 0 || sportSupplementTypes.length > 0) && (
                    <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-600/30">
                      <h4 className="text-sm font-medium text-foreground mb-2">Riepilogo Integratori Sport</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {sportSupplementBrands.length > 0 && (
                          <p>
                            <span className="text-orange-400">Marche:</span> {sportSupplementBrands.join(", ")}
                          </p>
                        )}
                        {sportSupplementTypes.length > 0 && (
                          <div>
                            <span className="text-orange-400">Prodotti:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {sportSupplementTypes.map((typeId) => {
                                const type = SPORT_SUPPLEMENT_TYPES.find((t) => t.id === typeId)
                                return type ? (
                                  <Badge
                                    key={typeId}
                                    variant="outline"
                                    className={`text-xs ${
                                      type.category === "pre"
                                        ? "border-blue-600 text-blue-400"
                                        : type.category === "intra"
                                          ? "border-green-600 text-green-400"
                                          : "border-purple-600 text-purple-400"
                                    }`}
                                  >
                                    {type.label}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {sportSupplementsSuccess && (
                    <Alert className="bg-green-500/10 border-green-500/50">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-500">
                        Integratori sport salvati! Verranno usati per generare la nutrizione workout.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleSaveSportSupplements}
                      disabled={savingSportSupplements}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {savingSportSupplements ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Salva Integratori Sport
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="planning">
            <div className="space-y-6">
              {/* Integratori */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-green-500" />
                    Integratori
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Gestisci i tuoi integratori alimentari e vitamine
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista integratori */}
                  {supplements.length > 0 ? (
                    <div className="space-y-3">
                      {supplements.map((supplement) => (
                        <div
                          key={supplement.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{supplement.name}</span>
                              <Badge variant="outline" className="text-green-400 border-green-600">
                                {supplement.dosage}
                              </Badge>
                            </div>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{supplement.frequency}</span>
                              <span>•</span>
                              <span>{supplement.timing}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSupplement(supplement.id)}
                            className="text-muted-foreground hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nessun integratore aggiunto</p>
                  )}

                  {/* Form aggiungi integratore */}
                  {showAddSupplement ? (
                    <div className="p-4 rounded-lg border border-green-600/50 bg-green-900/10 space-y-4">
                      <h4 className="font-medium text-foreground">Nuovo Integratore</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Nome</Label>
                          <Input
                            value={newSupplement.name}
                            onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                            placeholder="Es. Vitamina D3"
                            className="bg-muted border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Dosaggio</Label>
                          <Input
                            value={newSupplement.dosage}
                            onChange={(e) => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                            placeholder="Es. 2000 UI"
                            className="bg-muted border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Frequenza</Label>
                          <select
                            value={newSupplement.frequency}
                            onChange={(e) => setNewSupplement({ ...newSupplement, frequency: e.target.value })}
                            className="w-full h-10 px-3 rounded-md bg-muted border border-border text-foreground"
                          >
                            <option value="Giornaliera">Giornaliera</option>
                            <option value="2x al giorno">2x al giorno</option>
                            <option value="3x al giorno">3x al giorno</option>
                            <option value="Settimanale">Settimanale</option>
                            <option value="Al bisogno">Al bisogno</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Quando</Label>
                          <select
                            value={newSupplement.timing}
                            onChange={(e) => setNewSupplement({ ...newSupplement, timing: e.target.value })}
                            className="w-full h-10 px-3 rounded-md bg-muted border border-border text-foreground"
                          >
                            <option value="Mattina">Mattina</option>
                            <option value="Pranzo">Pranzo</option>
                            <option value="Cena">Cena</option>
                            <option value="Sera">Sera</option>
                            <option value="Pre-allenamento">Pre-allenamento</option>
                            <option value="Post-allenamento">Post-allenamento</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddSupplement} className="bg-green-600 hover:bg-green-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddSupplement(false)} className="border-border">
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddSupplement(true)}
                      className="w-full border-dashed border-green-600 text-green-400 hover:bg-green-900/20"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Integratore
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Farmaci */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Pill className="h-5 w-5 text-blue-500" />
                    Farmaci e Terapie
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Registra farmaci, terapie e trattamenti medici in corso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista farmaci */}
                  {medications.length > 0 ? (
                    <div className="space-y-3">
                      {medications.map((medication) => (
                        <div
                          key={medication.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{medication.name}</span>
                              <Badge variant="outline" className="text-blue-400 border-blue-600">
                                {medication.dosage}
                              </Badge>
                            </div>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{medication.frequency}</span>
                              {medication.prescribedBy && (
                                <>
                                  <span>•</span>
                                  <span>Prescritto da: {medication.prescribedBy}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMedication(medication.id)}
                            className="text-muted-foreground hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nessun farmaco registrato</p>
                  )}

                  {/* Form aggiungi farmaco */}
                  {showAddMedication ? (
                    <div className="p-4 rounded-lg border border-blue-600/50 bg-blue-900/10 space-y-4">
                      <h4 className="font-medium text-foreground">Nuovo Farmaco</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Nome Farmaco</Label>
                          <Input
                            value={newMedication.name}
                            onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                            placeholder="Es. Aspirina"
                            className="bg-muted border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Dosaggio</Label>
                          <Input
                            value={newMedication.dosage}
                            onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                            placeholder="Es. 100mg"
                            className="bg-muted border-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Frequenza</Label>
                          <select
                            value={newMedication.frequency}
                            onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                            className="w-full h-10 px-3 rounded-md bg-muted border border-border text-foreground"
                          >
                            <option value="Giornaliera">Giornaliera</option>
                            <option value="2x al giorno">2x al giorno</option>
                            <option value="3x al giorno">3x al giorno</option>
                            <option value="Settimanale">Settimanale</option>
                            <option value="Al bisogno">Al bisogno</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Prescritto da</Label>
                          <Input
                            value={newMedication.prescribedBy}
                            onChange={(e) => setNewMedication({ ...newMedication, prescribedBy: e.target.value })}
                            placeholder="Es. Dr. Rossi"
                            className="bg-muted border-border"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddMedication} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddMedication(false)} className="border-border">
                          Annulla
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddMedication(true)}
                      className="w-full border-dashed border-blue-600 text-blue-400 hover:bg-blue-900/20"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Farmaco
                    </Button>
                  )}

                  <Alert className="bg-amber-900/20 border-amber-600/50">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-200">
                      Queste informazioni sono riservate e usate solo per personalizzare i tuoi piani nutrizionali.
                      Consulta sempre il tuo medico prima di modificare terapie in corso.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Preferenze allenamento */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-fuchsia-500" />
                    Preferenze Allenamento
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Configura le tue preferenze per la pianificazione degli allenamenti
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Giorni preferiti riposo</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day, i) => (
                          <Badge
                            key={day}
                            variant="outline"
                            onClick={() => toggleRestDay(i)}
                            className={`cursor-pointer transition-all ${
                              preferredRestDays.includes(i)
                                ? "bg-fuchsia-600 text-white border-fuchsia-600 hover:bg-fuchsia-700"
                                : "border-border text-muted-foreground hover:border-fuchsia-500 hover:text-fuchsia-500"
                            }`}
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Clicca per selezionare/deselezionare i giorni di riposo
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Orario preferito allenamento</Label>
                      <select
                        className="w-full h-10 px-3 rounded-md bg-muted border border-border text-foreground"
                        value={preferredTrainingTime}
                        onChange={(e) => setPreferredTrainingTime(e.target.value)}
                      >
                        <option value="Mattina presto (6-8)">Mattina presto (6-8)</option>
                        <option value="Mattina (8-12)">Mattina (8-12)</option>
                        <option value="Pranzo (12-14)">Pranzo (12-14)</option>
                        <option value="Pomeriggio (14-18)">Pomeriggio (14-18)</option>
                        <option value="Sera (18-21)">Sera (18-21)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Note per il coach</Label>
                    <Textarea
                      placeholder="Es. Preferisco allenamenti lunghi nel weekend, evitare martedì per impegni lavorativi..."
                      className="bg-muted border-border min-h-[100px]"
                      value={coachNotes}
                      onChange={(e) => setCoachNotes(e.target.value)}
                    />
                  </div>

                  {preferencesSuccess && (
                    <Alert className="bg-green-500/10 border-green-500/50">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-500">Preferenze salvate con successo!</AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-4">
                    <Button
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                      onClick={handleSaveTrainingPreferences}
                      disabled={savingPreferences || loadingPreferences}
                    >
                      {savingPreferences || loadingPreferences ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {savingPreferences ? "Salvataggio..." : "Caricamento..."}
                        </>
                      ) : (
                        "Salva Preferenze"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Connessioni</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Collega i tuoi account per sincronizzare automaticamente i dati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strava Quick Import Section */}
                <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 rounded-lg p-4 border border-orange-500/30 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <span className="text-xl">🟠</span> Importa da Strava
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Importa le tue attività recenti e i dati di potenza
                      </p>
                    </div>
                    <Button
                      onClick={handleStravaImport}
                      disabled={importing}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importazione...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Importa Dati
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Import Result */}
                  {importResult && (
                    <div className="mt-4">
                      {importResult.success ? (
                        <div className="bg-green-900/30 rounded-lg p-3 border border-green-700">
                          <p className="text-green-400 font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Importazione completata!
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">
                              Attività trovate: <span className="text-foreground">{importResult.activitiesCount}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Con potenza: <span className="text-foreground">{importResult.powerActivities}</span>
                            </div>
                          </div>
                          {importResult.bestPowers && Object.keys(importResult.bestPowers).length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-2">Best Power stimati:</p>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(importResult.bestPowers).map(([duration, power]) => (
                                  <Badge
                                    key={duration}
                                    className="bg-orange-600/20 text-orange-300 border-orange-600/50"
                                  >
                                    {duration}: {power}W
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-red-900/30 rounded-lg p-3 border border-red-700">
                          <p className="text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {importResult.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {INTEGRATIONS.map((integration) => {
                  const connected = getConnectedAccount(integration.id)
                  return (
                    <div
                      key={integration.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        integration.available ? "border-border bg-muted/30" : "border-border bg-muted/10 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{integration.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{integration.name}</p>
                            {connected && (
                              <Badge className="bg-green-600/20 text-green-400 border-green-600">Connesso</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                          {connected?.last_sync_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ultima sincronizzazione: {new Date(connected.last_sync_at).toLocaleString("it-IT")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {connected ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border text-foreground bg-transparent"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnect(connected.id)}
                              className="border-red-600 text-red-400 hover:bg-red-600/20 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : integration.connectUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-fuchsia-600 text-fuchsia-400 hover:bg-fuchsia-600/20 bg-transparent"
                            onClick={async () => {
                              window.location.href = integration.connectUrl!
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Collega
                          </Button>
                        ) : (
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            Presto disponibile
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Sicurezza</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Gestisci la sicurezza del tuo account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Cambia password</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Riceverai un'email con il link per reimpostare la password
                  </p>
                  <Button
                    variant="outline"
                    className="border-border text-foreground hover:bg-muted bg-transparent"
                    onClick={async () => {
                      await supabase.auth.resetPasswordForEmail(user.email || "")
                    }}
                  >
                    Invia email reset password
                  </Button>
                </div>

                <div className="border-t border-border pt-6 mt-6">
                  <h4 className="text-sm font-medium text-red-400 mb-2">Zona pericolosa</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    L'eliminazione dell'account e permanente e non puo essere annullata.
                  </p>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                    Elimina account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
