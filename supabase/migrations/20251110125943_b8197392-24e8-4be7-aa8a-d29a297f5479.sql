-- Create submission_comments table
CREATE TABLE IF NOT EXISTS public.submission_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.task_submissions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment_templates table
CREATE TABLE IF NOT EXISTS public.comment_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submission_comments
CREATE POLICY "Teachers can view comments on submissions they can access"
  ON public.submission_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.task_submissions ts
      INNER JOIN public.tasks t ON t.id = ts.task_id
      INNER JOIN public.teacher_subjects tsub ON tsub.zone_id = t.zone_id
      WHERE ts.id = submission_comments.submission_id
      AND tsub.teacher_id = auth.uid()
    )
    OR auth.uid() = (SELECT user_id FROM public.task_submissions WHERE id = submission_comments.submission_id)
  );

CREATE POLICY "Teachers can insert comments on submissions they can access"
  ON public.submission_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id
    AND EXISTS (
      SELECT 1 FROM public.task_submissions ts
      INNER JOIN public.tasks t ON t.id = ts.task_id
      INNER JOIN public.teacher_subjects tsub ON tsub.zone_id = t.zone_id
      WHERE ts.id = submission_comments.submission_id
      AND tsub.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own comments"
  ON public.submission_comments
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own comments"
  ON public.submission_comments
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- RLS Policies for comment_templates
CREATE POLICY "Teachers can view their own templates"
  ON public.comment_templates
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own templates"
  ON public.comment_templates
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own templates"
  ON public.comment_templates
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own templates"
  ON public.comment_templates
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Create indexes for better performance
CREATE INDEX idx_submission_comments_submission_id ON public.submission_comments(submission_id);
CREATE INDEX idx_submission_comments_teacher_id ON public.submission_comments(teacher_id);
CREATE INDEX idx_comment_templates_teacher_id ON public.comment_templates(teacher_id);
CREATE INDEX idx_comment_templates_category ON public.comment_templates(category);

-- Create trigger for updated_at
CREATE TRIGGER update_submission_comments_updated_at
  BEFORE UPDATE ON public.submission_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comment_templates_updated_at
  BEFORE UPDATE ON public.comment_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
