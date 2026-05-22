import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { farmApi, zonesApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface ProductionSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  userId: string;
  slotIndex: number;
  onProductionSelected: () => void;
}

interface ProductionChain {
  id: string;
  name: string;
  baseTime: number;
  unlockTasksRequired: number;
  outputItem?: {
    iconEmoji: string;
  };
  ingredients: Array<{
    item: {
      id: string;
      name: string;
      iconEmoji: string;
    };
    quantityNeeded: number;
  }>;
}

export default function ProductionSelectionSheet({
  open,
  onOpenChange,
  zoneId,
  userId,
  slotIndex,
  onProductionSelected,
}: ProductionSelectionSheetProps) {
  const [chains, setChains] = useState<ProductionChain[]>([]);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadProductionChains();
      loadUserProgress();
    }
  }, [open, zoneId]);

  const loadProductionChains = async () => {
    setLoading(true);
    try {
      const allChains = await farmApi.getProductionChains(zoneId);
      setChains(
        (allChains || [])
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            baseTime: c.baseTime || 0,
            unlockTasksRequired: c.unlockTasksRequired || 0,
            outputItem: c.outputItem ? { iconEmoji: c.outputItem.iconEmoji } : undefined,
            ingredients: (c.ingredients || []).map((ing: any) => ({
              item: {
                id: ing.item?.id || ing.itemId,
                name: ing.item?.name || 'Ресурс',
                iconEmoji: ing.item?.iconEmoji || '📦',
              },
              quantityNeeded: ing.quantityNeeded || 1,
            })),
          }))
          .sort((a: ProductionChain, b: ProductionChain) => a.unlockTasksRequired - b.unlockTasksRequired)
      );
    } catch (error) {
      console.error("Error loading production chains:", error);
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

  const handleStartProduction = async (chainId: string) => {
    try {
      await farmApi.startProduction({
        chainId,
        zoneId,
        slotIndex,
      });

      toast({
        title: "Успешно ⚙️",
        description: "Производство запущено",
      });
      onProductionSelected();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось запустить производство",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Выберите рецепт</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
          ) : chains.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Нет доступных рецептов для этой зоны</div>
          ) : (
            chains
              .filter((chain) => {
                const isUnlocked = tasksCompleted >= chain.unlockTasksRequired;
                if (isUnlocked) return true;
                const firstLocked = chains.find(c => c.unlockTasksRequired > tasksCompleted);
                return chain.id === firstLocked?.id;
              })
              .map((chain) => {
                const isUnlocked = tasksCompleted >= chain.unlockTasksRequired;
                return (
                  <Card
                    key={chain.id}
                    className={`p-4 ${!isUnlocked ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{chain.outputItem?.iconEmoji || '📦'}</span>
                          <div>
                            <p className="font-medium">{chain.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Время: {Math.floor(chain.baseTime / 60)} мин
                            </p>
                          </div>
                        </div>
                        {chain.ingredients.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Требуется:{" "}
                            {chain.ingredients.map((ing, i) => (
                              <span key={i}>
                                {ing.quantityNeeded}x {ing.item.iconEmoji} {ing.item.name}
                                {i < chain.ingredients.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        )}
                        {!isUnlocked && (
                          <p className="text-xs text-destructive mt-1">
                            Требуется {chain.unlockTasksRequired} заданий
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleStartProduction(chain.id)}
                        disabled={!isUnlocked}
                        size="sm"
                      >
                        {isUnlocked ? "Начать" : <Lock className="h-4 w-4" />}
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
