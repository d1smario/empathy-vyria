import { type NextRequest, NextResponse } from "next/server"

export interface LifestyleActivity {
  id: string
  name: string
  nameIt: string
  category: "yoga" | "pilates" | "meditation" | "mobility" | "stretching" | "cold_therapy"
  subcategory?: string
  difficulty: "beginner" | "intermediate" | "advanced"
  duration: number
  imageUrl: string
  videoUrl?: string
  instructions: string[]
  benefits: string[]
  equipment?: string[]
}

const LIFESTYLE_DATABASE: Record<string, LifestyleActivity[]> = {
  yoga: [
    {
      id: "yoga1",
      name: "Sun Salutation A",
      nameIt: "Saluto al Sole A",
      category: "yoga",
      subcategory: "vinyasa",
      difficulty: "beginner",
      duration: 10,
      imageUrl: "/lifestyle/yoga-sun-salutation.jpg",
      videoUrl: "https://www.youtube.com/embed/73sjOu0g58M",
      instructions: [
        "Inizia in posizione eretta (Tadasana)",
        "Inspira, alza le braccia sopra la testa",
        "Espira, piegati in avanti (Uttanasana)",
        "Inspira, solleva il busto a meta",
        "Espira, plank e poi Chaturanga",
        "Inspira, Cane a faccia in su",
        "Espira, Cane a faccia in giu",
        "Mantieni per 5 respiri, poi torna in piedi"
      ],
      benefits: ["Riscaldamento completo", "Flessibilita colonna", "Energia mattutina", "Coordinazione respiro-movimento"],
      equipment: ["tappetino"]
    },
    {
      id: "yoga2",
      name: "Warrior I",
      nameIt: "Guerriero I",
      category: "yoga",
      subcategory: "standing",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/yoga-warrior.jpg",
      videoUrl: "https://www.youtube.com/embed/k4qaVoAbeHM",
      instructions: [
        "Parti da Tadasana",
        "Fai un grande passo indietro con il piede sinistro",
        "Ruota il piede posteriore a 45 gradi",
        "Piega il ginocchio anteriore a 90 gradi",
        "Alza le braccia sopra la testa",
        "Mantieni per 5-10 respiri",
        "Ripeti dall'altro lato"
      ],
      benefits: ["Forza gambe", "Apertura anche", "Equilibrio", "Concentrazione"],
      equipment: ["tappetino"]
    },
    {
      id: "yoga3",
      name: "Downward Dog",
      nameIt: "Cane a Faccia in Giu",
      category: "yoga",
      subcategory: "inversion",
      difficulty: "beginner",
      duration: 3,
      imageUrl: "/lifestyle/yoga-downward-dog.jpg",
      videoUrl: "https://www.youtube.com/embed/j97SSGsnCAQ",
      instructions: [
        "Inizia a quattro zampe",
        "Solleva i fianchi verso il soffitto",
        "Raddrizza le gambe quanto possibile",
        "Premi le mani a terra, dita allargate",
        "Rilassa la testa tra le braccia",
        "Mantieni per 5-10 respiri"
      ],
      benefits: ["Allungamento catena posteriore", "Forza braccia", "Calma la mente", "Inversione dolce"],
      equipment: ["tappetino"]
    },
    {
      id: "yoga4",
      name: "Child's Pose",
      nameIt: "Posizione del Bambino",
      category: "yoga",
      subcategory: "restorative",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/yoga-child-pose.jpg",
      videoUrl: "https://www.youtube.com/embed/2MJGg-dUKh0",
      instructions: [
        "Inginocchiati sul tappetino",
        "Siediti sui talloni",
        "Porta il busto in avanti",
        "Appoggia la fronte a terra",
        "Braccia lungo i fianchi o in avanti",
        "Respira profondamente e rilassati"
      ],
      benefits: ["Rilassamento", "Allungamento schiena", "Riduzione stress", "Recupero"],
      equipment: ["tappetino"]
    },
    {
      id: "yoga5",
      name: "Tree Pose",
      nameIt: "Posizione dell'Albero",
      category: "yoga",
      subcategory: "balance",
      difficulty: "intermediate",
      duration: 5,
      imageUrl: "/lifestyle/yoga-tree-pose.jpg",
      videoUrl: "https://www.youtube.com/embed/wdln9qWYloU",
      instructions: [
        "Parti in piedi su una gamba",
        "Porta il piede opposto sulla coscia interna",
        "Non appoggiare il piede sul ginocchio",
        "Unisci le mani davanti al cuore o sopra la testa",
        "Fissa un punto davanti a te",
        "Mantieni per 30-60 secondi per lato"
      ],
      benefits: ["Equilibrio", "Concentrazione", "Forza caviglie", "Stabilita core"],
      equipment: ["tappetino"]
    },
    {
      id: "yoga6",
      name: "Pigeon Pose",
      nameIt: "Posizione del Piccione",
      category: "yoga",
      subcategory: "hip_opener",
      difficulty: "intermediate",
      duration: 8,
      imageUrl: "/lifestyle/yoga-pigeon-pose.jpg",
      videoUrl: "https://www.youtube.com/embed/SoFXXFjQepU",
      instructions: [
        "Parti da Cane a faccia in giu",
        "Porta il ginocchio destro verso il polso destro",
        "Stendi la gamba sinistra dietro",
        "Abbassa i fianchi verso il pavimento",
        "Puoi restare in alto o piegarti in avanti",
        "Mantieni 1-3 minuti per lato"
      ],
      benefits: ["Apertura anche profonda", "Rilascio tensioni", "Flessibilita glutei", "Rilassamento emotivo"],
      equipment: ["tappetino", "blocco yoga (opzionale)"]
    }
  ],
  pilates: [
    {
      id: "pilates1",
      name: "The Hundred",
      nameIt: "Il Cento",
      category: "pilates",
      subcategory: "core",
      difficulty: "intermediate",
      duration: 5,
      imageUrl: "/lifestyle/pilates-hundred.jpg",
      videoUrl: "https://www.youtube.com/embed/n9xrBqkQHSo",
      instructions: [
        "Sdraiati sulla schiena",
        "Solleva testa e spalle dal tappetino",
        "Alza le gambe a 45 gradi",
        "Braccia lungo i fianchi, parallele al pavimento",
        "Pompa le braccia su e giu piccoli movimenti",
        "Inspira 5 pompaggi, espira 5 pompaggi",
        "Continua per 100 pompaggi totali"
      ],
      benefits: ["Core strength", "Riscaldamento", "Controllo respiratorio", "Resistenza addominale"],
      equipment: ["tappetino"]
    },
    {
      id: "pilates2",
      name: "Roll Up",
      nameIt: "Roll Up",
      category: "pilates",
      subcategory: "core",
      difficulty: "intermediate",
      duration: 5,
      imageUrl: "/lifestyle/pilates-roll-up.jpg",
      videoUrl: "https://www.youtube.com/embed/sPHAXjaJaEY",
      instructions: [
        "Sdraiati sulla schiena, braccia sopra la testa",
        "Inspira e solleva le braccia verso il soffitto",
        "Espira e arrotola la colonna vertebra per vertebra",
        "Raggiungi le dita dei piedi",
        "Inspira in alto",
        "Espira e arrotola lentamente indietro",
        "Ripeti 6-8 volte"
      ],
      benefits: ["Flessibilita colonna", "Forza addominale", "Controllo motorio", "Mobilita"],
      equipment: ["tappetino"]
    },
    {
      id: "pilates3",
      name: "Single Leg Stretch",
      nameIt: "Allungamento Gamba Singola",
      category: "pilates",
      subcategory: "core",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/pilates-single-leg.jpg",
      videoUrl: "https://www.youtube.com/embed/LaABnNYoYJo",
      instructions: [
        "Sdraiati sulla schiena, testa e spalle sollevate",
        "Porta un ginocchio al petto",
        "Stendi l'altra gamba a 45 gradi",
        "Mani sulla caviglia e ginocchio",
        "Alterna le gambe con controllo",
        "Mantieni il core stabile",
        "Ripeti 10 volte per lato"
      ],
      benefits: ["Coordinazione", "Core stability", "Allungamento flessori anca", "Controllo"],
      equipment: ["tappetino"]
    },
    {
      id: "pilates4",
      name: "Swimming",
      nameIt: "Nuoto",
      category: "pilates",
      subcategory: "back",
      difficulty: "intermediate",
      duration: 5,
      imageUrl: "/lifestyle/pilates-swimming.jpg",
      videoUrl: "https://www.youtube.com/embed/bEHU4Bhi9U0",
      instructions: [
        "Sdraiati a pancia in giu",
        "Braccia in avanti, gambe distese",
        "Solleva braccia, gambe, testa e petto",
        "Alterna braccio destro/gamba sinistra",
        "Movimento rapido come se nuotassi",
        "Mantieni core attivo",
        "Continua per 30-60 secondi"
      ],
      benefits: ["Forza schiena", "Coordinazione", "Estensione colonna", "Resistenza"],
      equipment: ["tappetino"]
    },
    {
      id: "pilates5",
      name: "Plank",
      nameIt: "Plank",
      category: "pilates",
      subcategory: "core",
      difficulty: "beginner",
      duration: 3,
      imageUrl: "/lifestyle/pilates-plank.jpg",
      videoUrl: "https://www.youtube.com/embed/pSHjTRCQxIw",
      instructions: [
        "Posizione push-up, mani sotto le spalle",
        "Corpo in linea retta dalla testa ai talloni",
        "Core attivo, non far cadere i fianchi",
        "Sguardo verso il pavimento",
        "Respira regolarmente",
        "Mantieni 30-60 secondi"
      ],
      benefits: ["Core totale", "Forza spalle", "Stabilita", "Postura"],
      equipment: ["tappetino"]
    },
    {
      id: "pilates6",
      name: "Teaser",
      nameIt: "Teaser",
      category: "pilates",
      subcategory: "core",
      difficulty: "advanced",
      duration: 5,
      imageUrl: "/lifestyle/pilates-teaser.jpg",
      videoUrl: "https://www.youtube.com/embed/M6rcOoVv0bI",
      instructions: [
        "Sdraiati sulla schiena, gambe estese",
        "Braccia sopra la testa",
        "Inspira e solleva braccia e busto",
        "Contemporaneamente solleva le gambe",
        "Crea una forma a V con il corpo",
        "Braccia parallele alle gambe",
        "Mantieni 3-5 respiri e scendi con controllo"
      ],
      benefits: ["Forza core avanzata", "Equilibrio", "Controllo totale", "Flessibilita"],
      equipment: ["tappetino"]
    }
  ],
  meditation: [
    {
      id: "med1",
      name: "Breath Awareness",
      nameIt: "Consapevolezza del Respiro",
      category: "meditation",
      subcategory: "breathing",
      difficulty: "beginner",
      duration: 10,
      imageUrl: "/lifestyle/meditation-breathing.jpg",
      videoUrl: "https://www.youtube.com/embed/inpok4MKVLM",
      instructions: [
        "Siediti in posizione comoda",
        "Chiudi gli occhi",
        "Porta l'attenzione al respiro naturale",
        "Non modificare il respiro, solo osserva",
        "Quando la mente vaga, riporta l'attenzione",
        "Continua per 10-20 minuti"
      ],
      benefits: ["Riduzione stress", "Calma mentale", "Presenza", "Consapevolezza"],
      equipment: ["cuscino (opzionale)"]
    },
    {
      id: "med2",
      name: "Body Scan",
      nameIt: "Scansione Corporea",
      category: "meditation",
      subcategory: "mindfulness",
      difficulty: "beginner",
      duration: 15,
      imageUrl: "/lifestyle/meditation-body-scan.jpg",
      videoUrl: "https://www.youtube.com/embed/QS2yDmWk0vs",
      instructions: [
        "Sdraiati sulla schiena",
        "Chiudi gli occhi e rilassati",
        "Porta l'attenzione ai piedi",
        "Scansiona lentamente verso l'alto",
        "Nota ogni sensazione senza giudicare",
        "Rilascia ogni tensione trovata",
        "Arriva fino alla cima della testa"
      ],
      benefits: ["Rilassamento profondo", "Consapevolezza corporea", "Riduzione tensioni", "Migliore sonno"],
      equipment: ["tappetino", "coperta (opzionale)"]
    },
    {
      id: "med3",
      name: "Box Breathing",
      nameIt: "Respirazione a Scatola",
      category: "meditation",
      subcategory: "breathing",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/meditation-box-breathing.jpg",
      videoUrl: "https://www.youtube.com/embed/FJJazKtH_9I",
      instructions: [
        "Siediti comodamente con schiena dritta",
        "Inspira contando fino a 4",
        "Trattieni il respiro per 4",
        "Espira contando fino a 4",
        "Trattieni a polmoni vuoti per 4",
        "Ripeti il ciclo 4-8 volte"
      ],
      benefits: ["Calma sistema nervoso", "Riduzione ansia", "Focus", "Preparazione performance"],
      equipment: []
    },
    {
      id: "med4",
      name: "Loving Kindness",
      nameIt: "Meditazione della Gentilezza",
      category: "meditation",
      subcategory: "mindfulness",
      difficulty: "intermediate",
      duration: 15,
      imageUrl: "/lifestyle/meditation-loving-kindness.jpg",
      videoUrl: "https://www.youtube.com/embed/-d_AA9H4z9U",
      instructions: [
        "Siediti comodamente e chiudi gli occhi",
        "Porta alla mente te stesso",
        "Ripeti: Possa io essere felice, sano, in pace",
        "Estendi a una persona cara",
        "Poi a una persona neutra",
        "Infine a tutti gli esseri"
      ],
      benefits: ["Compassione", "Connessione", "Riduzione negativita", "Benessere emotivo"],
      equipment: []
    },
    {
      id: "med5",
      name: "Wim Hof Breathing",
      nameIt: "Respirazione Wim Hof",
      category: "meditation",
      subcategory: "breathing",
      difficulty: "advanced",
      duration: 15,
      imageUrl: "/lifestyle/meditation-wim-hof.jpg",
      videoUrl: "https://www.youtube.com/embed/tybOi4hjZFQ",
      instructions: [
        "Sdraiati o siediti comodamente",
        "Fai 30-40 respiri profondi veloci",
        "Dopo l'ultimo, espira e trattieni",
        "Trattieni fino al bisogno di respirare",
        "Inspira profondamente e trattieni 15 sec",
        "Ripeti per 3-4 round"
      ],
      benefits: ["Energia", "Sistema immunitario", "Tolleranza al freddo", "Chiarezza mentale"],
      equipment: []
    },
    {
      id: "med6",
      name: "Visualization",
      nameIt: "Visualizzazione Guidata",
      category: "meditation",
      subcategory: "mindfulness",
      difficulty: "intermediate",
      duration: 20,
      imageUrl: "/lifestyle/meditation-visualization.jpg",
      videoUrl: "https://www.youtube.com/embed/t1rRo6cgM_E",
      instructions: [
        "Siediti o sdraiati comodamente",
        "Chiudi gli occhi e rilassa il corpo",
        "Immagina un luogo pacifico e sicuro",
        "Usa tutti i sensi: vista, suoni, odori",
        "Esplora questo luogo mentalmente",
        "Resta qui per 15-20 minuti",
        "Torna lentamente al presente"
      ],
      benefits: ["Riduzione stress", "Creativita", "Rilassamento profondo", "Preparazione mentale"],
      equipment: []
    }
  ],
  mobility: [
    {
      id: "mob1",
      name: "Cat-Cow Stretch",
      nameIt: "Gatto-Mucca",
      category: "mobility",
      subcategory: "spine",
      difficulty: "beginner",
      duration: 3,
      imageUrl: "/lifestyle/mobility-cat-cow.jpg",
      videoUrl: "https://www.youtube.com/embed/kqnua4rHVVA",
      instructions: [
        "Posizione a quattro zampe",
        "Inspira: inarca la schiena, guarda in alto (Mucca)",
        "Espira: arrotonda la schiena, mento al petto (Gatto)",
        "Muoviti lentamente con il respiro",
        "Ripeti 10-15 volte"
      ],
      benefits: ["Mobilita colonna", "Riscaldamento", "Flessibilita", "Coordinazione respiro"],
      equipment: ["tappetino"]
    },
    {
      id: "mob2",
      name: "Hip Circles",
      nameIt: "Cerchi d'Anca",
      category: "mobility",
      subcategory: "hips",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/mobility-hip-circles.jpg",
      videoUrl: "https://www.youtube.com/embed/4AOZqXCpxvM",
      instructions: [
        "In piedi, mani sui fianchi",
        "Fai ampi cerchi con i fianchi",
        "10 cerchi in senso orario",
        "10 cerchi in senso antiorario",
        "Mantieni le spalle ferme"
      ],
      benefits: ["Mobilita anche", "Lubrificazione articolare", "Riscaldamento", "Flessibilita"],
      equipment: []
    },
    {
      id: "mob3",
      name: "Shoulder Circles",
      nameIt: "Cerchi di Spalle",
      category: "mobility",
      subcategory: "shoulders",
      difficulty: "beginner",
      duration: 3,
      imageUrl: "/lifestyle/mobility-shoulder-circles.jpg",
      videoUrl: "https://www.youtube.com/embed/lOCse3urMFA",
      instructions: [
        "In piedi, braccia lungo i fianchi",
        "Solleva le spalle verso le orecchie",
        "Ruota indietro e poi in basso",
        "10 cerchi all'indietro",
        "10 cerchi in avanti"
      ],
      benefits: ["Mobilita spalle", "Riduzione tensione", "Riscaldamento", "Postura"],
      equipment: []
    },
    {
      id: "mob4",
      name: "World's Greatest Stretch",
      nameIt: "Il Miglior Stretch del Mondo",
      category: "mobility",
      subcategory: "full_body",
      difficulty: "intermediate",
      duration: 8,
      imageUrl: "/lifestyle/mobility-worlds-greatest.jpg",
      videoUrl: "https://www.youtube.com/embed/u5hPHCnjRow",
      instructions: [
        "Parti in posizione di affondo",
        "Porta il gomito verso il piede anteriore",
        "Ruota e apri il braccio verso il soffitto",
        "Porta la mano a terra",
        "Raddrizza la gamba anteriore",
        "Ripeti 5 volte per lato"
      ],
      benefits: ["Mobilita totale", "Apertura anche", "Rotazione toracica", "Flessibilita"],
      equipment: ["tappetino"]
    },
    {
      id: "mob5",
      name: "90/90 Hip Stretch",
      nameIt: "Stretch Anca 90/90",
      category: "mobility",
      subcategory: "hips",
      difficulty: "intermediate",
      duration: 10,
      imageUrl: "/lifestyle/mobility-90-90.jpg",
      videoUrl: "https://www.youtube.com/embed/7bIxHH5H7gU",
      instructions: [
        "Siediti con entrambe le gambe piegate a 90 gradi",
        "Una gamba davanti, una di lato",
        "Mantieni la schiena dritta",
        "Inclinati leggermente in avanti",
        "Mantieni 1-2 minuti",
        "Cambia lato"
      ],
      benefits: ["Mobilita anche profonda", "Rotazione interna/esterna", "Flessibilita glutei"],
      equipment: ["tappetino"]
    },
    {
      id: "mob6",
      name: "Thoracic Rotation",
      nameIt: "Rotazione Toracica",
      category: "mobility",
      subcategory: "spine",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/mobility-thoracic-rotation.jpg",
      videoUrl: "https://www.youtube.com/embed/Ldlsu0qBYFA",
      instructions: [
        "A quattro zampe o seduto",
        "Una mano dietro la testa",
        "Ruota aprendo il gomito verso il soffitto",
        "Segui il gomito con lo sguardo",
        "Torna alla posizione iniziale",
        "Ripeti 10 volte per lato"
      ],
      benefits: ["Mobilita colonna toracica", "Postura", "Riduzione rigidita", "Respirazione"],
      equipment: ["tappetino"]
    }
  ],
  stretching: [
    {
      id: "str1",
      name: "Hamstring Stretch",
      nameIt: "Allungamento Ischiocrurali",
      category: "stretching",
      subcategory: "legs",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/stretching-hamstring.jpg",
      videoUrl: "https://www.youtube.com/embed/FDwpEdxZ4H4",
      instructions: [
        "Sdraiati sulla schiena",
        "Solleva una gamba verso il soffitto",
        "Usa una cinghia o le mani dietro la coscia",
        "Mantieni il ginocchio leggermente piegato",
        "Mantieni 30-60 secondi",
        "Cambia gamba"
      ],
      benefits: ["Flessibilita posteriore coscia", "Riduzione mal di schiena", "Recupero"],
      equipment: ["tappetino", "cinghia (opzionale)"]
    },
    {
      id: "str2",
      name: "Quad Stretch",
      nameIt: "Allungamento Quadricipiti",
      category: "stretching",
      subcategory: "legs",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/stretching-quad.jpg",
      videoUrl: "https://www.youtube.com/embed/6-kGqMC4edU",
      instructions: [
        "In piedi, appoggiati a un muro se necessario",
        "Piega una gamba e afferra la caviglia",
        "Porta il tallone verso il gluteo",
        "Mantieni le ginocchia vicine",
        "Mantieni 30-60 secondi",
        "Cambia gamba"
      ],
      benefits: ["Flessibilita quadricipiti", "Riduzione tensione ginocchio", "Recupero post-corsa"],
      equipment: []
    },
    {
      id: "str3",
      name: "Chest Doorway Stretch",
      nameIt: "Allungamento Petto alla Porta",
      category: "stretching",
      subcategory: "upper_body",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/stretching-chest.jpg",
      videoUrl: "https://www.youtube.com/embed/SZuaU8zKLHs",
      instructions: [
        "Posizionati in un'apertura di porta",
        "Avambracci contro gli stipiti",
        "Gomiti a 90 gradi, all'altezza delle spalle",
        "Fai un passo avanti",
        "Senti l'allungamento nel petto",
        "Mantieni 30-60 secondi"
      ],
      benefits: ["Apertura petto", "Migliore postura", "Riduzione tensione spalle"],
      equipment: ["porta"]
    },
    {
      id: "str4",
      name: "Hip Flexor Stretch",
      nameIt: "Allungamento Flessori Anca",
      category: "stretching",
      subcategory: "hips",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/stretching-hip-flexor.jpg",
      videoUrl: "https://www.youtube.com/embed/YQmpO9VT2X4",
      instructions: [
        "Posizione di affondo basso",
        "Ginocchio posteriore a terra",
        "Spingi i fianchi in avanti",
        "Mantieni il busto eretto",
        "Alza il braccio dello stesso lato",
        "Mantieni 30-60 secondi per lato"
      ],
      benefits: ["Flessibilita anche", "Riduzione mal di schiena", "Migliore postura seduta"],
      equipment: ["tappetino"]
    },
    {
      id: "str5",
      name: "Upper Back Stretch",
      nameIt: "Allungamento Parte Alta Schiena",
      category: "stretching",
      subcategory: "back",
      difficulty: "beginner",
      duration: 3,
      imageUrl: "/lifestyle/stretching-upper-back.jpg",
      videoUrl: "https://www.youtube.com/embed/3T6lCLYKnRc",
      instructions: [
        "In piedi o seduto",
        "Intreccia le mani davanti a te",
        "Spingi le mani in avanti",
        "Arrotonda la parte alta della schiena",
        "Abbassa la testa",
        "Mantieni 20-30 secondi"
      ],
      benefits: ["Allungamento trapezi", "Riduzione tensione", "Postura"],
      equipment: []
    },
    {
      id: "str6",
      name: "Neck Stretch",
      nameIt: "Allungamento Collo",
      category: "stretching",
      subcategory: "neck",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/stretching-neck.jpg",
      videoUrl: "https://www.youtube.com/embed/wQylqaCl8Zo",
      instructions: [
        "Seduto con schiena dritta",
        "Inclina la testa verso una spalla",
        "Usa la mano per aumentare delicatamente lo stretch",
        "Mantieni 20-30 secondi",
        "Ripeti dall'altro lato",
        "Fai anche rotazioni lente del collo"
      ],
      benefits: ["Riduzione tensione cervicale", "Mal di testa", "Postura", "Rilassamento"],
      equipment: []
    }
  ],
  cold_therapy: [
    {
      id: "cold1",
      name: "Ice Bath",
      nameIt: "Bagno nel Ghiaccio",
      category: "cold_therapy",
      subcategory: "full_body",
      difficulty: "advanced",
      duration: 10,
      imageUrl: "/lifestyle/cold-therapy-ice-bath.jpg",
      videoUrl: "https://www.youtube.com/embed/gpfcA5eUixk",
      instructions: [
        "Prepara acqua a 10-15 gradi celsius",
        "Entra lentamente, prima i piedi",
        "Concentrati sul respiro, respira lentamente",
        "Rimani immobile, non agitarti",
        "Inizia con 1-2 minuti, aumenta gradualmente",
        "Esci lentamente e asciugati",
        "Non riscaldarti troppo velocemente"
      ],
      benefits: ["Recupero muscolare", "Riduzione infiammazione", "Sistema immunitario", "Resilienza mentale"],
      equipment: ["vasca", "ghiaccio", "termometro"]
    },
    {
      id: "cold2",
      name: "Cold Shower",
      nameIt: "Doccia Fredda",
      category: "cold_therapy",
      subcategory: "full_body",
      difficulty: "beginner",
      duration: 5,
      imageUrl: "/lifestyle/cold-therapy-cold-shower.jpg",
      videoUrl: "https://www.youtube.com/embed/Gb0h8ZKvJW4",
      instructions: [
        "Inizia con doccia calda normale",
        "Negli ultimi 30-60 secondi passa al freddo",
        "Inizia dalle gambe e sali",
        "Respira profondamente e con calma",
        "Aumenta gradualmente la durata",
        "Termina sempre con acqua fredda"
      ],
      benefits: ["Sveglia", "Circolazione", "Umore", "Facile da iniziare"],
      equipment: ["doccia"]
    },
    {
      id: "cold3",
      name: "Contrast Therapy",
      nameIt: "Terapia di Contrasto",
      category: "cold_therapy",
      subcategory: "full_body",
      difficulty: "intermediate",
      duration: 20,
      imageUrl: "/lifestyle/cold-therapy-contrast.jpg",
      videoUrl: "https://www.youtube.com/embed/KnZhPCJJFoY",
      instructions: [
        "Alterna tra caldo (38-40C) e freddo (10-15C)",
        "3-4 minuti caldo, 1 minuto freddo",
        "Ripeti 3-4 cicli",
        "Termina sempre con il freddo",
        "Respira profondamente durante le transizioni",
        "Asciugati e riposati dopo"
      ],
      benefits: ["Circolazione", "Recupero accelerato", "Riduzione dolore", "Sistema linfatico"],
      equipment: ["vasca calda", "vasca fredda o doccia"]
    },
    {
      id: "cold4",
      name: "Face Ice Bath",
      nameIt: "Bagno Ghiaccio Viso",
      category: "cold_therapy",
      subcategory: "face",
      difficulty: "beginner",
      duration: 3,
      imageUrl: "/lifestyle/cold-therapy-face-ice.jpg",
      videoUrl: "https://www.youtube.com/embed/E_M6gVvZLhA",
      instructions: [
        "Riempi una bacinella con acqua e ghiaccio",
        "Immergi il viso per 10-30 secondi",
        "Respira prima di immergerti",
        "Ripeti 3-5 volte",
        "Asciuga delicatamente",
        "Applica crema idratante dopo"
      ],
      benefits: ["Risveglio", "Pelle tonica", "Riduzione gonfiore", "Focus mentale"],
      equipment: ["bacinella", "ghiaccio"]
    },
    {
      id: "cold5",
      name: "Cryotherapy",
      nameIt: "Crioterapia",
      category: "cold_therapy",
      subcategory: "full_body",
      difficulty: "advanced",
      duration: 3,
      imageUrl: "/lifestyle/cold-therapy-cryo.jpg",
      videoUrl: "https://www.youtube.com/embed/hP3MQO6KJPA",
      instructions: [
        "Entra nella camera criogenica",
        "Temperatura tra -110C e -140C",
        "Durata 2-3 minuti massimo",
        "Indossa protezioni per mani, piedi, orecchie",
        "Muoviti leggermente durante la sessione",
        "Esci immediatamente se senti troppo freddo"
      ],
      benefits: ["Recupero elite", "Antinfiammatorio", "Energia", "Rilascio endorfine"],
      equipment: ["centro crioterapia"]
    },
    {
      id: "cold6",
      name: "Cold Plunge",
      nameIt: "Immersione Fredda",
      category: "cold_therapy",
      subcategory: "full_body",
      difficulty: "intermediate",
      duration: 5,
      imageUrl: "/lifestyle/cold-therapy-plunge.jpg",
      videoUrl: "https://www.youtube.com/embed/pq6WHJzOkno",
      instructions: [
        "Prepara vasca con acqua a 10-15 gradi",
        "Entra completamente fino alle spalle",
        "Concentrati sul respiro lento e profondo",
        "Non iperventilare",
        "Rimani 2-5 minuti",
        "Esci con calma e muoviti per riscaldarti"
      ],
      benefits: ["Recupero muscolare", "Chiarezza mentale", "Disciplina", "Sistema nervoso"],
      equipment: ["vasca per cold plunge", "termometro"]
    }
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const difficulty = searchParams.get("difficulty")

  let activities: LifestyleActivity[] = []

  if (category && LIFESTYLE_DATABASE[category]) {
    activities = LIFESTYLE_DATABASE[category]
  } else {
    activities = Object.values(LIFESTYLE_DATABASE).flat()
  }

  if (difficulty) {
    activities = activities.filter((a) => a.difficulty === difficulty)
  }

  return NextResponse.json({
    activities,
    source: "local_database",
    category: category || "all",
  })
}
