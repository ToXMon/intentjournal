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
        
        // Add overall timeout for the entire initialization
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Para session initialization timeout')), 5000)
        );
        
        const initialized = await Promise.race([
          paraCompat.initializeSession(),
          timeoutPromise
        ]);
        
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

    // Add a fallback timeout to ensure we don't hang forever
    const fallbackTimeout = setTimeout(() => {
      if (mounted && !isInitialized) {
        console.warn("Para session initialization taking too long, proceeding without it");
        setIsInitialized(true);
      }
    }, 8000);

    initializeSession();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
    };
  }, [queryClient, isInitialized]);

  return { isInitialized };
}