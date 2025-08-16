export interface NoteTemplate {
  id: string;
  name: string;
  content: string;
  type: 'general' | 'consultation' | 'follow-up';
  tags: string[];
}

export const noteTemplates: NoteTemplate[] = [
  {
    id: 'initial-consultation',
    name: 'Initial Consultation',
    content: `**Initial Consultation Summary**

**Student Goals:**
- 

**Current Situation:**
- 

**Action Items:**
- [ ] 
- [ ] 

**Follow-up Required:** Yes/No
**Next Steps:**`,
    type: 'consultation',
    tags: ['initial-assessment']
  },
  {
    id: 'cv-review',
    name: 'CV Review',
    content: `**CV Review Session**

**Strengths Identified:**
- 

**Areas for Improvement:**
- 

**Changes Made:**
- 

**Recommendations:**
- 

**Next Review:** [Date]`,
    type: 'consultation',
    tags: ['cv-review']
  },
  {
    id: 'interview-prep',
    name: 'Interview Preparation',
    content: `**Interview Preparation Session**

**Interview Type:** 
**Company/Position:** 
**Date of Interview:** 

**Topics Covered:**
- 

**Practice Questions:**
- 

**Student Confidence Level:** [1-10]
**Follow-up Needed:** Yes/No`,
    type: 'consultation',
    tags: ['interview-prep']
  },
  {
    id: 'follow-up',
    name: 'Follow-up Note',
    content: `**Follow-up Check-in**

**Previous Action Items Status:**
- [ ] 
- [ ] 

**New Developments:**
- 

**Additional Support Needed:**
- 

**Next Contact:** [Date]`,
    type: 'follow-up',
    tags: ['follow-up']
  },
  {
    id: 'masters-prep',
    name: 'Masters Preparation',
    content: `**Masters Application Preparation**

**Target Programs:**
- 

**Application Timeline:**
- 

**Documents Needed:**
- [ ] Personal Statement
- [ ] Letters of Recommendation
- [ ] Transcripts
- [ ] Test Scores

**Next Steps:**
- 

**Deadline Reminders:**`,
    type: 'consultation',
    tags: ['masters-prep']
  }
];

export const getNoteTemplate = (id: string): NoteTemplate | null => {
  return noteTemplates.find(template => template.id === id) || null;
};