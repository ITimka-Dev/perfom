import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalTasks: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  avgGrade: number;
  activeToday: number;
  activeThisWeek: number;
  recentActivity: Array<{
    date: string;
    submissions: number;
    reviews: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/monitoring/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast.error('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Не удалось загрузить данные</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Панель администратора</h1>
        <p className="text-muted-foreground">Общая статистика системы EduFarm</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Всего пользователей</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">{stats.totalUsers}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalStudents} учеников, {stats.totalTeachers} учителей
              </p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Всего заданий</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">{stats.totalTasks}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Активных в системе
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Работ сдано</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">{stats.totalSubmissions}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingSubmissions} ожидают проверки
              </p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Средняя оценка</p>
              <h3 className="text-2xl font-bold text-foreground mt-2">{stats.avgGrade}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                По всем проверенным работам
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Активных сегодня</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.activeToday}</p>
          <p className="text-sm text-muted-foreground mt-1">пользователей сдали работы</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Активных за неделю</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.activeThisWeek}</p>
          <p className="text-sm text-muted-foreground mt-1">пользователей сдали работы</p>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="submissions">Сдачи работ</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Активность за последние 7 дней</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Сданные работы"
                />
                <Line
                  type="monotone"
                  dataKey="reviews"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  name="Проверенные работы"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Статистика сдач за неделю</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar dataKey="submissions" fill="hsl(var(--primary))" name="Сданные работы" />
                <Bar dataKey="reviews" fill="hsl(var(--secondary))" name="Проверенные работы" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
