import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, hasOpenAIKey } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { audio } = await request.json();

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data required' },
        { status: 400 }
      );
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json({
        text: '[Transcript unavailable - AI service not configured]',
        fallback: true,
      });
    }

    const text = await transcribeAudio(audio);
    return NextResponse.json({ text });
  } catch (error) {
    console.error('STT error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    );
  }
}
