# EMPATHY PERFORMANCE bioMAP
## Analisi Completa e Roadmap di Sviluppo
### Data: Gennaio 2026

---

## INDICE

1. [Stato Attuale del Sistema](#1-stato-attuale-del-sistema)
2. [Cosa Manca o Non Funziona](#2-cosa-manca-o-non-funziona)
3. [Ampliamenti Necessari](#3-ampliamenti-necessari)
4. [Integrazione Rook.io](#4-integrazione-rookio)
5. [AI System Evolution](#5-ai-system-evolution)
6. [Piano di Sviluppo](#6-piano-di-sviluppo)

---

## 1. STATO ATTUALE DEL SISTEMA

### 1.1 Dashboard e Interfaccia

| Modulo | Stato | Note |
|--------|-------|------|
| Dashboard principale | ATTIVO | Tab: Profilo, Analisi, Activities, VYRIA, Training, Lifestyle, Nutrizione, Microbiome, Daily |
| Login/Register/Onboarding | ATTIVO | Autenticazione Supabase |
| Coach Dashboard | ATTIVO | Gestione atleti multipli |
| Dark Mode | ATTIVO | Tema scuro su tutti i componenti |

### 1.2 Nutrition System

| Componente | Stato | Logica EMPATHY |
|------------|-------|----------------|
| Piano settimanale 7 giorni | ATTIVO | Genera pasti con rotazione basata su tipo workout |
| Fueling Pre-Workout | ATTIVO | 0-50g CHO basato su zona e durata |
| Fueling Intra-Workout | ATTIVO | 30-90g/h CHO basato su zona (Z1=30, Z5=75, Z6+=90) |
| Fueling Post-Workout | ATTIVO | 0.5-1.2g/kg CHO basato su zona |
| Lista della spesa | ATTIVO | Aggregazione settimanale + export PDF |
| Pannello EMPATHY Daily | ATTIVO | Mostra kcal/CHO%/PRO% dinamici per giorno |
| AI Ingredient Substitutions | ATTIVO | Sostituisce automaticamente per intolleranze |
| Giorni di riposo | ATTIVO | Pasti senza pre/post workout, kcal ridotte |

### 1.3 Training System

| Componente | Stato | Note |
|------------|-------|------|
| Weekly Training Calendar | ATTIVO | Vista settimanale con drag & drop |
| Advanced Workout Builder | ATTIVO | Creazione allenamenti bike con blocchi zone |
| Gym Workout Builder | ATTIVO | Creazione schede palestra |
| VYRIA Training Plan | ATTIVO | Periodizzazione annuale con mesocicli |
| Workout Library | ATTIVO | Database allenamenti salvati |
| Workout Detail Modal | ATTIVO | Vista dettagliata con metriche |

### 1.4 Lifestyle System

| Componente | Stato | Note |
|------------|-------|------|
| Sleep Tracking | ATTIVO | Input manuale ore/qualita |
| Stress Level | ATTIVO | Scala 1-10 |
| Hydration | ATTIVO | Tracking liquidi |
| Wellness Score | ATTIVO | Calcolo composito |

### 1.5 AI System - Endpoint Attivi

| API Endpoint | Funzione | Input | Output |
|--------------|----------|-------|--------|
| `/api/ai/adaptive-engine` | Motore adattivo principale | stato atleta, workout, storico | delta, adattamenti, raccomandazioni |
| `/api/ai/nutrition` | Consigli nutrizionali | profilo, obiettivi | piano pasti, macro |
| `/api/ai/training` | Consigli allenamento | storico, obiettivi | prescrizione workout |
| `/api/ai/epigenetics` | Analisi epigenetica | profilo genetico | raccomandazioni gene-specifiche |
| `/api/ai/microbiome` | Analisi microbioma | profilo batterico | interazioni cibo-batteri |
| `nutrigenomics-engine` | Cross-analisi | geni + batteri | raccomandazioni integrate |

### 1.6 Database Attuali

| Database | Righe | Contenuto Attuale |
|----------|-------|-------------------|
| `epigenetics-database.ts` | 1334 | 15 geni metabolici (PFKM, LDHA, PDK4, CPT1A, PPARGC1A, SOD2, etc.) |
| `microbiome-database.ts` | 666 | 12 batteri, 7 pathway metabolici, 20+ interazioni cibo-microbioma |
| `foods-database.ts` | 911 | 100+ alimenti con kcal, macro, allergeni, tag |
| `supplements-database.ts` | 1593 | 50+ prodotti (Enervit, SiS, Maurten, NamedSport, 226ERS) |

---

## 2. COSA MANCA O NON FUNZIONA

### 2.1 Integrazioni Device

| Integrazione | Stato | Note |
|--------------|-------|------|
| Strava | PARZIALE | API base implementata, import parziale |
| Garmin Connect | STUB | Solo placeholder, non funzionante |
| TrainingPeaks | STUB | Solo placeholder, non funzionante |
| Apple Health | MANCANTE | Non implementato |
| Polar Flow | MANCANTE | Non implementato |
| Whoop | MANCANTE | Non implementato |
| Oura | MANCANTE | Non implementato |
| **Rook.io** | **DA FARE** | **Hub unico per tutte le integrazioni** |

### 2.2 Problemi Identificati

1. **Pasti ripetitivi**: Il database ha 100+ alimenti ma la selezione usa rotazione semplice senza sufficiente varieta
2. **Database limitati**: 
   - Microbiome: solo 12 batteri (dovrebbero essere 40+)
   - Epigenetics: solo 15 geni (dovrebbero essere 50+)
   - Foods: 100 alimenti (dovrebbero essere 300+)
3. **No dati reali**: Senza integrazione device, tutto e basato su input manuale
4. **AI non predittiva**: Manca modello CTL/ATL/TSB per fatica cumulativa
5. **No HRV integration**: Recovery basato solo su input manuale

---

## 3. AMPLIAMENTI NECESSARI

### 3.1 Database Microbiome (da 12 a 40+ batteri)

**Batteri da aggiungere:**

| Phylum | Genere/Specie | Rilevanza Atletica |
|--------|---------------|-------------------|
| BACTEROIDETES | Bacteroides fragilis | Digestione fibre, SCFA |
| BACTEROIDETES | Bacteroides thetaiotaomicron | Metabolismo polisaccaridi |
| BACTEROIDETES | Prevotella copri | Associato a dieta vegetale, controverso |
| FIRMICUTES | Ruminococcus bromii | Amido resistente, butirrato |
| FIRMICUTES | Eubacterium rectale | Produzione butirrato |
| FIRMICUTES | Coprococcus | Anti-infiammatorio |
| FIRMICUTES | Blautia | Metabolismo bile |
| FIRMICUTES | Roseburia | SCFA, barriera intestinale |
| FIRMICUTES | Clostridium cluster IV | Butirrato |
| FIRMICUTES | Clostridium cluster XIVa | Butirrato |
| PROTEOBACTERIA | E. coli (commensale) | Vitamina K, B12 |
| PROTEOBACTERIA | Klebsiella | Potenzialmente patogeno |
| ACTINOBACTERIA | Collinsella | Metabolismo colesterolo |
| ACTINOBACTERIA | Eggerthella | Metabolismo polifenoli |
| VERRUCOMICROBIA | Akkermansia muciniphila | Barriera mucosa (espandere) |
| ARCHAEA | Methanobrevibacter smithii | Metanogenesi |
| FUNGI | Candida albicans | Opportunista |
| FUNGI | Saccharomyces | Probiotico |

### 3.2 Database Epigenetics (da 15 a 50+ geni)

**Geni da aggiungere per categoria:**

| Categoria | Gene | Funzione |
|-----------|------|----------|
| **METABOLISMO ENERGETICO** | | |
| | UCP2 | Uncoupling protein, efficienza mitocondriale |
| | UCP3 | Uncoupling protein muscolare |
| | AMPK | Sensore energetico cellulare |
| | SIRT1 | Longevita, metabolismo lipidi |
| | SIRT3 | Funzione mitocondriale |
| | PGC-1beta | Biogenesi mitocondriale |
| **STRESS OSSIDATIVO** | | |
| | GPX1 | Glutatione perossidasi |
| | CAT | Catalasi |
| | NRF2 | Master regulator antiossidanti |
| | HO-1 | Heme oxygenase |
| **INFIAMMAZIONE** | | |
| | IL-6 | Miochina, infiammazione |
| | TNF-alpha | Pro-infiammatorio |
| | CRP | Marker infiammazione |
| | NFkB | Regolatore infiammazione |
| | IL-10 | Anti-infiammatorio |
| **FIBRE MUSCOLARI** | | |
| | ACTN3 | Alpha-actinin-3, fibre veloci |
| | MYH7 | Miosina fibre lente |
| | MYOD1 | Differenziazione muscolare |
| **RECUPERO** | | |
| | IGF-1 | Crescita muscolare |
| | GHR | Recettore GH |
| | MSTN | Miostatina |
| | FOXO3 | Atrofia/autofagia |
| **TRASPORTO** | | |
| | MCT1 | Trasporto lattato (uptake) |
| | MCT4 | Trasporto lattato (efflux) |
| | GLUT4 | Trasporto glucosio |
| | CD36 | Trasporto acidi grassi |
| **METILAZIONE** | | |
| | MTHFR | Ciclo folati |
| | COMT | Degradazione catecolamine |
| | MTR | Metionina sintasi |
| | MTRR | Metionina sintasi reduttasi |
| **DETOX/CAFFEINA** | | |
| | CYP1A2 | Metabolismo caffeina |
| | NAT2 | N-acetiltransferasi |
| | GSTM1 | Glutatione S-transferasi |
| | GSTP1 | Glutatione S-transferasi |

### 3.3 Database Alimenti (da 100 a 300+ item)

**Categorie da espandere:**

| Categoria | Alimenti da Aggiungere |
|-----------|------------------------|
| Cereali italiani | Farro, orzo, grano saraceno, miglio, amaranto, teff |
| Proteine alternative | Seitan, tempeh, edamame, lupini, canapa |
| Superfood | Spirulina, chlorella, maca, acai, goji, moringa |
| Fermentati | Kombucha, miso, natto, kimchi, crauti, kefir |
| Pesce | Sgombro, sardine, acciughe, merluzzo, branzino |
| Legumi | Azuki, lenticchie nere, fave, cicerchie |
| Frutta secca | Noci brasiliane, noci pecan, pinoli, pistacchi |
| Semi | Semi di canapa, semi di zucca, semi di girasole |
| Verdure | Cavolo nero, pak choi, daikon, topinambur |
| Snack sportivi | Datteri, fichi secchi, banana chips |

### 3.4 Database Supplements (da 50 a 100+ prodotti)

**Marchi da aggiungere:**

| Brand | Prodotti Chiave |
|-------|-----------------|
| Precision Fuel | PF 30, PF 90, electrolyte tabs |
| Nduranz | Nrgy Unit, Gel, Gummies |
| High5 | Energy Gel, Zero tabs, 4:1 |
| Torq | Gel, Bar, Recovery |
| Hammer Nutrition | Gel, HEED, Recoverite |
| Tailwind | Endurance Fuel, Recovery |
| Skratch Labs | Hydration, Anytime Energy |
| Clif | Bloks, Shot, Bar |
| GU | Roctane, Energy Gel, Stroopwafel |

---

## 4. INTEGRAZIONE ROOK.IO

### 4.1 Architettura Proposta

```
+---------------------------------------------------------------+
|                        ROOK.IO HUB                            |
+---------------+---------------+---------------+---------------+
|    Garmin     |    Apple      |    Polar      | Whoop/Oura    |
|   Connect     |   Health      |    Flow       |  Sleep/HRV    |
+-------+-------+-------+-------+-------+-------+-------+-------+
        |               |               |               |
        v               v               v               v
+---------------------------------------------------------------+
|                   EMPATHY DATA LAYER                          |
+---------------+---------------+---------------+---------------+
|  activities   |  sleep_data   |   hrv_data    |  biometrics   |
|  - workouts   |  - duration   |   - rmssd     |  - weight     |
|  - zones      |  - deep/rem   |   - trends    |  - body fat   |
|  - power/hr   |  - efficiency |   - recovery  |  - hydration  |
+-------+-------+-------+-------+-------+-------+-------+-------+
        |               |               |               |
        v               v               v               v
+---------------------------------------------------------------+
|                  AI ADAPTIVE ENGINE v2                        |
+---------------------------------------------------------------+
|  1. DELTA CALCULATOR (attivita vs piano)                      |
|  2. RECOVERY SCORER (HRV + sleep + fatica)                    |
|  3. GLYCOGEN ESTIMATOR (CHO consumati vs ripristinati)        |
|  4. FATIGUE ACCUMULATOR (CTL/ATL/TSB model)                   |
|  5. NUTRIGENOMICS INTEGRATOR (geni + microbioma)              |
+---------------------------------------------------------------+
        |
        v
+---------------------------------------------------------------+
|                    OUTPUT GENERATORS                          |
+---------------+---------------+---------------+---------------+
|   TRAINING    |   NUTRITION   |    FUELING    |   RECOVERY    |
|   GENERATOR   |   GENERATOR   |   GENERATOR   |   ADVISOR     |
+---------------+---------------+---------------+---------------+
| - TSS target  | - Kcal/day    | - Pre CHO     | - Sleep hrs   |
| - Zone limits | - Macro split | - Intra g/h   | - Stretching  |
| - Workout type| - Meal timing | - Post CHO/PRO| - Cold/Heat   |
| - Duration    | - Substitutes | - Hydration   | - Off days    |
+---------------+---------------+---------------+---------------+
```

### 4.2 File da Creare per Rook.io

```
lib/integrations/rook/
├── rook-client.ts           # SDK wrapper e configurazione
├── data-sync.ts             # Sincronizzazione periodica dati
├── activity-parser.ts       # Parser per workout (zones, TSS, power)
├── sleep-parser.ts          # Parser per sleep data (deep, rem, efficiency)
├── hrv-parser.ts            # Parser per HRV (RMSSD, recovery score)
└── biometrics-parser.ts     # Parser per peso, body composition

app/api/integrations/rook/
├── connect/route.ts         # OAuth connection flow
├── sync/route.ts            # Manual sync endpoint
├── webhook/route.ts         # Webhook receiver per real-time updates
└── disconnect/route.ts      # Disconnect e cleanup
```

### 4.3 Tabelle Database per Dati Rook

```sql
-- Attivita importate
CREATE TABLE rook_activities (
  id UUID PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id),
  source VARCHAR(50), -- 'garmin', 'polar', 'apple', etc.
  external_id VARCHAR(255),
  activity_type VARCHAR(50),
  start_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  distance_meters FLOAT,
  calories INTEGER,
  avg_hr INTEGER,
  max_hr INTEGER,
  avg_power INTEGER,
  normalized_power INTEGER,
  tss FLOAT,
  zones JSONB, -- {z1: 300, z2: 600, z3: 900, ...}
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dati sonno
CREATE TABLE rook_sleep (
  id UUID PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id),
  source VARCHAR(50),
  date DATE,
  total_minutes INTEGER,
  deep_minutes INTEGER,
  rem_minutes INTEGER,
  light_minutes INTEGER,
  awake_minutes INTEGER,
  efficiency FLOAT,
  sleep_score INTEGER,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dati HRV
CREATE TABLE rook_hrv (
  id UUID PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id),
  source VARCHAR(50),
  measured_at TIMESTAMPTZ,
  rmssd FLOAT,
  sdnn FLOAT,
  recovery_score INTEGER,
  stress_level INTEGER,
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. AI SYSTEM EVOLUTION

### 5.1 Confronto v1 vs v2

| Aspetto | v1 (Attuale) | v2 (Con Rook.io) |
|---------|--------------|------------------|
| **Input dati** | Manuale/simulato | Automatico da device |
| **Frequenza** | On-demand | Real-time + batch giornaliero |
| **Recovery** | Input manuale 1-10 | HRV + sleep + fatica calcolata |
| **Fatica** | Stima singolo workout | Modello CTL/ATL/TSB cumulativo |
| **Glicogeno** | Formula semplice | Tracking CHO in/out |
| **Predizione** | Nessuna | ML su storico atleta |

### 5.2 Nuovo Flow AI con Dati Reali

```
MATTINA (05:00 sync automatico)
├── Importa sleep data ultima notte
├── Importa HRV mattutino
├── Calcola Recovery Score = f(HRV, sleep_efficiency, deep_sleep)
├── Calcola Fatigue Accumulation = ATL - CTL (ultimi 7-42 giorni)
└── Genera Daily Readiness Score

PRE-WORKOUT (2h prima)
├── Leggi readiness score
├── Cross-reference con piano allenamento
├── Aggiusta intensita/durata se necessario
├── Genera fueling pre-workout specifico
└── Notifica atleta con prescrizione

POST-WORKOUT (entro 1h)
├── Importa attivita completata
├── Calcola delta vs piano (TSS, durata, zone)
├── Aggiorna glycogen status
├── Genera fueling post-workout
├── Aggiorna fatica cumulativa
└── Aggiusta piano giorni successivi se necessario

SERA (20:00)
├── Calcola bilancio energetico giornata
├── Genera raccomandazioni cena/pre-sonno
├── Suggerimenti sleep per recovery
└── Preview domani
```

### 5.3 Formule Chiave da Implementare

**Recovery Score (0-100):**
```
recovery_score = (
  hrv_score * 0.35 +           // RMSSD vs baseline
  sleep_efficiency * 0.25 +     // % tempo dormito vs a letto
  deep_sleep_score * 0.20 +     // Minuti deep vs target
  tsb_score * 0.20              // Training Stress Balance
)
```

**Training Stress Balance (TSB):**
```
CTL = EMA(TSS, 42 giorni)      // Chronic Training Load (fitness)
ATL = EMA(TSS, 7 giorni)       // Acute Training Load (fatica)
TSB = CTL - ATL                 // Form (positivo = fresco, negativo = affaticato)
```

**Glycogen Status:**
```
glycogen_start = 400-500g (pieno)
glycogen_end = glycogen_start - cho_burned + cho_consumed
glycogen_status = 'depleted' if < 150g, 'low' if < 250g, 'loaded' if > 400g
```

---

## 6. PIANO DI SVILUPPO

### FASE 1: Database Expansion (Settimana 1)

| Task | Priorita | Ore Stimate |
|------|----------|-------------|
| Espandere microbiome-database a 40 batteri | ALTA | 8h |
| Espandere epigenetics-database a 50 geni | ALTA | 8h |
| Espandere foods-database a 300 alimenti | MEDIA | 12h |
| Aggiungere varianti pasti per rotazione | MEDIA | 4h |
| Test e validazione dati | ALTA | 4h |

**Deliverable:** Database scientificamente completi e validati

### FASE 2: Rook.io Integration (Settimane 2-3)

| Task | Priorita | Ore Stimate |
|------|----------|-------------|
| Setup account Rook.io e API keys | ALTA | 2h |
| Implementare rook-client.ts | ALTA | 8h |
| Implementare parsers (activity, sleep, hrv) | ALTA | 16h |
| Creare API endpoints (connect, sync, webhook) | ALTA | 12h |
| Creare tabelle database Supabase | ALTA | 4h |
| UI per connessione device | MEDIA | 8h |
| Test con Garmin/Apple reali | ALTA | 8h |

**Deliverable:** Sincronizzazione funzionante con almeno 2 piattaforme

### FASE 3: AI Engine v2 (Settimane 4-5)

| Task | Priorita | Ore Stimate |
|------|----------|-------------|
| Refactor adaptive-engine per dati reali | ALTA | 16h |
| Implementare Recovery Scorer | ALTA | 8h |
| Implementare CTL/ATL/TSB model | ALTA | 12h |
| Implementare Glycogen Estimator | MEDIA | 8h |
| Cross-integration con nutrigenomics | ALTA | 8h |
| Test e tuning parametri | ALTA | 12h |

**Deliverable:** AI che usa dati reali per predizioni accurate

### FASE 4: Smart Generators (Settimana 6)

| Task | Priorita | Ore Stimate |
|------|----------|-------------|
| Training generator con readiness | ALTA | 12h |
| Nutrition generator con compensazione | ALTA | 12h |
| Fueling generator con timing ML | MEDIA | 8h |
| Recovery advisor con prescrizioni | MEDIA | 8h |
| Dashboard unificata raccomandazioni | ALTA | 8h |

**Deliverable:** Sistema completo che genera prescrizioni personalizzate in tempo reale

---

## TIMELINE VISUALE

```
Gennaio 2026
+----+----+----+----+----+----+
| S1 | S2 | S3 | S4 | S5 | S6 |
+----+----+----+----+----+----+
|####|    |    |    |    |    |  FASE 1: Database Expansion
|    |####|####|    |    |    |  FASE 2: Rook.io Integration
|    |    |    |####|####|    |  FASE 3: AI Engine v2
|    |    |    |    |    |####|  FASE 4: Smart Generators
+----+----+----+----+----+----+

#### = Lavoro attivo
```

---

## METRICHE DI SUCCESSO

| Metrica | Baseline (v1) | Target (v2) |
|---------|---------------|-------------|
| Dati input automatici | 0% | 90% |
| Accuratezza recovery prediction | N/A | >85% |
| Varieta pasti settimanali | 3-4 | 15+ |
| Copertura batteri | 12 | 40 |
| Copertura geni | 15 | 50 |
| Tempo risposta AI | 3-5s | <2s |
| User satisfaction | N/A | >4.5/5 |

---

## RISORSE NECESSARIE

- **API Rook.io**: Abbonamento business
- **Supabase**: Piano Pro per storage aumentato
- **AI Gateway**: Credits per chiamate GPT-4
- **Testing**: Account Garmin/Polar/Apple per test reali

---

## 7. MONETIZZAZIONE - STRIPE SUBSCRIPTION TIERS

### 7.1 Piani Abbonamento

| Piano | Prezzo/Mese | Prezzo/Anno | Target |
|-------|-------------|-------------|--------|
| **FREE** | €0 | €0 | Utenti curiosi, trial |
| **ATHLETE** | €14.99 | €143.90 (-20%) | Atleti amatoriali |
| **PRO** | €39.99 | €383.90 (-20%) | Atleti seri, age grouper |
| **ELITE** | €99.99 | €959.90 (-20%) | Pro, coach, team |

### 7.2 Matrice Funzionalita per Piano

| Funzionalita | Free | Athlete | Pro | Elite |
|--------------|------|---------|-----|-------|
| Dashboard base | X | X | X | X |
| Piano nutrizionale manuale | X | X | X | X |
| Calcolo BMR/macros | X | X | X | X |
| AI Adaptive Engine | - | X | X | X |
| Fueling dinamico | - | X | X | X |
| Integrazione Garmin/Strava | - | X | X | X |
| Lista spesa automatica | - | X | X | X |
| Profilo genetico (50 geni) | - | - | X | X |
| Profilo microbioma (40 batteri) | - | - | X | X |
| Nutrigenomica avanzata | - | - | X | X |
| Integrazione Whoop/Oura | - | - | X | X |
| **CGM (glicemia continua)** | - | - | - | X |
| **Sensori lattato** | - | - | - | X |
| **Pannello ormonale** | - | - | - | X |
| **Monitoraggio NAD+** | - | - | - | X |
| API access per coach | - | - | - | X |
| White-label team | - | - | - | X |

### 7.3 Biomarker per Piano

| Biomarker | Free | Athlete | Pro | Elite |
|-----------|------|---------|-----|-------|
| HRV | - | X | X | X |
| Sleep quality | - | X | X | X |
| Training Load (TSS) | - | X | X | X |
| Recovery Score | - | - | X | X |
| Strain/Readiness | - | - | X | X |
| **Glucose (CGM)** | - | - | Coming | X |
| **Lactate** | - | - | - | X |
| **Cortisol/Testosterone** | - | - | - | X |
| **NAD+/Metaboliti** | - | - | - | X |
| **pH/Ketoni** | - | - | - | X |

### 7.4 File Implementati

```
lib/stripe.ts                  # Stripe SDK wrapper
lib/subscription-plans.ts      # Definizione piani e feature gates
app/actions/stripe.ts          # Server actions per checkout
components/pricing-plans.tsx   # UI pagina prezzi
app/pricing/page.tsx           # Pagina /pricing
```

---

## 8. VISIONE BIOENERGETICA PROFONDA

### 8.1 Lo Scopo di EMPATHY

EMPATHY non e' una semplice app per atleti. E' un **sistema di comprensione bioenergetica** che mira a:

1. **Comprendere come il corpo risponde agli stimoli**
   - Allenamento (carico, intensita, durata)
   - Nutrizione (timing, macro, micro)
   - Ambiente (stress, sonno, recupero)

2. **Identificare i fattori che influenzano l'adattamento**
   - Genetica (SNP metabolici, enzimatici)
   - Epigenetica (espressione genica modulabile)
   - Microbioma (batteri, SCFA, infiammazione)
   - Tossine/Xenobiotici (metalli pesanti, pesticidi, farmaci)

3. **Ottimizzare l'efficienza bioenergetica**
   - Massimizzare output con minimo input
   - Ridurre sprechi metabolici
   - Accelerare recupero
   - Prevenire overtraining/malattia

### 8.2 Il Futuro: Monitoraggio Continuo

```
+---------------------------------------------------------------+
|                 EMPATHY BIOMARKER ECOSYSTEM                   |
+---------------------------------------------------------------+
|                                                               |
|  DISPOSITIVI ATTUALI (2026)                                  |
|  +------------------+  +------------------+  +---------------+ |
|  | Smartwatch       |  | Ring (Oura)      |  | Band (Whoop)  | |
|  | - HR continuo    |  | - HRV notturno   |  | - Strain      | |
|  | - Sleep          |  | - Temp corporea  |  | - Recovery    | |
|  | - Activity       |  | - Readiness      |  | - Sleep       | |
|  +------------------+  +------------------+  +---------------+ |
|                                                               |
|  DISPOSITIVI CGM (2026-2027)                                 |
|  +------------------+  +------------------+  +---------------+ |
|  | Dexcom G7        |  | Freestyle Libre  |  | Supersapiens  | |
|  | - Glucose 24/7   |  | - Glucose 14gg   |  | - Sport focus | |
|  | - Trends         |  | - No calibration |  | - Zone fuel   | |
|  | - Alerts         |  | - Scan-based     |  | - Performance | |
|  +------------------+  +------------------+  +---------------+ |
|                                                               |
|  DISPOSITIVI EMERGENTI (2027-2028)                           |
|  +------------------+  +------------------+  +---------------+ |
|  | Lactate Patch    |  | Sweat Sensors    |  | Breath        | |
|  | - Continuo       |  | - Na/K/Cl        |  | - Ketones     | |
|  | - Threshold      |  | - Cortisol       |  | - Acetone     | |
|  | - Zones          |  | - Glucose        |  | - Metabolism  | |
|  +------------------+  +------------------+  +---------------+ |
|                                                               |
|  DISPOSITIVI FUTURI (2028+)                                  |
|  +------------------+  +------------------+  +---------------+ |
|  | Micro-needles    |  | Implantables     |  | Smart Textiles| |
|  | - Multi-analyte  |  | - Long-term      |  | - EMG         | |
|  | - NAD+           |  | - Hormones       |  | - Muscle O2   | |
|  | - Metabolites    |  | - Inflammation   |  | - Lactate     | |
|  +------------------+  +------------------+  +---------------+ |
|                                                               |
+---------------------------------------------------------------+
                              |
                              v
+---------------------------------------------------------------+
|                    EMPATHY AI BRAIN                           |
+---------------------------------------------------------------+
|                                                               |
|  INPUT LAYER                                                  |
|  - 50+ biomarkers in tempo reale                             |
|  - Storico individuale (anni)                                |
|  - Profilo genetico (500+ SNP)                               |
|  - Profilo microbioma (200+ specie)                          |
|  - Esposoma (tossine, farmaci, integratori)                  |
|                                                               |
|  PROCESSING LAYER                                             |
|  - ML models per pattern recognition                         |
|  - Digital twin del metabolismo                              |
|  - Simulazione "what-if" scenarios                           |
|  - Predizione performance/recupero                           |
|                                                               |
|  OUTPUT LAYER                                                 |
|  - Prescrizioni in tempo reale                               |
|  - Alert predittivi (bonk, injury, illness)                  |
|  - Ottimizzazione automatica piano                           |
|  - Coaching conversazionale AI                               |
|                                                               |
+---------------------------------------------------------------+
```

### 8.3 Biomarker Target per Monitoraggio

| Categoria | Biomarker | Metodo | Frequenza | Insight |
|-----------|-----------|--------|-----------|---------|
| **Energia** | Glucosio | CGM | Continuo | Disponibilita substrato |
| | Lattato | Patch | Continuo | Soglia, zone, fatica |
| | Ketoni | Breath | On-demand | Fat adaptation |
| **Ormoni** | Cortisolo | Sweat | 4x/giorno | Stress, recovery |
| | Testosterone | Blood spot | 1x/settimana | Anabolismo |
| | T/C ratio | Calcolato | Daily | Overtraining risk |
| **Metaboliti** | NAD+ | Microneedle | Daily | Energia cellulare |
| | ATP | Future | Continuo | Stato energetico |
| | Creatina-P | Future | Continuo | Riserva anaerobica |
| **Infiammazione** | CRP | Blood spot | 2x/settimana | Infiammazione sistemica |
| | IL-6 | Sweat | Post-workout | Risposta infiammatoria |
| | TNF-alpha | Blood | 1x/mese | Infiammazione cronica |
| **Idratazione** | Na/K | Sweat | Durante esercizio | Elettroliti |
| | Osmolarita | Urine | Daily | Stato idratazione |
| | Peso | Bilancia smart | Daily | Fluid balance |
| **Muscolo** | Myoglobin | Blood | Post-workout | Danno muscolare |
| | CK | Blood | 2x/settimana | Recovery muscolare |
| | SmO2 | NIRS | Durante esercizio | Ossigenazione locale |

### 8.4 Xenobiotici e Detox

EMPATHY considera anche l'impatto di sostanze esogene:

| Categoria | Sostanza | Fonte | Impatto | Gestione |
|-----------|----------|-------|---------|----------|
| **Metalli** | Mercurio | Pesce grande | Neurotossico, enzimi | Limitare tonno, preferire piccoli |
| | Piombo | Acqua, vernici | Ossa, neuroni | Test acqua, filtri |
| | Cadmio | Fumo, cereali | Reni, ossa | No fumo, variare cereali |
| | Arsenico | Riso, acqua | Multi-organo | Lavare riso, variare |
| **Pesticidi** | Glifosato | Grano, soia | Microbioma, SHIKIMATE | Bio quando possibile |
| | Organofosforici | Frutta, verdura | Colinergici | Lavare, bio, locale |
| **Plastiche** | BPA | Contenitori | Endocrine disruptor | Vetro, acciaio |
| | Ftalati | Packaging | Endocrine disruptor | Fresh food |
| **Farmaci** | FANS | Antidolorifici | Gut, reni | Minimizzare uso |
| | Antibiotici | Prescrizioni | Microbioma | Probiotici post |
| | Statine | Colesterolo | CoQ10, muscoli | Supplementare CoQ10 |

### 8.5 La Promessa EMPATHY

> "Ogni corpo e' unico. EMPATHY impara il TUO corpo - come risponde, come si adatta, 
> cosa lo limita, cosa lo potenzia. Con dati continui e AI avanzata, trasformiamo 
> la complessita biologica in semplici azioni quotidiane per raggiungere la 
> **massima efficienza bioenergetica**."

---

## 9. PROSSIMI PASSI IMMEDIATI

### Settimana Prossima (Priorita)

1. **Integrazione Rook.io**
   - Setup account e API keys
   - Implementare connessione Garmin/Apple
   - Testare sync attivita

2. **Espansione Database**
   - Aggiungere 20 batteri a microbiome-database
   - Aggiungere 20 geni a epigenetics-database
   - Validare scientificamente

3. **Test Stripe**
   - Verificare checkout funzionante
   - Test subscription lifecycle
   - Implementare feature gates

### Mese Prossimo

1. AI Engine v2 con dati reali
2. Recovery Score da HRV
3. CTL/ATL/TSB model
4. UI dashboard biomarkers

---

*Documento generato da EMPATHY AI System*
*Versione 2.0 - Gennaio 2026*
*Aggiornato con: Monetizzazione Stripe, Visione Bioenergetica, Roadmap Sensori*
