"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"athlete" | "coach">("athlete")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError("Le password non coincidono")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri")
      setLoading(false)
      return
    }

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/onboarding`,
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err) {
      console.log("[v0] Register error:", err)
      setError("Errore di connessione. Riprova più tardi.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md border-gray-800 bg-gray-900/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-fuchsia-600/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-fuchsia-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Controlla la tua email</h2>
              <p className="text-gray-400">
                Ti abbiamo inviato un link di conferma a <span className="text-white font-medium">{email}</span>. Clicca
                sul link per attivare il tuo account.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-gray-700 text-gray-200 hover:bg-gray-800 bg-transparent"
                onClick={() => router.push("/login")}
              >
                Torna al login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 bg-fuchsia-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-fuchsia-600/30">
            E
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">EMPATHY</h1>
            <p className="text-sm text-gray-400">Performance bioMAP</p>
          </div>
        </div>

        <Card className="border-gray-800 bg-gray-900/80 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-white">Crea account</CardTitle>
            <CardDescription className="text-gray-400">Inizia il tuo percorso con EMPATHY</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/50 border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-200">
                  Nome completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Mario Rossi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 8 caratteri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">
                  Conferma password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ripeti la password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-gray-200">Tipo di account</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as "athlete" | "coach")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="athlete" id="athlete" className="peer sr-only" />
                    <Label
                      htmlFor="athlete"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800/30 p-4 hover:bg-gray-800/50 peer-data-[state=checked]:border-fuchsia-500 peer-data-[state=checked]:bg-fuchsia-600/20 cursor-pointer transition-colors"
                    >
                      <span className="text-2xl mb-2">🏃</span>
                      <span className="text-sm font-medium text-white">Atleta</span>
                      <span className="text-xs text-gray-400">Gestisco me stesso</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="coach" id="coach" className="peer sr-only" />
                    <Label
                      htmlFor="coach"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800/30 p-4 hover:bg-gray-800/50 peer-data-[state=checked]:border-fuchsia-500 peer-data-[state=checked]:bg-fuchsia-600/20 cursor-pointer transition-colors"
                    >
                      <span className="text-2xl mb-2">👨‍🏫</span>
                      <span className="text-sm font-medium text-white">Coach</span>
                      <span className="text-xs text-gray-400">Gestisco atleti</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                type="submit"
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione account...
                  </>
                ) : (
                  "Crea account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Hai già un account?{" "}
              <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium">
                Accedi
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
