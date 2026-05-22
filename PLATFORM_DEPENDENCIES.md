# 📊 Зависимости от Lovable и Supabase — Сводка

**Дата:** 2026-02-14  
**Репозиторий:** https://github.com/ITimkaCommunity/smart-agro-quest

---

## TL;DR

| Платформа | Зависимость | Усилия для отвязки |
|-----------|-------------|-------------------|
| **Lovable** | 🟢 Нулевая | 0 часов — уже автономен |
| **Supabase** | 🟡 Минимальная | ~4-8 часов разработки |

---

## 1. Lovable — Зависимость: НУЛЕВАЯ

Lovable используется **только как IDE/среда разработки** и CI/CD площадка. Проект — стандартный React + Vite + NestJS стек.

### Что Lovable предоставляет
- Среда разработки с live preview
- Автоматический push в GitHub
- Хостинг preview (preview URL)

### Что НЕ зависит от Lovable
- ✅ Весь frontend-код — стандартный React/Vite/TypeScript
- ✅ Весь backend — NestJS, запускается через `npm run start:dev`
- ✅ Docker Compose — полностью автономный
- ✅ CI/CD — GitHub Actions (не зависит от Lovable)
- ✅ Kubernetes манифесты — готовы к любому облаку

### Действия для полной автономности
**Никаких действий не требуется.** Просто клонируйте репозиторий и работайте в любой IDE.

```bash
git clone https://github.com/ITimkaCommunity/smart-agro-quest.git
cd smart-agro-quest
docker-compose up -d
```

---

## 2. Supabase — Зависимость: МИНИМАЛЬНАЯ

### 2.1 Что зависит от Supabase

#### A) Файлы `src/integrations/supabase/` (НЕ ИСПОЛЬЗУЮТСЯ)

| Файл | Статус | Импортируется? |
|------|--------|---------------|
| `src/integrations/supabase/client.ts` | Существует | ❌ Не импортируется ни одним компонентом |
| `src/integrations/supabase/types.ts` | Существует | ❌ Не импортируется в бизнес-логику |

**Доказательство:** поиск по `src/` за исключением `src/integrations/` даёт 0 результатов по `import.*supabase`.

**Вся бизнес-логика frontend** работает через `src/lib/api-client.ts`, который отправляет HTTP-запросы на NestJS backend.

#### B) Пакет `@supabase/supabase-js` в package.json

Установлен, но фактически не используется в production-коде.

#### C) 2 Edge Functions (Supabase Functions)

| Функция | Путь | Назначение |
|---------|------|------------|
| `generate-weekly-reports` | `supabase/functions/generate-weekly-reports/index.ts` | Генерация еженедельных отчётов для учителей |
| `send-overdue-reminders` | `supabase/functions/send-overdue-reminders/index.ts` | Напоминания о просроченных работах |

Обе функции:
- Используют `@supabase/supabase-js` для прямого доступа к БД
- Запускаются в Deno runtime (Supabase Edge)
- Используют `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`

#### D) PostgreSQL через Supabase

Supabase используется как хостинг для PostgreSQL. Это **не** lock-in — любой PostgreSQL 14+ подходит.

#### E) RLS-политики в Supabase миграциях

Row Level Security настроен через Supabase-миграции (`supabase/migrations/`), но RLS — это стандартная фича PostgreSQL, не специфичная для Supabase.

---

### 2.2 План миграции с Supabase

#### Шаг 1: Удалить неиспользуемые файлы (~30 мин)

```bash
# Удалить Supabase client и types (не используются)
rm -rf src/integrations/supabase/

# Удалить пакет
npm uninstall @supabase/supabase-js

# Удалить VITE_SUPABASE_* из .env
```

#### Шаг 2: Перенести Edge Functions в NestJS (~4-6 часов)

**generate-weekly-reports:**
```typescript
// backend/src/modules/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ReportsService {
  @Cron(CronExpression.EVERY_WEEK) // Каждое воскресенье
  async generateWeeklyReports() {
    // Перенести логику из supabase/functions/generate-weekly-reports/index.ts
    // Заменить supabase.from() на TypeORM repository
  }
}
```

**send-overdue-reminders:**
```typescript
// backend/src/modules/notifications/notifications.service.ts
@Injectable()
export class NotificationsService {
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendOverdueReminders() {
    // Перенести логику из supabase/functions/send-overdue-reminders/index.ts
    // Заменить supabase.from() на TypeORM repository
  }
}
```

**Зависимости:**
```bash
cd backend
npm install @nestjs/schedule
```

#### Шаг 3: Переключить PostgreSQL (~1 час)

Изменить `backend/.env`:
```env
DB_HOST=your-postgres-host.example.com
DB_PORT=5432
DB_USERNAME=your_user
DB_PASSWORD=your_password
DB_DATABASE=edufarm
```

Подходящие провайдеры:
- Self-hosted PostgreSQL
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases
- Neon
- Railway

#### Шаг 4: Удалить Supabase конфигурацию (~15 мин)

```bash
rm -rf supabase/functions/
# supabase/config.toml и supabase/migrations/ можно оставить как reference
```

---

### 2.3 Итого

| Действие | Время | Приоритет |
|----------|-------|-----------|
| Удалить `src/integrations/supabase/` | 30 мин | 🔴 HIGH |
| Удалить `@supabase/supabase-js` | 5 мин | 🔴 HIGH |
| Перенести `generate-weekly-reports` в NestJS | 3-4 часа | 🟡 MEDIUM |
| Перенести `send-overdue-reminders` в NestJS | 2-3 часа | 🟡 MEDIUM |
| Переключить PostgreSQL | 1 час | 🟢 LOW (при необходимости) |
| **Итого** | **~4-8 часов** | |

---

## 3. Другие внешние зависимости

| Зависимость | Тип | Заменяемость |
|-------------|-----|--------------|
| LogRocket | Мониторинг сессий | Опционально, можно убрать |
| Sentry | Error tracking | Опционально |
| GitHub Actions | CI/CD | Заменяется на GitLab CI, Jenkins и т.д. |

---

**Вывод:** Проект **практически автономен**. Для полной независимости от Supabase требуется ~4-8 часов работы, от Lovable — 0 часов.
