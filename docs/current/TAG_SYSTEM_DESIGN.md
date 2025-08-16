# Tag & Status System Design

## Best Practice: Dual System Approach

### 1. **Fixed Status Badges** (for workflow states)
These are mutually exclusive states with fixed colors:

```typescript
enum ConsultationStatus {
  SCHEDULED = 'scheduled',    // 🔵 Blue - Future meeting
  ATTENDED = 'attended',      // ✅ Green - Completed successfully  
  NO_SHOW = 'no-show',       // 🔴 Red - Student didn't show
  CANCELLED = 'cancelled',    // ⚫ Gray - Cancelled in advance
  RESCHEDULED = 'rescheduled' // 🟡 Yellow - Moved to another time
}

// Visual representation
const statusColors = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📅' },
  attended: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
  'no-show': { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🚫' },
  rescheduled: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🔄' }
};
```

### 2. **Flexible Colored Tags** (for categorization)
These can be multiple per consultation:

```typescript
interface Tag {
  id: string;
  name: string;
  color: TagColor;
  category?: 'outcome' | 'topic' | 'action' | 'priority';
}

enum TagColor {
  RED = 'red',       // Urgent/Problem
  ORANGE = 'orange', // Important
  YELLOW = 'yellow', // Follow-up needed
  GREEN = 'green',   // Success/Progress
  BLUE = 'blue',     // Informational
  PURPLE = 'purple', // Special program
  PINK = 'pink',     // Personal/Sensitive
  GRAY = 'gray'      // Archived/Old
}
```

## Recommended Tag Categories

### Quick Action Tags (for daily workflow)
- 🔴 **"Email Cancel"** - Cancelled via email
- 🟡 **"Needs Follow-up"** - Requires action
- 🟢 **"Great Progress"** - Positive outcome
- 🔵 **"First Meeting"** - New student
- 🟣 **"At Risk"** - Needs attention

### Topic Tags (what was discussed)
- 📝 **"Resume Review"**
- 💼 **"Job Search"**
- 🎯 **"Career Planning"**
- 🎓 **"Grad School"**
- 💡 **"Skills Development"**

### Outcome Tags (meeting results)
- ✅ **"Goals Set"**
- 📋 **"Action Plan Created"**
- 🤝 **"Referral Made"**
- 📚 **"Resources Provided"**
- ⏰ **"Follow-up Scheduled"**

## UI Implementation

### Daily Dashboard View
```
┌─────────────────────────────────────────────────────┐
│ Today's Consultations                               │
├─────────────────────────────────────────────────────┤
│ 9:00 AM - Jane Doe                                 │
│ [SCHEDULED] [In-Person] [First Meeting] [Career Planning] │
│ ⚡ Quick Actions: [✅ Attended] [❌ No-show] [📝 Note] │
├─────────────────────────────────────────────────────┤
│ 10:30 AM - John Smith                              │
│ [CANCELLED] [Email Cancel] [Needs Follow-up]       │
│ Cancelled via email this morning                    │
├─────────────────────────────────────────────────────┤
│ 2:00 PM - Sarah Johnson                            │
│ [ATTENDED] [Great Progress] [Resume Review] [Goals Set] │
│ ✅ Completed - Click to view notes                  │
└─────────────────────────────────────────────────────┘
```

### Student Profile View
```
Recent Consultations:
• Oct 15 [ATTENDED] [Career Planning] [Action Plan Created]
• Oct 1  [NO-SHOW] [Needs Follow-up] 
• Sep 20 [ATTENDED] [Resume Review] [Great Progress]
```

## Database Schema

```sql
-- Add to consultations table
ALTER TABLE consultations
ADD COLUMN status VARCHAR(20) DEFAULT 'scheduled',
ADD COLUMN status_updated_at TIMESTAMP,
ADD COLUMN status_updated_by UUID;

-- New tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  category VARCHAR(20),
  created_by UUID,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0
);

-- Junction table for consultation tags
CREATE TABLE consultation_tags (
  consultation_id UUID REFERENCES consultations(id),
  tag_id UUID REFERENCES tags(id),
  added_at TIMESTAMP DEFAULT NOW(),
  added_by UUID,
  PRIMARY KEY (consultation_id, tag_id)
);

-- Quick tag templates for common scenarios
CREATE TABLE tag_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),
  description TEXT,
  tag_ids UUID[], -- Array of tag IDs to apply together
  usage_count INTEGER DEFAULT 0
);
```

## Workflow Benefits

### 1. **Quick Daily Updates**
- See status at a glance (colored badges)
- One-click status changes
- Batch tag operations

### 2. **Better Reporting**
- "No-show rate by program"
- "Most common cancellation methods"
- "Follow-up completion rate"
- "Tag usage analytics"

### 3. **Smart Filters**
- "Show all 'Needs Follow-up' this week"
- "Students with 2+ no-shows"
- "First meetings this month"
- "At-risk students needing attention"

### 4. **Automation Possibilities**
- Auto-tag "First Meeting" for new students
- Auto-add "Needs Follow-up" for no-shows
- Suggest tags based on meeting notes
- Alert for "At Risk" tagged students

## Quick Implementation Priority

1. **Phase 1** (Immediate):
   - Add status field with 5 states
   - Simple status badges in UI
   - Quick action buttons

2. **Phase 2** (Next week):
   - Basic tag system (5-10 preset tags)
   - Tag display in consultations
   - Simple tag filtering

3. **Phase 3** (Future):
   - Custom tags
   - Tag analytics
   - Automated tagging
   - Tag templates

This gives you both structured workflow tracking (status) and flexible categorization (tags) without overwhelming the interface.