import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { websocketManager } from './websocketManager';

interface RealtimeConfig {
  userId: string | null;
  onPlantUpdate?: (plant: any) => void;
  onPlantHarvested?: (data: { plantId: string; item: any }) => void;
  onAnimalUpdate?: (animal: any) => void;
  onAnimalCollected?: (data: { animalId: string; item: any }) => void;
  onProductionStarted?: (production: any) => void;
  onProductionCompleted?: (data: { productionId: string; item: any }) => void;
  onInventoryUpdate?: (inventory: any) => void;
  onPetCreated?: (pet: any) => void;
  onPetStatsUpdate?: (pet: any) => void;
  onPetFed?: (pet: any) => void;
  onPetWatered?: (pet: any) => void;
  onPetPlayed?: (pet: any) => void;
  onPetItemUsed?: (data: { pet: any; item: any }) => void;
  onPetRanAway?: (data: { petId: string }) => void;
  enableToasts?: boolean;
}

export function useRealtimeUpdates(config: RealtimeConfig) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wasDisconnectedRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const configRef = useRef(config);
  const toastRef = useRef(toast);
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  // Update refs when values change (no effect re-runs)
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const showToast = config.enableToasts !== false;
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // Stable userId for effect dependency
  const userId = config.userId;

  useEffect(() => {
    if (!userId) return;

    // Connect to WebSocket manager (singleton - only one connection per user)
    websocketManager.connect(userId);
    
    // Update connection state
    setIsConnected(websocketManager.isConnected());

    // Subscribe to connection events
    const unsubscribeFarmConnected = websocketManager.on('farm:connected', () => {
      setIsConnected(websocketManager.isConnected());
      setConnectionError(null);
      
      if (wasDisconnectedRef.current && !isInitialMountRef.current && showToastRef.current) {
        toastRef.current({
          title: '✅ Подключено',
          description: 'WebSocket соединение восстановлено',
        });
      }
      
      wasDisconnectedRef.current = false;
      isInitialMountRef.current = false;
    });

    const unsubscribeFarmDisconnected = websocketManager.on('farm:disconnected', (reason: string) => {
      setIsConnected(websocketManager.isConnected());
      wasDisconnectedRef.current = true;
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setConnectionError('Соединение разорвано. Переподключение...');
      }
    });

    const unsubscribeFarmError = websocketManager.on('farm:error', (error: any) => {
      setConnectionError(error.message);
      wasDisconnectedRef.current = true;
    });

    const unsubscribePetConnected = websocketManager.on('pet:connected', () => {
      setIsConnected(websocketManager.isConnected());
    });

    const unsubscribePetDisconnected = websocketManager.on('pet:disconnected', () => {
      setIsConnected(websocketManager.isConnected());
    });

    const unsubscribePetError = websocketManager.on('pet:error', (error: any) => {
      setConnectionError(error.message);
    });

    // Subscribe to farm events
    const unsubscribePlantUpdated = websocketManager.on('plant:updated', (plant: any) => {
      configRef.current.onPlantUpdate?.(plant);
    });

    const unsubscribePlantHarvested = websocketManager.on('plant:harvested', (data: any) => {
      configRef.current.onPlantHarvested?.(data);
      if (showToastRef.current) {
        toastRef.current({
          title: '🌾 Урожай собран!',
          description: `Вы собрали ${data.item?.name || 'урожай'}`,
        });
      }
    });

    const unsubscribeAnimalUpdated = websocketManager.on('animal:updated', (animal: any) => {
      configRef.current.onAnimalUpdate?.(animal);
    });

    const unsubscribeAnimalCollected = websocketManager.on('animal:collected', (data: any) => {
      configRef.current.onAnimalCollected?.(data);
      if (showToastRef.current) {
        toastRef.current({
          title: '🥚 Продукт собран!',
          description: `Вы собрали ${data.item?.name || 'продукт'}`,
        });
      }
    });

    const unsubscribeProductionStarted = websocketManager.on('production:started', (production: any) => {
      configRef.current.onProductionStarted?.(production);
      if (showToastRef.current) {
        toastRef.current({
          title: '⚙️ Производство начато',
          description: `Производство ${production.chainName || ''} началось`,
        });
      }
    });

    const unsubscribeProductionCompleted = websocketManager.on('production:completed', (data: any) => {
      configRef.current.onProductionCompleted?.(data);
      if (showToastRef.current) {
        toastRef.current({
          title: '✅ Производство завершено!',
          description: `Готово: ${data.item?.name || 'продукт'}`,
        });
      }
    });

    const unsubscribeInventoryUpdated = websocketManager.on('inventory:updated', (inventory: any) => {
      configRef.current.onInventoryUpdate?.(inventory);
    });

    // Subscribe to pet events
    const unsubscribePetCreated = websocketManager.on('pet:created', (pet: any) => {
      configRef.current.onPetCreated?.(pet);
      if (showToastRef.current) {
        toastRef.current({
          title: '🐾 Питомец создан!',
          description: `Добро пожаловать, ${pet.name || 'питомец'}!`,
        });
      }
    });

    const unsubscribePetStatsUpdated = websocketManager.on('pet:statsUpdated', (pet: any) => {
      configRef.current.onPetStatsUpdate?.(pet);
    });

    const unsubscribePetFed = websocketManager.on('pet:fed', (pet: any) => {
      configRef.current.onPetFed?.(pet);
      if (showToastRef.current) {
        toastRef.current({
          title: '🍖 Питомец накормлен',
          description: `${pet.name || 'Питомец'} доволен!`,
        });
      }
    });

    const unsubscribePetWatered = websocketManager.on('pet:watered', (pet: any) => {
      configRef.current.onPetWatered?.(pet);
      if (showToastRef.current) {
        toastRef.current({
          title: '💧 Питомец напоен',
          description: `${pet.name || 'Питомец'} больше не хочет пить`,
        });
      }
    });

    const unsubscribePetPlayed = websocketManager.on('pet:played', (pet: any) => {
      configRef.current.onPetPlayed?.(pet);
      if (showToastRef.current) {
        toastRef.current({
          title: '🎮 Время игры!',
          description: `${pet.name || 'Питомец'} счастлив`,
        });
      }
    });

    const unsubscribePetItemUsed = websocketManager.on('pet:itemUsed', (data: any) => {
      configRef.current.onPetItemUsed?.(data);
      if (showToastRef.current) {
        toastRef.current({
          title: '✨ Предмет использован',
          description: `${data.item?.name || 'Предмет'} применён на ${data.pet?.name || 'питомца'}`,
        });
      }
    });

    const unsubscribePetRanAway = websocketManager.on('pet:ranAway', (data: any) => {
      configRef.current.onPetRanAway?.(data);
      if (showToastRef.current) {
        toastRef.current({
          title: '😢 Питомец убежал',
          description: 'Ваш питомец покинул вас из-за плохого ухода',
          variant: 'destructive',
        });
      }
    });

    // Store all unsubscribe functions
    unsubscribeRefs.current = [
      unsubscribeFarmConnected,
      unsubscribeFarmDisconnected,
      unsubscribeFarmError,
      unsubscribePetConnected,
      unsubscribePetDisconnected,
      unsubscribePetError,
      unsubscribePlantUpdated,
      unsubscribePlantHarvested,
      unsubscribeAnimalUpdated,
      unsubscribeAnimalCollected,
      unsubscribeProductionStarted,
      unsubscribeProductionCompleted,
      unsubscribeInventoryUpdated,
      unsubscribePetCreated,
      unsubscribePetStatsUpdated,
      unsubscribePetFed,
      unsubscribePetWatered,
      unsubscribePetPlayed,
      unsubscribePetItemUsed,
      unsubscribePetRanAway,
    ];

    return () => {
      // Unsubscribe from all events (but don't disconnect - other components might be using it)
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [userId]); // Only re-run when userId changes

  return {
    isConnected,
    connectionError,
    farmSocket: websocketManager.getFarmSocket(),
    petSocket: websocketManager.getPetSocket(),
  };
}