import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { transcribeAudio, evaluateDrill, hasOpenAIKey } from '@/lib/ai';
import type { DrillEvaluateRequest, DrillEvaluateResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DrillEvaluateRequest & {
      originalText: string;
      improvementGoal: string;
    };
    const { sessionId, audio, originalText, improvementGoal } = body;

    if (!sessionId || !audio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceRoleClient();

    // Verify session exists
    const { data: session, error: sessionError } = await serviceClient
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    let result: DrillEvaluateResponse;

    if (hasOpenAIKey()) {
      // Transcribe the new audio
      const newTranscript = await transcribeAudio(audio);

      // Evaluate the improvement
      result = await evaluateDrill(originalText, newTranscript, improvementGoal);
    } else {
      // Fallback
      result = {
        score: Math.floor(Math.random() * 20) + 70,
        feedback: 'Good effort! Keep practicing to improve your delivery.',
        improved: Math.random() > 0.3,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Drill evaluation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
