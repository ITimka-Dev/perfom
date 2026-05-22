# 🔬 Анализ модулей как микросервисов для интеграции в платформу

**Дата:** 2026-02-14  
**Репозиторий:** https://github.com/ITimkaCommunity/smart-agro-quest

---

## 1. Текущее состояние: Модульный монолит

Проект представляет собой **модульный монолит** на NestJS, где каждый модуль:
- Имеет собственный контроллер, сервис и сущности
- Изолирован через NestJS DI-контейнер
- Имеет чёткие границы ответственности

```
AppModule
├── AuthModule          (независимый)
├── UsersModule         (независимый)
├── TasksModule         ──┐
├── FarmModule          ──┤ взаимозависимы
├── ProgressModule      ──┤ через Progress
├── AchievementsModule  ──┘
├── PetModule           (независимый)
├── ZonesModule         (независимый)
├── GroupsModule        (зависит от Tasks)
├── StorageModule       (независимый)
├── MonitoringModule    (независимый)
└── HealthModule        (независимый)
```

---

## 2. Оценка каждого модуля

### 🟢 Высокая готовность к извлечению (можно сразу)

#### AuthModule
| Параметр | Значение |
|----------|----------|
| Зависимости | UsersModule (profiles) |
| Внешние связи | JWT token → все остальные модули |
| Готовность | ⭐⭐⭐⭐⭐ |

- **Как микросервис:** Отдельный Auth Service с JWT/OAuth
- **Интерфейс:** REST API (`/auth/login`, `/auth/signup`)
- **Интеграция в платформу:** Заменить на SSO/OAuth2 вышестоящей платформы, либо использовать как Identity Provider
- **Что потребуется:** API Gateway для проксирования токенов

#### PetModule
| Параметр | Значение |
|----------|----------|
| Зависимости | Нет (только user_id) |
| Внешние связи | WebSocket namespace `/pet` |
| Готовность | ⭐⭐⭐⭐⭐ |

- **Как микросервис:** Полностью автономный Pet Service
- **Интерфейс:** REST + WebSocket
- **БД таблицы:** `pets`, `pet_shop_items`, `pet_shop_item_costs`, `user_pet_items`
- **Интеграция:** Принимает `user_id` из JWT, не зависит от других модулей
- **Единственная связь:** `pet_shop_item_costs` ссылается на `farm_items` для покупки за ресурсы фермы — нужен Event Bus или API-вызов

#### ZonesModule
| Параметр | Значение |
|----------|----------|
| Зависимости | Нет |
| Внешние связи | Многие модули используют `zone_id` |
| Готовность | ⭐⭐⭐⭐⭐ |

- **Как микросервис:** Catalog/Reference Service
- **Интерфейс:** REST (read-only)
- **БД таблицы:** `farm_zones`
- **Интеграция:** Данные о зонах кэшируются другими сервисами. Изменяются редко → идеальный кандидат для выноса

#### StorageModule
| Параметр | Значение |
|----------|----------|
| Зависимости | Нет |
| Внешние связи | URL файлов используются в Tasks, Comments |
| Готовность | ⭐⭐⭐⭐⭐ |

- **Как микросервис:** File Storage Service
- **Интерфейс:** REST (`/storage/upload`)
- **Интеграция:** Возвращает URL, которые хранятся в других сервисах. Полностью stateless

#### MonitoringModule + HealthModule
| Параметр | Значение |
|----------|----------|
| Зависимости | Читает из всех таблиц (read-only) |
| Готовность | ⭐⭐⭐⭐ |

- **Как микросервис:** Monitoring/Observability Service
- **Интеграция:** Заменяется на стандартный Prometheus + Grafana stack. Админ-статистика может быть отдельным сервисом с read-only доступом к БД

#### UsersModule
| Параметр | Значение |
|----------|----------|
| Зависимости | AuthModule |
| Внешние связи | `user_id` → все модули |
| Готовность | ⭐⭐⭐⭐ |

- **Как микросервис:** User Profile Service
- **БД таблицы:** `profiles`, `user_roles`, `teacher_subjects`
- **Интеграция:** Teacher-специфичные эндпоинты (`/teacher/stats`, `/teacher/students`) требуют данных из Tasks → нужен API-вызов или Event Bus

---

### 🟡 Средняя готовность (требуется рефакторинг)

#### AchievementsModule
| Параметр | Значение |
|----------|----------|
| Зависимости | ProgressModule (проверка условий) |
| Внешние связи | Проверяется при оценке заданий |
| Готовность | ⭐⭐⭐ |

- **Как микросервис:** Gamification/Achievements Service
- **БД таблицы:** `achievements`, `user_achievements`
- **Проблема:** Сейчас вызывается синхронно из TasksService при оценке → нужен Event Bus
- **Решение:** 
  ```
  TasksService → Event: "task.graded" → AchievementsService (проверяет условия)
  ```

#### GroupsModule
| Параметр | Значение |
|----------|----------|
| Зависимости | TasksModule (назначение заданий) |
| Внешние связи | `group_tasks` → `tasks` |
| Готовность | ⭐⭐⭐ |

- **Как микросервис:** Groups/Classroom Service
- **БД таблицы:** `student_groups`, `group_members`, `group_tasks`
- **Проблема:** `group_tasks` ссылается на `tasks` через FK
- **Решение:** Хранить `task_id` как строку, валидировать через API-вызов к Tasks Service

---

### 🔴 Взаимозависимые модули (требуют Event Bus)

#### TasksModule ↔ ProgressModule ↔ FarmModule

Эти три модуля образуют **ядро игровой механики** и тесно связаны:

```
Ученик сдаёт задание
    → TasksService.gradeSubmission()
        → ProgressService.addExperience(userId, zoneId, xp)
            → Проверяет level up
            → Разблокирует farm items/animals
        → AchievementsService.checkAchievements(userId)
            → Разблокирует достижения
```

| Модуль | Зависит от | Используется |
|--------|-----------|-------------|
| TasksModule | ProgressModule | FarmModule, GroupsModule |
| ProgressModule | ZonesModule | TasksModule, FarmModule |
| FarmModule | ProgressModule, ZonesModule | PetModule (ресурсы для питомца) |

#### Стратегия извлечения

**Вариант A: Единый Game Core Service**
```
┌──────────────────────────────────┐
│         Game Core Service        │
│  ┌──────┐ ┌──────┐ ┌──────────┐ │
│  │Tasks │ │Farm  │ │Progress  │ │
│  └──────┘ └──────┘ └──────────┘ │
└──────────────────────────────────┘
```
- ✅ Простая реализация
- ✅ Транзакционная целостность
- ❌ Большой сервис

**Вариант B: Отдельные сервисы + Event Bus (рекомендуется)**
```
┌────────────┐    Events    ┌────────────────┐
│   Tasks    │──────────────│   Progress     │
│  Service   │              │   Service      │
└────────────┘              └────────────────┘
      │                            │
      │ Events                     │ Events
      ▼                            ▼
┌────────────┐              ┌────────────────┐
│   Farm     │              │ Achievements   │
│  Service   │              │   Service      │
└────────────┘              └────────────────┘
```

Необходимая инфраструктура:
- **Message Broker:** RabbitMQ или NATS
- **Events:** `task.graded`, `progress.levelUp`, `achievement.unlocked`
- **Eventual Consistency** вместо синхронных вызовов

---

## 3. Интеграция в внешнюю платформу

### 3.1 Архитектура интеграции

```
┌─────────────────────────────────────────────┐
│           Внешняя платформа (ISP)            │
│  ┌───────────┐  ┌──────┐  ┌──────────────┐ │
│  │ SSO/OAuth │  │ API  │  │ Routing/     │ │
│  │ Provider  │  │ Gate │  │ Navigation   │ │
│  └─────┬─────┘  └──┬───┘  └──────────────┘ │
│        │           │                         │
└────────┼───────────┼─────────────────────────┘
         │           │
    ┌────▼───────────▼─────────────────────┐
    │          EduFarm Services             │
    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌─────┐ │
    │  │Auth* │ │Tasks │ │Farm  │ │Pet  │ │
    │  └──────┘ └──────┘ └──────┘ └─────┘ │
    └──────────────────────────────────────┘
    
    * Auth заменяется на SSO платформы
```

### 3.2 Что нужно для интеграции

#### A) Замена аутентификации (~8-16 часов)

Текущий AuthModule (email/password + JWT) заменяется на:

```typescript
// Вариант 1: OAuth2/OIDC от платформы
@Injectable()
export class PlatformAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const token = extractBearerToken(context);
    // Валидировать токен платформы через JWKS endpoint
    return this.validatePlatformToken(token);
  }
}

// Вариант 2: API Key + User ID в заголовках
@Injectable()
export class PlatformApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const apiKey = request.headers['x-api-key'];
    const userId = request.headers['x-user-id'];
    return this.validateApiKey(apiKey) && userId;
  }
}
```

#### B) API Gateway (~4-8 часов)

```yaml
# nginx.conf или Kong/Traefik
location /api/edufarm/ {
  proxy_pass http://edufarm-backend:3001/;
  proxy_set_header X-User-Id $platform_user_id;
  proxy_set_header X-Platform-Token $platform_token;
}
```

#### C) Маппинг пользователей (~4 часов)

```sql
-- Таблица маппинга
CREATE TABLE platform_user_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_user_id VARCHAR NOT NULL UNIQUE,
  edufarm_user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT now()
);
```

#### D) Webhook/Events интеграция (~8 часов)

```typescript
// Публикация событий для платформы
@Injectable()
export class PlatformEventsService {
  async publishEvent(event: string, data: any) {
    await this.httpService.post(
      process.env.PLATFORM_WEBHOOK_URL,
      { event, data, timestamp: new Date() },
      { headers: { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET } }
    );
  }
}

// Подписка: task.completed, achievement.unlocked, level.up
```

---

## 4. Итоговая матрица готовности

| Модуль | Автономность | Извлечение | Интеграция | Усилия |
|--------|-------------|------------|------------|--------|
| Auth | 🟢 Полная | 🟢 Легко | Заменить на SSO | 8-16ч |
| Users | 🟢 Полная | 🟢 Легко | User mapping | 4ч |
| Pet | 🟢 Полная | 🟢 Легко | Готов | 2ч |
| Zones | 🟢 Полная | 🟢 Легко | Готов | 1ч |
| Storage | 🟢 Полная | 🟢 Легко | Готов | 1ч |
| Achievements | 🟡 Средняя | 🟡 Event Bus | Event Bus | 8ч |
| Groups | 🟡 Средняя | 🟡 API-вызовы | API Gateway | 4ч |
| Tasks | 🔴 Ядро | 🟡 Event Bus | Event Bus | 16ч |
| Farm | 🔴 Ядро | 🟡 Event Bus | Event Bus | 16ч |
| Progress | 🔴 Ядро | 🟡 Event Bus | Event Bus | 8ч |
| Monitoring | 🟢 Полная | 🟢 Легко | Prometheus | 2ч |
| Health | 🟢 Полная | 🟢 Легко | Стандартный | 1ч |

### Общая оценка усилий

| Этап | Время |
|------|-------|
| Извлечение независимых модулей | 1-2 дня |
| Настройка Event Bus (RabbitMQ/NATS) | 1-2 дня |
| Извлечение ядра (Tasks/Farm/Progress) | 1-2 недели |
| Интеграция с внешней платформой | 1 неделя |
| **Итого** | **3-4 недели** |

---

## 5. Рекомендуемый порядок действий

1. **Фаза 1** — Подготовка (1 неделя)
   - Убрать зависимости от Supabase
   - Добавить `@nestjs/schedule` для cron-задач
   - Настроить API Gateway (Nginx/Kong)

2. **Фаза 2** — Извлечение независимых сервисов (1 неделя)
   - Auth → SSO адаптер
   - Pet Service
   - Storage Service
   - Zones Service (Catalog)

3. **Фаза 3** — Event-driven ядро (2 недели)
   - Настроить RabbitMQ/NATS
   - Извлечь Tasks, Farm, Progress как отдельные сервисы
   - Реализовать events: `task.graded`, `progress.levelUp`, `farm.itemUnlocked`

4. **Фаза 4** — Интеграция с платформой (1 неделя)
   - Заменить JWT на SSO платформы
   - Реализовать user mapping
   - Настроить webhooks для платформы

---

**Вывод:** Архитектура проекта хорошо подготовлена для микросервисной декомпозиции. 7 из 12 модулей можно извлечь без значительного рефакторинга. Основная сложность — разрыв связи между Tasks ↔ Progress ↔ Farm, что требует Event Bus.
