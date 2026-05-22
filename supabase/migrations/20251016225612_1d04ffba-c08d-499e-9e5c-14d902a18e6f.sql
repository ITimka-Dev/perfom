-- Add coins to user profile
ALTER TABLE profiles ADD COLUMN coins INTEGER DEFAULT 100;

-- Create pet shop items table
CREATE TABLE pet_shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL, -- 'food', 'water', 'toy', 'skin'
  price INTEGER NOT NULL,
  icon_emoji TEXT NOT NULL,
  stat_effect_hunger INTEGER DEFAULT 0,
  stat_effect_thirst INTEGER DEFAULT 0,
  stat_effect_happiness INTEGER DEFAULT 0,
  is_consumable BOOLEAN DEFAULT true, -- false for skins
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user purchased pet items (skins, toys owned)
CREATE TABLE user_pet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID REFERENCES pet_shop_items(id) NOT NULL,
  quantity INTEGER DEFAULT 1,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE pet_shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pet_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pet_shop_items
CREATE POLICY "Anyone can view pet shop items" ON pet_shop_items FOR SELECT USING (true);
CREATE POLICY "Only admins can manage pet shop items" ON pet_shop_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_pet_items
CREATE POLICY "Users can view own pet items" ON user_pet_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pet items" ON user_pet_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pet items" ON user_pet_items FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_pet_items_user ON user_pet_items(user_id);