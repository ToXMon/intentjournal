import { useEffect, useState } from 'react';
import { paraCompat } from '@/lib/para/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to initialize Para session on app startup
 * This ensures that existing sessions are restored from storage
 */
export function useParaSession() {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        console.log("Initializing Para session...");
        const initialized = await paraCompat.initializeSession();
        
        if (mounted) {
          setIsInitialized(true);
          
          if (initialized) {
            console.log("Para session restored from storage");
            // Trigger account query to update state
            queryClient.invalidateQueries({ queryKey: ["paraAccount"] });
          } else {
            console.log("No existing Para session found");
          }
        }
      } catch (error) {
        console.error("Failed to initialize Para session:", error);
        if (mounted) {
          setIsInitialized(true); // Still mark as initialized to avoid blocking
        }
      }
    };

    initializeSession();

    return () => {
      mounted = false;
    };
  }, [queryClient]);

  return { isInitialized };
}