-- Add global meal options list support
-- This stores a single shared list of meal options that user edits once

-- 1. Create user_settings table to store global meal options list
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, setting_key)
);

-- 2. Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- 4. Create policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Create updated_at trigger for user_settings (drop if exists first)
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Create function to upsert user settings
CREATE OR REPLACE FUNCTION upsert_user_setting(
  p_user_id UUID,
  p_setting_key TEXT,
  p_setting_value TEXT
)
RETURNS user_settings AS $$
DECLARE
  result user_settings;
BEGIN
  INSERT INTO user_settings (user_id, setting_key, setting_value)
  VALUES (p_user_id, p_setting_key, p_setting_value)
  ON CONFLICT (user_id, setting_key)
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_user_setting(UUID, TEXT, TEXT) TO authenticated;

-- Note: Use setting_key = 'meal_options_list' to store the user's global list of meal options

