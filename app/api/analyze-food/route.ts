import { generateText, Output } from 'ai'
import { z } from 'zod'

const foodAnalysisSchema = z.object({
  name: z.string().describe('Nome del piatto o alimento identificato in italiano'),
  calories: z.number().describe('Calorie stimate per la porzione visibile'),
  protein: z.number().describe('Proteine in grammi'),
  carbs: z.number().describe('Carboidrati in grammi'),
  fats: z.number().describe('Grassi in grammi'),
  fiber: z.number().describe('Fibre in grammi'),
  sugar: z.number().nullable().describe('Zuccheri in grammi se stimabili, null se non stimabile'),
  glycemic_index: z.number().nullable().describe('Indice glicemico stimato 0-100, null se non stimabile'),
  confidence: z.number().describe('Livello di confidenza della stima 0-100'),
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

    console.log('[v0] Starting generateText with image...')
    
    const result = await generateText({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analizza questa immagine di cibo e stima i valori nutrizionali per la porzione visibile. Rispondi SOLO con un oggetto JSON valido con questa struttura esatta:
{
  "name": "nome del piatto in italiano",
  "calories": numero,
  "protein": numero in grammi,
  "carbs": numero in grammi,
  "fats": numero in grammi,
  "fiber": numero in grammi,
  "sugar": numero in grammi o null,
  "glycemic_index": numero 0-100 o null,
  "confidence": numero 0-100
}

Basa le stime su porzioni tipiche italiane. Se non riesci a identificare il cibo, usa "Alimento non riconosciuto" come nome e valori a 0.`
            },
            {
              type: 'image',
              image: base64Data,
            }
          ]
        }
      ],
    })

    console.log('[v0] generateText result text:', result.text)
    
    // Parse JSON from text response
    let analysis
    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      let jsonStr = result.text
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim()
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim()
      }
      analysis = JSON.parse(jsonStr)
      console.log('[v0] Parsed analysis:', analysis)
    } catch (parseError) {
      console.error('[v0] JSON parse error:', parseError)
      return Response.json({ 
        error: 'Failed to parse AI response',
        details: result.text
      }, { status: 500 })
    }
    
    return Response.json({ 
      success: true, 
      analysis 
    })
  } catch (error) {
    console.error('Food analysis error:', error)
    return Response.json({ 
      error: 'Failed to analyze food image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
