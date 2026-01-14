// Types for conversation-tutor-ai

export type ScenarioType = 'standup' | 'incident';

export interface Session {
  id: string;
  user_id: string | null;
  anon_id: string | null;
  scenario_type: ScenarioType;
  created_at: string;
  duration_sec: number;
  transcript: TranscriptSegment[];
  scores: Scores;
  detailed_feedback: DetailedFeedback;
  is_pro_features_used: boolean;
  followup_questions: FollowupQuestion[];
  user_responses: UserResponse[];
  status: 'started' | 'recording' | 'processing' | 'completed' | 'error';
}

export interface TranscriptSegment {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: number;
  duration?: number;
}

export interface Scores {
  clarity: number;
  structure: number;
  tone: number;
  overall: number;
}

export interface DetailedFeedback {
  tips: string[];
  highlights: Highlight[];
  momentByMoment?: MomentFeedback[];
}

export interface Highlight {
  quote: string;
  timestamp?: number;
  type: 'positive' | 'improvement';
  explanation: string;
}

export interface MomentFeedback {
  timestamp: number;
  text: string;
  score: number;
  feedback: string;
}

export interface FollowupQuestion {
  id: string;
  question: string;
  type: 'interruption' | 'followup';
  timing: number;
}

export interface UserResponse {
  questionId: string;
  transcript: string;
  audioPath?: string;
}

export interface Profile {
  user_id: string;
  role: string | null;
  goals: string[];
  timezone: string;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  price_id: string | null;
  current_period_end: string | null;
  updated_at: string;
}

export interface UsageLimit {
  id: string;
  user_id: string | null;
  anon_id: string | null;
  week_start: string;
  simulations_used: number;
  updated_at: string;
}

export interface LocalSession {
  id: string;
  scenario_type: ScenarioType;
  created_at: string;
  duration_sec: number;
  transcript: TranscriptSegment[];
  scores: Scores;
  detailed_feedback: DetailedFeedback;
  followup_questions: FollowupQuestion[];
  user_responses: UserResponse[];
  status: Session['status'];
  audioBlob?: string; // base64 encoded audio
}

export interface LocalStorage {
  anon_id: string;
  sessions: LocalSession[];
  usage: {
    week_start: string;
    simulations_used: number;
  };
  onboarding: {
    role?: string;
    goals?: string[];
    completed: boolean;
  };
}

export interface ScenarioSeed {
  scenario_type: ScenarioType;
  context: string;
  prompts: string[];
  followups: FollowupQuestion[];
  timeLimit: number;
}

// API request/response types
export interface StartSimulationRequest {
  scenario_type: ScenarioType;
  anon_id?: string;
}

export interface StartSimulationResponse {
  sessionId: string;
  seed: ScenarioSeed;
  usage: {
    used: number;
    limit: number;
  };
}

export interface CompleteSimulationRequest {
  sessionId: string;
  audio: string; // base64
  duration_sec: number;
  responses?: UserResponse[];
}

export interface CompleteSimulationResponse {
  session: Session;
}

export interface DrillEvaluateRequest {
  sessionId: string;
  highlightId: string;
  audio: string; // base64
}

export interface DrillEvaluateResponse {
  score: number;
  feedback: string;
  improved: boolean;
}

export interface MeetingModeRequest {
  meeting_type: ScenarioType;
  duration_minutes: number;
}

export interface MeetingModeResponse {
  rehearsal_plan: string[];
  pressure_question: string;
  ready_rating: 'ready' | 'almost' | 'needs_work';
  tips: string[];
}
