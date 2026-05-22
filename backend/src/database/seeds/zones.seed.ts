import { DataSource } from 'typeorm';
import { FarmZone } from '../../modules/zones/entities/farm-zone.entity';

export async function seedZones(dataSource: DataSource): Promise<void> {
  const zoneRepository = dataSource.getRepository(FarmZone);

  // Check if zones already exist
  const existingZones = await zoneRepository.count();
  if (existingZones > 0) {
    console.log('Zones already seeded, skipping...');
    return;
  }

  const zones = [
    {
      name: 'Биология',
      zoneType: 'biology' as const,
      description: 'Выращивай растения, заботься о животных. Изучай фотосинтез, генетику и экосистемы.',
      iconUrl: '/assets/zone-biology.png',
      unlockLevel: 1,
      allowedSlotTypes: ['plants', 'animals', 'production'],
    },
    {
      name: 'Химия',
      zoneType: 'chemistry' as const,
      description: 'Исследуй реакции и соединения. Создавай удобрения, эфирные масла и растворы.',
      iconUrl: '/assets/zone-chemistry.png',
      unlockLevel: 1,
      allowedSlotTypes: ['plants', 'animals', 'production'],
    },
    {
      name: 'Физика',
      zoneType: 'physics' as const,
      description: 'Собирай механизмы и источники энергии. Познавай законы механики и электричества.',
      iconUrl: '/assets/zone-physics.png',
      unlockLevel: 3,
      allowedSlotTypes: ['plants', 'animals', 'production'],
    },
    {
      name: 'Математика',
      zoneType: 'mathematics' as const,
      description: 'Вычисляй, оптимизируй и планируй. Фракталы, геометрия и статистика на ферме.',
      iconUrl: '/assets/zone-math.png',
      unlockLevel: 1,
      allowedSlotTypes: ['plants', 'animals', 'production'],
    },
    {
      name: 'IT & Программирование',
      zoneType: 'it' as const,
      description: 'Программируй, автоматизируй, обучай ИИ. Алгоритмы и структуры данных в действии.',
      iconUrl: '/assets/zone-it.png',
      unlockLevel: 5,
      allowedSlotTypes: ['plants', 'animals', 'production'],
    },
  ];

  const createdZones = zoneRepository.create(zones);
  await zoneRepository.save(createdZones);

  console.log(`✅ Seeded ${zones.length} zones successfully!`);
}
