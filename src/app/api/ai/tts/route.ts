import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech, hasOpenAIKey } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text required' },
        { status: 400 }
      );
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json({
        audio: null,
        fallback: true,
      });
    }

    const audioDataUrl = await textToSpeech(text);

    if (!audioDataUrl) {
      return NextResponse.json(
        { error: 'TTS failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ audio: audioDataUrl });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'TTS failed' },
      { status: 500 }
    );
  }
}
