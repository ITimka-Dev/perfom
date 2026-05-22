# EduFarm Backend API

NestJS backend для образовательной игры EduFarm.

## Требования

- Node.js 18+
- PostgreSQL 14+
- Redis (опционально, для кеширования)
- npm или yarn

## Установка

```bash
cd backend
npm install
```

## Настройка

1. Создайте PostgreSQL базу данных:
```bash
createdb edufarm
```

2. Выполните SQL схему:
```bash
psql -d edufarm -f database/schema.sql
```

3. Скопируйте `.env.example` в `.env` и настройте переменные:
```bash
cp .env.example .env
```

4. Отредактируйте `.env` файл с вашими настройками.

## Запуск

### Development режим
```bash
npm run start:dev
```

### Production режим
```bash
npm run build
npm run start:prod
```

## API Документация

После запуска сервера, Swagger документация доступна по адресу:
```
http://localhost:3001/api
```

## TypeORM Миграции

### Создать новую миграцию
```bash
npm run migration:create src/migrations/MigrationName
```

### Сгенерировать миграцию из изменений entities
```bash
npm run migration:generate src/migrations/MigrationName
```

### Запустить миграции
```bash
npm run migration:run
```

### Откатить последнюю миграцию
```bash
npm run migration:revert
```

### Показать статус миграций
```bash
npm run migration:show
```

## Структура проекта

```
backend/
├── src/
│   ├── common/              # Общие декораторы, guards, filters
│   │   ├── decorators/      # @CurrentUser, @Roles
│   │   ├── guards/          # JWT, Roles guards
│   │   └── filters/         # Exception filters
│   ├── config/              # Конфигурация (TypeORM, Winston)
│   ├── modules/
│   │   ├── auth/            # Аутентификация (JWT)
│   │   ├── users/           # Пользователи и профили
│   │   ├── tasks/           # Задания и submissions
│   │   ├── zones/           # Зоны (предметы)
│   │   ├── farm/            # Ферма (растения, животные)
│   │   ├── pet/             # Питомец (тамагочи)
│   │   ├── achievements/    # Достижения
│   │   ├── progress/        # Прогресс и leaderboard
│   │   ├── groups/          # Группы учеников
│   │   ├── monitoring/      # Мониторинг и статистика
│   │   └── storage/         # Загрузка файлов
│   ├── migrations/          # TypeORM миграции
│   ├── app.module.ts
│   └── main.ts
├── database/
│   └── schema.sql           # PostgreSQL схема
├── .env.example
└── package.json
```

## Основные эндпоинты

### Аутентификация
- `POST /auth/signup` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/profile` - Профиль пользователя

### Задания
- `GET /tasks` - Все задания
- `POST /tasks` - Создать задание (учителя)
- `POST /tasks/:id/submit` - Отправить решение
- `GET /tasks/user/submissions` - Мои решения
- `PATCH /tasks/submissions/:id/grade` - Оценить решение (учителя)

### Загрузка файлов
- `POST /storage/task/:taskId/upload` - Загрузить файл для задания
- `POST /storage/submission/:submissionId/upload` - Загрузить файл для комментария

### Ферма
- `GET /farm/inventory` - Инвентарь
- `POST /farm/plants` - Посадить растение
- `POST /farm/animals/:id` - Добавить животное
- `POST /farm/production` - Начать производство

### WebSocket
- `/farm` namespace - real-time обновления фермы
- `/pet` namespace - real-time обновления питомца
- `/tasks` namespace - уведомления о заданиях

## Безопасность

- Все пароли хешируются через bcrypt
- JWT токены с настраиваемым временем жизни
- Guards для проверки ролей и владения ресурсами
- Валидация всех входных данных через class-validator
- Rate limiting (100 req/min)
- Файлы загружаются в Supabase Storage с проверкой размера (макс 10MB)

## WebSocket Документация

См. [WEBSOCKET_USAGE.md](./WEBSOCKET_USAGE.md) для подробной информации об использовании WebSocket соединений.

## Тестирование

```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Покрытие тестами
npm run test:cov
```
