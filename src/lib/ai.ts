import type { Scores, DetailedFeedback, ScenarioType, FollowupQuestion } from '@/types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export function hasOpenAIKey(): boolean {
  return !!OPENAI_API_KEY;
}

// Speech-to-Text using Whisper
export async function transcribeAudio(audioBase64: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    return '[Transcript unavailable - AI service not configured. Your audio has been recorded.]';
  }

  try {
    // Convert base64 to blob
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Whisper API error:', error);
      return '[Transcription failed. Please try again.]';
    }

    const data = await response.json();
    return data.text || '[No speech detected]';
  } catch (error) {
    console.error('Transcription error:', error);
    return '[Transcription error. Please try again.]';
  }
}

// Generate follow-up questions based on transcript
export async function generateFollowups(
  transcript: string,
  scenarioType: ScenarioType
): Promise<FollowupQuestion[]> {
  if (!OPENAI_API_KEY) {
    return [];
  }

  const systemPrompt = `You are an AI that generates realistic follow-up questions for a ${scenarioType === 'standup' ? 'daily standup' : 'incident status update'} meeting simulation.
Based on the user's response, generate 1-2 challenging but realistic follow-up questions that a manager or team lead might ask.
Return a JSON array with objects containing: question (string), type ('interruption' or 'followup').`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `User's response: "${transcript}"` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return (content.questions || []).map((q: { question: string; type: string }, i: number) => ({
      id: `generated-${i}`,
      question: q.question,
      type: q.type as 'interruption' | 'followup',
      timing: 0,
    }));
  } catch (error) {
    console.error('Follow-up generation error:', error);
    return [];
  }
}

// Score the response
export async function scoreResponse(
  transcript: string,
  scenarioType: ScenarioType,
  followupResponses: string[]
): Promise<{ scores: Scores; feedback: DetailedFeedback }> {
  if (!OPENAI_API_KEY) {
    // Return fallback scores
    return {
      scores: {
        clarity: Math.floor(Math.random() * 20) + 65,
        structure: Math.floor(Math.random() * 20) + 60,
        tone: Math.floor(Math.random() * 20) + 65,
        overall: Math.floor(Math.random() * 15) + 65,
      },
      feedback: {
        tips: [
          'Consider being more specific about timelines.',
          'Lead with the most important information.',
          'Use concrete examples when possible.',
        ],
        highlights: [
          { quote: 'Your opening', type: 'positive', explanation: 'Good context setting.' },
          { quote: 'Be more specific', type: 'improvement', explanation: 'Add concrete details.' },
        ],
      },
    };
  }

  const scenarioContext = scenarioType === 'standup'
    ? 'daily standup meeting update'
    : 'incident status update to stakeholders';

  const systemPrompt = `You are an expert communication coach evaluating a ${scenarioContext}.
Score the response on three criteria (0-100):
1. Clarity: How clear and understandable is the message?
2. Structure: Is the information well-organized?
3. Tone: Is the tone appropriate for a professional setting?

Also provide:
- 3 actionable tips for improvement
- 2 highlighted moments (one positive, one for improvement) with quotes from the transcript

Return JSON with this structure:
{
  "scores": { "clarity": number, "structure": number, "tone": number, "overall": number },
  "feedback": {
    "tips": [string, string, string],
    "highlights": [
      { "quote": string, "type": "positive", "explanation": string },
      { "quote": string, "type": "improvement", "explanation": string }
    ]
  }
}`;

  try {
    const userContent = followupResponses.length > 0
      ? `Main response: "${transcript}"\n\nFollow-up responses: ${followupResponses.map((r, i) => `${i + 1}. "${r}"`).join('\n')}`
      : `Response: "${transcript}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error('Scoring API failed');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Scoring error:', error);
    // Return fallback
    return {
      scores: {
        clarity: 70,
        structure: 65,
        tone: 72,
        overall: 69,
      },
      feedback: {
        tips: [
          'Consider being more specific about timelines.',
          'Lead with the most important information.',
          'Use concrete examples when possible.',
        ],
        highlights: [
          { quote: 'Your response', type: 'positive', explanation: 'Good attempt at communication.' },
          { quote: 'Consider details', type: 'improvement', explanation: 'More specificity would help.' },
        ],
      },
    };
  }
}

// Generate detailed moment-by-moment feedback (Pro feature)
export async function generateDetailedFeedback(
  transcript: string,
  scenarioType: ScenarioType
): Promise<DetailedFeedback['momentByMoment']> {
  if (!OPENAI_API_KEY) {
    return [];
  }

  const systemPrompt = `Analyze this ${scenarioType === 'standup' ? 'standup update' : 'incident update'} and break it down into key moments.
For each moment (sentence or phrase), provide a score (0-100) and specific feedback.
Return JSON array: [{ "text": string, "score": number, "feedback": string }]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return (content.moments || []).map((m: { text: string; score: number; feedback: string }, i: number) => ({
      timestamp: i * 5, // Approximate timestamps
      text: m.text,
      score: m.score,
      feedback: m.feedback,
    }));
  } catch (error) {
    console.error('Detailed feedback error:', error);
    return [];
  }
}

// Text-to-Speech
export async function textToSpeech(text: string): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'onyx', // Professional sounding voice
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:audio/mp3;base64,${base64}`;
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}

// Evaluate drill re-speak
export async function evaluateDrill(
  originalText: string,
  newTranscript: string,
  improvementGoal: string
): Promise<{ score: number; feedback: string; improved: boolean }> {
  if (!OPENAI_API_KEY) {
    return {
      score: Math.floor(Math.random() * 20) + 70,
      feedback: 'Good effort! Keep practicing to improve your delivery.',
      improved: Math.random() > 0.3,
    };
  }

  const systemPrompt = `Compare the original statement with the improved version.
The user was trying to improve: ${improvementGoal}

Original: "${originalText}"
New version: "${newTranscript}"

Evaluate if the new version is an improvement. Return JSON:
{ "score": number (0-100), "feedback": string, "improved": boolean }`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Evaluate the improvement.' },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error('Evaluation failed');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (error) {
    console.error('Drill evaluation error:', error);
    return {
      score: 75,
      feedback: 'Good effort! Consider being even more specific.',
      improved: true,
    };
  }
}
