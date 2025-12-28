# Database Migration: Habit Reminders

## Overview
This migration adds a new `habit_reminders` table to store per-week reminder notes for the Habits screen.

## SQL Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create habit_reminders table
CREATE TABLE IF NOT EXISTS habit_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one reminder per user per week
  UNIQUE(user_id, week_start_date)
);

-- Add RLS policies
ALTER TABLE habit_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reminders
CREATE POLICY "Users can view their own habit reminders"
  ON habit_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own reminders
CREATE POLICY "Users can insert their own habit reminders"
  ON habit_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reminders
CREATE POLICY "Users can update their own habit reminders"
  ON habit_reminders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reminders
CREATE POLICY "Users can delete their own habit reminders"
  ON habit_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_habit_reminders_user_week 
  ON habit_reminders(user_id, week_start_date);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_habit_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER habit_reminders_updated_at
  BEFORE UPDATE ON habit_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_reminders_updated_at();
```

## What This Adds

- **Table**: `habit_reminders` - Stores reminder notes per week
- **Columns**:
  - `id`: UUID primary key
  - `user_id`: References the authenticated user
  - `week_start_date`: The Monday date for the week (format: 'YYYY-MM-DD')
  - `content`: The reminder text content
  - `created_at`: Timestamp when created
  - `updated_at`: Timestamp when last updated
- **Constraints**: One reminder per user per week
- **RLS Policies**: Users can only access their own reminders
- **Indexes**: Optimized for user + week lookups
- **Triggers**: Auto-update `updated_at` on changes

## Features

- Collapsible "Other Reminders" section in Habits screen
- Auto-saves on blur
- Persists per week (each week has its own reminder)
- Simple text input (not markdown editor)
- Styled to match the app's existing Card components

## Usage

The reminder section appears below the "Add New Habit" button and can be expanded/collapsed by clicking on it.

