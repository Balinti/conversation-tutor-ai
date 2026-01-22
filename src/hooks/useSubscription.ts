'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';
import type { Subscription } from '@/types';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isPro: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setSubscription(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const isPro = subscription?.status === 'active';

  return {
    subscription,
    isPro,
    loading,
    refetch: fetchSubscription,
  };
}
