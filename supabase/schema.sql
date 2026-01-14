-- Supabase Schema for conversation-tutor-ai
-- Run this file first, then rls.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table: stores user role and goals
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  goals TEXT[],
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table: stores simulation sessions (both anon and authenticated)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id TEXT,
  scenario_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_sec INTEGER DEFAULT 0,
  transcript JSONB DEFAULT '[]'::jsonb,
  scores JSONB DEFAULT '{}'::jsonb,
  detailed_feedback JSONB DEFAULT '{}'::jsonb,
  is_pro_features_used BOOLEAN DEFAULT FALSE,
  followup_questions JSONB DEFAULT '[]'::jsonb,
  user_responses JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'started'
);

-- Session artifacts: audio files and other media
CREATE TABLE IF NOT EXISTS session_artifacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'audio', 'drill_audio', etc.
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage limits: track weekly simulation usage
CREATE TABLE IF NOT EXISTS usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anon_id TEXT,
  week_start DATE NOT NULL,
  simulations_used INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start),
  UNIQUE(anon_id, week_start)
);

-- Subscriptions: Stripe subscription data
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'inactive',
  price_id TEXT,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_anon_id ON sessions(anon_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_anon_id ON usage_limits(anon_id);
CREATE INDEX IF NOT EXISTS idx_session_artifacts_session_id ON session_artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to get current week start (Monday)
CREATE OR REPLACE FUNCTION get_week_start(d DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  RETURN d - (EXTRACT(DOW FROM d)::INTEGER + 6) % 7;
END;
$$ LANGUAGE plpgsql;
