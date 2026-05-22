-- Create student groups table
CREATE TABLE IF NOT EXISTS public.student_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- Create group tasks table (many-to-many relationship between groups and tasks)
CREATE TABLE IF NOT EXISTS public.group_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.student_groups(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, task_id)
);

-- Create weekly reports table
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, week_start)
);

-- Enable RLS
ALTER TABLE public.student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_groups
CREATE POLICY "Teachers can view their own groups" 
ON public.student_groups 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create groups" 
ON public.student_groups 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own groups" 
ON public.student_groups 
FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own groups" 
ON public.student_groups 
FOR DELETE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view groups they belong to"
ON public.student_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = student_groups.id
    AND group_members.student_id = auth.uid()
  )
);

-- RLS Policies for group_members
CREATE POLICY "Teachers can manage members of their groups" 
ON public.group_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.student_groups
    WHERE student_groups.id = group_members.group_id
    AND student_groups.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view their group memberships"
ON public.group_members
FOR SELECT
USING (auth.uid() = student_id);

-- RLS Policies for group_tasks
CREATE POLICY "Teachers can manage tasks for their groups" 
ON public.group_tasks 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.student_groups
    WHERE student_groups.id = group_tasks.group_id
    AND student_groups.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view tasks for their groups"
ON public.group_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_tasks.group_id
    AND group_members.student_id = auth.uid()
  )
);

-- RLS Policies for weekly_reports
CREATE POLICY "Teachers can view their own reports" 
ON public.weekly_reports 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own reports" 
ON public.weekly_reports 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

-- Create indexes for better performance
CREATE INDEX idx_student_groups_teacher_id ON public.student_groups(teacher_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_student_id ON public.group_members(student_id);
CREATE INDEX idx_group_tasks_group_id ON public.group_tasks(group_id);
CREATE INDEX idx_group_tasks_task_id ON public.group_tasks(task_id);
CREATE INDEX idx_weekly_reports_teacher_id ON public.weekly_reports(teacher_id);
CREATE INDEX idx_weekly_reports_week_start ON public.weekly_reports(week_start);

-- Trigger for updating updated_at
CREATE TRIGGER update_student_groups_updated_at
BEFORE UPDATE ON public.student_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();