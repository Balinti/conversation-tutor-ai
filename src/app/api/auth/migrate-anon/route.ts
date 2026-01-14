import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get anon_id from request body or cookie
    let anonId: string | null = null;

    try {
      const body = await request.json();
      anonId = body.anon_id;
    } catch {
      // No body, try to get from other sources
    }

    if (!anonId) {
      // In production, you might store anon_id in a cookie or header
      return NextResponse.json({ migrated: 0 });
    }

    const serviceClient = await createServiceRoleClient();

    // Migrate sessions
    const { data: anonSessions, error: fetchError } = await serviceClient
      .from('sessions')
      .select('id')
      .eq('anon_id', anonId);

    if (fetchError) {
      console.error('Failed to fetch anon sessions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to migrate sessions' },
        { status: 500 }
      );
    }

    if (anonSessions && anonSessions.length > 0) {
      // Update sessions to user_id
      const { error: updateError } = await serviceClient
        .from('sessions')
        .update({
          user_id: user.id,
          anon_id: null,
        })
        .eq('anon_id', anonId);

      if (updateError) {
        console.error('Failed to migrate sessions:', updateError);
        return NextResponse.json(
          { error: 'Failed to migrate sessions' },
          { status: 500 }
        );
      }
    }

    // Migrate usage limits
    const weekStart = getWeekStart();
    const { data: anonUsage } = await serviceClient
      .from('usage_limits')
      .select('simulations_used')
      .eq('anon_id', anonId)
      .eq('week_start', weekStart)
      .single();

    if (anonUsage) {
      // Get user's current usage
      const { data: userUsage } = await serviceClient
        .from('usage_limits')
        .select('simulations_used')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();

      const newUsage = (userUsage?.simulations_used || 0) + anonUsage.simulations_used;

      // Upsert user usage
      await serviceClient
        .from('usage_limits')
        .upsert({
          user_id: user.id,
          week_start: weekStart,
          simulations_used: newUsage,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,week_start',
        });

      // Delete anon usage
      await serviceClient
        .from('usage_limits')
        .delete()
        .eq('anon_id', anonId);
    }

    return NextResponse.json({
      migrated: anonSessions?.length || 0,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}
