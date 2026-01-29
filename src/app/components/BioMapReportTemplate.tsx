import React, { useRef, useState } from "react";
import { athleteData } from "../../data/athleteData";
import { Button } from "../components/ui/button";
import {
  Printer,
  Lock,
  AlertCircle,
  Copy,
  X,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useBioMap } from "../context/BioMapContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";

export const BioMapReportTemplate = () => {
  const {
    athlete,
    metabolic_model,
    empathy_zones,
    weekly_biomap,
  } = athleteData;
  const { selectedDay } = useBioMap();
  const printRef = useRef<HTMLDivElement>(null);

  const [isTPModalOpen, setIsTPModalOpen] = useState(false);
  const [tpText, setTpText] = useState("");

  const handlePrint = () => {
    window.print();
  };

  // --- LOGIC FOR DAY SELECTION ---
  // Find the detailed plan for the selected day in the generated weekly map
  const plan = weekly_biomap.find(
    (d) =>
      d.meta.day_name.toUpperCase() ===
      selectedDay.toUpperCase(),
  );

  const SectionHeader = ({
    title,
    lock = false,
  }: {
    title: string;
    lock?: boolean;
  }) => (
    <div className="bg-black text-white px-2 py-1 text-xs font-bold uppercase flex justify-between items-center mb-2 mt-4">
      <span>{title}</span>
      {lock && (
        <span className="flex items-center gap-1 text-[10px]">
          <Lock className="h-3 w-3" /> LOCK
        </span>
      )}
    </div>
  );

  const GridRow = ({
    label,
    val,
    sub,
    className = "",
  }: any) => (
    <div
      className={`flex justify-between border-b border-gray-100 py-1 text-xs ${className}`}
    >
      <span className="text-gray-500 font-medium">{label}</span>
      <div className="text-right">
        <span className="font-bold block text-black">
          {val}
        </span>
        {sub && (
          <span className="text-[10px] text-gray-400 block">
            {sub}
          </span>
        )}
      </div>
    </div>
  );

  const generateTPText = () => {
    if (!plan) return "";

    const preStack = plan.supplement_stack.filter(
      (s) =>
        s.target.toLowerCase().includes("pre") ||
        s.timing.toLowerCase().includes("pre"),
    );
    const postStack = plan.supplement_stack.filter(
      (s) =>
        s.target.toLowerCase().includes("post") ||
        s.target.toLowerCase().includes("recovery"),
    );

    let intraSection = `⚡ INTRA-WORK PROTOCOL (Target: ${plan.training_load.intra_target_cho}g CHO)`;

    if (preStack.length > 0) {
      intraSection += `\n🚀 PRE-WORK: ${preStack.map((s) => `${s.product} (${s.dose})`).join(" + ")}`;
    }

    intraSection += `\n${plan.intra_work_table.map((row) => `${row.time_range}: ${row.product} (${row.dose}) -> ${row.target}`).join("\n")}`;

    if (postStack.length > 0) {
      intraSection += `\n🔄 POST-WORK: ${postStack.map((s) => `${s.product} (${s.dose})`).join(" + ")}`;
    }

    return `🔥 BIOMAP DAY: ${plan.meta.day_name.toUpperCase()}
Target: ${plan.meta.type}
Fueling: ${plan.meta.fueling_class}

${intraSection}

🍽 PIANO ALIMENTARE COMPLETO (Cronologico)
${plan.meals
  .filter((m) => m.type !== "intra")
  .map(
    (m) => `► ${m.time} ${m.name.toUpperCase()}
   ${m.items.map((i) => `• ${i.name} (${i.grams}${typeof i.grams === "number" ? "g" : ""})`).join("\n   ")}`,
  )
  .join("\n\n")}

🧠 EMPATHY NOTES
${plan.athlete_profile_notes.join("\n")}
Stop Rules: ${plan.epigenetics.stop_rules.join(", ")}`;
  };

  const handleOpenTPModal = () => {
    setTpText(generateTPText());
    setIsTPModalOpen(true);
  };

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">
          Data Missing for {selectedDay}
        </h2>
        <p className="text-gray-500">
          Please regenerate the weekly BioMap plan.
        </p>
      </div>
    );
  }

  // Filter stacks for visual render
  const preStack = plan.supplement_stack.filter(
    (s) =>
      s.target.toLowerCase().includes("pre") ||
      s.timing.toLowerCase().includes("pre"),
  );
  const postStack = plan.supplement_stack.filter(
    (s) =>
      s.target.toLowerCase().includes("post") ||
      s.target.toLowerCase().includes("recovery"),
  );

  return (
    <div className="flex flex-col items-center gap-8 py-8 bg-gray-50 min-h-screen font-sans">
      {/* Action Bar */}
      <div className="w-full max-w-[210mm] flex justify-between items-center px-4 print:hidden">
        <div>
          <h2 className="text-lg font-semibold">
            BioMAP v2 Report
          </h2>
          <p className="text-sm text-muted-foreground">
            Generated Plan for {selectedDay}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={
              plan.meta.fueling_class === "HIGH"
                ? "destructive"
                : "secondary"
            }
          >
            {plan.meta.fueling_class} FUEL
          </Badge>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print PDF
          </Button>
          <Button
            variant="default"
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-800"
            onClick={handleOpenTPModal}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy for TP
          </Button>
        </div>
      </div>

      {/* TP Modal */}
      <Dialog
        open={isTPModalOpen}
        onOpenChange={setIsTPModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>TrainingPeaks Export</DialogTitle>
            <DialogDescription>
              Copy this text and paste it into the "Description"
              field of the TrainingPeaks workout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              className="h-[300px] font-mono text-xs"
              value={tpText}
              readOnly
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTPModalOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                try {
                  navigator.clipboard
                    .writeText(tpText)
                    .then(() => {
                      alert("Copied to clipboard!");
                    })
                    .catch(() => {
                      // Fallback or explicit failure
                      alert(
                        "Automatic copy blocked. Please press Ctrl+C to copy.",
                      );
                    });
                } catch (e) {
                  alert(
                    "Automatic copy blocked. Please press Ctrl+C to copy.",
                  );
                }
              }}
            >
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* A4 Paper */}
      <div
        ref={printRef}
        className="bg-white text-black w-full max-w-[210mm] p-[10mm] shadow-xl print:shadow-none print:w-full print:max-w-none print:absolute print:top-0 print:left-0 print:m-0 print:p-8 text-xs leading-tight"
      >
        {/* TOP HEADER */}
        <header className="border-b-2 border-black pb-2 mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Report Empathy Performance{" "}
              <span className="text-gray-400 font-light">
                BioMAP v2
              </span>
            </h1>
            <div className="mt-2 flex gap-4 text-sm font-bold">
              <span className="bg-gray-100 px-2 py-0.5 rounded">
                📅 {plan.meta.day_name.toUpperCase()}
              </span>
              <span>{plan.meta.type}</span>
              <span className="text-gray-500 font-normal">
                {plan.meta.time} · {plan.meta.duration}
              </span>
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant="outline"
              className="text-xs uppercase border-black text-black rounded-none px-2 py-1"
            >
              Fueling: {plan.meta.fueling_class}
            </Badge>
          </div>
        </header>

        <div className="text-xs italic mb-4 border-l-2 border-gray-300 pl-2 text-gray-600">
          Sessione: {plan.meta.session_title}
        </div>

        {/* 2-COL LAYOUT: ATHLETE + METABOLIC */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          {/* ATHLETE BLOCK */}
          <div>
            <SectionHeader title="👤 Blocco Atleta" lock />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <GridRow
                label="Nome"
                val={athlete.name}
                sub={`DOB: ${2025 - athlete.age}`}
              />
              <GridRow
                label="Biometria"
                val={`${athlete.weight_kg} kg / ${athlete.height_cm} cm`}
                sub={`BF: ${athlete.body_fat_percent}% · LBM: ${metabolic_model.lbm} kg`}
              />
              <GridRow
                label="Team"
                val={athlete.team}
                sub={athlete.category}
              />
              <GridRow label="Coach" val={athlete.coach} />
              <div className="col-span-2 border-t border-gray-100 pt-1 mt-1">
                <span className="block text-gray-500">
                  Preferenze:
                </span>
                <span className="block font-medium truncate">
                  {athlete.preferences.favorite_dish}
                </span>
              </div>
              <div className="col-span-2 pt-1">
                <span className="block text-gray-500">
                  Da evitare:
                </span>
                <span className="block font-medium text-red-600 truncate">
                  {athlete.constraints.limit_foods.join(", ")}
                </span>
              </div>
            </div>
          </div>

          {/* METABOLIC LAYER */}
          <div>
            <SectionHeader title="🧠 Metabolic Layer" lock />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
              <GridRow
                label="CP (Critical Power)"
                val={`${metabolic_model.cp} W`}
              />
              <GridRow
                label="VLaMax (Model)"
                val={metabolic_model.vlamax_model}
                sub={metabolic_model.vlamax_class}
              />
              <GridRow
                label="FatMax"
                val={`~${athlete.performance_metrics.fat_max_power} W`}
              />
              <GridRow
                label="LT1 / LT2"
                val={`${athlete.performance_metrics.lt1} / ${athlete.performance_metrics.lt2} W`}
              />
            </div>

            {/* ZONES TABLE COMPACT */}
            <table className="w-full text-[10px] text-right mt-2">
              <thead className="bg-gray-100 font-bold text-gray-600">
                <tr>
                  <th className="text-left p-1">Zone</th>
                  <th className="p-1">Range</th>
                  <th className="p-1">Kcal/h</th>
                  <th className="p-1 text-blue-600">CHO</th>
                  <th className="p-1 text-orange-500">FAT</th>
                </tr>
              </thead>
              <tbody>
                {empathy_zones.map((z) => (
                  <tr
                    key={z.id}
                    className="border-b border-gray-50"
                  >
                    <td className="text-left p-1 font-bold">
                      {z.id}
                    </td>
                    <td className="p-1">
                      {z.range_watts[0]}-{z.range_watts[1]}
                    </td>
                    <td className="p-1">
                      {z.substrates.total_kcal_h}
                    </td>
                    <td className="p-1 font-bold text-blue-600">
                      {z.substrates.cho_g_h}
                    </td>
                    <td className="p-1 text-orange-500">
                      {z.substrates.fat_g_h}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1 & 2: PROFILE + LOAD */}
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div>
            <SectionHeader title="1️⃣ Profilo & Strategia" />
            <ul className="list-disc pl-4 space-y-1 text-gray-700">
              {plan.athlete_profile_notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeader title="2️⃣ Carico Allenamento" lock />
            <div className="bg-gray-50 p-2 rounded text-[10px] mb-2 font-mono leading-tight">
              {plan.training_load.structure.map((s, i) => (
                <div key={i}>• {s}</div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-bold border-t border-gray-200 pt-1">
              <span>Totale Kcal (GE {athlete.ge_actual}):</span>
              <span>~{plan.training_load.total_kcal} kcal</span>
            </div>
          </div>
        </div>

        {/* 3: INTRA WORK */}
        <div className="mb-4">
          <SectionHeader
            title="3️⃣ Intra-Work Cronometrato"
            lock
          />

          {/* PRE-STACK VISUAL */}
          {preStack.length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-2 mb-2 text-[10px] flex items-center gap-2">
              <span className="font-bold text-blue-800 uppercase">
                🚀 Pre-Workout:
              </span>
              <span className="text-blue-900 font-medium">
                {preStack
                  .map((s) => `${s.product} (${s.dose})`)
                  .join(" + ")}
              </span>
              <span className="text-blue-400 italic ml-auto">
                {preStack[0]?.note}
              </span>
            </div>
          )}

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4 space-y-2">
              <div className="border p-2 rounded">
                <div className="text-[10px] uppercase text-gray-500">
                  CHO Totali Bruciati
                </div>
                <div className="font-bold text-lg">
                  {plan.training_load.intra_cho_burned_total} g
                </div>
              </div>
              <div className="border p-2 rounded bg-black text-white">
                <div className="text-[10px] uppercase text-gray-300">
                  Target Intra (LOCK)
                </div>
                <div className="font-bold text-lg">
                  {plan.training_load.intra_target_cho} g
                </div>
                <div className="text-[10px] italic">
                  {plan.training_load.intra_lock_rule}
                </div>
              </div>
            </div>
            <div className="col-span-8">
              {plan.intra_work_table.length > 0 ? (
                <table className="w-full text-[10px] text-left">
                  <thead className="bg-gray-100 uppercase">
                    <tr>
                      <th className="p-1">Tempo</th>
                      <th className="p-1">Target</th>
                      <th className="p-1">Prodotto</th>
                      <th className="p-1">Dose</th>
                      <th className="p-1">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.intra_work_table.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100"
                      >
                        <td className="p-1 font-mono font-bold">
                          {row.time_range}
                        </td>
                        <td className="p-1">{row.target}</td>
                        <td className="p-1">{row.product}</td>
                        <td className="p-1 font-bold">
                          {row.dose}
                        </td>
                        <td className="p-1 italic text-gray-500">
                          {row.effect}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-gray-500 italic border border-gray-100 rounded">
                  No Specific Intra-Work Required (Low Intensity
                  / Rest)
                </div>
              )}
            </div>
          </div>

          {/* POST-STACK VISUAL */}
          {postStack.length > 0 && (
            <div className="bg-green-50 border-l-4 border-green-600 p-2 mt-2 text-[10px] flex items-center gap-2">
              <span className="font-bold text-green-800 uppercase">
                🔄 Post-Workout:
              </span>
              <span className="text-green-900 font-medium">
                {postStack
                  .map((s) => `${s.product} (${s.dose})`)
                  .join(" + ")}
              </span>
              <span className="text-green-400 italic ml-auto">
                {postStack[0]?.note}
              </span>
            </div>
          )}
        </div>

        {/* 4: NUTRITION PLAN */}
        <div className="mb-4 break-inside-avoid">
          <SectionHeader
            title="4️⃣ Piano Alimentare BioMAP"
            lock
          />

          <div className="space-y-3">
            {plan.meals.map((meal) => (
              <div
                key={meal.id}
                className="border border-gray-200 rounded-sm overflow-hidden text-[10px]"
              >
                <div className="bg-gray-50 px-2 py-1 flex justify-between items-center font-bold border-b border-gray-200">
                  <div className="flex gap-2">
                    <span>{meal.time}</span>
                    <span className="uppercase">
                      {meal.name}
                    </span>
                    {meal.note && (
                      <span className="text-gray-500 font-normal italic">
                        {meal.note}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span>{meal.total_macros.kcal} kcal</span>
                    <span className="text-blue-600">
                      C: {meal.total_macros.cho}
                    </span>
                    <span className="text-green-600">
                      P: {meal.total_macros.pro}
                    </span>
                    <span className="text-orange-500">
                      F: {meal.total_macros.fat}
                    </span>
                  </div>
                </div>
                <div className="p-1 grid grid-cols-12 gap-2">
                  {meal.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="col-span-12 flex justify-between border-b border-dotted border-gray-100 last:border-0 py-0.5"
                    >
                      <span className="font-medium">
                        {item.name}
                      </span>
                      <div className="flex gap-4 text-gray-500 tabular-nums">
                        <span className="w-12 text-right">
                          {item.grams}{" "}
                          {typeof item.grams === "number"
                            ? "g"
                            : ""}
                        </span>
                        <span className="w-8 text-right">
                          {item.kcal} k
                        </span>
                        <span className="w-16 text-right flex gap-2 justify-end">
                          <span>{item.cho}</span>
                          <span>{item.pro}</span>
                          <span>{item.fat}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5, 6, 7: MICROS & COMPOSITION */}
        <div className="break-before-page">
          <SectionHeader
            title="5️⃣ - 6️⃣ - 7️⃣ Micros, Amino, Lipids"
            lock
          />
          <div className="grid grid-cols-3 gap-4 text-[9px]">
            {/* MICROS */}
            <div className="border p-1">
              <h4 className="font-bold bg-gray-100 p-1 mb-1">
                Vitamine & Minerali
              </h4>
              {plan.micros.vitamins.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th>Nutriente</th>
                      <th>Val</th>
                      <th>%RDA</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...plan.micros.vitamins,
                      ...plan.micros.minerals,
                    ].map((m) => (
                      <tr
                        key={m.name}
                        className="border-b border-gray-50"
                      >
                        <td className="font-medium">
                          {m.name}
                        </td>
                        <td>{m.value}</td>
                        <td>{m.pct_rda}%</td>
                        <td
                          className={
                            m.flag === "LOW"
                              ? "text-red-500 font-bold"
                              : m.flag === "borderline"
                                ? "text-yellow-600"
                                : "text-green-600"
                          }
                        >
                          {m.flag}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-2 italic text-gray-500">
                  Valori nella norma RDA (Stima base da Database
                  Alimenti)
                </div>
              )}
            </div>

            {/* AMINO */}
            <div className="border p-1">
              <h4 className="font-bold bg-gray-100 p-1 mb-1">
                Profilo Aminoacidico (EAA)
              </h4>
              {plan.amino_profile.eaa.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th>EAA</th>
                      <th>g</th>
                      <th>Func</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.amino_profile.eaa.map((a) => (
                      <tr
                        key={a.name}
                        className="border-b border-gray-50"
                      >
                        <td className="font-medium">
                          {a.name}
                        </td>
                        <td>{a.val}</td>
                        <td className="truncate max-w-[50px]">
                          {a.func}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-2 italic text-gray-500">
                  Ensure &gt;25g Net Protein/meal for Leucine
                  Threshold.
                </div>
              )}
            </div>

            {/* LIPIDS & INDICES */}
            <div className="flex flex-col gap-2">
              <div className="border p-1">
                <h4 className="font-bold bg-gray-100 p-1 mb-1">
                  Profilo Lipidico
                </h4>
                {plan.lipids_fiber.length > 0 ? (
                  plan.lipids_fiber.map((l) => (
                    <div
                      key={l.name}
                      className="flex justify-between border-b border-gray-50 py-0.5"
                    >
                      <span>{l.name}</span>
                      <span className="font-mono">{l.val}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-1 italic text-gray-500">
                    Min 1g/kg Fat.
                  </div>
                )}
              </div>
              <div className="border p-1 flex-grow">
                <h4 className="font-bold bg-gray-100 p-1 mb-1">
                  Empathy Indices
                </h4>
                {plan.empathy_indices.length > 0 ? (
                  plan.empathy_indices.map((idx) => (
                    <div key={idx.name} className="mb-1">
                      <span className="block text-gray-500">
                        {idx.name}
                      </span>
                      <span className="font-bold block">
                        {idx.val}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-1 italic text-gray-500">
                    Standard Metrics Apply.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 9: STACK & ADVANCED */}
        <div className="mb-4">
          <SectionHeader title="9️⃣ Stack & Supporto" lock />
          {plan.supplement_stack.length > 0 ? (
            <table className="w-full text-[10px] text-left border mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th>Target</th>
                  <th>Prodotto</th>
                  <th>Dose</th>
                  <th>Timing</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {plan.supplement_stack.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100"
                  >
                    <td className="p-1 font-bold">
                      {s.target}
                    </td>
                    <td className="p-1">{s.product}</td>
                    <td className="p-1">{s.dose}</td>
                    <td className="p-1">{s.timing}</td>
                    <td className="p-1 italic text-gray-500">
                      {s.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="border border-gray-100 p-2 mb-4 text-center text-gray-500 italic text-[10px]">
              Nessuna integrazione specifica richiesta (Focus su
              Whole Foods).
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="border p-2 rounded text-[10px]">
              <h4 className="font-bold uppercase mb-2 text-purple-700">
                1️⃣1️⃣ Microbiota
              </h4>
              {plan.microbiota.drivers.length > 0 ? (
                <>
                  <ul className="list-disc pl-3 mb-2">
                    {plan.microbiota.drivers.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  <table className="w-full">
                    <thead className="text-gray-400">
                      <tr>
                        <th>Food</th>
                        <th>Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.microbiota.food_matrix.map(
                        (f, i) => (
                          <tr key={i}>
                            <td className="font-medium">
                              {f.food}
                            </td>
                            <td>{f.output}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="italic text-gray-500">
                  Mantenere alta diversità vegetale (&gt;30
                  piante/settimana).
                </p>
              )}
            </div>
            <div className="border p-2 rounded text-[10px]">
              <h4 className="font-bold uppercase mb-2 text-teal-700">
                1️⃣2️⃣ Epigenetica
              </h4>
              {plan.epigenetics.stimuli.length > 0 ? (
                <>
                  <table className="w-full mb-2">
                    <thead className="text-gray-400">
                      <tr>
                        <th>Stimolo</th>
                        <th>Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.epigenetics.stimuli.map((s, i) => (
                        <tr key={i}>
                          <td className="font-medium">
                            {s.stim}
                          </td>
                          <td>{s.output}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {plan.epigenetics.stop_rules.length > 0 && (
                    <div className="bg-gray-100 p-1 rounded">
                      <span className="font-bold">
                        STOP RULES:
                      </span>{" "}
                      {plan.epigenetics.stop_rules.join(" · ")}
                    </div>
                  )}
                </>
              ) : (
                <p className="italic text-gray-500">
                  Nessuna pathway specifica attivata oggi.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 pt-4 border-t-2 border-black flex flex-col gap-1 text-[9px] text-gray-500">
          <div className="flex justify-between font-bold text-black uppercase">
            <span>EMPATHY PERFORMANCE ANALYSIS</span>
            <span>CONFIDENTIAL · BIO-MAP V2</span>
          </div>
          <div className="text-center italic mt-2">
            "EMPATHY PERFORMANCE ANALYSIS non misura il lattato.
            Modella la fisiologia che lo genera."
          </div>
          <div className="text-center text-[8px] text-gray-400 mt-1">
            Generated via Empathy Constitution v2. Locked Rule
            7.1 Applied.
          </div>
        </footer>
      </div>

      <style>{`
        @media print {
            @page { margin: 0; size: A4; }
            body { 
              background: white; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .print\\:hidden { display: none !important; }
            .break-before-page { page-break-before: always; }
            .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};
