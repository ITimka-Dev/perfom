import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Award, Star, TrendingUp } from 'lucide-react';
import { apiClient, zonesApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  totalScore: number;
  totalAchievements: number;
  avgGrade: number;
  tasksCompleted: number;
  level: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'achievements' | 'avgGrade'>('score');

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedZone, sortBy]);

  const loadZones = async () => {
    try {
      const zonesData = await zonesApi.getAllZones();
      setZones(zonesData);
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedZone !== 'all') params.append('zoneId', selectedZone);
      params.append('sortBy', sortBy);

      const response = await apiClient.get(`/progress/leaderboard?${params.toString()}`);
      setLeaderboard(response);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Не удалось загрузить рейтинг');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700';
    return 'bg-muted';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Таблица лидеров
            </h1>
            <p className="text-muted-foreground">Лучшие ученики по баллам и достижениям</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Фильтр по зоне
              </label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите зону" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все зоны</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Сортировать по
              </label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score">Общим баллам</SelectItem>
                  <SelectItem value="achievements">Достижениям</SelectItem>
                  <SelectItem value="avgGrade">Средней оценке</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Leaderboard */}
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Нет данных для отображения</p>
            </Card>
          ) : (
            leaderboard.map((entry) => (
              <Card
                key={entry.userId}
                className={`p-6 ${entry.rank <= 3 ? 'border-2 border-primary' : ''}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${getRankBadgeColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {entry.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">{entry.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{entry.totalScore}</p>
                      <p className="text-xs text-muted-foreground">Баллов</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground flex items-center gap-1">
                        <Award className="h-5 w-5 text-primary" />
                        {entry.totalAchievements}
                      </p>
                      <p className="text-xs text-muted-foreground">Достижений</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{entry.avgGrade}</p>
                      <p className="text-xs text-muted-foreground">Ср. оценка</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground flex items-center gap-1">
                        <Star className="h-5 w-5 text-primary" />
                        {entry.level}
                      </p>
                      <p className="text-xs text-muted-foreground">Уровень</p>
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="md:hidden flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-lg font-bold">
                      {entry.totalScore} pts
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {entry.totalAchievements} достижений
                    </p>
                  </div>
                </div>

                {/* Mobile expanded stats */}
                <div className="md:hidden mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{entry.avgGrade}</p>
                    <p className="text-xs text-muted-foreground">Ср. оценка</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-foreground">{entry.level}</p>
                    <p className="text-xs text-muted-foreground">Уровень</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
