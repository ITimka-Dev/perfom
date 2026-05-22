import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksSkeleton } from "@/components/ui/loading-skeleton";
import { BookOpen, Lock, CheckCircle, Clock } from "lucide-react";
import { tasksApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  zone: any;
  difficulty: number;
  experienceReward: number;
  requiredLevel: number;
  status?: string;
}

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load tasks
        const tasksData = await tasksApi.getAllTasks();
        
        // Load user submissions
        const submissionsData = await tasksApi.getUserSubmissions();
        setSubmissions(submissionsData || []);

        // Combine tasks with submission status
        const tasksWithStatus = (tasksData || []).map((task: any) => {
          const submission = submissionsData?.find((s: any) => s.taskId === task.id);
          let status = "available";
          
          if (submission) {
            if (submission.status === "reviewed") {
              status = "completed";
            } else {
              status = "in_progress";
            }
          }

          return {
            ...task,
            status,
          };
        });

        setTasks(tasksWithStatus);
      } catch (error) {
        console.error("Error loading tasks:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить задания",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, toast]);

  // WebSocket connection
  const { isConnected, connectionError } = useRealtimeUpdates({
    userId: user?.id || null,
    enableToasts: false,
  });

  const getDifficultyBadge = (difficulty: number) => {
    const variants = {
      1: { label: "Легко", className: "bg-green-500" },
      2: { label: "Средне", className: "bg-yellow-500" },
      3: { label: "Сложно", className: "bg-orange-500" },
      4: { label: "Очень сложно", className: "bg-red-500" },
      5: { label: "Экстремально", className: "bg-red-700" },
    };
    const variant = variants[difficulty as keyof typeof variants] || variants[1];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "locked":
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <BookOpen className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Завершено";
      case "in_progress":
        return "В процессе";
      case "locked":
        return "Заблокировано";
      default:
        return "Доступно";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isWebSocketConnected={isConnected} connectionError={connectionError} />
        <main className="container py-8">
          <TasksSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isWebSocketConnected={isConnected} connectionError={connectionError} />
      
      <main className="container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Задания</h1>
            <p className="text-muted-foreground">
              Выполняй задания, получай опыт и развивай свою ферму
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">Все задания ({tasks.length})</TabsTrigger>
              <TabsTrigger value="available">
                Доступные ({tasks.filter(t => t.status === "available").length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                В процессе ({tasks.filter(t => t.status === "in_progress").length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Завершенные ({tasks.filter(t => t.status === "completed").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
              {tasks.map((task) => (
                <Card key={task.id} className={task.status === "locked" ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status || "available")}
                          <CardTitle className="text-xl">{task.title}</CardTitle>
                        </div>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getDifficultyBadge(task.difficulty || 1)}
                        <Badge variant="outline">{task.zone?.name || "Общее"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>💎 {task.experienceReward || 100} XP</span>
                        <span>⭐ Уровень {task.requiredLevel || 1}+</span>
                        <span className="font-medium text-foreground">
                          {getStatusText(task.status || "available")}
                        </span>
                      </div>
                      <Button
                        disabled={task.status === "locked" || task.status === "completed"}
                        variant={task.status === "in_progress" ? "default" : "outline"}
                      >
                        {task.status === "completed" && "Завершено"}
                        {task.status === "locked" && "Заблокировано"}
                        {task.status === "in_progress" && "Продолжить"}
                        {task.status === "available" && "Начать"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Пока нет доступных заданий
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="available" className="space-y-4 mt-6">
              {tasks.filter(t => t.status === "available").map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getDifficultyBadge(task.difficulty)}
                        <Badge variant="outline">{task.zone?.name || "Общее"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>💎 {task.experienceReward} XP</span>
                        <span>⭐ Уровень {task.requiredLevel}+</span>
                      </div>
                      <Button>Начать</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.filter(t => t.status === "available").length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Нет доступных заданий
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="in_progress" className="space-y-4 mt-6">
              {tasks.filter(t => t.status === "in_progress").map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getDifficultyBadge(task.difficulty)}
                        <Badge variant="outline">{task.zone?.name || "Общее"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>💎 {task.experienceReward} XP</span>
                      </div>
                      <Button>Продолжить</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.filter(t => t.status === "in_progress").length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Нет заданий в процессе
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {tasks.filter(t => t.status === "completed").map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <CardDescription>{task.description}</CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getDifficultyBadge(task.difficulty)}
                        <Badge variant="outline">{task.zone?.name || "Общее"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">💎 {task.experienceReward} XP получено</span>
                      </div>
                      <Button disabled>Завершено</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.filter(t => t.status === "completed").length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Пока нет завершённых заданий
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Tasks;
