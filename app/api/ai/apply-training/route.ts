import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { athleteId, changes } = await request.json()

    if (!athleteId || !changes) {
      return NextResponse.json({ error: "athleteId and changes required" }, { status: 400 })
    }

    const results: { success: string[]; errors: string[] } = { success: [], errors: [] }

    // Apply workout modifications
    if (changes.workouts && changes.workouts.length > 0) {
      for (const workout of changes.workouts) {
        if (workout.action === "modify" && workout.id) {
          // Update existing workout
          const updateData: any = {}
          if (workout.duration_minutes) updateData.duration_minutes = workout.duration_minutes
          if (workout.tss) updateData.tss = workout.tss
          if (workout.intensity_zone) updateData.intensity_zone = workout.intensity_zone
          if (workout.title) updateData.title = workout.title
          if (workout.description) updateData.description = workout.description
          if (workout.workout_type) updateData.workout_type = workout.workout_type

          const { error } = await supabase
            .from("weekly_workouts")
            .update(updateData)
            .eq("id", workout.id)

          if (error) {
            results.errors.push(`Failed to modify workout ${workout.id}: ${error.message}`)
          } else {
            results.success.push(`Modified workout: ${workout.title || workout.id}`)
          }
        } else if (workout.action === "add") {
          // Add new workout
          const { error } = await supabase
            .from("weekly_workouts")
            .insert({
              athlete_id: athleteId,
              day_of_week: workout.day_of_week,
              title: workout.title,
              description: workout.description,
              duration_minutes: workout.duration_minutes,
              tss: workout.tss,
              intensity_zone: workout.intensity_zone,
              workout_type: workout.workout_type,
              sport_type: workout.sport_type || "cycling"
            })

          if (error) {
            results.errors.push(`Failed to add workout: ${error.message}`)
          } else {
            results.success.push(`Added workout: ${workout.title} on day ${workout.day_of_week}`)
          }
        } else if (workout.action === "remove" && workout.id) {
          // Remove workout (mark as rest day or delete)
          const { error } = await supabase
            .from("weekly_workouts")
            .delete()
            .eq("id", workout.id)

          if (error) {
            results.errors.push(`Failed to remove workout ${workout.id}: ${error.message}`)
          } else {
            results.success.push(`Removed workout: ${workout.id}`)
          }
        } else if (workout.action === "rest_day") {
          // Convert to rest day
          const { error } = await supabase
            .from("weekly_workouts")
            .update({
              title: "Rest Day",
              description: workout.reason || "AI recommended rest day",
              duration_minutes: 0,
              tss: 0,
              workout_type: "rest"
            })
            .eq("id", workout.id)

          if (error) {
            results.errors.push(`Failed to set rest day: ${error.message}`)
          } else {
            results.success.push(`Set rest day: ${workout.reason || "Recovery"}`)
          }
        }
      }
    }

    // Apply zone distribution changes
    if (changes.zone_distribution) {
      const { error } = await supabase
        .from("athlete_constraints")
        .upsert({
          athlete_id: athleteId,
          target_zone_distribution: changes.zone_distribution,
          updated_at: new Date().toISOString()
        }, { onConflict: "athlete_id" })

      if (error) {
        results.errors.push(`Zone distribution update failed: ${error.message}`)
      } else {
        results.success.push(`Zone distribution targets updated`)
      }
    }

    // Apply weekly TSS target
    if (changes.weekly_tss_target) {
      const { error } = await supabase
        .from("athlete_constraints")
        .upsert({
          athlete_id: athleteId,
          weekly_tss_target: changes.weekly_tss_target,
          updated_at: new Date().toISOString()
        }, { onConflict: "athlete_id" })

      if (error) {
        results.errors.push(`Weekly TSS target update failed: ${error.message}`)
      } else {
        results.success.push(`Weekly TSS target set to ${changes.weekly_tss_target}`)
      }
    }

    // Apply recovery recommendations
    if (changes.recovery) {
      const { error } = await supabase
        .from("athlete_constraints")
        .upsert({
          athlete_id: athleteId,
          recovery_recommendations: changes.recovery,
          updated_at: new Date().toISOString()
        }, { onConflict: "athlete_id" })

      if (error) {
        results.errors.push(`Recovery recommendations update failed: ${error.message}`)
      } else {
        results.success.push(`Recovery recommendations updated`)
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      message: results.errors.length === 0 
        ? "All training changes applied successfully" 
        : `Applied ${results.success.length} changes, ${results.errors.length} failed`
    })

  } catch (error) {
    console.error("[AI Apply Training] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply training changes" },
      { status: 500 }
    )
  }
}
