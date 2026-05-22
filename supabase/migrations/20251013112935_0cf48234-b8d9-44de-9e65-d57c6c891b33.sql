-- Create pets table for tamagotchi feature
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cow', 'chicken', 'sheep')),
  hunger INTEGER NOT NULL DEFAULT 100 CHECK (hunger >= 0 AND hunger <= 100),
  thirst INTEGER NOT NULL DEFAULT 100 CHECK (thirst >= 0 AND thirst <= 100),
  happiness INTEGER NOT NULL DEFAULT 100 CHECK (happiness >= 0 AND happiness <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_fed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_watered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ran_away_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Users can view their own pet
CREATE POLICY "Users can view own pet"
ON public.pets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own pet (only one)
CREATE POLICY "Users can create own pet"
ON public.pets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pet
CREATE POLICY "Users can update own pet"
ON public.pets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own pet
CREATE POLICY "Users can delete own pet"
ON public.pets
FOR DELETE
USING (auth.uid() = user_id);

-- Function to check if pet should run away (2 weeks = 14 days)
CREATE OR REPLACE FUNCTION check_pet_run_away()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If any stat drops to 0 or no activity for 14 days, pet runs away
  IF NEW.hunger <= 0 OR NEW.thirst <= 0 OR NEW.happiness <= 0 THEN
    NEW.ran_away_at = now();
  ELSIF GREATEST(NEW.last_fed_at, NEW.last_watered_at, NEW.last_played_at) < now() - INTERVAL '14 days' THEN
    NEW.ran_away_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check if pet runs away on update
CREATE TRIGGER check_pet_run_away_trigger
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION check_pet_run_away();