import { NextResponse } from "next/server"
import { getStravaAuthUrl } from "@/lib/integrations/strava"

export async function GET() {
  const authUrl = getStravaAuthUrl()

  if (!authUrl) {
    return NextResponse.json(
      { error: "Strava non è configurato. Aggiungi STRAVA_CLIENT_ID nelle variabili d'ambiente." },
      { status: 500 },
    )
  }

  return NextResponse.redirect(authUrl)
}
