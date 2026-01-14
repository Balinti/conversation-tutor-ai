import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { transcribeAudio, scoreResponse, hasOpenAIKey } from '@/lib/ai';
import { generateFallbackScores, generateFallbackFeedback } from '@/lib/local-storage';
import type { CompleteSimulationRequest, TranscriptSegment } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CompleteSimulationRequest;
    const { sessionId, audio, duration_sec, responses = [] } = body;

    if (!sessionId || !audio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceRoleClient();

    // Get the session
    const { data: session, error: sessionError } = await serviceClient
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Update status to processing
    await serviceClient
      .from('sessions')
      .update({ status: 'processing' })
      .eq('id', sessionId);

    // Transcribe main audio
    let mainTranscript: string;
    if (hasOpenAIKey()) {
      mainTranscript = await transcribeAudio(audio);
    } else {
      mainTranscript = '[Transcript unavailable - AI service not configured. Your audio has been recorded.]';
    }

    // Build transcript array
    const transcript: TranscriptSegment[] = [
      {
        speaker: 'user',
        text: mainTranscript,
        timestamp: 0,
        duration: duration_sec,
      },
    ];

    // Transcribe follow-up responses
    const followupTranscripts: string[] = [];
    for (const response of responses) {
      if (hasOpenAIKey()) {
        const text = await transcribeAudio(response.transcript);
        followupTranscripts.push(text);

        // Find the matching followup question
        const followup = session.followup_questions?.find(
          (f: { id: string }) => f.id === response.questionId
        );

        if (followup) {
          transcript.push({
            speaker: 'ai',
            text: followup.question,
            timestamp: transcript.length * 15,
          });
          transcript.push({
            speaker: 'user',
            text,
            timestamp: transcript.length * 15,
          });
        }
      }
    }

    // Score the response
    let scores;
    let feedback;

    if (hasOpenAIKey()) {
      const result = await scoreResponse(
        mainTranscript,
        session.scenario_type,
        followupTranscripts
      );
      scores = result.scores;
      feedback = result.feedback;
    } else {
      // Use fallback
      scores = generateFallbackScores();
      feedback = generateFallbackFeedback(session.scenario_type);
    }

    // Update usage
    const weekStart = getWeekStart();

    if (session.user_id) {
      // Check if usage record exists
      const { data: existingUsage } = await serviceClient
        .from('usage_limits')
        .select('simulations_used')
        .eq('user_id', session.user_id)
        .eq('week_start', weekStart)
        .single();

      if (existingUsage) {
        await serviceClient
          .from('usage_limits')
          .update({
            simulations_used: existingUsage.simulations_used + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user_id)
          .eq('week_start', weekStart);
      } else {
        await serviceClient
          .from('usage_limits')
          .insert({
            user_id: session.user_id,
            week_start: weekStart,
            simulations_used: 1,
          });
      }
    } else if (session.anon_id) {
      // Check if exists
      const { data: existing } = await serviceClient
        .from('usage_limits')
        .select('simulations_used')
        .eq('anon_id', session.anon_id)
        .eq('week_start', weekStart)
        .single();

      if (existing) {
        await serviceClient
          .from('usage_limits')
          .update({
            simulations_used: existing.simulations_used + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('anon_id', session.anon_id)
          .eq('week_start', weekStart);
      } else {
        await serviceClient
          .from('usage_limits')
          .insert({
            anon_id: session.anon_id,
            week_start: weekStart,
            simulations_used: 1,
          });
      }
    }

    // Update session with results
    const { error: updateError } = await serviceClient
      .from('sessions')
      .update({
        status: 'completed',
        duration_sec,
        transcript,
        scores,
        detailed_feedback: feedback,
        user_responses: responses.map((r, i) => ({
          questionId: r.questionId,
          transcript: followupTranscripts[i] || r.transcript,
        })),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to update session:', updateError);
      return NextResponse.json(
        { error: 'Failed to save results' },
        { status: 500 }
      );
    }

    // Return the updated session
    const { data: updatedSession } = await serviceClient
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Complete simulation error:', error);
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
