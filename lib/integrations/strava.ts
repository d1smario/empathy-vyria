// Strava API Integration
// Documentation: https://developers.strava.com/

function getStravaCredentials() {
  const clientId = process.env.STRAVA_CLIENT_ID || process.env.IDclient
  const clientSecret = process.env.STRAVA_CLIENT_SECRET || process.env.ClientSecret
  const refreshToken =
    process.env.STRAVA_REFRESH_TOKEN || process.env.tokendiaggiornamento || process.env.tokenaggiornamento

  return { clientId, clientSecret, refreshToken }
}

export function getStravaAuthUrl(): string {
  const { clientId } = getStravaCredentials()
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000"
  const redirectUri = `${baseUrl}/api/integrations/strava/callback`

  if (!clientId) {
    console.error("[v0] STRAVA_CLIENT_ID is not configured")
    return ""
  }

  return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,activity:read_all,profile:read_all`
}

// Keep for backward compatibility
export const STRAVA_AUTH_URL = "" // Will be built dynamically

export interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  athlete: {
    id: number
    firstname: string
    lastname: string
  }
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  start_date: string
  elapsed_time: number
  moving_time: number
  distance: number
  average_speed: number
  max_speed: number
  average_watts?: number
  max_watts?: number
  weighted_average_watts?: number
  average_heartrate?: number
  max_heartrate?: number
  suffer_score?: number
  calories?: number
}

export async function exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getStravaCredentials()

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to exchange code for token")
  }

  return response.json()
}

export async function refreshAccessToken(refreshTokenParam?: string): Promise<StravaTokenResponse> {
  const { clientId, clientSecret, refreshToken: envRefreshToken } = getStravaCredentials()
  const token = refreshTokenParam || envRefreshToken

  console.log("[v0] Refreshing Strava access token...")
  console.log("[v0] Client ID exists:", !!clientId)
  console.log("[v0] Client Secret exists:", !!clientSecret)
  console.log("[v0] Refresh Token exists:", !!token)

  if (!clientId || !clientSecret) {
    throw new Error(
      "Strava credentials not configured. Please set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET (or strava and ClientSecret) environment variables.",
    )
  }

  if (!token) {
    throw new Error(
      "No refresh token available. Please set STRAVA_REFRESH_TOKEN (or tokendiaggiornamento or tokenaggiornamento) environment variable.",
    )
  }

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`[v0] Strava token refresh failed: ${response.status} - ${body}`)
    throw new Error(`Failed to refresh token: ${body}`)
  }

  return response.json()
}

export async function getAthleteActivities(
  accessToken: string,
  after?: number,
  before?: number,
  perPage = 30,
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    per_page: perPage.toString(),
  })

  if (after) params.append("after", after.toString())
  if (before) params.append("before", before.toString())

  const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch activities")
  }

  return response.json()
}

export async function getActivityDetails(accessToken: string, activityId: number): Promise<StravaActivity> {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch activity details")
  }

  return response.json()
}
