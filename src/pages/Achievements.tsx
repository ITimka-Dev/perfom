import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { achievementsApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Lock,
  Sparkles,
  Target,
  Flame,
  Crown,
  Star,
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  conditionType: string;
  conditionValue: number;
}

interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;
  achievement: Achievement;
}

const RARITY_CONFIG = {
  common: {
    label: "Обычное",
    border: "border-border",
    bg: "bg-muted/50",
    badge: "bg-muted text-muted-foreground",
    icon: Star,
    glow: "",
  },
  rare: {
    label: "Редкое",
    border: "border-primary/40",
    bg: "bg-primary/5",
    badge: "bg-primary/20 text-primary",
    icon: Sparkles,
    glow: "shadow-[0_0_15px_hsl(var(--primary)/0.15)]",
  },
  epic: {
    label: "Эпическое",
    border: "border-secondary/60",
    bg: "bg-secondary/5",
    badge: "bg-secondary/20 text-secondary-foreground",
    icon: Flame,
    glow: "shadow-[0_0_20px_hsl(var(--secondary)/0.2)]",
  },
  legendary: {
    label: "Легендарное",
    border: "border-accent/60",
    bg: "bg-accent/10",
    badge: "bg-accent/20 text-accent-foreground",
    icon: Crown,
    glow: "shadow-[0_0_25px_hsl(var(--accent)/0.3)]",
  },
};

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  level_reached: { label: "Уровни", icon: "📈" },
  xp_earned: { label: "Опыт", icon: "⭐" },
  tasks_completed: { label: "Задания", icon: "📝" },
  perfect_grade: { label: "Оценки", icon: "💯" },
  plants_harvested: { label: "Растения", icon: "🌾" },
  animals_collected: { label: "Животные", icon: "🐄" },
  productions_completed: { label: "Производство", icon: "⚙️" },
  pets_created: { label: "Питомцы", icon: "🐾" },
  pet_fed: { label: "Питомцы", icon: "🐾" },
  pet_max_happiness: { label: "Питомцы", icon: "🐾" },
  multi_zone_level: { label: "Мульти-зоны", icon: "🎨" },
  all_zones_level: { label: "Мульти-зоны", icon: "🧠" },
};

const Achievements = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      try {
        const [all, unlocked] = await Promise.all([
          achievementsApi.getAllAchievements(),
          achievementsApi.getUserAchievements(),
        ]);
        setAllAchievements(all || []);
        setUserAchievements(unlocked || []);
      } catch (err: any) {
        toast({
          title: "Ошибка загрузки достижений",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
  const totalCount = allAchievements.length;
  const unlockedCount = unlockedIds.size;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Group by category
  const categories = new Map<string, Achievement[]>();
  for (const a of allAchievements) {
    const catKey = CATEGORY_MAP[a.conditionType]?.label || "Другое";
    if (!categories.has(catKey)) categories.set(catKey, []);
    categories.get(catKey)!.push(a);
  }

  // Rarity counts
  const rarityCounts = { common: 0, rare: 0, epic: 0, legendary: 0 };
  for (const a of allAchievements) {
    if (unlockedIds.has(a.id)) rarityCounts[a.rarity]++;
  }

  const filterAchievements = (list: Achievement[]) => {
    if (activeTab === "unlocked") return list.filter((a) => unlockedIds.has(a.id));
    if (activeTab === "locked") return list.filter((a) => !unlockedIds.has(a.id));
    return list;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <Trophy className="inline-block h-8 w-8 mr-2 text-primary" />
              Достижения
            </h1>
            <p className="text-muted-foreground">
              Выполняй задания, развивай ферму и открывай награды
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Общий прогресс</span>
                    <span className="text-sm text-muted-foreground">
                      {unlockedCount} / {totalCount}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progressPercent}% достижений разблокировано
                  </p>
                </div>

                <div className="flex gap-4 flex-wrap">
                  {(["common", "rare", "epic", "legendary"] as const).map((r) => {
                    const cfg = RARITY_CONFIG[r];
                    return (
                      <div key={r} className="text-center">
                        <div className={`text-xl font-bold`}>
                          {rarityCounts[r]}
                        </div>
                        <Badge variant="outline" className={`text-xs ${cfg.badge}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                Все ({totalCount})
              </TabsTrigger>
              <TabsTrigger value="unlocked">
                Открытые ({unlockedCount})
              </TabsTrigger>
              <TabsTrigger value="locked">
                Закрытые ({totalCount - unlockedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-8">
                {[...categories.entries()].map(([catLabel, achievements]) => {
                  const filtered = filterAchievements(achievements);
                  if (filtered.length === 0) return null;

                  const catIcon =
                    CATEGORY_MAP[achievements[0]?.conditionType]?.icon || "🏆";

                  return (
                    <div key={catLabel}>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-xl">{catIcon}</span>
                        {catLabel}
                        <Badge variant="outline" className="ml-2">
                          {filtered.filter((a) => unlockedIds.has(a.id)).length}/
                          {achievements.length}
                        </Badge>
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((achievement) => {
                          const isUnlocked = unlockedIds.has(achievement.id);
                          const cfg = RARITY_CONFIG[achievement.rarity];
                          const userAch = userAchievements.find(
                            (ua) => ua.achievementId === achievement.id
                          );

                          return (
                            <Card
                              key={achievement.id}
                              className={`
                                transition-all duration-300 border-2
                                ${cfg.border} ${cfg.bg} ${isUnlocked ? cfg.glow : ""}
                                ${!isUnlocked ? "opacity-60 grayscale" : "hover:scale-[1.02]"}
                              `}
                            >
                              <CardContent className="p-4">
                                <div className="flex gap-3">
                                  <div className="relative">
                                    <div
                                      className={`
                                        h-14 w-14 rounded-xl flex items-center justify-center text-2xl
                                        ${isUnlocked ? cfg.badge : "bg-muted text-muted-foreground"}
                                      `}
                                    >
                                      {achievement.icon}
                                    </div>
                                    {!isUnlocked && (
                                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-muted-foreground/80 flex items-center justify-center">
                                        <Lock className="h-3 w-3 text-background" />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h4 className="font-semibold text-sm leading-tight">
                                        {achievement.title}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] flex-shrink-0 ${cfg.badge}`}
                                      >
                                        {cfg.label}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {achievement.description}
                                    </p>
                                    {isUnlocked && userAch && (
                                      <p className="text-[10px] text-primary mt-1">
                                        ✅ Открыто{" "}
                                        {new Date(userAch.unlockedAt).toLocaleDateString("ru-RU")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {allAchievements.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Достижения ещё не добавлены</p>
                    <p className="text-sm">Администратор должен заполнить базу данных</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Achievements;
