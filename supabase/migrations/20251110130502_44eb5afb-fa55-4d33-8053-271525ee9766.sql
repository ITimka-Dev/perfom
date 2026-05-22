-- Add file_urls column to submission_comments
ALTER TABLE submission_comments 
ADD COLUMN file_urls text[] DEFAULT '{}';

-- Create storage bucket for comment attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comment-attachments', 'comment-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for comment attachments
CREATE POLICY "Teachers can upload comment attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'comment-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('teacher', 'admin')
  )
);

CREATE POLICY "Teachers can view comment attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'comment-attachments'
  AND (
    -- Teachers can view attachments they uploaded
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Students can view attachments on their submissions
    EXISTS (
      SELECT 1 FROM submission_comments sc
      JOIN task_submissions ts ON ts.id = sc.submission_id
      WHERE ts.user_id = auth.uid()
      AND sc.file_urls @> ARRAY[storage.objects.name]
    )
  )
);

CREATE POLICY "Teachers can delete their comment attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'comment-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);