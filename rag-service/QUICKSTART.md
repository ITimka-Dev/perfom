# RAG-сервис EduFarm — Быстрый старт

## Что это?

RAG (Retrieval-Augmented Generation) сервис — это интеллектуальный ассистент для образовательной платформы EduFarm, который отвечает на вопросы учеников по 5 предметам, используя:
- **Ollama + локальная LLM** — генерация ответа без внешнего API
- **Векторную базу ChromaDB** — хранение и поиск по учебникам
- **PDF процессор** — обработка учебников

## Как это работает (RAG Pipeline)

```
1. Ученик задает вопрос через платформу EduFarm
         ↓
2. RAG-сервис ищет релевантные фрагменты в учебниках (ChromaDB)
   - Векторный поиск по эмбеддингам
   - Фильтрация по предмету (опционально)
         ↓
3. Найденные фрагменты добавляются в контекст запроса
         ↓
4. Запрос с контекстом отправляется в локальную LLM через Ollama
         ↓
5. Локальная модель генерирует ответ на основе контекста
         ↓
6. Ответ возвращается пользователю с указанием источников
```

## Структура проекта

```
rag-service/
├── app/
│   ├── config.py              # Настройки (env variables)
│   ├── main.py                # FastAPI приложение + endpoints
│   ├── ollama_client.py       # Клиент для локальной LLM через Ollama
│   ├── vector_store.py        # ChromaDB управление
│   └── document_processor.py  # Обработка PDF → чанки
├── data/
│   ├── chroma_db/             # Векторная база (создается автоматически)
│   └── textbooks/             # Сюда класть PDF учебники
│       ├── programming/
│       ├── mathematics/
│       ├── physics/
│       ├── biology/
│       └── chemistry/
├── tests/
│   └── test_api.py            # Тесты
├── docs/
│   └── INTEGRATION_GUIDE.md   # Полное руководство по интеграции
├── requirements.txt           # Python зависимости
├── Dockerfile                 # Docker образ
├── docker-compose.yml         # Docker Compose
├── .env.example              # Пример переменных окружения
└── README.md                 # Этот файл
```

## Быстрый старт (5 минут)

### Шаг 1: Установка зависимостей

```bash
cd rag-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Шаг 2: Настройка Ollama

Запустите Ollama и проверьте локальную модель:

```bash
ollama serve
ollama list
ollama run qwen2.5-3b-instruct-q4km
```

Создайте `.env` в корне `rag-service`:

```env
LLM_PROVIDER=ollama
EMBEDDING_FUNCTION=onnx_minilm_l6_v2
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-3b-instruct-q4km
OLLAMA_TEMPERATURE=0.2
OLLAMA_NUM_CTX=4096
OLLAMA_NUM_PREDICT=700

CHROMA_DB_PATH=./data/chroma_db
CHROMA_COLLECTION_NAME=edufarm_textbooks
CHROMA_RESET_ON_SCHEMA_ERROR=true
CHUNK_SIZE=500
CHUNK_OVERLAP=50
MAX_CONTEXT_DOCUMENTS=5
RETRIEVAL_DISTANCE_THRESHOLD=1.2
RETRIEVAL_FETCH_MULTIPLIER=3
RETRIEVAL_MAX_CHUNKS_PER_TEXTBOOK=2
```

### Шаг 3: Добавьте учебники

Поместите PDF файлы в `data/textbooks/{subject}/`:

```
data/textbooks/
├── mathematics/
│   ├── algebra.pdf
│   └── calculus.pdf
└── physics/
    └── mechanics.pdf
```

> Важно: embeddings считаются локально через `EMBEDDING_FUNCTION=onnx_minilm_l6_v2`. Если меняете embedding-функцию, очистите и загрузите учебники заново.

### Шаг 4: Загрузите учебники в базу

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
sleep 5
curl -X POST http://127.0.0.1:8000/textbooks/load
```

### Шаг 5: Проверьте работу

```bash
# Health check
curl http://127.0.0.1:8000/health

# Тестовый запрос
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Что такое производная?", "subject": "mathematics"}'
```

Откройте Swagger UI: http://127.0.0.1:8000/docs

## API Endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/health` | GET | Проверка здоровья сервиса |
| `/chat` | POST | Получить ответ на вопрос |
| `/textbooks/load` | POST | Загрузить учебники в базу |
| `/textbooks/stats` | GET | Статистика по учебникам |
| `/textbooks/clear` | DELETE | Очистить базу |

### Пример запроса к `/chat`

**Request:**
```json
{
  "query": "Объясни законы Ньютона",
  "subject": "physics",
  "user_id": "student_123"
}
```

**Response:**
```json
{
  "answer": "Законы Ньютона — три основных закона классической механики...",
  "sources": [
    {
      "textbook": "mechanics",
      "page": 23,
      "subject": "physics",
      "distance": 0.3381,
      "relevance_score": 0.6619
    },
    {
      "textbook": "mechanics",
      "page": 25,
      "subject": "physics",
      "distance": 0.4027,
      "relevance_score": 0.5973
    }
  ],
  "subject": "physics"
}
```

## Интеграция с EduFarm

### Backend (NestJS)

Создайте модуль `backend/src/modules/rag/`:

```typescript
// rag.service.ts
@Injectable()
export class RagService {
  constructor(private readonly httpService: HttpService) {}

  async askQuestion(query: string, subject: string, userId: string) {
    const response = await firstValueFrom(
      this.httpService.post('http://127.0.0.1:8000/chat', {
        query,
        subject,
        user_id: userId,
      })
    );
    return response.data;
  }
}
```

### Frontend (React)

Используйте готовый хук из `docs/INTEGRATION_GUIDE.md`:

```typescript
const { sendMessage, messages } = useRagAssistant();

await sendMessage('Что такое интеграл?', 'mathematics');
```

📖 **Полное руководство по интеграции:** [`docs/INTEGRATION_GUIDE.md`](docs/INTEGRATION_GUIDE.md)

## Запуск в Docker

```bash
# Сборка и запуск
OLLAMA_BASE_URL=http://host.docker.internal:11434 docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

Не забудьте создать `.env` файл и запустить Ollama перед запросами в `/chat`.

## Предметы

Сервис поддерживает 5 предметов:
- 📐 **mathematics** — математика
- 💻 **programming** — программирование и информатика
- ⚛️ **physics** — физика
- 🧬 **biology** — биология
- 🧪 **chemistry** — химия

## Основные технологии

- **FastAPI** — современный Python фреймворк для API
- **ChromaDB** — векторная база данных для ML
- **PyPDF2** — чтение PDF файлов
- **Httpx** — асинхронный HTTP клиент для Ollama API
- **Loguru** — удобное логирование
- **Pydantic** — валидация данных

## Troubleshooting

### ❌ "Не удалось получить ответ от локальной модели Ollama"

Проверьте, что Ollama запущена и модель доступна:
```bash
ollama list
ollama run qwen2.5-3b-instruct-q4km
curl http://127.0.0.1:11434/api/tags
```

Убедитесь, что `OLLAMA_BASE_URL` и `OLLAMA_MODEL` в `.env` указаны корректно.

### ⚠️ `Failed to send telemetry event ... capture() takes ...`

Это предупреждение ChromaDB telemetry из-за несовместимой версии `posthog`. На свежей установке оно устраняется зависимостью `posthog<4.0.0` из `requirements.txt`:

```bash
pip install -r requirements.txt
```

### ❌ `sqlite3.OperationalError: no such column: collections.topic`

Это означает, что папка `data/chroma_db` была создана другой версией ChromaDB. По умолчанию сервис сам перенесет старую базу в `data/chroma_db_backup_*` и создаст новую, если включено:

```env
CHROMA_RESET_ON_SCHEMA_ERROR=true
```

После пересоздания базы заново загрузите учебники:

```bash
curl -X POST http://127.0.0.1:8000/textbooks/load
```

### ❌ "Не найдено релевантных документов"

Загрузите учебники:
```bash
curl -X POST http://127.0.0.1:8000/textbooks/load
curl http://127.0.0.1:8000/textbooks/stats
```

### ❌ Ошибка при чтении PDF

Некоторые PDF могут быть защищены или содержать сканы. Конвертируйте их в текстовый формат.

## Для диплома

Этот сервис реализует полноценный RAG pipeline:
1. **Document Ingestion** — загрузка и обработка PDF
2. **Chunking** — разбиение на смысловые фрагменты
3. **Embedding** — локальная ONNX-векторизация через ChromaDB
4. **Vector Search** — семантический поиск
5. **Context Augmentation** — обогащение запроса контекстом
6. **LLM Generation** — генерация ответа через локальную LLM в Ollama

Можно использовать как основу для раздела "Реализация" в дипломе.

## Лицензия

Учебный проект для диплома.

---

📚 **Документация:**
- [README.md](README.md) — основная документация
- [docs/INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) — интеграция с EduFarm
- [.env.example](.env.example) — пример конфигурации
