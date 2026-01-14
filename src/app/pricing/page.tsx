'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { getPriceIds, hasStripeConfig } from '@/lib/stripe';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPro, subscription } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const priceIds = getPriceIds();
  const stripeConfigured = hasStripeConfig();
  const hasPrices = priceIds.monthly || priceIds.annual;

  const handleSubscribe = async (priceId: string, interval: 'monthly' | 'annual') => {
    if (!user) {
      router.push('/signup?redirect=/pricing');
      return;
    }

    setLoading(interval);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading('manage');
    setError(null);

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h1>
        <p className="text-gray-600 mt-2">
          Start free, upgrade when you're ready to level up.
        </p>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free tier */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Free</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-500">/forever</span>
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            <PricingFeature included>3 simulations per week</PricingFeature>
            <PricingFeature included>Daily standup & incident scenarios</PricingFeature>
            <PricingFeature included>Overall scores (Clarity, Structure, Tone)</PricingFeature>
            <PricingFeature included>3 actionable tips per session</PricingFeature>
            <PricingFeature included>1 re-speak drill per session</PricingFeature>
            <PricingFeature included={false}>Detailed moment-by-moment feedback</PricingFeature>
            <PricingFeature included={false}>Meeting Mode rehearsal</PricingFeature>
            <PricingFeature included={false}>Unlimited history</PricingFeature>
          </ul>

          <div className="mt-8">
            {!user ? (
              <a
                href="/app"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 rounded-full transition-colors"
              >
                Get started free
              </a>
            ) : !isPro ? (
              <div className="text-center text-green-600 font-medium py-3">
                ✓ Current plan
              </div>
            ) : null}
          </div>
        </div>

        {/* Pro tier */}
        <div className="bg-gradient-to-b from-blue-600 to-purple-600 rounded-2xl p-8 shadow-lg text-white relative">
          <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
            POPULAR
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold">Pro</h2>
            <div className="mt-4">
              <span className="text-4xl font-bold">$19</span>
              <span className="text-blue-200">/month</span>
            </div>
            {priceIds.annual && (
              <div className="text-sm text-blue-200 mt-1">
                or $149/year (save 35%)
              </div>
            )}
          </div>

          <ul className="mt-8 space-y-4">
            <PricingFeature included light>Unlimited simulations</PricingFeature>
            <PricingFeature included light>All scenarios + Meeting Mode</PricingFeature>
            <PricingFeature included light>Detailed moment-by-moment feedback</PricingFeature>
            <PricingFeature included light>Highlighted quotes with timestamps</PricingFeature>
            <PricingFeature included light>Unlimited re-speak drills</PricingFeature>
            <PricingFeature included light>Meeting rehearsal planner</PricingFeature>
            <PricingFeature included light>Unlimited history & progress tracking</PricingFeature>
            <PricingFeature included light>Cloud backup of recordings</PricingFeature>
          </ul>

          <div className="mt-8 space-y-3">
            {isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={loading === 'manage'}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-full transition-colors disabled:opacity-50"
              >
                {loading === 'manage' ? 'Loading...' : 'Manage subscription'}
              </button>
            ) : stripeConfigured && hasPrices ? (
              <>
                {priceIds.monthly && (
                  <button
                    onClick={() => handleSubscribe(priceIds.monthly!, 'monthly')}
                    disabled={loading === 'monthly'}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading === 'monthly' ? 'Loading...' : 'Subscribe monthly'}
                  </button>
                )}
                {priceIds.annual && (
                  <button
                    onClick={() => handleSubscribe(priceIds.annual!, 'annual')}
                    disabled={loading === 'annual'}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-full transition-colors disabled:opacity-50"
                  >
                    {loading === 'annual' ? 'Loading...' : 'Subscribe annually (save 35%)'}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center text-blue-200 py-3 text-sm">
                Subscriptions coming soon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          <FAQItem question="Can I try before I buy?">
            Yes! You get 3 free simulations per week, forever. No credit card required.
            Experience the full flow including scoring and feedback.
          </FAQItem>
          <FAQItem question="What is Meeting Mode?">
            Meeting Mode lets you prepare for a specific upcoming meeting. You select the
            type and duration, and the app generates a 10-minute rehearsal plan with
            pressure questions and a readiness rating.
          </FAQItem>
          <FAQItem question="Can I cancel anytime?">
            Yes, you can cancel your Pro subscription at any time. You'll retain access
            until the end of your billing period.
          </FAQItem>
          <FAQItem question="Is my audio data private?">
            Yes. For free users, audio is stored locally on your device. Pro users have
            encrypted cloud storage with private access via signed URLs.
          </FAQItem>
        </div>
      </div>
    </div>
  );
}

function PricingFeature({
  children,
  included,
  light = false,
}: {
  children: React.ReactNode;
  included: boolean;
  light?: boolean;
}) {
  return (
    <li className="flex items-center gap-3">
      {included ? (
        <svg
          className={`w-5 h-5 flex-shrink-0 ${light ? 'text-green-300' : 'text-green-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 flex-shrink-0 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className={included ? '' : 'text-gray-400'}>{children}</span>
    </li>
  );
}

function FAQItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg p-5 border border-gray-200">
      <h3 className="font-medium text-gray-900">{question}</h3>
      <p className="text-gray-600 text-sm mt-2">{children}</p>
    </div>
  );
}
