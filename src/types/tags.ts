// Tag system types
export type ConsultationStatus = 'scheduled' | 'attended' | 'no-show' | 'cancelled' | 'rescheduled';

export type TagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';

export type TagCategory = 'outcome' | 'topic' | 'action' | 'priority' | 'general';

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
  category?: TagCategory;
  icon?: string;
  is_active?: boolean;
  usage_count?: number;
  created_at?: string;
}

export interface ConsultationTag {
  consultation_id: string;
  tag_id: string;
  added_at: string;
  added_by?: string;
}

// Status configuration for UI
export const STATUS_CONFIG = {
  scheduled: {
    label: 'Scheduled',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-800 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
    icon: '📅'
  },
  attended: {
    label: 'Attended',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-800 dark:text-green-300',
    borderClass: 'border-green-200 dark:border-green-800',
    icon: '✅'
  },
  'no-show': {
    label: 'No Show',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-800 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800',
    icon: '❌'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    bgClass: 'bg-gray-100 dark:bg-gray-900/30',
    textClass: 'text-gray-800 dark:text-gray-300',
    borderClass: 'border-gray-200 dark:border-gray-800',
    icon: '🚫'
  },
  rescheduled: {
    label: 'Rescheduled',
    color: 'yellow',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-800 dark:text-yellow-300',
    borderClass: 'border-yellow-200 dark:border-yellow-800',
    icon: '🔄'
  }
} as const;

// Tag color configuration for UI
export const TAG_COLORS = {
  red: {
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-300',
    borderClass: 'border-red-200 dark:border-red-800'
  },
  orange: {
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-700 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-800'
  },
  yellow: {
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    textClass: 'text-yellow-700 dark:text-yellow-300',
    borderClass: 'border-yellow-200 dark:border-yellow-800'
  },
  green: {
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
    borderClass: 'border-green-200 dark:border-green-800'
  },
  blue: {
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800'
  },
  purple: {
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800'
  },
  pink: {
    bgClass: 'bg-pink-100 dark:bg-pink-900/30',
    textClass: 'text-pink-700 dark:text-pink-300',
    borderClass: 'border-pink-200 dark:border-pink-800'
  },
  gray: {
    bgClass: 'bg-gray-100 dark:bg-gray-900/30',
    textClass: 'text-gray-700 dark:text-gray-300',
    borderClass: 'border-gray-200 dark:border-gray-800'
  }
} as const;

// Cancellation methods
export type CancellationMethod = 'calendly' | 'email' | 'phone' | 'no-notice' | 'other';

// Quick action templates
export interface QuickAction {
  status: ConsultationStatus;
  tags?: string[]; // tag names to apply
  cancellationMethod?: CancellationMethod;
}