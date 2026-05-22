import { DataSource } from 'typeorm';
import { Achievement } from '../../modules/achievements/entities/achievement.entity';

export async function seedAchievements(dataSource: DataSource): Promise<void> {
  const achievementRepository = dataSource.getRepository(Achievement);

  // Check if achievements already exist
  const existingAchievements = await achievementRepository.count();
  if (existingAchievements > 0) {
    console.log('Achievements already seeded, skipping...');
    return;
  }

  const achievements = [
    // Достижения за уровни
    {
      title: 'Первые шаги',
      description: 'Достигни 5 уровня в любой зоне',
      icon: '🌱',
      rarity: 'common' as const,
      conditionType: 'level_reached',
      conditionValue: 5,
    },
    {
      title: 'Растущий ученик',
      description: 'Достигни 10 уровня в любой зоне',
      icon: '📚',
      rarity: 'common' as const,
      conditionType: 'level_reached',
      conditionValue: 10,
    },
    {
      title: 'Опытный исследователь',
      description: 'Достигни 20 уровня в любой зоне',
      icon: '🎓',
      rarity: 'rare' as const,
      conditionType: 'level_reached',
      conditionValue: 20,
    },
    {
      title: 'Мастер науки',
      description: 'Достигни 50 уровня в любой зоне',
      icon: '🔬',
      rarity: 'epic' as const,
      conditionType: 'level_reached',
      conditionValue: 50,
    },
    {
      title: 'Легендарный гений',
      description: 'Достигни 100 уровня в любой зоне',
      icon: '👑',
      rarity: 'legendary' as const,
      conditionType: 'level_reached',
      conditionValue: 100,
    },

    // Достижения за опыт
    {
      title: 'Начало пути',
      description: 'Заработай первые 100 XP',
      icon: '⭐',
      rarity: 'common' as const,
      conditionType: 'xp_earned',
      conditionValue: 100,
    },
    {
      title: 'Жажда знаний',
      description: 'Заработай 1 000 XP',
      icon: '✨',
      rarity: 'common' as const,
      conditionType: 'xp_earned',
      conditionValue: 1000,
    },
    {
      title: 'Мастер опыта',
      description: 'Заработай 10 000 XP',
      icon: '💫',
      rarity: 'rare' as const,
      conditionType: 'xp_earned',
      conditionValue: 10000,
    },
    {
      title: 'Коллекционер XP',
      description: 'Заработай 50 000 XP',
      icon: '🌟',
      rarity: 'epic' as const,
      conditionType: 'xp_earned',
      conditionValue: 50000,
    },

    // Достижения за задания
    {
      title: 'Начинающий ученик',
      description: 'Выполни 5 заданий',
      icon: '📝',
      rarity: 'common' as const,
      conditionType: 'tasks_completed',
      conditionValue: 5,
    },
    {
      title: 'Старательный ученик',
      description: 'Выполни 25 заданий',
      icon: '📖',
      rarity: 'common' as const,
      conditionType: 'tasks_completed',
      conditionValue: 25,
    },
    {
      title: 'Мастер заданий',
      description: 'Выполни 50 заданий',
      icon: '📋',
      rarity: 'rare' as const,
      conditionType: 'tasks_completed',
      conditionValue: 50,
    },
    {
      title: 'Герой заданий',
      description: 'Выполни 100 заданий',
      icon: '🏆',
      rarity: 'epic' as const,
      conditionType: 'tasks_completed',
      conditionValue: 100,
    },
    {
      title: 'Идеальный результат',
      description: 'Получи максимальную оценку за задание',
      icon: '💯',
      rarity: 'rare' as const,
      conditionType: 'perfect_grade',
      conditionValue: 1,
    },
    {
      title: 'Перфекционист',
      description: 'Получи максимальную оценку 10 раз',
      icon: '🌟',
      rarity: 'epic' as const,
      conditionType: 'perfect_grade',
      conditionValue: 10,
    },

    // Достижения за ферму
    {
      title: 'Первый урожай',
      description: 'Собери свой первый урожай',
      icon: '🌾',
      rarity: 'common' as const,
      conditionType: 'plants_harvested',
      conditionValue: 1,
    },
    {
      title: 'Зелёные пальцы',
      description: 'Собери 25 урожаев',
      icon: '🌿',
      rarity: 'common' as const,
      conditionType: 'plants_harvested',
      conditionValue: 25,
    },
    {
      title: 'Мастер-фермер',
      description: 'Собери 100 урожаев',
      icon: '👨‍🌾',
      rarity: 'rare' as const,
      conditionType: 'plants_harvested',
      conditionValue: 100,
    },
    {
      title: 'Заботливый хозяин',
      description: 'Собери ресурсы с животных 20 раз',
      icon: '🐄',
      rarity: 'common' as const,
      conditionType: 'animals_collected',
      conditionValue: 20,
    },
    {
      title: 'Производственник',
      description: 'Заверши 50 производственных цепочек',
      icon: '⚙️',
      rarity: 'rare' as const,
      conditionType: 'productions_completed',
      conditionValue: 50,
    },

    // Достижения за питомца
    {
      title: 'Любитель питомцев',
      description: 'Заведи своего первого питомца',
      icon: '🐾',
      rarity: 'common' as const,
      conditionType: 'pets_created',
      conditionValue: 1,
    },
    {
      title: 'Заботливый хозяин',
      description: 'Покорми питомца 50 раз',
      icon: '🍖',
      rarity: 'common' as const,
      conditionType: 'pet_fed',
      conditionValue: 50,
    },
    {
      title: 'Лучший друг',
      description: 'Достигни максимального счастья питомца',
      icon: '💖',
      rarity: 'rare' as const,
      conditionType: 'pet_max_happiness',
      conditionValue: 1,
    },

    // Мульти-зонные достижения
    {
      title: 'Студент Ренессанса',
      description: 'Достигни 10 уровня в 3 разных зонах',
      icon: '🎨',
      rarity: 'epic' as const,
      conditionType: 'multi_zone_level',
      conditionValue: 3,
    },
    {
      title: 'Полимат',
      description: 'Достигни 20 уровня во всех 5 зонах',
      icon: '🧠',
      rarity: 'legendary' as const,
      conditionType: 'all_zones_level',
      conditionValue: 5,
    },
  ];

  const createdAchievements = achievementRepository.create(achievements);
  await achievementRepository.save(createdAchievements);

  console.log(`✅ Seeded ${achievements.length} achievements successfully!`);
}
