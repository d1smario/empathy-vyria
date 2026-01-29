import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { OnboardingWizardCoach } from "@/components/onboarding-wizard-coach"

export default async function OnboardingPage() {
  const supabase = await createClient()

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      redirect("/login")
    }
    user = data?.user
  } catch (error) {
    console.log("[v0] Auth check failed:", error)
    redirect("/login")
  }

  if (!user) {
    redirect("/login")
  }

  // Check if already completed onboarding
  let profile = null
  try {
    const { data } = await supabase.from("users").select("*").eq("id", user.id).single()
    profile = data
  } catch (error) {
    console.log("[v0] Profile fetch failed:", error)
  }

  if (profile?.onboarding_completed) {
    redirect("/dashboard")
  }

  // Determine role from profile or user metadata
  const role = profile?.role || user.user_metadata?.role || 'athlete'
  console.log("[v0] Onboarding for role:", role)

  // Show different wizard based on role
  if (role === 'coach') {
    return <OnboardingWizardCoach user={user} initialProfile={profile} />
  }

  return <OnboardingWizard user={user} initialProfile={profile} />
}
