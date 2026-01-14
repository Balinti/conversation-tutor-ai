import { v4 as uuidv4 } from 'uuid';
import type { ScenarioSeed, ScenarioType, FollowupQuestion } from '@/types';

const STANDUP_CONTEXTS = [
  'You are giving your daily standup update to your team. Your team lead and 5 engineers are listening.',
  'It\'s Monday morning standup. The product manager has joined to check on sprint progress.',
  'Your standup is running late, and the team seems eager to get back to work. Keep it concise.',
];

const INCIDENT_CONTEXTS = [
  'There was a production outage affecting 20% of users. You are giving a status update to stakeholders.',
  'A critical API is returning 500 errors. Engineering leadership is on the call for a status update.',
  'Database latency spiked causing slowdowns. The incident commander asked for your update.',
];

const STANDUP_PROMPTS = [
  'Share what you worked on yesterday, what you\'re working on today, and any blockers.',
  'Give your update: accomplishments, current focus, and obstacles.',
  'Time for your standup. What\'s your status?',
];

const INCIDENT_PROMPTS = [
  'Please give us the current status of the incident.',
  'What\'s the latest on this issue? Impact and timeline?',
  'Update the team on where we are with this incident.',
];

const STANDUP_FOLLOWUPS: Omit<FollowupQuestion, 'id'>[] = [
  { question: 'Can you be more specific about what "almost done" means?', type: 'interruption', timing: 15 },
  { question: 'What\'s the ETA on that task?', type: 'followup', timing: 30 },
  { question: 'Is there anything blocking you that we can help with?', type: 'followup', timing: 45 },
  { question: 'How does this align with the sprint goal?', type: 'followup', timing: 60 },
  { question: 'Wait, didn\'t you mention that yesterday too?', type: 'interruption', timing: 20 },
];

const INCIDENT_FOLLOWUPS: Omit<FollowupQuestion, 'id'>[] = [
  { question: 'What\'s the user impact right now?', type: 'interruption', timing: 10 },
  { question: 'When do you expect this to be resolved?', type: 'followup', timing: 25 },
  { question: 'Has this happened before? Is there a pattern?', type: 'followup', timing: 40 },
  { question: 'What\'s our rollback plan if the fix doesn\'t work?', type: 'interruption', timing: 35 },
  { question: 'Who else needs to be involved in resolving this?', type: 'followup', timing: 50 },
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickFollowups(type: ScenarioType): FollowupQuestion[] {
  const pool = type === 'standup' ? STANDUP_FOLLOWUPS : INCIDENT_FOLLOWUPS;
  // Pick 2-3 followups, including at least 1 interruption
  const interruptions = pool.filter((f) => f.type === 'interruption');
  const followups = pool.filter((f) => f.type === 'followup');

  const selected: FollowupQuestion[] = [
    { ...randomPick(interruptions), id: uuidv4() },
    { ...randomPick(followups), id: uuidv4() },
  ];

  // 50% chance of a third question
  if (Math.random() > 0.5) {
    const remaining = [...interruptions, ...followups].filter(
      (f) => !selected.some((s) => s.question === f.question)
    );
    if (remaining.length > 0) {
      selected.push({ ...randomPick(remaining), id: uuidv4() });
    }
  }

  // Sort by timing
  return selected.sort((a, b) => a.timing - b.timing);
}

export function generateScenarioSeed(type: ScenarioType): ScenarioSeed {
  const contexts = type === 'standup' ? STANDUP_CONTEXTS : INCIDENT_CONTEXTS;
  const prompts = type === 'standup' ? STANDUP_PROMPTS : INCIDENT_PROMPTS;

  return {
    scenario_type: type,
    context: randomPick(contexts),
    prompts: [randomPick(prompts)],
    followups: pickFollowups(type),
    timeLimit: type === 'standup' ? 90 : 120, // seconds
  };
}

export function getScenarioDisplayName(type: ScenarioType): string {
  return type === 'standup' ? 'Daily Standup' : 'Incident Status Update';
}

export function getScenarioDescription(type: ScenarioType): string {
  if (type === 'standup') {
    return 'Practice delivering clear, concise daily standup updates under pressure.';
  }
  return 'Practice communicating incident status to stakeholders with clarity and confidence.';
}
