import { generateText } from "ai"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 60

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface MicrobiomeData {
  bacteria: Array<{
    name: string
    abundance: number
    status: string
  }>
  pathways?: Record<string, any>
  metabolites?: Record<string, any>
}

interface MetabolicProfile {
  ftp_watts: number | null
  vo2max: number | null
  vlamax: number | null
  weight_kg: number | null
  body_fat_percent: number | null
  lean_body_mass_kg: number | null
  empathy_zones: Record<string, any> | null
  fat_max_watts: number | null
}

interface AthleteProfile {
  birth_date: string | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  body_fat_percent: number | null
  wake_time: string | null
  breakfast_time: string | null
  training_time: string | null
  lunch_time: string | null
  dinner_time: string | null
  sleep_time: string | null
}

interface AthleteConstraints {
  intolerances: string[]
  allergies: string[]
  dietary_limits: string[]
  dietary_preferences: string[]
  notes: string | null // Contains sport_supplements, training_preferences
}

interface TrainingActivity {
  id: string
  activity_date: string
  sport_type: string
  duration_minutes: number
  tss: number | null
  title: string | null
  primary_zone: string | null
  distance_km: number | null
  avg_power: number | null
  avg_hr: number | null
}

interface DailyMetrics {
  ctl: number
  atl: number
  tsb: number
  ramp_rate: number
}

export async function POST(request: Request) {
  try {
    const { athleteId } = await request.json()

    if (!athleteId) {
      return Response.json({ error: "athleteId required" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // ========================================
    // 1. FETCH ALL ATHLETE DATA IN PARALLEL
    // ========================================
    const [
      athleteResult,
      constraintsResult,
      metabolicResult,
      microbiomeResult,
      activitiesResult,
      metricsResult,
      lifestyleResult
    ] = await Promise.all([
      // Athlete profile
      supabase
        .from("athletes")
        .select("*")
        .eq("id", athleteId)
        .single(),
      
      // Constraints (allergies, intolerances, supplements, preferences)
      supabase
        .from("athlete_constraints")
        .select("*")
        .eq("athlete_id", athleteId)
        .single(),
      
      // Metabolic profile (FTP, VLamax, zones, consumption)
      supabase
        .from("metabolic_profiles")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("is_current", true)
        .single(),
      
      // Microbiome data
      supabase
        .from("microbiome_reports")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
      
      // Training activities (last 30 days)
      supabase
        .from("training_activities")
        .select("*")
        .eq("athlete_id", athleteId)
        .gte("activity_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("activity_date", { ascending: false }),
      
      // Daily metrics (CTL, ATL, TSB)
      supabase
        .from("daily_metrics")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("metric_date", { ascending: false })
        .limit(1)
        .single(),
      
      // Lifestyle sessions
      supabase
        .from("training_activities")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("sport", "lifestyle")
        .gte("activity_date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // ========================================
    // 2. PARSE AND STRUCTURE DATA
    // ========================================
    const athleteProfile: AthleteProfile | null = athleteResult.data
    const constraints: AthleteConstraints | null = constraintsResult.data
    const metabolicProfile: MetabolicProfile | null = metabolicResult.data
    const microbiomeReport = microbiomeResult.data
    const activities: TrainingActivity[] = activitiesResult.data || []
    const dailyMetrics: DailyMetrics | null = metricsResult.data
    const lifestyleSessions = lifestyleResult.data || []

    // Parse constraints notes for sport supplements and training preferences
    let sportSupplements: { brands: string[], types: string[] } = { brands: [], types: [] }
    let trainingPreferences: { preferred_rest_days: string[], preferred_training_time: string, coach_notes: string } | null = null
    
    if (constraints?.notes) {
      try {
        const parsedNotes = JSON.parse(constraints.notes)
        sportSupplements = parsedNotes.sport_supplements || { brands: [], types: [] }
        trainingPreferences = parsedNotes.training_preferences || null
      } catch (e) {
        console.error("Error parsing constraints notes:", e)
      }
    }

    // Parse microbiome data
    let microbiomeData: MicrobiomeData | null = null
    if (microbiomeReport?.report_data) {
      const reportData = typeof microbiomeReport.report_data === 'string' 
        ? JSON.parse(microbiomeReport.report_data) 
        : microbiomeReport.report_data
      
      microbiomeData = {
        bacteria: reportData.bacteria || [],
        pathways: reportData.pathways || {},
        metabolites: reportData.metabolites || {}
      }
    }

    // Calculate training summary
    const trainingSummary = {
      totalActivities: activities.length,
      totalDuration: activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0),
      totalTSS: activities.reduce((sum, a) => sum + (a.tss || 0), 0),
      avgTSSPerDay: activities.length > 0 
        ? Math.round(activities.reduce((sum, a) => sum + (a.tss || 0), 0) / 30)
        : 0,
      sportTypes: [...new Set(activities.map(a => a.sport_type))],
      zoneDistribution: calculateZoneDistribution(activities),
      weeklyVolume: calculateWeeklyVolume(activities)
    }

    // Calculate age
    const age = athleteProfile?.birth_date 
      ? Math.floor((Date.now() - new Date(athleteProfile.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    // ========================================
    // 3. BUILD AI PROMPT
    // ========================================
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt({
      athleteProfile,
      age,
      constraints,
      sportSupplements,
      trainingPreferences,
      metabolicProfile,
      microbiomeData,
      trainingSummary,
      dailyMetrics,
      lifestyleSessions,
      recentActivities: activities.slice(0, 10)
    })

    // ========================================
    // 4. CALL AI
    // ========================================
    const { text } = await generateText({
      model: "anthropic/claude-sonnet-4-20250514",
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 4000
    })

    // Parse AI response
    let aiResponse
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        aiResponse = { summary: text, recommendations: [] }
      }
    } catch (e) {
      aiResponse = { summary: text, recommendations: [] }
    }

    return Response.json({
      success: true,
      analysis: aiResponse,
      dataUsed: {
        hasAthleteProfile: !!athleteProfile,
        hasConstraints: !!constraints,
        hasMetabolicProfile: !!metabolicProfile,
        hasMicrobiome: !!microbiomeData,
        activitiesCount: activities.length,
        hasMetrics: !!dailyMetrics
      }
    })

  } catch (error) {
    console.error("AI Coach Advisor error:", error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

function calculateZoneDistribution(activities: TrainingActivity[]): Record<string, number> {
  const zoneCounts: Record<string, number> = {}
  activities.forEach(a => {
    const zone = a.primary_zone || "unknown"
    zoneCounts[zone] = (zoneCounts[zone] || 0) + (a.duration_minutes || 0)
  })
  return zoneCounts
}

function calculateWeeklyVolume(activities: TrainingActivity[]): { hours: number, tss: number }[] {
  const weeks: Record<string, { hours: number, tss: number }> = {}
  activities.forEach(a => {
    const date = new Date(a.activity_date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeks[weekKey]) weeks[weekKey] = { hours: 0, tss: 0 }
    weeks[weekKey].hours += (a.duration_minutes || 0) / 60
    weeks[weekKey].tss += a.tss || 0
  })
  return Object.values(weeks)
}

function buildSystemPrompt(): string {
  return `Sei EMPATHY AI Coach, un consulente esperto di fisiologia dello sport, nutrizione sportiva, e microbioma intestinale.
Il tuo compito e' analizzare i dati dell'atleta e fornire consigli PRATICI e PERSONALIZZATI.

AREE DI COMPETENZA:
1. MICROBIOMA & METABOLISMO
   - Interazioni batteri-pathway metabolici
   - Effetti su assorbimento nutrienti
   - Produzione gas (CO2, metano, H2S) e impatto performance
   - Candida, SIBO, disbiosi e conseguenze su recupero

2. TRAINING & ADATTAMENTO
   - Zone metaboliche e substrati energetici
   - Periodizzazione e carico (TSS, CTL, ATL, TSB)
   - Adattamenti aerobici vs anaerobici
   - Interazione microbioma-esercizio

3. NUTRIZIONE SPORTIVA
   - Timing nutrienti pre/intra/post workout
   - Carbo loading e gestione glicogeno
   - Protein synthesis e recupero muscolare
   - Integratori e supplementi sportivi

4. INTERAZIONI CRITICHE (esempi)
   - Candida + lavoro anaerobico + 120g/h carbo = proliferazione candida, CO2, metano, inibizione mTOR
   - Enterobacteriaceae + endurance lungo = endotoxemia, LPS, fatica centrale
   - Clostridium + proteine alte + fibre basse = ammoniaca, neurotossicita
   - Desulfovibrio + grassi saturi = H2S, danno mucosa

FORMATO RISPOSTA (JSON):
{
  "summary": "Sintesi dello stato attuale dell'atleta",
  "criticalAlerts": [
    {
      "severity": "high|medium|low",
      "title": "Titolo alert",
      "interaction": "Descrizione interazione problematica",
      "consequence": "Conseguenze metaboliche/performance",
      "recommendation": "Cosa fare"
    }
  ],
  "metabolicInsights": {
    "currentState": "Stato metabolico attuale",
    "blockedPathways": ["pathway1", "pathway2"],
    "optimizationOpportunities": ["opportunita1", "opportunita2"]
  },
  "trainingRecommendations": {
    "preworkout": ["consiglio1", "consiglio2"],
    "intraworkout": ["consiglio1", "consiglio2"],
    "postworkout": ["consiglio1", "consiglio2"],
    "weeklyAdjustments": ["aggiustamento1", "aggiustamento2"]
  },
  "nutritionPlan": {
    "dailyTargets": {
      "carbsGKg": number,
      "proteinGKg": number,
      "fatGKg": number,
      "fiberG": number
    },
    "mealTiming": ["timing1", "timing2"],
    "foodsToAvoid": ["food1", "food2"],
    "foodsToInclude": ["food1", "food2"]
  },
  "supplementProtocol": {
    "essential": [{"name": "nome", "dose": "dose", "timing": "timing", "reason": "motivo"}],
    "conditional": [{"name": "nome", "dose": "dose", "timing": "timing", "condition": "quando usare"}]
  },
  "recoveryProtocol": {
    "sleep": ["consiglio1"],
    "lifestyle": ["consiglio1"],
    "gutHealth": ["consiglio1"]
  },
  "weeklyFocus": "Obiettivo principale della settimana"
}`
}

function buildUserPrompt(data: {
  athleteProfile: AthleteProfile | null
  age: number | null
  constraints: AthleteConstraints | null
  sportSupplements: { brands: string[], types: string[] }
  trainingPreferences: { preferred_rest_days: string[], preferred_training_time: string, coach_notes: string } | null
  metabolicProfile: MetabolicProfile | null
  microbiomeData: MicrobiomeData | null
  trainingSummary: any
  dailyMetrics: DailyMetrics | null
  lifestyleSessions: any[]
  recentActivities: TrainingActivity[]
}): string {
  const sections: string[] = []

  // Athlete Profile
  sections.push(`## PROFILO ATLETA
- Eta: ${data.age || 'N/D'} anni
- Genere: ${data.athleteProfile?.gender || 'N/D'}
- Altezza: ${data.athleteProfile?.height_cm || 'N/D'} cm
- Peso: ${data.athleteProfile?.weight_kg || data.metabolicProfile?.weight_kg || 'N/D'} kg
- Body Fat: ${data.athleteProfile?.body_fat_percent || data.metabolicProfile?.body_fat_percent || 'N/D'}%
- LBM: ${data.metabolicProfile?.lean_body_mass_kg || 'N/D'} kg`)

  // Routine
  if (data.athleteProfile) {
    sections.push(`## ROUTINE GIORNALIERA
- Sveglia: ${data.athleteProfile.wake_time || 'N/D'}
- Colazione: ${data.athleteProfile.breakfast_time || 'N/D'}
- Allenamento: ${data.athleteProfile.training_time || 'N/D'}
- Pranzo: ${data.athleteProfile.lunch_time || 'N/D'}
- Cena: ${data.athleteProfile.dinner_time || 'N/D'}
- Sonno: ${data.athleteProfile.sleep_time || 'N/D'}`)
  }

  // Constraints
  if (data.constraints) {
    sections.push(`## VINCOLI ALIMENTARI
- Intolleranze: ${data.constraints.intolerances?.join(', ') || 'Nessuna'}
- Allergie: ${data.constraints.allergies?.join(', ') || 'Nessuna'}
- Limiti: ${data.constraints.dietary_limits?.join(', ') || 'Nessuno'}
- Preferenze: ${data.constraints.dietary_preferences?.join(', ') || 'Nessuna'}`)
  }

  // Sport Supplements
  if (data.sportSupplements.brands.length > 0 || data.sportSupplements.types.length > 0) {
    sections.push(`## INTEGRATORI SPORTIVI
- Marchi preferiti: ${data.sportSupplements.brands.join(', ') || 'Nessuno'}
- Tipi usati: ${data.sportSupplements.types.join(', ') || 'Nessuno'}`)
  }

  // Metabolic Profile
  if (data.metabolicProfile) {
    sections.push(`## PROFILO METABOLICO
- FTP: ${data.metabolicProfile.ftp_watts || 'N/D'} W
- VO2max: ${data.metabolicProfile.vo2max || 'N/D'} ml/kg/min
- VLamax: ${data.metabolicProfile.vlamax || 'N/D'} mmol/L/s
- FatMax: ${data.metabolicProfile.fat_max_watts || 'N/D'} W`)

    if (data.metabolicProfile.empathy_zones) {
      const zones = data.metabolicProfile.empathy_zones
      const zoneInfo = Object.entries(zones)
        .filter(([key]) => key.startsWith('z'))
        .map(([key, zone]: [string, any]) => 
          `${key.toUpperCase()}: ${zone.min}-${zone.max}W, ${zone.consumption?.kcalH || 'N/D'} kcal/h, CHO ${zone.consumption?.choGH || 'N/D'}g/h`)
        .join('\n')
      sections.push(`## ZONE E CONSUMI
${zoneInfo}`)
    }
  }

  // Microbiome
  if (data.microbiomeData && data.microbiomeData.bacteria.length > 0) {
    const highAbundance = data.microbiomeData.bacteria
      .filter(b => b.abundance > 5 || b.status === 'high' || b.status === 'elevated')
      .slice(0, 10)
    const lowAbundance = data.microbiomeData.bacteria
      .filter(b => b.status === 'low' || b.status === 'deficient')
      .slice(0, 10)
    const problematic = data.microbiomeData.bacteria
      .filter(b => 
        b.name.toLowerCase().includes('candida') ||
        b.name.toLowerCase().includes('clostridium') ||
        b.name.toLowerCase().includes('enterobacter') ||
        b.name.toLowerCase().includes('desulfovibrio') ||
        b.name.toLowerCase().includes('bilophila') ||
        b.name.toLowerCase().includes('klebsiella')
      )

    sections.push(`## MICROBIOMA
### Batteri Elevati
${highAbundance.map(b => `- ${b.name}: ${b.abundance}% (${b.status})`).join('\n') || 'Nessuno rilevante'}

### Batteri Carenti
${lowAbundance.map(b => `- ${b.name}: ${b.abundance}% (${b.status})`).join('\n') || 'Nessuno rilevante'}

### Batteri Problematici (attenzione)
${problematic.map(b => `- ${b.name}: ${b.abundance}% (${b.status})`).join('\n') || 'Nessuno rilevato'}`)

    if (data.microbiomeData.pathways && Object.keys(data.microbiomeData.pathways).length > 0) {
      sections.push(`### Pathway Metabolici
${JSON.stringify(data.microbiomeData.pathways, null, 2)}`)
    }
  }

  // Training Summary
  sections.push(`## TRAINING (ultimi 30 giorni)
- Attivita totali: ${data.trainingSummary.totalActivities}
- Durata totale: ${Math.round(data.trainingSummary.totalDuration / 60)} ore
- TSS totale: ${data.trainingSummary.totalTSS}
- TSS medio/giorno: ${data.trainingSummary.avgTSSPerDay}
- Sport praticati: ${data.trainingSummary.sportTypes.join(', ')}`)

  if (Object.keys(data.trainingSummary.zoneDistribution).length > 0) {
    sections.push(`### Distribuzione Zone (minuti)
${Object.entries(data.trainingSummary.zoneDistribution)
  .map(([zone, mins]) => `- ${zone}: ${mins} min`)
  .join('\n')}`)
  }

  // Daily Metrics (Form)
  if (data.dailyMetrics) {
    const tsbStatus = data.dailyMetrics.tsb > 25 ? 'Fresh' :
                      data.dailyMetrics.tsb > 5 ? 'Recovered' :
                      data.dailyMetrics.tsb > -10 ? 'Optimal' :
                      data.dailyMetrics.tsb > -25 ? 'Tired' : 'Fatigued'
    
    sections.push(`## STATO FORMA ATTUALE
- CTL (Fitness): ${data.dailyMetrics.ctl.toFixed(1)}
- ATL (Fatigue): ${data.dailyMetrics.atl.toFixed(1)}
- TSB (Form): ${data.dailyMetrics.tsb.toFixed(1)} - ${tsbStatus}
- Ramp Rate: ${data.dailyMetrics.ramp_rate.toFixed(1)} CTL/week`)
  }

  // Recent Activities
  if (data.recentActivities.length > 0) {
    sections.push(`## ULTIME ATTIVITA
${data.recentActivities.slice(0, 5).map(a => 
  `- ${a.activity_date}: ${a.title || a.sport_type} - ${a.duration_minutes}min, TSS ${a.tss || 'N/D'}, Zona ${a.primary_zone || 'N/D'}`
).join('\n')}`)
  }

  // Training Preferences
  if (data.trainingPreferences) {
    sections.push(`## PREFERENZE ALLENAMENTO
- Orario preferito: ${data.trainingPreferences.preferred_training_time}
- Giorni riposo: ${data.trainingPreferences.preferred_rest_days.join(', ')}
- Note coach: ${data.trainingPreferences.coach_notes || 'Nessuna'}`)
  }

  // Lifestyle
  if (data.lifestyleSessions.length > 0) {
    sections.push(`## LIFESTYLE (yoga, meditation, recovery)
- Sessioni ultimi 30gg: ${data.lifestyleSessions.length}`)
  }

  return sections.join('\n\n') + `

---
Analizza tutti i dati sopra e fornisci consigli PRATICI e SPECIFICI per questo atleta.
Identifica le INTERAZIONI CRITICHE tra microbioma, allenamento e alimentazione.
Suggerisci modifiche concrete a training, nutrizione e supplementazione.
Rispondi in formato JSON come specificato nel system prompt.`
}
