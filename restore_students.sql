PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    year_of_study TEXT CHECK (year_of_study IN ('1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni')),
    program_type TEXT CHECK (program_type IN ('Bachelor''s', 'Master''s', 'PhD')),
    specific_program TEXT,
    major TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Graduated')),
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_interaction DATETIME,
    academic_start_date DATE,
    expected_graduation DATE,
    avatar TEXT,
    tags TEXT,
    career_interests TEXT,
    linkedin_url TEXT,
    resume_on_file INTEGER DEFAULT 0,
    resume_last_updated DATE,
    job_search_status TEXT CHECK (job_search_status IN ('Not Started', 'Preparing', 'Actively Searching', 'Searching for Internship', 'Currently Interning', 'Interviewing', 'Offer Received', 'Employed', 'Not Seeking')),
    target_industries TEXT,
    target_locations TEXT,
    no_show_count INTEGER DEFAULT 0,
    last_no_show_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    lastAttendanceStatus TEXT DEFAULT 'scheduled'
, quick_note TEXT, last_attendance_status TEXT DEFAULT 'scheduled');
INSERT INTO students VALUES('eb516a8f-a175-4c30-8c07-6e51b36efb7f','Sarah','Johnson','sarah.johnson@university.edu','+1 (555) 123-4567','3rd year','Bachelor''s','','Psychology','Active','2025-08-05 06:40:07','2025-08-08 08:42:53','2022-09-01','',NULL,'["honors","dean''s list","research experience","psychology club president"]','["HR"]','linkedin.com/sarah_johnson',1,NULL,'Preparing','["HumanResources"]','["Thessaloniki"]','2025-08-05 06:40:07','2025-08-05 06:42:09',0,'2025-08-12 09:34:45','cancelled',NULL,'scheduled');
INSERT INTO students VALUES('e74faa139a105260a4efc442f9d4fd02','Eleftherios','Panagiotidis','20249021@student.act.edu','','Alumni','Master''s','Business Administration','MBA','Active','2025-08-12 06:38:12','2025-08-14 10:33:06',NULL,'',NULL,'[]','["MBA recognition","Career development"]','',1,NULL,'Preparing','[]','[]',0,NULL,'2025-08-12 06:38:12','2025-08-16 12:22:42','attended',NULL,'attended');
INSERT INTO students VALUES('e3f9f1e3-f356-4e6b-9c38-4867121715ee','Dimitris','Chatzigeorgiou','sdasd@act.edu','','2nd year','Bachelor''s','','Business - Marketing','Active','2025-08-16 09:55:29',NULL,'','',NULL,'[]','[]','',0,NULL,'Preparing','[]','[]',0,NULL,'2025-08-16 09:55:29','2025-08-16 12:18:07','scheduled','','no-show');
INSERT INTO students VALUES('b8ea5587-cbba-4b02-af1e-c47cc04a9064','Dimitris','Chatzigeorgiou','da.chatzigeorgiou@gmail.com','','4th year','Bachelor''s','','Biology','Active','2025-08-16 10:10:59','2025-08-16 12:18:41','','',NULL,'[]','[]','',0,NULL,'Not Started','[]','[]',0,NULL,'2025-08-16 10:10:59','2025-08-16 12:18:33','scheduled','','attended');
COMMIT;
