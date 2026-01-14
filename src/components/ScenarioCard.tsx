'use client';

import type { ScenarioType } from '@/types';
import { getScenarioDisplayName, getScenarioDescription } from '@/lib/scenarios';

interface ScenarioCardProps {
  type: ScenarioType;
  selected?: boolean;
  onSelect: (type: ScenarioType) => void;
  disabled?: boolean;
}

export function ScenarioCard({ type, selected, onSelect, disabled }: ScenarioCardProps) {
  const icon = type === 'standup' ? '📊' : '🚨';
  const name = getScenarioDisplayName(type);
  const description = getScenarioDescription(type);

  return (
    <button
      onClick={() => onSelect(type)}
      disabled={disabled}
      className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-start gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
          <p className="text-gray-600 text-sm mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}
