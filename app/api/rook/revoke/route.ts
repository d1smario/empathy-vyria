import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRookClient } from '@/lib/rook/client'
import type { RookProvider } from '@/lib/rook/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/rook/revoke
 * Revoke authorization for a specific provider
 * 
 * Body:
 * - provider: RookProvider
 */
export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json() as { provider: RookProvider }
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
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

    // Find the connection
    const { data: connection, error: findError } = await supabaseAdmin
      .from('user_data_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .single()
    
    if (findError || !connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      )
    }
    
    // Revoke in Rook
    const rookClient = getRookClient()
    try {
      await rookClient.revokeDataSource(connection.rook_user_id, provider)
    } catch (error) {
      console.error('[Rook] Revoke error:', error)
      // Continue even if Rook fails - we still want to update our DB
    }
    
    // Update our database
    await supabaseAdmin
      .from('user_data_connections')
      .update({
        authorized: false,
        sync_status: 'disconnected',
      })
      .eq('id', connection.id)
    
    return NextResponse.json({
      success: true,
      message: `Disconnected from ${provider}`,
    })
    
  } catch (error) {
    console.error('[Rook] Revoke error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke authorization' },
      { status: 500 }
    )
  }
}
