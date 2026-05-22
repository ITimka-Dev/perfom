import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Timer, Sparkles } from "lucide-react";
import ProductionSlot from "./ProductionSlot";
import AnimalSlot from "./AnimalSlot";
import PlantSlot from "./PlantSlot";
import PlantSelectionSheet from "./PlantSelectionSheet";
import AnimalSelectionSheet from "./AnimalSelectionSheet";
import ProductionSelectionSheet from "./ProductionSelectionSheet";
import { useFarmData } from "@/hooks/useFarmData";
import { useFarmRealtimeUpdates } from "@/hooks/useFarmRealtimeUpdates";
import { useAuth } from "@/hooks/useAuth";
import { farmApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface FarmZoneViewProps {
  zoneName: string;
  zoneType: string;
  zoneId: string;
  onBack: () => void;
}

const FarmZoneView = ({ 
  zoneName, 
  zoneType,
  zoneId,
  onBack
}: FarmZoneViewProps) => {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [plantSheetOpen, setPlantSheetOpen] = useState(false);
  const [animalSheetOpen, setAnimalSheetOpen] = useState(false);
  const [productionSheetOpen, setProductionSheetOpen] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  
  const { toast } = useToast();
  
  // Determine which tabs to show based on zone type
  const showPlants = zoneType === "biology";
  const showAnimals = zoneType === "biology";
  const showProduction = zoneType === "physics";
  const showBoosters = ["chemistry", "mathematics", "math", "it"].includes(zoneType);

  const defaultTab = showPlants ? "plants" : showAnimals ? "animals" : showProduction ? "production" : "boosters";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Boosters state
  const [boosters, setBoosters] = useState<any[]>([]);
  const [activeBoosters, setActiveBoosters] = useState<any[]>([]);
  const [boostersLoading, setBoostersLoading] = useState(false);


  // Load boosters for booster zones
  useEffect(() => {
    if (showBoosters && zoneId) {
      setBoostersLoading(true);
      Promise.all([
        farmApi.getZoneBoosters(zoneId).catch(() => []),
        userId ? farmApi.getUserActiveBoosters().catch(() => []) : Promise.resolve([]),
      ]).then(([zoneBoosters, userBoosters]) => {
        setBoosters(zoneBoosters || []);
        setActiveBoosters(userBoosters || []);
      }).finally(() => setBoostersLoading(false));
    }
  }, [showBoosters, zoneId, userId]);

  const { plants, animals, productions, loading, harvestPlant, collectProduction, collectFromAnimal, refreshData } = useFarmData(zoneId, userId);
  
  // WebSocket real-time updates with visual indicators
  const { updatedPlants, updatedAnimals, updatedProductions } = useFarmRealtimeUpdates(
    userId,
    refreshData
  );

  const activateBooster = async (boosterId: string) => {
    try {
      await farmApi.activateBooster(boosterId);
      toast({ title: "Успешно", description: "Бустер активирован!" });
      // Refresh boosters
      const [zoneBoosters, userBoosters] = await Promise.all([
        farmApi.getZoneBoosters(zoneId).catch(() => []),
        farmApi.getUserActiveBoosters().catch(() => []),
      ]);
      setBoosters(zoneBoosters || []);
      setActiveBoosters(userBoosters || []);
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message || "Не удалось активировать бустер", variant: "destructive" });
    }
  };

  // Create slots arrays with proper indexing
  const plantSlots = Array.from({ length: 6 }, (_, i) => {
    const plant = plants.find(p => p.slotIndex === i);
    return {
      slotIndex: i,
      plant: plant ? {
        id: plant.id,
        seedName: plant.seedName,
        seedEmoji: plant.seedEmoji,
        plantedAt: plant.plantedAt,
        growthTime: plant.growthTime,
        outputEmoji: plant.outputEmoji,
        needsWater: plant.needsWater
      } : null
    };
  });

  const animalSlots = Array.from({ length: 4 }, (_, i) => {
    const animal = animals.find(a => a.slotIndex === i);
    return {
      slotIndex: i,
      animal: animal ? {
        id: animal.id,
        name: animal.name,
        emoji: animal.emoji,
        lastFedAt: animal.lastFedAt,
        lastCollectedAt: animal.lastCollectedAt,
        happiness: animal.happiness,
        productionTime: animal.productionTime,
        productionEmoji: animal.productionEmoji
      } : null
    };
  });

  const productionSlots = Array.from({ length: 3 }, (_, i) => {
    const production = productions.find(p => p.slotIndex === i);
    return {
      slotIndex: i,
      production: production ? {
        id: production.id,
        chainName: production.chainName,
        outputEmoji: production.outputEmoji,
        finishAt: production.finishAt,
        startedAt: production.startedAt
      } : null
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold gradient-text">{zoneName}</h2>
            <p className="text-sm text-muted-foreground">
              {showBoosters && "Бустеры для ускорения производства"}
              {showProduction && "Производственные цепочки"}
              {showPlants && showAnimals && "Растения и животные"}
            </p>
          </div>
        </div>
      </div>

      {loading || boostersLoading ? (
        <div className="text-center py-8">Загрузка...</div>
      ) : showBoosters ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Бустеры зоны
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {zoneType === "chemistry" && "Ускорение скорости выращивания и скотоводства в Биологии"}
            {(zoneType === "mathematics" || zoneType === "math") && "Ускорения и бонусы цепочек производства в Физике"}
            {zoneType === "it" && "Бонусы для Биологии и Физики одновременно (откат ×2)"}
          </p>
          {boosters.length === 0 ? (
            <Card className="p-6">
              <div className="text-center space-y-4">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Пока нет бустеров</h3>
                  <p className="text-sm text-muted-foreground">
                    Выполняй задания, чтобы открыть бустеры для этой зоны
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boosters.map((booster) => {
                const isActive = activeBoosters.some(ab => ab.boosterId === booster.id && new Date(ab.expiresAt) > new Date());
                const onCooldown = activeBoosters.some(ab => ab.boosterId === booster.id && new Date(ab.canActivateAgainAt) > new Date());
                return (
                  <Card key={booster.id} className={`p-4 ${isActive ? 'border-primary ring-2 ring-primary/20' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{booster.name}</span>
                          {isActive && <Badge variant="default" className="text-xs">Активен</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{booster.description}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {Math.floor(booster.duration / 60)} мин
                          </span>
                          <span>×{booster.speedMultiplier} скорость</span>
                          <span>Откат: {Math.floor(booster.cooldown / 60)} мин</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isActive || onCooldown || !userId}
                        onClick={() => activateBooster(booster.id)}
                      >
                        {isActive ? "Активен" : onCooldown ? "Откат" : "Активировать"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${showPlants && showAnimals ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showPlants && <TabsTrigger value="plants">Растения</TabsTrigger>}
            {showAnimals && <TabsTrigger value="animals">Животные</TabsTrigger>}
            {showProduction && <TabsTrigger value="production">Производство</TabsTrigger>}
          </TabsList>

          {showPlants && (
            <TabsContent value="plants" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {plantSlots.map((slot) => (
                  <PlantSlot
                    key={slot.slotIndex}
                    slotIndex={slot.slotIndex}
                    plant={slot.plant}
                    onPlant={(index) => {
                      setSelectedSlotIndex(index);
                      setPlantSheetOpen(true);
                    }}
                    onWater={(id) => console.log('Water', id)}
                    onHarvest={harvestPlant}
                    isUpdating={slot.plant ? updatedPlants[slot.plant.id] : false}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {showAnimals && (
            <TabsContent value="animals" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {animalSlots.map((slot) => (
                  <AnimalSlot
                    key={slot.slotIndex}
                    slotIndex={slot.slotIndex}
                    animal={slot.animal}
                    onFeed={(id) => console.log('Feed', id)}
                    onCollect={collectFromAnimal}
                    onAddAnimal={() => setAnimalSheetOpen(true)}
                    isUpdating={slot.animal ? updatedAnimals[slot.animal.id] : false}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {showProduction && (
            <TabsContent value="production" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {productionSlots.map((slot) => (
                  <ProductionSlot
                    key={slot.slotIndex}
                    slotIndex={slot.slotIndex}
                    production={slot.production}
                    onCollect={collectProduction}
                    onStartProduction={(index) => {
                      setSelectedSlotIndex(index);
                      setProductionSheetOpen(true);
                    }}
                    isUpdating={slot.production ? updatedProductions[slot.production.id] : false}
                  />
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {userId && (
        <>
          <PlantSelectionSheet
            open={plantSheetOpen}
            onOpenChange={setPlantSheetOpen}
            zoneId={zoneId}
            userId={userId}
            slotIndex={selectedSlotIndex}
            onPlantSelected={refreshData}
          />

          <AnimalSelectionSheet
            open={animalSheetOpen}
            onOpenChange={setAnimalSheetOpen}
            zoneId={zoneId}
            userId={userId}
            onAnimalSelected={refreshData}
          />

          <ProductionSelectionSheet
            open={productionSheetOpen}
            onOpenChange={setProductionSheetOpen}
            zoneId={zoneId}
            userId={userId}
            slotIndex={selectedSlotIndex}
            onProductionSelected={refreshData}
          />
        </>
      )}
    </div>
  );
};

export default FarmZoneView;