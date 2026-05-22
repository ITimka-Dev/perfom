import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus, Edit2, Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tasksApi } from "@/lib/api-client";

interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

interface TemplatesManagerProps {
  onSelectTemplate: (content: string) => void;
}

export const TemplatesManager = ({ onSelectTemplate }: TemplatesManagerProps) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    content: "",
    category: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const data = await tasksApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните название и содержимое шаблона",
        variant: "destructive",
      });
      return;
    }

    try {
      await tasksApi.createTemplate(newTemplate);
      setNewTemplate({ title: "", content: "", category: "" });
      await loadTemplates();
      toast({
        title: "Успешно",
        description: "Шаблон создан",
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать шаблон",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      await tasksApi.deleteTemplate(templateId);
      await loadTemplates();
      toast({
        title: "Успешно",
        description: "Шаблон удален",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить шаблон",
        variant: "destructive",
      });
    }
  };

  const handleUseTemplate = (template: Template) => {
    onSelectTemplate(template.content);
    setIsOpen(false);
    toast({
      title: "Шаблон применен",
      description: `"${template.title}" добавлен в комментарий`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Шаблоны
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Управление шаблонами</DialogTitle>
          <DialogDescription>
            Создавайте и используйте шаблоны для частых комментариев
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Template */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать новый шаблон
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="title">Название</Label>
                  <Input
                    id="title"
                    value={newTemplate.title}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, title: e.target.value })
                    }
                    placeholder="Например: Отличная работа"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Категория (необязательно)</Label>
                  <Input
                    id="category"
                    value={newTemplate.category}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, category: e.target.value })
                    }
                    placeholder="Например: Похвала"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Содержимое</Label>
                  <Textarea
                    id="content"
                    value={newTemplate.content}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, content: e.target.value })
                    }
                    placeholder="Текст шаблона комментария..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  <Check className="h-4 w-4 mr-2" />
                  Создать шаблон
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <div className="space-y-3">
            <h3 className="font-semibold">Сохраненные шаблоны</h3>
            {templates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                У вас пока нет сохраненных шаблонов
              </p>
            ) : (
              <div className="grid gap-3">
                {templates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{template.title}</h4>
                            {template.category && (
                              <p className="text-xs text-muted-foreground">
                                {template.category}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUseTemplate(template)}
                            >
                              Использовать
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {template.content}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
