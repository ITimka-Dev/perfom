-- Fix security issue with check_pet_run_away function
DROP FUNCTION IF EXISTS check_pet_run_away() CASCADE;

CREATE OR REPLACE FUNCTION check_pet_run_away()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recreate trigger
CREATE TRIGGER check_pet_run_away_trigger
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION check_pet_run_away();