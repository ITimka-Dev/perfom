import { useState, useEffect, useCallback, useRef } from "react";
import { petApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface Pet {
  id: string;
  name: string;
  type: "cow" | "chicken" | "sheep";
  hunger: number;
  thirst: number;
  happiness: number;
  createdAt: string;
  lastFedAt: string;
  lastWateredAt: string;
  lastPlayedAt: string;
  ranAwayAt: string | null;
}

export const usePetApi = () => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isRefreshingRef = useRef(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    loadPet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPet = useCallback(async (skipLoadingState = false) => {
    // Clear any pending refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Prevent concurrent refreshes
    if (isRefreshingRef.current && skipLoadingState) {
      console.log('[usePetApi] Skipping concurrent refresh');
      return;
    }
    
    try {
      isRefreshingRef.current = true;
      console.log('[usePetApi] Loading pet, skipLoadingState:', skipLoadingState);
      if (!skipLoadingState) {
        setLoading(true);
      }
      const data = await petApi.getUserPet();
      console.log('[usePetApi] Pet loaded:', data?.id);
      
      // Always update - the React reconciliation will handle duplicates
      setPet(data as Pet | null);
    } catch (error: any) {
      console.error("Error loading pet:", error);
      if (!error.message.includes("not found")) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить питомца",
          variant: "destructive",
        });
      } else {
        // Pet not found - clear state
        setPet(null);
      }
    } finally {
      if (!skipLoadingState) {
        setLoading(false);
      }
      isRefreshingRef.current = false;
    }
  }, [toast]);

  // Debounced refresh function to prevent rapid updates
  const debouncedRefreshPet = useCallback(() => {
    // If already refreshing, don't schedule another
    if (isRefreshingRef.current) {
      console.log('[usePetApi] Already refreshing, skipping');
      return;
    }
    
    // Clear any pending refresh
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    // Schedule refresh with debounce (increased to 1000ms to prevent rapid calls)
    refreshTimeoutRef.current = setTimeout(() => {
      // Double-check we're not already refreshing
      if (!isRefreshingRef.current) {
        console.log('[usePetApi] Executing debounced refresh');
        loadPet(true); // Skip loading state for debounced refreshes
      }
      refreshTimeoutRef.current = null;
    }, 1000);
  }, [loadPet]);

  const createPet = useCallback(async (name: string, type: "cow" | "chicken" | "sheep") => {
    // Prevent creating if pet already exists
    if (pet && !pet.ranAwayAt) {
      console.warn('[usePetApi] Pet already exists, skipping creation');
      toast({
        title: "Ошибка",
        description: "У вас уже есть питомец",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('[usePetApi] Creating pet:', { name, type });
      const data = await petApi.createPet({ name, type });
      console.log('[usePetApi] Pet created successfully, data:', (data as any)?.id);
      
      // Update state immediately for instant feedback
      // WebSocket event will also arrive, but throttling will prevent duplicate refresh
      setPet(data as Pet);
      // Mark that we just updated to prevent immediate WebSocket refresh
      lastUpdateRef.current = Date.now();
    } catch (error: any) {
      console.error('[usePetApi] Error creating pet:', error);
      const errorMessage = error.message || "Не удалось создать питомца";
      
      // Check if error is about existing pet
      if (errorMessage.includes('already has a pet') || errorMessage.includes('уже есть')) {
        // Refresh pet data in case it exists
        setTimeout(() => {
          loadPet();
        }, 500);
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; // Re-throw to let caller know it failed
    }
  }, [toast, pet, loadPet]);

  const feedPet = useCallback(async () => {
    try {
      const data = await petApi.feedPet();
      setPet(data as Pet);
      // Don't show toast - WebSocket event will handle it
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const waterPet = useCallback(async () => {
    try {
      const data = await petApi.waterPet();
      setPet(data as Pet);
      // Don't show toast - WebSocket event will handle it
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const playWithPet = useCallback(async () => {
    try {
      const data = await petApi.playWithPet();
      setPet(data as Pet);
      // Don't show toast - WebSocket event will handle it
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    pet,
    loading,
    createPet,
    feedPet,
    waterPet,
    playWithPet,
    refreshPet: debouncedRefreshPet,
  };
};
