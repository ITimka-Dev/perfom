import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface FileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  maxFiles?: number;
  taskId?: string;
  submissionId?: string;
}

export const FileUpload = ({ 
  onFilesUploaded, 
  maxFiles = 3,
  taskId,
  submissionId
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`Максимум ${maxFiles} файлов`);
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];
    const newFiles: Array<{ name: string; url: string }> = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        let url: string;
        if (taskId) {
          const response = await apiClient.post(`/storage/task/${taskId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          url = response.data.url;
        } else if (submissionId) {
          const response = await apiClient.post(`/storage/submission/${submissionId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          url = response.data.url;
        } else {
          throw new Error('taskId or submissionId is required');
        }

        newUrls.push(url);
        newFiles.push({ name: file.name, url });
      }

      const allFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(allFiles);
      onFilesUploaded(allFiles.map(f => f.url));
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Ошибка при загрузке файлов');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesUploaded(newFiles.map(f => f.url));
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      />
      
      {uploadedFiles.length < maxFiles && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? 'Загрузка...' : 'Прикрепить файл'}
        </Button>
      )}

      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-sm"
            >
              <File className="h-4 w-4" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};