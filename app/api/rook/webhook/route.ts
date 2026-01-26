import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateWebhookSignature } from '@/lib/rook/client'
import { 
  mapActivityEvent, 
  mapSleepSummary, 
  mapPhysicalSummary,
  formatActivityForInsert,
  formatSleepForInsert,
  formatBodyMetricsForInsert
} from '@/lib/rook/data-mapper'
import type { 
  RookWebhookPayload, 
  RookActivityEvent, 
  RookSleepSummary,
  RookPhysicalSummary,
  RookBodySummary
} from '@/lib/rook/types'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/rook/webhook
 * Receive real-time data from Rook webhooks
 * 
 * Event types:
 * - user.authorized / user.revoked
 * - physical.summary.created
 * - sleep.summary.created
 * - body.summary.created
 * - activity.event.created
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-rook-signature') || ''
    
    // Validate webhook signature (if configured)
    const webhookSecret = process.env.ROOK_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValid = validateWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error('[Rook Webhook] Invalid signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }
    
    const payload: RookWebhookPayload = JSON.parse(body)
    
    // Log webhook for debugging
    await supabaseAdmin.from('rook_webhook_logs').insert({
      event_type: payload.event_type,
      rook_user_id: payload.user_id,
      provider: payload.data_source,
      payload: payload,
      headers: Object.fromEntries(request.headers.entries()),
    })
    
    // Find user by Rook user ID
    const { data: connection } = await supabaseAdmin
      .from('user_data_connections')
      .select('user_id, athlete_id')
      .eq('rook_user_id', payload.user_id)
      .eq('provider', payload.data_source)
      .single()
    
    if (!connection) {
      console.error('[Rook Webhook] Connection not found for user:', payload.user_id)
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true, processed: false })
    }
    
    const { user_id, athlete_id } = connection
    
    // Process based on event type
    switch (payload.event_type) {
      case 'user.authorized':
        await handleUserAuthorized(payload)
        break
        
      case 'user.revoked':
        await handleUserRevoked(payload)
        break
        
      case 'activity.event.created':
        await handleActivityEvent(payload.data as RookActivityEvent, user_id, athlete_id)
        break
        
      case 'sleep.summary.created':
        await handleSleepSummary(payload.data as RookSleepSummary, user_id, athlete_id)
        break
        
      case 'physical.summary.created':
        await handlePhysicalSummary(payload.data as RookPhysicalSummary, user_id, athlete_id)
        break
        
      case 'body.summary.created':
        await handleBodySummary(payload.data as RookBodySummary, user_id, athlete_id)
        break
        
      default:
        console.log('[Rook Webhook] Unhandled event type:', payload.event_type)
    }
    
    // Update last sync timestamp
    await supabaseAdmin
      .from('user_data_connections')
      .update({ 
        last_sync_at: new Date().toISOString(),
        sync_status: 'success',
        sync_error: null
      })
      .eq('rook_user_id', payload.user_id)
      .eq('provider', payload.data_source)
    
    // Mark webhook as processed
    await supabaseAdmin
      .from('rook_webhook_logs')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('payload->user_id', payload.user_id)
      .eq('payload->timestamp', payload.timestamp)
    
    return NextResponse.json({ received: true, processed: true })
    
  } catch (error) {
    console.error('[Rook Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// =====================================================
// EVENT HANDLERS
// =====================================================

async function handleUserAuthorized(payload: RookWebhookPayload) {
  await supabaseAdmin
    .from('user_data_connections')
    .update({
      authorized: true,
      connected_at: new Date().toISOString(),
      sync_status: 'success',
    })
    .eq('rook_user_id', payload.user_id)
    .eq('provider', payload.data_source)
}

async function handleUserRevoked(payload: RookWebhookPayload) {
  await supabaseAdmin
    .from('user_data_connections')
    .update({
      authorized: false,
      sync_status: 'disconnected',
    })
    .eq('rook_user_id', payload.user_id)
    .eq('provider', payload.data_source)
}

async function handleActivityEvent(
  data: RookActivityEvent,
  userId: string,
  athleteId?: string | null
) {
  // Get user's FTP and LTHR for TSS calculation
  let userFtp: number | undefined
  let userLthr: number | undefined
  
  if (athleteId) {
    const { data: athlete } = await supabaseAdmin
      .from('athletes')
      .select('ftp, lthr')
      .eq('id', athleteId)
      .single()
    
    if (athlete) {
      userFtp = athlete.ftp
      userLthr = athlete.lthr
    }
  }
  
  const mappedActivity = mapActivityEvent(data, userFtp, userLthr)
  const insertData = formatActivityForInsert(mappedActivity, userId, athleteId || undefined)
  
  // Upsert to handle duplicates
  await supabaseAdmin
    .from('imported_activities')
    .upsert(insertData, {
      onConflict: 'user_id,source_provider,source_id'
    })
  
  // Also store raw data
  await supabaseAdmin
    .from('imported_health_data')
    .upsert({
      user_id: userId,
      athlete_id: athleteId,
      provider: data.data_source,
      data_type: 'activity_event',
      data_date: data.date,
      payload: data,
      rook_event_id: data.activity_id,
    }, {
      onConflict: 'user_id,provider,data_type,data_date,rook_event_id'
    })
}

async function handleSleepSummary(
  data: RookSleepSummary,
  userId: string,
  athleteId?: string | null
) {
  const mappedSleep = mapSleepSummary(data)
  const insertData = formatSleepForInsert(mappedSleep, userId, athleteId || undefined)
  
  await supabaseAdmin
    .from('imported_sleep_data')
    .upsert(insertData, {
      onConflict: 'user_id,source_provider,sleep_date'
    })
  
  // Store raw data
  await supabaseAdmin
    .from('imported_health_data')
    .upsert({
      user_id: userId,
      athlete_id: athleteId,
      provider: data.data_source,
      data_type: 'sleep_summary',
      data_date: data.date,
      payload: data,
    }, {
      onConflict: 'user_id,provider,data_type,data_date'
    })
}

async function handlePhysicalSummary(
  data: RookPhysicalSummary,
  userId: string,
  athleteId?: string | null
) {
  const mappedMetrics = mapPhysicalSummary(data)
  const insertData = formatBodyMetricsForInsert(mappedMetrics, userId, athleteId || undefined)
  
  await supabaseAdmin
    .from('imported_body_metrics')
    .upsert(insertData, {
      onConflict: 'user_id,source_provider,metric_date'
    })
  
  // Store raw data
  await supabaseAdmin
    .from('imported_health_data')
    .upsert({
      user_id: userId,
      athlete_id: athleteId,
      provider: data.data_source,
      data_type: 'physical_summary',
      data_date: data.date,
      payload: data,
    }, {
      onConflict: 'user_id,provider,data_type,data_date'
    })
}

async function handleBodySummary(
  data: RookBodySummary,
  userId: string,
  athleteId?: string | null
) {
  // Body summary contains weight, body fat, etc.
  // Update imported_body_metrics with this data
  await supabaseAdmin
    .from('imported_body_metrics')
    .upsert({
      user_id: userId,
      athlete_id: athleteId,
      source_provider: data.data_source,
      metric_date: data.date,
      weight_kg: data.weight_kg,
      body_fat_percentage: data.body_fat_percentage,
      raw_data: data,
    }, {
      onConflict: 'user_id,source_provider,metric_date'
    })
  
  // Store raw data
  await supabaseAdmin
    .from('imported_health_data')
    .upsert({
      user_id: userId,
      athlete_id: athleteId,
      provider: data.data_source,
      data_type: 'body_summary',
      data_date: data.date,
      payload: data,
    }, {
      onConflict: 'user_id,provider,data_type,data_date'
    })
}
