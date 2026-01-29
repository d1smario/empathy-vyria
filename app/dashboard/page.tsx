import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  let redirectPath: string | null = null

  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirectPath = "/login?error=config"
  }

  if (redirectPath) {
    redirect(redirectPath)
  }

  let user = null
  let profile = null
  let athleteData = null
  let weeklyWorkouts = null
  let linkedAthletes = null

  try {
    const { data: userData, error: userError } = await supabase!.auth.getUser()

    if (userError || !userData?.user) {
      redirectPath = "/login"
    } else {
      user = userData.user

      let { data: profileData, error: profileError } = await supabase!.from("users").select("*").eq("id", user.id).maybeSingle()
      
      console.log("[v0] Profile loaded:", profileData?.role, "Error:", profileError?.message)
      
      // Get role from auth metadata
      const metadataRole = user.user_metadata?.role || 'athlete'
      console.log("[v0] Metadata role:", metadataRole)
      
      // If no profile exists, create it with correct role
      if (!profileData && !profileError) {
        console.log("[v0] No profile found, creating with role:", metadataRole)
        const { data: newProfile, error: insertError } = await supabase!.from("users").insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || '',
          role: metadataRole,
          onboarding_completed: false
        }).select().single()
        
        if (insertError) {
          console.log("[v0] Error creating profile:", insertError.message)
        } else {
          profileData = newProfile
          console.log("[v0] Profile created with role:", newProfile?.role)
        }
      }
      // If role is wrong in users table, update it
      else if (profileData && metadataRole && profileData.role !== metadataRole) {
        console.log("[v0] Role mismatch - DB:", profileData.role, "Metadata:", metadataRole, "- Updating...")
        const { error: updateError } = await supabase!.from("users").update({ role: metadataRole }).eq("id", user.id)
        if (updateError) {
          console.log("[v0] Error updating role:", updateError.message)
        } else {
          profileData.role = metadataRole
          console.log("[v0] Role updated successfully to:", metadataRole)
        }
      }
      
      profile = profileData

      if (!profile?.onboarding_completed) {
        redirectPath = "/onboarding"
      }
    }
  } catch {
    redirectPath = "/login?error=network"
  }

  if (redirectPath) {
    redirect(redirectPath)
  }

  try {
    if (profile?.role === "athlete") {
      const { data: athlete } = await supabase!
        .from("athletes")
        .select("*, athlete_constraints(*), metabolic_profiles(*)")
        .eq("user_id", user!.id)
        .maybeSingle()

      if (!athlete) {
        await supabase!.from("users").update({ onboarding_completed: false }).eq("id", user!.id)
        redirect("/onboarding")
      }

      athleteData = athlete

      const today = new Date()
      const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(today)
      monday.setDate(today.getDate() + mondayOffset)
      monday.setHours(0, 0, 0, 0)

      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      const mondayStr = monday.toISOString().split("T")[0]
      const sundayStr = sunday.toISOString().split("T")[0]

      // Try to load from training_activities (VYRIA generated workouts)
      const { data: vyriaWorkouts } = await supabase!
        .from("training_activities")
        .select("*")
        .eq("athlete_id", athlete.id)
        .gte("activity_date", mondayStr)
        .lte("activity_date", sundayStr)
        .order("activity_date", { ascending: true })

      if (vyriaWorkouts && vyriaWorkouts.length > 0) {
        // Convert VYRIA workouts to WeeklyTraining format
        weeklyWorkouts = vyriaWorkouts.map((w) => {
          const activityDate = new Date(w.activity_date)
          // Get day of week (0 = Monday in our system)
          let dayOfWeek = activityDate.getDay() - 1
          if (dayOfWeek < 0) dayOfWeek = 6 // Sunday becomes 6

          return {
            id: w.id,
            athlete_id: w.athlete_id,
            day_of_week: dayOfWeek,
            workout_type: w.activity_type || w.workout_type || "cycling",
            title: w.title,
            description: w.description,
            duration_minutes: w.duration_minutes,
            target_zone: w.target_zone,
            intervals: w.intervals,
            tss: w.tss,
            activity_date: w.activity_date,
            completed: w.completed,
          }
        })
      } else {
        // Fallback to legacy weekly_workouts table if no VYRIA workouts
        const { data: legacyWorkouts } = await supabase!
          .from("weekly_workouts")
          .select("*")
          .eq("athlete_id", athlete.id)
          .order("day_of_week", { ascending: true })

        weeklyWorkouts = legacyWorkouts
      }
    }

    if (profile?.role === "coach") {
      console.log("[v0] Loading coach athlete links for coach_id:", user!.id)

      const { data: links, error: linksError } = await supabase!
        .from("coach_athlete_links")
        .select(`id, status, started_at, athlete_id`)
        .eq("coach_id", user!.id)

      console.log("[v0] Links query result:", { links, linksError })

      if (links && links.length > 0) {
        console.log("[v0] Found links:", links.length)
        const athleteIds = links.map((link) => link.athlete_id)
        console.log("[v0] Athlete IDs:", athleteIds)

        const { data: athletesData, error: athletesError } = await supabase!
          .from("athletes")
          .select(
            `id, user_id, primary_sport, weight_kg, metabolic_profiles (ftp_watts, vo2max, hr_max, hr_lt2, hr_rest, hr_zones, is_current)`,
          )
          .in("user_id", athleteIds)

        console.log("[v0] Athletes data:", { athletesData, athletesError })

        const { data: usersData, error: usersError } = await supabase!
          .from("users")
          .select("id, full_name, email")
          .in("id", athleteIds)

        console.log("[v0] Users data:", { usersData, usersError })

        linkedAthletes = links.map((link) => {
          const athlete = athletesData?.find((a) => a.user_id === link.athlete_id)
          const athleteUser = usersData?.find((u) => u.id === link.athlete_id)
          console.log("[v0] Mapping link:", { link, athlete, athleteUser })
          return {
            ...link,
            athlete: athlete
              ? { ...athlete, user: athleteUser }
              : athleteUser
                ? {
                    id: null,
                    user_id: link.athlete_id,
                    primary_sport: null,
                    weight_kg: null,
                    metabolic_profiles: [],
                    user: athleteUser,
                  }
                : null,
            invited_email: athleteUser?.email || null,
          }
        })

        console.log("[v0] Final linkedAthletes:", linkedAthletes)
      } else {
        console.log("[v0] No links found for coach")
      }
    }
  } catch {
    redirect("/login?error=data")
  }

  return (
    <DashboardContent
      user={user!}
      profile={profile!}
      athleteData={athleteData}
      linkedAthletes={linkedAthletes}
      weeklyWorkouts={weeklyWorkouts}
    />
  )
}
