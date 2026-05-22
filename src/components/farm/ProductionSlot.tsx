import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Timer, Plus } from "lucide-react";

interface ProductionSlotProps {
  slotIndex: number;
  production?: {
    id: string;
    chainName: string;
    outputEmoji: string;
    finishAt: string;
    startedAt: string;
  } | null;
  onCollect?: (productionId: string) => void;
  onStartProduction?: (slotIndex: number) => void;
  isUpdating?: boolean;
}

const ProductionSlot = ({ 
  slotIndex, 
  production, 
  onCollect, 
  onStartProduction,
  isUpdating = false
}: ProductionSlotProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!production) return;

    const updateTimer = () => {
      const now = Date.now();
      const finish = new Date(production.finishAt).getTime();
      const started = new Date(production.startedAt).getTime();
      const total = finish - started;
      const remaining = finish - now;

      if (remaining <= 0) {
        setTimeLeft("Готово!");
        setProgress(100);
        return;
      }

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
  }, [production]);

  const isReady = production && new Date(production.finishAt) <= new Date();

  return (
    <Card className={`p-4 h-full flex flex-col relative transition-all duration-300 ${isUpdating ? 'ring-2 ring-primary/50 shadow-lg scale-105' : ''}`}>
      {isUpdating && (
        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground animate-pulse">
          Обновлено
        </Badge>
      )}
      {production ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-5xl">{production.outputEmoji}</span>
            <p className="text-sm font-medium text-center">{production.chainName}</p>
            
            {!isReady ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm">{timeLeft}</span>
                </div>
                <Progress value={progress} className="w-full" />
              </>
            ) : (
              <Button 
                onClick={() => onCollect?.(production.id)}
                className="w-full"
                variant="default"
              >
                Собрать
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
            onClick={() => onStartProduction?.(slotIndex)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ProductionSlot;