import { PowerDurationPoint, MetabolicModelOutput, EmpathyZone } from '../data/athleteData';

// --- Types ---

export interface CalculationInput {
  weight_kg: number;
  body_fat_percent: number;
  power_curve: PowerDurationPoint[];
  ge_actual?: number;
}

export interface AnalysisResult {
  lbm: number;
  cp: number;
  w_prime: number;
  w_lac: number;
  w_al: number;
  vlamax_model: number;
  vlamax_class: string;
  zones: EmpathyZone[];
  lt1: number;
  lt2: number;
  fat_max: number;
}

// --- Constants (From Instructions) ---

const GE_DEFAULT = 0.23;
const TAU_LAC = 45; // Estimated time constant for Glycolytic system activation (s) - conservative average
const TAU_AL = 12; // Estimated Alactic time constant
const K_FACTOR = 0.5; // Conversion scalar for VLaMax model (W*kg^-1 per mmol*L^-1*s^-1)

// --- Helper Functions ---

const calculateLBM = (weight: number, bf: number) => weight * (1 - bf / 100);

// Simple Linear Regression for CP (Work vs Time) for aerobic durations
const calculateCP = (points: PowerDurationPoint[]) => {
  // Filter points > 180s (3 mins) for CP calculation to avoid Anaerobic skew
  const longPoints = points.filter(p => p.duration >= 180);
  
  if (longPoints.length < 2) return { cp: 0, w_prime: 0 }; // Not enough data

  // x = time, y = work (Power * time)
  const n = longPoints.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  longPoints.forEach(p => {
    const work = p.watts * p.duration;
    sumX += p.duration;
    sumY += work;
    sumXY += p.duration * work;
    sumXX += p.duration * p.duration;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX); // CP
  const intercept = (sumY - slope * sumX) / n; // W' (Total Anaerobic Capacity)

  return { cp: Math.round(slope), w_prime: Math.round(intercept) };
};

const classifyVLaMax = (v: number) => {
  if (v < 0.40) return "Endurance puro";
  if (v < 0.60) return "Endurance potente";
  if (v < 0.80) return "All-round";
  if (v < 1.00) return "Anaerobico";
  return "Sprint / lattacido";
};

// --- Main Calculation Engine ---

export const runEmpathyAnalysis = (input: CalculationInput): AnalysisResult => {
  const lbm = calculateLBM(input.weight_kg, input.body_fat_percent);
  const { cp, w_prime } = calculateCP(input.power_curve);
  
  // 1. Model W_lac (Glycolytic Capacity)
  // W' = W_al + W_lac
  // Estimate W_al (Alactic) based on best 5s-10s power approx or standard assumption
  // Standard assumption: W_al is roughly 20-30% of W' in trained endurance athletes, 
  // OR we can calculate it if we had strict Pmax. 
  // Let's use a robust estimation: 
  // Peak Power (5s) ~ P_al_peak. W_al ~ P_al_peak * tau_al (simplified integral of alactic surge).
  // But strictly following instruction: VLaMax depends on W_lac.
  // Let's assume W_al is approx 4-5 kJ for a 70kg athlete (standard PCr stores ~ 20mmol/kg muscle).
  // Or simpler: W_lac = W_prime - W_al.
  const best5s = input.power_curve.find(p => p.duration === 5)?.watts || 800;
  // Estimate W_al based on a short burst model approximation (simplified)
  const w_al_est = (best5s - cp) * 6; // Rough joules in first few seconds above CP
  
  // Ensure math safety
  const w_lac = Math.max(1000, w_prime - w_al_est); 

  // 2. VLaMax Model
  // P_gly_peak = W_lac / tau_lac
  const p_gly_peak = w_lac / TAU_LAC;
  
  // VLaMax = P_gly_peak / (LBM * k)
  let vlamax_model = p_gly_peak / (lbm * K_FACTOR);
  
  // Cap extreme values for model sanity if input curve is weird
  vlamax_model = Math.min(Math.max(vlamax_model, 0.2), 1.5);

  const vlamax_class = classifyVLaMax(vlamax_model);

  // 3. Markers (Based on Instructions)
  const lt2 = cp;
  const fat_max = Math.round(0.70 * cp);
  
  // LT1 range based on VLaMax
  // High VLaMax -> Lower LT1% (0.72)
  // Low VLaMax -> Higher LT1% (0.82)
  // Linear interpolation: v=0.3 -> 0.82, v=1.0 -> 0.72
  // slope = (0.72 - 0.82) / (1.0 - 0.3) = -0.1 / 0.7 = -0.1428
  const lt1_pct = 0.82 + (vlamax_model - 0.3) * ((0.72 - 0.82) / (1.0 - 0.3));
  const lt1 = Math.round(Math.max(0.72, Math.min(0.82, lt1_pct)) * cp);

  // 4. Zones & Substrates
  const ge = input.ge_actual || GE_DEFAULT;
  const w_to_kcal = (w: number) => (w / ge) * 0.86;

  const zoneDefinitions = [
    { id: "Z1", name: "Recovery", min: 0, max: 0.69, cho: 0.40, fat: 0.60, pro: 0.0, desc: "< 0.70 CP" },
    { id: "Z2", name: "Endurance", min: 0.70, max: 0.76, cho: 0.60, fat: 0.40, pro: 0.0, desc: "0.70–0.76 CP" },
    { id: "Z3", name: "Tempo", min: 0.88, max: 0.92, cho: 0.80, fat: 0.20, pro: 0.0, desc: "0.88–0.92 CP" },
    { id: "Z4", name: "Threshold+", min: 0.98, max: 1.02, cho: 0.90, fat: 0.08, pro: 0.02, desc: "0.98–1.02 CP" },
    { id: "Z5", name: "VO2", min: 1.10, max: 1.20, cho: 0.98, fat: 0.00, pro: 0.02, desc: "1.10–1.20 CP" },
    { id: "Z6", name: "Sprint", min: 1.25, max: 9.99, cho: 1.00, fat: 0.00, pro: 0.00, desc: "> 1.25 CP" }
  ];

  const zones: EmpathyZone[] = zoneDefinitions.map(z => {
    // Determine representative power for substrate calc (midpoint of zone)
    // For Z6 use 150% CP as proxy
    const max_range = z.max > 5 ? cp * 1.5 : z.max * cp;
    const min_range = z.min * cp;
    const rep_power = (min_range + max_range) / 2;
    const total_kcal = w_to_kcal(rep_power);

    return {
      id: z.id,
      name: z.name,
      range_watts: [Math.round(min_range), Math.round(max_range)],
      description: z.desc,
      substrates: {
        cho_g_h: Math.round((total_kcal * z.cho) / 4),
        fat_g_h: Math.round((total_kcal * z.fat) / 9),
        pro_g_h: Math.round((total_kcal * z.pro) / 4),
        total_kcal_h: Math.round(total_kcal)
      }
    };
  });

  // Explicit FatMax Zone calculation (0.70 CP)
  const fatMaxKcal = w_to_kcal(fat_max);
  // Instructions say FatMax uses: 45% CHO, 55% FAT
  const fatMaxZone: EmpathyZone = {
      id: "FM",
      name: "FatMax Peak",
      range_watts: [fat_max - 10, fat_max + 10],
      description: "Picco ossidazione lipidica (~70% CP)",
      substrates: {
          cho_g_h: Math.round((fatMaxKcal * 0.45) / 4),
          fat_g_h: Math.round((fatMaxKcal * 0.55) / 9),
          pro_g_h: 0,
          total_kcal_h: Math.round(fatMaxKcal)
      }
  };
  
  // Insert FatMax after Z1
  zones.splice(1, 0, fatMaxZone);

  return {
    lbm: parseFloat(lbm.toFixed(1)),
    cp,
    w_prime,
    w_al: Math.round(w_al_est),
    w_lac: Math.round(w_lac),
    vlamax_model: parseFloat(vlamax_model.toFixed(2)),
    vlamax_class,
    zones,
    lt1,
    lt2,
    fat_max
  };
};
