-- Priorities feature database tables
-- Run this in Supabase SQL editor

-- Create priorities table
CREATE TABLE IF NOT EXISTS priorities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#5A7F7A',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create priority_weeks table (assigns priorities to specific weeks with ranking)
CREATE TABLE IF NOT EXISTS priority_weeks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    priority_id UUID NOT NULL REFERENCES priorities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    rank_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    -- Ensure a priority can only be assigned once per week per user
    UNIQUE(priority_id, week_start_date, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_priorities_user_id ON priorities(user_id);
CREATE INDEX IF NOT EXISTS idx_priority_weeks_user_id ON priority_weeks(user_id);
CREATE INDEX IF NOT EXISTS idx_priority_weeks_week_start ON priority_weeks(week_start_date);
CREATE INDEX IF NOT EXISTS idx_priority_weeks_priority_id ON priority_weeks(priority_id);

-- Enable Row Level Security
ALTER TABLE priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_weeks ENABLE ROW LEVEL SECURITY;

-- Create policies for priorities table
CREATE POLICY "Users can view their own priorities"
    ON priorities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own priorities"
    ON priorities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own priorities"
    ON priorities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own priorities"
    ON priorities FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for priority_weeks table
CREATE POLICY "Users can view their own priority_weeks"
    ON priority_weeks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own priority_weeks"
    ON priority_weeks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own priority_weeks"
    ON priority_weeks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own priority_weeks"
    ON priority_weeks FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_priorities_updated_at ON priorities;
CREATE TRIGGER update_priorities_updated_at
    BEFORE UPDATE ON priorities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_priority_weeks_updated_at ON priority_weeks;
CREATE TRIGGER update_priority_weeks_updated_at
    BEFORE UPDATE ON priority_weeks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

