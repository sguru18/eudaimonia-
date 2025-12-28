-- Recurring Time Blocks Table
-- Stores recurring events that repeat on specific days of the week

CREATE TABLE IF NOT EXISTS recurring_time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIME NOT NULL,  -- Format: HH:MM:SS
    end_time TIME NOT NULL,    -- Format: HH:MM:SS
    -- Days of week as boolean array: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    days_of_week BOOLEAN[] NOT NULL DEFAULT '{false, false, false, false, false, false, false}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE recurring_time_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recurring blocks"
    ON recurring_time_blocks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring blocks"
    ON recurring_time_blocks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring blocks"
    ON recurring_time_blocks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring blocks"
    ON recurring_time_blocks FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_recurring_time_blocks_user_id ON recurring_time_blocks(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_recurring_time_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recurring_time_blocks_updated_at
    BEFORE UPDATE ON recurring_time_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_time_blocks_updated_at();

