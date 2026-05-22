-- Add missing zone types to the enum
ALTER TYPE zone_type ADD VALUE IF NOT EXISTS 'chemistry';
ALTER TYPE zone_type ADD VALUE IF NOT EXISTS 'math';
ALTER TYPE zone_type ADD VALUE IF NOT EXISTS 'it';