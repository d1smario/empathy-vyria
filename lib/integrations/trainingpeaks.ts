// TrainingPeaks API Integration
// Note: Requires TrainingPeaks developer account approval
// Documentation: https://developers.trainingpeaks.com/

const TP_CLIENT_ID = process.env.TRAININGPEAKS_CLIENT_ID
const TP_CLIENT_SECRET = process.env.TRAININGPEAKS_CLIENT_SECRET
const TP_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/integrations/trainingpeaks/callback"

export const TP_AUTH_URL = `https://oauth.trainingpeaks.com/OAuth/Authorize?client_id=${TP_CLIENT_ID}&redirect_uri=${encodeURIComponent(TP_REDIRECT_URI)}&response_type=code&scope=athlete:profile workouts:read workouts:write metrics:read`

export interface TPTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export interface TPAthlete {
  Id: number
  FirstName: string
  LastName: string
  Email: string
  DateOfBirth: string
  Gender: string
  Weight: number
  ThresholdPower: number
  ThresholdHeartRate: number
}

export interface TPWorkout {
  Id: number
  AthleteId: number
  WorkoutDay: string
  Title: string
  WorkoutType: string
  Description: string
  TotalTimePlanned: number
  TotalDistancePlanned: number
  TssPlanned: number
  IfPlanned: number
  TssActual?: number
  IfActual?: number
  Completed: boolean
}

export interface TPMetrics {
  AthleteId: number
  MetricsDate: string
  Ctl: number
  Atl: number
  Tsb: number
  RampRate: number
}

export async function exchangeTPCodeForToken(code: string): Promise<TPTokenResponse> {
  const response = await fetch("https://oauth.trainingpeaks.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: TP_CLIENT_ID || "",
      client_secret: TP_CLIENT_SECRET || "",
      code,
      grant_type: "authorization_code",
      redirect_uri: TP_REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to exchange code for token")
  }

  return response.json()
}

export async function getTPAthlete(accessToken: string): Promise<TPAthlete> {
  const response = await fetch("https://api.trainingpeaks.com/v1/athlete/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch athlete profile")
  }

  return response.json()
}

export async function getTPWorkouts(accessToken: string, startDate: string, endDate: string): Promise<TPWorkout[]> {
  const response = await fetch(`https://api.trainingpeaks.com/v1/workouts?startDate=${startDate}&endDate=${endDate}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch workouts")
  }

  return response.json()
}

export async function getTPMetrics(accessToken: string, startDate: string, endDate: string): Promise<TPMetrics[]> {
  const response = await fetch(`https://api.trainingpeaks.com/v1/metrics?startDate=${startDate}&endDate=${endDate}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch metrics")
  }

  return response.json()
}
