"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Printer, Dumbbell, Target } from "lucide-react"
import type { GymWorkoutSession, WorkoutExercise } from "./gym-workout-builder"

interface GymWorkoutCardProps {
  session: GymWorkoutSession
  athleteName?: string
  onClose?: () => void
}

// Stimulus type labels and colors
const STIMULUS_INFO: Record<string, { label: string; color: string; description: string }> = {
  forza: { label: "Forza", color: "bg-red-500", description: "3-6 rep, 80-90% 1RM, 3-5 min rest" },
  forza_massima: { label: "Forza Massimale", color: "bg-red-700", description: "1-3 rep, 90-100% 1RM, 5+ min rest" },
  neuromuscolare: {
    label: "Neuromuscolare",
    color: "bg-purple-600",
    description: "3-5 rep esplosive, 70-80% 1RM, 3 min rest",
  },
  ipertrofia: { label: "Ipertrofia", color: "bg-blue-600", description: "8-12 rep, 65-75% 1RM, 60-90s rest" },
  esplosivo: { label: "Esplosivo", color: "bg-orange-500", description: "3-6 rep veloci, 50-70% 1RM, 2-3 min rest" },
  resistenza: { label: "Resistenza", color: "bg-green-600", description: "15-20+ rep, 50-65% 1RM, 30-60s rest" },
  mobilita: { label: "Mobilità", color: "bg-teal-500", description: "Movimenti controllati, 30-60s per posizione" },
  stretching: { label: "Stretching", color: "bg-cyan-500", description: "Allungamenti statici, 30-60s per muscolo" },
}

// Muscle group labels - allineati con API ExerciseDB
const MUSCLE_LABELS: Record<string, string> = {
  "chest": "Chest",
  "back": "Back",
  "shoulders": "Shoulders",
  "upper arms": "Upper Arms",
  "upper legs": "Upper Legs",
  "waist": "Waist / Core",
  "lower legs": "Lower Legs",
  "lower arms": "Lower Arms",
  "cardio": "Cardio",
  "neck": "Neck",
  // Legacy mappings per compatibilita'
  quadricipiti: "Quadricipiti",
  femorali: "Femorali",
  glutei: "Glutei",
  polpacci: "Polpacci",
  gambe: "Upper Legs",
  petto: "Chest",
  dorsali: "Back",
  schiena: "Back",
  spalle: "Shoulders",
  bicipiti: "Upper Arms",
  tricipiti: "Upper Arms",
  braccia: "Upper Arms",
  addominali: "Waist / Core",
  core: "Waist / Core",
  lombari: "Back",
}

export function GymWorkoutCard({ session, athleteName, onClose }: GymWorkoutCardProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Scheda Palestra - ${session.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              background: white;
              color: #1a1a1a;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 16px;
              border-bottom: 3px solid #7c3aed;
            }
            .header h1 { font-size: 28px; color: #1a1a1a; margin-bottom: 8px; }
            .header .athlete { font-size: 16px; color: #666; }
            .header .date { font-size: 14px; color: #888; margin-top: 4px; }
            .meta {
              display: flex;
              justify-content: space-around;
              margin-bottom: 24px;
              padding: 16px;
              background: #f8f8f8;
              border-radius: 8px;
            }
            .meta-item { text-align: center; }
            .meta-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .meta-item .value { font-size: 18px; font-weight: bold; color: #7c3aed; }
            .stimulus-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              color: white;
              margin-right: 8px;
            }
            .muscle-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              background: #e5e5e5;
              color: #444;
              margin: 2px;
            }
            .exercises { margin-top: 24px; }
            .exercise {
              display: flex;
              align-items: stretch;
              margin-bottom: 16px;
              border: 1px solid #e5e5e5;
              border-radius: 12px;
              overflow: hidden;
              page-break-inside: avoid;
            }
            .exercise-number {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              background: #7c3aed;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            .exercise-image {
              width: 120px;
              height: 120px;
              object-fit: cover;
              background: #f5f5f5;
            }
            .exercise-content {
              flex: 1;
              padding: 12px 16px;
            }
            .exercise-name {
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 4px;
            }
            .exercise-equipment {
              font-size: 12px;
              color: #888;
              margin-bottom: 8px;
            }
            .exercise-muscles {
              margin-bottom: 8px;
            }
            .exercise-params {
              display: flex;
              gap: 24px;
              margin-top: 8px;
            }
            .param {
              text-align: center;
            }
            .param-label {
              font-size: 10px;
              color: #888;
              text-transform: uppercase;
            }
            .param-value {
              font-size: 20px;
              font-weight: bold;
              color: #1a1a1a;
            }
            .param-value.highlight {
              color: #7c3aed;
            }
            .exercise-notes {
              font-size: 12px;
              color: #666;
              font-style: italic;
              margin-top: 8px;
              padding-top: 8px;
              border-top: 1px dashed #e5e5e5;
            }
            .guidelines {
              margin-top: 32px;
              padding: 16px;
              background: #faf5ff;
              border-radius: 8px;
              border-left: 4px solid #7c3aed;
            }
            .guidelines h3 {
              font-size: 14px;
              color: #7c3aed;
              margin-bottom: 8px;
            }
            .guidelines p {
              font-size: 13px;
              color: #666;
              line-height: 1.6;
            }
            .footer {
              margin-top: 32px;
              padding-top: 16px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              font-size: 12px;
              color: #888;
            }
            @media print {
              body { padding: 10px; }
              .exercise { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const stimulusInfo = STIMULUS_INFO[session.stimulus_type] || STIMULUS_INFO.forza

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Stampa
        </Button>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Chiudi
          </Button>
        )}
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="bg-background">
        {/* Header */}
        <div className="header text-center mb-6 pb-4 border-b-4 border-violet-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Dumbbell className="h-8 w-8 text-violet-600" />
            <h1 className="text-2xl font-bold">{session.name}</h1>
          </div>
          {athleteName && <p className="athlete text-muted-foreground">{athleteName}</p>}
          <p className="date text-sm text-muted-foreground mt-1">
            {session.created_at
              ? new Date(session.created_at).toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : new Date().toLocaleDateString("it-IT")}
          </p>
        </div>

        {/* Meta Info */}
        <div className="meta grid grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="meta-item text-center">
            <div className="label text-xs text-muted-foreground uppercase">Stimolo</div>
            <Badge className={`${stimulusInfo.color} text-white mt-1`}>{stimulusInfo.label}</Badge>
          </div>
          <div className="meta-item text-center">
            <div className="label text-xs text-muted-foreground uppercase">Durata</div>
            <div className="value text-xl font-bold text-violet-600">{session.duration_minutes}'</div>
          </div>
          <div className="meta-item text-center">
            <div className="label text-xs text-muted-foreground uppercase">Esercizi</div>
            <div className="value text-xl font-bold text-violet-600">{session.exercises.length}</div>
          </div>
          <div className="meta-item text-center">
            <div className="label text-xs text-muted-foreground uppercase">Serie Tot.</div>
            <div className="value text-xl font-bold text-violet-600">
              {session.exercises.reduce((acc, ex) => acc + ex.sets, 0)}
            </div>
          </div>
        </div>

        {/* Target Muscles */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium">Distretti Muscolari Target:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {session.target_muscles.map((muscle) => (
              <Badge key={muscle} variant="secondary" className="bg-violet-100 text-violet-700">
                {MUSCLE_LABELS[muscle] || muscle}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Exercises List */}
        <div className="exercises space-y-4">
          {session.exercises.map((workout, index) => (
            <ExerciseCard key={workout.id} workout={workout} index={index + 1} />
          ))}
        </div>

        {/* Guidelines */}
        <div className="guidelines mt-8 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg border-l-4 border-violet-600">
          <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 mb-2">
            Linee Guida - {stimulusInfo.label}
          </h3>
          <p className="text-sm text-muted-foreground">{stimulusInfo.description}</p>
          {session.notes && (
            <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-violet-200">
              <strong>Note:</strong> {session.notes}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="footer mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Scheda generata da EMPATHY Training System</p>
        </div>
      </div>
    </div>
  )
}

// Exercise Card Component
function ExerciseCard({ workout, index }: { workout: WorkoutExercise; index: number }) {
  const { exercise, sets, reps, weight, rest_seconds, tempo, notes } = workout

  return (
    <div className="exercise flex border rounded-xl overflow-hidden bg-card">
      {/* Exercise Number */}
      <div className="exercise-number flex items-center justify-center w-12 bg-violet-600 text-white text-2xl font-bold">
        {index}
      </div>

      {/* Exercise Image */}
      <div className="w-28 h-28 flex-shrink-0 bg-muted">
        <img
          src={exercise.image_url || "/placeholder.svg?height=120&width=120&query=exercise"}
          alt={exercise.name}
          className="exercise-image w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `/placeholder.svg?height=120&width=120&query=${encodeURIComponent(exercise.name)}`
          }}
        />
      </div>

      {/* Exercise Content */}
      <div className="exercise-content flex-1 p-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="exercise-name text-lg font-semibold">{exercise.name}</h4>
            <p className="exercise-equipment text-xs text-muted-foreground capitalize">{exercise.equipment}</p>
          </div>
        </div>

        {/* Muscle Groups */}
        <div className="exercise-muscles flex flex-wrap gap-1 my-2">
          {exercise.muscle_group.slice(0, 3).map((muscle) => (
            <span key={muscle} className="muscle-badge px-2 py-0.5 text-[10px] bg-muted rounded-full">
              {MUSCLE_LABELS[muscle] || muscle}
            </span>
          ))}
        </div>

        {/* Parameters */}
        <div className="exercise-params flex gap-6 mt-2">
          <div className="param text-center">
            <div className="param-label text-[10px] text-muted-foreground uppercase">Serie</div>
            <div className="param-value text-xl font-bold">{sets}</div>
          </div>
          <div className="param text-center">
            <div className="param-label text-[10px] text-muted-foreground uppercase">Rep</div>
            <div className="param-value text-xl font-bold">{reps}</div>
          </div>
          {weight && (
            <div className="param text-center">
              <div className="param-label text-[10px] text-muted-foreground uppercase">Carico</div>
              <div className="param-value highlight text-xl font-bold text-violet-600">{weight}</div>
            </div>
          )}
          <div className="param text-center">
            <div className="param-label text-[10px] text-muted-foreground uppercase">Rest</div>
            <div className="param-value text-xl font-bold">{rest_seconds}s</div>
          </div>
          {tempo && (
            <div className="param text-center">
              <div className="param-label text-[10px] text-muted-foreground uppercase">Tempo</div>
              <div className="param-value text-lg font-bold text-muted-foreground">{tempo}</div>
            </div>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <div className="exercise-notes text-xs text-muted-foreground italic mt-2 pt-2 border-t border-dashed">
            {notes}
          </div>
        )}
      </div>
    </div>
  )
}

export default GymWorkoutCard
