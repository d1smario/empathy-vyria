import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsContent } from "@/components/settings-content"

export default async function SettingsPage() {
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

  // Fetch user profile
  let profile = null
  try {
    const { data } = await supabase.from("users").select("*").eq("id", user.id).single()
    profile = data
  } catch (error) {
    console.log("[v0] Profile fetch failed:", error)
  }

  let athleteData = null
  try {
    const { data } = await supabase
      .from("athletes")
      .select("id, birth_date, height_cm, weight_kg")
      .eq("user_id", user.id)
      .maybeSingle()
    athleteData = data
  } catch (error) {
    console.log("[v0] Athlete data fetch failed:", error)
  }

  let athleteConstraints = null
  if (athleteData?.id) {
    try {
      const { data } = await supabase
        .from("athlete_constraints")
        .select("id, intolerances, allergies, dietary_limits, dietary_preferences")
        .eq("athlete_id", athleteData.id)
        .maybeSingle()
      athleteConstraints = data
    } catch (error) {
      console.log("[v0] Athlete constraints fetch failed:", error)
    }
  }

  // Fetch connected accounts
  let externalAccounts: any[] = []
  try {
    const { data } = await supabase.from("external_accounts").select("*").eq("user_id", user.id)
    externalAccounts = data || []
  } catch (error) {
    console.log("[v0] External accounts fetch failed:", error)
  }

  return (
    <SettingsContent
      user={user}
      profile={profile}
      externalAccounts={externalAccounts}
      athleteData={athleteData}
      athleteConstraints={athleteConstraints}
    />
  )
}
