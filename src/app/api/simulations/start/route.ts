import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { generateScenarioSeed } from '@/lib/scenarios';
import type { StartSimulationRequest, StartSimulationResponse } from '@/types';

const FREE_LIMIT = 3;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StartSimulationRequest;
    const { scenario_type, anon_id } = body;

    if (!scenario_type || !['standup', 'incident'].includes(scenario_type)) {
      return NextResponse.json(
        { error: 'Invalid scenario type' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get service role client for writing
    const serviceClient = await createServiceRoleClient();

    // Check usage limits
    const weekStart = getWeekStart();
    let usage = { used: 0, limit: FREE_LIMIT };

    if (user) {
      // Check user's subscription
      const { data: subscription } = await serviceClient
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .single();

      const isPro = subscription?.status === 'active';

      if (!isPro) {
        // Check usage
        const { data: usageData } = await serviceClient
          .from('usage_limits')
          .select('simulations_used')
          .eq('user_id', user.id)
          .eq('week_start', weekStart)
          .single();

        const currentUsage = usageData?.simulations_used || 0;

        if (currentUsage >= FREE_LIMIT) {
          return NextResponse.json(
            { error: 'Weekly limit reached. Upgrade to Pro for unlimited.' },
            { status: 429 }
          );
        }

        usage.used = currentUsage;
      } else {
        usage.limit = Infinity;
      }
    } else if (anon_id) {
      // Check anonymous usage
      const { data: usageData } = await serviceClient
        .from('usage_limits')
        .select('simulations_used')
        .eq('anon_id', anon_id)
        .eq('week_start', weekStart)
        .single();

      const currentUsage = usageData?.simulations_used || 0;

      if (currentUsage >= FREE_LIMIT) {
        return NextResponse.json(
          { error: 'Weekly limit reached. Sign up for more.' },
          { status: 429 }
        );
      }

      usage.used = currentUsage;
    }

    // Generate scenario
    const seed = generateScenarioSeed(scenario_type);
    const sessionId = uuidv4();

    // Create session in database
    const { error: insertError } = await serviceClient
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: user?.id || null,
        anon_id: user ? null : anon_id,
        scenario_type,
        status: 'started',
        followup_questions: seed.followups,
      });

    if (insertError) {
      console.error('Failed to create session:', insertError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    const response: StartSimulationResponse = {
      sessionId,
      seed,
      usage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Start simulation error:', error);
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
