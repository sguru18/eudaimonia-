-- Day Planner: Time Blocks Table
-- Run this in Supabase SQL Editor to create the time_blocks table

-- Create time_blocks table
CREATE TABLE IF NOT EXISTS time_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure start_time is before end_time
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_id ON time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date ON time_blocks(date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON time_blocks(user_id, date);

-- Enable Row Level Security
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own time blocks" ON time_blocks;
DROP POLICY IF EXISTS "Users can create own time blocks" ON time_blocks;
DROP POLICY IF EXISTS "Users can update own time blocks" ON time_blocks;
DROP POLICY IF EXISTS "Users can delete own time blocks" ON time_blocks;

-- Create RLS policies
-- Users can only see their own time blocks
CREATE POLICY "Users can view own time blocks"
    ON time_blocks FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only create time blocks for themselves
CREATE POLICY "Users can create own time blocks"
    ON time_blocks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own time blocks
CREATE POLICY "Users can update own time blocks"
    ON time_blocks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own time blocks
CREATE POLICY "Users can delete own time blocks"
    ON time_blocks FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS time_blocks_updated_at ON time_blocks;
CREATE TRIGGER time_blocks_updated_at
    BEFORE UPDATE ON time_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_time_blocks_updated_at();

-- Grant access to authenticated users
GRANT ALL ON time_blocks TO authenticated;


