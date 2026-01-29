import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Activity, Brain, Heart, Dna } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">EMPATHY</span>
          </div>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Accedi</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Registrati</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-5xl font-bold text-foreground tracking-tight">
            Performance <span className="text-primary">bioMAP</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Sistema avanzato di analisi metabolica per ciclisti e atleti di endurance
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
            <div className="p-4 rounded-lg border border-border bg-card">
              <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">Analisi microbioma con intelligenza artificiale</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-semibold">Metabolic Profile</h3>
              <p className="text-sm text-muted-foreground">Profilo metabolico personalizzato</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <Dna className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold">Epigenetics</h3>
              <p className="text-sm text-muted-foreground">Analisi epigenetica e nutrizione</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/register">
              <Button size="lg">Inizia Ora</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Accedi</Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          EMPATHY Performance Analysis System
        </div>
      </footer>
    </div>
  )
}
