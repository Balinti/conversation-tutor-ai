import { NextRequest, NextResponse } from 'next/server';
import { generateFollowups, hasOpenAIKey } from '@/lib/ai';
import type { ScenarioType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { transcript, scenario_type } = await request.json();

    if (!transcript || !scenario_type) {
      return NextResponse.json(
        { error: 'Transcript and scenario type required' },
        { status: 400 }
      );
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json({
        questions: [],
        fallback: true,
      });
    }

    const questions = await generateFollowups(
      transcript,
      scenario_type as ScenarioType
    );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Followups error:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-ups' },
      { status: 500 }
    );
  }
}
