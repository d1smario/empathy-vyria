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
    const [userResult, athleteResult, metabolicResult, trainingResult, constraintsResult] =
      await Promise.all([
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
          .limit(30),
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
    const constraints = constraintsResult.data

    const prompt = `Sei un esperto di epigenetica sportiva e nutrigenomica. Analizza i dati genetici/epigenetici e incrocia con microbioma, metabolismo e allenamento.

PROFILO ATLETA:
${user?.full_name ? `- Nome: ${user.full_name}` : ""}
${athlete?.weight_kg ? `- Peso: ${athlete.weight_kg}kg` : ""}
${athlete?.primary_sport ? `- Sport: ${athlete.primary_sport}` : ""}

DATI EPIGENETICI:
- Dati disponibili tramite caricamento PDF nella sezione Epigenetica

MICROBIOMA:
- Dati disponibili tramite caricamento PDF nella sezione Microbiome

PROFILO METABOLICO:
${
  metabolic
    ? `
- FTP: ${metabolic.ftp_watts || "N/A"}W, VLamax: ${metabolic.vlamax || "N/A"}
`
    : "Non disponibile"
}

TRAINING (30gg):
- Sessioni: ${training.length}
- TSS totale: ${training.reduce((s: number, t: any) => s + (t.tss || 0), 0)}

VINCOLI:
${constraints ? `Allergie: ${constraints.allergies?.join(", ") || "Nessuna"}, Intolleranze: ${constraints.intolerances?.join(", ") || "Nessuna"}, Preferenze: ${constraints.dietary_preferences?.join(", ") || "Nessuna"}` : "Nessuno"}

CONTESTO: ${context || "Analisi generale"}

Analizza:
1. Come i geni metilati/acetilati influenzano la risposta all'allenamento
2. Interazioni gene-microbioma (es. MTHFR + folati batterici)
3. Capacita' genetiche di recupero, sintesi proteica, metabolismo
4. Nutrienti chiave per modulare l'espressione genica

IMPORTANTE: Per ogni raccomandazione, includi SEMPRE un campo "reasoning" che spiega la motivazione metabolica/genetica.
Rispondi SOLO con JSON valido senza markdown. Max 2-3 elementi per array.
{"geneticProfile":{"strengths":["punto forte con spiegazione"],"weaknesses":["punto debole con spiegazione"],"adaptationCapacity":"medium","reasoning":"spiegazione del profilo genetico complessivo"},"trainingResponse":{"endurance":"descrizione e ragionamento","strength":"descrizione e ragionamento","recovery":"descrizione e ragionamento","recommendations":[{"action":"consiglio","reasoning":"motivazione metabolica"}]},"nutrigenomicProtocol":[{"nutrient":"nome","dosage":"dose","timing":"quando","reasoning":"perche' questo nutriente e' importante per questo profilo genetico"}],"lifestyleFactors":[{"factor":"fattore","recommendation":"consiglio","reasoning":"spiegazione dell'impatto epigenetico"}]}`

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
      console.error("[AI Epigenetics] JSON parse error:", parseError)
      const cleanDesc = text.replace(/```json|```|[{}\[\]"]/gi, '').substring(0, 400)
      analysis = {
        geneticProfile: { strengths: [cleanDesc], weaknesses: [], adaptationCapacity: "medium" },
        trainingResponse: null,
        nutrigenomicProtocol: [],
        lifestyleFactors: [],
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      dataUsed: {
        hasAthlete: !!athlete,
        hasMetabolic: !!metabolic,
        trainingDays: training.length,
      },
    })
  } catch (error) {
    console.error("[AI Epigenetics] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
