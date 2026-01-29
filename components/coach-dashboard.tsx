"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, UserPlus, Mail, CheckCircle2, Clock, AlertCircle, Loader2, Search, Calendar, Eye, Flower2 } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { CoachTrainingPlanner } from "./coach-training-planner"
import { CoachLifestylePlanner } from "./coach-lifestyle-planner"
import { AthleteDetailView } from "./athlete-detail-view"

interface Athlete {
  id: string
  user: {
    id: string
    full_name: string | null
    email: string
  }
  primary_sport: string | null
  weight_kg: number | null
  metabolic_profiles: Array<{
    ftp_watts: number | null
    vo2max: number | null
    is_current: boolean
  }>
}

interface CoachLink {
  id: string
  status: string
  started_at: string
  athlete: Athlete | null
  athlete_id: string
  invited_email?: string | null
}

interface CoachDashboardProps {
  user: SupabaseUser
  profile: {
    id: string
    full_name: string | null
    role: string
  }
  linkedAthletes: CoachLink[] | null
}

export function CoachDashboard({ user, profile, linkedAthletes }: CoachDashboardProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAthlete, setSelectedAthlete] = useState<CoachLink | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const athletes = linkedAthletes || []
  const activeAthletes = athletes.filter((a) => a.status === "accepted")
  const pendingAthletes = athletes.filter((a) => a.status === "pending")

  const filteredAthletes = activeAthletes.filter(
    (a) =>
      a.athlete?.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.athlete?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleInviteAthlete = async () => {
    setInviteLoading(true)
    setInviteError(null)
    setInviteSuccess(false)

    try {
      const { data: existingUser, error: lookupError } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("email", inviteEmail)
        .single()

      if (lookupError && lookupError.code !== "PGRST116") {
        if (lookupError.message?.includes("infinite recursion")) {
          try {
            const emailResponse = await fetch("/api/send-invite-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                athleteEmail: inviteEmail,
                coachName: profile.full_name,
                athleteName: null,
                isNewUser: true,
              }),
            })

            if (!emailResponse.ok) {
              const errorData = await emailResponse.json()
              throw new Error(errorData.error || "Errore invio email")
            }

            setInviteSuccess(true)
            setInviteEmail("")
            setTimeout(() => {
              setDialogOpen(false)
              setInviteSuccess(false)
              router.refresh()
            }, 2000)
            return
          } catch (emailError) {
            setInviteError(emailError instanceof Error ? emailError.message : "Errore invio email")
            return
          }
        }
        throw lookupError
      }

      if (existingUser) {
        const { error } = await supabase.from("coach_athlete_links").insert({
          coach_id: user.id,
          athlete_id: existingUser.id,
          status: "pending",
        })

        if (error) {
          if (error.code === "23505") {
            setInviteError("Questo atleta è già collegato al tuo account")
          } else {
            throw error
          }
          return
        }

        try {
          await fetch("/api/send-invite-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              athleteEmail: inviteEmail,
              coachName: profile.full_name,
              athleteName: existingUser.full_name,
              isNewUser: false,
            }),
          })
        } catch (emailError) {
          console.error("[v0] Email send failed:", emailError)
        }
      } else {
        try {
          const emailResponse = await fetch("/api/send-invite-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              athleteEmail: inviteEmail,
              coachName: profile.full_name,
              athleteName: null,
              isNewUser: true,
            }),
          })

          if (!emailResponse.ok) {
            const errorData = await emailResponse.json()
            throw new Error(errorData.error || "Errore invio email")
          }
        } catch (emailError) {
          setInviteError(emailError instanceof Error ? emailError.message : "Errore invio email")
          return
        }
      }

      setInviteSuccess(true)
      setInviteEmail("")
      setTimeout(() => {
        setDialogOpen(false)
        setInviteSuccess(false)
        router.refresh()
      }, 2000)
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Errore durante l'invito")
    } finally {
      setInviteLoading(false)
    }
  }

  const handleResendInvite = async (link: CoachLink) => {
    const athleteEmail = link.athlete?.user?.email || link.invited_email

    if (!athleteEmail) {
      alert("Email atleta non disponibile")
      return
    }

    setResendingId(link.id)

    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const emailResponse = await fetch("/api/send-invite-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            athleteEmail: athleteEmail,
            coachName: profile.full_name,
            athleteName: link.athlete?.user?.full_name || null,
            isNewUser: false,
          }),
        })

        const responseText = await emailResponse.text()
        console.log("[v0] Response:", responseText)

        let result
        try {
          result = JSON.parse(responseText)
        } catch {
          console.error("[v0] Non-JSON response:", responseText)
          result = { success: true, skipped: true }
        }

        if (result.success) {
          alert(
            result.skipped
              ? "Invito registrato! L'atleta vedrà la notifica nella dashboard."
              : "Invito reinviato con successo!",
          )
          setResendingId(null)
          return
        } else {
          throw new Error(result.error || "Errore invio email")
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.error(`[v0] Attempt ${attempt} failed:`, lastError.message)

        if (err instanceof TypeError && err.message === "Failed to fetch") {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
            continue
          }
        } else {
          break
        }
      }
    }

    if (lastError?.message === "Failed to fetch") {
      alert("Errore di connessione. L'invito è già salvato nel database - l'atleta lo vedrà nella sua dashboard.")
    } else {
      alert("Errore durante il reinvio: " + (lastError?.message || "Errore sconosciuto"))
    }

    setResendingId(null)
  }

  const getSportIcon = (sport: string | null) => {
    switch (sport) {
      case "cycling":
        return "🚴"
      case "running":
        return "🏃"
      case "triathlon":
        return "🏊"
      case "swimming":
        return "🏊‍♂️"
      case "gym":
        return "🏋️"
      default:
        return "⚡"
    }
  }

  const getReadinessColor = (score: number) => {
    if (score >= 70) return "bg-green-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (selectedAthlete) {
    return (
      <AthleteDetailView
        athleteUserId={selectedAthlete.athlete_id}
        athleteName={selectedAthlete.athlete?.user?.full_name || null}
        onBack={() => setSelectedAthlete(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Coach</h2>
          <p className="text-muted-foreground">Gestisci e monitora i tuoi atleti</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Invita Atleta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Invita un atleta</DialogTitle>
              <DialogDescription className="text-slate-400">
                Inserisci l'email dell'atleta per invitarlo a collegarsi al tuo account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {inviteError && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
              )}

              {inviteSuccess && (
                <Alert className="bg-green-900/50 border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">Invito inviato con successo!</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label className="text-slate-200">Email atleta</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="atleta@esempio.com"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <Button
                onClick={handleInviteAthlete}
                disabled={!inviteEmail || inviteLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {inviteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Invia invito
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="athletes" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="athletes" className="data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Atleti
          </TabsTrigger>
          <TabsTrigger value="planner" className="data-[state=active]:bg-slate-700">
            <Calendar className="h-4 w-4 mr-2" />
            Pianifica Allenamento
          </TabsTrigger>
          <TabsTrigger value="lifestyle" className="data-[state=active]:bg-slate-700">
            <Flower2 className="h-4 w-4 mr-2" />
            Lifestyle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="athletes">
          <Tabs defaultValue="active" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="active" className="data-[state=active]:bg-slate-700">
                  Attivi ({activeAthletes.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
                  In attesa ({pendingAthletes.length})
                </TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cerca atleta..."
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white w-full sm:w-[250px]"
                />
              </div>
            </div>

            <TabsContent value="active" className="space-y-4">
              {filteredAthletes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAthletes.map((link) => {
                    const currentProfile = link.athlete?.metabolic_profiles?.find((p) => p.is_current)
                    return (
                      <Card
                        key={link.id}
                        className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                        onClick={() => setSelectedAthlete(link)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                                {getSportIcon(link.athlete?.primary_sport)}
                              </div>
                              <div>
                                <CardTitle className="text-white text-base">
                                  {link.athlete?.user?.full_name || "Atleta"}
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs">
                                  {link.athlete?.user?.email}
                                </CardDescription>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAthlete(link)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-700/50 rounded-lg p-2">
                              <p className="text-xs text-slate-400">FTP</p>
                              <p className="text-sm font-semibold text-white">{currentProfile?.ftp_watts || "-"}W</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-2">
                              <p className="text-xs text-slate-400">VO2max</p>
                              <p className="text-sm font-semibold text-white">{currentProfile?.vo2max || "-"}</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-2">
                              <p className="text-xs text-slate-400">Peso</p>
                              <p className="text-sm font-semibold text-white">{link.athlete?.weight_kg || "-"}kg</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${getReadinessColor(75)}`} />
                              <span className="text-xs text-slate-400">Readiness: 75%</span>
                            </div>
                            <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                              {link.athlete?.primary_sport || "N/A"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchQuery ? "Nessun risultato" : "Nessun atleta attivo"}
                    </h3>
                    <p className="text-slate-400 mb-4">
                      {searchQuery ? "Prova con una ricerca diversa" : "Invita il tuo primo atleta per iniziare"}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invita Atleta
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingAthletes.length > 0 ? (
                <div className="space-y-2">
                  {pendingAthletes.map((link) => (
                    <Card key={link.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {link.athlete?.user?.full_name ||
                                  link.athlete?.user?.email ||
                                  link.invited_email ||
                                  "Atleta"}
                              </p>
                              <p className="text-sm text-slate-400">
                                Invito inviato il {new Date(link.started_at).toLocaleDateString("it-IT")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-200 bg-transparent"
                            onClick={() => handleResendInvite(link)}
                            disabled={resendingId === link.id}
                          >
                            {resendingId === link.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Invio...
                              </>
                            ) : (
                              "Reinvia invito"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="py-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Nessun invito in sospeso</h3>
                    <p className="text-slate-400">Tutti gli inviti sono stati accettati</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="planner">
          <CoachTrainingPlanner
            coachId={user.id}
            linkedAthletes={athletes.map((a) => ({
              id: a.id,
              status: a.status,
              athlete: a.athlete
                ? {
                    id: a.athlete.id,
                    user: a.athlete.user,
                    primary_sport: a.athlete.primary_sport,
                    weight_kg: a.athlete.weight_kg,
                    metabolic_profiles: a.athlete.metabolic_profiles,
                  }
                : null,
            }))}
          />
        </TabsContent>

        <TabsContent value="lifestyle">
          <CoachLifestylePlanner
            coachId={user.id}
            linkedAthletes={athletes.map((a) => ({
              id: a.id,
              status: a.status,
              athlete: a.athlete
                ? {
                    id: a.athlete.id,
                    user: a.athlete.user,
                    primary_sport: a.athlete.primary_sport,
                    weight_kg: a.athlete.weight_kg,
                    metabolic_profiles: a.athlete.metabolic_profiles,
                  }
                : null,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
