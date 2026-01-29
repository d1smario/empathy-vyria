"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Check, X, Zap, Dna, Activity, Brain, ChevronRight } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { SUBSCRIPTION_PLANS, type PlanTier, type SubscriptionPlan } from "@/lib/subscription-plans"
import { createSubscriptionCheckout } from "@/lib/actions/stripe"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const tierIcons: Record<PlanTier, React.ReactNode> = {
  free: <Activity className="h-6 w-6" />,
  athlete: <Zap className="h-6 w-6" />,
  pro: <Dna className="h-6 w-6" />,
  elite: <Brain className="h-6 w-6" />,
}

const tierColors: Record<PlanTier, string> = {
  free: "text-gray-400 border-gray-500/30 bg-gray-900/20",
  athlete: "text-blue-400 border-blue-500/30 bg-blue-900/20",
  pro: "text-purple-400 border-purple-500/30 bg-purple-900/20",
  elite: "text-amber-400 border-amber-500/30 bg-amber-900/20",
}

const tierGradients: Record<PlanTier, string> = {
  free: "from-gray-900/50 to-gray-800/50",
  athlete: "from-blue-900/30 to-cyan-900/30",
  pro: "from-purple-900/30 to-pink-900/30",
  elite: "from-amber-900/30 to-orange-900/30",
}

interface PricingPlansProps {
  currentTier?: PlanTier
  onSelectPlan?: (plan: SubscriptionPlan) => void
}

export default function PricingPlans({ currentTier = 'free', onSelectPlan }: PricingPlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Gratis"
    return `€${(cents / 100).toFixed(2)}`
  }

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    if (billingPeriod === 'monthly') return plan.priceMonthly
    return Math.round(plan.priceYearly / 12)
  }

  const getSavingsPercent = (plan: SubscriptionPlan) => {
    if (plan.priceMonthly === 0) return 0
    const yearlyMonthly = plan.priceYearly / 12
    return Math.round((1 - yearlyMonthly / plan.priceMonthly) * 100)
  }

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.tier === 'free') {
      onSelectPlan?.(plan)
      return
    }
    setSelectedPlan(plan)
    setShowCheckout(true)
  }

  const fetchClientSecret = useCallback(() => {
    if (!selectedPlan) return Promise.reject('No plan selected')
    return createSubscriptionCheckout(selectedPlan.id, billingPeriod)
  }, [selectedPlan, billingPeriod])

  return (
    <div className="py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          Scegli il tuo percorso di
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"> Efficienza Bioenergetica</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
          EMPATHY ti aiuta a comprendere come il tuo corpo risponde agli stimoli, 
          influenzato da genetica, microbioma e ambiente. Scegli il livello di profondita.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <span className={billingPeriod === 'monthly' ? 'text-white' : 'text-muted-foreground'}>
            Mensile
          </span>
          <Switch
            checked={billingPeriod === 'yearly'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
          />
          <span className={billingPeriod === 'yearly' ? 'text-white' : 'text-muted-foreground'}>
            Annuale
          </span>
          {billingPeriod === 'yearly' && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Risparmia 20%
            </Badge>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan = plan.tier === currentTier
          const isPopular = plan.tier === 'pro'
          
          return (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden bg-gradient-to-b ${tierGradients[plan.tier]} border ${
                isPopular ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-zinc-700/50'
              }`}
            >
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-purple-500 text-white text-xs font-semibold py-1 text-center">
                  PIU POPOLARE
                </div>
              )}
              
              <CardHeader className={isPopular ? 'pt-8' : ''}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tierColors[plan.tier]} mb-4`}>
                  {tierIcons[plan.tier]}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {formatPrice(getMonthlyEquivalent(plan))}
                    </span>
                    {plan.priceMonthly > 0 && (
                      <span className="text-muted-foreground">/mese</span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && plan.priceMonthly > 0 && (
                    <p className="text-sm text-green-400 mt-1">
                      Risparmi {getSavingsPercent(plan)}% con il piano annuale
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.slice(0, 6).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 6 && (
                    <p className="text-xs text-muted-foreground pl-6">
                      + {plan.features.length - 6} altre funzionalita
                    </p>
                  )}
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-700/50 space-y-2">
                    {plan.limitations.slice(0, 3).map((limitation, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <X className="h-4 w-4 text-red-400/60 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Coming Soon */}
                {plan.comingSoon && plan.comingSoon.length > 0 && (
                  <div className="mt-4">
                    <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                      Prossimamente: {plan.comingSoon.join(', ')}
                    </Badge>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : isPopular ? "default" : "secondary"}
                  disabled={isCurrentPlan}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrentPlan ? (
                    "Piano Attuale"
                  ) : plan.tier === 'free' ? (
                    "Inizia Gratis"
                  ) : (
                    <>
                      Scegli {plan.name}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Biomarkers Comparison */}
      <div className="mt-16 max-w-4xl mx-auto px-4">
        <h3 className="text-2xl font-bold text-center mb-8">
          Biomarker Monitorabili per Piano
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-3 px-4">Biomarker</th>
                {SUBSCRIPTION_PLANS.map(plan => (
                  <th key={plan.id} className={`text-center py-3 px-4 ${tierColors[plan.tier]}`}>
                    {plan.name.split(' ')[1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'HRV (Heart Rate Variability)', key: 'hrv' },
                { name: 'Qualita del Sonno', key: 'sleep' },
                { name: 'Training Load (TSS/CTL/ATL)', key: 'training_load' },
                { name: 'Recovery Score', key: 'recovery_score' },
                { name: 'Strain / Readiness', key: 'strain' },
                { name: 'Glicemia Continua (CGM)', key: 'glucose' },
                { name: 'Lattato', key: 'lactate' },
                { name: 'Cortisolo / Testosterone', key: 'cortisol' },
                { name: 'NAD+ / Metaboliti', key: 'nad' },
              ].map(biomarker => (
                <tr key={biomarker.key} className="border-b border-zinc-800">
                  <td className="py-3 px-4">{biomarker.name}</td>
                  {SUBSCRIPTION_PLANS.map(plan => (
                    <td key={plan.id} className="text-center py-3 px-4">
                      {plan.biomarkers.includes(biomarker.key) ? (
                        <Check className="h-4 w-4 text-green-400 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-600 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vision Section */}
      <div className="mt-16 max-w-3xl mx-auto px-4 text-center">
        <h3 className="text-2xl font-bold mb-4">
          La Visione EMPATHY
        </h3>
        <p className="text-muted-foreground mb-6">
          Comprendere come il corpo risponde agli stimoli e si adatta, influenzato da batteri, 
          epigenetica, tossine e xenobiotici. Con il monitoraggio continuo di glicemia, lattato, 
          pH, ormoni e metaboliti, EMPATHY diventa un sistema di massima efficienza bioenergetica.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Genetica', 'Microbioma', 'CGM', 'Lattato', 'HRV', 'Ormoni', 'NAD+', 'pH'].map(tag => (
            <Badge key={tag} variant="outline" className="border-purple-500/30 text-purple-400">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>
              Abbonati a {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="mt-4">
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ fetchClientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
