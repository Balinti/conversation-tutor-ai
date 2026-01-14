'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { subscription, isPro, loading: subLoading } = useSubscription();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/account');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setRole(data.role || '');
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        role,
      });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } else {
      setMessage({ type: 'success', text: 'Profile saved!' });
    }
    setSaving(false);
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);

    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to open billing portal');

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to open billing portal' });
      setBillingLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || subLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Subscription status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </span>
              {isPro && (
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              )}
            </div>
            {subscription?.current_period_end && isPro && (
              <p className="text-sm text-gray-500 mt-1">
                Renews on{' '}
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          {isPro ? (
            <button
              onClick={handleManageBilling}
              disabled={billingLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {billingLoading ? 'Loading...' : 'Manage billing'}
            </button>
          ) : (
            <a
              href="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Upgrade to Pro
            </a>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Frontend Developer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Account actions</h2>
        <button
          onClick={handleSignOut}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
