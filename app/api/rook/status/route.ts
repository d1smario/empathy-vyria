import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRookClient } from '@/lib/rook/client'
import { ROOK_PROVIDERS } from '@/lib/rook/providers'
import type { RookProvider, UserDataConnection } from '@/lib/rook/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /api/rook/status
 * Get status of all data source connections for current user
 * 
 * Returns array of connections with provider info
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get all connections from database
    const { data: connections, error: dbError } = await supabaseAdmin
      .from('user_data_connections')
      .select('*')
      .eq('user_id', user.id)
    
    if (dbError) {
      console.error('[Rook Status] DB error:', dbError)
      throw dbError
    }
    
    // Create a map of connected providers
    const connectedMap = new Map<RookProvider, UserDataConnection>()
    for (const conn of (connections || [])) {
      connectedMap.set(conn.provider as RookProvider, conn as UserDataConnection)
    }
    
    // Build response with all available providers
    const providerStatuses = Object.values(ROOK_PROVIDERS).map(provider => {
      const connection = connectedMap.get(provider.id)
      
      return {
        provider: provider.id,
        name: provider.name,
        logo: provider.logo,
        category: provider.category,
        dataTypes: provider.dataTypes,
        requiresMobile: provider.requiresMobile,
        description: provider.description,
        
        // Connection status
        isConnected: connection?.authorized || false,
        connectionId: connection?.id,
        connectedAt: connection?.connected_at,
        lastSyncAt: connection?.last_sync_at,
        syncStatus: connection?.sync_status || 'not_connected',
        syncError: connection?.sync_error,
      }
    })
    
    // Sort: connected first, then by name
    providerStatuses.sort((a, b) => {
      if (a.isConnected !== b.isConnected) {
        return a.isConnected ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
    
    return NextResponse.json({
      connections: providerStatuses,
      totalConnected: providerStatuses.filter(p => p.isConnected).length,
      totalAvailable: providerStatuses.length,
    })
    
  } catch (error) {
    console.error('[Rook Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get connection status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rook/status/sync
 * Force a sync refresh from Rook for all connected sources
 */
export async function POST(request: NextRequest) {
  try {
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

    // Get user's Rook ID
    const { data: connection } = await supabaseAdmin
      .from('user_data_connections')
      .select('rook_user_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()
    
    if (!connection?.rook_user_id) {
      return NextResponse.json({
        success: true,
        message: 'No connections to sync',
      })
    }

    // Get current status from Rook
    const rookClient = getRookClient()
    const rookUser = await rookClient.getUser(connection.rook_user_id)
    
    // Update our database with Rook's status
    for (const source of rookUser.data_sources) {
      await supabaseAdmin
        .from('user_data_connections')
        .update({
          authorized: source.authorized,
          last_sync_at: source.last_sync || new Date().toISOString(),
          sync_status: source.authorized ? 'success' : 'disconnected',
        })
        .eq('user_id', user.id)
        .eq('provider', source.data_source)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Sync status refreshed',
      sources: rookUser.data_sources.length,
    })
    
  } catch (error) {
    console.error('[Rook Status Sync] Error:', error)
    return NextResponse.json(
      { error: 'Failed to sync status' },
      { status: 500 }
    )
  }
}
