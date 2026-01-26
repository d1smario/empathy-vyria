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

    // Apply macro changes
    if (changes.macros) {
      const { carbs_g, protein_g, fat_g, calories } = changes.macros
      
      // Update athlete_constraints or create nutrition_targets table entry
      const { error } = await supabase
        .from("athlete_constraints")
        .upsert({
          athlete_id: athleteId,
          daily_carbs_g: carbs_g,
          daily_protein_g: protein_g,
          daily_fat_g: fat_g,
          daily_calories: calories,
          updated_at: new Date().toISOString()
        }, { onConflict: "athlete_id" })

      if (error) {
        results.errors.push(`Macro update failed: ${error.message}`)
      } else {
        results.success.push(`Macros updated: ${carbs_g}g carbs, ${protein_g}g protein, ${fat_g}g fat`)
      }
    }

    // Apply timing changes
    if (changes.timing) {
      const { error } = await supabase
        .from("athlete_constraints")
        .upsert({
          athlete_id: athleteId,
          meal_timing: changes.timing,
          updated_at: new Date().toISOString()
        }, { onConflict: "athlete_id" })

      if (error) {
        results.errors.push(`Timing update failed: ${error.message}`)
      } else {
        results.success.push(`Meal timing updated`)
      }
    }

    // Apply supplement changes
    if (changes.supplements && changes.supplements.length > 0) {
      const { error } = await supabase
        .from("athlete_constraints")
        .upsert({
          athlete_id: athleteId,
          recommended_supplements: changes.supplements,
          updated_at: new Date().toISOString()
        }, { onConflict: "athlete_id" })

      if (error) {
        results.errors.push(`Supplements update failed: ${error.message}`)
      } else {
        results.success.push(`Supplements updated: ${changes.supplements.map((s: any) => s.name).join(", ")}`)
      }
    }

    // Apply food recommendations
    if (changes.foods_to_include || changes.foods_to_avoid) {
      const { error } = await supabase
        .from("athlete_constraints")
        .upsert({
          athlete_id: athleteId,
          foods_to_include: changes.foods_to_include || [],
          foods_to_avoid: changes.foods_to_avoid || [],
          updated_at: new Date().toISOString()
        }, { onConflict: "athlete_id" })

      if (error) {
        results.errors.push(`Food recommendations update failed: ${error.message}`)
      } else {
        results.success.push(`Food recommendations updated`)
      }
    }

    // Apply AI weekly meal plan - store in annual_training_plans.config_json
    if (changes.weeklyPlan) {
      // Get existing annual plan for current year
      const currentYear = new Date().getFullYear()
      const { data: existingPlan } = await supabase
        .from("annual_training_plans")
        .select("id, config_json")
        .eq("athlete_id", athleteId)
        .eq("year", currentYear)
        .maybeSingle()
      
      if (existingPlan) {
        // Merge AI meal plan into existing config_json
        const updatedConfig = {
          ...(existingPlan.config_json || {}),
          ai_meal_plan: changes.weeklyPlan,
          ai_meal_plan_updated_at: new Date().toISOString()
        }
        
        const { error } = await supabase
          .from("annual_training_plans")
          .update({ config_json: updatedConfig })
          .eq("id", existingPlan.id)

        if (error) {
          results.errors.push(`Weekly meal plan update failed: ${error.message}`)
        } else {
          results.success.push(`Weekly meal plan updated with AI recommendations`)
        }
      } else {
        // Create new annual plan with AI meal plan
        const { error } = await supabase
          .from("annual_training_plans")
          .insert({
            athlete_id: athleteId,
            year: currentYear,
            name: `Piano ${currentYear}`,
            config_json: {
              ai_meal_plan: changes.weeklyPlan,
              ai_meal_plan_updated_at: new Date().toISOString()
            }
          })

        if (error) {
          results.errors.push(`Weekly meal plan creation failed: ${error.message}`)
        } else {
          results.success.push(`Weekly meal plan created with AI recommendations`)
        }
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      message: results.errors.length === 0 
        ? "All nutrition changes applied successfully" 
        : `Applied ${results.success.length} changes, ${results.errors.length} failed`
    })

  } catch (error) {
    console.error("[AI Apply Nutrition] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply nutrition changes" },
      { status: 500 }
    )
  }
}
