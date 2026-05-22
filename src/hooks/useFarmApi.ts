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

export const useFarmApi = (zoneId: string | null) => {
  const [plants, setPlants] = useState<PlantData[]>([]);
  const [animals, setAnimals] = useState<AnimalData[]>([]);
  const [productions, setProductions] = useState<ProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!zoneId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [zoneId]);

  const loadData = async () => {
    if (!zoneId) return;

    try {
      setLoading(true);

      // Load plants
      const plantsData = await farmApi.getUserPlants(zoneId);
      const formattedPlants = (plantsData || []).map((p: any) => ({
        id: p.id,
        slotIndex: p.slotIndex,
        seedName: p.seedItem?.name || "",
        seedEmoji: p.seedItem?.iconEmoji || "",
        plantedAt: p.plantedAt,
        growthTime: p.seedItem?.productionTime || 120,
        outputEmoji: p.seedItem?.iconEmoji || "",
        needsWater: p.needsWater,
        seedItemId: p.seedItemId,
      }));
      setPlants(formattedPlants);

      // Load animals
      const animalsData = await farmApi.getUserAnimals();
      const formattedAnimals = (animalsData || []).map((a: any, index: number) => ({
        id: a.id,
        slotIndex: index,
        name: a.animal?.name || "",
        emoji: a.animal?.iconEmoji || "",
        lastFedAt: a.lastFedAt,
        lastCollectedAt: a.lastCollectedAt,
        happiness: a.happiness,
        productionTime: a.animal?.productionTime || 0,
        productionEmoji: a.animal?.productionItem?.iconEmoji || "",
        animalId: a.animalId,
      }));
      setAnimals(formattedAnimals);

      // Load productions
      const productionsData = await farmApi.getUserProductions(zoneId);
      const formattedProductions = (productionsData || []).map((p: any) => ({
        id: p.id,
        slotIndex: p.slotIndex,
        chainName: p.chain?.name || "",
        outputEmoji: p.chain?.outputItem?.iconEmoji || "",
        finishAt: p.finishAt,
        startedAt: p.startedAt,
        chainId: p.chainId,
      }));
      setProductions(formattedProductions);

    } catch (error: any) {
      console.error("Error loading farm data:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message,
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
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const collectProduction = async (productionId: string) => {
    try {
      await farmApi.collectProduction(productionId);
      toast({
        title: "Собрано! 📦",
        description: "Продукт добавлен в инвентарь",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const collectFromAnimal = async (animalId: string) => {
    try {
      await farmApi.collectFromAnimal(animalId);
      toast({
        title: "Собрано! 🥛",
        description: "Продукт добавлен в инвентарь",
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    plants,
    animals,
    productions,
    loading,
    harvestPlant,
    collectProduction,
    collectFromAnimal,
    refreshData: loadData,
  };
};
