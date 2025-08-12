-- Migration: Add no-show tracking fields to students table
-- Date: 2025-08-01

-- Add no_show_count column to track the number of no-shows per student
ALTER TABLE students ADD COLUMN no_show_count INTEGER DEFAULT 0;

-- Add last_no_show_date to track when the last no-show occurred
ALTER TABLE students ADD COLUMN last_no_show_date DATETIME;

-- Create an index on no_show_count for performance when querying high no-show students
CREATE INDEX idx_students_no_show_count ON students(no_show_count);

-- Update existing students to have 0 no-shows
UPDATE students SET no_show_count = 0 WHERE no_show_count IS NULL;