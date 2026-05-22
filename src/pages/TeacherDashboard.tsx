import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/layout/Header";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TeacherDashboardSkeleton } from "@/components/ui/loading-skeleton";
import { Users, ClipboardCheck, TrendingUp, AlertCircle, Download, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tasksApi, usersApi } from "@/lib/api-client";
import { exportToCSV, formatStudentDataForExport, formatSubmissionsForExport, formatStatsForExport } from "@/lib/export-utils";
import { exportAnalyticsToPDF } from "@/lib/pdf-export";
import { ComparativeAnalytics } from "@/components/analytics/ComparativeAnalytics";
import { BulkOperations } from "@/components/teacher/BulkOperations";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isTeacher, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    reviewedToday: 0,
    avgGrade: 0,
  });
  const [studentsPagination, setStudentsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [submissionsPagination, setSubmissionsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: undefined as 'pending' | 'reviewed' | 'rejected' | undefined,
    search: '',
    zoneId: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });
  const [zones, setZones] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  // WebSocket connection
  const { isConnected, connectionError } = useRealtimeUpdates({
    userId: user?.id || null,
    enableToasts: false,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/auth");
        return;
      }
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!roleLoading && !isTeacher) {
      toast({
        title: "Доступ запрещен",
        description: "Эта страница доступна только для учителей",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isTeacher, roleLoading, navigate, toast]);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const { zonesApi } = await import("@/lib/api-client");
        const zonesData = await zonesApi.getAllZones();
        setZones(zonesData);
      } catch (error) {
        console.error('Error loading zones:', error);
      }
    };

    if (isTeacher && !roleLoading) {
      loadZones();
      loadTemplates();
    }
  }, [isTeacher, roleLoading]);

  const loadTemplates = async () => {
    try {
      const templatesData = await tasksApi.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, studentsData, submissionsData] = await Promise.all([
          usersApi.getTeacherStats(),
          usersApi.getStudentsList({
            page: studentsPagination.page,
            limit: studentsPagination.limit,
            search: filters.search || undefined,
          }),
          usersApi.getSubmissionsByTeacher({
            page: submissionsPagination.page,
            limit: submissionsPagination.limit,
            status: filters.status,
            zoneId: filters.zoneId,
            startDate: filters.startDate,
            endDate: filters.endDate,
          }),
        ]);
        
        setStats(statsData);
        setStudents(studentsData.data || []);
        setStudentsPagination({
          ...studentsPagination,
          total: studentsData.meta?.total || 0,
          totalPages: studentsData.meta?.totalPages || 0,
        });
        setSubmissions(submissionsData.data || []);
        setSubmissionsPagination({
          ...submissionsPagination,
          total: submissionsData.meta?.total || 0,
          totalPages: submissionsData.meta?.totalPages || 0,
        });
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить данные",
          variant: "destructive",
        });
      }
    };

    if (isTeacher && !roleLoading) {
      loadData();
    }
  }, [isTeacher, roleLoading, toast, studentsPagination.page, submissionsPagination.page, filters]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isWebSocketConnected={isConnected} connectionError={connectionError} />
        <main className="container py-8">
          <TeacherDashboardSkeleton />
        </main>
      </div>
    );
  }

  if (!isTeacher) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isWebSocketConnected={isConnected} connectionError={connectionError} />
      
      <main className="container py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Кабинет <span className="gradient-text">учителя</span>
              </h1>
              <p className="text-muted-foreground">Управление заданиями и проверка работ учеников</p>
            </div>
            <Button onClick={() => navigate("/teacher/create-task")}>
              Создать задание
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего учеников</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Активных в системе
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">На проверке</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReviews}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.pendingReviews > 0 ? "Требуют внимания" : "Все проверено!"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Проверено сегодня</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.reviewedToday}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.reviewedToday > 0 ? "Отличная работа!" : "Начните проверку"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний балл</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgGrade > 0 ? stats.avgGrade : "—"}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  По всем работам
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="submissions" className="w-full">
            <TabsList>
              <TabsTrigger value="submissions">Работы на проверке</TabsTrigger>
              <TabsTrigger value="students">Ученики</TabsTrigger>
              <TabsTrigger value="analytics">Аналитика</TabsTrigger>
              <TabsTrigger value="comparative">Сравнительная аналитика</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div>
                  <Label htmlFor="status-filter">Статус</Label>
                  <select
                    id="status-filter"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    value={filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                  >
                    <option value="">Все статусы</option>
                    <option value="pending">На проверке</option>
                    <option value="reviewed">Проверено</option>
                    <option value="rejected">Отклонено</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="zone-filter">Зона/Предмет</Label>
                  <select
                    id="zone-filter"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    value={filters.zoneId || ''}
                    onChange={(e) => setFilters({ ...filters, zoneId: e.target.value || undefined })}
                  >
                    <option value="">Все зоны</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="start-date">Дата от</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Дата до</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <BulkOperations
                  submissions={submissions}
                  templates={templates}
                  onOperationComplete={() => {
                    window.location.reload();
                  }}
                />
                {Object.values(filters).some(v => v) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({
                      status: undefined,
                      search: '',
                      zoneId: undefined,
                      startDate: undefined,
                      endDate: undefined,
                    })}
                  >
                    Сбросить фильтры
                  </Button>
                )}
              </div>

              {submissions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Нет работ для отображения
                  </CardContent>
                </Card>
              ) : (
                submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{submission.taskTitle}</CardTitle>
                        <CardDescription>
                          Ученик: {submission.studentName} • {submission.submittedAt}
                        </CardDescription>
                      </div>
                      {submission.status === "pending" ? (
                        <Badge variant="secondary">На проверке</Badge>
                      ) : (
                        <Badge className="bg-green-500">Проверено: {submission.grade}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end gap-2">
                      {submission.status === "pending" ? (
                        <>
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/teacher/submission/${submission.id}`)}
                          >
                            Просмотреть
                          </Button>
                          <Button onClick={() => navigate(`/teacher/submission/${submission.id}`)}>
                            Проверить
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/teacher/submission/${submission.id}`)}
                        >
                          Подробнее
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
              )}

              {submissionsPagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={submissionsPagination.page === 1}
                    onClick={() =>
                      setSubmissionsPagination({
                        ...submissionsPagination,
                        page: submissionsPagination.page - 1,
                      })
                    }
                  >
                    Назад
                  </Button>
                  <span className="px-4 py-2">
                    Страница {submissionsPagination.page} из {submissionsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={submissionsPagination.page === submissionsPagination.totalPages}
                    onClick={() =>
                      setSubmissionsPagination({
                        ...submissionsPagination,
                        page: submissionsPagination.page + 1,
                      })
                    }
                  >
                    Вперёд
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="students" className="space-y-4 mt-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Поиск по имени или email..."
                  className="w-full px-3 py-2 border rounded-md"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              {students.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Нет учеников для отображения
                  </CardContent>
                </Card>
              ) : (
                students.map((student, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">{student.name}</CardTitle>
                          <CardDescription>
                            Последняя активность: {student.lastActive}
                          </CardDescription>
                        </div>
                        <Badge>Уровень {student.level}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Заданий</p>
                            <p className="font-bold text-lg">{student.tasksCompleted}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Средний балл</p>
                            <p className="font-bold text-lg">{student.avgGrade}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Уровень</p>
                            <p className="font-bold text-lg">{student.level}</p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={() => navigate(`/teacher/student/${student.userId || student.id}`)}>
                          Детальная статистика
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {studentsPagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={studentsPagination.page === 1}
                    onClick={() =>
                      setStudentsPagination({
                        ...studentsPagination,
                        page: studentsPagination.page - 1,
                      })
                    }
                  >
                    Назад
                  </Button>
                  <span className="px-4 py-2">
                    Страница {studentsPagination.page} из {studentsPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={studentsPagination.page === studentsPagination.totalPages}
                    onClick={() =>
                      setStudentsPagination({
                        ...studentsPagination,
                        page: studentsPagination.page + 1,
                      })
                    }
                  >
                    Вперёд
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <Label htmlFor="zone-filter">Зона</Label>
                        <select
                          id="zone-filter"
                          className="w-full px-3 py-2 border rounded-md"
                          value={filters.zoneId || ''}
                          onChange={(e) => setFilters({ ...filters, zoneId: e.target.value || undefined })}
                        >
                          <option value="">Все зоны</option>
                          {zones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="start-date">Дата от</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={filters.startDate || ''}
                          onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">Дата до</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={filters.endDate || ''}
                          onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => setFilters({ ...filters, zoneId: undefined, startDate: undefined, endDate: undefined })}
                          className="w-full"
                        >
                          Сбросить фильтры
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const { exportToCSV, formatStatsForExport } = await import('@/lib/export-utils');
                      exportToCSV(formatStatsForExport(stats, students, submissions), 'teacher-stats');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт общей статистики
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const { exportToCSV, formatStudentDataForExport } = await import('@/lib/export-utils');
                      exportToCSV(formatStudentDataForExport(students), 'students-list');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт списка учеников
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const { exportToCSV, formatSubmissionsForExport } = await import('@/lib/export-utils');
                      exportToCSV(formatSubmissionsForExport(submissions), 'submissions-list');
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт работ
                  </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Распределение оценок</CardTitle>
                      <CardDescription>По всем проверенным работам</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[
                          { range: '0-20', count: submissions.filter(s => s.grade >= 0 && s.grade < 20).length },
                          { range: '21-40', count: submissions.filter(s => s.grade >= 21 && s.grade < 40).length },
                          { range: '41-60', count: submissions.filter(s => s.grade >= 41 && s.grade < 60).length },
                          { range: '61-80', count: submissions.filter(s => s.grade >= 61 && s.grade < 80).length },
                          { range: '81-100', count: submissions.filter(s => s.grade >= 81 && s.grade <= 100).length },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Статусы работ</CardTitle>
                      <CardDescription>Текущее состояние всех работ</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'На проверке', value: submissions.filter(s => s.status === 'pending').length, fill: 'hsl(var(--chart-2))' },
                              { name: 'Проверено', value: submissions.filter(s => s.status === 'reviewed').length, fill: 'hsl(var(--chart-1))' },
                              { name: 'Отклонено', value: submissions.filter(s => s.status === 'rejected').length, fill: 'hsl(var(--destructive))' },
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Средний балл по ученикам</CardTitle>
                      <CardDescription>Топ-10 учеников по среднему баллу</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={students
                            .filter(s => s.avgGrade > 0)
                            .sort((a, b) => b.avgGrade - a.avgGrade)
                            .slice(0, 10)
                            .map(s => ({ name: s.name.split(' ')[0], avgGrade: s.avgGrade }))}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="avgGrade" fill="hsl(var(--chart-3))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Активность учеников</CardTitle>
                      <CardDescription>Количество выполненных заданий</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={students
                            .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
                            .slice(0, 10)
                            .map(s => ({ name: s.name.split(' ')[0], tasks: s.tasksCompleted }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="tasks" stroke="hsl(var(--chart-4))" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comparative" className="mt-6">
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => exportAnalyticsToPDF('comparative-analytics', 'comparative-analytics')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Экспорт в PDF
                  </Button>
                </div>
                <div id="comparative-analytics">
                  <ComparativeAnalytics />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
