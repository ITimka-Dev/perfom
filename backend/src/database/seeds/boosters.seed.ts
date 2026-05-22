import { DataSource } from 'typeorm';

export async function seedBoosters(dataSource: DataSource) {
  // Ensure table exists
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS zone_boosters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      zone_id UUID NOT NULL REFERENCES farm_zones(id),
      speed_multiplier NUMERIC DEFAULT 1.0,
      duration INTEGER NOT NULL,
      cooldown INTEGER NOT NULL,
      unlock_achievement_id UUID REFERENCES achievements(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS user_active_boosters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      booster_id UUID NOT NULL REFERENCES zone_boosters(id),
      activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      can_activate_again_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `);

  // Get zone IDs
  const zones = await dataSource.query('SELECT id, "zoneType" FROM farm_zones');
  const zoneMap: Record<string, string> = {};
  for (const zone of zones) {
    zoneMap[zone.zoneType] = zone.id;
  }

  if (!zoneMap.chemistry && !zoneMap.mathematics && !zoneMap.it) {
    console.log('⚠️  No booster zones found, skipping boosters seed');
    return;
  }

  const boosters = [
    // Chemistry boosters — accelerate biology (plants & animals)
    {
      name: 'Катализатор роста',
      description: 'Ускоряет рост растений в Биологии на 50%',
      zone_id: zoneMap.chemistry,
      duration: 600, // 10 minutes
      cooldown: 1800, // 30 minutes
      speed_multiplier: 1.5,
    },
    {
      name: 'Стимулятор кормления',
      description: 'Ускоряет производство животных в Биологии на 30%',
      zone_id: zoneMap.chemistry,
      duration: 900, // 15 minutes
      cooldown: 2700, // 45 minutes
      speed_multiplier: 1.3,
    },
    // Mathematics boosters — accelerate physics (production chains)
    {
      name: 'Оптимизатор процессов',
      description: 'Ускоряет цепочки производства в Физике на 40%',
      zone_id: zoneMap.mathematics || zoneMap.math,
      duration: 600,
      cooldown: 1800,
      speed_multiplier: 1.4,
    },
    {
      name: 'Формула эффективности',
      description: 'Удваивает выход продукции в Физике',
      zone_id: zoneMap.mathematics || zoneMap.math,
      duration: 300, // 5 minutes
      cooldown: 3600, // 60 minutes
      speed_multiplier: 2.0,
    },
    // IT boosters — bonus for biology AND physics, but 2x cooldown
    {
      name: 'Автоматизация v1.0',
      description: 'Ускоряет Биологию и Физику на 25% (длинный откат)',
      zone_id: zoneMap.it,
      duration: 900, // 15 minutes
      cooldown: 3600, // 60 minutes (2x normal)
      speed_multiplier: 1.25,
    },
    {
      name: 'Нейросетевой анализ',
      description: 'Бонус ко всем процессам Биологии и Физики на 35% (длинный откат)',
      zone_id: zoneMap.it,
      duration: 600,
      cooldown: 5400, // 90 minutes (2x normal)
      speed_multiplier: 1.35,
    },
  ].filter(b => b.zone_id); // filter out any with undefined zone

  for (const booster of boosters) {
    const existing = await dataSource.query(
      'SELECT id FROM zone_boosters WHERE name = $1 AND zone_id = $2',
      [booster.name, booster.zone_id]
    );

    if (existing.length === 0) {
      await dataSource.query(
        `INSERT INTO zone_boosters (name, description, zone_id, duration, cooldown, speed_multiplier) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [booster.name, booster.description, booster.zone_id, booster.duration, booster.cooldown, booster.speed_multiplier]
      );
      console.log(`  ✅ Created booster: ${booster.name}`);
    } else {
      console.log(`  ⏭️  Booster already exists: ${booster.name}`);
    }
  }
}
