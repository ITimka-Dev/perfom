import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Award, BookOpen, Calendar } from "lucide-react";
import { usersApi, tasksApi, progressApi } from "@/lib/api-client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const StudentDetailStats = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [gradeHistory, setGradeHistory] = useState<any[]>([]);

  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  const loadStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);

      // Load student profile - using getUserById from usersApi
      const studentData = await usersApi.getUserById(studentId);
      setStudent(studentData);

      // Load student submissions - we'll need to filter by studentId on the backend
      // For now we get all and filter client-side
      const allSubmissions = await tasksApi.getUserSubmissions();
      const submissionsData = allSubmissions; // Backend should filter by studentId
      setSubmissions(submissionsData);

      // Load zone progress
      const progressData = await progressApi.getUserProgress();
      setProgress(progressData);

      // Process grade history
      const gradeHistoryData = submissionsData
        .filter((s: any) => s.status === "reviewed" && s.grade !== null)
        .sort((a: any, b: any) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime())
        .map((s: any) => ({
          date: new Date(s.reviewedAt).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
          }),
          grade: s.grade,
        }));

      setGradeHistory(gradeHistoryData);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalSubmissions = submissions.length;
    const reviewedSubmissions = submissions.filter((s) => s.status === "reviewed");
    const avgGrade =
      reviewedSubmissions.length > 0
        ? reviewedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / reviewedSubmissions.length
        : 0;
    const completionRate =
      totalSubmissions > 0 ? (reviewedSubmissions.length / totalSubmissions) * 100 : 0;

    return {
      totalSubmissions,
      reviewedCount: reviewedSubmissions.length,
      avgGrade: avgGrade.toFixed(1),
      completionRate: completionRate.toFixed(0),
    };
  };

  const prepareZoneProgressData = () => {
    return progress.map((p) => ({
      name: p.zone?.name || "Неизвестно",
      level: p.level || 0,
      exp: p.experience || 0,
      tasks: p.tasksCompleted || 0,
    }));
  };

  const prepareActivityData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    });

    return last7Days.map((date) => {
      const daySubmissions = submissions.filter((s) => {
        const submissionDate = new Date(s.submittedAt).toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
        });
        return submissionDate === date;
      });

      return {
        date,
        submissions: daySubmissions.length,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Загрузка...</div>
        </main>
      </div>
    );
  }

  const stats = calculateStats();
  const zoneData = prepareZoneProgressData();
  const activityData = prepareActivityData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/teacher-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{student?.fullName || "Ученик"}</h1>
              <p className="text-muted-foreground">{student?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего работ</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">Проверено: {stats.reviewedCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgGrade}</div>
              <p className="text-xs text-muted-foreground">Из 100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выполнение</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">Проверенных работ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активность</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activityData.reduce((sum, d) => sum + d.submissions, 0)}
              </div>
              <p className="text-xs text-muted-foreground">За последние 7 дней</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>История оценок</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gradeHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Оценка"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активность по дням</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submissions" fill="hsl(var(--accent))" name="Работы" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Прогресс по зонам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="level" fill="hsl(var(--primary))" name="Уровень" />
                <Bar dataKey="tasks" fill="hsl(var(--accent))" name="Заданий" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDetailStats;
