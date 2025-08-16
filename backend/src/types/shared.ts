// Shared types between frontend and backend
// This is the single source of truth for all types

export const NOTE_TYPES = [
  'General',
  'Introduction Meeting',
  'Career Planning',
  'Interview Prep',
  'Job Search Strategy',
  'Follow-up Required',
  'Academic Concern',
  'Resume Review',
  'Mock Interview'
] as const;

export const CONSULTATION_TYPES = [
  'General',
  'Introduction Meeting',
  'Career Counseling',
  'Resume Review',
  'Mock Interview',
  'Job Search Strategy',
  'Internship Planning',
  'Graduate School',
  'Follow-up'
] as const;

export type NoteType = typeof NOTE_TYPES[number];
export type ConsultationType = typeof CONSULTATION_TYPES[number];