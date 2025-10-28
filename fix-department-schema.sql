-- Fix department_id schema migration
-- Run this in your Supabase SQL Editor to fix the department_id field

-- First, let's check if departments table exists and has the right structure
-- If not, create it
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some sample departments if they don't exist
INSERT INTO departments (name, school_id) VALUES 
  ('Computer Science', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Mathematics', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Physics', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Chemistry', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Biology', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Engineering', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Medicine', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Law', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Business Administration', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1)),
  ('Economics', (SELECT id FROM schools WHERE name = 'University of Lagos' LIMIT 1))
ON CONFLICT DO NOTHING;

-- Now fix the users table department_id field
-- Step 1: Add a new UUID column for department_id
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id_new UUID;

-- Step 2: Update the new column with department IDs based on existing text values
-- This assumes the text values in department_id are department names
UPDATE users 
SET department_id_new = (
  SELECT d.id 
  FROM departments d 
  WHERE d.name = users.department_id 
  LIMIT 1
)
WHERE department_id IS NOT NULL AND department_id != '';

-- Step 3: Drop the old text column
ALTER TABLE users DROP COLUMN IF EXISTS department_id;

-- Step 4: Rename the new column to department_id
ALTER TABLE users RENAME COLUMN department_id_new TO department_id;

-- Step 5: Add the foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_department_id 
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- Step 6: Make the column NOT NULL (optional, depending on your requirements)
-- ALTER TABLE users ALTER COLUMN department_id SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- Enable RLS on departments if not already enabled
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for departments
CREATE POLICY "Anyone can read departments" ON departments FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT ON departments TO authenticated;
GRANT SELECT ON departments TO anon;
