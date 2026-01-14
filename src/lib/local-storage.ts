import { v4 as uuidv4 } from 'uuid';
import type { LocalStorage, LocalSession, ScenarioType, Scores, DetailedFeedback } from '@/types';

const STORAGE_KEY = 'conversation-tutor-ai';
const FREE_LIMIT = 3;

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

export function getLocalStorage(): LocalStorage {
  if (typeof window === 'undefined') {
    return {
      anon_id: '',
      sessions: [],
      usage: { week_start: getWeekStart(), simulations_used: 0 },
      onboarding: { completed: false },
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored) as LocalStorage;
      // Reset usage if week changed
      const currentWeek = getWeekStart();
      if (data.usage.week_start !== currentWeek) {
        data.usage = { week_start: currentWeek, simulations_used: 0 };
        saveLocalStorage(data);
      }
      return data;
    } catch {
      // Corrupted data, reset
    }
  }

  const initial: LocalStorage = {
    anon_id: uuidv4(),
    sessions: [],
    usage: { week_start: getWeekStart(), simulations_used: 0 },
    onboarding: { completed: false },
  };
  saveLocalStorage(initial);
  return initial;
}

export function saveLocalStorage(data: LocalStorage): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getAnonId(): string {
  return getLocalStorage().anon_id;
}

export function getUsageCount(): number {
  return getLocalStorage().usage.simulations_used;
}

export function canStartSimulation(): boolean {
  const data = getLocalStorage();
  return data.usage.simulations_used < FREE_LIMIT;
}

export function incrementUsage(): void {
  const data = getLocalStorage();
  data.usage.simulations_used += 1;
  saveLocalStorage(data);
}

export function saveSession(session: LocalSession): void {
  const data = getLocalStorage();
  // Keep only last 10 sessions locally
  const existing = data.sessions.findIndex((s) => s.id === session.id);
  if (existing >= 0) {
    data.sessions[existing] = session;
  } else {
    data.sessions.unshift(session);
    if (data.sessions.length > 10) {
      data.sessions = data.sessions.slice(0, 10);
    }
  }
  saveLocalStorage(data);
}

export function getSession(id: string): LocalSession | null {
  const data = getLocalStorage();
  return data.sessions.find((s) => s.id === id) || null;
}

export function getSessions(): LocalSession[] {
  return getLocalStorage().sessions;
}

export function getRecentSessions(limit: number = 3): LocalSession[] {
  return getSessions().slice(0, limit);
}

export function saveOnboarding(role: string, goals: string[]): void {
  const data = getLocalStorage();
  data.onboarding = { role, goals, completed: true };
  saveLocalStorage(data);
}

export function getOnboarding(): LocalStorage['onboarding'] {
  return getLocalStorage().onboarding;
}

export function clearLocalStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getSessionsForMigration(): LocalSession[] {
  return getSessions();
}

export function clearSessionsAfterMigration(): void {
  const data = getLocalStorage();
  data.sessions = [];
  saveLocalStorage(data);
}

// Generate fallback scores when OpenAI is not available
export function generateFallbackScores(): Scores {
  return {
    clarity: Math.floor(Math.random() * 20) + 60,
    structure: Math.floor(Math.random() * 20) + 60,
    tone: Math.floor(Math.random() * 20) + 65,
    overall: Math.floor(Math.random() * 15) + 65,
  };
}

export function generateFallbackFeedback(scenarioType: ScenarioType): DetailedFeedback {
  const standupTips = [
    'Try to lead with your most important update first.',
    'Keep each update to 1-2 sentences for clarity.',
    'Mention blockers explicitly rather than hinting at them.',
  ];

  const incidentTips = [
    'Start with the current status: is the incident ongoing or resolved?',
    'Clearly state the impact on users or systems.',
    'Provide a clear timeline of events and next steps.',
  ];

  return {
    tips: scenarioType === 'standup' ? standupTips : incidentTips,
    highlights: [
      {
        quote: 'Your opening statement',
        type: 'positive',
        explanation: 'Good job setting context at the start.',
      },
      {
        quote: 'Consider being more specific',
        type: 'improvement',
        explanation: 'Adding concrete details helps others understand better.',
      },
    ],
  };
}

export const FREE_SIMULATIONS_LIMIT = FREE_LIMIT;
