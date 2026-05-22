import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { farmApi, zonesApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface AnimalSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  userId: string;
  onAnimalSelected: () => void;
}

interface Animal {
  id: string;
  name: string;
  iconEmoji: string;
  productionTime: number;
  unlockTasksRequired: number;
}

export default function AnimalSelectionSheet({
  open,
  onOpenChange,
  zoneId,
  userId,
  onAnimalSelected,
}: AnimalSelectionSheetProps) {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAnimals();
      loadUserProgress();
    }
  }, [open, zoneId]);

  const loadAnimals = async () => {
    setLoading(true);
    try {
      const allAnimals = await farmApi.getFarmAnimals();
      // Filter animals for this zone
      const zoneAnimals = (allAnimals || []).filter(
        (a: any) => a.zoneId === zoneId
      );
      setAnimals(
        zoneAnimals
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            iconEmoji: a.iconEmoji,
            productionTime: a.productionTime || 0,
            unlockTasksRequired: a.unlockTasksRequired || 0,
          }))
          .sort((a: Animal, b: Animal) => a.unlockTasksRequired - b.unlockTasksRequired)
      );
    } catch (error) {
      console.error("Error loading animals:", error);
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

  const handleAddAnimal = async (animalId: string) => {
    try {
      await farmApi.addAnimal(animalId);
      
      toast({
        title: "Успешно 🐄",
        description: "Животное добавлено на ферму",
      });
      onAnimalSelected();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить животное",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Выберите животное</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
          ) : animals.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Нет доступных животных для этой зоны</div>
          ) : (
            animals
              .filter((animal) => {
                const isUnlocked = tasksCompleted >= animal.unlockTasksRequired;
                if (isUnlocked) return true;
                const firstLocked = animals.find(a => a.unlockTasksRequired > tasksCompleted);
                return animal.id === firstLocked?.id;
              })
              .map((animal) => {
                const isUnlocked = tasksCompleted >= animal.unlockTasksRequired;
                return (
                  <Card
                    key={animal.id}
                    className={`p-4 ${!isUnlocked ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{animal.iconEmoji}</span>
                        <div>
                          <p className="font-medium">{animal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Производство: {Math.floor(animal.productionTime / 60)} мин
                          </p>
                          {!isUnlocked && (
                            <p className="text-xs text-destructive">
                              Требуется {animal.unlockTasksRequired} заданий
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddAnimal(animal.id)}
                        disabled={!isUnlocked}
                        size="sm"
                      >
                        {isUnlocked ? "Добавить" : <Lock className="h-4 w-4" />}
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
