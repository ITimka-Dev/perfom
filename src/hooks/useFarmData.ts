import { useState, useEffect } from "react";
import { farmApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export interface PlantData {
  id: string;
  slotIndex: number;
  seedName: string;
  seedEmoji: string;
  plantedAt: string;
  growthTime: number;
  outputEmoji: string;
  needsWater: boolean;
  seedItemId: string;
}

export interface AnimalData {
  id: string;
  slotIndex: number;
  name: string;
  emoji: string;
  lastFedAt: string;
  lastCollectedAt: string;
  happiness: number;
  productionTime: number;
  productionEmoji: string;
  animalId: string;
}

export interface ProductionData {
  id: string;
  slotIndex: number;
  chainName: string;
  outputEmoji: string;
  finishAt: string;
  startedAt: string;
  chainId: string;
}

export const useFarmData = (zoneId: string | null, userId: string | null) => {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [animals, setAnimals] = useState<AnimalData[]>([]);
  const [productions, setProductions] = useState<ProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!zoneId || !userId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [zoneId, userId]);

  const loadData = async () => {
    if (!zoneId || !userId) return;

    try {
      setLoading(true);

      const [plantsData, animalsData, productionsData] = await Promise.all([
        farmApi.getUserPlants(zoneId).catch(() => []),
        farmApi.getUserAnimals().catch(() => []),
        farmApi.getUserProductions(zoneId).catch(() => [])
      ]);

      // Map backend camelCase response to frontend interface
      const mappedPlants: PlantData[] = (plantsData || []).map((p: any) => ({
        id: p.id,
        slotIndex: p.slotIndex,
        seedName: p.seedItem?.name || p.seedName || '',
        seedEmoji: p.seedItem?.iconEmoji || p.seedEmoji || '🌱',
        plantedAt: p.plantedAt,
        growthTime: p.seedItem?.productionTime || p.growthTime || 120,
        outputEmoji: p.seedItem?.iconEmoji || p.outputEmoji || '🌾',
        needsWater: p.needsWater || false,
        seedItemId: p.seedItemId,
      }));

      const mappedAnimals: AnimalData[] = (animalsData || []).map((a: any, index: number) => ({
        id: a.id,
        slotIndex: a.slotIndex ?? index,
        name: a.animal?.name || a.name || '',
        emoji: a.animal?.iconEmoji || a.emoji || '🐄',
        lastFedAt: a.lastFedAt,
        lastCollectedAt: a.lastCollectedAt,
        happiness: a.happiness ?? 100,
        productionTime: a.animal?.productionTime || a.productionTime || 0,
        productionEmoji: a.animal?.productionItem?.iconEmoji || a.productionEmoji || '📦',
        animalId: a.animalId,
      }));

      const mappedProductions: ProductionData[] = (productionsData || []).map((p: any) => ({
        id: p.id,
        slotIndex: p.slotIndex,
        chainName: p.chain?.name || p.chainName || '',
        outputEmoji: p.chain?.outputItem?.iconEmoji || p.outputEmoji || '📦',
        finishAt: p.finishAt,
        startedAt: p.startedAt,
        chainId: p.chainId,
      }));

      setPlants(mappedPlants);
      setAnimals(mappedAnimals);
      setProductions(mappedProductions);
    } catch (error) {
      console.error("Error loading farm data:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные фермы",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const harvestPlant = async (plantId: string) => {
    try {
      await farmApi.harvestPlant(plantId);
      toast({
        title: "Собрано! 🌾",
        description: "Урожай добавлен в инвентарь",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось собрать урожай",
        variant: "destructive",
      });
    }
  };

  const collectProduction = async (productionId: string) => {
    try {
      await farmApi.collectProduction(productionId);
      toast({
        title: "Собрано! 📦",
        description: "Продукция добавлена в инвентарь",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось собрать продукцию",
        variant: "destructive",
      });
    }
  };

  const collectFromAnimal = async (userAnimalId: string) => {
    try {
      await farmApi.collectFromAnimal(userAnimalId);
      toast({
        title: "Собрано! 🥛",
        description: "Продукция от животного добавлена в инвентарь",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось собрать продукцию",
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    loadData();
  };

  return {
    plants,
    animals,
    productions,
    loading,
    harvestPlant,
    collectProduction,
    collectFromAnimal,
    refreshData,
  };
};
