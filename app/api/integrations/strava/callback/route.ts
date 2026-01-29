import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exchangeCodeForToken } from "@/lib/integrations/strava"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?error=strava_auth_failed", request.url))
  }

  try {
    let supabase
    try {
      supabase = await createClient()
    } catch (e) {
      console.error("Supabase client creation failed:", e)
      return NextResponse.redirect(new URL("/settings?error=network_error", request.url))
    }

    let user
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (e) {
      console.error("Failed to get user:", e)
      return NextResponse.redirect(new URL("/login?error=network", request.url))
    }

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code)

    // Save to database
    try {
      await supabase.from("external_accounts").upsert({
        user_id: user.id,
        provider: "strava",
        provider_user_id: tokenData.athlete.id.toString(),
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        sync_enabled: true,
      })
    } catch (e) {
      console.error("Failed to save Strava tokens:", e)
      return NextResponse.redirect(new URL("/settings?error=save_failed", request.url))
    }

    return NextResponse.redirect(new URL("/settings?success=strava_connected", request.url))
  } catch (err) {
    console.error("Strava callback error:", err)
    return NextResponse.redirect(new URL("/settings?error=strava_auth_failed", request.url))
  }
}
