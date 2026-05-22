-- Update existing farm zones with correct allowed_slot_types
UPDATE public.farm_zones
SET allowed_slot_types = ARRAY['plants', 'animals']::text[],
    description = 'Растения и животные'
WHERE zone_type = 'biology';

UPDATE public.farm_zones
SET allowed_slot_types = ARRAY['production']::text[],
    description = 'Производственные цепочки'
WHERE zone_type = 'physics';

UPDATE public.farm_zones
SET allowed_slot_types = ARRAY['boosters']::text[],
    description = 'Бустеры производства'
WHERE zone_type = 'chemistry';

UPDATE public.farm_zones
SET allowed_slot_types = ARRAY['boosters']::text[],
    description = 'Бустеры времени',
    zone_type = 'math'
WHERE zone_type = 'mathematics';

UPDATE public.farm_zones
SET allowed_slot_types = ARRAY['boosters']::text[],
    description = 'Автоматизация'
WHERE zone_type = 'it';