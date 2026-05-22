-- Add unlock requirements to farm items, animals, and production chains
ALTER TABLE public.farm_items 
ADD COLUMN IF NOT EXISTS unlock_tasks_required integer DEFAULT 0;

ALTER TABLE public.farm_animals 
ADD COLUMN IF NOT EXISTS unlock_tasks_required integer DEFAULT 0;

ALTER TABLE public.production_chains 
ADD COLUMN IF NOT EXISTS unlock_tasks_required integer DEFAULT 0;

-- Set default unlocked items (базовые разблокированные элементы)
-- Пшеница - базово открыта
UPDATE public.farm_items 
SET unlock_tasks_required = 0 
WHERE name = 'Пшеница' AND category = 'seed';

-- Корова - базово открыта
UPDATE public.farm_animals 
SET unlock_tasks_required = 0 
WHERE name = 'Корова';

-- Курица - открывается после 2 заданий по биологии
UPDATE public.farm_animals 
SET unlock_tasks_required = 2 
WHERE name = 'Курица';

-- Рецепт хлеба - базово открыт
UPDATE public.production_chains 
SET unlock_tasks_required = 0 
WHERE name = 'Хлеб';