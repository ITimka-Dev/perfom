import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Heart, Timer, Plus } from "lucide-react";

interface AnimalSlotProps {
  slotIndex: number;
  animal?: {
    id: string;
    name: string;
    emoji: string;
    lastFedAt: string;
    lastCollectedAt: string;
    happiness: number;
    productionTime: number;
    productionEmoji: string;
  } | null;
  onFeed?: (animalId: string) => void;
  onCollect?: (animalId: string) => void;
  onAddAnimal?: (slotIndex: number) => void;
  isUpdating?: boolean;
}

const AnimalSlot = ({ 
  slotIndex, 
  animal, 
  onFeed, 
  onCollect, 
  onAddAnimal,
  isUpdating = false
}: AnimalSlotProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [canCollect, setCanCollect] = useState(false);

  useEffect(() => {
    if (!animal) return;

    const updateTimer = () => {
      const now = Date.now();
      const lastCollected = new Date(animal.lastCollectedAt).getTime();
      const nextCollection = lastCollected + (animal.productionTime * 1000);
      const remaining = nextCollection - now;

      if (remaining <= 0) {
        setTimeLeft("Готово!");
        setCanCollect(true);
        return;
      }

      setCanCollect(false);
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      setTimeLeft(
        hours > 0 
          ? `${hours}ч ${minutes}м` 
          : minutes > 0 
            ? `${minutes}м ${seconds}с` 
            : `${seconds}с`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [animal]);

  return (
    <Card className={`p-4 h-full flex flex-col relative transition-all duration-300 ${isUpdating ? 'ring-2 ring-primary/50 shadow-lg scale-105' : ''}`}>
      {isUpdating && (
        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground animate-pulse">
          Обновлено
        </Badge>
      )}
      {animal ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <span className="text-5xl">{animal.emoji}</span>
              <span className="absolute -bottom-2 -right-2 text-2xl">{animal.productionEmoji}</span>
            </div>
            
            <p className="text-sm font-medium text-center">{animal.name}</p>
            
            <div className="flex items-center gap-2 w-full">
              <Heart className="h-4 w-4 text-destructive" />
              <Progress value={animal.happiness} className="flex-1" />
              <span className="text-xs text-muted-foreground">{animal.happiness}%</span>
            </div>

            {canCollect ? (
              <Button 
                onClick={() => onCollect?.(animal.id)}
                className="w-full"
                variant="default"
              >
                Собрать {animal.productionEmoji}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span className="text-sm">{timeLeft}</span>
              </div>
            )}

            <Button 
              onClick={() => onFeed?.(animal.id)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Покормить
            </Button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Button 
            variant="outline" 
            size="lg"
            className="h-full w-full"
            onClick={() => onAddAnimal?.(slotIndex)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AnimalSlot;