import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { RookProvider } from '@/lib/rook/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/rook/callback
 * Handle OAuth callback from Rook after user authorizes a provider
 * 
 * Query params from Rook:
 * - state: State token for validation
 * - user_id: Rook user ID
 * - data_source: Provider that was authorized
 * - success: 'true' or 'false'
 * - error: Error message if failed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const rookUserId = searchParams.get('user_id')
    const dataSource = searchParams.get('data_source') as RookProvider
    const success = searchParams.get('success') === 'true'
    const errorMessage = searchParams.get('error')
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    
    if (!rookUserId || !dataSource) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard?connections=error&message=Invalid callback parameters`
      )
    }
    
    // Find the user by their Rook user ID
    const { data: connection, error: findError } = await supabaseAdmin
      .from('user_data_connections')
      .select('*')
      .eq('rook_user_id', rookUserId)
      .eq('provider', dataSource)
      .single()
    
    if (findError || !connection) {
      console.error('[Rook Callback] Connection not found:', findError)
      return NextResponse.redirect(
        `${baseUrl}/dashboard?connections=error&message=Connection not found`
      )
    }
    
    // Validate state if we stored it
    if (connection.metadata?.state && state !== connection.metadata.state) {
      console.error('[Rook Callback] State mismatch')
      return NextResponse.redirect(
        `${baseUrl}/dashboard?connections=error&message=Invalid state`
      )
    }
    
    if (success) {
      // Update connection as authorized
      await supabaseAdmin
        .from('user_data_connections')
        .update({
          authorized: true,
          connected_at: new Date().toISOString(),
          sync_status: 'syncing',
          sync_error: null,
          metadata: {
            ...connection.metadata,
            state: null, // Clear state after use
          },
        })
        .eq('id', connection.id)
      
      // Also update athlete_id if user has one
      const { data: athlete } = await supabaseAdmin
        .from('athletes')
        .select('id')
        .eq('user_id', connection.user_id)
        .single()
      
      if (athlete) {
        await supabaseAdmin
          .from('user_data_connections')
          .update({ athlete_id: athlete.id })
          .eq('id', connection.id)
      }
      
      return NextResponse.redirect(
        `${baseUrl}/dashboard?tab=activities&connections=success&provider=${dataSource}`
      )
    } else {
      // Authorization failed
      await supabaseAdmin
        .from('user_data_connections')
        .update({
          authorized: false,
          sync_status: 'error',
          sync_error: errorMessage || 'Authorization failed',
        })
        .eq('id', connection.id)
      
      return NextResponse.redirect(
        `${baseUrl}/dashboard?connections=error&provider=${dataSource}&message=${encodeURIComponent(errorMessage || 'Authorization failed')}`
      )
    }
    
  } catch (error) {
    console.error('[Rook Callback] Error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return NextResponse.redirect(
      `${baseUrl}/dashboard?connections=error&message=Callback processing failed`
    )
  }
}
