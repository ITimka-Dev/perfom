import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { monitoringApi } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, Users, Award, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface WeeklyReport {
  id: string;
  teacher_id: string;
  week_start: string;
  week_end: string;
  created_at: string;
  report_data: {
    summary: {
      totalSubmissions: number;
      reviewedSubmissions: number;
      pendingSubmissions: number;
      avgGrade: number;
      activeStudents: number;
      totalStudents: number;
      activityRate: number;
    };
    problematicZones: Array<{
      zoneId: string;
      avgGrade: number;
      submissions: number;
    }>;
    inactiveStudentsCount: number;
    topPerformers: string[];
  };
}

export default function WeeklyReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const reports = await monitoringApi.getWeeklyReports();
      
      setReports(reports as WeeklyReport[] || []);
      if (reports && reports.length > 0) {
        setSelectedReport(reports[0] as WeeklyReport);
      }
    } catch (error: any) {
      console.error("Error loading reports:", error);
      toast.error("Ошибка загрузки отчетов");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Еженедельные отчеты</CardTitle>
            <CardDescription>Отчеты пока не сгенерированы</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Отчеты генерируются автоматически каждое воскресенье в 23:00.
              Первый отчет появится после генерации.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const report = selectedReport!;
  const { summary, problematicZones, inactiveStudentsCount } = report.report_data;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">Еженедельные отчеты</h1>
          <p className="text-muted-foreground">Статистика активности и успеваемости</p>
        </div>
        <Select
          value={selectedReport.id}
          onValueChange={(value) => {
            const report = reports.find((r) => r.id === value);
            if (report) setSelectedReport(report);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reports.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {new Date(r.week_start).toLocaleDateString("ru-RU")} -{" "}
                {new Date(r.week_end).toLocaleDateString("ru-RU")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          Период: {new Date(report.week_start).toLocaleDateString("ru-RU")} -{" "}
          {new Date(report.week_end).toLocaleDateString("ru-RU")}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего работ</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {summary.reviewedSubmissions} проверено, {summary.pendingSubmissions} в ожидании
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя оценка</CardTitle>
            {summary.avgGrade >= 75 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgGrade.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.avgGrade >= 85 ? "Отлично" : summary.avgGrade >= 75 ? "Хорошо" : "Требует внимания"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активность</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.activeStudents}/{summary.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">{summary.activityRate}% учеников активны</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Неактивные</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveStudentsCount}</div>
            <p className="text-xs text-muted-foreground">Не сдали работы за неделю</p>
          </CardContent>
        </Card>
      </div>

      {/* Problematic Zones */}
      {problematicZones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Проблемные зоны</CardTitle>
            <CardDescription>Зоны с низкими оценками (меньше 70)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {problematicZones.map((zone, index) => (
                <div key={zone.zoneId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">Зона {zone.zoneId.substring(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">{zone.submissions} работ</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-destructive">{zone.avgGrade.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">средняя оценка</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Активность учеников</CardTitle>
          <CardDescription>Соотношение активных и неактивных учеников</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Активные</span>
                <span className="text-sm text-muted-foreground">
                  {summary.activeStudents} из {summary.totalStudents}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${summary.activityRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Неактивные</span>
                <span className="text-sm text-muted-foreground">{inactiveStudentsCount}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{
                    width: `${summary.totalStudents > 0 ? (inactiveStudentsCount / summary.totalStudents) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Work */}
      {summary.pendingSubmissions > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Требует внимания
            </CardTitle>
            <CardDescription>Работы, ожидающие проверки</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{summary.pendingSubmissions}</p>
                <p className="text-sm text-muted-foreground">работ на проверке</p>
              </div>
              <Button onClick={() => navigate("/teacher-dashboard")}>Перейти к проверке</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
