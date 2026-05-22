import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { seedZones } from './zones.seed';
import { seedFarmItems } from './farm-items.seed';
import { seedAchievements } from './achievements.seed';
import { seedTasks } from './tasks.seed';
import { seedBoosters } from './boosters.seed';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');

  // Create data source
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'edufarm',
    entities: [join(__dirname, '../../modules/**/*.entity{.ts,.js}')],
    synchronize: false,
  });

  try {
    // Initialize data source
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run seeds in order (zones first, as other entities depend on them)
    console.log('📍 Seeding zones...');
    await seedZones(dataSource);

    console.log('\n🌾 Seeding farm items...');
    await seedFarmItems(dataSource);

    console.log('\n🏆 Seeding achievements...');
    await seedAchievements(dataSource);

    console.log('\n📚 Seeding tasks...');
    await seedTasks(dataSource);

    console.log('\n⚡ Seeding boosters...');
    await seedBoosters(dataSource);

    console.log('\n✅ All seeds completed successfully!');
    console.log('\n📊 Database Summary:');
    
    // Show counts
    const zonesCount = await dataSource.getRepository('FarmZone').count();
    const itemsCount = await dataSource.getRepository('FarmItem').count();
    const achievementsCount = await dataSource.getRepository('Achievement').count();
    const tasksCount = await dataSource.getRepository('Task').count();
    const boostersCount = await dataSource.query('SELECT COUNT(*) FROM zone_boosters').then(r => r[0].count);

    console.log(`   - Zones: ${zonesCount}`);
    console.log(`   - Farm Items: ${itemsCount}`);
    console.log(`   - Achievements: ${achievementsCount}`);
    console.log(`   - Tasks: ${tasksCount}`);
    console.log(`   - Boosters: ${boostersCount}`);
    console.log('\n🎉 Seeding process complete!\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close connection
    await dataSource.destroy();
    console.log('👋 Database connection closed');
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runSeeds };
