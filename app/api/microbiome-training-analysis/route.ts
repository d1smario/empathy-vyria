import { generateText } from 'ai';

export const maxDuration = 60;

// Database delle interazioni microbioma-allenamento-nutrizione
const PATHOGEN_TRAINING_INTERACTIONS = {
  candida: {
    name: 'Candida spp.',
    problematicConditions: [
      {
        training: ['anaerobic', 'high_intensity', 'glycolytic'],
        nutrition: { carbsPerHour: 80, sugarSpike: true },
        consequences: [
          'Proliferazione Candida (substrato glucidico + ambiente anaerobico)',
          'Produzione CO2 e metano intestinale',
          'Competizione per glucosio con cellule host',
          'Produzione acetaldeide (tossico epatico)',
        ],
        metabolicImpact: [
          'Inibizione recupero muscolare',
          'Infiammazione sistemica (IL-6, TNF-α)',
          'Rallentamento vie anaboliche (mTOR inibito)',
          'Malassorbimento proteico',
          'Ridotta sintesi proteica muscolare',
          'Permeabilità intestinale aumentata',
        ],
        recommendations: [
          'Ridurre carbo a max 40-60g/h durante sforzo anaerobico',
          'Preferire maltodestrine a catena lunga vs zuccheri semplici',
          'Integrare con Saccharomyces boulardii (competitore)',
          'Aggiungere acido caprilico o oregano oil',
          'Post-workout: proteine + fibre, limitare carbo semplici',
        ],
      },
    ],
  },
  enterobacteriaceae: {
    name: 'Enterobacteriaceae',
    problematicConditions: [
      {
        training: ['endurance', 'long_duration', 'heat_stress'],
        nutrition: { proteinExcess: true, fiberLow: true },
        consequences: [
          'Produzione LPS (endotossine)',
          'Traslocazione batterica con permeabilità aumentata',
          'Endotoxemia da esercizio',
        ],
        metabolicImpact: [
          'Infiammazione sistemica acuta',
          'Fatica centrale (LPS attraversa BEE)',
          'Catabolismo muscolare aumentato',
          'Recupero compromesso',
          'Rischio overtraining syndrome',
        ],
        recommendations: [
          'Glutammina 5-10g pre e post workout',
          'Zinco carnosina per barriera',
          'Evitare FANS che aumentano permeabilità',
          'Colostro bovino pre-gara/allenamento lungo',
          'Limitare proteine a 1.6-2g/kg, non eccedere',
        ],
      },
    ],
  },
  desulfovibrio: {
    name: 'Desulfovibrio',
    problematicConditions: [
      {
        training: ['any'],
        nutrition: { sulfurAminoAcids: true, meatHigh: true },
        consequences: [
          'Produzione H2S (idrogeno solforato)',
          'Danno mucosa intestinale',
          'Inibizione ossidazione butirrato',
        ],
        metabolicImpact: [
          'Ridotta produzione energia colonociti',
          'Infiammazione cronica low-grade',
          'Compromissione barriera intestinale',
          'Ridotto assorbimento nutrienti',
        ],
        recommendations: [
          'Ridurre carne rossa a max 2x/settimana',
          'Limitare uova a 3-4/settimana',
          'Aumentare zinco e molibdeno (cofattori detox H2S)',
          'Fibre fermentabili per competizione con SRB',
        ],
      },
    ],
  },
  clostridium: {
    name: 'Clostridium spp.',
    problematicConditions: [
      {
        training: ['strength', 'hypertrophy'],
        nutrition: { proteinVeryHigh: true, fiberLow: true },
        consequences: [
          'Fermentazione proteica eccessiva',
          'Produzione ammoniaca, p-cresolo, indolo',
          'Putrefazione intestinale',
        ],
        metabolicImpact: [
          'Neurotossicità da ammoniaca',
          'Affaticamento centrale',
          'Danno epatico da metaboliti',
          'pH intestinale alterato',
          'Disbiosi progressiva',
        ],
        recommendations: [
          'Bilanciare proteine con fibre (rapporto 1:1 in grammi)',
          'Non superare 2.2g/kg proteine',
          'Distribuire proteine in 4-5 pasti',
          'Enzimi digestivi con pasti proteici',
          'Probiotici produttori di lattato',
        ],
      },
    ],
  },
  proteobacteria: {
    name: 'Proteobacteria',
    problematicConditions: [
      {
        training: ['overtraining', 'high_volume', 'insufficient_recovery'],
        nutrition: { inflammatoryDiet: true },
        consequences: [
          'Bloom opportunistico',
          'Produzione LPS',
          'Segnale di disbiosi',
        ],
        metabolicImpact: [
          'Marker di stress cronico',
          'Infiammazione sistemica',
          'Immunodepressione',
          'Aumentato rischio infezioni',
        ],
        recommendations: [
          'Ridurre volume allenamento 20-30%',
          'Aumentare giorni recovery',
          'Dieta anti-infiammatoria (omega-3, polifenoli)',
          'Sleep optimization (7-9h)',
          'Gestione stress (HRV monitoring)',
        ],
      },
    ],
  },
};

// Pathway metabolici e loro interazioni
const METABOLIC_PATHWAY_INTERACTIONS = {
  mtor: {
    name: 'mTOR (Protein Synthesis)',
    activators: ['leucine', 'insulin', 'resistance_training', 'protein'],
    inhibitors: ['ampk', 'fasting', 'endurance', 'inflammation', 'candida_metabolites'],
    microbiomeFactors: {
      positive: ['Butyrate (indirect via insulin sensitivity)', 'Akkermansia'],
      negative: ['LPS', 'Inflammation', 'Candida acetaldeide', 'Ammonia'],
    },
  },
  ampk: {
    name: 'AMPK (Energy Sensor)',
    activators: ['fasting', 'endurance', 'caloric_restriction', 'berberine', 'metformin'],
    inhibitors: ['high_carb', 'insulin_spike', 'mtor_activation'],
    microbiomeFactors: {
      positive: ['Akkermansia', 'SCFA', 'Berberine-metabolizing bacteria'],
      negative: ['Dysbiosis', 'LPS'],
    },
  },
  nrf2: {
    name: 'NRF2 (Antioxidant Response)',
    activators: ['sulforaphane', 'curcumin', 'exercise_acute', 'polyphenols'],
    inhibitors: ['chronic_oxidative_stress', 'nfkb_activation'],
    microbiomeFactors: {
      positive: ['Polyphenol-metabolizing bacteria', 'Urolithin A producers'],
      negative: ['H2S excess', 'LPS'],
    },
  },
  pgc1a: {
    name: 'PGC-1α (Mitochondrial Biogenesis)',
    activators: ['cold_exposure', 'exercise', 'fasting', 'nad_precursors'],
    inhibitors: ['inflammation', 'insulin_resistance'],
    microbiomeFactors: {
      positive: ['Butyrate', 'Akkermansia'],
      negative: ['Endotoxemia', 'Dysbiosis'],
    },
  },
};

// Funzione di analisi AI avanzata
async function analyzeTrainingMicrobiomeInteraction(
  microbiomeData: any,
  trainingData: any,
  nutritionData: any
) {
  const prompt = `Sei un esperto di fisiologia dello sport e microbioma. Analizza questa situazione e identifica interazioni critiche.

## DATI MICROBIOMA:
${JSON.stringify(microbiomeData, null, 2)}

## DATI ALLENAMENTO:
- Tipo: ${trainingData.type} (${trainingData.intensity || 'N/A'})
- Durata: ${trainingData.duration || 'N/A'} minuti
- Zona: ${trainingData.zone || 'N/A'}
- TSS/Carico: ${trainingData.tss || 'N/A'}
- Frequenza settimanale: ${trainingData.frequencyPerWeek || 'N/A'}

## DATI NUTRIZIONE:
- Carbo/h durante sforzo: ${nutritionData.carbsPerHour || 'N/A'}g
- Proteine giornaliere: ${nutritionData.proteinPerKg || 'N/A'}g/kg
- Fibre giornaliere: ${nutritionData.fiberPerDay || 'N/A'}g
- Zuccheri semplici: ${nutritionData.simpleSugars || 'N/A'}
- Timing carbo: ${nutritionData.carbTiming || 'N/A'}

## ANALIZZA E RESTITUISCI JSON:
{
  "criticalInteractions": [
    {
      "pathogen": "nome batterio/fungo problematico",
      "trainingTrigger": "cosa nell'allenamento peggiora",
      "nutritionTrigger": "cosa nella nutrizione peggiora", 
      "mechanism": "meccanismo biochimico",
      "consequences": ["conseguenza 1", "conseguenza 2"],
      "metabolicPathwaysAffected": ["mTOR", "AMPK", etc],
      "severity": "high/medium/low",
      "timeToEffect": "immediato/24-48h/cronico"
    }
  ],
  "metabolicBlockades": [
    {
      "pathway": "nome pathway",
      "currentStatus": "active/inhibited/overactive",
      "inhibitor": "cosa lo sta bloccando",
      "consequence": "effetto sulla performance",
      "solution": "come risolvere"
    }
  ],
  "practicalRecommendations": {
    "preWorkout": ["azione 1", "azione 2"],
    "duringWorkout": ["azione 1", "azione 2"],
    "postWorkout": ["azione 1", "azione 2"],
    "dailyNutrition": ["azione 1", "azione 2"],
    "supplements": [{"name": "nome", "dose": "dose", "timing": "quando", "reason": "perché"}],
    "trainingModifications": ["modifica 1", "modifica 2"]
  },
  "alerts": [
    {
      "level": "critical/warning/info",
      "title": "titolo breve",
      "description": "descrizione dettagliata",
      "action": "azione immediata richiesta"
    }
  ],
  "expectedOutcomeIfFollowed": "descrizione miglioramenti attesi",
  "expectedOutcomeIfIgnored": "descrizione rischi se non si interviene"
}`;

  try {
    const { text } = await generateText({
      model: 'openai/gpt-4o',
      prompt,
      maxTokens: 4000,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('[AI Analysis Error]:', error);
    return null;
  }
}

// Analisi locale (fallback)
function analyzeLocally(microbiomeData: any, trainingData: any, nutritionData: any) {
  const alerts: any[] = [];
  const criticalInteractions: any[] = [];
  const recommendations: any = {
    preWorkout: [],
    duringWorkout: [],
    postWorkout: [],
    dailyNutrition: [],
    supplements: [],
    trainingModifications: [],
  };

  const bacteria = microbiomeData?.bacteria || [];

  // Check Candida + Anaerobic + High Carbs
  const hasCandida = bacteria.some(
    (b: any) => b.name.toLowerCase().includes('candida') && (b.status === 'high' || b.abundance > 2)
  );
  const isAnaerobicTraining = ['anaerobic', 'high_intensity', 'glycolytic', 'hiit', 'sprint'].some(
    (t) => trainingData.type?.toLowerCase().includes(t) || trainingData.zone?.toLowerCase().includes('z5') || trainingData.zone?.toLowerCase().includes('z6')
  );
  const highCarbIntake = (nutritionData.carbsPerHour || 0) > 80;

  if (hasCandida && isAnaerobicTraining && highCarbIntake) {
    alerts.push({
      level: 'critical',
      title: 'Candida + Anaerobico + Alto Carbo',
      description: `Combinazione critica: Candida elevata + allenamento anaerobico + ${nutritionData.carbsPerHour}g/h carbo = proliferazione fungina, produzione CO2/metano, inibizione recupero, malassorbimento proteico.`,
      action: 'Ridurre carbo a 40-60g/h, aggiungere Saccharomyces boulardii, acido caprilico post-workout',
    });

    criticalInteractions.push({
      pathogen: 'Candida spp.',
      trainingTrigger: 'Allenamento anaerobico/glicolitico',
      nutritionTrigger: `${nutritionData.carbsPerHour}g/h carboidrati`,
      mechanism: 'Candida fermenta glucosio in ambiente anaerobico producendo CO2, etanolo e acetaldeide',
      consequences: [
        'Proliferazione Candida intestinale',
        'Produzione CO2 e metano (gonfiore, disagio)',
        'Acetaldeide tossico per fegato e muscoli',
        'Competizione per glucosio con cellule muscolari',
        'Inibizione mTOR da infiammazione',
        'Ridotta sintesi proteica muscolare',
        'Malassorbimento aminoacidi',
      ],
      metabolicPathwaysAffected: ['mTOR (inibito)', 'AMPK (alterato)', 'NRF2 (stress ossidativo)'],
      severity: 'high',
      timeToEffect: 'immediato + accumulo cronico',
    });

    recommendations.duringWorkout.push('Ridurre carboidrati a 40-60g/h max');
    recommendations.duringWorkout.push('Preferire maltodestrine a catena lunga vs glucosio puro');
    recommendations.postWorkout.push('Priorità proteine (30-40g) prima dei carboidrati');
    recommendations.postWorkout.push('Limitare carbo semplici, preferire complessi');
    recommendations.supplements.push({
      name: 'Saccharomyces boulardii',
      dose: '5 miliardi CFU',
      timing: 'Mattina e sera lontano dai pasti',
      reason: 'Competitore naturale della Candida',
    });
    recommendations.supplements.push({
      name: 'Acido Caprilico',
      dose: '500-1000mg',
      timing: 'Con i pasti',
      reason: 'Antifungino naturale',
    });
  }

  // Check Enterobacteriaceae + Endurance + Heat
  const hasEnterobacteriaceae = bacteria.some(
    (b: any) => b.name.toLowerCase().includes('enterobacteriaceae') && b.status === 'high'
  );
  const isEnduranceTraining = ['endurance', 'long', 'marathon', 'ultra'].some((t) =>
    trainingData.type?.toLowerCase().includes(t)
  );
  const longDuration = (trainingData.duration || 0) > 90;

  if (hasEnterobacteriaceae && isEnduranceTraining && longDuration) {
    alerts.push({
      level: 'critical',
      title: 'Rischio Endotoxemia da Sforzo',
      description: `Enterobacteriaceae elevate + endurance >90min = rischio traslocazione LPS, endotoxemia, infiammazione sistemica e fatica centrale.`,
      action: 'Glutammina 10g pre-workout, zinco carnosina, evitare FANS, considerare colostro',
    });

    recommendations.preWorkout.push('Glutammina 5-10g');
    recommendations.preWorkout.push('Zinco carnosina 75mg');
    recommendations.supplements.push({
      name: 'Colostro bovino',
      dose: '10-20g',
      timing: '30min pre-workout',
      reason: 'Protegge barriera intestinale da stress termico e meccanico',
    });
  }

  // Check Protein fermenters + High protein
  const hasProteinFermenters = bacteria.some(
    (b: any) => b.name.toLowerCase().includes('clostridium') && b.status === 'high'
  );
  const highProtein = (nutritionData.proteinPerKg || 0) > 2.2;
  const lowFiber = (nutritionData.fiberPerDay || 0) < 25;

  if (hasProteinFermenters && highProtein && lowFiber) {
    alerts.push({
      level: 'warning',
      title: 'Fermentazione Proteica Eccessiva',
      description: `Clostridium elevato + proteine >${nutritionData.proteinPerKg}g/kg + fibre basse = fermentazione putrefattiva, ammoniaca, affaticamento centrale.`,
      action: 'Aumentare fibre a 35-40g/giorno, limitare proteine a 2g/kg, distribuire in più pasti',
    });

    recommendations.dailyNutrition.push('Aumentare fibre a 35-40g/giorno');
    recommendations.dailyNutrition.push('Distribuire proteine in 5-6 pasti');
    recommendations.dailyNutrition.push('Aggiungere enzimi digestivi ai pasti proteici');
  }

  // Check H2S producers
  const hasH2SProducers = bacteria.some(
    (b: any) =>
      (b.name.toLowerCase().includes('desulfovibrio') || b.name.toLowerCase().includes('bilophila')) &&
      b.status === 'high'
  );

  if (hasH2SProducers) {
    alerts.push({
      level: 'warning',
      title: 'Produzione H2S Elevata',
      description: `Batteri solfato-riduttori elevati = produzione idrogeno solforato, danno mucosa, inibizione ossidazione butirrato.`,
      action: 'Ridurre carne rossa, limitare uova, aumentare zinco e molibdeno',
    });

    recommendations.dailyNutrition.push('Limitare carne rossa a 2x/settimana');
    recommendations.dailyNutrition.push('Uova max 3-4/settimana');
    recommendations.supplements.push({
      name: 'Zinco',
      dose: '15-30mg',
      timing: 'Sera',
      reason: 'Cofattore detox H2S',
    });
    recommendations.supplements.push({
      name: 'Molibdeno',
      dose: '150-300mcg',
      timing: 'Con i pasti',
      reason: 'Supporta enzimi che metabolizzano solfiti',
    });
  }

  return {
    criticalInteractions,
    metabolicBlockades: [],
    practicalRecommendations: recommendations,
    alerts,
    expectedOutcomeIfFollowed:
      'Riduzione infiammazione, miglior recupero, ottimizzazione sintesi proteica, performance sostenibile',
    expectedOutcomeIfIgnored:
      'Infiammazione cronica, overtraining, compromissione adattamenti, rischio infortuni e malattie',
  };
}

export async function POST(req: Request) {
  try {
    const { microbiomeData, trainingData, nutritionData, useAI = true } = await req.json();

    if (!microbiomeData) {
      return Response.json({ error: 'Microbiome data required' }, { status: 400 });
    }

    // Default training and nutrition data if not provided
    const training = trainingData || { type: 'mixed', duration: 60, zone: 'Z2' };
    const nutrition = nutritionData || { carbsPerHour: 60, proteinPerKg: 1.6, fiberPerDay: 30 };

    let result;

    if (useAI) {
      result = await analyzeTrainingMicrobiomeInteraction(microbiomeData, training, nutrition);
    }

    // Fallback to local analysis
    if (!result) {
      result = analyzeLocally(microbiomeData, training, nutrition);
    }

    return Response.json({
      success: true,
      analysis: result,
      source: result ? 'ai' : 'local',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Training-Microbiome analysis error:', error);
    return Response.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
