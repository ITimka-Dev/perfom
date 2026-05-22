import { useState, useCallback, useEffect } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

interface UpdatedItemTracker {
  [key: string]: boolean;
}

export function useFarmRealtimeUpdates(
  userId: string | null,
  onDataChange?: () => void
) {
  const [updatedPlants, setUpdatedPlants] = useState<UpdatedItemTracker>({});
  const [updatedAnimals, setUpdatedAnimals] = useState<UpdatedItemTracker>({});
  const [updatedProductions, setUpdatedProductions] = useState<UpdatedItemTracker>({});

  const clearUpdateIndicator = useCallback((
    type: 'plant' | 'animal' | 'production',
    id: string
  ) => {
    setTimeout(() => {
      if (type === 'plant') {
        setUpdatedPlants(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      } else if (type === 'animal') {
        setUpdatedAnimals(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      } else if (type === 'production') {
        setUpdatedProductions(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
      }
    }, 2000); // Remove indicator after 2 seconds
  }, []);

  const { isConnected, connectionError } = useRealtimeUpdates({
    userId,
    enableToasts: true,
    onPlantUpdate: (plant) => {
      setUpdatedPlants(prev => ({ ...prev, [plant.id]: true }));
      clearUpdateIndicator('plant', plant.id);
      onDataChange?.();
    },
    onPlantHarvested: ({ plantId }) => {
      setUpdatedPlants(prev => ({ ...prev, [plantId]: true }));
      clearUpdateIndicator('plant', plantId);
      onDataChange?.();
    },
    onAnimalUpdate: (animal) => {
      setUpdatedAnimals(prev => ({ ...prev, [animal.id]: true }));
      clearUpdateIndicator('animal', animal.id);
      onDataChange?.();
    },
    onAnimalCollected: ({ animalId }) => {
      setUpdatedAnimals(prev => ({ ...prev, [animalId]: true }));
      clearUpdateIndicator('animal', animalId);
      onDataChange?.();
    },
    onProductionStarted: (production) => {
      setUpdatedProductions(prev => ({ ...prev, [production.id]: true }));
      clearUpdateIndicator('production', production.id);
      onDataChange?.();
    },
    onProductionCompleted: ({ productionId }) => {
      setUpdatedProductions(prev => ({ ...prev, [productionId]: true }));
      clearUpdateIndicator('production', productionId);
      onDataChange?.();
    },
    onInventoryUpdate: () => {
      onDataChange?.();
    },
  });

  return {
    isConnected,
    connectionError,
    updatedPlants,
    updatedAnimals,
    updatedProductions,
  };
}
