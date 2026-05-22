-- Drop player trading tables (not needed)
DROP TABLE IF EXISTS public.player_trades CASCADE;
DROP TABLE IF EXISTS public.player_market_listings CASCADE;
DROP TABLE IF EXISTS public.npc_shop CASCADE;

-- Drop coins from profiles (will use for pet shop only, not farm)
-- Actually keep coins for pet shop, just won't use in farm

-- Create user_plants table for storing planted crops
CREATE TABLE public.user_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id uuid NOT NULL REFERENCES public.farm_zones(id) ON DELETE CASCADE,
  slot_index integer NOT NULL,
  seed_item_id uuid NOT NULL REFERENCES public.farm_items(id) ON DELETE CASCADE,
  planted_at timestamp with time zone NOT NULL DEFAULT now(),
  needs_water boolean DEFAULT false,
  watered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, zone_id, slot_index)
);

-- Enable RLS for user_plants
ALTER TABLE public.user_plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plants"
ON public.user_plants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plants"
ON public.user_plants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants"
ON public.user_plants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants"
ON public.user_plants FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_user_plants_user_zone ON public.user_plants(user_id, zone_id);

-- Update farm_zones to have specific zone types and allowed slot types
-- Biology: plants + animals
-- Physics: production
-- Math/Chemistry/IT: boosters only

-- Add allowed_slot_types array to farm_zones
ALTER TABLE public.farm_zones 
ADD COLUMN IF NOT EXISTS allowed_slot_types text[] DEFAULT ARRAY['plants', 'animals', 'production']::text[];