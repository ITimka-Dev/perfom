import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Trash2, Edit2, Check, X, File, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tasksApi, apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { FileUploadButton } from "@/components/ui/file-upload-button";

interface Comment {
  id: string;
  commentText: string;
  teacherId: string;
  fileUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CommentsSectionProps {
  submissionId: string;
  currentUserId: string;
}

export const CommentsSection = ({ submissionId, currentUserId }: CommentsSectionProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [submissionId]);

  const loadComments = async () => {
    try {
      const data = await tasksApi.getComments(submissionId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      // Upload files first if any
      const uploadedUrls: string[] = [];
      if (attachmentFiles.length > 0) {
        setIsUploading(true);
        
        for (const file of attachmentFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await apiClient.post(
            `/storage/submission/${submissionId}/upload`,
            formData
          );

          uploadedUrls.push(uploadResponse.data.fileUrl);
        }
        
        setIsUploading(false);
      }

      // Create comment with file URLs
      await tasksApi.createComment(submissionId, { 
        commentText: newComment,
        fileUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });
      setNewComment("");
      setAttachmentFiles([]);
      await loadComments();
      toast({
        title: "Успешно",
        description: "Комментарий добавлен",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить комментарий",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editText.trim()) return;
    
    setLoading(true);
    try {
      await tasksApi.updateComment(commentId, { commentText: editText });
      setEditingId(null);
      await loadComments();
      toast({
        title: "Успешно",
        description: "Комментарий обновлен",
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить комментарий",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setLoading(true);
    try {
      await tasksApi.deleteComment(commentId);
      await loadComments();
      toast({
        title: "Успешно",
        description: "Комментарий удален",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить комментарий",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.commentText);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Комментарии ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Comment */}
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Добавьте комментарий..."
            rows={3}
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>Прикрепить файлы (опционально)</span>
            </div>
            <FileUploadButton
              onFilesSelected={setAttachmentFiles}
              maxFiles={3}
              maxSizeMB={5}
              disabled={loading || isUploading}
            />
          </div>
          <Button 
            onClick={handleAddComment} 
            disabled={loading || isUploading || !newComment.trim()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isUploading ? "Загрузка файлов..." : loading ? "Отправка..." : "Отправить комментарий"}
          </Button>
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Комментариев пока нет
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-muted rounded-lg space-y-2">
                {editingId === comment.id ? (
                  <>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Сохранить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Отмена
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{comment.commentText}</p>
                    {comment.fileUrls && comment.fileUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {comment.fileUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-background rounded border hover:bg-muted"
                          >
                            <File className="h-3 w-3" />
                            Файл {idx + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                        {comment.updatedAt !== comment.createdAt && " (изменено)"}
                      </span>
                      {comment.teacherId === currentUserId && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(comment)}
                            disabled={loading}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
