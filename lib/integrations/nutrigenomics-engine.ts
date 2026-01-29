// NUTRIGENOMICS ENGINE - Integrazione Epigenetica + Microbioma + Constraints -> Raccomandazioni
// Analizza profili genetici e microbici per generare consigli personalizzati

import { METABOLIC_GENES_DATABASE, type MetabolicGene } from "@/lib/data/epigenetics-database"
import { BACTERIA_DATABASE, METABOLIC_PATHWAYS, FOOD_MICROBIOME_INTERACTIONS } from "@/lib/data/microbiome-database"

// ============================================================================
// TYPES
// ============================================================================

export type RecommendationCategory = 'nutrition' | 'training' | 'fueling' | 'supplements' | 'lifestyle'
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'
export type RecommendationAction = 'avoid' | 'reduce' | 'prefer' | 'increase' | 'replace' | 'timing'

export interface Recommendation {
  id: string
  category: RecommendationCategory
  priority: RecommendationPriority
  action: RecommendationAction
  title: string
  description: string
  avoid?: string[]
  prefer?: string[]
  replace?: { from: string; to: string }[]
  timing?: string
  dosage?: string
  reasoning: string  // Spiegazione metabolica
  sources: string[]  // Geni/batteri che generano questa raccomandazione
}

export interface AthleteGeneticProfile {
  genes: {
    gene_id: string
    expression_state: 'under' | 'normal' | 'over'
    methylation_level?: number  // 0-100%
  }[]
}

export interface AthleteMicrobiomeProfile {
  bacteria: {
    bacteria_id: string
    abundance: 'low' | 'normal' | 'high'
    percentage?: number
  }[]
}

export interface AthleteConstraints {
  intolerances: string[]
  allergies: string[]
  dietary_preferences: string[]
}

export interface NutrigenomicsAnalysis {
  athlete_id: string
  analysis_date: string
  risk_score: number  // 0-100
  recommendations: Recommendation[]
  metabolic_summary: {
    energy_system: 'glycolytic' | 'oxidative' | 'mixed'
    fat_adaptation: 'poor' | 'moderate' | 'good'
    recovery_capacity: 'slow' | 'normal' | 'fast'
    inflammation_risk: 'low' | 'moderate' | 'high'
    gut_health: 'compromised' | 'moderate' | 'optimal'
  }
  warnings: string[]
}

// ============================================================================
// GENE-MICROBIOME INTERACTION MATRIX
// ============================================================================

const GENE_MICROBIOME_INTERACTIONS: Record<string, {
  synergistic_bacteria: string[]  // Batteri che aiutano
  antagonistic_bacteria: string[]  // Batteri che peggiorano
  pathway_affected: string
}> = {
  'PFKM': {
    synergistic_bacteria: ['lactobacillus', 'bifidobacterium'],
    antagonistic_bacteria: ['prevotella', 'bacteroides'],
    pathway_affected: 'Glicolisi'
  },
  'LDHA': {
    synergistic_bacteria: ['lactobacillus'],
    antagonistic_bacteria: ['clostridium'],
    pathway_affected: 'Metabolismo lattato'
  },
  'CPT1A': {
    synergistic_bacteria: ['akkermansia', 'faecalibacterium'],
    antagonistic_bacteria: ['firmicutes_general'],
    pathway_affected: 'Beta-ossidazione'
  },
  'PPARGC1A': {
    synergistic_bacteria: ['akkermansia', 'bifidobacterium'],
    antagonistic_bacteria: ['enterobacteriaceae'],
    pathway_affected: 'Biogenesi mitocondriale'
  },
  'SOD2': {
    synergistic_bacteria: ['lactobacillus', 'bifidobacterium'],
    antagonistic_bacteria: ['enterobacteriaceae', 'clostridium'],
    pathway_affected: 'Difesa antiossidante'
  },
  'MTHFR': {
    synergistic_bacteria: ['bifidobacterium', 'lactobacillus'],
    antagonistic_bacteria: ['clostridium'],
    pathway_affected: 'Ciclo metilazione'
  },
  'IL6': {
    synergistic_bacteria: ['faecalibacterium', 'akkermansia'],
    antagonistic_bacteria: ['enterobacteriaceae', 'bacteroides'],
    pathway_affected: 'Risposta infiammatoria'
  },
  'BCKDH': {
    synergistic_bacteria: ['bifidobacterium'],
    antagonistic_bacteria: ['clostridium'],
    pathway_affected: 'Catabolismo BCAA'
  }
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export function analyzeNutrigenomics(
  athleteId: string,
  geneticProfile: AthleteGeneticProfile | null | undefined,
  microbiomeProfile: AthleteMicrobiomeProfile | null | undefined,
  constraints: AthleteConstraints | null | undefined
): NutrigenomicsAnalysis {
  
  const recommendations: Recommendation[] = []
  const warnings: string[] = []
  let riskScore = 0
  
  // Ensure we have valid data structures
  const genes = geneticProfile?.genes || []
  const bacteria = microbiomeProfile?.bacteria || []
  const intolerances = constraints?.intolerances || []
  const allergies = constraints?.allergies || []
  
  // 1. ANALISI GENETICA - Genera raccomandazioni base dai geni
  for (const geneEntry of genes) {
    const geneData = METABOLIC_GENES_DATABASE.find(g => g.gene_id === geneEntry.gene_id)
    if (!geneData) continue
    
    const stateData = geneData.expression_states[geneEntry.expression_state]
    if (!stateData || geneEntry.expression_state === 'normal') continue
    
    // Aggiungi rischio
    riskScore += stateData.metabolic_impact === 'severe' ? 15 : 
                 stateData.metabolic_impact === 'moderate' ? 10 : 5
    
    // Raccomandazioni nutrizionali dal gene
    if (stateData.nutrition_recommendations) {
      // Alimenti da evitare
      if (stateData.nutrition_recommendations.avoid?.length) {
        recommendations.push({
          id: `${geneData.gene_id}_avoid`,
          category: 'nutrition',
          priority: stateData.metabolic_impact === 'severe' ? 'critical' : 'high',
          action: 'avoid',
          title: `Evita: ${stateData.nutrition_recommendations.avoid.slice(0, 3).join(', ')}`,
          description: `A causa di ${geneData.gene_name} ${geneEntry.expression_state === 'under' ? 'sotto-espresso' : 'sovra-espresso'}`,
          avoid: stateData.nutrition_recommendations.avoid,
          reasoning: stateData.consequences.join('. '),
          sources: [geneData.gene_id]
        })
      }
      
      // Alimenti da preferire
      if (stateData.nutrition_recommendations.prefer?.length) {
        recommendations.push({
          id: `${geneData.gene_id}_prefer`,
          category: 'nutrition',
          priority: 'medium',
          action: 'prefer',
          title: `Preferisci: ${stateData.nutrition_recommendations.prefer.slice(0, 3).join(', ')}`,
          description: `Supporta la funzione di ${geneData.gene_name}`,
          prefer: stateData.nutrition_recommendations.prefer,
          reasoning: `Compensa ${stateData.functional_effect}`,
          sources: [geneData.gene_id]
        })
      }
      
      // Timing
      if (stateData.nutrition_recommendations.timing) {
        recommendations.push({
          id: `${geneData.gene_id}_timing`,
          category: 'nutrition',
          priority: 'medium',
          action: 'timing',
          title: `Timing: ${stateData.nutrition_recommendations.timing}`,
          description: `Ottimizza assorbimento per ${geneData.gene_name}`,
          timing: stateData.nutrition_recommendations.timing,
          reasoning: stateData.functional_effect,
          sources: [geneData.gene_id]
        })
      }
    }
    
    // Raccomandazioni training dal gene
    if (stateData.training_recommendations) {
      if (stateData.training_recommendations.avoid?.length) {
        recommendations.push({
          id: `${geneData.gene_id}_training_avoid`,
          category: 'training',
          priority: stateData.metabolic_impact === 'severe' ? 'high' : 'medium',
          action: 'avoid',
          title: `Evita: ${stateData.training_recommendations.avoid.join(', ')}`,
          description: `Limitazione da ${geneData.gene_name}`,
          avoid: stateData.training_recommendations.avoid,
          reasoning: stateData.functional_effect,
          sources: [geneData.gene_id]
        })
      }
      
      if (stateData.training_recommendations.prefer?.length) {
        recommendations.push({
          id: `${geneData.gene_id}_training_prefer`,
          category: 'training',
          priority: 'medium',
          action: 'prefer',
          title: `Preferisci: ${stateData.training_recommendations.prefer.join(', ')}`,
          description: `Ottimale per il tuo profilo ${geneData.gene_name}`,
          prefer: stateData.training_recommendations.prefer,
          reasoning: `Massimizza efficienza con ${stateData.functional_effect}`,
          sources: [geneData.gene_id]
        })
      }
    }
    
    // Supplementi dal gene
    if (stateData.supplements?.length) {
      recommendations.push({
        id: `${geneData.gene_id}_supplements`,
        category: 'supplements',
        priority: stateData.metabolic_impact === 'severe' ? 'high' : 'medium',
        action: 'increase',
        title: `Integra: ${stateData.supplements.slice(0, 3).join(', ')}`,
        description: `Supporto per ${geneData.gene_name} ${geneEntry.expression_state === 'under' ? 'sotto-espresso' : 'sovra-espresso'}`,
        prefer: stateData.supplements,
        reasoning: stateData.consequences.join('. '),
        sources: [geneData.gene_id]
      })
    }
  }
  
  // 2. ANALISI MICROBIOMA - Aggiungi raccomandazioni dai batteri
  for (const bacteriaEntry of bacteria) {
    const bacteriaData = BACTERIA_DATABASE.find(b => b.id === bacteriaEntry.bacteria_id)
    if (!bacteriaData || bacteriaEntry.abundance === 'normal') continue
    
    const isLow = bacteriaEntry.abundance === 'low'
    const isHigh = bacteriaEntry.abundance === 'high'
    
    // Se batterio benefico è basso
    const relevance = bacteriaData.athlete_relevance || ''
    if (isLow && (relevance.includes('produzione butirrato') || 
        relevance.includes('anti-infiammatorio'))) {
      riskScore += 8
      
      // Alimenti che aumentano questo batterio
      const foodsToIncrease = FOOD_MICROBIOME_INTERACTIONS.filter(f => 
        f.promotes.includes(bacteriaEntry.bacteria_id)
      )
      
      if (foodsToIncrease.length) {
        recommendations.push({
          id: `${bacteriaEntry.bacteria_id}_increase_foods`,
          category: 'nutrition',
          priority: 'high',
          action: 'increase',
          title: `Aumenta: ${foodsToIncrease.slice(0, 3).map(f => f.food).join(', ')}`,
          description: `Per aumentare ${bacteriaData.name} (attualmente basso)`,
          prefer: foodsToIncrease.map(f => f.food),
          reasoning: `${bacteriaData.name} basso compromette: ${bacteriaData.athlete_relevance}`,
          sources: [bacteriaEntry.bacteria_id]
        })
      }
    }
    
    // Se batterio problematico è alto
    if (isHigh && (bacteriaData.id === 'enterobacteriaceae' || bacteriaData.id === 'clostridium')) {
      riskScore += 10
      
      // Alimenti che riducono questo batterio
      const foodsToReduce = FOOD_MICROBIOME_INTERACTIONS.filter(f => 
        f.inhibits.includes(bacteriaEntry.bacteria_id)
      )
      
      recommendations.push({
        id: `${bacteriaEntry.bacteria_id}_reduce`,
        category: 'nutrition',
        priority: 'high',
        action: 'reduce',
        title: `Riduci zuccheri semplici e alimenti processati`,
        description: `Per ridurre ${bacteriaData.name} (attualmente alto)`,
        avoid: ['zuccheri raffinati', 'alimenti ultra-processati', 'grassi saturi'],
        reasoning: `${bacteriaData.name} alto aumenta infiammazione e permeabilità intestinale`,
        sources: [bacteriaEntry.bacteria_id]
      })
    }
  }
  
  // 3. CROSS-ANALYSIS GENE-MICROBIOME
  for (const geneEntry of genes) {
    if (geneEntry.expression_state === 'normal') continue
    
    const interaction = GENE_MICROBIOME_INTERACTIONS[geneEntry.gene_id]
    if (!interaction) continue
    
    // Cerca batteri antagonisti che sono alti
    for (const bacteriaEntry of bacteria) {
      if (interaction.antagonistic_bacteria.includes(bacteriaEntry.bacteria_id) && 
          bacteriaEntry.abundance === 'high') {
        
        riskScore += 12  // Combinazione pericolosa
        
        const geneData = METABOLIC_GENES_DATABASE.find(g => g.gene_id === geneEntry.gene_id)
        const bacteriaData = BACTERIA_DATABASE.find(b => b.id === bacteriaEntry.bacteria_id)
        
        warnings.push(
          `ATTENZIONE: ${geneData?.gene_name || geneEntry.gene_id} compromesso + ${bacteriaData?.name || bacteriaEntry.bacteria_id} elevato = rischio ${interaction.pathway_affected}`
        )
        
        recommendations.push({
          id: `cross_${geneEntry.gene_id}_${bacteriaEntry.bacteria_id}`,
          category: 'nutrition',
          priority: 'critical',
          action: 'avoid',
          title: `PRIORITA: Riduci carico su ${interaction.pathway_affected}`,
          description: `Combinazione critica gene-microbioma rilevata`,
          avoid: ['alimenti che stressano questo pathway'],
          reasoning: `${geneData?.gene_name} inefficiente + ${bacteriaData?.name} alto creano sovraccarico metabolico su ${interaction.pathway_affected}`,
          sources: [geneEntry.gene_id, bacteriaEntry.bacteria_id]
        })
      }
      
      // Cerca batteri sinergici che sono bassi (opportunità mancata)
      if (interaction.synergistic_bacteria.includes(bacteriaEntry.bacteria_id) && 
          bacteriaEntry.abundance === 'low') {
        
        const bacteriaData = BACTERIA_DATABASE.find(b => b.id === bacteriaEntry.bacteria_id)
        
        recommendations.push({
          id: `synergy_${geneEntry.gene_id}_${bacteriaEntry.bacteria_id}`,
          category: 'supplements',
          priority: 'medium',
          action: 'increase',
          title: `Probiotici: ${bacteriaData?.name || bacteriaEntry.bacteria_id}`,
          description: `Potrebbe compensare deficit di ${geneEntry.gene_id}`,
          prefer: [`Probiotico ${bacteriaData?.name}`, 'Prebiotici specifici'],
          reasoning: `${bacteriaData?.name} supporta ${interaction.pathway_affected} compromesso dal gene`,
          sources: [geneEntry.gene_id, bacteriaEntry.bacteria_id]
        })
      }
    }
  }
  
  // 4. INTEGRA CONSTRAINTS (Intolleranze/Allergie)
  for (const intolerance of intolerances) {
    const intolLower = intolerance.toLowerCase()
    
    if (intolLower.includes('lattosio')) {
      recommendations.push({
        id: 'constraint_lactose',
        category: 'nutrition',
        priority: 'critical',
        action: 'replace',
        title: 'Sostituisci latticini',
        description: 'Intolleranza al lattosio rilevata',
        avoid: ['latte', 'yogurt', 'formaggi freschi', 'panna', 'gelato'],
        replace: [
          { from: 'Latte vaccino', to: 'Latte di mandorla/avena/soia' },
          { from: 'Yogurt', to: 'Yogurt vegetale o senza lattosio' },
          { from: 'Formaggio', to: 'Formaggi stagionati (basso lattosio) o vegetali' }
        ],
        reasoning: 'Deficit lattasi causa fermentazione intestinale, gonfiore, malassorbimento',
        sources: ['intolerance_lactose']
      })
    }
    
    if (intolLower.includes('glutine')) {
      recommendations.push({
        id: 'constraint_gluten',
        category: 'nutrition',
        priority: 'critical',
        action: 'replace',
        title: 'Sostituisci cereali con glutine',
        description: 'Intolleranza al glutine rilevata',
        avoid: ['frumento', 'orzo', 'segale', 'farro', 'kamut'],
        replace: [
          { from: 'Pasta di grano', to: 'Pasta di riso/mais/grano saraceno' },
          { from: 'Pane', to: 'Pane senza glutine o di riso' },
          { from: 'Cereali', to: 'Riso, quinoa, miglio, amaranto' }
        ],
        reasoning: 'Glutine causa infiammazione intestinale e malassorbimento nutrienti',
        sources: ['intolerance_gluten']
      })
    }
    
    if (intolLower.includes('fruttosio') || intolLower.includes('fodmap')) {
      recommendations.push({
        id: 'constraint_fructose',
        category: 'nutrition',
        priority: 'high',
        action: 'avoid',
        title: 'Limita fruttosio e FODMAP',
        description: 'Malassorbimento fruttosio rilevato',
        avoid: ['mele', 'pere', 'mango', 'miele', 'agave', 'cipolla', 'aglio'],
        prefer: ['glucosio', 'maltodestrine', 'riso', 'banane mature', 'arance'],
        reasoning: 'Fruttosio non assorbito fermenta nel colon causando gas e disagio',
        sources: ['intolerance_fructose']
      })
    }
  }
  
  // 5. CALCOLA METABOLIC SUMMARY
  const metabolicSummary = calculateMetabolicSummary(genes, bacteria)
  
  // 6. GENERA RACCOMANDAZIONI FUELING SPECIFICHE
  const fuelingRecs = generateFuelingRecommendations(genes, bacteria, intolerances)
  recommendations.push(...fuelingRecs)
  
  // Normalizza risk score (0-100)
  riskScore = Math.min(100, riskScore)
  
  // Ordina raccomandazioni per priorità
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  
  return {
    athlete_id: athleteId,
    analysis_date: new Date().toISOString(),
    risk_score: riskScore,
    recommendations,
    metabolic_summary: metabolicSummary,
    warnings
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateMetabolicSummary(
  genes: any[],
  bacteria: any[]
): NutrigenomicsAnalysis['metabolic_summary'] {
  
  // Analizza sistema energetico predominante
  const pfkm = genes.find(g => g.gene_id === 'PFKM')
  const cpt1a = genes.find(g => g.gene_id === 'CPT1A')
  const ldha = genes.find(g => g.gene_id === 'LDHA')
  
  let energySystem: 'glycolytic' | 'oxidative' | 'mixed' = 'mixed'
  if (pfkm?.expression_state === 'over' && ldha?.expression_state === 'over') {
    energySystem = 'glycolytic'
  } else if (cpt1a?.expression_state === 'over') {
    energySystem = 'oxidative'
  }
  
  // Fat adaptation
  let fatAdaptation: 'poor' | 'moderate' | 'good' = 'moderate'
  const akkermansia = bacteria.find(b => b.bacteria_id === 'akkermansia')
  if (cpt1a?.expression_state === 'under') {
    fatAdaptation = 'poor'
  } else if (cpt1a?.expression_state === 'over' && akkermansia?.abundance === 'high') {
    fatAdaptation = 'good'
  }
  
  // Recovery capacity
  let recoveryCapacity: 'slow' | 'normal' | 'fast' = 'normal'
  const sod2 = genes.find(g => g.gene_id === 'SOD2')
  const il6 = genes.find(g => g.gene_id === 'IL6')
  if (sod2?.expression_state === 'under' || il6?.expression_state === 'over') {
    recoveryCapacity = 'slow'
  } else if (sod2?.expression_state === 'over' && il6?.expression_state === 'under') {
    recoveryCapacity = 'fast'
  }
  
  // Inflammation risk
  let inflammationRisk: 'low' | 'moderate' | 'high' = 'moderate'
  const enterobacteriaceae = bacteria.find(b => b.bacteria_id === 'enterobacteriaceae')
  const faecalibacterium = bacteria.find(b => b.bacteria_id === 'faecalibacterium')
  if (il6?.expression_state === 'over' || enterobacteriaceae?.abundance === 'high') {
    inflammationRisk = 'high'
  } else if (faecalibacterium?.abundance === 'high') {
    inflammationRisk = 'low'
  }
  
  // Gut health
  let gutHealth: 'compromised' | 'moderate' | 'optimal' = 'moderate'
  const bifidobacterium = bacteria.find(b => b.bacteria_id === 'bifidobacterium')
  const lactobacillus = bacteria.find(b => b.bacteria_id === 'lactobacillus')
  if (bifidobacterium?.abundance === 'low' && lactobacillus?.abundance === 'low') {
    gutHealth = 'compromised'
  } else if (bifidobacterium?.abundance === 'high' && lactobacillus?.abundance === 'high' && 
             enterobacteriaceae?.abundance !== 'high') {
    gutHealth = 'optimal'
  }
  
  return {
    energy_system: energySystem,
    fat_adaptation: fatAdaptation,
    recovery_capacity: recoveryCapacity,
    inflammation_risk: inflammationRisk,
    gut_health: gutHealth
  }
}

function generateFuelingRecommendations(
  genes: any[],
  bacteria: any[],
  intolerances: any[]
): Recommendation[] {
  
  const recs: Recommendation[] = []
  
  // CHO/h basato su profilo genetico
  const pfkm = genes.find(g => g.gene_id === 'PFKM')
  const cpt1a = genes.find(g => g.gene_id === 'CPT1A')
  
  let choPerHour = 60  // Default
  let choReasoning = 'Standard per endurance'
  
  if (pfkm?.expression_state === 'under') {
    choPerHour = 40
    choReasoning = 'PFKM sotto-espresso: glicolisi lenta, ridurre carico CHO'
  } else if (pfkm?.expression_state === 'over' && cpt1a?.expression_state === 'under') {
    choPerHour = 80
    choReasoning = 'Alta capacità glicolitica ma scarsa ossidazione grassi: aumentare CHO'
  } else if (cpt1a?.expression_state === 'over') {
    choPerHour = 50
    choReasoning = 'Buona fat-adaptation: CHO moderati sufficienti'
  }
  
  // Verifica intolleranza fruttosio
  const hasFructoseIssue = intolerances.some(i => 
    i.toLowerCase().includes('fruttosio') || i.toLowerCase().includes('fodmap')
  ) || pfkm?.expression_state === 'under'
  
  recs.push({
    id: 'fueling_cho',
    category: 'fueling',
    priority: 'high',
    action: 'timing',
    title: `CHO: ${choPerHour}g/ora durante attività >90min`,
    description: hasFructoseIssue ? 
      'Preferire glucosio/maltodestrine, evitare fruttosio' : 
      'Ratio 2:1 glucosio:fruttosio per massimo assorbimento',
    dosage: `${choPerHour}g/ora`,
    prefer: hasFructoseIssue ? 
      ['maltodestrine', 'glucosio', 'gel senza fruttosio'] : 
      ['gel 2:1', 'bevande isotoniche', 'barrette energetiche'],
    avoid: hasFructoseIssue ? ['gel con fruttosio', 'miele', 'frutta'] : [],
    timing: 'Iniziare dopo 45-60 min, ogni 20-30 min',
    reasoning: choReasoning,
    sources: pfkm ? ['PFKM', 'CPT1A'] : ['default']
  })
  
  // Elettroliti basato su microbioma
  const hasGutIssues = bacteria.some(b => 
    b.bacteria_id === 'enterobacteriaceae' && b.abundance === 'high'
  )
  
  recs.push({
    id: 'fueling_electrolytes',
    category: 'fueling',
    priority: 'medium',
    action: 'increase',
    title: hasGutIssues ? 
      'Elettroliti: aumentare sodio, attenzione osmolarità' : 
      'Elettroliti: 500-700mg sodio/ora',
    description: hasGutIssues ? 
      'Gut compromesso: preferire soluzioni ipotoniche' : 
      'Standard per sudorazione moderata-alta',
    dosage: hasGutIssues ? '400-500mg Na/ora, osmolarità <270' : '500-700mg Na/ora',
    prefer: hasGutIssues ? 
      ['compresse elettroliti', 'soluzioni ipotoniche'] : 
      ['bevande isotoniche', 'sale integrale'],
    reasoning: hasGutIssues ? 
      'Permeabilità intestinale aumentata: evitare soluzioni ipertoniche' : 
      'Mantenere equilibrio idro-salino durante sforzo',
    sources: hasGutIssues ? ['enterobacteriaceae', 'gut_health'] : ['default']
  })
  
  // Supplementi specifici
  const mthfr = genes.find(g => g.gene_id === 'MTHFR')
  const sod2 = genes.find(g => g.gene_id === 'SOD2')
  
  if (mthfr?.expression_state === 'under') {
    recs.push({
      id: 'fueling_b_vitamins',
      category: 'supplements',
      priority: 'high',
      action: 'increase',
      title: 'Vitamine B: metilfolato + B12 metilcobalamina',
      description: 'MTHFR compromesso richiede forme metilate',
      dosage: '400-800mcg metilfolato + 1000mcg B12/die',
      prefer: ['5-MTHF', 'metilcobalamina', 'P5P (B6 attiva)'],
      avoid: ['acido folico sintetico', 'cianocobalamina'],
      reasoning: 'MTHFR sotto-espresso: ciclo metilazione inefficiente, rischio omocisteina alta',
      sources: ['MTHFR']
    })
  }
  
  if (sod2?.expression_state === 'under') {
    recs.push({
      id: 'fueling_antioxidants',
      category: 'supplements',
      priority: 'high',
      action: 'increase',
      title: 'Antiossidanti: CoQ10 + NAC + Vitamina C',
      description: 'SOD2 compromesso richiede supporto antiossidante',
      dosage: 'CoQ10 100-200mg + NAC 600mg + Vit C 500mg/die',
      prefer: ['ubichinolo (CoQ10 ridotto)', 'N-acetilcisteina', 'vitamina C liposomiale'],
      timing: 'Lontano da allenamento (non bloccare adattamento)',
      reasoning: 'SOD2 sotto-espresso: difesa mitocondriale compromessa, stress ossidativo elevato',
      sources: ['SOD2']
    })
  }
  
  return recs
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export function getRecommendationsByCategory(
  analysis: NutrigenomicsAnalysis, 
  category: RecommendationCategory
): Recommendation[] {
  return analysis.recommendations.filter(r => r.category === category)
}

export function getCriticalRecommendations(analysis: NutrigenomicsAnalysis): Recommendation[] {
  return analysis.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high')
}

export function formatRecommendationForDisplay(rec: Recommendation): {
  icon: string
  color: string
  badge: string
} {
  const categoryConfig = {
    nutrition: { icon: 'Utensils', color: 'green' },
    training: { icon: 'Dumbbell', color: 'blue' },
    fueling: { icon: 'Zap', color: 'orange' },
    supplements: { icon: 'Pill', color: 'purple' },
    lifestyle: { icon: 'Heart', color: 'pink' }
  }
  
  const priorityConfig = {
    critical: { badge: 'CRITICO', color: 'red' },
    high: { badge: 'ALTO', color: 'orange' },
    medium: { badge: 'MEDIO', color: 'yellow' },
    low: { badge: 'BASSO', color: 'gray' }
  }
  
  return {
    icon: categoryConfig[rec.category].icon,
    color: categoryConfig[rec.category].color,
    badge: priorityConfig[rec.priority].badge
  }
}
