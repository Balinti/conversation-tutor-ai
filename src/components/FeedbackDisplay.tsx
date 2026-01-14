'use client';

import type { DetailedFeedback, Highlight } from '@/types';

interface FeedbackDisplayProps {
  feedback: DetailedFeedback;
  isPro?: boolean;
}

export function FeedbackDisplay({ feedback, isPro = false }: FeedbackDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Tips */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Tips for Improvement
        </h3>
        <ul className="space-y-2">
          {feedback.tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <span className="text-gray-700">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Highlights */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Key Moments
        </h3>
        <div className="space-y-3">
          {feedback.highlights.map((highlight, index) => (
            <HighlightCard key={index} highlight={highlight} />
          ))}
        </div>
      </div>

      {/* Moment by moment (Pro only) */}
      {isPro && feedback.momentByMoment && feedback.momentByMoment.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Detailed Breakdown
          </h3>
          <div className="space-y-2">
            {feedback.momentByMoment.map((moment, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-3 border-l-4"
                style={{
                  borderLeftColor:
                    moment.score >= 80
                      ? '#22c55e'
                      : moment.score >= 60
                      ? '#eab308'
                      : '#ef4444',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(moment.timestamp)}
                  </span>
                  <span className="text-sm font-medium">{moment.score}/100</span>
                </div>
                <p className="text-gray-800 italic">"{moment.text}"</p>
                <p className="text-sm text-gray-600 mt-1">{moment.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade prompt for non-Pro */}
      {!isPro && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <div className="font-medium text-gray-900">
                Get detailed moment-by-moment analysis
              </div>
              <div className="text-sm text-gray-600">
                Upgrade to Pro for in-depth feedback on every part of your response.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightCard({ highlight }: { highlight: Highlight }) {
  const isPositive = highlight.type === 'positive';

  return (
    <div
      className={`rounded-lg p-4 ${
        isPositive ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      } border`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{isPositive ? '✅' : '💡'}</span>
        <div>
          <p className="text-gray-800 font-medium italic">"{highlight.quote}"</p>
          <p className="text-sm text-gray-600 mt-1">{highlight.explanation}</p>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
