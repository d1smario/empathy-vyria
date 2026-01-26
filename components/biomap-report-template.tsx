"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Printer, AlertCircle } from "lucide-react"
import { useBioMap } from "@/context/biomap-context"
import type { AthleteDataType } from "@/components/dashboard-content"

interface BioMapReportTemplateProps {
  athleteData: AthleteDataType | null
  userName: string | null | undefined
}

export const BioMapReportTemplate = ({ athleteData, userName }: BioMapReportTemplateProps) => {
  const { selectedDay } = useBioMap()
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  // Get current profile data
  const currentProfile =
    athleteData?.metabolic_profiles?.find((p) => p.is_current) || athleteData?.metabolic_profiles?.[0]
  const constraints = athleteData?.athlete_constraints?.[0]

  const hasCompleteData = currentProfile && currentProfile.ftp_watts

  if (!hasCompleteData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <AlertCircle className="h-12 w-12 text-fuchsia-500 mb-4" />
        <h2 className="text-xl font-bold">Report Non Disponibile</h2>
        <p className="text-muted-foreground max-w-md mt-2">
          Per generare un report completo, configura prima il profilo metabolico e il piano di allenamento.
        </p>
      </div>
    )
  }

  const weight = athleteData?.weight_kg || currentProfile?.weight_kg || 70
  const ftp = currentProfile?.ftp_watts || 0
  const vo2max = currentProfile?.vo2max || 0
  const bodyFat = athleteData?.body_fat_percent || currentProfile?.body_fat_percent || 0
  const lbm = athleteData?.lean_body_mass_kg || currentProfile?.lean_body_mass_kg || 0

  // Calculate age from birth_date
  const age = athleteData?.birth_date
    ? Math.floor((new Date().getTime() - new Date(athleteData.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="flex flex-col items-center gap-8 py-8 min-h-screen">
      {/* Action Bar */}
      <div className="w-full max-w-[210mm] flex justify-between items-center px-4 print:hidden">
        <div>
          <h2 className="text-lg font-semibold">Report EMPATHY</h2>
          <p className="text-sm text-muted-foreground">Report per {userName || "Atleta"}</p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Stampa PDF
        </Button>
      </div>

      {/* A4 Paper Preview */}
      <div
        ref={printRef}
        className="bg-white text-black w-full max-w-[210mm] p-[10mm] shadow-xl print:shadow-none print:w-full print:max-w-none print:absolute print:top-0 print:left-0 print:m-0 print:p-8 text-xs leading-tight"
      >
        {/* Header */}
        <header className="border-b-2 border-black pb-2 mb-4">
          <h1 className="text-2xl font-black uppercase tracking-tight">
            Report Empathy Performance <span className="text-gray-400 font-light">BioMAP</span>
          </h1>
          <div className="mt-2 flex gap-4 text-sm">
            <span className="font-bold">{userName || "Atleta"}</span>
            <span className="text-gray-500">Generato: {new Date().toLocaleDateString("it-IT")}</span>
          </div>
        </header>

        {/* Athlete Block */}
        <div className="mb-4">
          <div className="bg-black text-white px-2 py-1 text-xs font-bold uppercase mb-2">Blocco Atleta</div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Età</span>
              <span className="font-bold">{age || "—"} anni</span>
            </div>
            <div>
              <span className="text-gray-500 block">Peso</span>
              <span className="font-bold">{weight} kg</span>
            </div>
            <div>
              <span className="text-gray-500 block">Body Fat</span>
              <span className="font-bold">{bodyFat || "—"}%</span>
            </div>
            <div>
              <span className="text-gray-500 block">LBM</span>
              <span className="font-bold">{lbm || "—"} kg</span>
            </div>
            <div>
              <span className="text-gray-500 block">Sport</span>
              <span className="font-bold capitalize">{athleteData?.primary_sport || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">FTP</span>
              <span className="font-bold">{ftp} W</span>
            </div>
            <div>
              <span className="text-gray-500 block">W/kg</span>
              <span className="font-bold">{(ftp / weight).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">VO2max</span>
              <span className="font-bold">{vo2max || "—"} ml/kg/min</span>
            </div>
          </div>
        </div>

        {/* Constraints */}
        {constraints && (
          <div className="mb-4">
            <div className="bg-black text-white px-2 py-1 text-xs font-bold uppercase mb-2">Vincoli Alimentari</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {constraints.intolerances && constraints.intolerances.length > 0 && (
                <div>
                  <span className="text-gray-500 block">Intolleranze</span>
                  <span className="font-bold text-red-600">{constraints.intolerances.join(", ")}</span>
                </div>
              )}
              {constraints.allergies && constraints.allergies.length > 0 && (
                <div>
                  <span className="text-gray-500 block">Allergie</span>
                  <span className="font-bold text-red-600">{constraints.allergies.join(", ")}</span>
                </div>
              )}
              {constraints.dietary_preferences && constraints.dietary_preferences.length > 0 && (
                <div>
                  <span className="text-gray-500 block">Preferenze</span>
                  <span className="font-bold">{constraints.dietary_preferences.join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily Routine */}
        <div className="mb-4">
          <div className="bg-black text-white px-2 py-1 text-xs font-bold uppercase mb-2">Routine Giornaliera</div>
          <div className="grid grid-cols-6 gap-4 text-sm text-center">
            <div>
              <span className="text-gray-500 block">Sveglia</span>
              <span className="font-bold">{athleteData?.wake_time?.slice(0, 5) || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Colazione</span>
              <span className="font-bold">{athleteData?.breakfast_time?.slice(0, 5) || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Training</span>
              <span className="font-bold">{athleteData?.training_time?.slice(0, 5) || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Pranzo</span>
              <span className="font-bold">{athleteData?.lunch_time?.slice(0, 5) || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Cena</span>
              <span className="font-bold">{athleteData?.dinner_time?.slice(0, 5) || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Sonno</span>
              <span className="font-bold">{athleteData?.sleep_time?.slice(0, 5) || "—"}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-2 mt-8 text-[9px] text-gray-400 flex justify-between">
          <span>EMPATHY PERFORMANCE bioMAP</span>
          <span>Generated: {new Date().toLocaleDateString("it-IT")}</span>
        </footer>
      </div>
    </div>
  )
}
