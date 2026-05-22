import { useState, useCallback } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { useNotificationSettings } from './useNotificationSettings';

export function usePetRealtimeUpdates(
  userId: string | null,
  onDataChange?: () => void
) {
  const [petUpdateTimestamp, setPetUpdateTimestamp] = useState<number | null>(null);
  const { shouldShowToast } = useNotificationSettings();

  const clearPetUpdateIndicator = useCallback(() => {
    setTimeout(() => {
      setPetUpdateTimestamp(null);
    }, 2000); // Remove indicator after 2 seconds
  }, []);

  const { isConnected, connectionError } = useRealtimeUpdates({
    userId,
    enableToasts: shouldShowToast('pet'),
    onPetCreated: () => {
      setPetUpdateTimestamp(Date.now());
      clearPetUpdateIndicator();
      onDataChange?.();
    },
    onPetStatsUpdate: () => {
      setPetUpdateTimestamp(Date.now());
      clearPetUpdateIndicator();
      onDataChange?.();
    },
    onPetFed: () => {
      setPetUpdateTimestamp(Date.now());
      clearPetUpdateIndicator();
      onDataChange?.();
    },
    onPetWatered: () => {
      setPetUpdateTimestamp(Date.now());
      clearPetUpdateIndicator();
      onDataChange?.();
    },
    onPetPlayed: () => {
      setPetUpdateTimestamp(Date.now());
      clearPetUpdateIndicator();
      onDataChange?.();
    },
    onPetItemUsed: () => {
      setPetUpdateTimestamp(Date.now());
      clearPetUpdateIndicator();
      onDataChange?.();
    },
    onPetRanAway: () => {
      onDataChange?.();
    },
  });

  return {
    isConnected,
    connectionError,
    isPetUpdating: petUpdateTimestamp !== null,
    petUpdateTimestamp,
  };
}
