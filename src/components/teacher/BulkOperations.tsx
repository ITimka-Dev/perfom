import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tasksApi } from "@/lib/api-client";

interface BulkOperationsProps {
  submissions: any[];
  templates: any[];
  onOperationComplete: () => void;
}

export const BulkOperations = ({ submissions, templates, onOperationComplete }: BulkOperationsProps) => {
  const { toast } = useToast();
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [bulkGrade, setBulkGrade] = useState<string>("");
  const [bulkComment, setBulkComment] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const toggleSubmission = (submissionId: string) => {
    const newSelected = new Set(selectedSubmissions);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const selectAll = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map((s) => s.id)));
    }
  };

  const handleBulkGrade = async () => {
    if (selectedSubmissions.size === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну работу",
        variant: "destructive",
      });
      return;
    }

    const grade = parseInt(bulkGrade);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      toast({
        title: "Ошибка",
        description: "Введите оценку от 0 до 100",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const promises = Array.from(selectedSubmissions).map((submissionId) =>
        tasksApi.gradeSubmission(submissionId, { grade, feedback: bulkComment || undefined })
      );

      await Promise.all(promises);

      toast({
        title: "Успешно",
        description: `Выставлены оценки для ${selectedSubmissions.size} работ`,
      });

      setSelectedSubmissions(new Set());
      setBulkGrade("");
      setBulkComment("");
      onOperationComplete();
    } catch (error) {
      console.error("Error bulk grading:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выставить оценки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkComment = async () => {
    if (selectedSubmissions.size === 0) {
      toast({
        title: "Ошибка",
        description: "Выберите хотя бы одну работу",
        variant: "destructive",
      });
      return;
    }

    let commentText = bulkComment;
    if (selectedTemplate && !commentText) {
      const template = templates.find((t) => t.id === selectedTemplate);
      if (template) {
        commentText = template.content;
      }
    }

    if (!commentText.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите текст комментария или выберите шаблон",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const promises = Array.from(selectedSubmissions).map((submissionId) =>
        tasksApi.createComment(submissionId, { commentText })
      );

      await Promise.all(promises);

      toast({
        title: "Успешно",
        description: `Добавлены комментарии для ${selectedSubmissions.size} работ`,
      });

      setSelectedSubmissions(new Set());
      setBulkComment("");
      setSelectedTemplate("");
      onOperationComplete();
    } catch (error) {
      console.error("Error bulk commenting:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить комментарии",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Массовые операции
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Выбрано: {selectedSubmissions.size} из {submissions.length}
            </span>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedSubmissions.size === submissions.length ? "Снять все" : "Выбрать все"}
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
            {submissions.map((submission) => (
              <div key={submission.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`submission-${submission.id}`}
                  checked={selectedSubmissions.has(submission.id)}
                  onCheckedChange={() => toggleSubmission(submission.id)}
                />
                <label
                  htmlFor={`submission-${submission.id}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {submission.taskTitle} - {submission.studentName}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Массовое выставление оценок</label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Оценка (0-100)"
                value={bulkGrade}
                onChange={(e) => setBulkGrade(e.target.value)}
              />
              <Button onClick={handleBulkGrade} disabled={loading || selectedSubmissions.size === 0}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Выставить
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Массовые комментарии</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите шаблон (опционально)" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Или введите текст комментария..."
              value={bulkComment}
              onChange={(e) => setBulkComment(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleBulkComment}
              disabled={loading || selectedSubmissions.size === 0}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Добавить комментарии
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
