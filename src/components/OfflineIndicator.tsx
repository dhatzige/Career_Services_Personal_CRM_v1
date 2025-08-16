import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { offlineManager } from '../utils/offline';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [queueLength, setQueueLength] = React.useState(0);
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update queue length periodically
    const interval = setInterval(() => {
      setQueueLength(offlineManager.getQueueLength());
      setIsSyncing(offlineManager.isSyncing());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && queueLength === 0) {
    return null; // Don't show indicator when online and no pending actions
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg border ${
      isOnline 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isSyncing ? 'Syncing...' : 'Online'}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">Offline</span>
          </>
        )}
        
        {queueLength > 0 && (
          <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">
            {queueLength} pending
          </span>
        )}
      </div>
      
      {!isOnline && (
        <p className="text-xs mt-1 opacity-75">
          Changes will sync when connection is restored
        </p>
      )}
    </div>
  );
};

export default OfflineIndicator;