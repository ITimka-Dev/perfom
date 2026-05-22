import { useState, useRef } from 'react';
import { Button } from './button';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FileUploadButtonProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
}

export function FileUploadButton({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = '*',
  disabled = false,
  className,
  multiple = true,
}: FileUploadButtonProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const filesArray = Array.from(files);
    
    // Validate file count
    if (filesArray.length + selectedFiles.length > maxFiles) {
      toast.error(`Максимум ${maxFiles} файлов`);
      return;
    }

    // Validate file sizes
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const invalidFiles = filesArray.filter(file => file.size > maxSizeBytes);
    
    if (invalidFiles.length > 0) {
      toast.error(`Файлы не должны превышать ${maxSizeMB}MB`);
      return;
    }

    const newFiles = [...selectedFiles, ...filesArray];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />
        
        <Button
          type="button"
          variant="ghost"
          className="w-full h-24 flex flex-col gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium text-foreground">Нажмите для выбора</span>
            <span className="text-muted-foreground"> или перетащите файлы</span>
          </div>
          <div className="text-xs text-muted-foreground">
            До {maxFiles} файлов, максимум {maxSizeMB}MB каждый
          </div>
        </Button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
