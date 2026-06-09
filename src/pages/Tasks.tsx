import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TasksSkeleton } from "@/components/ui/loading-skeleton";
import { BookOpen, Lock, CheckCircle, Clock, Upload, X } from "lucide-react";
import { FileUploadButton } from "@/components/ui/file-upload-button";
import { storageApi, tasksApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string;
  zone: any;
  difficulty: number;
  experienceReward: number;
  requiredLevel: number;
  instructions?: string;
  attachmentUrls?: string[];
  allowedSubmissionFileTypes?: string[];
  status?: string;
}

const Tasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionUrls, setSubmissionUrls] = useState<string[]>([]);
  const [newSubmissionUrl, setNewSubmissionUrl] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const openSubmissionDialog = (task: Task) => {
    setSelectedTask(task);
    setSubmissionContent("");
    setSubmissionUrls([]);
    setNewSubmissionUrl("");
    setSubmissionFiles([]);
  };

  const closeSubmissionDialog = () => {
    if (submitting) return;
    setSelectedTask(null);
  };

  const addSubmissionUrl = () => {
    if (!newSubmissionUrl.trim()) return;
    setSubmissionUrls((prev) => [...prev, newSubmissionUrl.trim()]);
    setNewSubmissionUrl("");
  };

  const removeSubmissionUrl = (index: number) => {
    setSubmissionUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const getSubmissionAccept = (task: Task | null) => {
    const formats = task?.allowedSubmissionFileTypes || [];
    if (formats.length === 0) return "*";
    return formats.map((format) => `.${format.replace(/^\./, "")}`).join(",");
  };

  const handleSubmitTask = async () => {
    if (!selectedTask) return;
    if (!submissionContent.trim() && submissionUrls.length === 0 && submissionFiles.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте текст, ссылку или файл",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of submissionFiles) {
        const uploadResponse = await storageApi.uploadSubmissionAttachment(selectedTask.id, file);
        uploadedUrls.push(uploadResponse.url || uploadResponse.fileUrl);
      }

      await tasksApi.submitTask(selectedTask.id, {
        content: submissionContent.trim(),
        attachmentUrls: [...submissionUrls, ...uploadedUrls],
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id ? { ...task, status: "in_progress" } : task,
        ),
      );
      setSelectedTask(null);
      toast({
        title: "Успешно",
        description: "Задание отправлено на проверку",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить задание",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
      case "rejected":
        return <Clock className="h-5 w-5 text-red-500" />;
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
                        <span>{task.experienceReward || 100} XP</span>
                        <span>Уровень {task.requiredLevel || 1}+</span>
                        <span className="font-medium text-foreground">
                          {getStatusText(task.status || "available")}
                        </span>
                      </div>
                      <Button
                        disabled={task.status === "locked" || task.status === "completed"}
                        variant={task.status === "in_progress" ? "default" : "outline"}
                        onClick={() => openSubmissionDialog(task)}
                      >
                        {task.status === "completed" && "Завершено"}
                        {task.status === "locked" && "Заблокировано"}
                        {task.status === "in_progress" && "Продолжить"}
                        {task.status === "rejected" && "Исправить"}
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
                        <span>{task.experienceReward} XP</span>
                        <span>Уровень {task.requiredLevel}+</span>
                      </div>
                      <Button onClick={() => openSubmissionDialog(task)}>Начать</Button>
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
                        <span>{task.experienceReward} XP</span>
                      </div>
                      <Button onClick={() => openSubmissionDialog(task)}>Продолжить</Button>
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
                        <span className="text-muted-foreground">{task.experienceReward} XP получено</span>
                      </div>
                      <Button disabled>Завершено</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {tasks.filter(t => t.status === "completed").length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Пока нет завершенных заданий
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Dialog open={!!selectedTask} onOpenChange={(open) => !open && closeSubmissionDialog()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask?.title}</DialogTitle>
              <DialogDescription>
                {selectedTask?.description || "Отправьте ответ на проверку учителю"}
              </DialogDescription>
            </DialogHeader>

            {selectedTask && (
              <div className="space-y-4">
                {selectedTask.instructions && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    {selectedTask.instructions}
                  </div>
                )}

                {selectedTask.attachmentUrls && selectedTask.attachmentUrls.length > 0 && (
                  <div className="space-y-2">
                    <Label>Файлы задания</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.attachmentUrls.map((url, index) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Файл {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="submission-content">Ответ</Label>
                  <Textarea
                    id="submission-content"
                    value={submissionContent}
                    onChange={(event) => setSubmissionContent(event.target.value)}
                    rows={5}
                    placeholder="Напишите ответ..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Прикрепить файлы</Label>
                  <FileUploadButton
                    onFilesSelected={setSubmissionFiles}
                    maxFiles={5}
                    maxSizeMB={10}
                    accept={getSubmissionAccept(selectedTask)}
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Разрешенные форматы: {(selectedTask.allowedSubmissionFileTypes || []).join(", ") || "любые"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Или добавьте ссылки на файлы</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newSubmissionUrl}
                      onChange={(event) => setNewSubmissionUrl(event.target.value)}
                      placeholder="https://example.com/homework.pdf"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSubmissionUrl();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSubmissionUrl} size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {submissionUrls.length > 0 && (
                    <div className="space-y-2">
                      {submissionUrls.map((url, index) => (
                        <div key={url} className="flex items-center justify-between gap-2 rounded-md bg-muted p-2">
                          <span className="truncate text-sm">{url}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubmissionUrl(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeSubmissionDialog} disabled={submitting}>
                    Отмена
                  </Button>
                  <Button type="button" onClick={handleSubmitTask} disabled={submitting}>
                    {submitting ? "Отправка..." : "Отправить на проверку"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Tasks;
