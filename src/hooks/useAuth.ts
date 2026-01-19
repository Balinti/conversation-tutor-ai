'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // If Supabase is not configured, just set loading to false
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    const initAuth = async () => {
      const { data: { session: sess } } = await supabase.auth.getSession();
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    };
    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, sess: Session | null) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) {
      return { error: new Error('Supabase is not configured') };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
