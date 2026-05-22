import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/layout/Header";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReviewSubmissionSkeleton } from "@/components/ui/loading-skeleton";
import { CommentsSection } from "@/components/teacher/CommentsSection";
import { TemplatesManager } from "@/components/teacher/TemplatesManager";
import { ArrowLeft, FileText, User, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tasksApi } from "@/lib/api-client";

const ReviewSubmission = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { isTeacher, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    const loadSubmission = async () => {
      if (!submissionId) return;
      
      try {
        const data = await tasksApi.getSubmissionById(submissionId);
        setSubmission(data);
        setGrade(data.grade?.toString() || "");
        setFeedback(data.teacherFeedback || "");
      } catch (error) {
        console.error('Error loading submission:', error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить работу",
          variant: "destructive",
        });
      }
    };

    if (isTeacher && !roleLoading && submissionId) {
      loadSubmission();
    }
  }, [isTeacher, roleLoading, submissionId, toast]);

  const handleGradeSubmission = async (status: 'reviewed' | 'rejected') => {
    if (!submissionId) return;
    
    if (status === 'reviewed' && (!grade || parseInt(grade) < 0 || parseInt(grade) > 100)) {
      toast({
        title: "Ошибка",
        description: "Введите оценку от 0 до 100",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await tasksApi.gradeSubmission(submissionId, {
        grade: status === 'reviewed' ? parseInt(grade) : null,
        teacherFeedback: feedback,
        status,
      });

      toast({
        title: "Успешно",
        description: status === 'reviewed' ? "Работа проверена" : "Работа отклонена",
      });

      navigate("/teacher");
    } catch (error) {
      console.error('Error grading submission:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить результат проверки",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || roleLoading || !submission) {
    return (
      <div className="min-h-screen bg-background">
        <Header isWebSocketConnected={isConnected} connectionError={connectionError} />
        <main className="container py-8">
          <ReviewSubmissionSkeleton />
        </main>
      </div>
    );
  }

  if (!isTeacher) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isWebSocketConnected={isConnected} connectionError={connectionError} />
      
      <main className="container py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/teacher")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                Проверка <span className="gradient-text">работы</span>
              </h1>
              <p className="text-muted-foreground mt-1">Просмотрите работу и оставьте оценку</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {submission.task?.title || "Задание"}
                  </CardTitle>
                  <CardDescription>
                    {submission.task?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Инструкции</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {submission.task?.instructions || "Нет инструкций"}
                      </p>
                    </div>

                    {submission.task?.attachmentUrls && submission.task.attachmentUrls.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Прикрепленные файлы задания</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {submission.task.attachmentUrls.map((url: string, idx: number) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Файл {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ответ ученика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.submissionText && (
                      <div>
                        <Label className="text-sm font-medium">Текстовый ответ</Label>
                        <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap">
                          {submission.submissionText}
                        </div>
                      </div>
                    )}

                    {submission.fileUrls && submission.fileUrls.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Прикрепленные файлы</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {submission.fileUrls.map((url: string, idx: number) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                            >
                              <FileText className="h-4 w-4" />
                              Файл {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {submission.status !== 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Результаты проверки</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Оценка</Label>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {submission.grade || "—"} / 100
                        </p>
                      </div>
                      {submission.teacherFeedback && (
                        <div>
                          <Label>Комментарий учителя</Label>
                          <div className="mt-2 p-4 bg-muted rounded-md">
                            {submission.teacherFeedback}
                          </div>
                        </div>
                      )}
                      {submission.reviewedAt && (
                        <div>
                          <Label>Дата проверки</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(submission.reviewedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              <CommentsSection
                submissionId={submissionId!}
                currentUserId={user?.id || ""}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ученик</p>
                      <p className="text-sm text-muted-foreground">
                        {submission.user?.profile?.fullName || submission.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Дата сдачи</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Статус</p>
                    <Badge variant={
                      submission.status === 'reviewed' ? 'default' :
                      submission.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {submission.status === 'pending' ? 'На проверке' :
                       submission.status === 'reviewed' ? 'Проверено' : 'Отклонено'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {submission.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Проверка</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="grade">Оценка (0-100)</Label>
                      <Input
                        id="grade"
                        type="number"
                        min="0"
                        max="100"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="Введите оценку"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="feedback">Комментарий</Label>
                        <TemplatesManager
                          onSelectTemplate={(content) => setFeedback(feedback + (feedback ? '\n\n' : '') + content)}
                        />
                      </div>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Оставьте комментарий для ученика..."
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => handleGradeSubmission('reviewed')}
                        disabled={submitting}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Принять работу
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleGradeSubmission('rejected')}
                        disabled={submitting}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Отклонить работу
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewSubmission;
