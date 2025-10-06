-- Add lastAttendanceStatus column to students table
ALTER TABLE students ADD COLUMN lastAttendanceStatus TEXT DEFAULT 'scheduled';

-- Update existing students to have a default value
UPDATE students SET lastAttendanceStatus = 'scheduled' WHERE lastAttendanceStatus IS NULL;