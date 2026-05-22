-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create enum for zone types
CREATE TYPE public.zone_type AS ENUM ('physics', 'biology', 'chemistry', 'mathematics', 'it');

-- Create enum for achievement rarity
CREATE TYPE public.achievement_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  school_name TEXT,
  grade INTEGER CHECK (grade >= 5 AND grade <= 11),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create farm_zones table
CREATE TABLE public.farm_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_type zone_type UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  unlock_level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_zone_progress table
CREATE TABLE public.user_zone_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  zone_id UUID REFERENCES public.farm_zones(id) ON DELETE CASCADE NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, zone_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES public.farm_zones(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  experience_reward INTEGER DEFAULT 100,
  required_level INTEGER DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_submissions table
CREATE TABLE public.task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  file_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  teacher_feedback TEXT,
  grade INTEGER CHECK (grade >= 1 AND grade <= 5),
  reviewed_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  rarity achievement_rarity DEFAULT 'common',
  icon TEXT DEFAULT 'trophy',
  condition_type TEXT,
  condition_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_zone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Helper function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for farm_zones
CREATE POLICY "Anyone can view zones"
  ON public.farm_zones FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage zones"
  ON public.farm_zones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_zone_progress
CREATE POLICY "Users can view own progress"
  ON public.user_zone_progress FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own progress"
  ON public.user_zone_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_zone_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Anyone can view tasks"
  ON public.tasks FOR SELECT
  USING (true);

CREATE POLICY "Teachers and admins can manage tasks"
  ON public.tasks FOR ALL
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for task_submissions
CREATE POLICY "Users can view own submissions"
  ON public.task_submissions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own submissions"
  ON public.task_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending submissions"
  ON public.task_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Teachers can update submissions"
  ON public.task_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage achievements"
  ON public.achievements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view all user achievements"
  ON public.user_achievements FOR SELECT
  USING (true);

CREATE POLICY "System can insert achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_zone_progress_updated_at
  BEFORE UPDATE ON public.user_zone_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default farm zones
INSERT INTO public.farm_zones (zone_type, name, description, unlock_level) VALUES
  ('physics', 'Физика', 'Изучай законы природы через практику', 1),
  ('biology', 'Биология', 'Познай тайны живой природы', 1),
  ('chemistry', 'Химия', 'Открой мир молекул и реакций', 3),
  ('mathematics', 'Математика', 'Реши задачи и построй модели', 1),
  ('it', 'IT & Программирование', 'Автоматизируй свою ферму', 5);

-- Insert default achievements
INSERT INTO public.achievements (title, description, rarity, icon, condition_type, condition_value) VALUES
  ('Первые шаги', 'Завершите первое задание', 'common', 'star', 'tasks_completed', 1),
  ('Упорный ученик', 'Завершите 10 заданий', 'rare', 'trophy', 'tasks_completed', 10),
  ('Агророкстар', 'Достигни уровня 10 в любой зоне', 'rare', 'trophy', 'zone_level', 10),
  ('Неудача — тоже опыт', 'Повтори задание 3 раза подряд', 'common', 'zap', 'task_retries', 3),
  ('Фермер на Python', 'Завершите 5 заданий по программированию', 'epic', 'trophy', 'it_tasks', 5),
  ('Мастер науки', 'Достигни уровня 5 во всех зонах', 'legendary', 'trophy', 'all_zones_level', 5);