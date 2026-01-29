import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { athleteId, dayOfWeek, sessionData, coachId } = await req.json();

    if (!athleteId || dayOfWeek === undefined || !sessionData || !coachId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify coach-athlete relationship
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('coach_athlete_links')
      .select('*')
      .eq('coach_id', coachId)
      .eq('athlete_id', athleteId)
      .eq('status', 'accepted')
      .single();

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Not authorized to assign workouts to this athlete' }, { status: 403 });
    }

    // Get athlete's internal ID from athletes table (needed for training_activities)
    const { data: athleteRecord, error: athleteError } = await supabaseAdmin
      .from('athletes')
      .select('id')
      .eq('user_id', athleteId)
      .single();

    if (athleteError || !athleteRecord) {
      return NextResponse.json({ error: 'Athlete profile not found' }, { status: 404 });
    }

    // Calculate the target date based on day of week
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Convert our dayNumber (0=Monday, 6=Sunday) to JS day (0=Sunday, 6=Saturday)
    const jsDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    
    let daysUntil = jsDayOfWeek - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    const activityDateStr = targetDate.toISOString().split('T')[0];

    // Save to training_activities (same table the athlete uses for lifestyle)
    // This ensures the athlete will see the coach-assigned session
    const insertData = {
      athlete_id: athleteRecord.id, // Use the internal athlete ID
      activity_date: activityDateStr,
      sport: 'lifestyle',
      title: sessionData.name || 'Sessione Lifestyle',
      description: `${sessionData.name || 'Sessione Lifestyle'} - ${sessionData.category}`,
      duration_minutes: sessionData.totalDuration || 0,
      workout_data: JSON.stringify({
        activities: sessionData.activities,
        category: sessionData.category,
        sessionName: sessionData.name,
        assignedBy: coachId,
        assignedAt: sessionData.assignedAt,
      }),
      source: 'coach_assigned',
    };

    const { error: insertError } = await supabaseAdmin
      .from('training_activities')
      .insert(insertData);

    if (insertError) {
      console.error('Error inserting lifestyle session:', insertError);
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving workout:', error);
    return NextResponse.json({ 
      error: 'Failed to save workout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
