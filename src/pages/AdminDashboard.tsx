import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/layout/Header";
import { monitoringApi } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpen, CheckCircle, Clock, FileText, TrendingUp, Users } from "lucide-react";

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
    const loadStats = async () => {
      try {
        const data = await monitoringApi.getAdminStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading admin stats:", error);
        toast.error("Не удалось загрузить статистику");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-32 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6">
          <p className="text-muted-foreground">Не удалось загрузить данные</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Панель администратора</h1>
          <p className="text-muted-foreground">Общая статистика системы EduFarm</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users className="h-8 w-8 text-primary" />}
            label="Всего пользователей"
            value={stats.totalUsers}
            hint={`${stats.totalStudents} учеников, ${stats.totalTeachers} учителей`}
          />
          <MetricCard
            icon={<BookOpen className="h-8 w-8 text-primary" />}
            label="Всего заданий"
            value={stats.totalTasks}
            hint="Активны в системе"
          />
          <MetricCard
            icon={<FileText className="h-8 w-8 text-primary" />}
            label="Работ сдано"
            value={stats.totalSubmissions}
            hint={`${stats.pendingSubmissions} ожидают проверки`}
          />
          <MetricCard
            icon={<TrendingUp className="h-8 w-8 text-primary" />}
            label="Средняя оценка"
            value={stats.avgGrade}
            hint="По всем проверенным работам"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
            label="Активны сегодня"
            value={stats.activeToday}
            hint="пользователей сдали работы"
          />
          <MetricCard
            icon={<Clock className="h-5 w-5 text-primary" />}
            label="Активны за неделю"
            value={stats.activeThisWeek}
            hint="пользователей сдали работы"
          />
        </div>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList>
            <TabsTrigger value="activity">Активность</TabsTrigger>
            <TabsTrigger value="submissions">Сдачи работ</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Активность за последние 7 дней
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" strokeWidth={2} name="Сданные работы" />
                  <Line type="monotone" dataKey="reviews" stroke="hsl(var(--secondary))" strokeWidth={2} name="Проверенные работы" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Статистика сдач за неделю
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.recentActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="submissions" fill="hsl(var(--primary))" name="Сданные работы" />
                  <Bar dataKey="reviews" fill="hsl(var(--secondary))" name="Проверенные работы" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <h3 className="text-2xl font-bold text-foreground mt-2">{value}</h3>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
        {icon}
      </div>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
};
