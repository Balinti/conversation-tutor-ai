'use client';

import Link from 'next/link';
import type { LocalSession, Session } from '@/types';
import { getScenarioDisplayName } from '@/lib/scenarios';
import { ScoresSummaryCompact } from './ScoreDisplay';

interface SessionHistoryProps {
  sessions: (LocalSession | Session)[];
  maxVisible?: number;
  showUpgradePrompt?: boolean;
}

export function SessionHistory({
  sessions,
  maxVisible = 3,
  showUpgradePrompt = false,
}: SessionHistoryProps) {
  const visibleSessions = sessions.slice(0, maxVisible);
  const hasMore = sessions.length > maxVisible;

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <span className="text-4xl">📝</span>
        <h3 className="text-gray-900 font-medium mt-4">No sessions yet</h3>
        <p className="text-gray-500 text-sm mt-1">
          Complete a simulation to see your history here.
        </p>
        <Link
          href="/app"
          className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Start practicing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleSessions.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}

      {hasMore && showUpgradePrompt && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100 text-center">
          <p className="text-gray-700">
            <strong>Pro users</strong> can access unlimited session history.
          </p>
          <Link
            href="/pricing"
            className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Upgrade to Pro →
          </Link>
        </div>
      )}
    </div>
  );
}

interface SessionCardProps {
  session: LocalSession | Session;
}

function SessionCard({ session }: SessionCardProps) {
  const date = new Date(session.created_at);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      href={`/results/${session.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {session.scenario_type === 'standup' ? '📊' : '🚨'}
            </span>
            <span className="font-medium text-gray-900">
              {getScenarioDisplayName(session.scenario_type)}
            </span>
            <StatusBadge status={session.status} />
          </div>
          <div className="text-sm text-gray-500 mt-1">{formattedDate}</div>
        </div>
        {session.status === 'completed' && session.scores && (
          <ScoresSummaryCompact scores={session.scores} />
        )}
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return null;

  const colors: Record<string, string> = {
    started: 'bg-yellow-100 text-yellow-700',
    recording: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}
