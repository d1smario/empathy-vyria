import PricingPlans from "@/components/pricing-plans"

export const metadata = {
  title: "Piani e Prezzi | EMPATHY Performance",
  description: "Scegli il piano EMPATHY adatto a te. Da Free a Elite, con monitoraggio bioenergetico avanzato.",
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="container mx-auto py-12">
        <PricingPlans />
      </div>
    </main>
  )
}
