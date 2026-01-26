import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRookClient } from '@/lib/rook/client'
import type { RookProvider } from '@/lib/rook/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/rook/authorize
 * Get authorization URL for a specific provider
 * 
 * Query params:
 * - provider: RookProvider (e.g., 'garmin', 'strava', 'whoop')
 * 
 * Returns:
 * - authorization_url: URL to redirect user to
 * - state: State token for validation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as RookProvider
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Get authenticated user from cookie
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const rookClient = getRookClient()
    
    // Generate Rook user ID based on our user ID
    const rookUserId = `empathy_${user.id.replace(/-/g, '')}`
    
    // Register user in Rook if not already registered
    try {
      await rookClient.registerUser(rookUserId)
    } catch (error: unknown) {
      // User might already exist, continue
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('already exists')) {
        console.error('[Rook] Error registering user:', error)
      }
    }
    
    // Get authorization URL
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/rook/callback`
    const authResponse = await rookClient.getAuthorizationUrl(
      rookUserId,
      provider,
      redirectUrl
    )
    
    // Store connection attempt in database
    await supabaseAdmin
      .from('user_data_connections')
      .upsert({
        user_id: user.id,
        provider,
        rook_user_id: rookUserId,
        authorized: false,
        sync_status: 'pending',
        metadata: { state: authResponse.state },
      }, {
        onConflict: 'user_id,provider'
      })
    
    return NextResponse.json({
      authorization_url: authResponse.authorization_url,
      state: authResponse.state,
    })
    
  } catch (error) {
    console.error('[Rook] Authorization error:', error)
    return NextResponse.json(
      { error: 'Failed to get authorization URL' },
      { status: 500 }
    )
  }
}
