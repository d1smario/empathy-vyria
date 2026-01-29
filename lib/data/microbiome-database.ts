/**
 * EMPATHY Microbiome Database
 * Database di interazioni batteriche, pathway metabolici
 * e interferenze alimentari per personalizzazione nutrizionale
 * @module microbiome-database
 */

// ==================== BATTERI PRINCIPALI ====================
export interface BacteriaProfile {
  id: string
  name: string
  phylum: string
  genus: string
  species?: string
  // Funzioni metaboliche
  functions: string[]
  // Substrati preferiti (cosa mangiano)
  preferred_substrates: string[]
  // Metaboliti prodotti
  metabolites_produced: string[]
  // Effetti sulla salute
  health_effects: {
    positive: string[]
    negative: string[]
  }
  // Range ottimale (% del microbioma)
  optimal_range: { min: number; max: number }
  // Alimenti che promuovono la crescita
  promoting_foods: string[]
  // Alimenti che inibiscono
  inhibiting_foods: string[]
}

export const BACTERIA_DATABASE: BacteriaProfile[] = [
  // FIRMICUTES
  {
    id: 'lactobacillus',
    name: 'Lactobacillus',
    phylum: 'Firmicutes',
    genus: 'Lactobacillus',
    functions: ['fermentazione lattica', 'produzione acido lattico', 'immunomodulazione'],
    preferred_substrates: ['lattosio', 'glucosio', 'fruttosio', 'fibre solubili'],
    metabolites_produced: ['acido lattico', 'batteriocine', 'vitamine B'],
    health_effects: {
      positive: ['digestione lattosio', 'barriera intestinale', 'immunità', 'riduzione infiammazione'],
      negative: []
    },
    optimal_range: { min: 1, max: 10 },
    promoting_foods: ['yogurt', 'kefir', 'kimchi', 'crauti', 'miso', 'tempeh', 'fibre prebiotiche'],
    inhibiting_foods: ['antibiotici', 'alcol eccessivo', 'zuccheri raffinati in eccesso']
  },
  {
    id: 'faecalibacterium',
    name: 'Faecalibacterium prausnitzii',
    phylum: 'Firmicutes',
    genus: 'Faecalibacterium',
    species: 'prausnitzii',
    functions: ['produzione butirrato', 'anti-infiammatorio', 'salute colon'],
    preferred_substrates: ['fibre', 'amido resistente', 'inulina', 'FOS'],
    metabolites_produced: ['butirrato', 'acidi grassi a catena corta'],
    health_effects: {
      positive: ['riduzione infiammazione', 'protezione colon', 'regolazione glicemia', 'recupero sportivo'],
      negative: []
    },
    optimal_range: { min: 5, max: 15 },
    promoting_foods: ['avena', 'orzo', 'legumi', 'banana verde', 'patate fredde', 'riso freddo', 'aglio', 'cipolla'],
    inhibiting_foods: ['dieta povera di fibre', 'grassi saturi eccessivi', 'antibiotici']
  },
  {
    id: 'roseburia',
    name: 'Roseburia',
    phylum: 'Firmicutes',
    genus: 'Roseburia',
    functions: ['produzione butirrato', 'fermentazione fibre'],
    preferred_substrates: ['fibre insolubili', 'amido resistente', 'xilano'],
    metabolites_produced: ['butirrato', 'acetato'],
    health_effects: {
      positive: ['salute intestinale', 'metabolismo glucosio', 'protezione da obesità'],
      negative: []
    },
    optimal_range: { min: 3, max: 12 },
    promoting_foods: ['cereali integrali', 'verdure fibrose', 'legumi', 'frutta con buccia'],
    inhibiting_foods: ['dieta low-carb estrema', 'grassi saturi']
  },
  {
    id: 'clostridium',
    name: 'Clostridium (cluster XIVa)',
    phylum: 'Firmicutes',
    genus: 'Clostridium',
    functions: ['produzione butirrato', 'metabolismo bile'],
    preferred_substrates: ['fibre', 'proteine', 'aminoacidi'],
    metabolites_produced: ['butirrato', 'acetato', 'propionato'],
    health_effects: {
      positive: ['digestione', 'immunità'],
      negative: ['alcuni ceppi patogeni', 'produzione tossine (ceppi specifici)']
    },
    optimal_range: { min: 5, max: 20 },
    promoting_foods: ['fibre miste', 'proteine moderate'],
    inhibiting_foods: ['eccesso proteine', 'carenza fibre']
  },
  {
    id: 'ruminococcus',
    name: 'Ruminococcus',
    phylum: 'Firmicutes',
    genus: 'Ruminococcus',
    functions: ['degradazione cellulosa', 'produzione SCFA'],
    preferred_substrates: ['cellulosa', 'amido resistente', 'fibre complesse'],
    metabolites_produced: ['acetato', 'formiato', 'etanolo'],
    health_effects: {
      positive: ['digestione fibre', 'energia da fibre'],
      negative: ['alcuni ceppi associati a infiammazione']
    },
    optimal_range: { min: 2, max: 10 },
    promoting_foods: ['verdure crude', 'cereali integrali', 'legumi'],
    inhibiting_foods: ['dieta povera di fibre vegetali']
  },

  // BACTEROIDETES
  {
    id: 'bacteroides',
    name: 'Bacteroides',
    phylum: 'Bacteroidetes',
    genus: 'Bacteroides',
    functions: ['degradazione polisaccaridi', 'metabolismo proteine', 'produzione propionato'],
    preferred_substrates: ['polisaccaridi complessi', 'proteine', 'grassi'],
    metabolites_produced: ['propionato', 'acetato', 'succinato'],
    health_effects: {
      positive: ['digestione carboidrati complessi', 'regolazione peso'],
      negative: ['eccesso associato a diete occidentali']
    },
    optimal_range: { min: 10, max: 30 },
    promoting_foods: ['fibre vegetali', 'polisaccaridi', 'proteine vegetali'],
    inhibiting_foods: ['dieta ricca di grassi saturi', 'zuccheri semplici']
  },
  {
    id: 'prevotella',
    name: 'Prevotella',
    phylum: 'Bacteroidetes',
    genus: 'Prevotella',
    functions: ['degradazione fibre vegetali', 'metabolismo carboidrati'],
    preferred_substrates: ['fibre vegetali', 'carboidrati complessi', 'xilano'],
    metabolites_produced: ['propionato', 'succinato'],
    health_effects: {
      positive: ['digestione fibre', 'tipico di diete plant-based', 'metabolismo glucosio'],
      negative: ['associato a infiammazione in alcuni contesti']
    },
    optimal_range: { min: 5, max: 25 },
    promoting_foods: ['cereali integrali', 'legumi', 'frutta', 'verdure'],
    inhibiting_foods: ['dieta ricca di proteine animali', 'grassi saturi']
  },

  // ACTINOBACTERIA
  {
    id: 'bifidobacterium',
    name: 'Bifidobacterium',
    phylum: 'Actinobacteria',
    genus: 'Bifidobacterium',
    functions: ['fermentazione saccaridi', 'produzione vitamine', 'immunomodulazione'],
    preferred_substrates: ['oligosaccaridi', 'lattosio', 'inulina', 'FOS', 'GOS'],
    metabolites_produced: ['acetato', 'lattato', 'vitamine B', 'folato'],
    health_effects: {
      positive: ['immunità', 'barriera intestinale', 'riduzione patogeni', 'sintesi vitamine'],
      negative: []
    },
    optimal_range: { min: 3, max: 15 },
    promoting_foods: ['yogurt', 'kefir', 'banane', 'aglio', 'cipolla', 'asparagi', 'miele', 'avena'],
    inhibiting_foods: ['antibiotici', 'stress', 'alcol']
  },

  // PROTEOBACTERIA
  {
    id: 'escherichia',
    name: 'Escherichia coli',
    phylum: 'Proteobacteria',
    genus: 'Escherichia',
    species: 'coli',
    functions: ['produzione vitamina K', 'metabolismo aminoacidi'],
    preferred_substrates: ['glucosio', 'aminoacidi', 'lattosio'],
    metabolites_produced: ['vitamina K', 'vitamina B12', 'gas'],
    health_effects: {
      positive: ['produzione vitamine (ceppi commensali)'],
      negative: ['eccesso indica disbiosi', 'alcuni ceppi patogeni']
    },
    optimal_range: { min: 0.1, max: 2 },
    promoting_foods: [],
    inhibiting_foods: ['probiotici', 'fibre prebiotiche', 'polifenoli']
  },

  // VERRUCOMICROBIA
  {
    id: 'akkermansia',
    name: 'Akkermansia muciniphila',
    phylum: 'Verrucomicrobia',
    genus: 'Akkermansia',
    species: 'muciniphila',
    functions: ['degradazione mucina', 'rinforzo barriera', 'regolazione metabolica'],
    preferred_substrates: ['mucina intestinale', 'polifenoli'],
    metabolites_produced: ['acetato', 'propionato', 'peptidi bioattivi'],
    health_effects: {
      positive: ['salute barriera intestinale', 'controllo peso', 'sensibilità insulinica', 'anti-infiammatorio'],
      negative: []
    },
    optimal_range: { min: 1, max: 5 },
    promoting_foods: ['mirtilli', 'uva', 'melograno', 'tè verde', 'olio di pesce', 'polifenoli', 'digiuno intermittente'],
    inhibiting_foods: ['dieta povera di polifenoli', 'eccesso calorie']
  },

  // ==================== NUOVI BATTERI AGGIUNTI ====================
  
  // FIRMICUTES - Espansione
  {
    id: 'eubacterium_rectale',
    name: 'Eubacterium rectale',
    phylum: 'Firmicutes',
    genus: 'Eubacterium',
    species: 'rectale',
    functions: ['produzione butirrato', 'fermentazione amido', 'cross-feeding con bifidobatteri'],
    preferred_substrates: ['amido resistente', 'oligosaccaridi', 'acetato'],
    metabolites_produced: ['butirrato', 'lattato'],
    health_effects: {
      positive: ['protezione colon', 'anti-infiammatorio', 'regolazione glicemia'],
      negative: []
    },
    optimal_range: { min: 2, max: 12 },
    promoting_foods: ['cereali integrali', 'legumi', 'banana verde', 'patate fredde'],
    inhibiting_foods: ['dieta low-carb', 'antibiotici']
  },
  {
    id: 'coprococcus',
    name: 'Coprococcus',
    phylum: 'Firmicutes',
    genus: 'Coprococcus',
    functions: ['produzione butirrato', 'fermentazione fibre', 'associato a benessere mentale'],
    preferred_substrates: ['fibre fermentabili', 'FOS', 'inulina'],
    metabolites_produced: ['butirrato', 'propionato'],
    health_effects: {
      positive: ['salute mentale', 'produzione GABA', 'riduzione depressione'],
      negative: []
    },
    optimal_range: { min: 1, max: 8 },
    promoting_foods: ['avena', 'orzo', 'segale', 'cipolla', 'aglio'],
    inhibiting_foods: ['stress cronico', 'carenza fibre']
  },
  {
    id: 'blautia',
    name: 'Blautia',
    phylum: 'Firmicutes',
    genus: 'Blautia',
    functions: ['metabolismo acidi biliari', 'produzione SCFA', 'immunomodulazione'],
    preferred_substrates: ['carboidrati complessi', 'fibre', 'muco'],
    metabolites_produced: ['acetato', 'propionato', 'etanolo'],
    health_effects: {
      positive: ['regolazione peso', 'metabolismo lipidico', 'riduzione infiammazione viscerale'],
      negative: []
    },
    optimal_range: { min: 3, max: 15 },
    promoting_foods: ['cereali integrali', 'verdure a foglia', 'legumi'],
    inhibiting_foods: ['dieta occidentale', 'grassi saturi']
  },
  {
    id: 'ruminococcus_bromii',
    name: 'Ruminococcus bromii',
    phylum: 'Firmicutes',
    genus: 'Ruminococcus',
    species: 'bromii',
    functions: ['degradazione amido resistente primaria', 'keystone species'],
    preferred_substrates: ['amido resistente tipo 2 e 3', 'granuli amido'],
    metabolites_produced: ['acetato', 'formiato', 'H2', 'CO2'],
    health_effects: {
      positive: ['digestione amido', 'supporto altri batteri (cross-feeding)', 'energia da fibre'],
      negative: []
    },
    optimal_range: { min: 1, max: 10 },
    promoting_foods: ['patate fredde', 'riso freddo', 'banana verde', 'legumi'],
    inhibiting_foods: ['cottura prolungata (distrugge amido resistente)']
  },
  {
    id: 'streptococcus_thermophilus',
    name: 'Streptococcus thermophilus',
    phylum: 'Firmicutes',
    genus: 'Streptococcus',
    species: 'thermophilus',
    functions: ['fermentazione lattica', 'produzione enzimi', 'starter yogurt'],
    preferred_substrates: ['lattosio', 'glucosio', 'saccarosio'],
    metabolites_produced: ['acido lattico', 'folato', 'EPS'],
    health_effects: {
      positive: ['digestione lattosio', 'immunità', 'assorbimento minerali'],
      negative: []
    },
    optimal_range: { min: 0.5, max: 5 },
    promoting_foods: ['yogurt', 'formaggi stagionati', 'latte fermentato'],
    inhibiting_foods: ['antibiotici', 'pH troppo acido']
  },
  {
    id: 'enterococcus',
    name: 'Enterococcus faecium',
    phylum: 'Firmicutes',
    genus: 'Enterococcus',
    species: 'faecium',
    functions: ['produzione batteriocine', 'competizione patogeni', 'metabolismo aminoacidi'],
    preferred_substrates: ['carboidrati semplici', 'aminoacidi'],
    metabolites_produced: ['acido lattico', 'batteriocine', 'vitamine B'],
    health_effects: {
      positive: ['protezione vs patogeni', 'immunomodulazione'],
      negative: ['alcuni ceppi resistenti antibiotici', 'opportunista in immunocompromessi']
    },
    optimal_range: { min: 0.1, max: 3 },
    promoting_foods: ['alimenti fermentati', 'formaggi'],
    inhibiting_foods: ['eccesso in condizioni normali non necessario']
  },
  {
    id: 'christensenella',
    name: 'Christensenella minuta',
    phylum: 'Firmicutes',
    genus: 'Christensenella',
    species: 'minuta',
    functions: ['associato a magrezza', 'regolazione peso', 'ereditabilità'],
    preferred_substrates: ['fibre', 'polisaccaridi'],
    metabolites_produced: ['acetato', 'butirrato'],
    health_effects: {
      positive: ['controllo peso', 'BMI basso', 'longevità', 'metabolismo efficiente'],
      negative: []
    },
    optimal_range: { min: 0.5, max: 5 },
    promoting_foods: ['verdure fibrose', 'dieta varia', 'esercizio fisico'],
    inhibiting_foods: ['obesità', 'sedentarietà', 'dieta povera di fibre']
  },
  {
    id: 'oscillospira',
    name: 'Oscillospira',
    phylum: 'Firmicutes',
    genus: 'Oscillospira',
    functions: ['produzione butirrato', 'associato a magrezza', 'digestione fibre'],
    preferred_substrates: ['fibre complesse', 'glucuronidi'],
    metabolites_produced: ['butirrato'],
    health_effects: {
      positive: ['controllo peso', 'riduzione grasso viscerale'],
      negative: []
    },
    optimal_range: { min: 1, max: 8 },
    promoting_foods: ['digiuno intermittente', 'fibre vegetali', 'verdure crude'],
    inhibiting_foods: ['eccesso calorico', 'pasti frequenti']
  },

  // BACTEROIDETES - Espansione
  {
    id: 'bacteroides_fragilis',
    name: 'Bacteroides fragilis',
    phylum: 'Bacteroidetes',
    genus: 'Bacteroides',
    species: 'fragilis',
    functions: ['produzione PSA immunomodulante', 'degradazione polisaccaridi', 'tolleranza immune'],
    preferred_substrates: ['polisaccaridi', 'mucina', 'glicani'],
    metabolites_produced: ['propionato', 'PSA', 'succinato'],
    health_effects: {
      positive: ['immunomodulazione Treg', 'protezione autoimmunità', 'barriera intestinale'],
      negative: ['opportunista se fuori intestino']
    },
    optimal_range: { min: 1, max: 5 },
    promoting_foods: ['fibre vegetali diverse', 'polisaccaridi complessi'],
    inhibiting_foods: ['antibiotici beta-lattamici']
  },
  {
    id: 'bacteroides_thetaiotaomicron',
    name: 'Bacteroides thetaiotaomicron',
    phylum: 'Bacteroidetes',
    genus: 'Bacteroides',
    species: 'thetaiotaomicron',
    functions: ['digestione carboidrati complessi', 'cross-feeding', 'stimolazione mucosa'],
    preferred_substrates: ['glicani dietetici', 'mucina', 'pectina'],
    metabolites_produced: ['acetato', 'propionato', 'succinato'],
    health_effects: {
      positive: ['versatilità digestiva', 'educazione sistema immunitario', 'produzione muco'],
      negative: []
    },
    optimal_range: { min: 2, max: 10 },
    promoting_foods: ['varietà di fibre vegetali', 'frutta', 'verdure'],
    inhibiting_foods: ['dieta monotona', 'carenza fibre']
  },
  {
    id: 'prevotella_copri',
    name: 'Prevotella copri',
    phylum: 'Bacteroidetes',
    genus: 'Prevotella',
    species: 'copri',
    functions: ['degradazione fibre vegetali', 'metabolismo carboidrati', 'tipico diete agrarie'],
    preferred_substrates: ['xilano', 'arabinoxilano', 'fibre cereali'],
    metabolites_produced: ['succinato', 'propionato'],
    health_effects: {
      positive: ['efficienza digestiva carboidrati', 'tipico popolazioni rurali'],
      negative: ['associato a insulino-resistenza in alcuni studi', 'artrite reumatoide']
    },
    optimal_range: { min: 0, max: 20 },
    promoting_foods: ['cereali integrali', 'dieta plant-based', 'legumi'],
    inhibiting_foods: ['dieta ricca proteine animali', 'grassi']
  },
  {
    id: 'alistipes',
    name: 'Alistipes',
    phylum: 'Bacteroidetes',
    genus: 'Alistipes',
    functions: ['produzione indolo', 'metabolismo triptofano', 'protezione intestinale'],
    preferred_substrates: ['proteine', 'aminoacidi aromatici'],
    metabolites_produced: ['indolo', 'acido indolpropionico', 'propionato'],
    health_effects: {
      positive: ['protezione barriera', 'metaboliti neuroprotettivi', 'anti-infiammatorio'],
      negative: ['eccesso in alcune malattie epatiche']
    },
    optimal_range: { min: 1, max: 8 },
    promoting_foods: ['proteine moderate', 'triptofano', 'verdure crucifere'],
    inhibiting_foods: ['eccesso proteine', 'disbiosi']
  },
  {
    id: 'parabacteroides',
    name: 'Parabacteroides distasonis',
    phylum: 'Bacteroidetes',
    genus: 'Parabacteroides',
    species: 'distasonis',
    functions: ['metabolismo acidi biliari', 'produzione litocolato', 'immunomodulazione'],
    preferred_substrates: ['polisaccaridi', 'acidi biliari'],
    metabolites_produced: ['succinato', 'acidi biliari secondari'],
    health_effects: {
      positive: ['protezione obesità', 'regolazione metabolica', 'tolleranza immune'],
      negative: []
    },
    optimal_range: { min: 0.5, max: 5 },
    promoting_foods: ['fibre solubili', 'polifenoli'],
    inhibiting_foods: ['grassi saturi eccessivi']
  },

  // ACTINOBACTERIA - Espansione
  {
    id: 'bifidobacterium_longum',
    name: 'Bifidobacterium longum',
    phylum: 'Actinobacteria',
    genus: 'Bifidobacterium',
    species: 'longum',
    functions: ['immunomodulazione', 'asse intestino-cervello', 'produzione GABA'],
    preferred_substrates: ['HMO', 'FOS', 'GOS', 'inulina'],
    metabolites_produced: ['acetato', 'lattato', 'GABA', 'folato'],
    health_effects: {
      positive: ['riduzione ansia', 'miglioramento umore', 'immunità', 'longevità'],
      negative: []
    },
    optimal_range: { min: 2, max: 10 },
    promoting_foods: ['latte materno (HMO)', 'yogurt', 'cipolla', 'aglio', 'banana'],
    inhibiting_foods: ['antibiotici', 'stress']
  },
  {
    id: 'bifidobacterium_breve',
    name: 'Bifidobacterium breve',
    phylum: 'Actinobacteria',
    genus: 'Bifidobacterium',
    species: 'breve',
    functions: ['fermentazione oligosaccaridi', 'produzione CLA', 'anti-allergico'],
    preferred_substrates: ['GOS', 'lattosio', 'oligosaccaridi'],
    metabolites_produced: ['acetato', 'lattato', 'CLA'],
    health_effects: {
      positive: ['riduzione allergie', 'protezione infezioni', 'salute pelle'],
      negative: []
    },
    optimal_range: { min: 1, max: 8 },
    promoting_foods: ['latte fermentato', 'prebiotici GOS'],
    inhibiting_foods: ['antibiotici']
  },
  {
    id: 'collinsella',
    name: 'Collinsella aerofaciens',
    phylum: 'Actinobacteria',
    genus: 'Collinsella',
    species: 'aerofaciens',
    functions: ['metabolismo acidi biliari', 'produzione H2', 'deconiugazione'],
    preferred_substrates: ['carboidrati', 'acidi biliari'],
    metabolites_produced: ['H2', 'etanolo', 'lattato', 'formiato'],
    health_effects: {
      positive: ['metabolismo colesterolo'],
      negative: ['associato a insulino-resistenza', 'aterosclerosi in eccesso', 'artrite reumatoide']
    },
    optimal_range: { min: 0.1, max: 3 },
    promoting_foods: ['carboidrati semplici'],
    inhibiting_foods: ['fibre', 'polifenoli', 'dieta plant-based']
  },

  // PROTEOBACTERIA - Espansione
  {
    id: 'klebsiella',
    name: 'Klebsiella pneumoniae',
    phylum: 'Proteobacteria',
    genus: 'Klebsiella',
    species: 'pneumoniae',
    functions: ['fissazione azoto', 'metabolismo zuccheri'],
    preferred_substrates: ['glucosio', 'lattosio', 'zuccheri semplici'],
    metabolites_produced: ['acidi organici', 'gas'],
    health_effects: {
      positive: [],
      negative: ['opportunista', 'infezioni in immunocompromessi', 'resistenza antibiotici', 'marker disbiosi']
    },
    optimal_range: { min: 0, max: 0.5 },
    promoting_foods: ['zuccheri semplici', 'alcol'],
    inhibiting_foods: ['probiotici', 'polifenoli', 'fibre prebiotiche']
  },
  {
    id: 'desulfovibrio',
    name: 'Desulfovibrio',
    phylum: 'Proteobacteria',
    genus: 'Desulfovibrio',
    functions: ['riduzione solfato', 'produzione H2S'],
    preferred_substrates: ['solfato', 'lattato', 'H2'],
    metabolites_produced: ['H2S (idrogeno solforato)', 'acetato'],
    health_effects: {
      positive: [],
      negative: ['H2S danneggia mucosa', 'associato a IBD', 'infiammazione intestinale']
    },
    optimal_range: { min: 0, max: 1 },
    promoting_foods: ['conservanti con solfiti', 'vino (solfiti)', 'carne processata'],
    inhibiting_foods: ['fibre', 'prebiotici', 'riduzione solfiti dietetici']
  },
  {
    id: 'bilophila',
    name: 'Bilophila wadsworthia',
    phylum: 'Proteobacteria',
    genus: 'Bilophila',
    species: 'wadsworthia',
    functions: ['metabolismo taurina', 'produzione H2S', 'tolleranza bile'],
    preferred_substrates: ['taurina', 'acidi biliari', 'solfito'],
    metabolites_produced: ['H2S', 'acetato'],
    health_effects: {
      positive: [],
      negative: ['pro-infiammatorio', 'associato a dieta grassa', 'colite', 'IBD']
    },
    optimal_range: { min: 0, max: 0.5 },
    promoting_foods: ['grassi saturi', 'carne rossa', 'dieta occidentale'],
    inhibiting_foods: ['fibre', 'dieta plant-based', 'polifenoli']
  },

  // ARCHAEA
  {
    id: 'methanobrevibacter',
    name: 'Methanobrevibacter smithii',
    phylum: 'Euryarchaeota',
    genus: 'Methanobrevibacter',
    species: 'smithii',
    functions: ['metanogenesi', 'rimozione H2', 'ottimizzazione fermentazione'],
    preferred_substrates: ['H2', 'CO2', 'formiato'],
    metabolites_produced: ['metano (CH4)'],
    health_effects: {
      positive: ['efficienza energetica da fibre', 'rimozione H2 per altri batteri'],
      negative: ['eccesso associato a obesità', 'stipsi', 'rallentamento transito']
    },
    optimal_range: { min: 0.5, max: 5 },
    promoting_foods: ['fibre fermentabili', 'dieta ricca H2'],
    inhibiting_foods: ['antibiotici anti-metanogeni', 'statine (parziale)']
  },

  // FUSOBACTERIA
  {
    id: 'fusobacterium',
    name: 'Fusobacterium nucleatum',
    phylum: 'Fusobacteria',
    genus: 'Fusobacterium',
    species: 'nucleatum',
    functions: ['aggregazione batterica', 'adesione mucosa'],
    preferred_substrates: ['aminoacidi', 'peptidi'],
    metabolites_produced: ['butirrato', 'ammoniaca', 'H2S'],
    health_effects: {
      positive: [],
      negative: ['associato a cancro colon', 'malattia parodontale', 'IBD', 'marker patologico']
    },
    optimal_range: { min: 0, max: 0.1 },
    promoting_foods: ['carenza igiene orale', 'dieta occidentale'],
    inhibiting_foods: ['igiene orale', 'fibre', 'polifenoli', 'curcuma']
  },

  // FUNGI (Micobioma)
  {
    id: 'candida_albicans',
    name: 'Candida albicans',
    phylum: 'Ascomycota',
    genus: 'Candida',
    species: 'albicans',
    functions: ['opportunista', 'competizione nicchie', 'dimorfismo'],
    preferred_substrates: ['glucosio', 'zuccheri semplici', 'amido'],
    metabolites_produced: ['etanolo', 'acetaldeide', 'gliotossine'],
    health_effects: {
      positive: ['parte normale micobioma in piccole quantità'],
      negative: ['overgrowth = candidosi', 'permeabilità intestinale', 'brain fog', 'fatica']
    },
    optimal_range: { min: 0, max: 0.1 },
    promoting_foods: ['zuccheri', 'carboidrati raffinati', 'alcol', 'antibiotici'],
    inhibiting_foods: ['aglio', 'olio cocco', 'origano', 'probiotici', 'dieta low-sugar']
  },
  {
    id: 'saccharomyces_boulardii',
    name: 'Saccharomyces boulardii',
    phylum: 'Ascomycota',
    genus: 'Saccharomyces',
    species: 'boulardii',
    functions: ['probiotico lievito', 'anti-patogeni', 'supporto barriera'],
    preferred_substrates: ['glucosio', 'maltosio'],
    metabolites_produced: ['etanolo (minimo)', 'fattori trofici', 'proteasi'],
    health_effects: {
      positive: ['prevenzione diarrea', 'anti-C.difficile', 'supporto durante antibiotici', 'IBD'],
      negative: []
    },
    optimal_range: { min: 0, max: 1 },
    promoting_foods: ['supplementazione diretta', 'kombucha', 'kefir'],
    inhibiting_foods: ['non colonizza permanentemente']
  },

  // ALTRI BATTERI IMPORTANTI
  {
    id: 'oxalobacter',
    name: 'Oxalobacter formigenes',
    phylum: 'Proteobacteria',
    genus: 'Oxalobacter',
    species: 'formigenes',
    functions: ['degradazione ossalato', 'prevenzione calcoli renali'],
    preferred_substrates: ['ossalato'],
    metabolites_produced: ['formiato', 'CO2'],
    health_effects: {
      positive: ['riduzione ossalato', 'prevenzione calcoli renali', 'protezione nefropatia'],
      negative: []
    },
    optimal_range: { min: 0.1, max: 2 },
    promoting_foods: ['prebiotici', 'probiotici'],
    inhibiting_foods: ['antibiotici (molto sensibile)', 'fluorochinoloni']
  },
  {
    id: 'lactococcus',
    name: 'Lactococcus lactis',
    phylum: 'Firmicutes',
    genus: 'Lactococcus',
    species: 'lactis',
    functions: ['starter fermentazione', 'produzione nisina', 'anti-patogeni'],
    preferred_substrates: ['lattosio', 'glucosio'],
    metabolites_produced: ['acido lattico', 'nisina', 'diacetile'],
    health_effects: {
      positive: ['probiotico', 'anti-Listeria', 'delivery farmaci (biotech)'],
      negative: []
    },
    optimal_range: { min: 0.1, max: 3 },
    promoting_foods: ['formaggi freschi', 'latticello', 'panna acida'],
    inhibiting_foods: ['antibiotici']
  },
  {
    id: 'veillonella',
    name: 'Veillonella',
    phylum: 'Firmicutes',
    genus: 'Veillonella',
    functions: ['metabolismo lattato', 'conversione lattato-propionato', 'atleti elite'],
    preferred_substrates: ['lattato', 'piruvato'],
    metabolites_produced: ['propionato', 'acetato', 'CO2', 'H2'],
    health_effects: {
      positive: ['rimozione lattato intestinale', 'associato a performance atletica elite', 'energia da lattato'],
      negative: []
    },
    optimal_range: { min: 0.5, max: 5 },
    promoting_foods: ['alimenti fermentati', 'esercizio fisico regolare'],
    inhibiting_foods: ['sedentarietà']
  },
  {
    id: 'dialister',
    name: 'Dialister',
    phylum: 'Firmicutes',
    genus: 'Dialister',
    functions: ['produzione propionato', 'fermentazione'],
    preferred_substrates: ['lattato', 'peptidi'],
    metabolites_produced: ['propionato', 'acetato'],
    health_effects: {
      positive: ['associato a umore positivo', 'qualità vita'],
      negative: []
    },
    optimal_range: { min: 0.5, max: 5 },
    promoting_foods: ['fibre', 'dieta variata'],
    inhibiting_foods: ['depressione (correlazione inversa)']
  },
  {
    id: 'sutterella',
    name: 'Sutterella',
    phylum: 'Proteobacteria',
    genus: 'Sutterella',
    functions: ['adesione mucosa', 'modulazione IgA'],
    preferred_substrates: ['aminoacidi', 'acidi organici'],
    metabolites_produced: ['acidi organici'],
    health_effects: {
      positive: ['parte normale microbiota'],
      negative: ['aumentato in autismo (controverso)', 'IBD']
    },
    optimal_range: { min: 0.1, max: 3 },
    promoting_foods: ['proteine'],
    inhibiting_foods: ['non chiaro']
  },
  {
    id: 'dorea',
    name: 'Dorea',
    phylum: 'Firmicutes',
    genus: 'Dorea',
    functions: ['produzione gas', 'fermentazione', 'metabolismo mucina'],
    preferred_substrates: ['carboidrati', 'mucina'],
    metabolites_produced: ['acetato', 'etanolo', 'H2', 'CO2'],
    health_effects: {
      positive: ['fermentazione normale'],
      negative: ['aumentato in IBS', 'eccesso gas']
    },
    optimal_range: { min: 1, max: 8 },
    promoting_foods: ['fibre fermentabili'],
    inhibiting_foods: ['riduzione FODMAP se IBS']
  },
  {
    id: 'megasphaera',
    name: 'Megasphaera',
    phylum: 'Firmicutes',
    genus: 'Megasphaera',
    functions: ['produzione butirrato da lattato', 'cross-feeding'],
    preferred_substrates: ['lattato', 'glucosio'],
    metabolites_produced: ['butirrato', 'propionato', 'valerato', 'caproato'],
    health_effects: {
      positive: ['produzione SCFA a catena lunga', 'energia colonociti'],
      negative: []
    },
    optimal_range: { min: 0.1, max: 3 },
    promoting_foods: ['lattobacilli (producono lattato)', 'fibre'],
    inhibiting_foods: ['carenza lattobacilli']
  }
]

// ==================== PATHWAY METABOLICI ====================
export interface MetabolicPathway {
  id: string
  name: string
  description: string
  // Batteri coinvolti
  bacteria_involved: string[]
  // Substrati necessari
  substrates: string[]
  // Prodotti finali
  products: string[]
  // Impatto su performance atletica
  athletic_impact: {
    benefit: string
    mechanism: string
  }
  // Alimenti che attivano il pathway
  activating_foods: string[]
  // Alimenti che inibiscono
  inhibiting_foods: string[]
}

export const METABOLIC_PATHWAYS: MetabolicPathway[] = [
  {
    id: 'butyrate_production',
    name: 'Produzione di Butirrato',
    description: 'Fermentazione di fibre che produce butirrato, principale fonte energetica per colonociti',
    bacteria_involved: ['faecalibacterium', 'roseburia', 'clostridium', 'eubacterium'],
    substrates: ['amido resistente', 'inulina', 'FOS', 'fibre insolubili', 'pectina'],
    products: ['butirrato', 'acetato'],
    athletic_impact: {
      benefit: 'Recupero muscolare, riduzione infiammazione, energia sostenuta',
      mechanism: 'Il butirrato riduce citochine pro-infiammatorie, migliora integrità intestinale'
    },
    activating_foods: ['avena', 'orzo', 'legumi', 'banana verde', 'patate fredde', 'riso freddo', 'aglio', 'cipolla', 'asparagi'],
    inhibiting_foods: ['dieta low-carb estrema', 'carenza fibre', 'eccesso proteine']
  },
  {
    id: 'propionate_production',
    name: 'Produzione di Propionato',
    description: 'Fermentazione che produce propionato, regolatore del metabolismo glucidico',
    bacteria_involved: ['bacteroides', 'prevotella', 'akkermansia'],
    substrates: ['pectina', 'arabinoxilani', 'mucina'],
    products: ['propionato', 'succinato'],
    athletic_impact: {
      benefit: 'Regolazione glicemia, sazietà, controllo peso',
      mechanism: 'Il propionato regola gluconeogenesi epatica e segnali di sazietà'
    },
    activating_foods: ['mele', 'pere', 'agrumi', 'carote', 'barbabietole', 'cereali integrali'],
    inhibiting_foods: ['zuccheri semplici', 'alimenti ultra-processati']
  },
  {
    id: 'lactate_fermentation',
    name: 'Fermentazione Lattica',
    description: 'Produzione di acido lattico da zuccheri semplici',
    bacteria_involved: ['lactobacillus', 'bifidobacterium', 'streptococcus'],
    substrates: ['lattosio', 'glucosio', 'fruttosio'],
    products: ['acido lattico', 'acetato', 'CO2'],
    athletic_impact: {
      benefit: 'Digestione lattosio, pH intestinale ottimale, immunità',
      mechanism: 'Acidificazione intestino previene patogeni, migliora assorbimento minerali'
    },
    activating_foods: ['yogurt', 'kefir', 'kimchi', 'crauti', 'miso', 'tempeh'],
    inhibiting_foods: ['antibiotici', 'conservanti']
  },
  {
    id: 'tma_tmao',
    name: 'Pathway TMA/TMAO',
    description: 'Conversione di colina/carnitina in TMA, poi ossidato a TMAO nel fegato',
    bacteria_involved: ['clostridium', 'escherichia', 'proteus'],
    substrates: ['colina', 'carnitina', 'betaina'],
    products: ['TMA', 'TMAO'],
    athletic_impact: {
      benefit: 'NEGATIVO - TMAO elevato associato a rischio cardiovascolare',
      mechanism: 'TMAO promuove aterosclerosi, riduce utilizzo carnitina'
    },
    activating_foods: ['carne rossa', 'uova (alte dosi)', 'latticini grassi', 'pesce (moderato)'],
    inhibiting_foods: ['fibre', 'polifenoli', 'aglio', 'olio oliva', 'resveratrolo']
  },
  {
    id: 'polyphenol_metabolism',
    name: 'Metabolismo Polifenoli',
    description: 'Trasformazione di polifenoli in metaboliti bioattivi',
    bacteria_involved: ['bifidobacterium', 'lactobacillus', 'akkermansia', 'bacteroides'],
    substrates: ['flavonoidi', 'antociani', 'acido ellagico', 'resveratrolo'],
    products: ['urolitine', 'equolo', 'metaboliti bioattivi'],
    athletic_impact: {
      benefit: 'Anti-infiammatorio, antiossidante, recupero, performance',
      mechanism: 'Urolitine migliorano funzione mitocondriale e autofagia'
    },
    activating_foods: ['melograno', 'frutti di bosco', 'noci', 'tè verde', 'cacao', 'vino rosso (moderato)', 'olio oliva'],
    inhibiting_foods: ['carenza di varietà vegetale']
  },
  {
    id: 'bile_acid_metabolism',
    name: 'Metabolismo Acidi Biliari',
    description: 'Deconiugazione e trasformazione degli acidi biliari',
    bacteria_involved: ['clostridium', 'bacteroides', 'bifidobacterium', 'lactobacillus'],
    substrates: ['acidi biliari primari'],
    products: ['acidi biliari secondari', 'DCA', 'LCA'],
    athletic_impact: {
      benefit: 'Regolazione metabolismo lipidico, segnaling FXR/TGR5',
      mechanism: 'Acidi biliari regolano metabolismo energetico e glucidico via recettori nucleari'
    },
    activating_foods: ['fibre solubili', 'probiotici'],
    inhibiting_foods: ['grassi saturi eccessivi', 'dieta povera di fibre']
  },
  {
    id: 'tryptophan_metabolism',
    name: 'Metabolismo Triptofano',
    description: 'Conversione di triptofano in serotonina, melatonina e indoli',
    bacteria_involved: ['lactobacillus', 'bifidobacterium', 'clostridium'],
    substrates: ['triptofano'],
    products: ['serotonina', 'melatonina', 'indolo', 'indolo-3-propionato'],
    athletic_impact: {
      benefit: 'Umore, sonno, recupero, funzione cerebrale',
      mechanism: '95% serotonina prodotta in intestino, regola motilità e umore'
    },
    activating_foods: ['tacchino', 'pollo', 'uova', 'semi zucca', 'noci', 'banane', 'cacao'],
    inhibiting_foods: ['carenza proteica', 'disbiosi']
  },

  // ==================== NUOVI PATHWAY AGGIUNTI ====================
  {
    id: 'lactate_propionate',
    name: 'Conversione Lattato-Propionato',
    description: 'Batteri che convertono lattato (da esercizio o fermentazione) in propionato',
    bacteria_involved: ['veillonella', 'megasphaera', 'propionibacterium'],
    substrates: ['lattato', 'piruvato'],
    products: ['propionato', 'acetato'],
    athletic_impact: {
      benefit: 'Rimozione lattato intestinale, energia extra, performance elite',
      mechanism: 'Veillonella aumentata negli atleti elite converte lattato in propionato utilizzabile'
    },
    activating_foods: ['esercizio fisico regolare', 'alimenti fermentati con lattobacilli'],
    inhibiting_foods: ['sedentarietà']
  },
  {
    id: 'h2s_production',
    name: 'Produzione H2S (Idrogeno Solforato)',
    description: 'Batteri solfato-riduttori producono H2S, tossico per mucosa',
    bacteria_involved: ['desulfovibrio', 'bilophila'],
    substrates: ['solfato', 'taurina', 'cisteina', 'solfiti'],
    products: ['H2S', 'solfuro'],
    athletic_impact: {
      benefit: 'NEGATIVO - H2S danneggia mucosa, infiammazione, riduce assorbimento',
      mechanism: 'H2S inibisce citocromo c ossidasi, danneggia colonociti'
    },
    activating_foods: ['carne rossa', 'grassi saturi', 'vino con solfiti', 'conservanti'],
    inhibiting_foods: ['fibre', 'dieta plant-based', 'riduzione solfiti']
  },
  {
    id: 'oxalate_degradation',
    name: 'Degradazione Ossalato',
    description: 'Batteri che degradano ossalato prevenendo calcoli renali',
    bacteria_involved: ['oxalobacter', 'lactobacillus'],
    substrates: ['ossalato'],
    products: ['formiato', 'CO2'],
    athletic_impact: {
      benefit: 'Prevenzione calcoli renali, importante per atleti disidratati',
      mechanism: 'Riduce ossalato assorbito, protegge reni durante disidratazione'
    },
    activating_foods: ['prebiotici', 'calcio con pasti (lega ossalato)'],
    inhibiting_foods: ['antibiotici (uccidono Oxalobacter)', 'eccesso spinaci/rabarbaro']
  },
  {
    id: 'gaba_production',
    name: 'Produzione GABA',
    description: 'Batteri producono GABA, neurotrasmettitore inibitorio',
    bacteria_involved: ['lactobacillus', 'bifidobacterium_longum', 'lactobacillus_brevis'],
    substrates: ['glutammato', 'glutammina'],
    products: ['GABA'],
    athletic_impact: {
      benefit: 'Riduzione ansia pre-gara, miglior sonno, recupero mentale',
      mechanism: 'GABA intestinale comunica con cervello via nervo vago'
    },
    activating_foods: ['kimchi', 'tempeh', 'miso', 'tè oolong', 'pomodori'],
    inhibiting_foods: ['stress cronico', 'disbiosi']
  },
  {
    id: 'vitamin_k_synthesis',
    name: 'Sintesi Vitamina K2',
    description: 'Batteri sintetizzano vitamina K2 (menachinone) essenziale per ossa e coagulazione',
    bacteria_involved: ['escherichia', 'bacteroides', 'lactococcus'],
    substrates: ['precursori isoprenoidi'],
    products: ['vitamina K2 (MK-7, MK-9)'],
    athletic_impact: {
      benefit: 'Salute ossea, prevenzione fratture stress, coagulazione',
      mechanism: 'K2 attiva osteocalcina per deposizione calcio in ossa'
    },
    activating_foods: ['natto (fermentato)', 'formaggi stagionati', 'crauti'],
    inhibiting_foods: ['antibiotici prolungati', 'carenza grassi']
  },
  {
    id: 'folate_synthesis',
    name: 'Sintesi Folato',
    description: 'Batteri sintetizzano folato (vitamina B9) essenziale per DNA e metilazione',
    bacteria_involved: ['bifidobacterium', 'lactobacillus', 'streptococcus_thermophilus'],
    substrates: ['GTP', 'p-aminobenzoato'],
    products: ['folato', 'tetraidrofolato'],
    athletic_impact: {
      benefit: 'Sintesi DNA, rigenerazione cellulare, metilazione, eritropoiesi',
      mechanism: 'Folato essenziale per divisione cellulare e produzione globuli rossi'
    },
    activating_foods: ['yogurt', 'kefir', 'verdure a foglia verde'],
    inhibiting_foods: ['antibiotici', 'alcol']
  },
  {
    id: 'histamine_metabolism',
    name: 'Metabolismo Istamina',
    description: 'Alcuni batteri producono istamina (pro-infiammatoria), altri la degradano',
    bacteria_involved: ['lactobacillus', 'morganella', 'klebsiella'],
    substrates: ['istidina'],
    products: ['istamina'],
    athletic_impact: {
      benefit: 'VARIABILE - Eccesso istamina causa sintomi allergici, infiammazione',
      mechanism: 'Batteri con istidina decarbossilasi producono istamina da cibi fermentati'
    },
    activating_foods: ['cibi fermentati vecchi', 'pesce non fresco', 'vino rosso', 'formaggi stagionati'],
    inhibiting_foods: ['cibi freschi', 'Lactobacillus rhamnosus GG (degrada istamina)']
  },
  {
    id: 'equol_production',
    name: 'Produzione Equolo',
    description: 'Conversione di daidzeina (isoflavone soia) in equolo, potente fitoestrogeno',
    bacteria_involved: ['lactobacillus', 'bifidobacterium', 'slackia'],
    substrates: ['daidzeina', 'isoflavoni soia'],
    products: ['equolo', 'O-DMA'],
    athletic_impact: {
      benefit: 'Antiossidante, salute cardiovascolare, ossa (solo ~30-50% popolazione produce equolo)',
      mechanism: 'Equolo più biodisponibile e potente della daidzeina'
    },
    activating_foods: ['soia', 'tofu', 'tempeh', 'edamame', 'latte soia'],
    inhibiting_foods: ['antibiotici', 'assenza batteri equolo-produttori']
  }
]

// ==================== INTERFERENZE ALIMENTARI ====================
export interface FoodMicrobiomeInteraction {
  food_id: string
  food_name: string
  // Effetti su batteri specifici
  bacteria_effects: {
    bacteria_id: string
    effect: 'promotes' | 'inhibits' | 'neutral'
    magnitude: 'low' | 'medium' | 'high'
    mechanism: string
  }[]
  // Pathway influenzati
  pathway_effects: {
    pathway_id: string
    effect: 'activates' | 'inhibits'
    notes: string
  }[]
  // Timing ottimale
  optimal_timing: ('morning' | 'pre_workout' | 'post_workout' | 'evening')[]
  // Note per atleti
  athlete_notes: string
}

export const FOOD_MICROBIOME_INTERACTIONS: FoodMicrobiomeInteraction[] = [
  {
    food_id: 'oats',
    food_name: 'Avena',
    bacteria_effects: [
      { bacteria_id: 'faecalibacterium', effect: 'promotes', magnitude: 'high', mechanism: 'Beta-glucani fermentati a butirrato' },
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'medium', mechanism: 'Fibre prebiotiche' },
      { bacteria_id: 'roseburia', effect: 'promotes', magnitude: 'high', mechanism: 'Amido resistente' }
    ],
    pathway_effects: [
      { pathway_id: 'butyrate_production', effect: 'activates', notes: 'Eccellente fonte di substrati' }
    ],
    optimal_timing: ['morning', 'pre_workout'],
    athlete_notes: 'Ideale 2-3h prima di allenamento. Ricco di beta-glucani per energia sostenuta e salute intestinale.'
  },
  {
    food_id: 'banana_green',
    food_name: 'Banana verde/acerba',
    bacteria_effects: [
      { bacteria_id: 'faecalibacterium', effect: 'promotes', magnitude: 'high', mechanism: 'Alto contenuto amido resistente' },
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'high', mechanism: 'Prebiotico naturale' }
    ],
    pathway_effects: [
      { pathway_id: 'butyrate_production', effect: 'activates', notes: 'Amido resistente tipo 2' }
    ],
    optimal_timing: ['morning', 'post_workout'],
    athlete_notes: 'Più verde = più amido resistente = più prebiotico. Meno dolce ma migliore per microbioma.'
  },
  {
    food_id: 'garlic',
    food_name: 'Aglio',
    bacteria_effects: [
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'high', mechanism: 'Inulina e FOS' },
      { bacteria_id: 'lactobacillus', effect: 'promotes', magnitude: 'medium', mechanism: 'Composti solforati' },
      { bacteria_id: 'escherichia', effect: 'inhibits', magnitude: 'medium', mechanism: 'Allicina antimicrobica' }
    ],
    pathway_effects: [
      { pathway_id: 'butyrate_production', effect: 'activates', notes: 'Via aumento bifidobatteri' },
      { pathway_id: 'tma_tmao', effect: 'inhibits', notes: 'Composti solforati inibiscono TMA liasi' }
    ],
    optimal_timing: ['morning', 'evening'],
    athlete_notes: 'Potente prebiotico. Consumare crudo per massimo beneficio. Evitare pre-gara (digestione).'
  },
  {
    food_id: 'blueberries',
    food_name: 'Mirtilli',
    bacteria_effects: [
      { bacteria_id: 'akkermansia', effect: 'promotes', magnitude: 'high', mechanism: 'Polifenoli stimolano crescita' },
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'medium', mechanism: 'Fibre e polifenoli' }
    ],
    pathway_effects: [
      { pathway_id: 'polyphenol_metabolism', effect: 'activates', notes: 'Ricchi di antociani' }
    ],
    optimal_timing: ['morning', 'post_workout'],
    athlete_notes: 'Superstar per microbioma e performance. Anti-infiammatori, migliorano funzione vascolare.'
  },
  {
    food_id: 'pomegranate',
    food_name: 'Melograno',
    bacteria_effects: [
      { bacteria_id: 'akkermansia', effect: 'promotes', magnitude: 'high', mechanism: 'Acido ellagico convertito in urolitine' }
    ],
    pathway_effects: [
      { pathway_id: 'polyphenol_metabolism', effect: 'activates', notes: 'Precursore urolitine per funzione mitocondriale' }
    ],
    optimal_timing: ['morning', 'post_workout'],
    athlete_notes: 'Le urolitine migliorano funzione mitocondriale. Ottimo per recupero e performance endurance.'
  },
  {
    food_id: 'kefir',
    food_name: 'Kefir',
    bacteria_effects: [
      { bacteria_id: 'lactobacillus', effect: 'promotes', magnitude: 'high', mechanism: 'Apporto diretto di lattobacilli' },
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'high', mechanism: 'Apporto diretto' }
    ],
    pathway_effects: [
      { pathway_id: 'lactate_fermentation', effect: 'activates', notes: 'Probiotico naturale' }
    ],
    optimal_timing: ['morning', 'post_workout'],
    athlete_notes: 'Probiotico naturale potente. Meglio di yogurt per diversità ceppi. Post-workout per recupero.'
  },
  {
    food_id: 'red_meat',
    food_name: 'Carne rossa',
    bacteria_effects: [
      { bacteria_id: 'bacteroides', effect: 'promotes', magnitude: 'medium', mechanism: 'Proteine e grassi' },
      { bacteria_id: 'clostridium', effect: 'promotes', magnitude: 'medium', mechanism: 'Aminoacidi' },
      { bacteria_id: 'prevotella', effect: 'inhibits', magnitude: 'medium', mechanism: 'Riduce con diete carnivore' }
    ],
    pathway_effects: [
      { pathway_id: 'tma_tmao', effect: 'activates', notes: 'Carnitina convertita a TMA' }
    ],
    optimal_timing: ['post_workout', 'evening'],
    athlete_notes: 'Limitare a 2-3 porzioni/settimana. Bilanciare sempre con abbondanti verdure per fibre.'
  },
  {
    food_id: 'olive_oil',
    food_name: 'Olio extravergine oliva',
    bacteria_effects: [
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'medium', mechanism: 'Polifenoli' },
      { bacteria_id: 'akkermansia', effect: 'promotes', magnitude: 'medium', mechanism: 'Polifenoli e acido oleico' }
    ],
    pathway_effects: [
      { pathway_id: 'polyphenol_metabolism', effect: 'activates', notes: 'Ricco di polifenoli' },
      { pathway_id: 'tma_tmao', effect: 'inhibits', notes: 'Polifenoli riducono produzione TMA' }
    ],
    optimal_timing: ['morning', 'evening'],
    athlete_notes: 'Usare a crudo per preservare polifenoli. 2-3 cucchiai/giorno per benefici microbioma.'
  },
  {
    food_id: 'legumes',
    food_name: 'Legumi',
    bacteria_effects: [
      { bacteria_id: 'faecalibacterium', effect: 'promotes', magnitude: 'high', mechanism: 'Amido resistente e fibre' },
      { bacteria_id: 'roseburia', effect: 'promotes', magnitude: 'high', mechanism: 'Fibre complesse' },
      { bacteria_id: 'prevotella', effect: 'promotes', magnitude: 'high', mechanism: 'Carboidrati complessi' }
    ],
    pathway_effects: [
      { pathway_id: 'butyrate_production', effect: 'activates', notes: 'Tra le migliori fonti' }
    ],
    optimal_timing: ['morning', 'evening'],
    athlete_notes: 'Iniziare gradualmente se non abituati. Ammollo riduce gas. Eccellenti per microbioma a lungo termine.'
  },
  {
    food_id: 'cold_potato',
    food_name: 'Patate fredde (cotte e raffreddate)',
    bacteria_effects: [
      { bacteria_id: 'faecalibacterium', effect: 'promotes', magnitude: 'high', mechanism: 'Amido retrogradato = resistente' },
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'medium', mechanism: 'Prebiotico' }
    ],
    pathway_effects: [
      { pathway_id: 'butyrate_production', effect: 'activates', notes: 'Amido resistente tipo 3' }
    ],
    optimal_timing: ['morning', 'post_workout'],
    athlete_notes: 'Trucco: cuoci, raffredda in frigo, mangia fredde o riscalda leggermente. Amido diventa resistente.'
  },
  {
    food_id: 'fermented_foods',
    food_name: 'Alimenti fermentati (kimchi, crauti, miso)',
    bacteria_effects: [
      { bacteria_id: 'lactobacillus', effect: 'promotes', magnitude: 'high', mechanism: 'Apporto diretto massivo' },
      { bacteria_id: 'bifidobacterium', effect: 'promotes', magnitude: 'medium', mechanism: 'Effetto sinergico' }
    ],
    pathway_effects: [
      { pathway_id: 'lactate_fermentation', effect: 'activates', notes: 'Probiotici naturali' }
    ],
    optimal_timing: ['morning', 'evening'],
    athlete_notes: 'Consumare crudi, non pastorizzati. Iniziare con piccole quantità. Diversificare tipologie.'
  }
]

// ==================== HELPER FUNCTIONS ====================

/**
 * Ottiene raccomandazioni alimentari basate su profilo microbioma
 */
export function getMicrobiomeRecommendations(
  bacteriaLevels: Record<string, number>, // id: percentage
  athleteGoals: ('recovery' | 'endurance' | 'strength' | 'weight_loss' | 'gut_health')[]
): {
  foods_to_increase: { food: string; reason: string; priority: 'high' | 'medium' | 'low' }[]
  foods_to_reduce: { food: string; reason: string; priority: 'high' | 'medium' | 'low' }[]
  pathways_to_support: { pathway: string; foods: string[] }[]
} {
  const recommendations = {
    foods_to_increase: [] as { food: string; reason: string; priority: 'high' | 'medium' | 'low' }[],
    foods_to_reduce: [] as { food: string; reason: string; priority: 'high' | 'medium' | 'low' }[],
    pathways_to_support: [] as { pathway: string; foods: string[] }[]
  }

  // Analizza ogni batterio
  for (const bacteria of BACTERIA_DATABASE) {
    const level = bacteriaLevels[bacteria.id] || 0
    const { min, max } = bacteria.optimal_range

    if (level < min) {
      // Batterio troppo basso - aumentare cibi che lo promuovono
      bacteria.promoting_foods.forEach(food => {
        if (!recommendations.foods_to_increase.find(f => f.food === food)) {
          recommendations.foods_to_increase.push({
            food,
            reason: `Aumenta ${bacteria.name} (attuale: ${level.toFixed(1)}%, target: ${min}-${max}%)`,
            priority: level < min * 0.5 ? 'high' : 'medium'
          })
        }
      })
    } else if (level > max) {
      // Batterio troppo alto - ridurre cibi che lo promuovono
      bacteria.promoting_foods.forEach(food => {
        if (!recommendations.foods_to_reduce.find(f => f.food === food)) {
          recommendations.foods_to_reduce.push({
            food,
            reason: `Riduce ${bacteria.name} (attuale: ${level.toFixed(1)}%, target: ${min}-${max}%)`,
            priority: level > max * 1.5 ? 'high' : 'low'
          })
        }
      })
    }
  }

  // Pathway da supportare in base a obiettivi
  if (athleteGoals.includes('recovery') || athleteGoals.includes('endurance')) {
    const butyratePathway = METABOLIC_PATHWAYS.find(p => p.id === 'butyrate_production')
    if (butyratePathway) {
      recommendations.pathways_to_support.push({
        pathway: 'Produzione Butirrato',
        foods: butyratePathway.activating_foods.slice(0, 5)
      })
    }
  }

  if (athleteGoals.includes('gut_health')) {
    const polyphenolPathway = METABOLIC_PATHWAYS.find(p => p.id === 'polyphenol_metabolism')
    if (polyphenolPathway) {
      recommendations.pathways_to_support.push({
        pathway: 'Metabolismo Polifenoli',
        foods: polyphenolPathway.activating_foods.slice(0, 5)
      })
    }
  }

  return recommendations
}

/**
 * Verifica compatibilità di un alimento con profilo microbioma
 */
export function checkFoodMicrobiomeCompatibility(
  foodId: string,
  bacteriaLevels: Record<string, number>
): {
  compatible: boolean
  concerns: string[]
  benefits: string[]
} {
  const interaction = FOOD_MICROBIOME_INTERACTIONS.find(f => f.food_id === foodId)
  if (!interaction) {
    return { compatible: true, concerns: [], benefits: [] }
  }

  const concerns: string[] = []
  const benefits: string[] = []

  for (const effect of interaction.bacteria_effects) {
    const bacteria = BACTERIA_DATABASE.find(b => b.id === effect.bacteria_id)
    if (!bacteria) continue

    const level = bacteriaLevels[effect.bacteria_id] || 0
    const { min, max } = bacteria.optimal_range

    if (effect.effect === 'promotes') {
      if (level > max) {
        concerns.push(`Potrebbe aumentare ulteriormente ${bacteria.name} già alto`)
      } else if (level < min) {
        benefits.push(`Aiuta ad aumentare ${bacteria.name} che è basso`)
      }
    } else if (effect.effect === 'inhibits') {
      if (level < min) {
        concerns.push(`Potrebbe ridurre ulteriormente ${bacteria.name} già basso`)
      } else if (level > max) {
        benefits.push(`Aiuta a ridurre ${bacteria.name} che è alto`)
      }
    }
  }

  return {
    compatible: concerns.length === 0,
    concerns,
    benefits
  }
}

/**
 * Genera piano alimentare ottimizzato per microbioma
 */
export function generateMicrobiomeOptimizedPlan(
  currentBacteria: Record<string, number>,
  intolerances: string[],
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): {
  recommended_foods: string[]
  avoid_foods: string[]
  prebiotics_to_include: string[]
  probiotics_to_include: string[]
} {
  const recommendations = getMicrobiomeRecommendations(currentBacteria, ['gut_health', 'recovery'])
  
  // Filtra per intolleranze
  const isLactoseIntolerant = intolerances.some(i => i.toLowerCase().includes('lattosio'))
  const isGlutenIntolerant = intolerances.some(i => i.toLowerCase().includes('glutine'))

  let prebiotics = ['aglio', 'cipolla', 'asparagi', 'banana', 'avena', 'legumi']
  let probiotics = ['yogurt', 'kefir', 'kimchi', 'crauti', 'miso', 'tempeh']

  if (isLactoseIntolerant) {
    probiotics = probiotics.filter(p => !['yogurt', 'kefir'].includes(p))
    prebiotics.push('kefir di cocco')
  }

  if (isGlutenIntolerant) {
    prebiotics = prebiotics.filter(p => p !== 'avena') // A meno che sia certificata GF
    prebiotics.push('riso', 'quinoa', 'grano saraceno')
  }

  return {
    recommended_foods: recommendations.foods_to_increase.map(f => f.food).slice(0, 10),
    avoid_foods: recommendations.foods_to_reduce.map(f => f.food).slice(0, 5),
    prebiotics_to_include: prebiotics,
    probiotics_to_include: probiotics
  }
}
