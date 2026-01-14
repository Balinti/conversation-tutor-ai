'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScenarioCard } from '@/components/ScenarioCard';
import { RecordingControls } from '@/components/RecordingControls';
import { blobToBase64 } from '@/hooks/useAudioRecorder';
import {
  getAnonId,
  canStartSimulation,
  getUsageCount,
  saveOnboarding,
  getOnboarding,
  FREE_SIMULATIONS_LIMIT,
} from '@/lib/local-storage';
import type { ScenarioType, ScenarioSeed, FollowupQuestion } from '@/types';

type Step = 'scenario' | 'onboarding' | 'context' | 'recording' | 'followup' | 'processing';

export default function SimulatorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('scenario');
  const [scenarioType, setScenarioType] = useState<ScenarioType | null>(null);
  const [role, setRole] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seed, setSeed] = useState<ScenarioSeed | null>(null);
  const [currentFollowupIndex, setCurrentFollowupIndex] = useState(0);
  const [userResponses, setUserResponses] = useState<{ questionId: string; transcript: string }[]>([]);
  const [mainAudio, setMainAudio] = useState<string | null>(null);
  const [mainDuration, setMainDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const usage = typeof window !== 'undefined' ? getUsageCount() : 0;
  const canStart = typeof window !== 'undefined' ? canStartSimulation() : true;
  const onboarding = typeof window !== 'undefined' ? getOnboarding() : { completed: false };

  useEffect(() => {
    if (onboarding.completed && onboarding.role) {
      setRole(onboarding.role);
      setGoals(onboarding.goals || []);
    }
  }, [onboarding.completed, onboarding.role, onboarding.goals]);

  const startSimulation = async () => {
    if (!scenarioType) return;
    setLoading(true);
    setError(null);

    try {
      const anonId = getAnonId();
      const response = await fetch('/api/simulations/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_type: scenarioType,
          anon_id: anonId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start simulation');
      }

      const data = await response.json();
      setSessionId(data.sessionId);
      setSeed(data.seed);
      setStep('context');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMainRecordingComplete = async (blob: Blob, duration: number) => {
    const base64 = await blobToBase64(blob);
    setMainAudio(base64);
    setMainDuration(duration);

    // Check if there are followup questions
    if (seed && seed.followups.length > 0) {
      setStep('followup');
    } else {
      await submitSimulation(base64, duration, []);
    }
  };

  const handleFollowupResponse = async (blob: Blob) => {
    const base64 = await blobToBase64(blob);
    const currentFollowup = seed!.followups[currentFollowupIndex];

    const newResponses = [
      ...userResponses,
      { questionId: currentFollowup.id, transcript: base64 }, // Will be transcribed server-side
    ];
    setUserResponses(newResponses);

    if (currentFollowupIndex < seed!.followups.length - 1) {
      setCurrentFollowupIndex(currentFollowupIndex + 1);
    } else {
      // All followups done, submit
      await submitSimulation(mainAudio!, mainDuration, newResponses);
    }
  };

  const submitSimulation = async (
    audio: string,
    duration: number,
    responses: { questionId: string; transcript: string }[]
  ) => {
    setStep('processing');
    setLoading(true);

    try {
      const response = await fetch('/api/simulations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          audio,
          duration_sec: duration,
          responses,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete simulation');
      }

      router.push(`/results/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('recording');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = () => {
    if (role) {
      saveOnboarding(role, goals);
    }
    startSimulation();
  };

  const handleScenarioSelect = (type: ScenarioType) => {
    setScenarioType(type);
  };

  const handleStartClick = () => {
    if (!scenarioType) return;

    if (onboarding.completed) {
      startSimulation();
    } else {
      setStep('onboarding');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Usage indicator */}
      <div className="text-center mb-8">
        <span className="text-sm text-gray-500">
          {usage} of {FREE_SIMULATIONS_LIMIT} free simulations used this week
        </span>
        {!canStart && (
          <div className="mt-2 text-amber-600 text-sm">
            Weekly limit reached.{' '}
            <a href="/pricing" className="underline">
              Upgrade for unlimited
            </a>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Step: Scenario Selection */}
      {step === 'scenario' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Choose your scenario</h1>
            <p className="text-gray-600 mt-2">
              Select the type of meeting situation you want to practice.
            </p>
          </div>

          <div className="space-y-4">
            <ScenarioCard
              type="standup"
              selected={scenarioType === 'standup'}
              onSelect={handleScenarioSelect}
              disabled={!canStart}
            />
            <ScenarioCard
              type="incident"
              selected={scenarioType === 'incident'}
              onSelect={handleScenarioSelect}
              disabled={!canStart}
            />
          </div>

          <div className="text-center">
            <button
              onClick={handleStartClick}
              disabled={!scenarioType || !canStart || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-full transition-colors"
            >
              {loading ? 'Starting...' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Onboarding (first time only) */}
      {step === 'onboarding' && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Quick setup</h1>
            <p className="text-gray-600 mt-2">
              Help us personalize your experience (optional).
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your role (optional)
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Frontend Developer, DevOps Engineer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to improve? (optional)
              </label>
              <div className="space-y-2">
                {['Speaking clearly', 'Handling interruptions', 'Staying concise', 'Building confidence'].map(
                  (goal) => (
                    <label key={goal} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={goals.includes(goal)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGoals([...goals, goal]);
                          } else {
                            setGoals(goals.filter((g) => g !== goal));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="text-gray-700">{goal}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setStep('scenario')}
              className="text-gray-600 hover:text-gray-800 font-medium py-2 px-6"
            >
              Back
            </button>
            <button
              onClick={handleOnboardingSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-full transition-colors"
            >
              {loading ? 'Starting...' : 'Start Simulation'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Context */}
      {step === 'context' && seed && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {scenarioType === 'standup' ? 'Daily Standup' : 'Incident Status Update'}
            </h1>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-medium text-gray-900 mb-3">Scenario</h2>
            <p className="text-gray-700">{seed.context}</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h2 className="font-medium text-blue-900 mb-3">Your task</h2>
            <p className="text-blue-800">{seed.prompts[0]}</p>
          </div>

          <div className="text-center text-sm text-gray-500">
            You have {Math.floor(seed.timeLimit / 60)}:{(seed.timeLimit % 60).toString().padStart(2, '0')} to respond.
            Expect interruptions and follow-up questions.
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep('recording')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-full transition-colors"
            >
              I'm ready - Start recording
            </button>
          </div>
        </div>
      )}

      {/* Step: Recording */}
      {step === 'recording' && seed && (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Give your update</h1>
            <p className="text-gray-600 mt-2">{seed.prompts[0]}</p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <RecordingControls
              maxDuration={seed.timeLimit}
              onComplete={handleMainRecordingComplete}
            />
          </div>
        </div>
      )}

      {/* Step: Follow-up Questions */}
      {step === 'followup' && seed && seed.followups[currentFollowupIndex] && (
        <div className="space-y-6">
          <div className="text-center">
            <span className="inline-block bg-amber-100 text-amber-700 text-sm font-medium px-4 py-1 rounded-full mb-4">
              {seed.followups[currentFollowupIndex].type === 'interruption' ? 'Interruption!' : 'Follow-up question'}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              {seed.followups[currentFollowupIndex].question}
            </h1>
          </div>

          <div className="text-center text-sm text-gray-500">
            Question {currentFollowupIndex + 1} of {seed.followups.length}
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <RecordingControls
              maxDuration={60}
              onComplete={handleFollowupResponse}
            />
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900">Analyzing your response...</h2>
          <p className="text-gray-600 mt-2">
            Our AI is evaluating your clarity, structure, and tone.
          </p>
        </div>
      )}
    </div>
  );
}
