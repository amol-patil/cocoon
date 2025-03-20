'use client';

import { useEffect, useState } from 'react';
import { getDB } from '@/lib/storage/indexeddb';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize the database
        await getDB();
        setIsReady(true);
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      }
    };

    init();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Database Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 