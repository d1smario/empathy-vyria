import { generateText, Output } from 'ai'
import { z } from 'zod'

const foodAnalysisSchema = z.object({
  name: z.string().describe('Nome del piatto o alimento identificato in italiano'),
  calories: z.number().describe('Calorie stimate per la porzione visibile'),
  protein: z.number().describe('Proteine in grammi'),
  carbs: z.number().describe('Carboidrati in grammi'),
  fats: z.number().describe('Grassi in grammi'),
  fiber: z.number().describe('Fibre in grammi'),
  sugar: z.number().nullable().describe('Zuccheri in grammi se stimabili'),
  glycemic_index: z.number().nullable().describe('Indice glicemico stimato (0-100)'),
  ingredients: z.array(z.string()).describe('Lista ingredienti principali identificati'),
  confidence: z.number().describe('Livello di confidenza della stima (0-100)'),
})

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    // Extract base64 data if it includes the data URL prefix
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64

    const result = await generateText({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analizza questa immagine di cibo e stima i valori nutrizionali per la porzione visibile.
              
Sei un nutrizionista esperto. Identifica il piatto/alimento e fornisci stime accurate di:
- Nome del piatto in italiano
- Calorie totali
- Macronutrienti (proteine, carboidrati, grassi)
- Fibre
- Zuccheri (se stimabili)
- Indice glicemico stimato
- Ingredienti principali visibili
- Livello di confidenza della stima (0-100%)

Basa le stime su porzioni tipiche italiane. Se non riesci a identificare il cibo, indica "Alimento non riconosciuto" come nome e usa valori a 0.`
            },
            {
              type: 'image',
              image: base64Data,
            }
          ]
        }
      ],
      output: Output.object({ schema: foodAnalysisSchema }),
    })

    return Response.json({ 
      success: true, 
      analysis: result.object 
    })
  } catch (error) {
    console.error('Food analysis error:', error)
    return Response.json({ 
      error: 'Failed to analyze food image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
