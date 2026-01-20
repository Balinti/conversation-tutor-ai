'use client';

import { useState, useEffect, useCallback } from 'react';

// Hardcoded Supabase configuration - DO NOT use environment variables
const SUPABASE_URL = 'https://api.srv936332.hstgr.cloud';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const APP_SLUG = 'conversation-tutor-ai';

let supabaseClient = null;
let supabaseLoaded = false;
let loadPromise = null;

// Load Supabase client dynamically via CDN
function loadSupabase() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (supabaseLoaded && supabaseClient) {
      resolve(supabaseClient);
      return;
    }

    if (typeof window !== 'undefined' && window.supabase) {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseLoaded = true;
      resolve(supabaseClient);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.async = true;
    script.onload = () => {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseLoaded = true;
      resolve(supabaseClient);
    };
    script.onerror = () => {
      console.error('Failed to load Supabase');
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

// Track user login - upsert to user_tracking table
async function trackUserLogin(client, user) {
  if (!client || !user) return;

  try {
    const now = new Date().toISOString();

    // First, try to get existing record
    const { data: existing } = await client
      .from('user_tracking')
      .select('login_cnt')
      .eq('user_id', user.id)
      .eq('app', APP_SLUG)
      .single();

    if (existing) {
      // Update existing record
      await client
        .from('user_tracking')
        .update({
          login_cnt: existing.login_cnt + 1,
          last_login_ts: now,
          email: user.email
        })
        .eq('user_id', user.id)
        .eq('app', APP_SLUG);
    } else {
      // Insert new record
      await client
        .from('user_tracking')
        .insert({
          user_id: user.id,
          email: user.email,
          app: APP_SLUG,
          login_cnt: 1,
          last_login_ts: now
        });
    }
  } catch (error) {
    console.error('Error tracking user login:', error);
  }
}

export function useGoogleAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const supabase = await loadSupabase();
      if (!mounted) return;

      setClient(supabase);

      if (!supabase) {
        setLoading(false);
        return;
      }

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          const currentUser = session?.user ?? null;
          setUser(currentUser);
          setLoading(false);

          // Track login on SIGNED_IN event
          if (event === 'SIGNED_IN' && currentUser) {
            await trackUserLogin(supabase, currentUser);
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!client) {
      const supabase = await loadSupabase();
      if (!supabase) return;

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    } else {
      await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    }
  }, [client]);

  const signOut = useCallback(async () => {
    if (!client) {
      const supabase = await loadSupabase();
      if (!supabase) return;
      await supabase.auth.signOut();
    } else {
      await client.auth.signOut();
    }
  }, [client]);

  return {
    user,
    loading,
    signInWithGoogle,
    signOut
  };
}

export function GoogleAuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useGoogleAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:inline">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Sign in with Google
    </button>
  );
}

export default GoogleAuthButton;
