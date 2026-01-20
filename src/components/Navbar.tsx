'use client';

import Link from 'next/link';
import { GoogleAuthButton, useGoogleAuth } from '@/components/GoogleAuth';
import { useSubscription } from '@/hooks/useSubscription';

export function Navbar() {
  const { user, loading: authLoading } = useGoogleAuth();
  const { isPro, loading: subLoading } = useSubscription();

  const loading = authLoading || subLoading;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="font-semibold text-gray-900">ConversationTutor</span>
            </Link>
            <div className="hidden md:flex ml-10 gap-6">
              <Link
                href="/app"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Practice
              </Link>
              <Link
                href="/history"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                History
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <>
                {isPro && (
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    PRO
                  </span>
                )}
                <Link
                  href="/account"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Account
                </Link>
                <GoogleAuthButton />
              </>
            ) : (
              <GoogleAuthButton />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
