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

    // Fetch all relevant data in parallel - ONLY using existing tables/columns
    const [userResult, athleteResult, constraintsResult, metabolicResult, trainingResult] =
      await Promise.all([
        // User data for full_name
        supabase
          .from("users")
          .select("full_name")
          .eq("id", athleteId)
          .maybeSingle(),

        // Athlete data with daily routine times
        supabase
          .from("athletes")
          .select("id, user_id, primary_sport, weight_kg, wake_time, breakfast_time, training_time, lunch_time, dinner_time, sleep_time")
          .eq("user_id", athleteId)
          .maybeSingle(),

        // Constraints (allergie, intolleranze, preferenze)
        supabase
          .from("athlete_constraints")
          .select("intolerances, allergies, dietary_limits, dietary_preferences")
          .eq("athlete_id", athleteId)
          .maybeSingle(),

        // Metabolic profile
        supabase
          .from("metabolic_profiles")
          .select("*")
          .eq("athlete_id", athleteId)
          .eq("is_current", true)
          .maybeSingle(),

        // Recent training
        supabase
          .from("training_activities")
          .select("*")
          .eq("athlete_id", athleteId)
          .order("activity_date", { ascending: false })
          .limit(14),
      ])

    const user = userResult.data
    const athlete = athleteResult.data
    const constraints = constraintsResult.data
    const metabolic = metabolicResult.data
    const recentTraining = trainingResult.data || []

    // Build comprehensive prompt
    const prompt = `Sei un nutrizionista sportivo esperto. Analizza questi dati e fornisci consigli nutrizionali specifici.

PROFILO ATLETA:
${user?.full_name ? `- Nome: ${user.full_name}` : ""}
${athlete?.weight_kg ? `- Peso: ${athlete.weight_kg}kg` : ""}
${athlete?.primary_sport ? `- Sport: ${athlete.primary_sport}` : ""}

ROUTINE GIORNALIERA (IMPORTANTE per timing pasti):
${athlete?.wake_time ? `- Sveglia: ${athlete.wake_time}` : "- Sveglia: non specificata"}
${athlete?.breakfast_time ? `- Colazione: ${athlete.breakfast_time}` : ""}
${athlete?.training_time ? `- ORARIO ALLENAMENTO: ${athlete.training_time}` : "- Orario allenamento: non specificato, usa 10:00 come default"}
${athlete?.lunch_time ? `- Pranzo: ${athlete.lunch_time}` : ""}
${athlete?.dinner_time ? `- Cena: ${athlete.dinner_time}` : ""}
${athlete?.sleep_time ? `- Sonno: ${athlete.sleep_time}` : ""}

VINCOLI ALIMENTARI:
${
  constraints
    ? `
- Allergie: ${constraints.allergies?.join(", ") || "Nessuna"}
- Intolleranze: ${constraints.intolerances?.join(", ") || "Nessuna"}
- Preferenze: ${constraints.dietary_preferences?.join(", ") || "Nessuna"}
- Limiti dietetici: ${constraints.dietary_limits?.join(", ") || "Nessuno"}
`
    : "Nessun vincolo registrato"
}

PROFILO METABOLICO:
${
  metabolic
    ? `
- FTP: ${metabolic.ftp_watts || "N/A"}W
- VLamax: ${metabolic.vlamax || "N/A"} mmol/L/s
- VO2max: ${metabolic.vo2max || "N/A"} ml/kg/min
- Zone HR: ${metabolic.hr_zones ? "Configurate" : "Non configurate"}
- Zone Power: ${metabolic.power_zones ? "Configurate" : "Non configurate"}
`
    : "Profilo metabolico non disponibile"
}

TRAINING RECENTE (ultimi 14gg):
${
  recentTraining.length > 0
    ? recentTraining
        .map(
          (t: any) =>
            `- ${t.activity_date}: ${t.sport || t.activity_type || "workout"} ${t.duration_minutes || 0}min, TSS ${t.tss || "N/A"}`
        )
        .join("\n")
    : "Nessun allenamento recente"
}

CONTESTO RICHIESTA: ${context || "Consigli generali"}

REGOLE TIMING PASTI:
- Il pre-workout DEVE essere 60-90 minuti PRIMA dell'orario allenamento dell'atleta (${athlete?.training_time || "10:00"})
- Se allenamento alle 18:00, pre-workout alle 16:30-17:00
- Se allenamento alle 07:00, pre-workout alle 05:30-06:00
- Il post-workout DEVE essere entro 30-60 minuti DOPO l'allenamento
- Rispetta gli orari dei pasti principali dell'atleta

IMPORTANTE: Rispondi SOLO con JSON valido, senza markdown. Massimo 2-3 elementi per array. Struttura:
{"alerts":[{"type":"warning","title":"titolo breve","description":"max 100 caratteri"}],"foodsToAvoid":[{"food":"nome","reason":"motivo breve"}],"foodsToInclude":[{"food":"nome","benefit":"beneficio breve"}],"mealTiming":{"preWorkout":"orario esatto e cosa mangiare basato su allenamento alle ${athlete?.training_time || "10:00"}","postWorkout":"orario e cosa mangiare"},"macroTargets":{"carbs":0,"protein":0,"fat":0},"supplementProtocol":[{"name":"nome","dosage":"dose","timing":"orario preciso"}]}`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      temperature: 0.3, // Lower temperature for more consistent JSON
    })

    // Parse JSON response with robust cleanup
    let analysis
    try {
      // Remove markdown code blocks
      let cleanText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      
      // Find JSON object
      const startIdx = cleanText.indexOf('{')
      const endIdx = cleanText.lastIndexOf('}')
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        let jsonStr = cleanText.substring(startIdx, endIdx + 1)
        
        // Fix common JSON issues
        jsonStr = jsonStr
          .replace(/,\s*}/g, '}')  // Remove trailing commas before }
          .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
          .replace(/\n/g, ' ')     // Remove newlines
          .replace(/\t/g, ' ')     // Remove tabs
        
        analysis = JSON.parse(jsonStr)
      } else {
        throw new Error("No JSON object found")
      }
    } catch (parseError) {
      console.error("[AI Nutrition] JSON parse error:", parseError)
      // Extract useful info from raw text
      const cleanDesc = text.replace(/```json|```|[{}\[\]"]/gi, '').substring(0, 500)
      analysis = {
        alerts: [{ type: "info", title: "Analisi AI", description: cleanDesc }],
        foodsToAvoid: [],
        foodsToInclude: [],
        mealTiming: null,
        macroTargets: null,
        supplementProtocol: [],
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      dataUsed: {
        hasUser: !!user,
        hasAthlete: !!athlete,
        hasConstraints: !!constraints,
        hasMetabolic: !!metabolic,
        trainingDays: recentTraining.length,
      },
    })
  } catch (error) {
    console.error("[AI Nutrition] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
