import { generateText } from "ai"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { athleteId, context } = await request.json()

    if (!athleteId) {
      return NextResponse.json({ error: "athleteId required" }, { status: 400 })
    }

    // Fetch all relevant data - ONLY existing tables
    const [
      userResult,
      athleteResult,
      metabolicResult,
      trainingResult,
      weeklyWorkoutsResult,
      constraintsResult,
    ] = await Promise.all([
      supabase.from("users").select("full_name").eq("id", athleteId).maybeSingle(),
      supabase.from("athletes").select("id, user_id, primary_sport, weight_kg").eq("user_id", athleteId).maybeSingle(),

      supabase
        .from("metabolic_profiles")
        .select("*")
        .eq("athlete_id", athleteId)
        .eq("is_current", true)
        .maybeSingle(),

      supabase
        .from("training_activities")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("activity_date", { ascending: false })
        .limit(60),

      supabase
        .from("weekly_workouts")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false })
        .limit(7),

      supabase
        .from("athlete_constraints")
        .select("intolerances, allergies, dietary_limits, dietary_preferences")
        .eq("athlete_id", athleteId)
        .maybeSingle(),
    ])

    const user = userResult.data
    const athlete = athleteResult.data
    const metabolic = metabolicResult.data
    const training = trainingResult.data || []
    const weeklyWorkouts = weeklyWorkoutsResult.data || []
    const constraints = constraintsResult.data

    // Calculate metrics - CORRECT: activity_date
    const last7days = training.filter((t: any) => {
      const d = new Date(t.activity_date)
      const now = new Date()
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7
    })
    const last28days = training.filter((t: any) => {
      const d = new Date(t.activity_date)
      const now = new Date()
      return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 28
    })

    const atl = last7days.reduce((s: number, t: any) => s + (t.tss || 0), 0) / 7 // Acute
    const ctl = last28days.reduce((s: number, t: any) => s + (t.tss || 0), 0) / 28 // Chronic
    const tsb = ctl - atl // Training Stress Balance

    // Zone distribution
    const zoneMinutes: Record<string, number> = {}
    training.forEach((t: any) => {
      if (t.zone_distribution) {
        Object.entries(t.zone_distribution).forEach(([zone, mins]) => {
          zoneMinutes[zone] = (zoneMinutes[zone] || 0) + (mins as number)
        })
      }
    })

    const prompt = `Sei un coach di endurance esperto in periodizzazione e fisiologia. Analizza questi dati e fornisci consigli di allenamento.

PROFILO ATLETA:
${user?.full_name ? `- Nome: ${user.full_name}` : ""}
${athlete?.weight_kg ? `- Peso: ${athlete.weight_kg}kg` : ""}
${athlete?.primary_sport ? `- Sport: ${athlete.primary_sport}` : ""}

PROFILO METABOLICO:
${
  metabolic
    ? `
- FTP: ${metabolic.ftp_watts || "N/A"}W (${((metabolic.ftp_watts || 0) / (athlete?.weight_kg || 70)).toFixed(2)} W/kg)
- VLamax: ${metabolic.vlamax || "N/A"} mmol/L/s
- VO2max: ${metabolic.vo2max || "N/A"} ml/kg/min
`
    : "Non disponibile"
}

MICROBIOMA (impatto su recupero):
- Dati disponibili tramite caricamento PDF nella sezione Microbiome

METRICHE FORMA ATTUALE:
- CTL (Fitness): ${ctl.toFixed(1)}
- ATL (Fatica): ${atl.toFixed(1)}
- TSB (Freshness): ${tsb.toFixed(1)}
- Sessioni ultimi 7gg: ${last7days.length}
- Sessioni ultimi 28gg: ${last28days.length}

DISTRIBUZIONE ZONE (ultimi 60gg):
${Object.entries(zoneMinutes).map(([z, m]) => `- ${z}: ${m} min`).join("\n") || "Non disponibile"}

WORKOUT SETTIMANALI PIANIFICATI:
${weeklyWorkouts.map((w: any) => `- Day ${w.day_of_week}: ${w.title} (${w.workout_type})`).join("\n") || "Nessuno pianificato"}

CONTESTO: ${context || "Consigli generali"}

Considera:
1. Se VLamax alto -> piu' lavoro Z2 per abbassarlo
2. Se CTL basso -> costruire base aerobica
3. Se TSB molto negativo -> settimana di scarico
4. Se microbioma alterato -> ridurre intensita' per non stressare gut

IMPORTANTE: Rispondi SOLO con JSON valido senza markdown. Max 2-3 elementi per array.
{"currentStatus":{"fitnessLevel":"building","fatigueLevel":"moderate","readiness":"ready","summary":"descrizione breve"},"alerts":[{"type":"warning","title":"titolo","description":"descrizione breve"}],"weeklyPlan":{"totalTSS":400,"sessions":[{"day":"Lun","type":"Z2","duration":90,"focus":"base"}]},"metabolicFocus":{"primaryGoal":"obiettivo","recommendations":["consiglio"]},"recoveryProtocol":{"sleepHours":8,"notes":"nota"},"periodizationAdvice":{"currentPhase":"base","keyWorkouts":["workout chiave"]}}`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.3,
    })

    let analysis
    try {
      let cleanText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const startIdx = cleanText.indexOf('{')
      const endIdx = cleanText.lastIndexOf('}')
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        let jsonStr = cleanText.substring(startIdx, endIdx + 1)
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/\n/g, ' ')
        analysis = JSON.parse(jsonStr)
      } else {
        throw new Error("No JSON found")
      }
    } catch (parseError) {
      console.error("[AI Training] JSON parse error:", parseError)
      const cleanDesc = text.replace(/```json|```|[{}\[\]"]/gi, '').substring(0, 400)
      analysis = {
        currentStatus: { fitnessLevel: "unknown", fatigueLevel: "unknown", readiness: "unknown", summary: cleanDesc },
        alerts: [],
        weeklyPlan: null,
        periodizationAdvice: null,
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      metrics: { ctl, atl, tsb, zoneMinutes },
      dataUsed: {
        hasAthlete: !!athlete,
        hasMetabolic: !!metabolic,
        trainingDays: training.length,
        weeklyWorkouts: weeklyWorkouts.length,
      },
    })
  } catch (error) {
    console.error("[AI Training] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
