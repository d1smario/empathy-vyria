import { NextResponse } from "next/server"

// Test endpoint per verificare le credenziali Strava senza Supabase
export async function GET() {
  const clientId = process.env.IDclient || process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.ClientSecret || process.env.STRAVA_CLIENT_SECRET
  const refreshToken =
    process.env.tokendiaggiornamento || process.env.tokenaggiornamento || process.env.STRAVA_REFRESH_TOKEN

  // Verifica credenziali
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      success: false,
      error: "Credenziali Strava mancanti",
      details: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRefreshToken: !!refreshToken,
      },
    })
  }

  if (!refreshToken) {
    return NextResponse.json({
      success: false,
      error: "Refresh token mancante",
      details: {
        hasClientId: true,
        hasClientSecret: true,
        hasRefreshToken: false,
      },
    })
  }

  try {
    // Prova a ottenere un access token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Errore ottenimento token",
        stravaError: tokenData,
      })
    }

    // Prova a ottenere il profilo atleta
    const athleteResponse = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const athleteData = await athleteResponse.json()

    if (!athleteResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Errore fetch atleta",
        stravaError: athleteData,
      })
    }

    // Prova a ottenere le ultime attività
    const activitiesResponse = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=5", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const activitiesData = await activitiesResponse.json()

    return NextResponse.json({
      success: true,
      athlete: {
        id: athleteData.id,
        firstname: athleteData.firstname,
        lastname: athleteData.lastname,
        city: athleteData.city,
        country: athleteData.country,
      },
      recentActivities: activitiesData.length,
      activities: activitiesData.map((a: any) => ({
        name: a.name,
        type: a.type,
        distance: a.distance,
        moving_time: a.moving_time,
        average_watts: a.average_watts,
        has_power: a.device_watts,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: "Errore di connessione",
      message: error.message,
    })
  }
}
