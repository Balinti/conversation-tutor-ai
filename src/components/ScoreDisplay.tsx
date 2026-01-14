'use client';

import type { Scores } from '@/types';

interface ScoreDisplayProps {
  scores: Scores;
  showDetails?: boolean;
}

export function ScoreDisplay({ scores, showDetails = true }: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600';
    if (score >= 60) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="text-center">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">
          Overall Score
        </div>
        <div
          className={`text-6xl font-bold bg-gradient-to-r ${getScoreGradient(
            scores.overall
          )} bg-clip-text text-transparent`}
        >
          {scores.overall}
        </div>
        <div className="text-gray-400 text-sm">out of 100</div>
      </div>

      {/* Individual scores */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-4">
          <ScoreItem
            label="Clarity"
            score={scores.clarity}
            description="How clear and understandable"
          />
          <ScoreItem
            label="Structure"
            score={scores.structure}
            description="How well-organized"
          />
          <ScoreItem
            label="Tone"
            score={scores.tone}
            description="Professional appropriateness"
          />
        </div>
      )}
    </div>
  );
}

interface ScoreItemProps {
  label: string;
  score: number;
  description: string;
}

function ScoreItem({ label, score, description }: ScoreItemProps) {
  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{score}</div>
      <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getBarColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-2">{description}</div>
    </div>
  );
}

export function ScoresSummaryCompact({ scores }: { scores: Scores }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-2xl font-bold text-gray-900">{scores.overall}</div>
      <div className="flex gap-2 text-sm">
        <span className="text-gray-500">C: {scores.clarity}</span>
        <span className="text-gray-500">S: {scores.structure}</span>
        <span className="text-gray-500">T: {scores.tone}</span>
      </div>
    </div>
  );
}
