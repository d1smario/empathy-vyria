import { NextResponse } from "next/server"
import { refreshAccessToken, getAthleteActivities } from "@/lib/integrations/strava"

export async function POST() {
  try {
    const refreshToken = process.env.tokenaggiornamento

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token non configurato. Aggiungi tokenaggiornamento nelle variabili d'ambiente." },
        { status: 400 },
      )
    }

    // Get fresh access token using refresh token
    console.log("[v0] Refreshing Strava access token...")
    const tokenResponse = await refreshAccessToken(refreshToken)

    if (!tokenResponse.access_token) {
      return NextResponse.json({ error: "Impossibile ottenere access token da Strava" }, { status: 401 })
    }

    console.log("[v0] Access token obtained, fetching activities...")

    // Get activities from last 30 days
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
    const activities = await getAthleteActivities(tokenResponse.access_token, thirtyDaysAgo, undefined, 100)

    console.log(`[v0] Fetched ${activities.length} activities from Strava`)

    // Extract power data for metabolic analysis
    const powerData = activities
      .filter((a) => a.average_watts && a.average_watts > 0)
      .map((a) => ({
        id: a.id,
        name: a.name,
        date: a.start_date,
        type: a.type,
        duration: a.moving_time,
        distance: a.distance,
        avgPower: a.average_watts,
        maxPower: a.max_watts,
        normalizedPower: a.weighted_average_watts,
        avgHr: a.average_heartrate,
        maxHr: a.max_heartrate,
        calories: a.calories,
      }))

    // Calculate best powers for different durations
    const bestPowers: { [key: string]: number } = {}

    // Simple estimation from activities (real implementation would need activity streams)
    powerData.forEach((activity) => {
      if (activity.avgPower && activity.duration) {
        const durationMin = Math.round(activity.duration / 60)

        // Estimate peak powers based on activity duration and avg power
        // These are approximations - real data would come from activity streams
        if (durationMin >= 1 && durationMin <= 5) {
          const est5s = Math.round(activity.maxPower || activity.avgPower * 1.5)
          if (!bestPowers["5s"] || est5s > bestPowers["5s"]) bestPowers["5s"] = est5s
        }
        if (durationMin >= 1) {
          const est1min = Math.round(activity.maxPower || activity.avgPower * 1.3)
          if (!bestPowers["1min"] || est1min > bestPowers["1min"]) bestPowers["1min"] = est1min
        }
        if (durationMin >= 5) {
          const est5min = Math.round((activity.normalizedPower || activity.avgPower) * 1.1)
          if (!bestPowers["5min"] || est5min > bestPowers["5min"]) bestPowers["5min"] = est5min
        }
        if (durationMin >= 20) {
          const est20min = Math.round(activity.normalizedPower || activity.avgPower)
          if (!bestPowers["20min"] || est20min > bestPowers["20min"]) bestPowers["20min"] = est20min
        }
        if (durationMin >= 60) {
          const est60min = Math.round(activity.avgPower * 0.95)
          if (!bestPowers["60min"] || est60min > bestPowers["60min"]) bestPowers["60min"] = est60min
        }
      }
    })

    return NextResponse.json({
      success: true,
      athlete: tokenResponse.athlete,
      activitiesCount: activities.length,
      powerActivities: powerData.length,
      bestPowers,
      recentActivities: powerData.slice(0, 10),
    })
  } catch (error) {
    console.error("[v0] Strava import error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore durante l'importazione da Strava" },
      { status: 500 },
    )
  }
}
