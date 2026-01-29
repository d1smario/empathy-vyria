import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gateway } from '@ai-sdk/gateway'
import { generateText } from 'ai'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { athleteId, scores, biometrics, trainingData } = await request.json()

    // Load additional athlete data
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('primary_sport, weight_kg, athlete_constraints(*)')
      .eq('id', athleteId)
      .single()

    // Load microbiome/epigenetics if available
    const { data: microbiome } = await supabaseAdmin
      .from('microbiome_reports')
      .select('summary_findings')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: epigenetics } = await supabaseAdmin
      .from('epigenetics_reports')
      .select('key_findings')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const prompt = `Sei un esperto di fisiologia sportiva e bioenergetica. Analizza i dati BioMap dell'atleta e fornisci raccomandazioni personalizzate.

SCORES OGGI:
- Stress Score: ${scores.readiness_score} (carico interno - basso e' meglio)
- Recovery Score: ${scores.recovery_score}/100
- Readiness Score: ${scores.readiness_score}/100
- Strain (ieri): ${scores.strain_score}/21
- Status HRV: ${scores.hrv_status}
- Status Sonno: ${scores.sleep_status}
- Status Fatica: ${scores.fatigue_status}
- Intensita consigliata: ${scores.recommended_intensity}

DATI BIOMETRICI:
${biometrics.hrv_ms ? `- HRV: ${biometrics.hrv_ms}ms (baseline: ${biometrics.hrv_baseline || 'N/A'})` : '- HRV: Non disponibile'}
${biometrics.hr_resting ? `- HR Riposo: ${biometrics.hr_resting}bpm (baseline: ${biometrics.hr_resting_baseline || 'N/A'})` : ''}
${biometrics.sleep_duration_min ? `- Sonno: ${Math.floor(biometrics.sleep_duration_min / 60)}h ${biometrics.sleep_duration_min % 60}m` : ''}
${biometrics.spo2_avg ? `- SpO2: ${biometrics.spo2_avg}%` : ''}
${biometrics.respiratory_rate ? `- Freq. Respiratoria: ${biometrics.respiratory_rate}/min` : ''}

TRAINING LOAD:
- TSS ieri: ${trainingData?.tss_yesterday || 0}
- CTL (fitness): ${trainingData?.ctl || 'N/A'}
- ATL (fatica): ${trainingData?.atl || 'N/A'}

PROFILO ATLETA:
- Sport: ${athlete?.primary_sport || 'Ciclismo'}
- Peso: ${athlete?.weight_kg || 'N/A'}kg
${athlete?.athlete_constraints?.intolerances?.length ? `- Intolleranze: ${athlete.athlete_constraints.intolerances.join(', ')}` : ''}

${microbiome?.summary_findings ? `MICROBIOMA: ${microbiome.summary_findings}` : ''}
${epigenetics?.key_findings ? `EPIGENETICA: ${epigenetics.key_findings}` : ''}

Basandoti su questi dati, genera 4-6 raccomandazioni specifiche e azionabili. Considera:
1. Supporto alle vie metaboliche stressate
2. Cofattori e vitamine per il recupero
3. Timing nutrizionale ottimale
4. Aggiustamenti training

IMPORTANTE: Rispondi SOLO con JSON valido, senza markdown.
{"suggestions":[{"category":"supplement|nutrition|lifestyle|training","title":"titolo breve","description":"spiegazione dettagliata con dosaggi se applicabile","priority":"high|medium|low"}]}`

    const { text } = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt,
      temperature: 0.7,
    })

    // Parse JSON response
    let result
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim()
      result = JSON.parse(cleanText)
    } catch {
      result = { suggestions: [] }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('[AI BioMap] Error:', error)
    return NextResponse.json(
      { error: 'Analysis failed', suggestions: [] },
      { status: 500 }
    )
  }
}
