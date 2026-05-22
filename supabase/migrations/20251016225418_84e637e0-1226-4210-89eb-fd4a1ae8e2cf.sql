-- Create enum for item categories
CREATE TYPE item_category AS ENUM ('seed', 'raw', 'product', 'feed', 'booster');

-- Create enum for slot types
CREATE TYPE slot_type AS ENUM ('plant', 'animal', 'production');

-- Create enum for trade status
CREATE TYPE trade_status AS ENUM ('listed', 'sold', 'cancelled');

-- Farm Items (seeds, raw materials, products)
CREATE TABLE farm_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category item_category NOT NULL,
  zone_id UUID REFERENCES farm_zones(id),
  icon_emoji TEXT NOT NULL,
  production_time INTEGER, -- in seconds, null for non-producible items
  sell_price_npc INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Production Chains (recipes)
CREATE TABLE production_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  output_item_id UUID REFERENCES farm_items(id) NOT NULL,
  output_quantity INTEGER DEFAULT 1,
  base_time INTEGER NOT NULL, -- in seconds
  zone_id UUID REFERENCES farm_zones(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Production Chain Ingredients
CREATE TABLE production_chain_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES production_chains(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES farm_items(id) NOT NULL,
  quantity_needed INTEGER NOT NULL
);

-- Farm Animals (types)
CREATE TABLE farm_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  zone_id UUID REFERENCES farm_zones(id) NOT NULL,
  icon_emoji TEXT NOT NULL,
  feed_item_id UUID REFERENCES farm_items(id),
  production_item_id UUID REFERENCES farm_items(id) NOT NULL,
  production_time INTEGER NOT NULL, -- in seconds
  max_happiness INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Farm Animals (owned animals)
CREATE TABLE user_farm_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  animal_id UUID REFERENCES farm_animals(id) NOT NULL,
  last_fed_at TIMESTAMPTZ DEFAULT now(),
  last_collected_at TIMESTAMPTZ DEFAULT now(),
  happiness INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Inventory
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID REFERENCES farm_items(id) NOT NULL,
  quantity INTEGER DEFAULT 0,
  UNIQUE(user_id, item_id)
);

-- User Active Productions
CREATE TABLE user_productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chain_id UUID REFERENCES production_chains(id) NOT NULL,
  zone_id UUID REFERENCES farm_zones(id) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  finish_at TIMESTAMPTZ NOT NULL,
  slot_index INTEGER NOT NULL, -- which production slot
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Farm Slots (purchased slots)
CREATE TABLE user_farm_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  zone_id UUID REFERENCES farm_zones(id) NOT NULL,
  slot_type slot_type NOT NULL,
  unlocked_count INTEGER DEFAULT 3, -- start with 3 slots
  UNIQUE(user_id, zone_id, slot_type)
);

-- NPC Shop
CREATE TABLE npc_shop (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES farm_items(id) NOT NULL,
  buy_price INTEGER NOT NULL,
  stock_limit INTEGER, -- null for unlimited
  refresh_time INTEGER, -- in seconds, null for no refresh
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player Market Listings
CREATE TABLE player_market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  item_id UUID REFERENCES farm_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_unit INTEGER NOT NULL,
  status trade_status DEFAULT 'listed',
  created_at TIMESTAMPTZ DEFAULT now(),
  sold_at TIMESTAMPTZ,
  buyer_id UUID
);

-- Player Trades History
CREATE TABLE player_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES player_market_listings(id),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  item_id UUID REFERENCES farm_items(id) NOT NULL,
  quantity INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Zone Boosters (Math/IT)
CREATE TABLE zone_boosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  zone_id UUID REFERENCES farm_zones(id) NOT NULL,
  speed_multiplier DECIMAL(3,2) DEFAULT 1.0, -- e.g., 1.5 = 50% faster
  duration INTEGER NOT NULL, -- active duration in seconds
  cooldown INTEGER NOT NULL, -- cooldown in seconds
  unlock_achievement_id UUID REFERENCES achievements(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Active Boosters
CREATE TABLE user_active_boosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booster_id UUID REFERENCES zone_boosters(id) NOT NULL,
  activated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  can_activate_again_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, booster_id)
);

-- Enable RLS on all tables
ALTER TABLE farm_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_chain_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_farm_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_farm_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE npc_shop ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_active_boosters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for farm_items
CREATE POLICY "Anyone can view farm items" ON farm_items FOR SELECT USING (true);
CREATE POLICY "Only admins can manage farm items" ON farm_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for production_chains
CREATE POLICY "Anyone can view production chains" ON production_chains FOR SELECT USING (true);
CREATE POLICY "Only admins can manage production chains" ON production_chains FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for production_chain_ingredients
CREATE POLICY "Anyone can view chain ingredients" ON production_chain_ingredients FOR SELECT USING (true);
CREATE POLICY "Only admins can manage chain ingredients" ON production_chain_ingredients FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for farm_animals
CREATE POLICY "Anyone can view farm animals" ON farm_animals FOR SELECT USING (true);
CREATE POLICY "Only admins can manage farm animals" ON farm_animals FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_farm_animals
CREATE POLICY "Users can view own animals" ON user_farm_animals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own animals" ON user_farm_animals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own animals" ON user_farm_animals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own animals" ON user_farm_animals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_inventory
CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_productions
CREATE POLICY "Users can view own productions" ON user_productions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own productions" ON user_productions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own productions" ON user_productions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own productions" ON user_productions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_farm_slots
CREATE POLICY "Users can view own slots" ON user_farm_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own slots" ON user_farm_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slots" ON user_farm_slots FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for npc_shop
CREATE POLICY "Anyone can view NPC shop" ON npc_shop FOR SELECT USING (true);
CREATE POLICY "Only admins can manage NPC shop" ON npc_shop FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for player_market_listings
CREATE POLICY "Anyone can view active listings" ON player_market_listings FOR SELECT USING (status = 'listed' OR seller_id = auth.uid() OR buyer_id = auth.uid());
CREATE POLICY "Users can create own listings" ON player_market_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own listings" ON player_market_listings FOR UPDATE USING (auth.uid() = seller_id);

-- RLS Policies for player_trades
CREATE POLICY "Users can view own trades" ON player_trades FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "System can insert trades" ON player_trades FOR INSERT WITH CHECK (true);

-- RLS Policies for zone_boosters
CREATE POLICY "Anyone can view boosters" ON zone_boosters FOR SELECT USING (true);
CREATE POLICY "Only admins can manage boosters" ON zone_boosters FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_active_boosters
CREATE POLICY "Users can view own boosters" ON user_active_boosters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own boosters" ON user_active_boosters FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_user_productions_user ON user_productions(user_id);
CREATE INDEX idx_user_productions_finish ON user_productions(finish_at);
CREATE INDEX idx_user_farm_animals_user ON user_farm_animals(user_id);
CREATE INDEX idx_player_market_status ON player_market_listings(status);
CREATE INDEX idx_user_active_boosters_user ON user_active_boosters(user_id);
CREATE INDEX idx_user_active_boosters_expires ON user_active_boosters(expires_at);