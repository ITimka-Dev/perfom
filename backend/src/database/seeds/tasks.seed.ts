import { DataSource } from 'typeorm';
import { Task } from '../../modules/tasks/entities/task.entity';
import { FarmZone } from '../../modules/zones/entities/farm-zone.entity';

export async function seedTasks(dataSource: DataSource): Promise<void> {
  const taskRepository = dataSource.getRepository(Task);
  const zoneRepository = dataSource.getRepository(FarmZone);

  // Check if tasks already exist
  const existingTasks = await taskRepository.count();
  if (existingTasks > 0) {
    console.log('Tasks already seeded, skipping...');
    return;
  }

  // Get zones for reference
  const biologyZone = await zoneRepository.findOne({ where: { zoneType: 'biology' } });
  const chemistryZone = await zoneRepository.findOne({ where: { zoneType: 'chemistry' } });
  const physicsZone = await zoneRepository.findOne({ where: { zoneType: 'physics' } });
  const mathZone = await zoneRepository.findOne({ where: { zoneType: 'mathematics' } });
  const itZone = await zoneRepository.findOne({ where: { zoneType: 'it' } });

  const tasks = [
    // Biology Zone Tasks
    {
      title: 'Введение в клетку',
      description: 'Изучи строение и функции клеток',
      instructions: 'Изучи предоставленные материалы об органеллах клетки и их функциях. Ответь на вопросы викторины о митохондриях, ядре и клеточной мембране.',
      zoneId: biologyZone?.id,
      difficulty: 1,
      experienceReward: 100,
      requiredLevel: 1,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Процесс фотосинтеза',
      description: 'Пойми, как растения преобразуют световую энергию в химическую',
      instructions: 'Прочитай о фотосинтезе и выполни упражнение по подписыванию диаграммы. Объясни роль хлорофилла и значение солнечного света.',
      zoneId: biologyZone?.id,
      difficulty: 2,
      experienceReward: 150,
      requiredLevel: 3,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Генетика и ДНК',
      description: 'Изучи основы наследственности и генетической информации',
      instructions: 'Выполни упражнения с решёткой Пеннета и ответь на вопросы о доминантных и рецессивных признаках.',
      zoneId: biologyZone?.id,
      difficulty: 3,
      experienceReward: 200,
      requiredLevel: 5,
      targetGrades: [75, 85, 95],
      attachmentUrls: [],
    },

    // Chemistry Zone Tasks
    {
      title: 'Основы периодической таблицы',
      description: 'Изучи элементы и их организацию',
      instructions: 'Запомни первые 20 элементов периодической таблицы. Пройди тест на знание атомных номеров и символов элементов.',
      zoneId: chemistryZone?.id,
      difficulty: 1,
      experienceReward: 100,
      requiredLevel: 1,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Химические реакции',
      description: 'Пойми, как вещества взаимодействуют и трансформируются',
      instructions: 'Уравняй химические уравнения и определи типы реакций (синтез, разложение, замещение).',
      zoneId: chemistryZone?.id,
      difficulty: 2,
      experienceReward: 150,
      requiredLevel: 3,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Кислоты и основания',
      description: 'Изучи pH и химические свойства',
      instructions: 'Проведи виртуальные эксперименты с pH-индикаторами и реши задачи на нейтрализацию кислот и оснований.',
      zoneId: chemistryZone?.id,
      difficulty: 3,
      experienceReward: 200,
      requiredLevel: 5,
      targetGrades: [75, 85, 95],
      attachmentUrls: [],
    },

    // Physics Zone Tasks
    {
      title: 'Законы Ньютона',
      description: 'Освой фундаментальные законы физики',
      instructions: 'Реши задачи на силу, массу и ускорение. Примени три закона Ньютона к реальным ситуациям.',
      zoneId: physicsZone?.id,
      difficulty: 2,
      experienceReward: 150,
      requiredLevel: 3,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Энергия и работа',
      description: 'Пойми преобразования энергии и расчёт работы',
      instructions: 'Рассчитай кинетическую и потенциальную энергию в различных ситуациях. Реши задачи на работу и мощность.',
      zoneId: physicsZone?.id,
      difficulty: 3,
      experienceReward: 200,
      requiredLevel: 5,
      targetGrades: [75, 85, 95],
      attachmentUrls: [],
    },
    {
      title: 'Основы электричества',
      description: 'Изучи электрический ток, напряжение и сопротивление',
      instructions: 'Примени закон Ома к задачам на цепи. Рассчитай свойства последовательных и параллельных цепей.',
      zoneId: physicsZone?.id,
      difficulty: 4,
      experienceReward: 250,
      requiredLevel: 8,
      targetGrades: [70, 80, 90],
      attachmentUrls: [],
    },

    // Mathematics Zone Tasks
    {
      title: 'Алгебраические выражения',
      description: 'Упрощай и решай алгебраические уравнения',
      instructions: 'Реши линейные уравнения и упрости алгебраические выражения. Потренируйся приводить подобные члены.',
      zoneId: mathZone?.id,
      difficulty: 1,
      experienceReward: 100,
      requiredLevel: 1,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Основы геометрии',
      description: 'Вычисляй площади, периметры и объёмы',
      instructions: 'Реши задачи по геометрии с треугольниками, кругами и прямоугольниками. Примени формулы площади и объёма.',
      zoneId: mathZone?.id,
      difficulty: 2,
      experienceReward: 150,
      requiredLevel: 3,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Функции и графики',
      description: 'Разберись в математических функциях и их графиках',
      instructions: 'Построй линейные и квадратичные функции. Определи свойства функций — наклон и точки пересечения.',
      zoneId: mathZone?.id,
      difficulty: 3,
      experienceReward: 200,
      requiredLevel: 5,
      targetGrades: [75, 85, 95],
      attachmentUrls: [],
    },
    {
      title: 'Теория вероятностей и статистика',
      description: 'Научись анализировать данные и вычислять вероятности',
      instructions: 'Рассчитай среднее арифметическое, медиану и моду. Реши задачи на вероятность с комбинациями и перестановками.',
      zoneId: mathZone?.id,
      difficulty: 4,
      experienceReward: 250,
      requiredLevel: 7,
      targetGrades: [70, 80, 90],
      attachmentUrls: [],
    },

    // IT Zone Tasks
    {
      title: 'Введение в программирование',
      description: 'Изучи базовые концепции программирования',
      instructions: 'Напиши простые программы с переменными, циклами и условиями. Выполни упражнения на Python или JavaScript.',
      zoneId: itZone?.id,
      difficulty: 2,
      experienceReward: 150,
      requiredLevel: 5,
      targetGrades: [80, 90, 100],
      attachmentUrls: [],
    },
    {
      title: 'Основы структур данных',
      description: 'Разберись в массивах, списках и базовых структурах данных',
      instructions: 'Реализуй и манипулируй массивами и списками. Реши задачи на операции со структурами данных.',
      zoneId: itZone?.id,
      difficulty: 3,
      experienceReward: 200,
      requiredLevel: 8,
      targetGrades: [75, 85, 95],
      attachmentUrls: [],
    },
    {
      title: 'Алгоритмы и решение задач',
      description: 'Научись алгоритмическому мышлению и стратегиям решения задач',
      instructions: 'Реализуй алгоритмы сортировки и поиска. Проанализируй временную сложность и оптимизируй решения.',
      zoneId: itZone?.id,
      difficulty: 4,
      experienceReward: 250,
      requiredLevel: 10,
      targetGrades: [70, 80, 90],
      attachmentUrls: [],
    },
    {
      title: 'Основы веб-разработки',
      description: 'Создавай базовые веб-страницы с HTML и CSS',
      instructions: 'Построй адаптивную веб-страницу на HTML5 и CSS3. Примени стилизацию и техники вёрстки.',
      zoneId: itZone?.id,
      difficulty: 3,
      experienceReward: 200,
      requiredLevel: 7,
      targetGrades: [75, 85, 95],
      attachmentUrls: [],
    },
  ];

  const createdTasks = taskRepository.create(tasks);
  await taskRepository.save(createdTasks);

  console.log(`✅ Seeded ${tasks.length} tasks successfully!`);
}
