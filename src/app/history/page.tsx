'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { SessionHistory } from '@/components/SessionHistory';
import { SoftAuthPrompt } from '@/components/AuthPrompt';
import { getSessions, getRecentSessions } from '@/lib/local-storage';
import { createClient } from '@/lib/supabase/client';
import type { Session, LocalSession } from '@/types';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { isPro } = useSubscription();
  const [sessions, setSessions] = useState<(Session | LocalSession)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);

      if (user) {
        // Fetch from Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(isPro ? 100 : 10);

        if (!error && data) {
          setSessions(data);
        }
      } else {
        // Use localStorage
        const localSessions = isPro ? getSessions() : getRecentSessions(3);
        setSessions(localSessions);
      }

      setLoading(false);
    };

    if (!authLoading) {
      fetchSessions();
    }
  }, [user, authLoading, isPro]);

  if (loading || authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
        <p className="text-gray-600 mt-1">
          {user
            ? 'View and track your practice sessions.'
            : 'Your recent practice sessions (stored locally).'}
        </p>
      </div>

      {!user && (
        <div className="mb-6">
          <SoftAuthPrompt />
        </div>
      )}

      <SessionHistory
        sessions={sessions}
        maxVisible={isPro ? sessions.length : 3}
        showUpgradePrompt={!isPro && sessions.length > 3}
      />

      {!isPro && sessions.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          Free users can view their last 3 sessions.
        </div>
      )}
    </div>
  );
}
