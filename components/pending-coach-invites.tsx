"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock, UserCheck, Loader2 } from "lucide-react"

interface PendingInvite {
  id: string
  coach_id: string
  status: string
  started_at: string
  coach: {
    id: string
    full_name: string | null
    email: string
  }
}

interface PendingCoachInvitesProps {
  userId: string
}

export function PendingCoachInvites({ userId }: PendingCoachInvitesProps) {
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchInvites()
  }, [userId])

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from("coach_athlete_links")
        .select(`
          id,
          coach_id,
          status,
          started_at,
          coach:users!coach_athlete_links_coach_id_fkey(id, full_name, email)
        `)
        .eq("athlete_id", userId)
        .eq("status", "pending")

      if (error) throw error
      setInvites(data || [])
    } catch (err) {
      console.error("Error fetching invites:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (inviteId: string) => {
    setActionLoading(inviteId)
    setMessage(null)

    try {
      const { error } = await supabase.from("coach_athlete_links").update({ status: "accepted" }).eq("id", inviteId)

      if (error) throw error

      setMessage({ type: "success", text: "Invito accettato! Il coach può ora vedere i tuoi dati." })
      setInvites(invites.filter((i) => i.id !== inviteId))
    } catch (err) {
      setMessage({ type: "error", text: "Errore nell'accettare l'invito" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (inviteId: string) => {
    setActionLoading(inviteId)
    setMessage(null)

    try {
      const { error } = await supabase.from("coach_athlete_links").delete().eq("id", inviteId)

      if (error) throw error

      setMessage({ type: "success", text: "Invito rifiutato" })
      setInvites(invites.filter((i) => i.id !== inviteId))
    } catch (err) {
      setMessage({ type: "error", text: "Errore nel rifiutare l'invito" })
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (invites.length === 0 && !message) {
    return null // Non mostrare nulla se non ci sono inviti
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-white">Richieste di collegamento</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          I seguenti coach vogliono collegarsi al tuo profilo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert
            className={message.type === "success" ? "bg-green-900/50 border-green-800" : "bg-red-900/50 border-red-800"}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-200" : "text-red-200"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-white">{invite.coach?.full_name || "Coach"}</p>
                <p className="text-sm text-slate-400">{invite.coach?.email}</p>
                <p className="text-xs text-slate-500">
                  Richiesta del {new Date(invite.started_at).toLocaleDateString("it-IT")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReject(invite.id)}
                disabled={actionLoading === invite.id}
                className="border-red-600 text-red-400 hover:bg-red-900/50 bg-transparent"
              >
                {actionLoading === invite.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => handleAccept(invite.id)}
                disabled={actionLoading === invite.id}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading === invite.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Accetta
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
