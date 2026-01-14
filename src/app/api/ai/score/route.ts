import { NextRequest, NextResponse } from 'next/server';
import { scoreResponse, hasOpenAIKey } from '@/lib/ai';
import { generateFallbackScores, generateFallbackFeedback } from '@/lib/local-storage';
import type { ScenarioType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { transcript, scenario_type, followup_responses = [] } = await request.json();

    if (!transcript || !scenario_type) {
      return NextResponse.json(
        { error: 'Transcript and scenario type required' },
        { status: 400 }
      );
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json({
        scores: generateFallbackScores(),
        feedback: generateFallbackFeedback(scenario_type as ScenarioType),
        fallback: true,
      });
    }

    const result = await scoreResponse(
      transcript,
      scenario_type as ScenarioType,
      followup_responses
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Score error:', error);
    return NextResponse.json(
      { error: 'Scoring failed' },
      { status: 500 }
    );
  }
}
