// ============================================
// EMPATHY - Database Epigenetico Metabolico
// Geni, stati di espressione, conseguenze e raccomandazioni
// ============================================

export interface GeneExpression {
  state: "normal" | "under_expressed" | "over_expressed" | "polymorphism"
  description: string
  metabolic_consequences: string[]
  symptoms: string[]
  nutritional_recommendations: string[]
  supplement_recommendations: string[]
  training_recommendations: string[]
  foods_to_avoid: string[]
  foods_to_prefer: string[]
}

export interface MetabolicGene {
  id: string
  symbol: string
  full_name: string
  chromosome: string
  category: "glycolysis" | "lipid_metabolism" | "mitochondrial" | "transport" | "muscle_fiber" | "antioxidant" | "amino_acid" | "methylation" | "inflammation"
  pathway: string[]
  function: string
  expression_states: {
    normal: GeneExpression
    under_expressed: GeneExpression
    over_expressed: GeneExpression
    polymorphism?: GeneExpression
  }
  related_genes: string[]
  biomarkers: string[]
  test_panels: string[]
}

// ============================================
// DATABASE GENI METABOLICI
// ============================================

export const METABOLIC_GENES_DATABASE: MetabolicGene[] = [
  // ============================================
  // GLICOLISI E METABOLISMO GLUCIDICO
  // ============================================
  {
    id: "pfk",
    symbol: "PFKM",
    full_name: "Fosfofruttochinasi Muscolare",
    chromosome: "12q13.11",
    category: "glycolysis",
    pathway: ["glicolisi", "via_embden_meyerhof"],
    function: "Enzima limitante della glicolisi. Catalizza la fosforilazione del fruttosio-6-fosfato a fruttosio-1,6-bisfosfato. Regola il flusso glicolitico in risposta allo stato energetico cellulare.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Attività enzimatica nella norma, glicolisi efficiente",
        metabolic_consequences: ["Metabolismo glucidico ottimale", "Produzione ATP efficiente durante esercizio intenso"],
        symptoms: [],
        nutritional_recommendations: ["Dieta bilanciata con carboidrati complessi"],
        supplement_recommendations: [],
        training_recommendations: ["Allenamento HIIT ben tollerato"],
        foods_to_avoid: [],
        foods_to_prefer: ["Cereali integrali", "Frutta", "Verdure"]
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotta attività della fosfofruttochinasi - GLICOLISI RALLENTATA",
        metabolic_consequences: [
          "Difficoltà a degradare fruttosio e glucosio",
          "Accumulo di fruttosio-6-fosfato",
          "Permanenza zuccheri nel lume intestinale",
          "Fermentazione batterica intestinale aumentata",
          "Produzione ridotta di ATP glicolitico",
          "Shift verso metabolismo lipidico compensatorio",
          "Acidosi metabolica durante sforzo intenso"
        ],
        symptoms: [
          "Affaticamento precoce durante esercizio intenso",
          "Crampi muscolari",
          "Gonfiore addominale dopo carboidrati",
          "Intolleranza al fruttosio",
          "Mioglobinuria dopo sforzo",
          "Recupero prolungato"
        ],
        nutritional_recommendations: [
          "Ridurre fruttosio libero (succhi, miele, frutta molto dolce)",
          "Preferire glucosio a fruttosio per energia rapida",
          "Carboidrati a basso indice glicemico",
          "Pasti piccoli e frequenti",
          "Aumentare grassi come fonte energetica"
        ],
        supplement_recommendations: [
          "Ribosio (supporta via pentoso fosfato alternativa)",
          "Creatina (ATP alternativo)",
          "MCT oil (energia non glicolitica)",
          "Probiotici (ridurre fermentazione)",
          "Vitamina B1 (cofattore metabolico)"
        ],
        training_recommendations: [
          "Evitare HIIT prolungato",
          "Preferire steady state a bassa intensità",
          "Zona 2 predominante",
          "Recuperi lunghi tra intervalli",
          "Riscaldamento graduale e prolungato"
        ],
        foods_to_avoid: [
          "Fruttosio libero", "Miele", "Sciroppo d'agave", 
          "Succhi di frutta", "Frutta molto matura",
          "HFCS (sciroppo mais ad alto fruttosio)"
        ],
        foods_to_prefer: [
          "Riso", "Patate", "Maltodestrine",
          "Avena", "Quinoa", "Olio MCT", "Avocado"
        ]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Iperattività glicolitica",
        metabolic_consequences: [
          "Consumo rapido glicogeno",
          "Produzione eccessiva lattato",
          "Acidosi precoce",
          "Deplezione rapida riserve glucidiche"
        ],
        symptoms: [
          "Bruciore muscolare precoce",
          "Fame frequente",
          "Ipoglicemia reattiva"
        ],
        nutritional_recommendations: [
          "Carboidrati a rilascio lento",
          "Combinare sempre carboidrati con proteine/grassi",
          "Evitare zuccheri semplici isolati"
        ],
        supplement_recommendations: [
          "Beta-alanina (buffer lattato)",
          "Bicarbonato di sodio (pre-gara)",
          "Citrullina"
        ],
        training_recommendations: [
          "Allenamento threshold per migliorare clearance lattato",
          "Lavoro sulla soglia anaerobica"
        ],
        foods_to_avoid: ["Zuccheri semplici isolati", "Bevande zuccherate"],
        foods_to_prefer: ["Legumi", "Cereali integrali", "Verdure fibrose"]
      }
    },
    related_genes: ["HK2", "PKM", "LDHA", "PDK4"],
    biomarkers: ["Lattato basale", "Lattato post-esercizio", "Glucosio", "Fruttosio sierico"],
    test_panels: ["Panel metabolico muscolare", "Test da sforzo con lattato"]
  },

  {
    id: "ldha",
    symbol: "LDHA",
    full_name: "Lattato Deidrogenasi A",
    chromosome: "11p15.1",
    category: "glycolysis",
    pathway: ["glicolisi", "metabolismo_lattato", "ciclo_cori"],
    function: "Converte piruvato in lattato durante glicolisi anaerobica. Fondamentale per mantenere NAD+ per continuare glicolisi. Predominante nel muscolo scheletrico.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Conversione piruvato-lattato bilanciata",
        metabolic_consequences: ["Clearance lattato efficiente", "Capacità anaerobica normale"],
        symptoms: [],
        nutritional_recommendations: ["Dieta bilanciata"],
        supplement_recommendations: [],
        training_recommendations: ["Allenamento misto aerobico-anaerobico"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotta capacità di produrre lattato - BLOCCO ANAEROBICO",
        metabolic_consequences: [
          "Incapacità di sostenere sforzi anaerobici",
          "Accumulo piruvato",
          "NAD+ non rigenerato",
          "Glicolisi bloccata ad alte intensità",
          "Mioglobinuria da sforzo"
        ],
        symptoms: [
          "Incapacità di sprintare",
          "Urine scure dopo sforzo intenso",
          "Crampi severi",
          "Affaticamento muscolare acuto"
        ],
        nutritional_recommendations: [
          "Evitare sforzi anaerobici intensi",
          "Aumentare apporto grassi come carburante",
          "Idratazione abbondante"
        ],
        supplement_recommendations: [
          "MCT oil",
          "Creatina",
          "CoQ10"
        ],
        training_recommendations: [
          "Solo aerobico a bassa intensità",
          "NO sprint, NO HIIT",
          "Monitoraggio CK post-allenamento"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Grassi salutari", "Proteine magre"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Produzione eccessiva di lattato - FENOTIPO GLICOLITICO",
        metabolic_consequences: [
          "Iperproduzione lattato",
          "Acidosi muscolare precoce",
          "Shift metabolico verso anaerobico",
          "Ridotta efficienza ossidativa"
        ],
        symptoms: [
          "Bruciore muscolare frequente",
          "Affaticamento durante steady state",
          "Difficoltà a mantenere ritmi costanti"
        ],
        nutritional_recommendations: [
          "Dieta alcalinizzante",
          "Ridurre proteine animali eccessive",
          "Aumentare vegetali"
        ],
        supplement_recommendations: [
          "Beta-alanina",
          "Bicarbonato",
          "Citrullina malato",
          "Magnesio"
        ],
        training_recommendations: [
          "Focus su allenamento aerobico base",
          "Lavoro sotto soglia",
          "Aumentare volume a bassa intensità",
          "Allenamento polarizzato"
        ],
        foods_to_avoid: ["Eccesso proteine", "Alcol"],
        foods_to_prefer: ["Frutta", "Verdura", "Alimenti alcalinizzanti"]
      }
    },
    related_genes: ["LDHB", "MCT1", "MCT4", "PDH"],
    biomarkers: ["Lattato basale", "Curva lattato", "LDH sierico", "Rapporto LDH-A/LDH-B"],
    test_panels: ["Test lattato incrementale", "Biopsia muscolare"]
  },

  {
    id: "pdk4",
    symbol: "PDK4",
    full_name: "Piruvato Deidrogenasi Chinasi 4",
    chromosome: "7q21.3",
    category: "glycolysis",
    pathway: ["regolazione_pdh", "switch_metabolico", "flessibilita_metabolica"],
    function: "Inibisce il complesso PDH, bloccando l'ingresso del piruvato nel ciclo di Krebs. Regola lo switch tra metabolismo glucidico e lipidico.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Flessibilità metabolica ottimale",
        metabolic_consequences: ["Switch efficiente grassi/carboidrati", "Adattamento metabolico all'esercizio"],
        symptoms: [],
        nutritional_recommendations: ["Periodizzazione carboidrati"],
        supplement_recommendations: [],
        training_recommendations: ["Train low, compete high"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "PDH sempre attivo - DIPENDENZA DA CARBOIDRATI",
        metabolic_consequences: [
          "Incapacità di usare grassi come carburante",
          "Consumo rapido glicogeno",
          "Ipoglicemia durante esercizio prolungato",
          "Crisi energetica in deplezione glucidica"
        ],
        symptoms: [
          "Fame costante durante allenamento",
          "Crisi di fame improvvise (bonking)",
          "Difficoltà a dimagrire",
          "Dipendenza da gel/carboidrati"
        ],
        nutritional_recommendations: [
          "Training low occasionale per stimolare adattamento",
          "Aumentare gradualmente grassi nella dieta",
          "Non eliminare carboidrati ma periodizzare"
        ],
        supplement_recommendations: [
          "MCT oil (bypassano il blocco)",
          "Carnitina",
          "Caffeina (mobilizza grassi)"
        ],
        training_recommendations: [
          "Allenamenti a digiuno occasionali",
          "Long slow distance",
          "Ridurre carboidrati durante allenamenti base"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Grassi salutari", "MCT", "Avocado", "Noci"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "PDH cronicamente inibito - RIGIDITÀ METABOLICA VERSO GRASSI",
        metabolic_consequences: [
          "Incapacità di usare carboidrati efficientemente",
          "Glucosio non entra nel Krebs",
          "Iperglicemia post-prandiale",
          "Pseudo-diabete metabolico",
          "Performance compromessa ad alte intensità"
        ],
        symptoms: [
          "Glicemia alta dopo pasti",
          "Difficoltà negli sprint",
          "Stanchezza post-prandiale",
          "Insulino-resistenza funzionale"
        ],
        nutritional_recommendations: [
          "Reintrodurre carboidrati gradualmente",
          "Evitare diete chetogeniche prolungate",
          "Carboidrati attorno all'allenamento"
        ],
        supplement_recommendations: [
          "Acido alfa-lipoico",
          "Cromo",
          "Berberina"
        ],
        training_recommendations: [
          "Allenamenti con carboidrati",
          "HIIT per riattivare metabolismo glucidico",
          "Evitare allenamenti a digiuno"
        ],
        foods_to_avoid: ["Eccesso grassi saturi"],
        foods_to_prefer: ["Carboidrati a basso IG", "Fibre"]
      }
    },
    related_genes: ["PDH", "PFKM", "CPT1A"],
    biomarkers: ["Glicemia a digiuno", "HOMA-IR", "Quoziente respiratorio (RQ)", "Lattato soglia"],
    test_panels: ["Test flessibilità metabolica", "Calorimetria indiretta"]
  },

  // ============================================
  // METABOLISMO LIPIDICO
  // ============================================
  {
    id: "cpt1a",
    symbol: "CPT1A",
    full_name: "Carnitina Palmitoiltransferasi 1A",
    chromosome: "11q13.3",
    category: "lipid_metabolism",
    pathway: ["beta_ossidazione", "trasporto_acidi_grassi", "metabolismo_mitocondriale"],
    function: "Enzima chiave per il trasporto degli acidi grassi a catena lunga nei mitocondri. Rate-limiting step della beta-ossidazione.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Trasporto lipidico mitocondriale efficiente",
        metabolic_consequences: ["Beta-ossidazione ottimale", "Buona capacità endurance"],
        symptoms: [],
        nutritional_recommendations: ["Dieta con grassi salutari"],
        supplement_recommendations: ["Carnitina se necessario"],
        training_recommendations: ["Allenamento endurance ben tollerato"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Trasporto lipidico compromesso - DEFICIT BETA-OSSIDAZIONE",
        metabolic_consequences: [
          "Incapacità di bruciare grassi a catena lunga",
          "Accumulo acidi grassi citosolici",
          "Dipendenza totale da carboidrati",
          "Ipoglicemia a digiuno",
          "Steatosi epatica",
          "Cardiomiopatia se severo"
        ],
        symptoms: [
          "Ipoglicemia dopo digiuno",
          "Debolezza muscolare",
          "Epatomegalia",
          "Intolleranza al digiuno",
          "Miopatia metabolica"
        ],
        nutritional_recommendations: [
          "Evitare digiuno prolungato",
          "Pasti frequenti con carboidrati",
          "MCT oil (bypassano CPT1)",
          "Limitare grassi a catena lunga"
        ],
        supplement_recommendations: [
          "MCT oil (FONDAMENTALE)",
          "Carnitina",
          "Ribosio",
          "CoQ10"
        ],
        training_recommendations: [
          "Mai allenarsi a digiuno",
          "Carboidrati costanti durante esercizio",
          "Evitare ultraendurance",
          "Monitoraggio CK e glicemia"
        ],
        foods_to_avoid: ["Grassi a catena lunga in eccesso", "Digiuno"],
        foods_to_prefer: ["MCT", "Olio di cocco", "Carboidrati complessi"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Iperfunzione trasporto lipidico",
        metabolic_consequences: [
          "Eccellente ossidazione grassi",
          "Risparmio glicogeno",
          "Fenotipo endurance"
        ],
        symptoms: [
          "Difficoltà a prendere peso",
          "Possibile difficoltà in sprint"
        ],
        nutritional_recommendations: [
          "Sfruttare capacità di usare grassi",
          "Periodizzazione con fasi low-carb"
        ],
        supplement_recommendations: [
          "Carnitina per ottimizzare",
          "Caffeina"
        ],
        training_recommendations: [
          "Eccellente per ultraendurance",
          "Train low, compete high"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Grassi salutari", "Omega-3"]
      }
    },
    related_genes: ["CPT2", "ACADVL", "ACADM", "HADHA"],
    biomarkers: ["Acilcarnitine", "Carnitina libera", "Profilo acidi grassi", "CK"],
    test_panels: ["Screening acilcarnitine", "Test genetico beta-ossidazione"]
  },

  {
    id: "ppargc1a",
    symbol: "PPARGC1A",
    full_name: "PGC-1alfa (Peroxisome Proliferator-Activated Receptor Gamma Coactivator 1-Alpha)",
    chromosome: "4p15.2",
    category: "mitochondrial",
    pathway: ["biogenesi_mitocondriale", "termogenesi", "metabolismo_ossidativo"],
    function: "Master regulator della biogenesi mitocondriale. Controlla l'espressione di geni del metabolismo ossidativo, trasformazione fibre muscolari, e termogenesi.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Biogenesi mitocondriale normale",
        metabolic_consequences: ["Adattamento all'allenamento endurance", "Densità mitocondriale adeguata"],
        symptoms: [],
        nutritional_recommendations: ["Dieta antiossidante"],
        supplement_recommendations: [],
        training_recommendations: ["Allenamento endurance progressivo"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotta biogenesi mitocondriale - INEFFICIENZA OSSIDATIVA",
        metabolic_consequences: [
          "Pochi mitocondri",
          "Bassa capacità ossidativa",
          "Scarsa resistenza aerobica",
          "Accumulo ROS",
          "Invecchiamento precoce muscolare",
          "Insulino-resistenza",
          "Difficoltà adattamento all'allenamento"
        ],
        symptoms: [
          "Affaticamento cronico",
          "Scarsa resistenza",
          "Recupero lento",
          "Difficoltà a migliorare VO2max",
          "Dolori muscolari persistenti"
        ],
        nutritional_recommendations: [
          "Dieta ricca di antiossidanti",
          "Polifenoli (resveratrolo, quercetina)",
          "Restrizione calorica intermittente",
          "Evitare eccesso calorico"
        ],
        supplement_recommendations: [
          "Resveratrolo",
          "CoQ10",
          "NAD+ precursori (NMN, NR)",
          "PQQ",
          "Alfa-lipoico",
          "EGCG (tè verde)"
        ],
        training_recommendations: [
          "Allenamento endurance costante",
          "HIIT per stimolare biogenesi",
          "Allenamento in ipossia simulata",
          "Training in cold"
        ],
        foods_to_avoid: ["Eccesso calorico", "Zuccheri raffinati", "Grassi trans"],
        foods_to_prefer: ["Frutti di bosco", "Tè verde", "Uva rossa", "Cacao", "Curcuma"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Alta biogenesi mitocondriale - FENOTIPO ENDURANCE",
        metabolic_consequences: [
          "Alta densità mitocondriale",
          "Eccellente capacità ossidativa",
          "Buon utilizzo grassi",
          "Resistenza alla fatica"
        ],
        symptoms: [],
        nutritional_recommendations: [
          "Supportare con antiossidanti",
          "Non limitare troppo calorie"
        ],
        supplement_recommendations: [
          "CoQ10 per supportare catena respiratoria",
          "Antiossidanti moderati"
        ],
        training_recommendations: [
          "Sfruttare predisposizione endurance",
          "Attenzione a overtraining"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Alimenti ricchi nutrienti", "Omega-3"]
      },
      polymorphism: {
        state: "polymorphism",
        description: "Variante Gly482Ser - risposta ridotta all'allenamento",
        metabolic_consequences: [
          "Minore adattamento mitocondriale all'allenamento",
          "Rischio aumentato diabete tipo 2"
        ],
        symptoms: ["Plateau prestazionali", "Difficoltà a migliorare"],
        nutritional_recommendations: ["Interventi nutrizionali più aggressivi"],
        supplement_recommendations: ["Resveratrolo", "Berberina", "Metformina (medico)"],
        training_recommendations: ["Volume allenamento maggiore per compensare"],
        foods_to_avoid: [],
        foods_to_prefer: ["Attivatori AMPK naturali"]
      }
    },
    related_genes: ["TFAM", "NRF1", "NRF2", "SIRT1", "AMPK"],
    biomarkers: ["VO2max", "Soglia lattato", "Biopsia muscolare (densità mitocondriale)"],
    test_panels: ["Test genetico sport", "Biopsia muscolare"]
  },

  // ============================================
  // FIBRE MUSCOLARI E PERFORMANCE
  // ============================================
  {
    id: "actn3",
    symbol: "ACTN3",
    full_name: "Alfa-Actinina-3",
    chromosome: "11q13.2",
    category: "muscle_fiber",
    pathway: ["struttura_sarcomero", "contrazione_rapida", "fibre_tipo_II"],
    function: "Proteina strutturale esclusiva delle fibre muscolari veloci (tipo IIx). Determina la capacità di generare contrazioni rapide e potenti.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Genotipo RR o RX - Alfa-actinina-3 presente",
        metabolic_consequences: [
          "Fibre veloci funzionali",
          "Buona potenza muscolare",
          "Capacità sprint"
        ],
        symptoms: [],
        nutritional_recommendations: ["Proteine adeguate per massa muscolare"],
        supplement_recommendations: ["Creatina per potenza"],
        training_recommendations: ["Allenamento forza e potenza efficace"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Genotipo XX - DEFICIT ALFA-ACTININA-3",
        metabolic_consequences: [
          "Assenza fibre tipo IIx funzionali",
          "Shift verso fibre lente (tipo I)",
          "Metabolismo più ossidativo",
          "Ridotta potenza massimale",
          "Maggiore efficienza endurance"
        ],
        symptoms: [
          "Difficoltà in sprint e salti",
          "Forza esplosiva ridotta",
          "Eccellente resistenza",
          "Recupero rapido tra sforzi"
        ],
        nutritional_recommendations: [
          "Sfruttare predisposizione endurance",
          "Carboidrati per allenamenti lunghi"
        ],
        supplement_recommendations: [
          "Creatina (può aiutare parzialmente)",
          "Beta-alanina",
          "Caffeina per compensare"
        ],
        training_recommendations: [
          "Focus su endurance dove eccelle",
          "Allenamento forza per compensare deficit",
          "Non aspettarsi progressi rapidi in potenza",
          "Volume alto, intensità moderata"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Alimenti per endurance"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Genotipo RR con alta espressione - FENOTIPO POTENZA",
        metabolic_consequences: [
          "Fibre veloci molto sviluppate",
          "Alta potenza e velocità",
          "Metabolismo più glicolitico"
        ],
        symptoms: [
          "Eccellente in sprint",
          "Affaticamento rapido in endurance"
        ],
        nutritional_recommendations: [
          "Proteine elevate",
          "Carboidrati pre-performance"
        ],
        supplement_recommendations: [
          "Creatina (risposta ottimale)",
          "HMB",
          "EAA"
        ],
        training_recommendations: [
          "Allenamento potenza e forza",
          "Sprint",
          "Evitare volumi eccessivi"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Proteine nobili", "Carboidrati timing"]
      }
    },
    related_genes: ["ACTN2", "MYH7", "MYH1", "MYH2"],
    biomarkers: ["Test salto", "Peak power", "Composizione corporea"],
    test_panels: ["Test genetico sport", "Test Wingate"]
  },

  {
    id: "ace",
    symbol: "ACE",
    full_name: "Enzima di Conversione dell'Angiotensina",
    chromosome: "17q23.3",
    category: "muscle_fiber",
    pathway: ["sistema_renina_angiotensina", "regolazione_vascolare", "ipertrofia_muscolare"],
    function: "Converte angiotensina I in angiotensina II. Il polimorfismo I/D influenza la predisposizione a endurance vs potenza.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Genotipo ID - Profilo misto",
        metabolic_consequences: ["Buon bilanciamento endurance/potenza"],
        symptoms: [],
        nutritional_recommendations: ["Dieta bilanciata"],
        supplement_recommendations: [],
        training_recommendations: ["Risponde bene a entrambi i tipi di allenamento"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Genotipo II - Bassa attività ACE - FENOTIPO ENDURANCE",
        metabolic_consequences: [
          "Maggiore efficienza muscolare",
          "Migliore utilizzo ossigeno",
          "Risposta bradichinina aumentata",
          "Vasodilatazione favorita"
        ],
        symptoms: [
          "Eccellente resistenza",
          "Recupero rapido",
          "Pressione tendenzialmente bassa"
        ],
        nutritional_recommendations: [
          "Carboidrati per endurance",
          "Sodio adeguato se pressione bassa"
        ],
        supplement_recommendations: [
          "Beetroot juice (nitrati)",
          "Ferro se necessario"
        ],
        training_recommendations: [
          "Focus endurance",
          "Allenamento ipossico ben tollerato",
          "Ottimo per maratona, ciclismo, triathlon"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Barbabietola", "Verdure a foglia verde"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Genotipo DD - Alta attività ACE - FENOTIPO POTENZA",
        metabolic_consequences: [
          "Maggiore risposta ipertrofica",
          "Vasocostrizione relativa",
          "Ritenzione sodio",
          "Pressione tendenzialmente alta"
        ],
        symptoms: [
          "Risposta rapida all'allenamento forza",
          "Buon guadagno massa muscolare",
          "Possibile ipertensione"
        ],
        nutritional_recommendations: [
          "Proteine elevate",
          "Moderare sodio",
          "Potassio adeguato"
        ],
        supplement_recommendations: [
          "Creatina",
          "Citrullina",
          "Omega-3 per profilo pressorio"
        ],
        training_recommendations: [
          "Focus forza e potenza",
          "Risposta ottimale a ipertrofia",
          "Monitorare pressione"
        ],
        foods_to_avoid: ["Eccesso sodio"],
        foods_to_prefer: ["Alimenti ricchi potassio", "Omega-3"]
      }
    },
    related_genes: ["ACTN3", "AGT", "AGTR1", "BDKRB2"],
    biomarkers: ["Pressione arteriosa", "VO2max", "Massa muscolare"],
    test_panels: ["Test genetico sport", "Profilo pressorio"]
  },

  // ============================================
  // ANTIOSSIDANTI E DETOSSIFICAZIONE
  // ============================================
  {
    id: "sod2",
    symbol: "SOD2",
    full_name: "Superossido Dismutasi 2 (Mitocondriale)",
    chromosome: "6q25.3",
    category: "antioxidant",
    pathway: ["difesa_antiossidante", "detossificazione_ROS", "protezione_mitocondriale"],
    function: "Enzima antiossidante mitocondriale. Converte il superossido in perossido di idrogeno, proteggendo i mitocondri dal danno ossidativo.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Difesa antiossidante mitocondriale normale",
        metabolic_consequences: ["Protezione ROS adeguata", "Mitocondri protetti"],
        symptoms: [],
        nutritional_recommendations: ["Dieta ricca antiossidanti"],
        supplement_recommendations: [],
        training_recommendations: ["Recupero adeguato tra sessioni intense"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Difesa antiossidante compromessa - STRESS OSSIDATIVO ELEVATO",
        metabolic_consequences: [
          "Accumulo ROS mitocondriali",
          "Danno DNA mitocondriale",
          "Disfunzione mitocondriale progressiva",
          "Infiammazione cronica",
          "Invecchiamento accelerato",
          "Rischio malattie degenerative"
        ],
        symptoms: [
          "Recupero molto lento",
          "Dolori muscolari persistenti",
          "Affaticamento cronico",
          "Infezioni frequenti",
          "Infiammazione sistemica"
        ],
        nutritional_recommendations: [
          "Dieta MOLTO ricca antiossidanti",
          "Evitare cibi pro-infiammatori",
          "Dieta mediterranea",
          "Curcuma, zenzero quotidiani"
        ],
        supplement_recommendations: [
          "Vitamina C (1-2g/die)",
          "Vitamina E naturale",
          "CoQ10",
          "NAC (N-acetilcisteina)",
          "Astaxantina",
          "Glutatione liposomiale",
          "Alfa-lipoico"
        ],
        training_recommendations: [
          "Volumi moderati",
          "Recupero prolungato",
          "Evitare overreaching",
          "No HIIT consecutivi",
          "Monitorare markers infiammazione"
        ],
        foods_to_avoid: ["Fritti", "Carni processate", "Zuccheri", "Alcol", "Cibi industriali"],
        foods_to_prefer: ["Frutti di bosco", "Verdure colorate", "Curcuma", "Tè verde", "Cacao", "Noci"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Alta capacità antiossidante",
        metabolic_consequences: [
          "Ottima protezione ROS",
          "Recupero efficiente"
        ],
        symptoms: [],
        nutritional_recommendations: ["Mantenere dieta antiossidante"],
        supplement_recommendations: ["Antiossidanti moderati, non eccessivi"],
        training_recommendations: ["Può tollerare carichi elevati"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      polymorphism: {
        state: "polymorphism",
        description: "Variante Ala16Val (rs4880) - Efficienza ridotta",
        metabolic_consequences: [
          "SOD2 meno stabile",
          "Trasporto mitocondriale ridotto",
          "Stress ossidativo aumentato"
        ],
        symptoms: ["Recupero lento", "Sensibilità overtraining"],
        nutritional_recommendations: ["Antiossidanti elevati"],
        supplement_recommendations: ["MitoQ", "CoQ10", "NAC"],
        training_recommendations: ["Gestione attenta del carico"],
        foods_to_avoid: ["Pro-ossidanti"],
        foods_to_prefer: ["Antiossidanti mirati"]
      }
    },
    related_genes: ["SOD1", "CAT", "GPX1", "NRF2"],
    biomarkers: ["8-OHdG", "MDA", "Glutatione", "TBARS", "PCR"],
    test_panels: ["Panel stress ossidativo", "Markers infiammazione"]
  },

  {
    id: "gstm1",
    symbol: "GSTM1",
    full_name: "Glutatione S-Transferasi Mu 1",
    chromosome: "1p13.3",
    category: "antioxidant",
    pathway: ["detossificazione_fase_II", "coniugazione_glutatione", "eliminazione_xenobiotici"],
    function: "Enzima di detossificazione fase II. Coniuga glutatione a composti tossici per facilitarne l'eliminazione. Protegge da carcinogeni e ROS.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Detossificazione fase II normale",
        metabolic_consequences: ["Eliminazione tossine efficiente"],
        symptoms: [],
        nutritional_recommendations: ["Verdure crucifere"],
        supplement_recommendations: [],
        training_recommendations: [],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Delezione GSTM1 null - DETOSSIFICAZIONE COMPROMESSA (50% popolazione)",
        metabolic_consequences: [
          "Ridotta capacità detossificazione",
          "Accumulo metaboliti tossici",
          "Sensibilità a inquinanti",
          "Rischio aumentato tumori",
          "Danno ossidativo aumentato"
        ],
        symptoms: [
          "Sensibilità chimica multipla",
          "Reazioni a farmaci",
          "Intolleranza alcol",
          "Emicranie da esposizioni ambientali"
        ],
        nutritional_recommendations: [
          "Crucifere QUOTIDIANE (attivano vie alternative)",
          "Aglio, cipolla (supportano glutatione)",
          "Evitare cibi con pesticidi",
          "Biologico quando possibile"
        ],
        supplement_recommendations: [
          "NAC",
          "Glutatione liposomiale",
          "Sulforafano (estratto broccoli)",
          "Vitamina C",
          "Selenio"
        ],
        training_recommendations: [
          "Evitare allenamento in zone inquinate",
          "Preferire indoor con aria filtrata se inquinamento alto",
          "Idratazione abbondante"
        ],
        foods_to_avoid: ["Carni alla griglia bruciacchiate", "Alcol", "Cibi industriali", "Pesticidi"],
        foods_to_prefer: ["Broccoli", "Cavolo", "Cavolfiore", "Rucola", "Aglio", "Cipolla"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Alta capacità detossificazione",
        metabolic_consequences: ["Ottima eliminazione tossine"],
        symptoms: [],
        nutritional_recommendations: ["Mantenere apporto crucifere"],
        supplement_recommendations: [],
        training_recommendations: [],
        foods_to_avoid: [],
        foods_to_prefer: []
      }
    },
    related_genes: ["GSTT1", "GSTP1", "NQO1", "CYP1A1"],
    biomarkers: ["Glutatione eritrocitario", "Acido mercapturico urinario"],
    test_panels: ["Panel detossificazione genetico"]
  },

  // ============================================
  // METABOLISMO AMINOACIDI
  // ============================================
  {
    id: "bckdh",
    symbol: "BCKDHA",
    full_name: "Complesso Deidrogenasi degli Alfa-Chetoacidi a Catena Ramificata",
    chromosome: "19q13.2",
    category: "amino_acid",
    pathway: ["catabolismo_bcaa", "metabolismo_leucina", "ciclo_krebs"],
    function: "Enzima chiave nel catabolismo dei BCAA (leucina, isoleucina, valina). Decarbossila i chetoacidi derivati dai BCAA.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Catabolismo BCAA normale",
        metabolic_consequences: ["Utilizzo BCAA efficiente", "Energia da aminoacidi normale"],
        symptoms: [],
        nutritional_recommendations: ["Proteine adeguate"],
        supplement_recommendations: ["BCAA se allenamento intenso"],
        training_recommendations: [],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotto catabolismo BCAA - ACCUMULO BCAA",
        metabolic_consequences: [
          "Accumulo BCAA e chetoacidi",
          "Potenziale neurotossicità",
          "Ridotta produzione energia da proteine",
          "Se severo: malattia sciroppo d'acero"
        ],
        symptoms: [
          "Odore dolciastro urine/sudore (se severo)",
          "Affaticamento con diete iperproteiche",
          "Confusione dopo pasti proteici"
        ],
        nutritional_recommendations: [
          "Non eccedere con proteine",
          "Distribuire proteine nei pasti",
          "Evitare supplementi BCAA isolati"
        ],
        supplement_recommendations: [
          "Tiamina (cofattore BCKDH)",
          "Vitamina B6"
        ],
        training_recommendations: [
          "Evitare supplementi BCAA",
          "Proteine moderate"
        ],
        foods_to_avoid: ["Eccesso proteine", "BCAA isolati"],
        foods_to_prefer: ["Proteine distribuite", "Carboidrati bilanciati"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Catabolismo BCAA accelerato",
        metabolic_consequences: [
          "Consumo rapido BCAA",
          "Maggiore fabbisogno proteico",
          "Rischio catabolismo muscolare"
        ],
        symptoms: [
          "Perdita massa magra se proteine insufficienti",
          "Fame proteica"
        ],
        nutritional_recommendations: [
          "Proteine elevate (2-2.5g/kg)",
          "BCAA supplementari utili"
        ],
        supplement_recommendations: [
          "BCAA",
          "HMB",
          "EAA"
        ],
        training_recommendations: [
          "Proteine post-workout essenziali",
          "BCAA intra-workout"
        ],
        foods_to_avoid: [],
        foods_to_prefer: ["Proteine nobili", "Leucina-rich foods"]
      }
    },
    related_genes: ["BCAT1", "BCAT2", "DBT", "DLD"],
    biomarkers: ["BCAA plasmatici", "Chetoacidi urinari", "Leucina/Isoleucina/Valina"],
    test_panels: ["Aminoacidogramma", "Acidi organici urinari"]
  },

  // ============================================
  // METILAZIONE E FOLATI
  // ============================================
  {
    id: "mthfr",
    symbol: "MTHFR",
    full_name: "Metilentetraidrofolato Reduttasi",
    chromosome: "1p36.22",
    category: "methylation",
    pathway: ["ciclo_folati", "metilazione", "sintesi_DNA", "omocisteina"],
    function: "Converte 5,10-metilentetraidrofolato in 5-metiltetraidrofolato, la forma attiva del folato per la metilazione.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Ciclo metilazione efficiente",
        metabolic_consequences: ["Metilazione DNA normale", "Omocisteina normale"],
        symptoms: [],
        nutritional_recommendations: ["Folati da verdure"],
        supplement_recommendations: [],
        training_recommendations: [],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Variante C677T/A1298C - METILAZIONE RIDOTTA",
        metabolic_consequences: [
          "Ridotta produzione metilfolato",
          "Iperomocisteinemia",
          "Metilazione DNA alterata",
          "Sintesi neurotrasmettitori compromessa",
          "Rischio cardiovascolare aumentato",
          "Possibile depressione/ansia"
        ],
        symptoms: [
          "Affaticamento cronico",
          "Nebbia mentale",
          "Ansia/depressione",
          "Insonnia",
          "Emicrania",
          "Problemi cardiovascolari"
        ],
        nutritional_recommendations: [
          "Verdure a foglia verde (folati naturali)",
          "Evitare acido folico sintetico",
          "Alimenti metilati naturalmente"
        ],
        supplement_recommendations: [
          "Metilfolato (5-MTHF) - NON acido folico",
          "Metilcobalamina (B12 metilata)",
          "P5P (B6 attiva)",
          "Betaina (TMG)",
          "Riboflavina"
        ],
        training_recommendations: [
          "Recupero adeguato",
          "Gestione stress (cortisolo consuma metilazione)",
          "Sonno prioritario"
        ],
        foods_to_avoid: ["Cibi fortificati con acido folico sintetico", "Alcol"],
        foods_to_prefer: ["Spinaci", "Asparagi", "Lenticchie", "Fegato", "Uova", "Avocado"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Alta attività MTHFR",
        metabolic_consequences: ["Metilazione efficiente", "Omocisteina bassa"],
        symptoms: [],
        nutritional_recommendations: ["Mantenere apporto folati"],
        supplement_recommendations: [],
        training_recommendations: [],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      polymorphism: {
        state: "polymorphism",
        description: "Omozigote C677T (TT) - 70% riduzione attività",
        metabolic_consequences: [
          "Attività MTHFR ridotta al 30%",
          "Iperomocisteinemia significativa",
          "Rischio trombotico aumentato"
        ],
        symptoms: ["Come under_expressed ma più severi"],
        nutritional_recommendations: ["Metilfolato essenziale"],
        supplement_recommendations: ["Metilfolato 800-1600mcg", "B12 metilata"],
        training_recommendations: ["Idratazione, monitoraggio cardiovascolare"],
        foods_to_avoid: ["Acido folico sintetico assolutamente"],
        foods_to_prefer: ["Folati naturali"]
      }
    },
    related_genes: ["MTR", "MTRR", "COMT", "CBS", "BHMT"],
    biomarkers: ["Omocisteina", "Folato sierico", "B12", "SAMe/SAH ratio"],
    test_panels: ["Panel metilazione genetico", "Omocisteina"]
  },

  // ============================================
  // INFIAMMAZIONE
  // ============================================
  {
    id: "il6",
    symbol: "IL6",
    full_name: "Interleuchina 6",
    chromosome: "7p15.3",
    category: "inflammation",
    pathway: ["risposta_infiammatoria", "risposta_esercizio", "miochina"],
    function: "Citochina pro-infiammatoria ma anche miochina rilasciata durante esercizio. Ruolo duale in infiammazione e adattamento.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Risposta IL-6 bilanciata",
        metabolic_consequences: ["Adattamento all'esercizio normale", "Infiammazione controllata"],
        symptoms: [],
        nutritional_recommendations: ["Dieta anti-infiammatoria"],
        supplement_recommendations: [],
        training_recommendations: [],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Bassa risposta IL-6 - ADATTAMENTO RIDOTTO",
        metabolic_consequences: [
          "Minore risposta adattativa all'esercizio",
          "Ridotta mobilizzazione energetica durante sforzo",
          "Minore comunicazione muscolo-organi"
        ],
        symptoms: [
          "Plateau prestazionali",
          "Scarso adattamento all'allenamento"
        ],
        nutritional_recommendations: [
          "Proteine adeguate",
          "Zinco (supporta segnaling)"
        ],
        supplement_recommendations: [
          "Zinco",
          "Vitamina D"
        ],
        training_recommendations: [
          "Variare stimoli allenamento",
          "Includere HIIT per stimolare risposta"
        ],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      over_expressed: {
        state: "over_expressed",
        description: "IL-6 cronicamente elevata - INFIAMMAZIONE CRONICA",
        metabolic_consequences: [
          "Stato infiammatorio sistemico",
          "Catabolismo muscolare",
          "Insulino-resistenza",
          "Fatica centrale",
          "Rischio overtraining"
        ],
        symptoms: [
          "Affaticamento persistente",
          "Dolori diffusi",
          "Recupero impossibile",
          "Infezioni ricorrenti",
          "Calo performance",
          "Disturbi sonno"
        ],
        nutritional_recommendations: [
          "Dieta anti-infiammatoria stretta",
          "Omega-3 elevati",
          "Curcuma quotidiana",
          "Evitare zuccheri e cibi processati"
        ],
        supplement_recommendations: [
          "Omega-3 (3-4g/die)",
          "Curcumina",
          "Vitamina D",
          "Zinco",
          "Boswellia",
          "SPM (mediatori pro-risolventi)"
        ],
        training_recommendations: [
          "RIDURRE CARICO URGENTE",
          "Deload o rest week",
          "Solo attività rigenerativa",
          "Priorità assoluta al recupero",
          "Monitorare HRV"
        ],
        foods_to_avoid: ["Zuccheri", "Omega-6 in eccesso", "Alcol", "Cibi processati", "Glutine se sensibili"],
        foods_to_prefer: ["Pesce grasso", "Curcuma", "Zenzero", "Frutti di bosco", "Verdure", "Olio EVO"]
      }
    },
    related_genes: ["TNF", "IL1B", "IL10", "CRP"],
    biomarkers: ["IL-6 sierico", "PCR", "VES", "Ferritina"],
    test_panels: ["Panel citochine", "Markers infiammazione"]
  },

  // ============================================
  // NUOVI GENI AGGIUNTI - METABOLISMO E PERFORMANCE
  // ============================================

  // METABOLISMO ENERGETICO
  {
    id: "ucp2",
    symbol: "UCP2",
    full_name: "Uncoupling Protein 2",
    chromosome: "11q13.4",
    category: "mitochondrial",
    pathway: ["termogenesi", "disaccoppiamento_mitocondriale", "protezione_ROS"],
    function: "Disaccoppia la fosforilazione ossidativa, dissipando energia come calore. Protegge dai ROS riducendo potenziale di membrana mitocondriale.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Bilancio tra efficienza energetica e protezione antiossidante",
        metabolic_consequences: ["Produzione ATP normale", "Protezione ROS adeguata"],
        symptoms: [],
        nutritional_recommendations: ["Dieta bilanciata"],
        supplement_recommendations: [],
        training_recommendations: ["Allenamento standard"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Alta efficienza energetica ma vulnerabilità a stress ossidativo",
        metabolic_consequences: ["Maggiore produzione ATP", "Aumento ROS", "Danno mitocondriale accelerato"],
        symptoms: ["Affaticamento post-allenamento intenso", "Recupero lento", "Invecchiamento precoce"],
        nutritional_recommendations: ["Aumentare antiossidanti", "Dieta ricca polifenoli"],
        supplement_recommendations: ["CoQ10", "NAC", "Vitamina C", "Vitamina E", "Alpha-lipoic acid"],
        training_recommendations: ["Evitare overtraining", "Monitorare recupero", "Periodizzazione attenta"],
        foods_to_avoid: ["Cibi pro-ossidanti", "Fritture", "Oli raffinati"],
        foods_to_prefer: ["Frutti di bosco", "Cacao", "Tè verde", "Verdure colorate"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Bassa efficienza energetica - dispersione come calore",
        metabolic_consequences: ["Ridotta produzione ATP", "Termogenesi aumentata", "Difficoltà a mantenere peso"],
        symptoms: ["Difficoltà a ingrassare", "Sensazione di caldo", "Fame frequente", "Fatica energetica"],
        nutritional_recommendations: ["Aumentare calorie", "Carboidrati frequenti"],
        supplement_recommendations: ["Creatina", "Ribosio"],
        training_recommendations: ["Attenzione a deficit calorico", "Recupero adeguato"],
        foods_to_avoid: ["Caffeina eccessiva (aumenta UCP)"],
        foods_to_prefer: ["Carboidrati complessi", "Grassi sani", "Proteine"]
      }
    },
    related_genes: ["UCP1", "UCP3", "PPARGC1A", "SIRT1"],
    biomarkers: ["Spesa energetica a riposo", "Markers stress ossidativo"],
    test_panels: ["Calorimetria indiretta", "Panel stress ossidativo"]
  },

  {
    id: "sirt1",
    symbol: "SIRT1",
    full_name: "Sirtuina 1",
    chromosome: "10q21.3",
    category: "mitochondrial",
    pathway: ["longevità", "biogenesi_mitocondriale", "metabolismo_NAD"],
    function: "Deacetilasi NAD-dipendente. Regolatore chiave di metabolismo, infiammazione e longevità. Attiva PGC-1α e altre vie metaboliche.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Regolazione metabolica efficiente, risposta adeguata a restrizione calorica",
        metabolic_consequences: ["Metabolismo flessibile", "Risposta appropriata a digiuno"],
        symptoms: [],
        nutritional_recommendations: ["Dieta varia con periodi di restrizione"],
        supplement_recommendations: [],
        training_recommendations: ["Mix aerobico e forza"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotta capacità di rispondere a stress metabolico e restrizione calorica",
        metabolic_consequences: ["Resistenza insulinica", "Biogenesi mitocondriale ridotta", "Infiammazione cronica"],
        symptoms: ["Difficoltà a perdere peso", "Fatica cronica", "Invecchiamento accelerato"],
        nutritional_recommendations: ["Digiuno intermittente", "Restrizione calorica periodica", "Resveratrolo"],
        supplement_recommendations: ["NAD+ precursori (NMN, NR)", "Resveratrolo", "Pterostilbene", "Quercetina"],
        training_recommendations: ["Esercizio regolare (attiva SIRT1)", "HIIT", "Allenamento a digiuno"],
        foods_to_avoid: ["Eccesso calorico cronico", "Zuccheri", "Alcol eccessivo"],
        foods_to_prefer: ["Uva rossa", "Mirtilli", "Arachidi", "Cacao", "Olio oliva"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Iperattivazione - potenziale catabolismo eccessivo",
        metabolic_consequences: ["Catabolismo muscolare", "Difficoltà a costruire massa"],
        symptoms: ["Perdita massa muscolare", "Difficoltà recupero"],
        nutritional_recommendations: ["Evitare deficit calorico", "Proteine adeguate"],
        supplement_recommendations: ["Leucina", "HMB", "Creatina"],
        training_recommendations: ["Limitare cardio eccessivo", "Focus forza con recupero"],
        foods_to_avoid: ["Restrizione calorica eccessiva"],
        foods_to_prefer: ["Proteine complete", "Carboidrati post-allenamento"]
      }
    },
    related_genes: ["SIRT3", "PPARGC1A", "FOXO3", "NAMPT"],
    biomarkers: ["NAD+/NADH ratio", "Markers aging"],
    test_panels: ["Panel longevità", "Metabolomica NAD"]
  },

  {
    id: "ampk",
    symbol: "PRKAA1/PRKAA2",
    full_name: "AMP-activated Protein Kinase",
    chromosome: "5p13.1 / 1p32.2",
    category: "mitochondrial",
    pathway: ["sensore_energetico", "biogenesi_mitocondriale", "autofagia", "lipogenesi"],
    function: "Sensore centrale dello stato energetico cellulare. Attivato da deplezione ATP. Promuove catabolismo, inibisce anabolismo.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Risposta adeguata a stress energetico",
        metabolic_consequences: ["Switch efficiente tra fed/fasted", "Metabolismo flessibile"],
        symptoms: [],
        nutritional_recommendations: ["Pasti regolari con occasionale digiuno"],
        supplement_recommendations: [],
        training_recommendations: ["Varietà di intensità"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotta capacità di rispondere a stress energetico",
        metabolic_consequences: ["Insulino-resistenza", "Accumulo lipidico", "Ridotta autofagia"],
        symptoms: ["Aumento peso", "Sindrome metabolica", "Fatica cronica"],
        nutritional_recommendations: ["Digiuno intermittente", "Restrizione calorica", "Low-carb ciclico"],
        supplement_recommendations: ["Berberina", "Metformina (se indicato)", "EGCG", "Acido alfa-lipoico"],
        training_recommendations: ["Esercizio intenso (attiva AMPK)", "HIIT", "Allenamento a digiuno"],
        foods_to_avoid: ["Eccesso carboidrati", "Pasti frequenti", "Snacking continuo"],
        foods_to_prefer: ["Tè verde", "Curcuma", "Aceto di mele", "Verdure amare"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Iperattivazione catabolica",
        metabolic_consequences: ["Catabolismo eccessivo", "Difficoltà sintesi proteica", "Ipoglicemia"],
        symptoms: ["Perdita muscolare", "Ipoglicemia", "Affaticamento cronico"],
        nutritional_recommendations: ["Evitare deficit calorico", "Carboidrati regolari", "Proteine elevate"],
        supplement_recommendations: ["Leucina", "Insulina-mimetici naturali post-allenamento"],
        training_recommendations: ["Evitare overtraining", "Nutrizione intra-workout"],
        foods_to_avoid: ["Digiuno prolungato", "Deficit calorico cronico"],
        foods_to_prefer: ["Carboidrati intorno allenamento", "Proteine frequenti"]
      }
    },
    related_genes: ["SIRT1", "PPARGC1A", "MTOR", "ACC"],
    biomarkers: ["AMP/ATP ratio", "Markers metabolici"],
    test_panels: ["Panel metabolico avanzato"]
  },

  // STRESS OSSIDATIVO
  {
    id: "gpx1",
    symbol: "GPX1",
    full_name: "Glutatione Perossidasi 1",
    chromosome: "3p21.31",
    category: "antioxidant",
    pathway: ["difesa_antiossidante", "detossificazione_perossidi", "ciclo_glutatione"],
    function: "Enzima antiossidante selenio-dipendente. Riduce perossido di idrogeno e perossidi lipidici usando glutatione.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Difesa antiossidante efficiente",
        metabolic_consequences: ["Neutralizzazione ROS efficace", "Protezione lipidi membrana"],
        symptoms: [],
        nutritional_recommendations: ["Selenio adeguato", "Antiossidanti nella dieta"],
        supplement_recommendations: [],
        training_recommendations: ["Allenamento standard con recupero"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Vulnerabilità a stress ossidativo - DIFESA COMPROMESSA",
        metabolic_consequences: ["Accumulo ROS", "Danno lipidico", "Danno DNA", "Infiammazione cronica"],
        symptoms: ["Affaticamento", "Recupero lento", "Infezioni frequenti", "Invecchiamento precoce", "Dolori muscolari persistenti"],
        nutritional_recommendations: ["Selenio (200mcg/die)", "Cisteina/NAC", "Antiossidanti elevati"],
        supplement_recommendations: ["Selenio", "NAC (N-acetil-cisteina)", "Glutatione liposomiale", "Vitamina C", "Alpha-lipoic acid"],
        training_recommendations: ["Evitare HIIT eccessivo", "Recupero prioritario", "Antiossidanti post-workout"],
        foods_to_avoid: ["Cibi ossidati", "Fritture", "Carni bruciate", "Oli raffinati"],
        foods_to_prefer: ["Noci del Brasile (selenio)", "Aglio", "Crucifere", "Avocado", "Uova"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Sistema antiossidante iperattivo",
        metabolic_consequences: ["Riduzione ROS signaling benefico", "Ridotta adattamento a esercizio"],
        symptoms: ["Ridotto adattamento allenamento", "Plateau performance"],
        nutritional_recommendations: ["Evitare mega-dosi antiossidanti"],
        supplement_recommendations: ["Evitare supplementazione antiossidante elevata"],
        training_recommendations: ["Antiossidanti lontano da allenamento", "Periodizzare supplementazione"],
        foods_to_avoid: ["Mega-dosi vitamina C/E intorno allenamento"],
        foods_to_prefer: ["Antiossidanti da cibo, non supplementi"]
      },
      polymorphism: {
        state: "polymorphism",
        description: "Variante Pro198Leu - attività ridotta del 30%",
        metabolic_consequences: ["Ridotta capacità antiossidante", "Maggior rischio cardiovascolare"],
        symptoms: ["Simili a under_expressed ma più moderati"],
        nutritional_recommendations: ["Selenio elevato", "Antiossidanti costanti"],
        supplement_recommendations: ["Selenio (100-200mcg)", "NAC", "Vitamina E naturale"],
        training_recommendations: ["Monitorare markers stress ossidativo"],
        foods_to_avoid: ["Pro-ossidanti"],
        foods_to_prefer: ["Noci Brasile", "Pesce", "Uova", "Funghi"]
      }
    },
    related_genes: ["GPX4", "SOD2", "CAT", "GSR", "GCLC"],
    biomarkers: ["Glutatione ridotto/ossidato", "MDA", "8-OHdG", "Selenio sierico"],
    test_panels: ["Panel stress ossidativo", "Minerali traccia"]
  },

  {
    id: "nrf2",
    symbol: "NFE2L2",
    full_name: "Nuclear Factor Erythroid 2-Related Factor 2",
    chromosome: "2q31.2",
    category: "antioxidant",
    pathway: ["risposta_antiossidante", "detossificazione_fase2", "protezione_cellulare"],
    function: "Fattore di trascrizione master della risposta antiossidante. Regola oltre 200 geni citoprotettivi.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Risposta antiossidante adattiva efficiente",
        metabolic_consequences: ["Induzione enzimi fase 2 appropriata", "Protezione da tossine"],
        symptoms: [],
        nutritional_recommendations: ["Crucifere regolari", "Polifenoli"],
        supplement_recommendations: [],
        training_recommendations: ["Esercizio regolare (attiva NRF2)"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotta capacità di risposta a stress - VULNERABILITA'",
        metabolic_consequences: ["Ridotta detossificazione", "Accumulo tossine", "Danno ossidativo cronico"],
        symptoms: ["Sensibilità chimica multipla", "Fatica cronica", "Brain fog", "Intolleranze alimentari"],
        nutritional_recommendations: ["Sulforafano (broccoli)", "Curcuma", "Tè verde", "Rosmarino"],
        supplement_recommendations: ["Sulforafano", "Curcumina", "EGCG", "Acido alfa-lipoico", "NAC"],
        training_recommendations: ["Esercizio moderato regolare", "Evitare inquinamento durante sport outdoor"],
        foods_to_avoid: ["Pesticidi", "Cibi processati", "Additivi", "Alcol"],
        foods_to_prefer: ["Broccoli", "Cavolfiore", "Cavolo", "Rucola", "Aglio", "Cipolla", "Curcuma"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Iperattivazione cronica (raro, spesso compensatorio)",
        metabolic_consequences: ["Potenziale resistenza a chemioterapia (in cancro)", "Alterato metabolismo farmaci"],
        symptoms: ["Resistenza a alcuni farmaci"],
        nutritional_recommendations: ["Bilanciare attivatori NRF2"],
        supplement_recommendations: ["Consultare specialista per farmaci"],
        training_recommendations: ["Standard"],
        foods_to_avoid: ["Eccesso sulforafano se in terapia"],
        foods_to_prefer: ["Dieta bilanciata"]
      }
    },
    related_genes: ["KEAP1", "NQO1", "HO1", "GCLC", "GST"],
    biomarkers: ["NQO1 attività", "Glutatione", "Markers detox"],
    test_panels: ["Panel detossificazione", "Genomica funzionale"]
  },

  // INFIAMMAZIONE
  {
    id: "tnf",
    symbol: "TNF",
    full_name: "Tumor Necrosis Factor Alpha",
    chromosome: "6p21.33",
    category: "inflammation",
    pathway: ["infiammazione", "immunità_innata", "apoptosi"],
    function: "Citochina pro-infiammatoria centrale. Regola risposta immunitaria, infiammazione e metabolismo.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Risposta infiammatoria appropriata a stimoli",
        metabolic_consequences: ["Difesa immune efficace", "Risoluzione infiammazione"],
        symptoms: [],
        nutritional_recommendations: ["Dieta anti-infiammatoria moderata"],
        supplement_recommendations: [],
        training_recommendations: ["Allenamento standard"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Risposta immunitaria debole",
        metabolic_consequences: ["Suscettibilità infezioni", "Ridotta capacità di combattere patogeni"],
        symptoms: ["Infezioni frequenti", "Guarigione lenta", "Malattie ricorrenti"],
        nutritional_recommendations: ["Supportare immunità", "Zinco", "Vitamina D"],
        supplement_recommendations: ["Zinco", "Vitamina D", "Vitamina C", "Echinacea (acuto)"],
        training_recommendations: ["Non esagerare (deprime ulteriormente)"],
        foods_to_avoid: ["Zuccheri (deprimono immunità)"],
        foods_to_prefer: ["Funghi medicinali", "Aglio", "Zenzero", "Proteine adeguate"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Infiammazione cronica sistemica - STATO PERICOLOSO",
        metabolic_consequences: ["Insulino-resistenza", "Catabolismo muscolare", "Danno tissutale", "Aterosclerosi", "Depressione"],
        symptoms: ["Dolori diffusi", "Fatica cronica", "Depressione", "Difficoltà recupero", "Aumento peso viscerale"],
        nutritional_recommendations: ["Dieta anti-infiammatoria stretta", "Omega-3 elevati", "Eliminare trigger"],
        supplement_recommendations: ["Omega-3 (3-4g EPA+DHA)", "Curcumina + piperina", "Boswellia", "SPM", "Vitamina D"],
        training_recommendations: ["Ridurre intensità", "Focus su recupero", "Evitare overreaching"],
        foods_to_avoid: ["Zuccheri", "Omega-6 eccessivi", "Trans fat", "Alcol", "Carne processata"],
        foods_to_prefer: ["Pesce grasso", "Olio oliva", "Verdure", "Frutti di bosco", "Noci"]
      },
      polymorphism: {
        state: "polymorphism",
        description: "Variante -308 G>A - maggiore produzione TNF",
        metabolic_consequences: ["Tendenza infiammatoria genetica", "Risposta esagerata a stimoli"],
        symptoms: ["Infiammazione più facile", "Recupero più lento"],
        nutritional_recommendations: ["Dieta anti-infiammatoria preventiva costante"],
        supplement_recommendations: ["Omega-3 quotidiani", "Curcumina"],
        training_recommendations: ["Recupero extra", "Monitorare markers"],
        foods_to_avoid: ["Trigger infiammatori"],
        foods_to_prefer: ["Anti-infiammatori naturali quotidiani"]
      }
    },
    related_genes: ["IL6", "IL1B", "NFKB", "IL10"],
    biomarkers: ["TNF-alpha sierico", "PCR", "IL-6", "Fibrinogeno"],
    test_panels: ["Panel citochine", "Markers infiammazione"]
  },

  {
    id: "crp",
    symbol: "CRP",
    full_name: "C-Reactive Protein",
    chromosome: "1q23.2",
    category: "inflammation",
    pathway: ["fase_acuta", "infiammazione_sistemica", "rischio_cardiovascolare"],
    function: "Proteina di fase acuta prodotta dal fegato. Marker sensibile di infiammazione sistemica.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Livelli basali bassi (<1 mg/L), risposta appropriata a infezioni",
        metabolic_consequences: ["Infiammazione sotto controllo", "Basso rischio CV"],
        symptoms: [],
        nutritional_recommendations: ["Mantenere dieta sana"],
        supplement_recommendations: [],
        training_recommendations: ["Continuare attività regolare"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Raro - possibile deficit epatico",
        metabolic_consequences: ["Ridotta risposta fase acuta"],
        symptoms: ["Diagnosi ritardata infezioni"],
        nutritional_recommendations: ["Supportare funzione epatica"],
        supplement_recommendations: [],
        training_recommendations: ["Standard"],
        foods_to_avoid: ["Alcol"],
        foods_to_prefer: ["Alimenti epatoprotettivi"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "hsCRP elevata (>3 mg/L) - INFIAMMAZIONE CRONICA",
        metabolic_consequences: ["Alto rischio cardiovascolare", "Insulino-resistenza", "Disfunzione endoteliale"],
        symptoms: ["Spesso asintomatica", "Fatica", "Malessere generale"],
        nutritional_recommendations: ["Dieta mediterranea", "Omega-3", "Fibre elevate", "Perdere peso se sovrappeso"],
        supplement_recommendations: ["Omega-3", "Curcumina", "Vitamina D", "Magnesio"],
        training_recommendations: ["Esercizio regolare moderato (abbassa CRP)", "Evitare sedentarietà"],
        foods_to_avoid: ["Zuccheri", "Grassi trans", "Cibi ultra-processati", "Alcol eccessivo"],
        foods_to_prefer: ["Pesce", "Olio oliva", "Verdure", "Frutta", "Noci", "Legumi"]
      }
    },
    related_genes: ["IL6", "TNF", "SAA1"],
    biomarkers: ["hsCRP", "Fibrinogeno", "Ferritina"],
    test_panels: ["Risk cardiovascolare", "Panel infiammazione"]
  },

  // METABOLISMO AMINOACIDI - BCAA
  {
    id: "bcat2",
    symbol: "BCAT2",
    full_name: "Branched Chain Amino Acid Transaminase 2",
    chromosome: "19q13.33",
    category: "amino_acid",
    pathway: ["catabolismo_BCAA", "sintesi_glutammato", "metabolismo_muscolare"],
    function: "Primo enzima nel catabolismo dei BCAA. Converte leucina, isoleucina e valina nei rispettivi chetoacidi.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Metabolismo BCAA efficiente",
        metabolic_consequences: ["Utilizzo BCAA per energia e sintesi", "Bilancio azotato"],
        symptoms: [],
        nutritional_recommendations: ["Proteine adeguate"],
        supplement_recommendations: [],
        training_recommendations: ["Standard"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Accumulo BCAA - potenziale tossicità",
        metabolic_consequences: ["Accumulo BCAA nel sangue", "Interferenza con trasporto aminoacidi cerebrali", "Simil-MSUD lieve"],
        symptoms: ["Confusione mentale con eccesso proteine", "Fatica", "Difficoltà concentrazione"],
        nutritional_recommendations: ["Moderare proteine totali", "Evitare mega-dosi BCAA"],
        supplement_recommendations: ["Evitare BCAA supplementari", "B6 (cofattore)", "Carnitina"],
        training_recommendations: ["Non eccedere con supplementi proteici"],
        foods_to_avoid: ["Eccesso proteine animali", "Supplementi BCAA"],
        foods_to_prefer: ["Proteine vegetali variate", "Carboidrati adeguati"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Rapido catabolismo BCAA",
        metabolic_consequences: ["Deplezione BCAA rapida", "Potenziale catabolismo muscolare"],
        symptoms: ["Difficoltà costruire muscolo", "Fatica durante esercizio prolungato"],
        nutritional_recommendations: ["Aumentare BCAA dietetici", "Proteine frequenti"],
        supplement_recommendations: ["BCAA 5-10g peri-workout", "Leucina extra"],
        training_recommendations: ["Nutrizione intra-workout", "BCAA durante allenamenti lunghi"],
        foods_to_avoid: ["Digiuno prolungato pre-workout"],
        foods_to_prefer: ["Latticini", "Carne", "Uova", "Legumi + cereali"]
      }
    },
    related_genes: ["BCKDHA", "BCKDHB", "DBT"],
    biomarkers: ["BCAA plasmatici", "Rapporto BCAA/aromatici"],
    test_panels: ["Aminoacidogramma", "Panel muscolare"]
  },

  // TRASPORTO - MCT
  {
    id: "mct1",
    symbol: "SLC16A1",
    full_name: "Monocarboxylate Transporter 1",
    chromosome: "1p13.2",
    category: "transport",
    pathway: ["trasporto_lattato", "shuttle_lattato", "metabolismo_chetoni"],
    function: "Trasporta lattato, piruvato e corpi chetonici attraverso membrane cellulari. Cruciale per clearance lattato muscolare.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Trasporto lattato efficiente",
        metabolic_consequences: ["Clearance lattato rapida", "Utilizzo lattato come carburante efficiente"],
        symptoms: [],
        nutritional_recommendations: ["Dieta bilanciata"],
        supplement_recommendations: [],
        training_recommendations: ["HIIT migliora espressione MCT1"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotta clearance lattato - ACCUMULO",
        metabolic_consequences: ["Lattato si accumula nel muscolo", "Acidosi precoce", "Ridotta capacità anaerobica"],
        symptoms: ["Bruciore muscolare precoce", "Fatica rapida ad alta intensità", "Recupero lento tra intervalli"],
        nutritional_recommendations: ["Beta-alanina", "Bicarbonato pre-gara"],
        supplement_recommendations: ["Beta-alanina (4-6g/die)", "Bicarbonato sodio (0.3g/kg pre-gara)", "Carnosina"],
        training_recommendations: ["Allenamento soglia progressivo", "Intervalli per stimolare MCT1", "Patience - adattamento lento"],
        foods_to_avoid: [],
        foods_to_prefer: ["Carne (carnosina)", "Beta-alanina naturale"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Clearance lattato ultra-rapida (adattamento allenamento)",
        metabolic_consequences: ["Lattato rimosso rapidamente", "Utilizzo lattato come carburante", "Tipico atleti elite"],
        symptoms: ["Ottima tolleranza lattato", "Recupero rapido tra intervalli"],
        nutritional_recommendations: ["Mantenere allenamento che ha indotto adattamento"],
        supplement_recommendations: [],
        training_recommendations: ["Continuare HIIT", "Variare stimoli"],
        foods_to_avoid: [],
        foods_to_prefer: []
      }
    },
    related_genes: ["MCT4", "LDH", "CD147"],
    biomarkers: ["Clearance lattato", "Lattato post-esercizio"],
    test_panels: ["Test lattato incrementale", "Test Wingate"]
  },

  {
    id: "glut4",
    symbol: "SLC2A4",
    full_name: "Glucose Transporter Type 4",
    chromosome: "17p13.1",
    category: "transport",
    pathway: ["uptake_glucosio", "sensibilità_insulinica", "metabolismo_muscolare"],
    function: "Trasportatore glucosio insulino-dipendente. Principale via di uptake glucosio in muscolo e tessuto adiposo.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Uptake glucosio efficiente, buona sensibilità insulinica",
        metabolic_consequences: ["Glicemia stabile", "Rifornimento glicogeno efficiente"],
        symptoms: [],
        nutritional_recommendations: ["Carboidrati intorno allenamento"],
        supplement_recommendations: [],
        training_recommendations: ["Esercizio regolare mantiene GLUT4"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Ridotto uptake glucosio - INSULINO-RESISTENZA",
        metabolic_consequences: ["Iperglicemia", "Iperinsulinemia compensatoria", "Ridotto rifornimento glicogeno", "Pre-diabete"],
        symptoms: ["Affaticamento post-prandiale", "Fame frequente", "Difficoltà recupero glicogeno"],
        nutritional_recommendations: ["Low-carb o timing carboidrati", "Fibre elevate", "Aceto prima pasti"],
        supplement_recommendations: ["Berberina", "Acido alfa-lipoico", "Cromo", "Cannella", "Inositolo"],
        training_recommendations: ["Esercizio regolare (upregula GLUT4)", "HIIT", "Resistance training"],
        foods_to_avoid: ["Zuccheri semplici", "Carboidrati raffinati", "Eccesso calorico"],
        foods_to_prefer: ["Verdure", "Legumi", "Proteine", "Grassi sani", "Aceto di mele"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Uptake glucosio aumentato (adattamento positivo)",
        metabolic_consequences: ["Eccellente rifornimento glicogeno", "Alta sensibilità insulinica"],
        symptoms: ["Potenziale ipoglicemia reattiva se eccesso carboidrati rapidi"],
        nutritional_recommendations: ["Carboidrati complessi", "Evitare zuccheri semplici isolati"],
        supplement_recommendations: [],
        training_recommendations: ["Continuare attività che ha indotto adattamento"],
        foods_to_avoid: ["Zuccheri semplici senza proteine/grassi"],
        foods_to_prefer: ["Carboidrati complessi", "Combinazioni equilibrate"]
      }
    },
    related_genes: ["IRS1", "AKT", "AS160", "AMPK"],
    biomarkers: ["Glicemia digiuno", "Insulina digiuno", "HOMA-IR", "HbA1c"],
    test_panels: ["Panel metabolico", "OGTT", "Clamp euglicemico"]
  },

  // DETOX
  {
    id: "cyp1a2",
    symbol: "CYP1A2",
    full_name: "Cytochrome P450 1A2",
    chromosome: "15q24.1",
    category: "amino_acid",
    pathway: ["metabolismo_caffeina", "detossificazione_fase1", "metabolismo_farmaci"],
    function: "Enzima chiave per metabolismo caffeina. Responsabile di oltre 90% della clearance caffeina. Anche metabolizza farmaci e tossine.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Metabolismo caffeina nella norma (metabolizzatore intermedio)",
        metabolic_consequences: ["Emivita caffeina ~5 ore", "Risposta normale a caffè"],
        symptoms: [],
        nutritional_recommendations: ["Caffeina moderata OK", "Evitare tardi nella giornata"],
        supplement_recommendations: ["Caffeina 3-6mg/kg pre-performance"],
        training_recommendations: ["Caffeina utile per performance"],
        foods_to_avoid: ["Caffeina dopo le 14-15 per sonno"],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Metabolizzatore lento caffeina - ATTENZIONE",
        metabolic_consequences: ["Emivita caffeina prolungata (>10 ore)", "Accumulo con dosi ripetute", "Aumentato rischio CV con caffè"],
        symptoms: ["Insonnia anche con caffè mattutino", "Ansia da caffeina", "Palpitazioni", "Ipertensione"],
        nutritional_recommendations: ["Limitare caffeina drasticamente", "Solo mattino presto se necessario", "Max 100mg/die"],
        supplement_recommendations: ["Evitare supplementi con caffeina", "Usare alternative (taurina, tirosina)"],
        training_recommendations: ["Caffeina NON ergogenica per slow metabolizers - evitare", "Alternative: beetroot juice, citrullina"],
        foods_to_avoid: ["Caffè", "Tè nero/verde eccessivo", "Energy drink", "Pre-workout con caffeina"],
        foods_to_prefer: ["Tisane senza caffeina", "Cacao (teobromina diversa)"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Metabolizzatore rapido caffeina - VANTAGGIO",
        metabolic_consequences: ["Emivita caffeina ~2-3 ore", "Clearance rapida", "Beneficio cardiovascolare da caffè"],
        symptoms: ["Necessità di più caffeina per effetto", "Tolleranza rapida"],
        nutritional_recommendations: ["Può tollerare più caffeina", "Anche nel pomeriggio possibile"],
        supplement_recommendations: ["Caffeina 6mg/kg pre-gara efficace", "Può ripetere dosi"],
        training_recommendations: ["Caffeina molto ergogenica", "Timing flessibile"],
        foods_to_avoid: [],
        foods_to_prefer: ["Caffè anche per benefici salute"]
      },
      polymorphism: {
        state: "polymorphism",
        description: "Variante rs762551 - determina velocità metabolismo",
        metabolic_consequences: ["AA = fast, AC/CC = slow"],
        symptoms: ["Variabili in base a genotipo"],
        nutritional_recommendations: ["Test genetico per determinare", "Osservare risposta personale"],
        supplement_recommendations: ["Personalizzare in base a genotipo"],
        training_recommendations: ["Trial individuale"],
        foods_to_avoid: [],
        foods_to_prefer: []
      }
    },
    related_genes: ["CYP2D6", "CYP3A4", "NAT2", "ADORA2A"],
    biomarkers: ["Caffeina plasmatica", "Paraxantina"],
    test_panels: ["Test genetico caffeina", "Farmacogenomica"]
  },

  {
    id: "gstm1",
    symbol: "GSTM1",
    full_name: "Glutathione S-Transferase Mu 1",
    chromosome: "1p13.3",
    category: "antioxidant",
    pathway: ["detossificazione_fase2", "coniugazione_glutatione", "eliminazione_xenobiotici"],
    function: "Coniuga glutatione a sostanze tossiche per renderle idrosolubili ed eliminabili. Detossifica carcinogeni, pesticidi, metalli.",
    expression_states: {
      normal: {
        state: "normal",
        description: "Detossificazione fase 2 efficiente",
        metabolic_consequences: ["Eliminazione tossine efficace", "Protezione da carcinogeni"],
        symptoms: [],
        nutritional_recommendations: ["Crucifere regolari", "Antiossidanti"],
        supplement_recommendations: [],
        training_recommendations: ["Standard"],
        foods_to_avoid: [],
        foods_to_prefer: []
      },
      under_expressed: {
        state: "under_expressed",
        description: "Detossificazione compromessa - variante null (50% popolazione)",
        metabolic_consequences: ["Ridotta coniugazione tossine", "Accumulo xenobiotici", "Maggior rischio cancro", "Sensibilità chimica"],
        symptoms: ["Intolleranza chimica", "Sensibilità a profumi/solventi", "Fatica da esposizioni", "Mal di testa frequenti"],
        nutritional_recommendations: ["Crucifere quotidiane (sulforafano)", "Dieta biologica", "Evitare pesticidi", "NAC"],
        supplement_recommendations: ["NAC (600-1200mg)", "Sulforafano", "Glutatione liposomiale", "Cardo mariano", "Selenio"],
        training_recommendations: ["Evitare allenamento in aree inquinate", "Sauna per sudorazione detox"],
        foods_to_avoid: ["Cibi non biologici", "Carni alla griglia bruciate", "Alimenti affumicati", "Alcol"],
        foods_to_prefer: ["Broccoli", "Cavoli", "Aglio", "Cipolla", "Curcuma", "Cibo biologico"]
      },
      over_expressed: {
        state: "over_expressed",
        description: "Detossificazione iperattiva (raro)",
        metabolic_consequences: ["Possibile interferenza con alcuni farmaci"],
        symptoms: [],
        nutritional_recommendations: ["Attenzione a interazioni farmaci"],
        supplement_recommendations: [],
        training_recommendations: ["Standard"],
        foods_to_avoid: [],
        foods_to_prefer: []
      }
    },
    related_genes: ["GSTT1", "GSTP1", "GCLC", "NRF2"],
    biomarkers: ["Glutatione", "Addotti DNA", "Metaboliti urinari"],
    test_panels: ["Panel detox genetico", "Metaboliti tossine"]
  }
]

// ============================================
// FUNZIONI HELPER
// ============================================

export function getGeneById(id: string): MetabolicGene | undefined {
  return METABOLIC_GENES_DATABASE.find(g => g.id === id)
}

export function getGenesByCategory(category: MetabolicGene["category"]): MetabolicGene[] {
  return METABOLIC_GENES_DATABASE.filter(g => g.category === category)
}

export function getGenesByPathway(pathway: string): MetabolicGene[] {
  return METABOLIC_GENES_DATABASE.filter(g => 
    g.pathway.some(p => p.toLowerCase().includes(pathway.toLowerCase()))
  )
}

export interface GeneAnalysisResult {
  gene: MetabolicGene
  expression: GeneExpression
  severity: "low" | "moderate" | "high"
  priority: number
}

export function analyzeGeneExpression(
  geneId: string, 
  expressionState: "normal" | "under_expressed" | "over_expressed" | "polymorphism"
): GeneAnalysisResult | null {
  const gene = getGeneById(geneId)
  if (!gene) return null
  
  const expression = gene.expression_states[expressionState]
  if (!expression) return null
  
  // Calcola severità basata su conseguenze
  const consequenceCount = expression.metabolic_consequences.length
  const symptomCount = expression.symptoms.length
  
  let severity: "low" | "moderate" | "high" = "low"
  if (consequenceCount > 4 || symptomCount > 4) severity = "high"
  else if (consequenceCount > 2 || symptomCount > 2) severity = "moderate"
  
  // Priorità basata su categoria
  const categoryPriority: Record<string, number> = {
    glycolysis: 9,
    lipid_metabolism: 8,
    mitochondrial: 9,
    transport: 7,
    muscle_fiber: 6,
    antioxidant: 8,
    amino_acid: 7,
    methylation: 8,
    inflammation: 9
  }
  
  return {
    gene,
    expression,
    severity,
    priority: categoryPriority[gene.category] || 5
  }
}

export interface NutritionRecommendation {
  category: string
  recommendations: string[]
  supplements: string[]
  foods_to_avoid: string[]
  foods_to_prefer: string[]
}

export function generateNutritionRecommendations(
  geneAnalyses: GeneAnalysisResult[]
): NutritionRecommendation[] {
  const recommendations: NutritionRecommendation[] = []
  
  // Raggruppa per categoria
  const byCategory = new Map<string, GeneAnalysisResult[]>()
  
  for (const analysis of geneAnalyses) {
    const category = analysis.gene.category
    if (!byCategory.has(category)) {
      byCategory.set(category, [])
    }
    byCategory.get(category)!.push(analysis)
  }
  
  // Genera raccomandazioni per categoria
  for (const [category, analyses] of byCategory) {
    const allRecommendations = new Set<string>()
    const allSupplements = new Set<string>()
    const allFoodsToAvoid = new Set<string>()
    const allFoodsToPrefer = new Set<string>()
    
    for (const analysis of analyses) {
      analysis.expression.nutritional_recommendations.forEach(r => allRecommendations.add(r))
      analysis.expression.supplement_recommendations.forEach(s => allSupplements.add(s))
      analysis.expression.foods_to_avoid.forEach(f => allFoodsToAvoid.add(f))
      analysis.expression.foods_to_prefer.forEach(f => allFoodsToPrefer.add(f))
    }
    
    recommendations.push({
      category,
      recommendations: Array.from(allRecommendations),
      supplements: Array.from(allSupplements),
      foods_to_avoid: Array.from(allFoodsToAvoid),
      foods_to_prefer: Array.from(allFoodsToPrefer)
    })
  }
  
  return recommendations
}

export function getTrainingRecommendations(
  geneAnalyses: GeneAnalysisResult[]
): string[] {
  const allRecommendations = new Set<string>()
  
  // Ordina per priorità (alta prima)
  const sorted = [...geneAnalyses].sort((a, b) => b.priority - a.priority)
  
  for (const analysis of sorted) {
    analysis.expression.training_recommendations.forEach(r => allRecommendations.add(r))
  }
  
  return Array.from(allRecommendations)
}

// Mappa categorie per UI
export const GENE_CATEGORY_LABELS: Record<string, string> = {
  glycolysis: "Glicolisi",
  lipid_metabolism: "Metabolismo Lipidico",
  mitochondrial: "Funzione Mitocondriale",
  transport: "Trasporto Nutrienti",
  muscle_fiber: "Fibre Muscolari",
  antioxidant: "Difesa Antiossidante",
  amino_acid: "Metabolismo Aminoacidi",
  methylation: "Metilazione",
  inflammation: "Infiammazione",
  detox: "Detossificazione",
  hormones: "Metabolismo Ormonale",
  longevity: "Longevità/Aging"
}

export const GENE_CATEGORY_COLORS: Record<string, string> = {
  glycolysis: "cyan",
  lipid_metabolism: "orange",
  mitochondrial: "purple",
  transport: "blue",
  muscle_fiber: "red",
  antioxidant: "green",
  amino_acid: "yellow",
  methylation: "pink",
  inflammation: "rose",
  detox: "emerald",
  hormones: "indigo",
  longevity: "amber"
}
