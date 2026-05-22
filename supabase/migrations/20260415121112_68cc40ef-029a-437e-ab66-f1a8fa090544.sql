
INSERT INTO user_inventory (user_id, item_id, quantity)
VALUES 
  ('fd415fa7-297d-4e2a-85f5-4de6112a0a18', '11111111-1111-1111-1111-111111111111', 10),
  ('20e6ffd6-388c-4519-b20e-c23a8148021d', '11111111-1111-1111-1111-111111111111', 10),
  ('3cfb776c-5d98-4368-9d7a-cd00c15a4127', '11111111-1111-1111-1111-111111111111', 10)
ON CONFLICT (user_id, item_id) DO UPDATE SET quantity = user_inventory.quantity + 10;
