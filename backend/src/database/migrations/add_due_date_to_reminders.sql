-- Add due_date column to follow_up_reminders table
ALTER TABLE follow_up_reminders 
ADD COLUMN due_date DATETIME;

-- Update existing reminders to have due_date based on created_at + 7 days
UPDATE follow_up_reminders 
SET due_date = datetime(created_at, '+7 days')
WHERE due_date IS NULL;