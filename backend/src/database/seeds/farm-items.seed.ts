import { DataSource } from 'typeorm';
import { FarmItem } from '../../modules/farm/entities/farm-item.entity';
import { FarmAnimal } from '../../modules/farm/entities/farm-animal.entity';
import { ProductionChain } from '../../modules/farm/entities/production-chain.entity';
import { ProductionChainIngredient } from '../../modules/farm/entities/production-chain-ingredient.entity';
import { FarmZone } from '../../modules/zones/entities/farm-zone.entity';

export async function seedFarmItems(dataSource: DataSource): Promise<void> {
  const itemRepo = dataSource.getRepository(FarmItem);
  const animalRepo = dataSource.getRepository(FarmAnimal);
  const chainRepo = dataSource.getRepository(ProductionChain);
  const ingredientRepo = dataSource.getRepository(ProductionChainIngredient);
  const zoneRepo = dataSource.getRepository(FarmZone);

  // Check if items already exist
  const existingItems = await itemRepo.count();
  if (existingItems > 0) {
    console.log('Farm items already seeded, skipping...');
    return;
  }

  // Get zones
  const zones: Record<string, FarmZone> = {};
  for (const type of ['biology', 'chemistry', 'physics', 'mathematics', 'it']) {
    const zone = await zoneRepo.findOne({ where: { zoneType: type as any } });
    if (zone) zones[type] = zone;
  }

  if (Object.keys(zones).length < 5) {
    console.error('Not all zones found! Run zones seed first.');
    return;
  }

  // ==================== FARM ITEMS ====================

  const itemsData = [
    // ── Биология ──
    { name: 'Семена пшеницы', description: 'Основная культура для изучения фотосинтеза', category: 'seed' as const, iconEmoji: '🌾', zoneId: zones.biology.id, productionTime: 120, sellPriceNpc: 5, unlockTasksRequired: 0 },
    { name: 'Семена помидоров', description: 'Изучай рост и развитие растений', category: 'seed' as const, iconEmoji: '🍅', zoneId: zones.biology.id, productionTime: 180, sellPriceNpc: 8, unlockTasksRequired: 1 },
    { name: 'Семена подсолнуха', description: 'Наблюдай за гелиотропизмом', category: 'seed' as const, iconEmoji: '🌻', zoneId: zones.biology.id, productionTime: 240, sellPriceNpc: 10, unlockTasksRequired: 2 },
    { name: 'Семена кукурузы', description: 'Узнай о генетике Менделя', category: 'seed' as const, iconEmoji: '🌽', zoneId: zones.biology.id, productionTime: 300, sellPriceNpc: 12, unlockTasksRequired: 3 },
    { name: 'Пшеница', description: 'Собранная пшеница', category: 'crop' as const, iconEmoji: '🌾', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 15, unlockTasksRequired: 0 },
    { name: 'Помидор', description: 'Спелый помидор', category: 'crop' as const, iconEmoji: '🍅', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 20, unlockTasksRequired: 1 },
    { name: 'Подсолнух', description: 'Яркий подсолнух', category: 'crop' as const, iconEmoji: '🌻', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 25, unlockTasksRequired: 2 },
    { name: 'Кукуруза', description: 'Початок кукурузы', category: 'crop' as const, iconEmoji: '🌽', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 30, unlockTasksRequired: 3 },
    { name: 'Молоко', description: 'Свежее молоко', category: 'animal_product' as const, iconEmoji: '🥛', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 35, unlockTasksRequired: 2 },
    { name: 'Яйца', description: 'Фермерские яйца', category: 'animal_product' as const, iconEmoji: '🥚', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 25, unlockTasksRequired: 2 },
    { name: 'Шерсть', description: 'Мягкая овечья шерсть', category: 'animal_product' as const, iconEmoji: '🧶', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 40, unlockTasksRequired: 3 },
    { name: 'Корм для животных', description: 'Питательный корм', category: 'processed' as const, iconEmoji: '🌿', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 5, unlockTasksRequired: 0 },
    { name: 'Мука', description: 'Перемолотая пшеница', category: 'processed' as const, iconEmoji: '🫓', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 30, unlockTasksRequired: 1 },
    { name: 'Масло', description: 'Подсолнечное масло', category: 'processed' as const, iconEmoji: '🫒', zoneId: zones.biology.id, productionTime: 0, sellPriceNpc: 45, unlockTasksRequired: 2 },

    // ── Химия ──
    { name: 'Семена мяты', description: 'Изучай эфирные масла', category: 'seed' as const, iconEmoji: '🌿', zoneId: zones.chemistry.id, productionTime: 150, sellPriceNpc: 8, unlockTasksRequired: 0 },
    { name: 'Семена лаванды', description: 'Ароматические соединения', category: 'seed' as const, iconEmoji: '💜', zoneId: zones.chemistry.id, productionTime: 200, sellPriceNpc: 10, unlockTasksRequired: 1 },
    { name: 'Семена алоэ', description: 'Биоактивные вещества', category: 'seed' as const, iconEmoji: '🌵', zoneId: zones.chemistry.id, productionTime: 250, sellPriceNpc: 12, unlockTasksRequired: 2 },
    { name: 'Мята', description: 'Ментоловое растение', category: 'crop' as const, iconEmoji: '🌿', zoneId: zones.chemistry.id, productionTime: 0, sellPriceNpc: 20, unlockTasksRequired: 0 },
    { name: 'Лаванда', description: 'Ароматический цветок', category: 'crop' as const, iconEmoji: '💜', zoneId: zones.chemistry.id, productionTime: 0, sellPriceNpc: 25, unlockTasksRequired: 1 },
    { name: 'Алоэ', description: 'Лечебное растение', category: 'crop' as const, iconEmoji: '🌵', zoneId: zones.chemistry.id, productionTime: 0, sellPriceNpc: 30, unlockTasksRequired: 2 },
    { name: 'Удобрение', description: 'Химическое удобрение для ускорения роста', category: 'processed' as const, iconEmoji: '🧪', zoneId: zones.chemistry.id, productionTime: 0, sellPriceNpc: 40, unlockTasksRequired: 0 },
    { name: 'Эфирное масло', description: 'Концентрат из лаванды', category: 'processed' as const, iconEmoji: '⚗️', zoneId: zones.chemistry.id, productionTime: 0, sellPriceNpc: 55, unlockTasksRequired: 2 },
    { name: 'pH-раствор', description: 'Раствор для оптимизации почвы', category: 'processed' as const, iconEmoji: '🧫', zoneId: zones.chemistry.id, productionTime: 0, sellPriceNpc: 50, unlockTasksRequired: 3 },

    // ── Физика ──
    { name: 'Семена бамбука', description: 'Изучай прочность материалов', category: 'seed' as const, iconEmoji: '🎋', zoneId: zones.physics.id, productionTime: 200, sellPriceNpc: 10, unlockTasksRequired: 0 },
    { name: 'Семена хлопка', description: 'Волокна и текстиль', category: 'seed' as const, iconEmoji: '☁️', zoneId: zones.physics.id, productionTime: 250, sellPriceNpc: 12, unlockTasksRequired: 1 },
    { name: 'Бамбук', description: 'Прочный стебель', category: 'crop' as const, iconEmoji: '🎋', zoneId: zones.physics.id, productionTime: 0, sellPriceNpc: 25, unlockTasksRequired: 0 },
    { name: 'Хлопок', description: 'Мягкое волокно', category: 'crop' as const, iconEmoji: '☁️', zoneId: zones.physics.id, productionTime: 0, sellPriceNpc: 30, unlockTasksRequired: 1 },
    { name: 'Солнечная панель', description: 'Преобразует свет в энергию', category: 'processed' as const, iconEmoji: '☀️', zoneId: zones.physics.id, productionTime: 0, sellPriceNpc: 100, unlockTasksRequired: 3 },
    { name: 'Водяной насос', description: 'Использует гидродинамику', category: 'processed' as const, iconEmoji: '💧', zoneId: zones.physics.id, productionTime: 0, sellPriceNpc: 80, unlockTasksRequired: 2 },
    { name: 'Ветрогенератор', description: 'Энергия ветра', category: 'processed' as const, iconEmoji: '🌬️', zoneId: zones.physics.id, productionTime: 0, sellPriceNpc: 90, unlockTasksRequired: 4 },

    // ── Математика ──
    { name: 'Семена клевера', description: 'Изучай симметрию в природе', category: 'seed' as const, iconEmoji: '🍀', zoneId: zones.mathematics.id, productionTime: 150, sellPriceNpc: 8, unlockTasksRequired: 0 },
    { name: 'Семена фракталов', description: 'Фрактальные узоры растений', category: 'seed' as const, iconEmoji: '🌀', zoneId: zones.mathematics.id, productionTime: 200, sellPriceNpc: 10, unlockTasksRequired: 1 },
    { name: 'Клевер', description: 'Четырёхлистный клевер', category: 'crop' as const, iconEmoji: '🍀', zoneId: zones.mathematics.id, productionTime: 0, sellPriceNpc: 20, unlockTasksRequired: 0 },
    { name: 'Фрактальный цветок', description: 'Цветок с фрактальной структурой', category: 'crop' as const, iconEmoji: '🌀', zoneId: zones.mathematics.id, productionTime: 0, sellPriceNpc: 25, unlockTasksRequired: 1 },
    { name: 'Калькуляторный чип', description: 'Вычислительный компонент', category: 'processed' as const, iconEmoji: '🔢', zoneId: zones.mathematics.id, productionTime: 0, sellPriceNpc: 70, unlockTasksRequired: 2 },
    { name: 'Геометрический инструмент', description: 'Для оптимальной планировки', category: 'processed' as const, iconEmoji: '📐', zoneId: zones.mathematics.id, productionTime: 0, sellPriceNpc: 60, unlockTasksRequired: 3 },

    // ── IT ──
    { name: 'Семена кактуса', description: 'Устойчивые алгоритмы роста', category: 'seed' as const, iconEmoji: '🌵', zoneId: zones.it.id, productionTime: 180, sellPriceNpc: 10, unlockTasksRequired: 0 },
    { name: 'Семена бинарного дерева', description: 'Древовидные структуры данных', category: 'seed' as const, iconEmoji: '🌲', zoneId: zones.it.id, productionTime: 240, sellPriceNpc: 12, unlockTasksRequired: 1 },
    { name: 'Кактус', description: 'Неприхотливый кактус', category: 'crop' as const, iconEmoji: '🌵', zoneId: zones.it.id, productionTime: 0, sellPriceNpc: 22, unlockTasksRequired: 0 },
    { name: 'Бинарное дерево', description: 'Дерево данных', category: 'crop' as const, iconEmoji: '🌲', zoneId: zones.it.id, productionTime: 0, sellPriceNpc: 28, unlockTasksRequired: 1 },
    { name: 'Датчик', description: 'IoT-сенсор для мониторинга', category: 'processed' as const, iconEmoji: '📡', zoneId: zones.it.id, productionTime: 0, sellPriceNpc: 60, unlockTasksRequired: 2 },
    { name: 'Скрипт автоматизации', description: 'Код для автоматизации фермы', category: 'processed' as const, iconEmoji: '💻', zoneId: zones.it.id, productionTime: 0, sellPriceNpc: 120, unlockTasksRequired: 4 },
    { name: 'AI-модуль', description: 'ИИ для оптимизации', category: 'processed' as const, iconEmoji: '🤖', zoneId: zones.it.id, productionTime: 0, sellPriceNpc: 180, unlockTasksRequired: 6 },
  ];

  const savedItems = await itemRepo.save(itemRepo.create(itemsData));
  console.log(`✅ Seeded ${savedItems.length} farm items`);

  // Helper to find item by name
  const item = (name: string) => savedItems.find(i => i.name === name)!;

  // ==================== ANIMALS ====================

  const animalsData = [
    // Биология
    { name: 'Корова', description: 'Даёт молоко каждые 10 минут', iconEmoji: '🐄', zoneId: zones.biology.id, feedItemId: item('Корм для животных').id, productionItemId: item('Молоко').id, productionTime: 600, unlockTasksRequired: 2 },
    { name: 'Курица', description: 'Несёт яйца каждые 5 минут', iconEmoji: '🐔', zoneId: zones.biology.id, feedItemId: item('Корм для животных').id, productionItemId: item('Яйца').id, productionTime: 300, unlockTasksRequired: 1 },
    { name: 'Овца', description: 'Даёт шерсть каждые 15 минут', iconEmoji: '🐑', zoneId: zones.biology.id, feedItemId: item('Корм для животных').id, productionItemId: item('Шерсть').id, productionTime: 900, unlockTasksRequired: 3 },

    // Химия — лабораторные животные
    { name: 'Пчела', description: 'Производит мёд с ферментами', iconEmoji: '🐝', zoneId: zones.chemistry.id, feedItemId: null, productionItemId: item('Эфирное масло').id, productionTime: 480, unlockTasksRequired: 2 },

    // Физика
    { name: 'Лошадь', description: 'Генерирует механическую энергию', iconEmoji: '🐴', zoneId: zones.physics.id, feedItemId: null, productionItemId: item('Водяной насос').id, productionTime: 720, unlockTasksRequired: 3 },

    // Математика
    { name: 'Сова', description: 'Мудрая помощница в вычислениях', iconEmoji: '🦉', zoneId: zones.mathematics.id, feedItemId: null, productionItemId: item('Калькуляторный чип').id, productionTime: 600, unlockTasksRequired: 2 },

    // IT
    { name: 'Робот-пёс', description: 'Собирает данные с датчиков', iconEmoji: '🐕‍🦺', zoneId: zones.it.id, feedItemId: null, productionItemId: item('Датчик').id, productionTime: 540, unlockTasksRequired: 3 },
  ];

  const savedAnimals = await animalRepo.save(animalRepo.create(animalsData));
  console.log(`✅ Seeded ${savedAnimals.length} animals`);

  // ==================== PRODUCTION CHAINS ====================

  const chainsData = [
    // Биология
    { name: 'Мельница', zoneId: zones.biology.id, outputItemId: item('Мука').id, outputQuantity: 2, baseTime: 5, unlockTasksRequired: 1 },
    { name: 'Маслобойка', zoneId: zones.biology.id, outputItemId: item('Масло').id, outputQuantity: 1, baseTime: 8, unlockTasksRequired: 3 },

    // Химия
    { name: 'Лаборатория удобрений', zoneId: zones.chemistry.id, outputItemId: item('Удобрение').id, outputQuantity: 2, baseTime: 4, unlockTasksRequired: 0 },
    { name: 'Дистилляция', zoneId: zones.chemistry.id, outputItemId: item('Эфирное масло').id, outputQuantity: 1, baseTime: 7, unlockTasksRequired: 2 },
    { name: 'pH-лаборатория', zoneId: zones.chemistry.id, outputItemId: item('pH-раствор').id, outputQuantity: 1, baseTime: 6, unlockTasksRequired: 3 },

    // Физика
    { name: 'Сборка панелей', zoneId: zones.physics.id, outputItemId: item('Солнечная панель').id, outputQuantity: 1, baseTime: 12, unlockTasksRequired: 3 },
    { name: 'Сборка генератора', zoneId: zones.physics.id, outputItemId: item('Ветрогенератор').id, outputQuantity: 1, baseTime: 10, unlockTasksRequired: 4 },

    // Математика
    { name: 'Вычислительная фабрика', zoneId: zones.mathematics.id, outputItemId: item('Геометрический инструмент').id, outputQuantity: 1, baseTime: 8, unlockTasksRequired: 2 },

    // IT
    { name: 'Компилятор', zoneId: zones.it.id, outputItemId: item('Скрипт автоматизации').id, outputQuantity: 1, baseTime: 10, unlockTasksRequired: 4 },
    { name: 'Нейросеть', zoneId: zones.it.id, outputItemId: item('AI-модуль').id, outputQuantity: 1, baseTime: 15, unlockTasksRequired: 6 },
  ];

  const savedChains = await chainRepo.save(chainRepo.create(chainsData));
  console.log(`✅ Seeded ${savedChains.length} production chains`);

  // Helper to find chain by name
  const chain = (name: string) => savedChains.find(c => c.name === name)!;

  // ==================== INGREDIENTS ====================

  const ingredientsData = [
    // Мельница: Пшеница x3
    { chainId: chain('Мельница').id, itemId: item('Пшеница').id, quantityNeeded: 3 },
    // Маслобойка: Подсолнух x2
    { chainId: chain('Маслобойка').id, itemId: item('Подсолнух').id, quantityNeeded: 2 },

    // Лаборатория удобрений: Мята x2
    { chainId: chain('Лаборатория удобрений').id, itemId: item('Мята').id, quantityNeeded: 2 },
    // Дистилляция: Лаванда x3
    { chainId: chain('Дистилляция').id, itemId: item('Лаванда').id, quantityNeeded: 3 },
    // pH-лаборатория: Алоэ x2 + Мята x1
    { chainId: chain('pH-лаборатория').id, itemId: item('Алоэ').id, quantityNeeded: 2 },
    { chainId: chain('pH-лаборатория').id, itemId: item('Мята').id, quantityNeeded: 1 },

    // Сборка панелей: Бамбук x3 + Хлопок x2
    { chainId: chain('Сборка панелей').id, itemId: item('Бамбук').id, quantityNeeded: 3 },
    { chainId: chain('Сборка панелей').id, itemId: item('Хлопок').id, quantityNeeded: 2 },
    // Сборка генератора: Бамбук x4
    { chainId: chain('Сборка генератора').id, itemId: item('Бамбук').id, quantityNeeded: 4 },

    // Вычислительная фабрика: Клевер x3 + Фрактальный цветок x2
    { chainId: chain('Вычислительная фабрика').id, itemId: item('Клевер').id, quantityNeeded: 3 },
    { chainId: chain('Вычислительная фабрика').id, itemId: item('Фрактальный цветок').id, quantityNeeded: 2 },

    // Компилятор: Кактус x2 + Бинарное дерево x2
    { chainId: chain('Компилятор').id, itemId: item('Кактус').id, quantityNeeded: 2 },
    { chainId: chain('Компилятор').id, itemId: item('Бинарное дерево').id, quantityNeeded: 2 },
    // Нейросеть: Датчик x3 + Скрипт автоматизации x1
    { chainId: chain('Нейросеть').id, itemId: item('Датчик').id, quantityNeeded: 3 },
    { chainId: chain('Нейросеть').id, itemId: item('Скрипт автоматизации').id, quantityNeeded: 1 },
  ];

  const savedIngredients = await ingredientRepo.save(ingredientRepo.create(ingredientsData));
  console.log(`✅ Seeded ${savedIngredients.length} production chain ingredients`);
}
