-- PostgreSQL Database Schema for EduFarm
-- This schema is based on the Supabase migrations

-- Create ENUM types
CREATE TYPE app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE zone_type AS ENUM ('biology', 'chemistry', 'physics', 'mathematics', 'it');
CREATE TYPE achievement_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE item_category AS ENUM ('seed', 'crop', 'animal_product', 'processed');
CREATE TYPE slot_type AS ENUM ('plants', 'animals', 'production');

-- Users table (managed by backend, not Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    school_name TEXT,
    grade INTEGER CHECK (grade >= 1 AND grade <= 11),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm zones table
CREATE TABLE farm_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone_type zone_type NOT NULL,
    description TEXT,
    icon_url TEXT,
    unlock_level INTEGER DEFAULT 1,
    allowed_slot_types TEXT[] DEFAULT ARRAY['plants', 'animals', 'production'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    difficulty INTEGER,
    experience_reward INTEGER DEFAULT 100,
    required_level INTEGER DEFAULT 1,
    target_grades INTEGER[] DEFAULT '{}',
    attachment_urls TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task submissions table
CREATE TABLE task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    submission_text TEXT,
    file_urls TEXT[],
    status VARCHAR(50) DEFAULT 'pending',
    grade INTEGER,
    teacher_feedback TEXT,
    reviewed_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Teacher subjects table
CREATE TABLE teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id),
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, zone_id)
);

-- User zone progress table
CREATE TABLE user_zone_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, zone_id)
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'trophy',
    rarity achievement_rarity DEFAULT 'common',
    condition_type TEXT,
    condition_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements table
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Farm items table
CREATE TABLE farm_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category item_category NOT NULL,
    icon_emoji TEXT NOT NULL,
    zone_id UUID REFERENCES farm_zones(id),
    production_time INTEGER,
    sell_price_npc INTEGER DEFAULT 0,
    unlock_tasks_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User inventory table
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    item_id UUID NOT NULL REFERENCES farm_items(id),
    quantity INTEGER DEFAULT 0,
    UNIQUE(user_id, item_id)
);

-- User plants table
CREATE TABLE user_plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    seed_item_id UUID NOT NULL REFERENCES farm_items(id),
    slot_index INTEGER NOT NULL,
    planted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    watered_at TIMESTAMP WITH TIME ZONE,
    needs_water BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm animals table
CREATE TABLE farm_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_emoji TEXT NOT NULL,
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    feed_item_id UUID REFERENCES farm_items(id),
    production_item_id UUID NOT NULL REFERENCES farm_items(id),
    production_time INTEGER NOT NULL,
    max_happiness INTEGER DEFAULT 100,
    unlock_tasks_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User farm animals table
CREATE TABLE user_farm_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    animal_id UUID NOT NULL REFERENCES farm_animals(id),
    happiness INTEGER DEFAULT 100,
    last_fed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production chains table
CREATE TABLE production_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    output_item_id UUID NOT NULL REFERENCES farm_items(id),
    output_quantity INTEGER DEFAULT 1,
    base_time INTEGER NOT NULL,
    unlock_tasks_required INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production chain ingredients table
CREATE TABLE production_chain_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID NOT NULL REFERENCES production_chains(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES farm_items(id),
    quantity_needed INTEGER NOT NULL
);

-- User productions table
CREATE TABLE user_productions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    chain_id UUID NOT NULL REFERENCES production_chains(id),
    slot_index INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finish_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User farm slots table
CREATE TABLE user_farm_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    slot_type slot_type NOT NULL,
    unlocked_count INTEGER DEFAULT 3,
    UNIQUE(user_id, zone_id, slot_type)
);

-- Pets table (Tamagotchi)
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    hunger INTEGER NOT NULL DEFAULT 100,
    thirst INTEGER NOT NULL DEFAULT 100,
    happiness INTEGER NOT NULL DEFAULT 100,
    last_fed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_watered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ran_away_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Pet shop items table
CREATE TABLE pet_shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    item_type TEXT NOT NULL,
    icon_emoji TEXT NOT NULL,
    is_consumable BOOLEAN DEFAULT TRUE,
    stat_effect_hunger INTEGER DEFAULT 0,
    stat_effect_thirst INTEGER DEFAULT 0,
    stat_effect_happiness INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet shop item costs table
CREATE TABLE pet_shop_item_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_item_id UUID NOT NULL REFERENCES pet_shop_items(id) ON DELETE CASCADE,
    required_item_id UUID NOT NULL REFERENCES farm_items(id),
    quantity_needed INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User pet items table
CREATE TABLE user_pet_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    item_id UUID NOT NULL REFERENCES pet_shop_items(id),
    quantity INTEGER DEFAULT 1,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pets table
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    hunger INTEGER NOT NULL DEFAULT 100,
    thirst INTEGER NOT NULL DEFAULT 100,
    happiness INTEGER NOT NULL DEFAULT 100,
    last_fed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_watered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ran_away_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zone boosters table
CREATE TABLE zone_boosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    zone_id UUID NOT NULL REFERENCES farm_zones(id),
    speed_multiplier NUMERIC DEFAULT 1.0,
    duration INTEGER NOT NULL,
    cooldown INTEGER NOT NULL,
    unlock_achievement_id UUID REFERENCES achievements(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User active boosters table
CREATE TABLE user_active_boosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    booster_id UUID NOT NULL REFERENCES zone_boosters(id),
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    can_activate_again_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ============================================
-- PERFORMANCE INDEXES FOR OPTIMIZATION
-- ============================================

-- Users and Authentication indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Tasks indexes (most queried)
CREATE INDEX idx_tasks_zone_id ON tasks(zone_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Task submissions indexes (heavy queries)
CREATE INDEX idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_task_submissions_user_id ON task_submissions(user_id);
CREATE INDEX idx_task_submissions_status ON task_submissions(status);
CREATE INDEX idx_task_submissions_submitted_at ON task_submissions(submitted_at DESC);
CREATE INDEX idx_task_submissions_reviewed_by ON task_submissions(reviewed_by);

-- Composite index for teacher submissions queries
CREATE INDEX idx_submissions_task_user ON task_submissions(task_id, user_id);

-- User zone progress indexes
CREATE INDEX idx_user_zone_progress_user_id ON user_zone_progress(user_id);
CREATE INDEX idx_user_zone_progress_zone_id ON user_zone_progress(zone_id);
CREATE INDEX idx_zone_progress_level ON user_zone_progress(level);

-- Inventory indexes
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_inventory_item_id ON user_inventory(item_id);
CREATE INDEX idx_inventory_user_item ON user_inventory(user_id, item_id);

-- Farm plants indexes
CREATE INDEX idx_user_plants_user_id ON user_plants(user_id);
CREATE INDEX idx_plants_zone_id ON user_plants(zone_id);
CREATE INDEX idx_plants_user_zone ON user_plants(user_id, zone_id);

-- Farm animals indexes
CREATE INDEX idx_animals_user_id ON user_farm_animals(user_id);

-- Production indexes
CREATE INDEX idx_productions_user_id ON user_productions(user_id);
CREATE INDEX idx_productions_zone_id ON user_productions(zone_id);
CREATE INDEX idx_productions_finish_at ON user_productions(finish_at);

-- Pet indexes
CREATE INDEX idx_pets_user_id ON pets(user_id);

-- Teacher subjects indexes
CREATE INDEX idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_zone_id ON teacher_subjects(zone_id);

-- Group members indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_student_id ON group_members(student_id);

-- Achievements indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_zone_progress_updated_at BEFORE UPDATE ON user_zone_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
