'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AuthPromptProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function AuthPrompt({ onDismiss, showDismiss = true }: AuthPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 rounded-full p-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Save your progress</h3>
            <p className="text-blue-100 text-sm mt-1">
              Create a free account to save your sessions, track improvement over time,
              and access your history from any device.
            </p>
          </div>
        </div>
        {showDismiss && (
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="mt-4 flex gap-3">
        <Link
          href="/signup"
          className="bg-white text-blue-600 font-medium py-2 px-6 rounded-full hover:bg-blue-50 transition-colors"
        >
          Create free account
        </Link>
        <Link
          href="/login"
          className="text-white border border-white/30 font-medium py-2 px-6 rounded-full hover:bg-white/10 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function SoftAuthPrompt() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">💾</span>
        <span className="text-gray-700">
          <Link href="/signup" className="text-blue-600 hover:underline font-medium">
            Create a free account
          </Link>{' '}
          to save your progress
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-gray-400 hover:text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
