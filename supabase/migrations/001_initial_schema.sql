-- Habit data (one JSONB blob per user)
CREATE TABLE habit_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habit_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own data" ON habit_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own data" ON habit_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own data" ON habit_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Conversation state (one JSONB blob per user)
CREATE TABLE conversation_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversation_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversation" ON conversation_state
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversation" ON conversation_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversation" ON conversation_state
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversation" ON conversation_state
  FOR DELETE USING (auth.uid() = user_id);

-- Feedback (Tom reads via service role key in dashboard)
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
