import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://grjpozwqdkkgdvzztote.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyanBvendxZGtrZ2R2enp0b3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzY1MTIsImV4cCI6MjA4MjI1MjUxMn0.kiC3fBB5HBWN-jJHwmi75HjjvKkJuOKYLWixYOnt4c8"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return client
}

export function getClient() {
  return createClient()
}
