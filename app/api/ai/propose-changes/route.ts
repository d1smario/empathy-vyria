import { generateText } from "ai"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { athleteId, type, currentData } = await req.json()

    if (!athleteId) {
      return NextResponse.json({ error: "athleteId required" }, { status: 400 })
    }

    // Fetch all athlete data
    const [userResult, athleteResult, constraintsResult, metabolicResult, trainingResult, workoutsResult] =
      await Promise.all([
        supabase.from("users").select("full_name").eq("id", athleteId).maybeSingle(),
        supabase.from("athletes").select("id, user_id, primary_sport, weight_kg").eq("user_id", athleteId).maybeSingle(),
        supabase.from("athlete_constraints").select("*").eq("athlete_id", athleteId).maybeSingle(),
        supabase.from("metabolic_profiles").select("*").eq("athlete_id", athleteId).eq("is_current", true).maybeSingle(),
        supabase.from("training_activities").select("*").eq("athlete_id", athleteId).order("activity_date", { ascending: false }).limit(14),
        supabase.from("weekly_workouts").select("*").eq("athlete_id", athleteId).order("created_at", { ascending: false }).limit(7),
      ])

    const user = userResult.data
    const athlete = athleteResult.data
    const constraints = constraintsResult.data
    const metabolic = metabolicResult.data
    const training = trainingResult.data || []
    const workouts = workoutsResult.data || []

    // Calculate weekly TSS
    const weeklyTSS = training.reduce((sum: number, t: any) => sum + (t.tss || 0), 0)

    const prompt = type === "nutrition" 
      ? `Sei un nutrizionista sportivo esperto. Analizza i dati dell'atleta e proponi modifiche CONCRETE al piano nutrizionale.

ATLETA:
- Nome: ${user?.full_name || "N/A"}
- Peso: ${athlete?.weight_kg || "N/A"}kg
- Sport: ${athlete?.primary_sport || "N/A"}

VINCOLI ALIMENTARI (RISPETTA ASSOLUTAMENTE):
- Allergie: ${JSON.stringify(constraints?.allergies || [])}
- Intolleranze: ${JSON.stringify(constraints?.intolerances || [])}
- Preferenze: ${JSON.stringify(constraints?.dietary_preferences || [])}
- Limiti: ${JSON.stringify(constraints?.dietary_limits || [])}

PROFILO METABOLICO:
${metabolic ? `
- FTP: ${metabolic.ftp_watts}W
- VLamax: ${metabolic.vlamax}
- Consumo CHO Z2: ${metabolic.cho_consumption_z2}g/h
- Consumo FAT Z2: ${metabolic.fat_consumption_z2}g/h
` : "Non disponibile"}

TRAINING RECENTE (ultimi 14 giorni):
${training.map((t: any) => `- ${t.activity_date}: ${t.title || t.sport} - ${t.duration_minutes}min, TSS: ${t.tss || 0}`).join("\n")}

DATI PIANO ATTUALE:
${JSON.stringify(currentData || {}, null, 2)}

RISPONDI IN FORMATO JSON VALIDO con questa struttura ESATTA:
{
  "summary": "Breve riepilogo delle modifiche proposte",
  "changes": [
    {
      "category": "timing|macro|alimenti|integratori",
      "field": "nome campo specifico",
      "currentValue": "valore attuale",
      "proposedValue": "valore proposto",
      "reason": "motivazione scientifica breve",
      "priority": "alta|media|bassa"
    }
  ],
  "warnings": ["eventuali avvisi su allergie o interazioni"],
  "weeklyPlan": {
    "lunedi": {"colazione": "descrizione", "pranzo": "descrizione", "cena": "descrizione", "snack": "descrizione"},
    "martedi": {"colazione": "descrizione", "pranzo": "descrizione", "cena": "descrizione", "snack": "descrizione"},
    "mercoledi": {"colazione": "descrizione", "pranzo": "descrizione", "cena": "descrizione", "snack": "descrizione"},
    "giovedi": {"colazione": "descrizione", "pranzo": "descrizione", "cena": "descrizione", "snack": "descrizione"},
    "venerdi": {"colazione": "descrizione", "pranzo": "descrizione", "cena": "descrizione", "snack": "descrizione"},
    "sabato": {"colazione": "descrizione", "pranzo": "descrizione", "cena": "descrizione", "snack": "descrizione"},
    "domenica": {"colazione": "descrizione", "pranzo": "descrizione", "cena": "descrizione", "snack": "descrizione"}
  }
}`
      : `Sei un coach di endurance esperto. Analizza i dati dell'atleta e proponi modifiche CONCRETE al piano di allenamento.

ATLETA:
- Nome: ${user?.full_name || "N/A"}
- Peso: ${athlete?.weight_kg || "N/A"}kg
- Sport: ${athlete?.primary_sport || "N/A"}

PROFILO METABOLICO:
${metabolic ? `
- FTP: ${metabolic.ftp_watts}W (${((metabolic.ftp_watts || 0) / (athlete?.weight_kg || 70)).toFixed(2)} W/kg)
- VLamax: ${metabolic.vlamax}
- Zone: ${JSON.stringify(metabolic.power_zones || {})}
` : "Non disponibile"}

TRAINING RECENTE (ultimi 14 giorni):
${training.map((t: any) => `- ${t.activity_date}: ${t.title || t.sport} - ${t.duration_minutes}min, TSS: ${t.tss || 0}, Zone: ${t.primary_zone || "N/A"}`).join("\n")}

TSS SETTIMANALE ATTUALE: ${weeklyTSS}

WORKOUT PIANIFICATI:
${workouts.map((w: any) => `- Giorno ${w.day_of_week}: ${w.title || "Workout"} - ${w.duration_minutes}min, TSS target: ${w.tss_target || 0}`).join("\n")}

DATI PIANO ATTUALE:
${JSON.stringify(currentData || {}, null, 2)}

RISPONDI IN FORMATO JSON VALIDO con questa struttura ESATTA:
{
  "summary": "Breve riepilogo delle modifiche proposte",
  "changes": [
    {
      "category": "zone|durata|tipo|riposo|tss",
      "field": "nome campo specifico",
      "currentValue": "valore attuale",
      "proposedValue": "valore proposto", 
      "reason": "motivazione fisiologica breve",
      "priority": "alta|media|bassa",
      "dayOfWeek": 0
    }
  ],
  "weeklyTSS": {
    "current": ${weeklyTSS},
    "proposed": 0,
    "rationale": "motivazione per il nuovo carico"
  },
  "warnings": ["eventuali avvisi su sovraccarico o recupero insufficiente"],
  "weeklyPlan": [
    {"day": 0, "name": "Lunedì", "workout": "Tipo allenamento", "duration": 60, "zone": "Z2", "tss": 50, "notes": "note specifiche"},
    {"day": 1, "name": "Martedì", "workout": "Tipo allenamento", "duration": 60, "zone": "Z2", "tss": 50, "notes": "note specifiche"},
    {"day": 2, "name": "Mercoledì", "workout": "Tipo allenamento", "duration": 60, "zone": "Z2", "tss": 50, "notes": "note specifiche"},
    {"day": 3, "name": "Giovedì", "workout": "Tipo allenamento", "duration": 60, "zone": "Z2", "tss": 50, "notes": "note specifiche"},
    {"day": 4, "name": "Venerdì", "workout": "Tipo allenamento", "duration": 60, "zone": "Z2", "tss": 50, "notes": "note specifiche"},
    {"day": 5, "name": "Sabato", "workout": "Tipo allenamento", "duration": 60, "zone": "Z2", "tss": 50, "notes": "note specifiche"},
    {"day": 6, "name": "Domenica", "workout": "Tipo allenamento", "duration": 60, "zone": "Z2", "tss": 50, "notes": "note specifiche"}
  ]
}`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Parse JSON response
    let proposedChanges
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text
      proposedChanges = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error("[AI Propose] JSON parse error:", parseError)
      return NextResponse.json({ 
        error: "Formato risposta AI non valido",
        rawText: text 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      type,
      athleteId,
      proposedChanges,
      constraints: {
        allergies: constraints?.allergies || [],
        intolerances: constraints?.intolerances || [],
      }
    })

  } catch (error) {
    console.error("[AI Propose] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore proposta modifiche" },
      { status: 500 }
    )
  }
}
