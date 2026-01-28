import { generateText, Output } from "ai"
import { z } from "zod"

const GymWorkoutSchema = z.object({
  name: z.string().describe("Nome della scheda"),
  description: z.string().describe("Breve descrizione dell'allenamento"),
  duration_minutes: z.number().describe("Durata totale in minuti"),
  difficulty: z.enum(["principiante", "intermedio", "avanzato"]),
  exercises: z.array(z.object({
    name: z.string().describe("Nome esercizio in italiano"),
    nameEn: z.string().describe("Nome esercizio in inglese"),
    muscleGroup: z.string().describe("Gruppo muscolare principale"),
    sets: z.number().describe("Numero di serie"),
    reps: z.string().describe("Ripetizioni o tempo (es. '12' o '30 sec')"),
    rest: z.number().describe("Recupero in secondi"),
    equipment: z.string().describe("Attrezzatura necessaria"),
    notes: z.string().nullable().describe("Note tecniche opzionali"),
  })),
  warmup: z.array(z.object({
    name: z.string(),
    duration: z.string(),
  })).describe("Riscaldamento"),
  cooldown: z.array(z.object({
    name: z.string(),
    duration: z.string(),
  })).describe("Defaticamento"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      goal, // es. "ipertrofia", "forza", "resistenza", "dimagrimento"
      muscleGroups, // es. ["petto", "spalle", "tricipiti"]
      level, // es. "principiante", "intermedio", "avanzato"
      duration, // es. 45, 60, 90 minuti
      equipment, // es. ["bilanciere", "manubri", "cavi", "macchine"]
      athleteData, // dati atleta opzionali (età, peso, infortuni)
    } = body

    const prompt = `Sei un preparatore atletico esperto. Crea una scheda di allenamento palestra dettagliata.

OBIETTIVO: ${goal || "ipertrofia e tono muscolare"}
GRUPPI MUSCOLARI: ${muscleGroups?.join(", ") || "full body"}
LIVELLO: ${level || "intermedio"}
DURATA MASSIMA: ${duration || 60} minuti
ATTREZZATURA DISPONIBILE: ${equipment?.join(", ") || "bilanciere, manubri, macchine, cavi"}
${athleteData ? `
DATI ATLETA:
- Età: ${athleteData.age || "N/A"}
- Peso: ${athleteData.weight || "N/A"} kg
- Infortuni/Limitazioni: ${athleteData.injuries || "nessuno"}
` : ""}

REGOLE:
1. Includi sempre riscaldamento (5-10 min) e defaticamento (5 min)
2. Ogni esercizio deve avere serie, ripetizioni, recupero
3. Usa nomi esercizi in italiano E inglese
4. Specifica l'attrezzatura per ogni esercizio
5. Aggiungi note tecniche per esercizi complessi
6. Rispetta la durata massima richiesta
7. Ordina gli esercizi dal più complesso al più semplice (compound prima di isolation)
8. Per ${goal === "forza" ? "forza: 4-6 reps, recupero lungo 2-3 min" : goal === "resistenza" ? "resistenza: 15-20 reps, recupero breve 30-45 sec" : "ipertrofia: 8-12 reps, recupero medio 60-90 sec"}

Genera la scheda completa in formato JSON.`

    const result = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      output: Output.object({ schema: GymWorkoutSchema }),
    })

    return Response.json({ 
      success: true, 
      workout: result.object,
    })
  } catch (error: any) {
    console.error("[AI Gym Workout Error]", error)
    return Response.json(
      { success: false, error: error.message || "Errore nella generazione" },
      { status: 500 }
    )
  }
}
