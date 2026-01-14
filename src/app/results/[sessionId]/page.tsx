'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { AuthPrompt } from '@/components/AuthPrompt';
import { RecordingControls } from '@/components/RecordingControls';
import { blobToBase64 } from '@/hooks/useAudioRecorder';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { getSession, saveSession } from '@/lib/local-storage';
import { getScenarioDisplayName } from '@/lib/scenarios';
import type { Session, LocalSession } from '@/types';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const { isPro } = useSubscription();

  const [session, setSession] = useState<Session | LocalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDrill, setShowDrill] = useState(false);
  const [drillHighlightIndex, setDrillHighlightIndex] = useState<number | null>(null);
  const [drillResult, setDrillResult] = useState<{ score: number; feedback: string; improved: boolean } | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);

      // First, try localStorage
      const localSession = getSession(sessionId);
      if (localSession) {
        setSession(localSession);
        setLoading(false);

        // Show auth prompt after completed session for anonymous users
        if (!user && localSession.status === 'completed') {
          setTimeout(() => setShowAuthPrompt(true), 2000);
        }
        return;
      }

      // Try API
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const data = await response.json();
        setSession(data.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, user]);

  const handleDrillComplete = async (blob: Blob) => {
    if (drillHighlightIndex === null || !session) return;

    const audio = await blobToBase64(blob);
    const highlight = session.detailed_feedback.highlights[drillHighlightIndex];

    try {
      const response = await fetch('/api/drills/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          highlightId: drillHighlightIndex.toString(),
          audio,
          originalText: highlight.quote,
          improvementGoal: highlight.explanation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate drill');
      }

      const result = await response.json();
      setDrillResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <span className="text-4xl">😕</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Session not found</h1>
        <p className="text-gray-600 mt-2">{error || 'This session may have expired.'}</p>
        <Link
          href="/app"
          className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full"
        >
          Start new simulation
        </Link>
      </div>
    );
  }

  if (session.status !== 'completed') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <span className="text-4xl">⏳</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-4">Session in progress</h1>
        <p className="text-gray-600 mt-2">
          This session is still being processed. Please wait or try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <span className="inline-block bg-green-100 text-green-700 text-sm font-medium px-4 py-1 rounded-full mb-4">
          Simulation Complete
        </span>
        <h1 className="text-2xl font-bold text-gray-900">
          {getScenarioDisplayName(session.scenario_type)} Results
        </h1>
        <p className="text-gray-600 mt-1">
          {new Date(session.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Auth prompt for anonymous users */}
      {showAuthPrompt && !user && (
        <div className="mb-8">
          <AuthPrompt onDismiss={() => setShowAuthPrompt(false)} />
        </div>
      )}

      {/* Scores */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <ScoreDisplay scores={session.scores} showDetails={true} />
      </div>

      {/* Transcript */}
      {session.transcript && session.transcript.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Your Response</h2>
          <div className="space-y-3">
            {session.transcript.map((segment, index) => (
              <div key={index} className="text-gray-700">
                {segment.speaker === 'user' ? (
                  <p className="bg-gray-50 p-3 rounded-lg">{segment.text}</p>
                ) : (
                  <p className="text-blue-700 italic">AI: {segment.text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <FeedbackDisplay feedback={session.detailed_feedback} isPro={isPro} />
      </div>

      {/* Drill section */}
      {!showDrill && session.detailed_feedback.highlights.some((h) => h.type === 'improvement') && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Practice a micro-skill</h3>
          <p className="text-gray-600 text-sm mb-4">
            Re-speak one of your responses with the suggested improvement.
          </p>
          <button
            onClick={() => {
              const improvementIndex = session.detailed_feedback.highlights.findIndex(
                (h) => h.type === 'improvement'
              );
              setDrillHighlightIndex(improvementIndex);
              setShowDrill(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
          >
            Start drill
          </button>
        </div>
      )}

      {/* Drill in progress */}
      {showDrill && drillHighlightIndex !== null && !drillResult && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Re-speak Drill</h3>
          <div className="bg-amber-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700 font-medium">Original:</p>
            <p className="text-gray-800 italic mt-1">
              "{session.detailed_feedback.highlights[drillHighlightIndex].quote}"
            </p>
            <p className="text-amber-700 text-sm mt-2">
              Improvement: {session.detailed_feedback.highlights[drillHighlightIndex].explanation}
            </p>
          </div>
          <RecordingControls maxDuration={30} onComplete={handleDrillComplete} />
          <button
            onClick={() => setShowDrill(false)}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel drill
          </button>
        </div>
      )}

      {/* Drill result */}
      {drillResult && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Drill Result</h3>
          <div className={`rounded-lg p-4 ${drillResult.improved ? 'bg-green-50' : 'bg-amber-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{drillResult.improved ? '✅' : '💪'}</span>
              <span className="font-medium text-gray-900">
                {drillResult.improved ? 'Improved!' : 'Keep practicing'}
              </span>
              <span className="ml-auto font-bold text-lg">{drillResult.score}/100</span>
            </div>
            <p className="text-gray-700">{drillResult.feedback}</p>
          </div>
          <button
            onClick={() => {
              setDrillResult(null);
              setShowDrill(false);
            }}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Done
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/app"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full text-center transition-colors"
        >
          Practice again
        </Link>
        <Link
          href="/history"
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-8 rounded-full border border-gray-300 text-center transition-colors"
        >
          View history
        </Link>
      </div>
    </div>
  );
}
