import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";

interface FarmZoneCardProps {
  title: string;
  description: string;
  icon: string;
  level: number;
  progress: number;
  isLocked?: boolean;
  tasksCompleted: number;
  totalTasks: number;
}

const FarmZoneCard = ({
  title,
  description,
  icon,
  level,
  progress,
  isLocked = false,
  tasksCompleted,
  totalTasks,
}: FarmZoneCardProps) => {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 cursor-pointer ${isLocked ? 'opacity-60' : ''}`}>
      {isLocked && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-muted rounded-full p-2">
            <Lock className="h-4 w-4" />
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group">
          <img 
            src={icon} 
            alt={title}
            className="h-24 w-24 object-contain transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Прогресс</span>
            <Badge variant="secondary">Уровень {level}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Заданий выполнено: {tasksCompleted} / {totalTasks}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmZoneCard;
