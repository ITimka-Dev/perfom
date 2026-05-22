import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap } from "lucide-react";

interface AchievementCardProps {
  title: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  isUnlocked: boolean;
  icon?: "trophy" | "star" | "zap";
}

const rarityColors = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-primary/20 text-primary",
  epic: "bg-secondary/20 text-secondary-foreground",
  legendary: "bg-accent/20 text-accent-foreground",
};

const rarityLabels = {
  common: "Обычное",
  rare: "Редкое",
  epic: "Эпическое",
  legendary: "Легендарное",
};

const icons = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
};

const AchievementCard = ({
  title,
  description,
  rarity,
  isUnlocked,
  icon = "trophy",
}: AchievementCardProps) => {
  const Icon = icons[icon];
  
  return (
    <Card className={`card-hover ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className={`h-12 w-12 rounded-lg ${rarityColors[rarity]} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{title}</h4>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {rarityLabels[rarity]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementCard;
