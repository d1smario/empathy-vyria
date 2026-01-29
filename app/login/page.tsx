"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorType = searchParams.get("error")
    if (errorType === "config") {
      setConfigError(true)
      setError("Supabase non è configurato. Contatta l'amministratore.")
    } else if (errorType === "network") {
      setNetworkError(true)
      setError("Problema di connessione. Clicca 'Riprova' per ricaricare.")
    }
  }, [searchParams])

  const handleRetry = () => {
    setNetworkError(false)
    setError(null)
    router.push("/dashboard")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("Errore di connessione. Riprova più tardi.")
      setLoading(false)
    }
  }

  if (networkError) {
    return (
      <Card className="border-gray-800 bg-gray-900/80 backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-white">Problema di connessione</CardTitle>
          <CardDescription className="text-gray-400">Si è verificato un problema temporaneo di rete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-900/50 border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              La connessione al server è momentaneamente non disponibile. Questo può essere un problema temporaneo.
            </AlertDescription>
          </Alert>

          <Button onClick={handleRetry} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
            <RefreshCw className="mr-2 h-4 w-4" />
            Riprova
          </Button>

          <p className="text-sm text-gray-400 text-center">
            Se il problema persiste, prova a ricaricare la pagina o riprova tra qualche minuto.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-800 bg-gray-900/80 backdrop-blur">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-white">Accedi</CardTitle>
        <CardDescription className="text-gray-400">Inserisci le tue credenziali per accedere</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

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
              disabled={configError}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>
              <Link href="/forgot-password" className="text-sm text-fuchsia-400 hover:text-fuchsia-300">
                Password dimenticata?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={configError}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            disabled={loading || configError}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accesso in corso...
              </>
            ) : (
              "Accedi"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Non hai un account?{" "}
          <Link href="/register" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium">
            Registrati
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
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

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
