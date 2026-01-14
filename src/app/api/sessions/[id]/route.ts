import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = await createServiceRoleClient();

    // Get the session
    const { data: session, error } = await serviceClient
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user_id) {
      // Session belongs to a user - require matching user
      if (!user || user.id !== session.user_id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else if (session.anon_id) {
      // Anonymous session - allow access (anon_id is checked client-side)
      // In production, you might want to verify the anon_id from the request
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
