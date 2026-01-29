"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Upload,
  FileText,
  Dna,
  Bug,
  FlaskConical,
  Activity,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Brain,
  Leaf,
  Flame,
  Droplets,
  Shield,
  Printer,
  Calendar,
  Moon,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { AIAnalysisButton } from "@/components/ai-analysis-button"

// ============================================
// TYPES
// ============================================

interface MicrobiomeReport {
  id: string
  type: "microbiome" | "genetic" | "blood"
  name: string
  date: string
  source: string
  file_url?: string
  raw_data?: string
  parsed_data?: ParsedMicrobiomeData | ParsedGeneticData | ParsedBloodData
  status: "pending" | "parsed" | "analyzed"
}

interface ParsedMicrobiomeData {
  diversity_index: number // Shannon index
  firmicutes_bacteroidetes_ratio: number
  keystone_species: BacteriaProfile[]
  pathogenic_markers: BacteriaProfile[]
  functional_capacity: FunctionalCapacity
  scfa_production: SCFAProfile
  inflammation_markers: InflammationMarker[]
}

interface BacteriaProfile {
  name: string
  abundance: number // percentage
  reference_range: { min: number; max: number }
  status: "low" | "normal" | "high"
  metabolic_function: string[]
  food_modulators: FoodModulator[]
}

interface FoodModulator {
  food: string
  effect: "increase" | "decrease"
  mechanism: string
}

interface FunctionalCapacity {
  butyrate_production: number // 0-100
  lactate_metabolism: number
  protein_fermentation: number
  carb_fermentation: number
  vitamin_synthesis: { b12: number; k2: number; folate: number; biotin: number }
}

interface SCFAProfile {
  butyrate: number
  propionate: number
  acetate: number
  total: number
  ratio_optimal: boolean
}

interface InflammationMarker {
  name: string
  value: number
  unit: string
  reference: { min: number; max: number }
  status: "low" | "normal" | "elevated"
}

interface ParsedGeneticData {
  methylation_capacity: MethylationProfile
  detox_capacity: DetoxProfile
  inflammation_genes: GeneVariant[]
  performance_genes: GeneVariant[]
  nutrient_metabolism: NutrientGeneProfile
  circadian_genes: GeneVariant[]
}

interface MethylationProfile {
  mthfr_677: "CC" | "CT" | "TT"
  mthfr_1298: "AA" | "AC" | "CC"
  comt: "Val/Val" | "Val/Met" | "Met/Met"
  mtr: string
  mtrr: string
  overall_capacity: "optimal" | "reduced" | "impaired"
  recommendations: string[]
}

interface DetoxProfile {
  cyp1a2: "fast" | "normal" | "slow" // caffeine
  gstm1: "present" | "null"
  gstt1: "present" | "null"
  sod2: string
  cat: string
  gpx1: string
  overall_capacity: "optimal" | "reduced" | "impaired"
}

interface GeneVariant {
  gene: string
  rsid: string
  genotype: string
  effect: string
  impact: "beneficial" | "neutral" | "risk"
  interventions: string[]
}

interface NutrientGeneProfile {
  vitamin_d_receptor: string
  omega3_metabolism: string
  iron_absorption: string
  b12_transport: string
  folate_metabolism: string
}

interface ParsedBloodData {
  date: string
  markers: BloodMarker[]
  deficiencies: string[]
  elevations: string[]
}

interface BloodMarker {
  name: string
  value: number
  unit: string
  reference: { min: number; max: number }
  status: "low" | "normal" | "high"
  nutritional_intervention?: string
}

interface FoodBacteriaMapping {
  food: string
  category: string
  target_bacteria: string[]
  metabolic_pathway: string
  timing: string
  contraindications: string[]
}

interface MetabolicTarget {
  pathway: string
  current_status: "inactive" | "suboptimal" | "active" | "overactive"
  training_stimulus: string
  genetic_capacity: string
  microbiome_support: string
  intervention: string
  timing: string
  expected_outcome: string
}

// ============================================
// CONSTANTS
// ============================================

const REPORT_TYPES = [
  { value: "microbiome", label: "Test Microbiota", icon: Bug, color: "text-green-500" },
  { value: "genetic", label: "Test Genetico", icon: Dna, color: "text-purple-500" },
  { value: "blood", label: "Esami Sangue", icon: Droplets, color: "text-red-500" },
] as const

// Food -> Bacteria -> Pathway database (LOCK Module 11)
const FOOD_BACTERIA_DATABASE: FoodBacteriaMapping[] = [
  // Prebiotic fibers
  {
    food: "Inulina (cicoria, carciofi)",
    category: "Prebiotico",
    target_bacteria: ["Bifidobacterium", "Akkermansia"],
    metabolic_pathway: "Butyrate production",
    timing: "Giorni LOW/recovery",
    contraindications: ["Pre-gara", "Pre-quality"],
  },
  {
    food: "FOS (banana verde, aglio)",
    category: "Prebiotico",
    target_bacteria: ["Lactobacillus", "Bifidobacterium"],
    metabolic_pathway: "SCFA synthesis",
    timing: "Lontano da HI",
    contraindications: ["SIBO", "IBS attivo"],
  },
  {
    food: "Amido resistente (patate fredde, riso freddo)",
    category: "Prebiotico",
    target_bacteria: ["Ruminococcus", "Eubacterium"],
    metabolic_pathway: "Butyrate + barrier integrity",
    timing: "Pranzo/cena giorni LOW",
    contraindications: ["Pre-workout"],
  },
  {
    food: "Beta-glucani (avena, orzo)",
    category: "Fibra solubile",
    target_bacteria: ["Prevotella", "Roseburia"],
    metabolic_pathway: "Propionate production",
    timing: "Colazione giorni MED",
    contraindications: [],
  },
  // Polyphenols
  {
    food: "Mirtilli",
    category: "Polifenoli",
    target_bacteria: ["Akkermansia muciniphila"],
    metabolic_pathway: "NRF2 activation + barrier",
    timing: "Post-workout o colazione",
    contraindications: [],
  },
  {
    food: "Melograno",
    category: "Polifenoli",
    target_bacteria: ["Akkermansia", "Lactobacillus"],
    metabolic_pathway: "Urolithin A production",
    timing: "Snack pomeriggio",
    contraindications: [],
  },
  {
    food: "Cacao >85%",
    category: "Polifenoli",
    target_bacteria: ["Bifidobacterium", "Lactobacillus"],
    metabolic_pathway: "Flavanol metabolism + NO",
    timing: "Post-cena",
    contraindications: ["Sera tardi (caffeina)"],
  },
  {
    food: "Tè verde",
    category: "Polifenoli",
    target_bacteria: ["Bacteroides", "Clostridium"],
    metabolic_pathway: "EGCG + AMPK",
    timing: "Mattino o pre-workout",
    contraindications: ["Sera"],
  },
  // Fermented foods
  {
    food: "Kefir",
    category: "Fermentato",
    target_bacteria: ["Lactobacillus kefiri", "Saccharomyces"],
    metabolic_pathway: "Colonization + immunity",
    timing: "Colazione o post-workout",
    contraindications: ["Lattosio intolleranza grave"],
  },
  {
    food: "Kimchi/Crauti",
    category: "Fermentato",
    target_bacteria: ["Lactobacillus plantarum", "L. brevis"],
    metabolic_pathway: "Diversity + GABA",
    timing: "Pranzo/cena",
    contraindications: ["Pre-gara (gas)"],
  },
  {
    food: "Miso",
    category: "Fermentato",
    target_bacteria: ["Aspergillus oryzae", "Bacillus subtilis"],
    metabolic_pathway: "Enzyme + mineral absorption",
    timing: "Cena",
    contraindications: ["Sodio alto"],
  },
  {
    food: "Kombucha",
    category: "Fermentato",
    target_bacteria: ["Gluconacetobacter", "Saccharomyces"],
    metabolic_pathway: "Organic acids + detox",
    timing: "Snack",
    contraindications: ["Zucchero alto in alcuni"],
  },
  // Omega-3 sources
  {
    food: "Salmone selvaggio",
    category: "Omega-3",
    target_bacteria: ["Akkermansia", "Lactobacillus"],
    metabolic_pathway: "Anti-inflammatory + barrier",
    timing: "Pranzo/cena 2-3x/week",
    contraindications: [],
  },
  {
    food: "Sardine",
    category: "Omega-3",
    target_bacteria: ["Bifidobacterium"],
    metabolic_pathway: "EPA/DHA + Ca absorption",
    timing: "Pranzo",
    contraindications: [],
  },
  // Protein sources
  {
    food: "Uova (tuorlo)",
    category: "Colina",
    target_bacteria: ["Bilophila (attenzione)"],
    metabolic_pathway: "Choline → TMAO (controllare)",
    timing: "Colazione 2-3x/week",
    contraindications: ["TMA alto"],
  },
  {
    food: "Legumi (lenticchie, ceci)",
    category: "Fibra + Proteine",
    target_bacteria: ["Faecalibacterium", "Roseburia"],
    metabolic_pathway: "Butyrate + satiety",
    timing: "Pranzo/cena giorni LOW",
    contraindications: ["Pre-quality", "IBS"],
  },
]

// Keystone bacteria database
const KEYSTONE_BACTERIA = [
  {
    name: "Akkermansia muciniphila",
    role: "Barrier integrity",
    optimal_range: "1-4%",
    modulators: ["Polifenoli", "Omega-3", "Digiuno intermittente"],
  },
  {
    name: "Faecalibacterium prausnitzii",
    role: "Anti-inflammatory + Butyrate",
    optimal_range: "5-15%",
    modulators: ["Fibre prebiotiche", "Amido resistente"],
  },
  {
    name: "Bifidobacterium spp.",
    role: "Immunity + B vitamins",
    optimal_range: "3-10%",
    modulators: ["FOS", "GOS", "Latte fermentato"],
  },
  {
    name: "Roseburia spp.",
    role: "Butyrate production",
    optimal_range: "3-8%",
    modulators: ["Beta-glucani", "Fibre insolubili"],
  },
  {
    name: "Lactobacillus spp.",
    role: "Colonization resistance",
    optimal_range: "1-5%",
    modulators: ["Fermentati", "Prebiotici"],
  },
]

// Metabolic pathways for epigenetic targeting
const METABOLIC_PATHWAYS = [
  {
    id: "ampk",
    name: "AMPK",
    description: "Energy sensor, fat oxidation",
    training_trigger: "Endurance, fasted training",
    nutrients: ["Berberina", "EGCG", "Resveratrolo"],
  },
  {
    id: "mtor",
    name: "mTOR",
    description: "Protein synthesis, growth",
    training_trigger: "Resistance, post-workout",
    nutrients: ["Leucina", "HMB", "PA"],
  },
  {
    id: "sirt1",
    name: "SIRT1",
    description: "Longevity, mitochondrial biogenesis",
    training_trigger: "Caloric restriction, endurance",
    nutrients: ["NAD+ precursors", "Resveratrolo", "Pterostilbene"],
  },
  {
    id: "nrf2",
    name: "NRF2",
    description: "Antioxidant response",
    training_trigger: "Acute oxidative stress",
    nutrients: ["Sulforafano", "Curcumina", "DIM"],
  },
  {
    id: "pgc1a",
    name: "PGC-1α",
    description: "Mitochondrial biogenesis",
    training_trigger: "HIIT, cold exposure",
    nutrients: ["Quercetina", "Epicatechina", "Nitrati"],
  },
  {
    id: "hif1a",
    name: "HIF-1α",
    description: "Hypoxia adaptation",
    training_trigger: "Altitude, VO2max efforts",
    nutrients: ["Beetroot", "Iron (if deficient)"],
  },
]

// ============================================
// COMPONENT
// ============================================

interface MicrobiomeEpigeneticProps {
  athleteId?: string
  metabolicProfile?: {
    ftp?: number
    vo2max?: number
    vlamax?: number
    fatmax_watts?: number
    lt1_watts?: number
    lt2_watts?: number
  }
  trainingDay?: {
    type: "rest" | "low" | "medium" | "high" | "quality"
    stimulus: string[]
  }
}

export function MicrobiomeEpigenetic({ athleteId, metabolicProfile, trainingDay }: MicrobiomeEpigeneticProps) {
  const [activeTab, setActiveTab] = useState("microbiome")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [reports, setReports] = useState<MicrobiomeReport[]>([])
  const [selectedReportType, setSelectedReportType] = useState<"microbiome" | "genetic" | "blood">("microbiome")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importText, setImportText] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Parsed data states
  const [microbiomeData, setMicrobiomeData] = useState<ParsedMicrobiomeData | null>(null)
  const [geneticData, setGeneticData] = useState<ParsedGeneticData | null>(null)
  const [bloodData, setBloodData] = useState<ParsedBloodData | null>(null)

  // Generated recommendations
  const [foodBacteriaProtocol, setFoodBacteriaProtocol] = useState<FoodBacteriaMapping[]>([])
  const [metabolicTargets, setMetabolicTargets] = useState<MetabolicTarget[]>([])
  
  // AI Analysis states
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null)
  const [aiRecommendations, setAiRecommendations] = useState<any>(null)
  const [aiPathways, setAiPathways] = useState<any>(null)
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [aiAnalysisStep, setAiAnalysisStep] = useState<string>("")
  
  // History and comparison states
  const [historicalReports, setHistoricalReports] = useState<any[]>([])
  const [selectedReportsForComparison, setSelectedReportsForComparison] = useState<string[]>([])
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [showComparisonDialog, setShowComparisonDialog] = useState(false)

  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDay() || 7)
  const [weekWorkouts, setWeekWorkouts] = useState<any[]>([])
  const [selectedDayWorkout, setSelectedDayWorkout] = useState<any>(null)

  const DAYS = [
    { value: 1, label: "Lun", fullLabel: "Lunedì" },
    { value: 2, label: "Mar", fullLabel: "Martedì" },
    { value: 3, label: "Mer", fullLabel: "Mercoledì" },
    { value: 4, label: "Gio", fullLabel: "Giovedì" },
    { value: 5, label: "Ven", fullLabel: "Venerdì" },
    { value: 6, label: "Sab", fullLabel: "Sabato" },
    { value: 7, label: "Domenica", fullLabel: "Domenica" },
  ]

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function loadWeekWorkouts() {
      if (!athleteId) return

      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const today = new Date()
        const dayOfWeek = today.getDay() || 7
        const monday = new Date(today)
        monday.setDate(today.getDate() - dayOfWeek + 1)
        monday.setHours(0, 0, 0, 0)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        const { data, error } = await supabase
          .from("training_activities")
          .select("*")
          .eq("athlete_id", athleteId)
          .gte("activity_date", monday.toISOString().split("T")[0])
          .lte("activity_date", sunday.toISOString().split("T")[0])
          .order("activity_date", { ascending: true })

        if (!error && data) {
          setWeekWorkouts(data)
        }
      } catch (err) {
        console.error("Error loading week workouts:", err)
      }
    }

    loadWeekWorkouts()
  }, [athleteId])

  useEffect(() => {
    if (weekWorkouts.length === 0) {
      setSelectedDayWorkout(null)
      return
    }

    const today = new Date()
    const dayOfWeek = today.getDay() || 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek + 1)

    const selectedDate = new Date(monday)
    selectedDate.setDate(monday.getDate() + selectedDay - 1)
    const dateStr = selectedDate.toISOString().split("T")[0]

    const workout = weekWorkouts.find((w) => w.activity_date === dateStr)
    setSelectedDayWorkout(workout || null)
  }, [selectedDay, weekWorkouts])

  const derivedTrainingDay = selectedDayWorkout
    ? {
        type:
          selectedDayWorkout.tss > 150
            ? ("quality" as const)
            : selectedDayWorkout.tss > 100
              ? ("high" as const)
              : selectedDayWorkout.tss > 50
                ? ("medium" as const)
                : selectedDayWorkout.tss > 0
                  ? ("low" as const)
                  : ("rest" as const),
        stimulus: selectedDayWorkout.target_zone ? [selectedDayWorkout.target_zone] : [],
      }
    : trainingDay || { type: "rest" as const, stimulus: [] }

  const selectedDayLabel = DAYS.find((d) => d.value === selectedDay)?.fullLabel || ""

  // State for PDF error message
  const [pdfParseError, setPdfParseError] = useState<string | null>(null)

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setPdfParseError(null)
      console.log("[v0] File selected:", file.name, "Type:", file.type, "Size:", file.size)
      
      // Read file content for all text-based reports
      const isTextFile = file.type === "text/plain" || 
                         file.type === "application/json" ||
                         file.type === "text/csv" ||
                         file.name.endsWith(".txt") ||
                         file.name.endsWith(".json") ||
                         file.name.endsWith(".csv")
      
      if (isTextFile) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = (event.target?.result as string) || ""
          console.log("[v0] File content loaded, length:", content.length)
          setImportText(content)
        }
        reader.onerror = (error) => {
          console.error("[v0] Error reading file:", error)
        }
        reader.readAsText(file)
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        // PDF files cannot be parsed automatically - show instructions
        setPdfParseError("I file PDF non possono essere letti automaticamente. Segui le istruzioni qui sotto per copiare e incollare il contenuto.")
        setImportText("")
      }
    }
  }, [])

  // Load historical reports from database
  const loadHistoricalReports = useCallback(async () => {
    if (!athleteId) return
    
    try {
      const { data, error } = await supabase
        .from("athlete_reports")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false })
      
      if (!error && data) {
        setHistoricalReports(data)
      }
    } catch (error) {
      console.error("Error loading historical reports:", error)
    }
  }, [athleteId])
  
  useEffect(() => {
    loadHistoricalReports()
  }, [loadHistoricalReports])
  
  // Compare selected reports
  const compareReports = () => {
    if (selectedReportsForComparison.length < 2) return
    
    const reportsToCompare = historicalReports.filter(r => 
      selectedReportsForComparison.includes(r.id)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    if (reportsToCompare.length < 2) return
    
    const comparison: any = {
      reports: reportsToCompare,
      changes: [],
      trends: {}
    }
    
    // Compare diversity index
    const firstReport = reportsToCompare[0]
    const lastReport = reportsToCompare[reportsToCompare.length - 1]
    
    if (firstReport.parsed_data?.diversity_index && lastReport.parsed_data?.diversity_index) {
      const change = lastReport.parsed_data.diversity_index - firstReport.parsed_data.diversity_index
      comparison.trends.diversityIndex = {
        first: firstReport.parsed_data.diversity_index,
        last: lastReport.parsed_data.diversity_index,
        change: change,
        trend: change > 0 ? "improving" : change < 0 ? "declining" : "stable"
      }
    }
    
    // Compare F/B ratio
    if (firstReport.parsed_data?.firmicutes_bacteroidetes_ratio && lastReport.parsed_data?.firmicutes_bacteroidetes_ratio) {
      const change = lastReport.parsed_data.firmicutes_bacteroidetes_ratio - firstReport.parsed_data.firmicutes_bacteroidetes_ratio
      comparison.trends.fbRatio = {
        first: firstReport.parsed_data.firmicutes_bacteroidetes_ratio,
        last: lastReport.parsed_data.firmicutes_bacteroidetes_ratio,
        change: change,
        trend: Math.abs(change) < 0.2 ? "stable" : change > 0 ? "increasing" : "decreasing"
      }
    }
    
    // Compare AI analysis results if available
    if (firstReport.ai_analysis && lastReport.ai_analysis) {
      comparison.aiComparison = {
        first: firstReport.ai_analysis,
        last: lastReport.ai_analysis
      }
    }
    
    setComparisonData(comparison)
    setShowComparisonDialog(true)
  }

  // AI-powered analysis function
  const runAiAnalysis = async (rawData: string, analysisType: string) => {
    console.log("[v0] runAiAnalysis called:", { analysisType, dataLength: rawData?.length })
    
    if (!rawData || rawData.trim().length === 0) {
      console.error("[v0] No data to analyze")
      return null
    }
    
    try {
      console.log("[v0] Sending request to /api/microbiome-analysis")
      const response = await fetch('/api/microbiome-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawData, 
          analysisType,
          currentNutrition: null // TODO: Integrate with nutrition plan
        })
      })
      
      console.log("[v0] Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error:", errorText)
        throw new Error('Analysis failed: ' + errorText)
      }
      
      const result = await response.json()
      console.log("[v0] AI Analysis result:", result)
      return result
    } catch (error) {
      console.error('[v0] AI Analysis error:', error)
      return null
    }
  }

  // Import and parse report with AI
  const handleImportReport = async () => {
    console.log("[v0] handleImportReport called:", { 
      hasFile: !!importFile, 
      textLength: importText?.length,
      reportType: selectedReportType 
    })
    
    if (!importFile && !importText) {
      console.log("[v0] No file or text to import")
      return
    }

    setIsAnalyzing(true)
    setIsAiAnalyzing(true)

    try {
      const newReport: MicrobiomeReport = {
        id: crypto.randomUUID(),
        type: selectedReportType,
        name: importFile?.name || `${selectedReportType}_report_${new Date().toISOString().split("T")[0]}`,
        date: new Date().toISOString(),
        source: importFile ? "file" : "manual",
        raw_data: importText,
        status: "pending",
      }

      if (selectedReportType === "microbiome") {
        // Step 1: Parse bacteria with AI
        setAiAnalysisStep("Analizzando batteri e capacita genetiche...")
        const bacteriaResult = await runAiAnalysis(importText, 'parse')
        
        if (bacteriaResult?.success) {
          setAiAnalysisResults(bacteriaResult.data)
          
          // Step 2: Analyze pathways
          setAiAnalysisStep("Analizzando pathway metabolici e sostanze tossiche...")
          const pathwayResult = await runAiAnalysis(JSON.stringify(bacteriaResult.data), 'pathways')
          
          if (pathwayResult?.success) {
            setAiPathways(pathwayResult.data)
          }
          
          // Step 3: Generate recommendations
          setAiAnalysisStep("Generando raccomandazioni nutrizionali personalizzate...")
          const recommendationsResult = await runAiAnalysis(
            JSON.stringify({ bacteria: bacteriaResult.data, pathways: pathwayResult?.data }), 
            'recommendations'
          )
          
          if (recommendationsResult?.success) {
            setAiRecommendations(recommendationsResult.data)
          }
        }
        
        // Also use the fallback parser for basic data
        const parsedMicrobiome: ParsedMicrobiomeData = parseMicrobiomeReport(importText)
        newReport.parsed_data = parsedMicrobiome
        newReport.status = "parsed"
        setMicrobiomeData(parsedMicrobiome)
        generateFoodBacteriaProtocol(parsedMicrobiome)
        
      } else if (selectedReportType === "genetic") {
        const parsedGenetic: ParsedGeneticData = parseGeneticReport(importText)
        newReport.parsed_data = parsedGenetic
        newReport.status = "parsed"
        setGeneticData(parsedGenetic)
      } else if (selectedReportType === "blood") {
        const parsedBlood: ParsedBloodData = parseBloodReport(importText)
        newReport.parsed_data = parsedBlood
        newReport.status = "parsed"
        setBloodData(parsedBlood)
      }

      // Save to database if athlete ID exists
      if (athleteId) {
        await supabase.from("athlete_reports").insert({
          athlete_id: athleteId,
          report_type: selectedReportType,
          report_name: newReport.name,
          raw_data: importText,
          parsed_data: newReport.parsed_data,
          ai_analysis: aiAnalysisResults,
          ai_recommendations: aiRecommendations,
          ai_pathways: aiPathways,
          status: "parsed",
        })
      }

      setReports((prev) => [...prev, newReport])

      // Generate metabolic targets if we have enough data
      if (microbiomeData || geneticData || bloodData) {
        generateMetabolicTargets()
      }
      
      // Reload historical reports
      await loadHistoricalReports()

      setImportDialogOpen(false)
      setImportFile(null)
      setImportText("")
      setAiAnalysisStep("")
    } catch (error) {
      console.error("Error importing report:", error)
    } finally {
      setIsAnalyzing(false)
      setIsAiAnalyzing(false)
    }
  }

  // Parse microbiome report (simulation - in production use AI)
  const parseMicrobiomeReport = (rawData: string): ParsedMicrobiomeData => {
    // This would be replaced with actual parsing logic or AI
    return {
      diversity_index: 3.2,
      firmicutes_bacteroidetes_ratio: 1.8,
      keystone_species: [
        {
          name: "Akkermansia muciniphila",
          abundance: 2.1,
          reference_range: { min: 1, max: 4 },
          status: "normal",
          metabolic_function: ["Barrier integrity", "Mucin degradation"],
          food_modulators: [{ food: "Polifenoli", effect: "increase", mechanism: "Cross-feeding" }],
        },
        {
          name: "Faecalibacterium prausnitzii",
          abundance: 4.5,
          reference_range: { min: 5, max: 15 },
          status: "low",
          metabolic_function: ["Butyrate production", "Anti-inflammatory"],
          food_modulators: [{ food: "Fibre prebiotiche", effect: "increase", mechanism: "Substrate provision" }],
        },
        {
          name: "Bifidobacterium spp.",
          abundance: 6.2,
          reference_range: { min: 3, max: 10 },
          status: "normal",
          metabolic_function: ["Immunity", "B vitamins"],
          food_modulators: [{ food: "FOS/GOS", effect: "increase", mechanism: "Selective growth" }],
        },
      ],
      pathogenic_markers: [
        {
          name: "Bilophila wadsworthia",
          abundance: 1.2,
          reference_range: { min: 0, max: 0.5 },
          status: "high",
          metabolic_function: ["Sulfate reduction", "H2S production"],
          food_modulators: [{ food: "Grassi saturi", effect: "increase", mechanism: "Bile metabolism" }],
        },
      ],
      functional_capacity: {
        butyrate_production: 65,
        lactate_metabolism: 78,
        protein_fermentation: 45,
        carb_fermentation: 82,
        vitamin_synthesis: { b12: 70, k2: 85, folate: 60, biotin: 75 },
      },
      scfa_production: {
        butyrate: 18,
        propionate: 22,
        acetate: 55,
        total: 95,
        ratio_optimal: false,
      },
      inflammation_markers: [
        { name: "Calprotectina", value: 45, unit: "μg/g", reference: { min: 0, max: 50 }, status: "normal" },
        { name: "Zonulina", value: 68, unit: "ng/mL", reference: { min: 0, max: 55 }, status: "elevated" },
      ],
    }
  }

  // Parse genetic report (simulation)
  const parseGeneticReport = (rawData: string): ParsedGeneticData => {
    return {
      methylation_capacity: {
        mthfr_677: "CT",
        mthfr_1298: "AA",
        comt: "Val/Met",
        mtr: "AG",
        mtrr: "AA",
        overall_capacity: "reduced",
        recommendations: ["Metilfolato invece di acido folico", "Metilcobalamina", "Supporto SAMe"],
      },
      detox_capacity: {
        cyp1a2: "fast",
        gstm1: "null",
        gstt1: "present",
        sod2: "Ala/Val",
        cat: "CC",
        gpx1: "Pro/Leu",
        overall_capacity: "reduced",
      },
      inflammation_genes: [
        {
          gene: "IL6",
          rsid: "rs1800795",
          genotype: "GC",
          effect: "Risposta infiammatoria aumentata",
          impact: "risk",
          interventions: ["Omega-3", "Curcumina", "Recovery adeguato"],
        },
        { gene: "TNF-α", rsid: "rs1800629", genotype: "GG", effect: "Normale", impact: "neutral", interventions: [] },
      ],
      performance_genes: [
        {
          gene: "ACTN3",
          rsid: "rs1815739",
          genotype: "RX",
          effect: "Misto power/endurance",
          impact: "neutral",
          interventions: ["Training polarizzato"],
        },
        { gene: "ACE", rsid: "rs4646994", genotype: "ID", effect: "Misto", impact: "neutral", interventions: [] },
        {
          gene: "PPARGC1A",
          rsid: "rs8192678",
          genotype: "GA",
          effect: "Risposta mitocondiale ridotta",
          impact: "risk",
          interventions: ["PQQ", "CoQ10", "Training volume"],
        },
      ],
      nutrient_metabolism: {
        vitamin_d_receptor: "Ff (ridotto)",
        omega3_metabolism: "Normale",
        iron_absorption: "Aumentato (HFE)",
        b12_transport: "Ridotto (FUT2)",
        folate_metabolism: "Ridotto (MTHFR)",
      },
      circadian_genes: [
        {
          gene: "CLOCK",
          rsid: "rs1801260",
          genotype: "TC",
          effect: "Cronotipo serale tendenziale",
          impact: "neutral",
          interventions: ["Training mattutino forzato graduale"],
        },
        { gene: "PER3", rsid: "rs228697", genotype: "4/5", effect: "Misto", impact: "neutral", interventions: [] },
      ],
    }
  }

  // Parse blood report (simulation)
  const parseBloodReport = (rawData: string): ParsedBloodData => {
    return {
      date: new Date().toISOString(),
      markers: [
        {
          name: "Ferritina",
          value: 45,
          unit: "ng/mL",
          reference: { min: 50, max: 200 },
          status: "low",
          nutritional_intervention: "Ferro eme + Vitamina C",
        },
        {
          name: "Vitamina D",
          value: 28,
          unit: "ng/mL",
          reference: { min: 40, max: 80 },
          status: "low",
          nutritional_intervention: "Vitamina D3 + K2",
        },
        {
          name: "Vitamina B12",
          value: 380,
          unit: "pg/mL",
          reference: { min: 400, max: 900 },
          status: "low",
          nutritional_intervention: "Metilcobalamina sublinguale",
        },
        {
          name: "Omocisteina",
          value: 14,
          unit: "μmol/L",
          reference: { min: 5, max: 10 },
          status: "high",
          nutritional_intervention: "Metilfolato + B6 + B12",
        },
        {
          name: "Magnesio",
          value: 1.9,
          unit: "mg/dL",
          reference: { min: 2.0, max: 2.5 },
          status: "low",
          nutritional_intervention: "Magnesio glicinato serale",
        },
        { name: "Zinco", value: 85, unit: "μg/dL", reference: { min: 80, max: 120 }, status: "normal" },
        {
          name: "hs-CRP",
          value: 1.8,
          unit: "mg/L",
          reference: { min: 0, max: 1 },
          status: "high",
          nutritional_intervention: "Omega-3 + Curcumina",
        },
      ],
      deficiencies: ["Ferritina", "Vitamina D", "Vitamina B12", "Magnesio"],
      elevations: ["Omocisteina", "hs-CRP"],
    }
  }

  // Generate Food -> Bacteria protocol (Module 11)
  const generateFoodBacteriaProtocol = (microbiome: ParsedMicrobiomeData) => {
    const protocol: FoodBacteriaMapping[] = []

    // Check for low keystone species and add foods that increase them
    microbiome.keystone_species.forEach((bacteria) => {
      if (bacteria.status === "low") {
        const foods = FOOD_BACTERIA_DATABASE.filter((f) =>
          f.target_bacteria.some((b) => bacteria.name.toLowerCase().includes(b.toLowerCase())),
        )
        protocol.push(...foods)
      }
    })

    // Check for high pathogenic bacteria and add foods that decrease them
    microbiome.pathogenic_markers.forEach((bacteria) => {
      if (bacteria.status === "high") {
        // Add foods that reduce these (generally less saturated fat, more fiber)
        const antiPathogenic = FOOD_BACTERIA_DATABASE.filter(
          (f) => f.category === "Fibra solubile" || f.category === "Polifenoli",
        )
        protocol.push(...antiPathogenic)
      }
    })

    // Remove duplicates
    const uniqueProtocol = protocol.filter((item, index, self) => index === self.findIndex((t) => t.food === item.food))

    setFoodBacteriaProtocol(uniqueProtocol)
  }

  // Generate Metabolic Targets (Module 12)
  const generateMetabolicTargets = () => {
    const targets: MetabolicTarget[] = []

    // Based on training day type and available data
    const dayType = derivedTrainingDay?.type || "medium"

    if (dayType === "high" || dayType === "quality") {
      // AMPK activation during, mTOR post
      targets.push({
        pathway: "AMPK",
        current_status: "active",
        training_stimulus: "High intensity / Endurance",
        genetic_capacity: geneticData?.performance_genes.find((g) => g.gene === "PPARGC1A")?.effect || "N/A",
        microbiome_support: microbiomeData?.functional_capacity.lactate_metabolism
          ? `Lactate metabolism: ${microbiomeData.functional_capacity.lactate_metabolism}%`
          : "N/A",
        intervention: "EGCG pre-workout, Berberina con pasti",
        timing: "30min pre-workout",
        expected_outcome: "Enhanced fat oxidation, glycogen sparing",
      })

      targets.push({
        pathway: "mTOR",
        current_status: "inactive",
        training_stimulus: "Post-workout window",
        genetic_capacity: "Standard",
        microbiome_support: microbiomeData?.functional_capacity.protein_fermentation
          ? `Protein fermentation: ${microbiomeData.functional_capacity.protein_fermentation}%`
          : "N/A",
        intervention: "Leucina 3g + Whey 25g",
        timing: "0-30min post-workout",
        expected_outcome: "Optimal muscle protein synthesis",
      })
    }

    if (dayType === "low" || dayType === "rest") {
      // Recovery focus
      targets.push({
        pathway: "SIRT1",
        current_status: "suboptimal",
        training_stimulus: "Recovery / Low intensity",
        genetic_capacity: geneticData?.methylation_capacity.overall_capacity || "N/A",
        microbiome_support: "Butyrate-producing bacteria support",
        intervention: "NAD+ precursor (NMN 250mg), Time-restricted eating",
        timing: "Morning, 16h fasting window",
        expected_outcome: "Enhanced mitochondrial quality control",
      })

      targets.push({
        pathway: "NRF2",
        current_status: "active",
        training_stimulus: "Post-HI recovery",
        genetic_capacity: geneticData?.detox_capacity.overall_capacity || "N/A",
        microbiome_support: "Polyphenol metabolism capacity",
        intervention: "Sulforafano (broccoli sprouts), Curcumina",
        timing: "With meals, not pre-workout",
        expected_outcome: "Antioxidant enzyme upregulation",
      })
    }

    setMetabolicTargets(targets)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "text-orange-500 bg-orange-500/10"
      case "normal":
        return "text-green-500 bg-green-500/10"
      case "high":
      case "elevated":
        return "text-red-500 bg-red-500/10"
      case "optimal":
        return "text-green-500 bg-green-500/10"
      case "reduced":
        return "text-yellow-500 bg-yellow-500/10"
      case "impaired":
        return "text-red-500 bg-red-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  const handleExportMicrobiomePDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Microbiome & Epigenetic EMPATHY bioMAP</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; font-size: 12px; }
          h1 { font-size: 24px; margin-bottom: 10px; color: #8b5cf6; }
          h2 { font-size: 18px; margin: 20px 0 10px; color: #333; border-bottom: 2px solid #8b5cf6; padding-bottom: 5px; }
          h3 { font-size: 14px; margin: 15px 0 8px; color: #555; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; page-break-inside: avoid; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }
          .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 10px 0; }
          .box { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
          .box-value { font-size: 20px; font-weight: bold; color: #8b5cf6; }
          .box-label { font-size: 10px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #8b5cf6; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .bacteria-card { border: 1px solid #ddd; padding: 10px; margin: 8px 0; border-radius: 5px; }
          .status-low { color: #f97316; }
          .status-normal { color: #22c55e; }
          .status-high { color: #ef4444; }
          .badge { display: inline-block; background: #e5e5e5; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin: 2px; }
          .badge-green { background: #dcfce7; color: #16a34a; }
          .badge-red { background: #fee2e2; color: #dc2626; }
          .badge-orange { background: #ffedd5; color: #ea580c; }
          .print-date { text-align: right; color: #999; font-size: 10px; margin-bottom: 10px; }
          .pathway-card { border: 1px solid #ddd; padding: 10px; margin: 8px 0; border-radius: 5px; background: #faf5ff; }
          @media print { 
            body { padding: 10px; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-date">Generato: ${new Date().toLocaleDateString("it-IT")} ${new Date().toLocaleTimeString("it-IT")}</div>
        
        <div class="header">
          <h1>Report Microbiome & Epigenetic</h1>
          <p>EMPATHY bioMAP - Moduli 10-11-12</p>
        </div>

        ${
          microbiomeData
            ? `
        <div class="section">
          <h2>Modulo 10 - Profilo Microbiotico Funzionale</h2>
          
          <div class="grid">
            <div class="box">
              <div class="box-value">${microbiomeData.diversity_index.toFixed(1)}</div>
              <div class="box-label">Indice Shannon (Diversità)</div>
            </div>
            <div class="box">
              <div class="box-value">${microbiomeData.firmicutes_bacteroidetes_ratio.toFixed(1)}</div>
              <div class="box-label">Ratio F/B</div>
            </div>
            <div class="box">
              <div class="box-value">${microbiomeData.functional_capacity.butyrate_production}%</div>
              <div class="box-label">Capacità Butyrate</div>
            </div>
          </div>

          <h3>Batteri Keystone</h3>
          ${microbiomeData.keystone_species
            .map(
              (b) => `
            <div class="bacteria-card">
              <strong>${b.name}</strong> 
              <span class="status-${b.status}">${b.abundance}% (${b.status})</span>
              <br><small>Range: ${b.reference_range.min}-${b.reference_range.max}% | Funzioni: ${b.metabolic_function.join(", ")}</small>
            </div>
          `,
            )
            .join("")}

          ${
            microbiomeData.pathogenic_markers.length > 0
              ? `
          <h3>Marker Patogeni (ALERT)</h3>
          ${microbiomeData.pathogenic_markers
            .map(
              (b) => `
            <div class="bacteria-card" style="border-color: #ef4444; background: #fef2f2;">
              <strong class="status-high">${b.name}</strong> - ${b.abundance}% (ALTO)
              <br><small>Target: <${b.reference_range.max}%</small>
            </div>
          `,
            )
            .join("")}
          `
              : ""
          }

          <h3>Capacità Funzionale</h3>
          <table>
            <tr><th>Funzione</th><th>Valore</th></tr>
            <tr><td>Produzione Butyrate</td><td>${microbiomeData.functional_capacity.butyrate_production}%</td></tr>
            <tr><td>Metabolismo Lattato</td><td>${microbiomeData.functional_capacity.lactate_metabolism}%</td></tr>
            <tr><td>Fermentazione Proteine</td><td>${microbiomeData.functional_capacity.protein_fermentation}%</td></tr>
            <tr><td>Fermentazione CHO</td><td>${microbiomeData.functional_capacity.carb_fermentation}%</td></tr>
          </table>

          <h3>Profilo SCFA</h3>
          <div class="grid">
            <div class="box"><div class="box-value">${microbiomeData.scfa_production.butyrate}</div><div class="box-label">Butyrato</div></div>
            <div class="box"><div class="box-value">${microbiomeData.scfa_production.propionate}</div><div class="box-label">Propionato</div></div>
            <div class="box"><div class="box-value">${microbiomeData.scfa_production.acetate}</div><div class="box-label">Acetato</div></div>
          </div>
        </div>
        `
            : '<div class="section"><h2>Modulo 10</h2><p>Nessun test microbiota caricato</p></div>'
        }

        ${
          geneticData
            ? `
        <div class="section">
          <h2>Profilo Genetico</h2>
          
          <h3>Capacità Metilazione</h3>
          <table>
            <tr><th>Gene</th><th>Genotipo</th><th>Impatto</th></tr>
            <tr><td>MTHFR 677</td><td>${geneticData.methylation_capacity.mthfr_677}</td><td>${geneticData.methylation_capacity.mthfr_677 === "TT" ? "Ridotta" : geneticData.methylation_capacity.mthfr_677 === "CT" ? "Moderata" : "Normale"}</td></tr>
            <tr><td>MTHFR 1298</td><td>${geneticData.methylation_capacity.mthfr_1298}</td><td>${geneticData.methylation_capacity.mthfr_1298 === "CC" ? "Ridotta" : "Normale"}</td></tr>
            <tr><td>COMT</td><td>${geneticData.methylation_capacity.comt}</td><td>${geneticData.methylation_capacity.comt}</td></tr>
          </table>
          <p><strong>Capacità complessiva:</strong> <span class="status-${geneticData.methylation_capacity.overall_capacity === "optimal" ? "normal" : geneticData.methylation_capacity.overall_capacity === "reduced" ? "low" : "high"}">${geneticData.methylation_capacity.overall_capacity}</span></p>

          <h3>Capacità Detox</h3>
          <table>
            <tr><th>Gene</th><th>Valore</th></tr>
            <tr><td>CYP1A2 (Caffeina)</td><td>${geneticData.detox_capacity.cyp1a2}</td></tr>
            <tr><td>GSTM1</td><td>${geneticData.detox_capacity.gstm1}</td></tr>
            <tr><td>GSTT1</td><td>${geneticData.detox_capacity.gstt1}</td></tr>
            <tr><td>SOD2</td><td>${geneticData.detox_capacity.sod2}</td></tr>
          </table>

          <h3>Geni Performance</h3>
          ${geneticData.performance_genes
            .map(
              (g) => `
            <div class="bacteria-card">
              <strong>${g.gene}</strong> (${g.rsid}): ${g.genotype}
              <br><small>${g.effect}</small>
              ${g.interventions.length > 0 ? `<br><small>Interventi: ${g.interventions.join(", ")}</small>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
        `
            : ""
        }

        ${
          bloodData
            ? `
        <div class="section">
          <h2>Esami Sangue</h2>
          
          <h3>Carenze</h3>
          <div>${bloodData.deficiencies.map((d) => `<span class="badge badge-orange">${d}</span>`).join("")}</div>
          
          <h3>Valori Elevati</h3>
          <div>${bloodData.elevations.map((e) => `<span class="badge badge-red">${e}</span>`).join("")}</div>

          <h3>Marker Dettaglio</h3>
          <table>
            <tr><th>Marker</th><th>Valore</th><th>Range</th><th>Status</th><th>Intervento</th></tr>
            ${bloodData.markers
              .map(
                (m) => `
              <tr>
                <td>${m.name}</td>
                <td>${m.value} ${m.unit}</td>
                <td>${m.reference.min}-${m.reference.max}</td>
                <td class="status-${m.status === "normal" ? "normal" : m.status === "low" ? "low" : "high"}">${m.status}</td>
                <td>${m.nutritional_intervention || "-"}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </div>
        `
            : ""
        }

        <div class="section">
          <h2>Modulo 11 - Mappa Alimenti → Batteri</h2>
          <table>
            <tr><th>Alimento</th><th>Categoria</th><th>Batteri Target</th><th>Pathway</th><th>Timing</th></tr>
            ${FOOD_BACTERIA_DATABASE.slice(0, 10)
              .map(
                (f) => `
              <tr>
                <td>${f.food}</td>
                <td>${f.category}</td>
                <td>${f.target_bacteria.join(", ")}</td>
                <td>${f.metabolic_pathway}</td>
                <td>${f.timing}</td>
              </tr>
            `,
              )
              .join("")}
          </table>
        </div>

        <div class="section">
          <h2>Modulo 12 - Target Epigenetico</h2>
          <p><strong>Regola Aurea:</strong> Il Modulo 12 non aggiunge. Ottimizza ciò che esiste.</p>
          
          <h3>Vie Metaboliche</h3>
          ${METABOLIC_PATHWAYS.map(
            (p) => `
            <div class="pathway-card">
              <strong>${p.name}</strong>: ${p.description}
              <br><small>Trigger: ${p.training_trigger}</small>
              <br><small>Nutrienti: ${p.nutrients.join(", ")}</small>
            </div>
          `,
          ).join("")}

          ${
            metabolicTargets.length > 0
              ? `
          <h3>Target Attivi</h3>
          ${metabolicTargets
            .map(
              (t) => `
            <div class="pathway-card">
              <strong>${t.pathway}</strong> - Status: ${t.current_status}
              <br>Stimulus: ${t.training_stimulus}
              <br>Intervento: ${t.intervention}
              <br>Timing: ${t.timing}
            </div>
          `,
            )
            .join("")}
          `
              : ""
          }
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Dna className="h-6 w-6 text-violet-500" />
            Microbiome & Epigenetic
          </h2>
          <p className="text-muted-foreground">
            Analisi per {selectedDayLabel}
            {selectedDayWorkout?.title && ` - ${selectedDayWorkout.title}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {athleteId && (
            <>
              <AIAnalysisButton
                athleteId={athleteId}
                endpoint="microbiome"
                buttonText="AI Microbioma"
                context="Analisi interazioni microbioma-allenamento, pathway metabolici, protocollo pro/prebiotici"
              />
              <AIAnalysisButton
                athleteId={athleteId}
                endpoint="epigenetics"
                buttonText="AI Epigenetica"
                context="Analisi geni metilati, interazioni gene-microbioma, nutrigenomica"
              />
            </>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <ToggleGroup
              type="single"
              value={String(selectedDay)}
              onValueChange={(val) => val && setSelectedDay(Number(val))}
              className="bg-muted rounded-lg p-1"
            >
              {DAYS.map((day) => {
                const hasWorkout = weekWorkouts.some((w) => {
                  const today = new Date()
                  const dayOfWeek = today.getDay() || 7
                  const monday = new Date(today)
                  monday.setDate(today.getDate() - dayOfWeek + 1)
                  const dayDate = new Date(monday)
                  dayDate.setDate(monday.getDate() + day.value - 1)
                  return w.activity_date === dayDate.toISOString().split("T")[0]
                })
                return (
                  <ToggleGroupItem
                    key={day.value}
                    value={String(day.value)}
                    className={`text-xs px-2 py-1 ${hasWorkout ? "data-[state=on]:bg-violet-500 data-[state=on]:text-white" : "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"}`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{day.label}</span>
                      {hasWorkout && <span className="w-1 h-1 rounded-full bg-current mt-0.5" />}
                    </div>
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </div>

          <Button variant="outline" size="sm" onClick={handleExportMicrobiomePDF} className="gap-2 bg-transparent">
            <Printer className="h-4 w-4" />
            Esporta PDF
          </Button>
        </div>
      </div>

      {selectedDayWorkout ? (
        <Card className="border-violet-200 bg-violet-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-violet-600" />
                <div>
                  <p className="font-medium">{selectedDayWorkout.title || "Allenamento"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDayWorkout.activity_type === "gym" ? "Palestra" : "Ciclismo"}
                    {selectedDayWorkout.duration_minutes && ` • ${selectedDayWorkout.duration_minutes} min`}
                    {selectedDayWorkout.tss && ` • TSS ${selectedDayWorkout.tss}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-violet-500">
                  {derivedTrainingDay.type.toUpperCase()}
                </Badge>
                {derivedTrainingDay.stimulus.map((s, i) => (
                  <Badge key={i} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-slate-500" />
              <div>
                <p className="font-medium">Giorno di Riposo</p>
                <p className="text-sm text-muted-foreground">
                  Focus su recupero - AMPK pathway attivo, mTOR in stand-by
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports loaded */}
      {reports.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {reports.map((report) => {
            const TypeIcon = REPORT_TYPES.find((t) => t.value === report.type)?.icon || FileText
            return (
              <Badge key={report.id} variant="secondary" className="gap-1 py-1">
                <TypeIcon className="h-3 w-3" />
                {report.name}
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              </Badge>
            )
          })}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
<TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="overview" className="gap-1">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="microbiome" className="gap-1">
              <Bug className="h-4 w-4" />
              <span className="hidden sm:inline">Mod. 10</span>
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="gap-1">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Storico</span>
            </TabsTrigger>
            <TabsTrigger value="food-bacteria" className="gap-1">
              <Leaf className="h-4 w-4" />
              <span className="hidden sm:inline">Mod. 11</span>
            </TabsTrigger>
            <TabsTrigger value="epigenetic" className="gap-1">
              <Dna className="h-4 w-4" />
              <span className="hidden sm:inline">Mod. 12</span>
            </TabsTrigger>
          </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Microbiome Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bug className="h-4 w-4 text-green-500" />
                  Profilo Microbiotico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {microbiomeData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Diversità (Shannon)</span>
                      <span className="font-medium">{microbiomeData.diversity_index.toFixed(1)}</span>
                    </div>
                    <Progress value={microbiomeData.diversity_index * 25} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>F/B Ratio</span>
                      <Badge
                        variant="outline"
                        className={
                          microbiomeData.firmicutes_bacteroidetes_ratio > 2 ? "text-orange-500" : "text-green-500"
                        }
                      >
                        {microbiomeData.firmicutes_bacteroidetes_ratio.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Butyrate Capacity</span>
                      <span className="font-medium">{microbiomeData.functional_capacity.butyrate_production}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessun test microbiota caricato</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setSelectedReportType("microbiome")
                        setImportDialogOpen(true)
                      }}
                    >
                      Importa test
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Genetic Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Dna className="h-4 w-4 text-purple-500" />
                  Profilo Genetico
                </CardTitle>
              </CardHeader>
              <CardContent>
                {geneticData ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Metilazione</span>
                      <Badge className={getStatusColor(geneticData.methylation_capacity.overall_capacity)}>
                        {geneticData.methylation_capacity.overall_capacity}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>MTHFR 677</span>
                      <span className="font-mono">{geneticData.methylation_capacity.mthfr_677}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Detox</span>
                      <Badge className={getStatusColor(geneticData.detox_capacity.overall_capacity)}>
                        {geneticData.detox_capacity.overall_capacity}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>CYP1A2 (Caffeine)</span>
                      <Badge variant="outline">{geneticData.detox_capacity.cyp1a2}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Dna className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessun test genetico caricato</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setSelectedReportType("genetic")
                        setImportDialogOpen(true)
                      }}
                    >
                      Importa test
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blood Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-red-500" />
                  Esami Sangue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bloodData ? (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Carenze:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bloodData.deficiencies.map((d) => (
                          <Badge key={d} variant="outline" className="text-orange-500 text-xs">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Elevati:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {bloodData.elevations.map((e) => (
                          <Badge key={e} variant="outline" className="text-red-500 text-xs">
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nessun esame sangue caricato</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setSelectedReportType("blood")
                        setImportDialogOpen(true)
                      }}
                    >
                      Importa esami
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Stato Integrazione bioMAP</CardTitle>
              <CardDescription>Gerarchia override secondo MERGE RULE (Costituzione v2)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  {
                    level: 1,
                    name: "Allenamento del giorno",
                    status: derivedTrainingDay ? "active" : "missing",
                    detail: derivedTrainingDay?.type || "N/A",
                  },
                  {
                    level: 2,
                    name: "Metabolic Layer",
                    status: metabolicProfile?.ftp ? "active" : "missing",
                    detail: metabolicProfile?.ftp ? `FTP: ${metabolicProfile.ftp}W` : "N/A",
                  },
                  {
                    level: 3,
                    name: "Report Sangue",
                    status: bloodData ? "active" : "missing",
                    detail: bloodData ? `${bloodData.deficiencies.length} carenze` : "N/A",
                  },
                  {
                    level: 4,
                    name: "Report Microbiota",
                    status: microbiomeData ? "active" : "missing",
                    detail: microbiomeData ? `Diversity: ${microbiomeData.diversity_index.toFixed(1)}` : "N/A",
                  },
                  {
                    level: 5,
                    name: "Report Epigenetico",
                    status: geneticData ? "active" : "missing",
                    detail: geneticData ? `MTHFR: ${geneticData.methylation_capacity.mthfr_677}` : "N/A",
                  },
                ].map((item) => (
                  <div key={item.level} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {item.level}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    {item.status === "active" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module 10: Microbiome Profile */}
        <TabsContent value="microbiome" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-green-500" />
                Modulo 10 - Profilo Microbiotico Funzionale
              </CardTitle>
              <CardDescription>Analisi batteri chiave, capacità funzionale e marcatori infiammatori</CardDescription>
            </CardHeader>
            <CardContent>
              {microbiomeData ? (
                <div className="space-y-6">
                  {/* Keystone Species */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Batteri Keystone
                    </h4>
                    <div className="space-y-3">
                      {microbiomeData.keystone_species.map((bacteria, i) => (
                        <div key={i} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{bacteria.name}</span>
                            <Badge className={getStatusColor(bacteria.status)}>
                              {bacteria.abundance}% ({bacteria.status})
                            </Badge>
                          </div>
                          <Progress
                            value={(bacteria.abundance / bacteria.reference_range.max) * 100}
                            className="h-2 mb-2"
                          />
                          <p className="text-xs text-muted-foreground">
                            Range ottimale: {bacteria.reference_range.min}-{bacteria.reference_range.max}%
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {bacteria.metabolic_function.map((fn, j) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {fn}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pathogenic Markers */}
                  {microbiomeData.pathogenic_markers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        Marker Patogeni
                      </h4>
                      <div className="space-y-2">
                        {microbiomeData.pathogenic_markers.map((bacteria, i) => (
                          <div key={i} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{bacteria.name}</span>
                              <Badge className="text-red-500 bg-red-500/10">{bacteria.abundance}% (ALTO)</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Target: {"<"}
                              {bacteria.reference_range.max}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Functional Capacity */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Capacità Funzionale
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries({
                        "Produzione Butyrate": microbiomeData.functional_capacity.butyrate_production,
                        "Metabolismo Lattato": microbiomeData.functional_capacity.lactate_metabolism,
                        "Fermentazione Proteine": microbiomeData.functional_capacity.protein_fermentation,
                        "Fermentazione CHO": microbiomeData.functional_capacity.carb_fermentation,
                      }).map(([label, value]) => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{label}</span>
                            <span className="font-medium">{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SCFA Profile */}
                  <div>
                    <h4 className="font-medium mb-3">Profilo SCFA (Acidi Grassi a Catena Corta)</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {["Butyrato", "Propionato", "Acetato", "Totale"].map((name, i) => {
                        const values = [
                          microbiomeData.scfa_production.butyrate,
                          microbiomeData.scfa_production.propionate,
                          microbiomeData.scfa_production.acetate,
                          microbiomeData.scfa_production.total,
                        ]
                        return (
                          <div key={name} className="text-center p-2 rounded-lg bg-muted">
                            <p className="text-2xl font-bold">{values[i]}</p>
                            <p className="text-xs text-muted-foreground">{name}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bug className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Nessun Test Microbiota</h3>
                  <p className="text-muted-foreground mb-4">
                    Importa un test del microbiota per visualizzare il profilo funzionale
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedReportType("microbiome")
                      setImportDialogOpen(true)
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importa Test Microbiota
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Analisi AI del Microbioma
              </CardTitle>
              <CardDescription>
                Analisi avanzata con AI: database scientifici, pathway metabolici, raccomandazioni personalizzate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAiAnalyzing && (
                <div className="text-center py-8">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-purple-500" />
                  <p className="font-medium">{aiAnalysisStep || "Analisi in corso..."}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    L'AI sta consultando database scientifici e analizzando i pathway...
                  </p>
                </div>
              )}

              {!isAiAnalyzing && !aiAnalysisResults && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Importa un test del microbiota per attivare l'analisi AI avanzata</p>
                  <Button onClick={() => { setSelectedReportType("microbiome"); setImportDialogOpen(true); }}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importa Test Microbiota
                  </Button>
                </div>
              )}

              {aiAnalysisResults && (
                <div className="space-y-6">
                  {/* Key Findings */}
                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-500" />
                      Risultati Chiave
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{aiAnalysisResults.diversityIndex?.toFixed(2) || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">Indice Shannon</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{aiAnalysisResults.firmicutesBacteroidetesRatio?.toFixed(2) || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">Ratio F/B</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                        <Badge className={`text-sm ${aiAnalysisResults.overallHealth === "optimal" ? "bg-green-500" : aiAnalysisResults.overallHealth === "good" ? "bg-blue-500" : aiAnalysisResults.overallHealth === "suboptimal" ? "bg-yellow-500" : "bg-red-500"}`}>
                          {aiAnalysisResults.overallHealth || "N/A"}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">Salute Generale</div>
                      </div>
                    </div>
                    {aiAnalysisResults.keyFindings && (
                      <div className="space-y-1">
                        {aiAnalysisResults.keyFindings.map((finding: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{finding}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiAnalysisResults.riskFactors && aiAnalysisResults.riskFactors.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Fattori di Rischio:</p>
                        {aiAnalysisResults.riskFactors.map((risk: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{risk}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bacteria Analysis with Scientific Evidence */}
                  {aiAnalysisResults.bacteria && (
                    <div>
                      <h4 className="font-semibold mb-3">Batteri Analizzati con Evidenze Scientifiche</h4>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {aiAnalysisResults.bacteria.map((b: any, i: number) => (
                            <div key={i} className="p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{b.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{b.abundance}%</span>
                                  <Badge className={getStatusColor(b.status)}>{b.status}</Badge>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                Range: {b.referenceRange?.min}-{b.referenceRange?.max}%
                              </div>
                              
                              {/* Metabolic Functions */}
                              <div className="mb-2">
                                <span className="text-xs font-medium">Funzioni Metaboliche:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {b.metabolicFunctions?.map((f: string, j: number) => (
                                    <Badge key={j} variant="secondary" className="text-xs">{f}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Genetic Capabilities */}
                              {b.geneticCapabilities && b.geneticCapabilities.length > 0 && (
                                <div className="mb-2">
                                  <span className="text-xs font-medium">Capacita Genetiche:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {b.geneticCapabilities.map((g: string, j: number) => (
                                      <Badge key={j} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20">{g}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Toxic Potential */}
                              {b.toxicPotential && b.toxicPotential.level !== "none" && (
                                <div className="mb-2 p-2 rounded bg-red-50 dark:bg-red-950/20">
                                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                    Potenziale Tossico: {b.toxicPotential.level}
                                  </span>
                                  {b.toxicPotential.substances?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {b.toxicPotential.substances.map((s: string, j: number) => (
                                        <Badge key={j} variant="destructive" className="text-xs">{s}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Scientific Evidence */}
                              {b.scientificEvidence && b.scientificEvidence.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <span className="text-xs font-medium">Evidenze Scientifiche:</span>
                                  <div className="mt-1 space-y-1">
                                    {b.scientificEvidence.slice(0, 2).map((e: any, j: number) => (
                                      <div key={j} className="text-xs p-1.5 rounded bg-muted">
                                        <span className="italic">"{e.finding}"</span>
                                        <span className="text-muted-foreground ml-1">- {e.source}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Pathway Analysis */}
                  {aiPathways && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-orange-500" />
                        Pathway Metabolici
                      </h4>
                      
                      {/* SCFA Production */}
                      {aiPathways.scfaProduction && (
                        <div className="p-4 rounded-lg border mb-4">
                          <h5 className="font-medium mb-3">Produzione SCFA</h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Butirrato</span>
                                <span>{aiPathways.scfaProduction.butyrate?.level || 0}%</span>
                              </div>
                              <Progress value={aiPathways.scfaProduction.butyrate?.level || 0} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">{aiPathways.scfaProduction.butyrate?.status}</p>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Propionato</span>
                                <span>{aiPathways.scfaProduction.propionate?.level || 0}%</span>
                              </div>
                              <Progress value={aiPathways.scfaProduction.propionate?.level || 0} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">{aiPathways.scfaProduction.propionate?.status}</p>
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Acetato</span>
                                <span>{aiPathways.scfaProduction.acetate?.level || 0}%</span>
                              </div>
                              <Progress value={aiPathways.scfaProduction.acetate?.level || 0} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">{aiPathways.scfaProduction.acetate?.status}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Toxic Metabolites */}
                      {aiPathways.toxicMetabolites && aiPathways.toxicMetabolites.length > 0 && (
                        <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 mb-4">
                          <h5 className="font-medium mb-3 text-red-600 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Metaboliti Tossici Potenziali
                          </h5>
                          <div className="space-y-2">
                            {aiPathways.toxicMetabolites.map((t: any, i: number) => (
                              <div key={i} className="p-2 rounded bg-white dark:bg-slate-900">
                                <div className="flex justify-between">
                                  <span className="font-medium text-sm">{t.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Prodotto da: {t.producedBy?.join(", ")}</p>
                                <p className="text-xs text-red-600 dark:text-red-400">Rischio: {t.healthRisk}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">Strategia: {t.detoxStrategy}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Recommendations */}
                  {aiRecommendations && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-500" />
                        Raccomandazioni Nutrizionali AI
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Foods to Eliminate */}
                        {aiRecommendations.foodsToEliminate && aiRecommendations.foodsToEliminate.length > 0 && (
                          <div className="p-4 rounded-lg border border-red-200 dark:border-red-800">
                            <h5 className="font-medium mb-3 text-red-600 dark:text-red-400">Alimenti da ELIMINARE</h5>
                            <div className="space-y-2">
                              {aiRecommendations.foodsToEliminate.map((f: any, i: number) => (
                                <div key={i} className="p-2 rounded bg-red-50 dark:bg-red-950/20">
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-sm">{f.food}</span>
                                    <Badge variant="destructive" className="text-xs">{f.priority}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{f.reason}</p>
                                  <p className="text-xs mt-1">Durata: {f.duration}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Foods to Introduce */}
                        {aiRecommendations.foodsToIntroduce && aiRecommendations.foodsToIntroduce.length > 0 && (
                          <div className="p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <h5 className="font-medium mb-3 text-green-600 dark:text-green-400">Alimenti da INTRODURRE</h5>
                            <div className="space-y-2">
                              {aiRecommendations.foodsToIntroduce.map((f: any, i: number) => (
                                <div key={i} className="p-2 rounded bg-green-50 dark:bg-green-950/20">
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-sm">{f.food}</span>
                                    <Badge className="text-xs bg-green-500">{f.priority}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{f.benefit}</p>
                                  <p className="text-xs mt-1">Timing: {f.timing} | Frequenza: {f.frequency}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Supplements */}
                      {aiRecommendations.supplementsRecommended && aiRecommendations.supplementsRecommended.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                          <h5 className="font-medium mb-3 text-purple-600 dark:text-purple-400">Supplementi Raccomandati</h5>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-2">Supplemento</th>
                                  <th className="text-left py-2 px-2">Dose</th>
                                  <th className="text-left py-2 px-2">Timing</th>
                                  <th className="text-left py-2 px-2">Motivo</th>
                                  <th className="text-left py-2 px-2">Priorita</th>
                                </tr>
                              </thead>
                              <tbody>
                                {aiRecommendations.supplementsRecommended.map((s: any, i: number) => (
                                  <tr key={i} className="border-b">
                                    <td className="py-2 px-2 font-medium">{s.name}</td>
                                    <td className="py-2 px-2">{s.dose}</td>
                                    <td className="py-2 px-2">{s.timing}</td>
                                    <td className="py-2 px-2 text-xs">{s.reason}</td>
                                    <td className="py-2 px-2">
                                      <Badge className={`text-xs ${s.priority === "essential" ? "bg-red-500" : s.priority === "recommended" ? "bg-yellow-500" : "bg-gray-500"}`}>
                                        {s.priority}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      {/* Probiotics */}
                      {aiRecommendations.probioticsRecommended && aiRecommendations.probioticsRecommended.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h5 className="font-medium mb-3 text-blue-600 dark:text-blue-400">Probiotici Consigliati</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {aiRecommendations.probioticsRecommended.map((p: any, i: number) => (
                              <div key={i} className="p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                                <span className="font-medium text-sm">{p.strain}</span>
                                <span className="text-xs ml-2">({p.cfu})</span>
                                <p className="text-xs text-muted-foreground">{p.benefit}</p>
                                <p className="text-xs">Timing: {p.timing}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab - Compare Tests Over Time */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Storico Test e Confronto nel Tempo
              </CardTitle>
              <CardDescription>
                Visualizza tutti i test caricati e confronta i cambiamenti nel tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historicalReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Nessun test caricato. Importa il tuo primo test per iniziare.</p>
                  <Button onClick={() => setImportDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importa Primo Test
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Action Bar */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{historicalReports.length} test caricati</p>
                      <p className="text-sm text-muted-foreground">
                        Seleziona 2 o piu test per confrontarli
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedReportsForComparison([])}
                        disabled={selectedReportsForComparison.length === 0}
                        className="bg-transparent"
                      >
                        Deseleziona Tutti
                      </Button>
                      <Button 
                        onClick={compareReports}
                        disabled={selectedReportsForComparison.length < 2}
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Confronta ({selectedReportsForComparison.length})
                      </Button>
                      <Button onClick={() => setImportDialogOpen(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Nuovo Test
                      </Button>
                    </div>
                  </div>
                  
                  {/* Timeline of Reports */}
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {historicalReports.map((report, index) => {
                        const isSelected = selectedReportsForComparison.includes(report.id)
                        const reportDate = new Date(report.created_at)
                        
                        return (
                          <div 
                            key={report.id}
                            className={`relative pl-10 cursor-pointer transition-all ${
                              isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedReportsForComparison(prev => prev.filter(id => id !== report.id))
                              } else {
                                setSelectedReportsForComparison(prev => [...prev, report.id])
                              }
                            }}
                          >
                            {/* Timeline Dot */}
                            <div className={`absolute left-2 top-4 w-4 h-4 rounded-full border-2 ${
                              isSelected 
                                ? "bg-primary border-primary" 
                                : "bg-background border-border"
                            }`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground absolute -top-0.5 -left-0.5" />}
                            </div>
                            
                            <Card className={`${isSelected ? "border-primary ring-2 ring-primary/20" : ""}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant={
                                        report.report_type === "microbiome" ? "default" :
                                        report.report_type === "genetic" ? "secondary" : "outline"
                                      }>
                                        {report.report_type === "microbiome" ? "Microbiota" :
                                         report.report_type === "genetic" ? "Genetico" : "Sangue"}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground">
                                        {reportDate.toLocaleDateString("it-IT", { 
                                          day: "numeric", 
                                          month: "long", 
                                          year: "numeric" 
                                        })}
                                      </span>
                                      {index === 0 && (
                                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 text-green-600">
                                          Piu Recente
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <h4 className="font-medium mb-2">{report.report_name || "Test " + (historicalReports.length - index)}</h4>
                                    
                                    {/* Key Metrics Preview */}
                                    {report.parsed_data && (
                                      <div className="grid grid-cols-3 gap-4 mt-3">
                                        {report.parsed_data.diversity_index && (
                                          <div className="text-center p-2 rounded bg-muted">
                                            <div className="text-lg font-bold">{report.parsed_data.diversity_index.toFixed(2)}</div>
                                            <div className="text-xs text-muted-foreground">Shannon Index</div>
                                          </div>
                                        )}
                                        {report.parsed_data.firmicutes_bacteroidetes_ratio && (
                                          <div className="text-center p-2 rounded bg-muted">
                                            <div className="text-lg font-bold">{report.parsed_data.firmicutes_bacteroidetes_ratio.toFixed(2)}</div>
                                            <div className="text-xs text-muted-foreground">Ratio F/B</div>
                                          </div>
                                        )}
                                        {report.ai_analysis?.overallHealth && (
                                          <div className="text-center p-2 rounded bg-muted">
                                            <Badge className={`${
                                              report.ai_analysis.overallHealth === "optimal" ? "bg-green-500" :
                                              report.ai_analysis.overallHealth === "good" ? "bg-blue-500" :
                                              report.ai_analysis.overallHealth === "suboptimal" ? "bg-yellow-500" : "bg-red-500"
                                            }`}>
                                              {report.ai_analysis.overallHealth}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1">Salute</div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* AI Summary if available */}
                                    {report.ai_analysis?.keyFindings && (
                                      <div className="mt-3 p-2 rounded bg-purple-50 dark:bg-purple-950/20">
                                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">AI Summary:</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {report.ai_analysis.keyFindings.slice(0, 2).join(". ")}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-4">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Load this report's data
                                        if (report.parsed_data) {
                                          setMicrobiomeData(report.parsed_data)
                                        }
                                        if (report.ai_analysis) {
                                          setAiAnalysisResults(report.ai_analysis)
                                        }
                                        if (report.ai_recommendations) {
                                          setAiRecommendations(report.ai_recommendations)
                                        }
                                        if (report.ai_pathways) {
                                          setAiPathways(report.ai_pathways)
                                        }
                                      }}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Comparison Dialog */}
          <Dialog open={showComparisonDialog} onOpenChange={setShowComparisonDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Confronto Test nel Tempo
                </DialogTitle>
                <DialogDescription>
                  Analisi delle variazioni tra i test selezionati
                </DialogDescription>
              </DialogHeader>
              
              {comparisonData && (
                <div className="space-y-6">
                  {/* Date Range */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Primo test</p>
                        <p className="font-medium">
                          {new Date(comparisonData.reports[0]?.created_at).toLocaleDateString("it-IT", { 
                            day: "numeric", month: "long", year: "numeric" 
                          })}
                        </p>
                      </div>
                      <div className="flex-1 mx-4 border-t border-dashed" />
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Ultimo test</p>
                        <p className="font-medium">
                          {new Date(comparisonData.reports[comparisonData.reports.length - 1]?.created_at).toLocaleDateString("it-IT", { 
                            day: "numeric", month: "long", year: "numeric" 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trends */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Diversity Index Trend */}
                    {comparisonData.trends?.diversityIndex && (
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3">Indice di Diversita (Shannon)</h4>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{comparisonData.trends.diversityIndex.first.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Primo test</div>
                            </div>
                            <div className="flex-1 mx-4 flex items-center justify-center">
                              <Badge className={`${
                                comparisonData.trends.diversityIndex.trend === "improving" ? "bg-green-500" :
                                comparisonData.trends.diversityIndex.trend === "declining" ? "bg-red-500" : "bg-gray-500"
                              }`}>
                                {comparisonData.trends.diversityIndex.change > 0 ? "+" : ""}
                                {comparisonData.trends.diversityIndex.change.toFixed(2)}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{comparisonData.trends.diversityIndex.last.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Ultimo test</div>
                            </div>
                          </div>
                          <p className={`text-sm text-center ${
                            comparisonData.trends.diversityIndex.trend === "improving" ? "text-green-600" :
                            comparisonData.trends.diversityIndex.trend === "declining" ? "text-red-600" : "text-gray-600"
                          }`}>
                            {comparisonData.trends.diversityIndex.trend === "improving" ? "In miglioramento" :
                             comparisonData.trends.diversityIndex.trend === "declining" ? "In diminuzione" : "Stabile"}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* F/B Ratio Trend */}
                    {comparisonData.trends?.fbRatio && (
                      <Card>
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-3">Ratio Firmicutes/Bacteroidetes</h4>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-center">
                              <div className="text-2xl font-bold">{comparisonData.trends.fbRatio.first.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Primo test</div>
                            </div>
                            <div className="flex-1 mx-4 flex items-center justify-center">
                              <Badge className={`${
                                comparisonData.trends.fbRatio.trend === "stable" ? "bg-green-500" : "bg-yellow-500"
                              }`}>
                                {comparisonData.trends.fbRatio.change > 0 ? "+" : ""}
                                {comparisonData.trends.fbRatio.change.toFixed(2)}
                              </Badge>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold">{comparisonData.trends.fbRatio.last.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Ultimo test</div>
                            </div>
                          </div>
                          <p className="text-sm text-center text-muted-foreground">
                            Range ottimale: 1.0 - 2.0
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {/* Detailed Comparison Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Dettaglio Confronto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2">Data</th>
                              <th className="text-left py-2 px-2">Shannon Index</th>
                              <th className="text-left py-2 px-2">Ratio F/B</th>
                              <th className="text-left py-2 px-2">Salute</th>
                              <th className="text-left py-2 px-2">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonData.reports.map((report: any, i: number) => (
                              <tr key={report.id} className="border-b">
                                <td className="py-2 px-2">
                                  {new Date(report.created_at).toLocaleDateString("it-IT")}
                                </td>
                                <td className="py-2 px-2 font-medium">
                                  {report.parsed_data?.diversity_index?.toFixed(2) || "-"}
                                </td>
                                <td className="py-2 px-2 font-medium">
                                  {report.parsed_data?.firmicutes_bacteroidetes_ratio?.toFixed(2) || "-"}
                                </td>
                                <td className="py-2 px-2">
                                  {report.ai_analysis?.overallHealth ? (
                                    <Badge className={`text-xs ${
                                      report.ai_analysis.overallHealth === "optimal" ? "bg-green-500" :
                                      report.ai_analysis.overallHealth === "good" ? "bg-blue-500" :
                                      report.ai_analysis.overallHealth === "suboptimal" ? "bg-yellow-500" : "bg-red-500"
                                    }`}>
                                      {report.ai_analysis.overallHealth}
                                    </Badge>
                                  ) : "-"}
                                </td>
                                <td className="py-2 px-2 text-xs text-muted-foreground">
                                  {report.ai_analysis?.keyFindings?.[0]?.slice(0, 50) || "-"}...
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowComparisonDialog(false)} className="bg-transparent">
                  Chiudi
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Stampa Confronto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Module 11: Food -> Bacteria Mapping */}
        <TabsContent value="food-bacteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-500" />
                Modulo 11 - Mappa Alimenti → Batteri + Protocollo
              </CardTitle>
              <CardDescription>Alimenti modulatori del microbiota personalizzati sul tuo profilo</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Driver Section (11A) */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">11A - Driver Principali (max 3)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {microbiomeData ? (
                    <>
                      {microbiomeData.keystone_species
                        .filter((b) => b.status === "low")
                        .slice(0, 2)
                        .map((bacteria, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                            <Badge className="text-orange-500 bg-orange-500/10 mb-2">Aumentare</Badge>
                            <p className="font-medium text-sm">{bacteria.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {bacteria.abundance}% → target {bacteria.reference_range.min}-
                              {bacteria.reference_range.max}%
                            </p>
                          </div>
                        ))}
                      {microbiomeData.pathogenic_markers
                        .filter((b) => b.status === "high")
                        .slice(0, 1)
                        .map((bacteria, i) => (
                          <div key={i} className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                            <Badge className="text-red-500 bg-red-500/10 mb-2">Ridurre</Badge>
                            <p className="font-medium text-sm">{bacteria.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {bacteria.abundance}% → target {"<"}
                              {bacteria.reference_range.max}%
                            </p>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="col-span-3 text-center py-4 text-muted-foreground">
                      Importa test microbiota per vedere i driver
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Food -> Bacteria -> Pathway (11B) */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">11B - Food → Batteri → Via Metabolica</h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {(foodBacteriaProtocol.length > 0 ? foodBacteriaProtocol : FOOD_BACTERIA_DATABASE.slice(0, 8)).map(
                      (mapping, i) => (
                        <div key={i} className="p-3 rounded-lg border flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{mapping.food}</span>
                              <Badge variant="outline" className="text-xs">
                                {mapping.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                              <span>→</span>
                              {mapping.target_bacteria.map((b, j) => (
                                <Badge key={j} variant="secondary" className="text-xs">
                                  {b}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Zap className="h-3 w-3" />
                              <span>{mapping.metabolic_pathway}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs mb-1">
                              {mapping.timing}
                            </Badge>
                            {mapping.contraindications.length > 0 && (
                              <p className="text-xs text-red-500">⚠️ {mapping.contraindications[0]}</p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </ScrollArea>
              </div>

              <Separator className="my-4" />

              {/* Protocol Table (11C) */}
              <div>
                <h4 className="font-medium mb-3">11C - Protocollo Operativo</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Intervento</th>
                        <th className="text-left py-2 px-3">Dose</th>
                        <th className="text-left py-2 px-3">Timing</th>
                        <th className="text-left py-2 px-3">Pathway</th>
                        <th className="text-left py-2 px-3">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          intervento: "Fibre prebiotiche (inulina)",
                          dose: "5-10g",
                          timing: "Cena giorni LOW",
                          pathway: "Butyrate ↑",
                          note: "Evitare pre-HI",
                        },
                        {
                          intervento: "Polifenoli (mirtilli)",
                          dose: "100-150g",
                          timing: "Post-workout o colazione",
                          pathway: "Akkermansia ↑",
                          note: "Sinergia con omega-3",
                        },
                        {
                          intervento: "Kefir",
                          dose: "200mL",
                          timing: "Colazione",
                          pathway: "Colonization",
                          note: "Se tollerato lattosio",
                        },
                        {
                          intervento: "Omega-3 (pesce)",
                          dose: "2-3 porzioni/week",
                          timing: "Pranzo/cena",
                          pathway: "Anti-infiammatorio",
                          note: "Obbligatorio con pasti",
                        },
                        {
                          intervento: "Amido resistente",
                          dose: "20-30g",
                          timing: "Pranzo giorni LOW",
                          pathway: "Butyrate + barrier",
                          note: "Patate/riso freddi",
                        },
                      ].map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2 px-3 font-medium">{row.intervento}</td>
                          <td className="py-2 px-3">{row.dose}</td>
                          <td className="py-2 px-3">{row.timing}</td>
                          <td className="py-2 px-3">
                            <Badge variant="outline" className="text-xs">
                              {row.pathway}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module 12: Epigenetic Targets */}
        <TabsContent value="epigenetic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="h-5 w-5 text-purple-500" />
                Modulo 12 - Target Metabolico Epigenetico
              </CardTitle>
              <CardDescription>
                Ottimizzazione delle vie metaboliche basata su training + profilo genetico + microbiota
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Golden Rule */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200 dark:border-purple-800 mb-6">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Regola Aurea: Il Modulo 12 non aggiunge. Ottimizza ciò che esiste.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  EMPATHY amplifica solo le vie metaboliche già attivate da allenamento, nutrizione, timing e vincoli
                  biologici.
                </p>
              </div>

              {/* Metabolic Pathways */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Vie Metaboliche</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {METABOLIC_PATHWAYS.map((pathway) => (
                    <div key={pathway.id} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{pathway.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{pathway.description}</p>
                      <div className="text-xs">
                        <p className="mb-1">
                          <strong>Trigger:</strong> {pathway.training_trigger}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {pathway.nutrients.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {n}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-4" />

              {/* Active Targets */}
              <div>
                <h4 className="font-medium mb-3">
                  Target Attivi (basati su giorno {derivedTrainingDay?.type || "N/A"})
                </h4>
                {metabolicTargets.length > 0 ? (
                  <div className="space-y-4">
                    {metabolicTargets.map((target, i) => (
                      <div key={i} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <span className="font-medium text-lg">{target.pathway}</span>
                          </div>
                          <Badge className={getStatusColor(target.current_status)}>{target.current_status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Training Stimulus</p>
                            <p className="font-medium">{target.training_stimulus}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Genetic Capacity</p>
                            <p className="font-medium">{target.genetic_capacity}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Microbiome Support</p>
                            <p className="font-medium">{target.microbiome_support}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Timing</p>
                            <p className="font-medium">{target.timing}</p>
                          </div>
                        </div>
                        <div className="mt-3 p-2 rounded bg-muted">
                          <p className="text-sm">
                            <strong>Intervento:</strong> {target.intervention}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Outcome atteso:</strong> {target.expected_outcome}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Importa report biologici per generare target metabolici personalizzati</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReportType("microbiome")
                          setImportDialogOpen(true)
                        }}
                      >
                        <Bug className="h-4 w-4 mr-1" /> Microbiota
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReportType("genetic")
                          setImportDialogOpen(true)
                        }}
                      >
                        <Dna className="h-4 w-4 mr-1" /> Genetico
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReportType("blood")
                          setImportDialogOpen(true)
                        }}
                      >
                        <Droplets className="h-4 w-4 mr-1" /> Sangue
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* AMPK vs mTOR Rule */}
              {(derivedTrainingDay?.type === "high" || derivedTrainingDay?.type === "quality") && (
                <div className="mt-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    Regola AMPK ↔ mTOR (LOCK)
                  </h4>
                  <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-400">
                    <li>
                      • <strong>Durante:</strong> AMPK ON, mTOR OFF - No leucina, no HMB
                    </li>
                    <li>
                      • <strong>Post (0-30min):</strong> mTOR ON - Leucina 3g + Proteine complete
                    </li>
                    <li>
                      • <strong>Antiossidanti potenti:</strong> MAI pre-HI (bloccano adattamento)
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 hidden">
            {" "}
            {/* Hidden trigger, opened programmatically */}
            <Upload className="h-4 w-4" />
            Importa Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importa Test / Report</DialogTitle>
            <DialogDescription>
              Carica test microbiota, genetici o esami del sangue per integrare i dati nel profilo bioMAP
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Report type selection */}
            <div className="space-y-2">
              <Label>Tipo di Report</Label>
              <div className="grid grid-cols-3 gap-2">
                {REPORT_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={selectedReportType === type.value ? "default" : "outline"}
                      className="flex flex-col h-auto py-4 gap-2"
                      onClick={() => setSelectedReportType(type.value)}
                    >
                      <Icon className={`h-6 w-6 ${selectedReportType === type.value ? "" : type.color}`} />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

{/* File upload */}
  <div className="space-y-2">
  <Label>Carica File (PDF, TXT, JSON, CSV)</Label>
  <Input type="file" accept=".pdf,.txt,.json,.csv" onChange={handleFileUpload} />
  
  
  
  {pdfParseError && (
  <div className="p-4 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">Come importare un file PDF:</p>
    <ol className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-decimal list-inside">
      <li>Apri il file PDF con un lettore PDF (Adobe, Preview, Chrome)</li>
      <li>Seleziona tutto il testo (Ctrl+A su Windows, Cmd+A su Mac)</li>
      <li>Copia il testo (Ctrl+C su Windows, Cmd+C su Mac)</li>
      <li>Incolla il testo nella textarea qui sotto (Ctrl+V o Cmd+V)</li>
    </ol>
  </div>
  )}
  
  {importFile && !pdfParseError && (
  <div className="p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
  <p className="text-sm text-green-700 dark:text-green-400">File selezionato: {importFile.name}</p>
  {importText && <p className="text-xs text-muted-foreground mt-1">Contenuto estratto: {importText.length} caratteri</p>}
  </div>
  )}
  </div>
  
  {/* Manual text input */}
  <div className="space-y-2">
  <Label>Oppure incolla i dati del report manualmente</Label>
  <Textarea
  placeholder="Incolla qui i risultati del test del microbiota...

Esempio formato:
Bacteroides: 35.2%
Firmicutes: 45.8%
Akkermansia muciniphila: 2.1%
Bifidobacterium: 5.3%
..."
  className="min-h-[200px] font-mono text-sm"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
            </div>

            {isUploading && (
              <div className="space-y-2 text-center">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}% caricato...</p>
              </div>
            )}
            
            {isAiAnalyzing && (
              <div className="space-y-3 text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-purple-500" />
                <p className="font-medium text-purple-700 dark:text-purple-300">{aiAnalysisStep}</p>
                <p className="text-xs text-muted-foreground">
                  L'AI sta analizzando i batteri, consultando database scientifici e generando raccomandazioni personalizzate...
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleImportReport} disabled={(!importFile && !importText) || isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analizzando...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Analizza e Importa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MicrobiomeEpigenetic
