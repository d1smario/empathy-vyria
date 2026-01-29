import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      goal,
      muscleGroups,
      level,
      duration,
      equipment,
      athleteData,
    } = body

    const prompt = `Sei un preparatore atletico esperto italiano. Crea una scheda di allenamento palestra.

OBIETTIVO: ${goal || "ipertrofia"}
GRUPPI MUSCOLARI: ${muscleGroups?.join(", ") || "full body"}
LIVELLO: ${level || "intermedio"}
DURATA: ${duration || 60} minuti
ATTREZZATURA: ${equipment?.join(", ") || "bilanciere, manubri, macchine, cavi"}
${athleteData ? `ATLETA: età ${athleteData.age}, peso ${athleteData.weight}kg, limitazioni: ${athleteData.injuries || "nessuna"}` : ""}

RISPONDI SOLO con un JSON valido (senza markdown, senza backtick) con questa struttura ESATTA:
{
  "name": "Nome Scheda",
  "description": "Descrizione breve",
  "exercises": [
    {
      "name": "Nome Esercizio Italiano",
      "muscleGroup": "gruppo muscolare",
      "sets": 4,
      "reps": "10-12",
      "rest": 90,
      "equipment": "bilanciere",
      "notes": "nota tecnica"
    }
  ]
}

REGOLE:
- 6-10 esercizi totali
- Per ${goal === "forza" ? "forza: 4-6 reps, 3-4 min recupero" : goal === "resistenza" ? "resistenza: 15-20 reps, 30-45 sec recupero" : "ipertrofia: 8-12 reps, 60-90 sec recupero"}
- Ordina: compound poi isolation
- Solo JSON, niente altro testo`

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Parse JSON from response
    let workout
    try {
      // Clean response - remove any markdown backticks if present
      let cleanText = result.text.trim()
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.slice(7)
      }
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.slice(3)
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.slice(0, -3)
      }
      workout = JSON.parse(cleanText.trim())
    } catch (parseError) {
      console.error("[AI Gym] Parse error:", parseError, "Response:", result.text)
      return Response.json(
        { success: false, error: "Errore nel parsing della risposta AI" },
        { status: 500 }
      )
    }

    return Response.json({ 
      success: true, 
      workout,
    })
  } catch (error: any) {
    console.error("[AI Gym Workout Error]", error)
    return Response.json(
      { success: false, error: error.message || "Errore nella generazione" },
      { status: 500 }
    )
  }
}
