import React from 'react';

export const Debug = () => {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Environment Debug</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h2 className="font-semibold mb-2">Environment Variables:</h2>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(envVars, null, 2)}
            </pre>
          </div>
          
          <div className="p-4 bg-blue-50 rounded">
            <h2 className="font-semibold mb-2">Supabase URL:</h2>
            <p className="font-mono text-sm break-all">
              {envVars.VITE_SUPABASE_URL || <span className="text-red-600">NOT SET</span>}
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded">
            <h2 className="font-semibold mb-2">Supabase Key Present:</h2>
            <p className="font-mono text-sm">
              {envVars.VITE_SUPABASE_ANON_KEY ? 
                <span className="text-green-600">YES (length: {envVars.VITE_SUPABASE_ANON_KEY.length})</span> : 
                <span className="text-red-600">NO</span>
              }
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded">
            <h2 className="font-semibold mb-2">API URL:</h2>
            <p className="font-mono text-sm">
              {envVars.VITE_API_URL || <span className="text-red-600">NOT SET</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};