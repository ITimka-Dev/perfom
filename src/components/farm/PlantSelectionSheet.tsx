import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { farmApi, zonesApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface PlantSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  userId: string;
  slotIndex: number;
  onPlantSelected: () => void;
}

interface SeedItem {
  id: string;
  name: string;
  iconEmoji: string;
  productionTime: number;
  unlockTasksRequired: number;
}

export default function PlantSelectionSheet({
  open,
  onOpenChange,
  zoneId,
  userId,
  slotIndex,
  onPlantSelected,
}: PlantSelectionSheetProps) {
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSeeds();
      loadUserProgress();
    }
  }, [open, zoneId]);

  const loadSeeds = async () => {
    setLoading(true);
    try {
      const allItems = await farmApi.getFarmItems();
      // Filter seeds for this zone
      const zoneSeeds = (allItems || []).filter(
        (item: any) => item.category === 'seed' && item.zoneId === zoneId
      );
      setSeeds(
        zoneSeeds
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            iconEmoji: item.iconEmoji,
            productionTime: item.productionTime || 120,
            unlockTasksRequired: item.unlockTasksRequired || 0,
          }))
          .sort((a: SeedItem, b: SeedItem) => a.unlockTasksRequired - b.unlockTasksRequired)
      );
    } catch (error) {
      console.error("Error loading seeds:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const progressData = await zonesApi.getUserProgress();
      const zoneProgress = (progressData || []).find((p: any) => p.zoneId === zoneId || p.zone_id === zoneId);
      if (zoneProgress) {
        setTasksCompleted(zoneProgress.tasksCompleted || zoneProgress.tasks_completed || 0);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const handlePlantSeed = async (seedId: string) => {
    try {
      await farmApi.plantSeed({
        seedItemId: seedId,
        zoneId,
        slotIndex,
      });
      
      toast({
        title: "Успешно 🌱",
        description: "Растение посажено",
      });
      onPlantSelected();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось посадить растение",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Выберите растение</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
          ) : seeds.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Нет доступных семян для этой зоны</div>
          ) : (
            seeds
              .filter((seed) => {
                const isUnlocked = tasksCompleted >= seed.unlockTasksRequired;
                if (isUnlocked) return true;
                const firstLocked = seeds.find(s => s.unlockTasksRequired > tasksCompleted);
                return seed.id === firstLocked?.id;
              })
              .map((seed) => {
                const isUnlocked = tasksCompleted >= seed.unlockTasksRequired;
                return (
                  <Card
                    key={seed.id}
                    className={`p-4 ${!isUnlocked ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{seed.iconEmoji}</span>
                        <div>
                          <p className="font-medium">{seed.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Время роста: {Math.floor(seed.productionTime / 60)} мин
                          </p>
                          {!isUnlocked && (
                            <p className="text-xs text-destructive">
                              Требуется {seed.unlockTasksRequired} заданий
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handlePlantSeed(seed.id)}
                        disabled={!isUnlocked}
                        size="sm"
                      >
                        {isUnlocked ? "Посадить" : <Lock className="h-4 w-4" />}
                      </Button>
                    </div>
                  </Card>
                );
              })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
