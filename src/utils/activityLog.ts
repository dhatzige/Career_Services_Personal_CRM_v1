export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  entity: 'student' | 'consultation' | 'note' | 'system';
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

class ActivityLogger {
  private readonly STORAGE_KEY = 'crm_activity_log';
  private readonly MAX_ENTRIES = 1000;

  logActivity(entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>): void {
    const logEntry: ActivityLogEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString()
    };

    const logs = this.getActivityLogs();
    logs.unshift(logEntry);

    // Keep only the most recent entries
    if (logs.length > this.MAX_ENTRIES) {
      logs.splice(this.MAX_ENTRIES);
    }

    this.saveActivityLogs(logs);
  }

  getActivityLogs(): ActivityLogEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveActivityLogs(logs: ActivityLogEntry[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save activity logs:', error);
    }
  }

  getActivityByEntity(entity: string, entityId: string): ActivityLogEntry[] {
    return this.getActivityLogs().filter(log => 
      log.entity === entity && log.entityId === entityId
    );
  }

  getActivityByUser(userId: string): ActivityLogEntry[] {
    return this.getActivityLogs().filter(log => log.userId === userId);
  }

  getActivityByDateRange(startDate: string, endDate: string): ActivityLogEntry[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.getActivityLogs().filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
  }

  clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const activityLogger = new ActivityLogger();

// Helper functions for common activities
export const logStudentCreated = (studentId: string, studentName: string): void => {
  activityLogger.logActivity({
    userId: 'current_user',
    action: 'CREATE_STUDENT',
    entity: 'student',
    entityId: studentId,
    details: { studentName }
  });
};

export const logStudentUpdated = (studentId: string, studentName: string, changes: Record<string, unknown>): void => {
  activityLogger.logActivity({
    userId: 'current_user',
    action: 'UPDATE_STUDENT',
    entity: 'student',
    entityId: studentId,
    details: { studentName, changes }
  });
};

export const logStudentDeleted = (studentId: string, studentName: string): void => {
  activityLogger.logActivity({
    userId: 'current_user',
    action: 'DELETE_STUDENT',
    entity: 'student',
    entityId: studentId,
    details: { studentName }
  });
};

export const logConsultationCreated = (consultationId: string, studentId: string, consultationType: string): void => {
  activityLogger.logActivity({
    userId: 'current_user',
    action: 'CREATE_CONSULTATION',
    entity: 'consultation',
    entityId: consultationId,
    details: { studentId, consultationType }
  });
};

export const logNoteCreated = (noteId: string, studentId: string, noteType: string): void => {
  activityLogger.logActivity({
    userId: 'current_user',
    action: 'CREATE_NOTE',
    entity: 'note',
    entityId: noteId,
    details: { studentId, noteType }
  });
};

export const logSystemEvent = (event: string, details: Record<string, unknown>): void => {
  activityLogger.logActivity({
    userId: 'system',
    action: event,
    entity: 'system',
    details
  });
};