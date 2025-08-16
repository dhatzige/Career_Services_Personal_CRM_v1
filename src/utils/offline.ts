// Offline capability and sync management

interface QueuedAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'student' | 'note' | 'consultation';
  data: Record<string, unknown>;
  timestamp: number;
}

class OfflineManager {
  private queue: QueuedAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  
  constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWhenOnline();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
  
  private loadQueue(): void {
    const stored = localStorage.getItem('offline_queue');
    if (stored) {
      try {
        this.queue = JSON.parse(stored);
      } catch {
        this.queue = [];
      }
    }
  }
  
  private saveQueue(): void {
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }
  
  queueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): void {
    const queuedAction: QueuedAction = {
      ...action,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: Date.now()
    };
    
    this.queue.push(queuedAction);
    this.saveQueue();
    
    if (this.isOnline) {
      this.syncWhenOnline();
    }
  }
  
  async syncWhenOnline(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.queue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      // Process queue in order
      for (const action of this.queue) {
        await this.processAction(action);
      }
      
      // Clear queue after successful sync
      this.queue = [];
      this.saveQueue();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private async processAction(action: QueuedAction): Promise<void> {
    // In a real app, this would make API calls
    // For now, we'll just simulate the processing
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Processed offline action:', action);
        resolve();
      }, 100);
    });
  }
  
  getQueueLength(): number {
    return this.queue.length;
  }
  
  isOffline(): boolean {
    return !this.isOnline;
  }
  
  isSyncing(): boolean {
    return this.syncInProgress;
  }
}

export const offlineManager = new OfflineManager();

// Service Worker registration for offline capability
export const registerServiceWorker = async (): Promise<void> => {
  // Temporarily disabled to avoid conflicts during development
  console.log('Service Worker registration disabled for development');
  return;
  
  // if ('serviceWorker' in navigator) {
  //   try {
  //     const registration = await navigator.serviceWorker.register('/sw.js');
  //     console.log('Service Worker registered:', registration);
  //   } catch (error) {
  //     // Check if running in StackBlitz environment
  //     const isStackBlitz = window.location.hostname.includes('stackblitz') || 
  //                         window.location.hostname.includes('webcontainer');
  //     
  //     if (isStackBlitz) {
  //       console.warn('Service Workers are not supported in StackBlitz environment. Offline functionality will be limited.');
  //     } else {
  //       console.error('Service Worker registration failed:', error);
  //     }
  //   }
  // }
};