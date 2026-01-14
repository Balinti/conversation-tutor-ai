'use client';

import { useAudioRecorder, formatDuration } from '@/hooks/useAudioRecorder';

interface RecordingControlsProps {
  maxDuration?: number;
  onComplete: (audioBlob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function RecordingControls({
  maxDuration = 120,
  onComplete,
  disabled = false,
}: RecordingControlsProps) {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleStart = async () => {
    await startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleSubmit = () => {
    if (audioBlob) {
      onComplete(audioBlob, duration);
    }
  };

  // Auto-stop at max duration
  if (isRecording && duration >= maxDuration) {
    stopRecording();
  }

  const timeRemaining = maxDuration - duration;
  const isNearLimit = timeRemaining <= 15;

  return (
    <div className="space-y-4">
      {/* Timer display */}
      <div className="text-center">
        <div
          className={`text-4xl font-mono ${
            isNearLimit && isRecording ? 'text-red-500 animate-pulse' : 'text-gray-800'
          }`}
        >
          {formatDuration(duration)}
        </div>
        {isRecording && (
          <div className="text-sm text-gray-500 mt-1">
            {formatDuration(timeRemaining)} remaining
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-red-600 font-medium">
            {isPaused ? 'Paused' : 'Recording...'}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording && !audioBlob && (
          <button
            onClick={handleStart}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-full transition-colors flex items-center gap-2"
          >
            <MicIcon />
            Start Recording
          </button>
        )}

        {isRecording && (
          <>
            {isPaused ? (
              <button
                onClick={resumeRecording}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
              >
                Pause
              </button>
            )}
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
            >
              Stop
            </button>
          </>
        )}

        {!isRecording && audioBlob && (
          <>
            <button
              onClick={resetRecording}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-full transition-colors"
            >
              Re-record
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-full transition-colors"
            >
              Submit Recording
            </button>
          </>
        )}
      </div>

      {/* Audio preview */}
      {audioUrl && !isRecording && (
        <div className="flex justify-center">
          <audio controls src={audioUrl} className="w-full max-w-md" />
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}
