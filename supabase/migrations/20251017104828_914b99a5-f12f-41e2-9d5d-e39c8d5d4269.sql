-- Insert farm items (seeds and products)
INSERT INTO farm_items (id, name, description, category, icon_emoji, zone_id, production_time, unlock_tasks_required) VALUES
-- Seeds (Biology zone)
('11111111-1111-1111-1111-111111111111', 'Пшеница', 'Базовая зерновая культура', 'seed', '🌾', '8b156789-f1f0-4394-b4ae-94efbc93af14', 300, 0),

-- Products
('22222222-2222-2222-2222-222222222222', 'Молоко', 'Свежее коровье молоко', 'product', '🥛', '8b156789-f1f0-4394-b4ae-94efbc93af14', 0, 0),
('33333333-3333-3333-3333-333333333333', 'Яйцо', 'Свежее куриное яйцо', 'product', '🥚', '8b156789-f1f0-4394-b4ae-94efbc93af14', 0, 0),
('44444444-4444-4444-4444-444444444444', 'Хлеб', 'Свежий хлеб', 'product', '🍞', '375de249-4716-43a9-8cea-f08f25cde301', 0, 0);

-- Insert farm animals (Biology zone)
INSERT INTO farm_animals (id, name, description, icon_emoji, zone_id, production_item_id, production_time, unlock_tasks_required) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Корова', 'Дает молоко', '🐄', '8b156789-f1f0-4394-b4ae-94efbc93af14', '22222222-2222-2222-2222-222222222222', 600, 0),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Курица', 'Несет яйца', '🐔', '8b156789-f1f0-4394-b4ae-94efbc93af14', '33333333-3333-3333-3333-333333333333', 300, 2);

-- Insert production chain (Physics zone - Bread)
INSERT INTO production_chains (id, name, zone_id, output_item_id, output_quantity, base_time, unlock_tasks_required) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Хлеб', '375de249-4716-43a9-8cea-f08f25cde301', '44444444-4444-4444-4444-444444444444', 1, 900, 0);

-- Insert production chain ingredients for bread recipe
INSERT INTO production_chain_ingredients (chain_id, item_id, quantity_needed) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 3), -- 3x Wheat
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 2), -- 2x Eggs
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 1); -- 1x Milk