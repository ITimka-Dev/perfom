import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Timer, Plus, Droplets } from "lucide-react";

interface PlantSlotProps {
  slotIndex: number;
  plant?: {
    id: string;
    seedName: string;
    seedEmoji: string;
    plantedAt: string;
    growthTime: number;
    outputEmoji: string;
    needsWater: boolean;
  } | null;
  onPlant?: (slotIndex: number) => void;
  onWater?: (plantId: string) => void;
  onHarvest?: (plantId: string) => void;
  isUpdating?: boolean;
}

const PlantSlot = ({ 
  slotIndex, 
  plant, 
  onPlant, 
  onWater, 
  onHarvest,
  isUpdating = false
}: PlantSlotProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!plant) return;

    const updateTimer = () => {
      const now = Date.now();
      const planted = new Date(plant.plantedAt).getTime();
      const harvestTime = planted + (plant.growthTime * 1000);
      const total = plant.growthTime * 1000;
      const remaining = harvestTime - now;

      if (remaining <= 0) {
        setTimeLeft("Созрело!");
        setProgress(100);
        setIsReady(true);
        return;
      }

      setIsReady(false);
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
      setProgress(Math.round(((total - remaining) / total) * 100));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [plant]);

  return (
    <Card className={`p-4 h-full flex flex-col relative transition-all duration-300 ${isUpdating ? 'ring-2 ring-primary/50 shadow-lg scale-105' : ''}`}>
      {isUpdating && (
        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground animate-pulse">
          Обновлено
        </Badge>
      )}
      {plant?.needsWater && (
        <div className="absolute top-2 right-2">
          <Droplets className="h-5 w-5 text-blue-500 animate-pulse" />
        </div>
      )}
      
      {plant ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-5xl">
              {isReady ? plant.outputEmoji : plant.seedEmoji}
            </span>
            <p className="text-sm font-medium text-center">{plant.seedName}</p>
            
            {!isReady ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm">{timeLeft}</span>
                </div>
                <Progress value={progress} className="w-full" />
                
                {plant.needsWater && (
                  <Button 
                    onClick={() => onWater?.(plant.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Droplets className="h-4 w-4 mr-2" />
                    Полить
                  </Button>
                )}
              </>
            ) : (
              <Button 
                onClick={() => onHarvest?.(plant.id)}
                className="w-full"
                variant="default"
              >
                Собрать урожай
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Button 
            variant="outline" 
            size="lg"
            className="h-full w-full"
            onClick={() => onPlant?.(slotIndex)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PlantSlot;