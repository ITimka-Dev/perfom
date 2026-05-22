-- Add target_grades and attachment_urls to tasks table
ALTER TABLE tasks 
ADD COLUMN target_grades integer[] DEFAULT '{}',
ADD COLUMN attachment_urls text[] DEFAULT '{}';

-- Create teacher_subjects table
CREATE TABLE teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES farm_zones(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, zone_id)
);

-- Enable RLS
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- RLS policies for teacher_subjects
CREATE POLICY "Teachers can view own subjects"
  ON teacher_subjects FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own subjects"
  ON teacher_subjects FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own subjects"
  ON teacher_subjects FOR DELETE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Anyone can view teacher subjects"
  ON teacher_subjects FOR SELECT
  USING (true);