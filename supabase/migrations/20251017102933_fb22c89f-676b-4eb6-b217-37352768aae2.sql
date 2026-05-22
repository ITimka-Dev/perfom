-- Remove coins column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS coins;

-- Remove price from pet_shop_items and add required items system
ALTER TABLE public.pet_shop_items DROP COLUMN IF EXISTS price;

-- Add table for required items to buy pet shop items
CREATE TABLE IF NOT EXISTS public.pet_shop_item_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_item_id uuid NOT NULL REFERENCES public.pet_shop_items(id) ON DELETE CASCADE,
  required_item_id uuid NOT NULL REFERENCES public.farm_items(id) ON DELETE CASCADE,
  quantity_needed integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(shop_item_id, required_item_id)
);

-- Enable RLS
ALTER TABLE public.pet_shop_item_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pet shop item costs"
ON public.pet_shop_item_costs FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage pet shop item costs"
ON public.pet_shop_item_costs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index
CREATE INDEX idx_pet_shop_item_costs_shop_item ON public.pet_shop_item_costs(shop_item_id);