-- RLS (Row Level Security) policies for conversation-tutor-ai
-- Run this after schema.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Sessions policies
-- Users can view their own sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
CREATE POLICY "Users can view their own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions;
CREATE POLICY "Users can insert their own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;
CREATE POLICY "Users can update their own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can access all sessions (for anon access via API)
DROP POLICY IF EXISTS "Service role can access all sessions" ON sessions;
CREATE POLICY "Service role can access all sessions" ON sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Session artifacts policies
DROP POLICY IF EXISTS "Users can view artifacts of their sessions" ON session_artifacts;
CREATE POLICY "Users can view artifacts of their sessions" ON session_artifacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_artifacts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert artifacts for their sessions" ON session_artifacts;
CREATE POLICY "Users can insert artifacts for their sessions" ON session_artifacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_artifacts.session_id
      AND (sessions.user_id = auth.uid() OR sessions.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Service role can access all artifacts" ON session_artifacts;
CREATE POLICY "Service role can access all artifacts" ON session_artifacts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Usage limits policies
DROP POLICY IF EXISTS "Users can view their own usage" ON usage_limits;
CREATE POLICY "Users can view their own usage" ON usage_limits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON usage_limits;
CREATE POLICY "Users can insert their own usage" ON usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own usage" ON usage_limits;
CREATE POLICY "Users can update their own usage" ON usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can access all usage" ON usage_limits;
CREATE POLICY "Service role can access all usage" ON usage_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Storage bucket policies (run in Supabase dashboard or via API)
-- Create a private bucket called 'session-audio'
-- Policy: Users can upload to their own folder
-- Policy: Users can read their own files via signed URLs
