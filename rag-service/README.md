# RAG-сервис EduFarm

Интеллектуальный ассистент на основе локальной LLM через Ollama для образовательной платформы EduFarm.

## Архитектура

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   EduFarm       │────▶│   RAG Service    │────▶│  Ollama Local   │
│   Platform      │◀────│   (FastAPI)      │◀────│      LLM        │
│   (NestJS)      │     │                  │     └─────────────────┘
└─────────────────┘     │  - ChromaDB      │
                        │  - PDF Processor │
                        │  - Vector Search │
                        └──────────────────┘
```

## Компоненты

1. **Vector Store (ChromaDB)** — векторная база данных для хранения эмбеддингов учебников
2. **Document Processor** — обработка PDF файлов, разбиение на чанки
3. **Ollama Client** — взаимодействие с локальной LLM через Ollama
4. **RAG Pipeline** — поиск релевантного контекста + генерация ответа

## Установка

### 1. Создание виртуального окружения

```bash
cd rag-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

### 2. Установка зависимостей

```bash
pip install -r requirements.txt
```

### 3. Настройка Ollama

Запустите Ollama и проверьте, что локальная модель доступна:

```bash
ollama serve
ollama list
ollama run qwen2.5-3b-instruct-q4km
```

Если модель подключается из локального GGUF-файла, создайте `Modelfile`:

```text
FROM ./Qwen2.5-3B-Instruct-Q4_K_M.gguf

PARAMETER temperature 0.2
PARAMETER num_ctx 4096

SYSTEM """
Ты — образовательный ассистент EduFarm. Отвечай на русском языке.
"""
```

Затем зарегистрируйте модель:

```bash
ollama create qwen2.5-3b-instruct-q4km -f Modelfile
ollama run qwen2.5-3b-instruct-q4km
```

### 4. Настройка переменных окружения

Создайте файл `.env` в корне сервиса:

```env
# LLM provider
LLM_PROVIDER=ollama
EMBEDDING_FUNCTION=onnx_minilm_l6_v2

# Ollama local LLM (для локального запуска на Windows используйте localhost)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-3b-instruct-q4km
OLLAMA_TEMPERATURE=0.2
OLLAMA_NUM_CTX=4096
OLLAMA_NUM_PREDICT=700
OLLAMA_TIMEOUT_SECONDS=120

# ChromaDB
CHROMA_DB_PATH=./data/chroma_db
CHROMA_COLLECTION_NAME=edufarm_textbooks
CHROMA_RESET_ON_SCHEMA_ERROR=true

# Обработка документов
CHUNK_SIZE=500
CHUNK_OVERLAP=50
# Количество найденных чанков, которые попадут в контекст LLM.
# Это не количество учебников: при subject-фильтре поиск идет по всем чанкам выбранного предмета.
MAX_CONTEXT_DOCUMENTS=5

# Retrieval quality
# 0 отключает фильтрацию; для cosine distance меньше = релевантнее.
RETRIEVAL_DISTANCE_THRESHOLD=1.2
# Получить кандидатов с запасом до фильтрации и диверсификации.
RETRIEVAL_FETCH_MULTIPLIER=3
# Мягкий лимит чанков из одного учебника, недостающие места дозаполняются лучшими чанками.
RETRIEVAL_MAX_CHUNKS_PER_TEXTBOOK=2

# Сервер
HOST=0.0.0.0
PORT=8000

# Observability (опционально)
SENTRY_DSN=
ENABLE_METRICS=true
```

## Структура проекта

```
rag-service/
├── app/
│   ├── __init__.py
│   ├── config.py           # Настройки приложения
│   ├── main.py             # FastAPI приложение, endpoints
│   ├── ollama_client.py    # Клиент локальной LLM через Ollama
│   ├── vector_store.py     # ChromaDB управление
│   └── document_processor.py # Обработка PDF
├── data/
│   ├── chroma_db/          # Векторная база (создается автоматически)
│   └── textbooks/          # PDF учебники
│       ├── programming/
│       ├── mathematics/
│       ├── physics/
│       ├── biology/
│       └── chemistry/
├── tests/
│   └── test_api.py
├── requirements.txt
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## Embeddings

Сервис использует явную локальную embedding-функцию `onnx_minilm_l6_v2` для ChromaDB. Это убирает неявную зависимость от дефолтной embedding-функции ChromaDB и не требует `sentence-transformers`.

Если вы меняете embedding-функцию или уже успели создать базу на другой функции, очистите и пересоздайте ChromaDB:

```bash
curl -X DELETE http://127.0.0.1:8000/textbooks/clear
curl -X POST http://127.0.0.1:8000/textbooks/load
```

Если при запуске появляется ошибка вида `sqlite3.OperationalError: no such column: collections.topic`, значит локальная папка `data/chroma_db` создана другой версией ChromaDB. По умолчанию `CHROMA_RESET_ON_SCHEMA_ERROR=true`: сервис перенесет старую папку в `data/chroma_db_backup_*`, создаст новую базу и после этого учебники нужно загрузить заново.

Если видите предупреждение `Failed to send telemetry event ... capture() takes ...`, обновите зависимости из `requirements.txt`: для совместимости с текущей ChromaDB закреплен `posthog<4.0.0`.

## Как работает `MAX_CONTEXT_DOCUMENTS`

`MAX_CONTEXT_DOCUMENTS` — это количество **чанков**, которые ChromaDB вернет в контекст модели для одного вопроса.

Например, при `MAX_CONTEXT_DOCUMENTS=5` и `subject="mathematics"` сервис ищет 5 наиболее релевантных чанков по всем загруженным учебникам математики. Это не означает «5 учебников» и не означает «по 5 чанков из каждого учебника».

Если в одном предмете лежат 3 учебника, поиск все равно вернет суммарно top-5 чанков из всех чанков этого предмета. Если нужно шире покрывать 3 учебника по каждому из 5 предметов, обычно лучше:

- оставить `MAX_CONTEXT_DOCUMENTS=4-6` для одного запроса, чтобы не перегружать маленькую локальную модель;
- использовать `subject`-фильтр, когда предмет известен;
- `RETRIEVAL_FETCH_MULTIPLIER` получает кандидатов с запасом;
- `RETRIEVAL_DISTANCE_THRESHOLD` отсекает слишком далекие фрагменты;
- `RETRIEVAL_MAX_CHUNKS_PER_TEXTBOOK` мягко ограничивает число чанков из одного учебника, а если результатов не хватает — сервис дозаполняет ответ лучшими оставшимися чанками.

## Загрузка учебников

### Структура директорий

Поместите PDF учебники в соответствующие директории:

```
data/textbooks/
├── programming/
│   ├── python_basics.pdf
│   ├── algorithms.pdf
│   └── web_dev.pdf
├── mathematics/
│   ├── algebra.pdf
│   ├── calculus.pdf
│   └── geometry.pdf
├── physics/
│   ├── mechanics.pdf
│   ├── electromagnetism.pdf
│   └── quantum.pdf
├── biology/
│   ├── cell_biology.pdf
│   ├── genetics.pdf
│   └── ecology.pdf
└── chemistry/
    ├── organic.pdf
    ├── inorganic.pdf
    └── physical.pdf
```

### Загрузка через API

```bash
# Загрузить все учебники
curl -X POST http://127.0.0.1:8000/textbooks/load

# Загрузить только математику
curl -X POST http://127.0.0.1:8000/textbooks/load \
  -H "Content-Type: application/json" \
  -d '{"subject": "mathematics"}'

# Проверить статистику
curl http://127.0.0.1:8000/textbooks/stats
```

## API Endpoints

### GET `/health`
Проверка здоровья сервиса

```json
{
  "status": "healthy",
  "vector_db_documents": 1500,
  "subjects_available": ["programming", "mathematics", "physics", "biology", "chemistry"]
}
```

### POST `/chat`
Получить ответ на вопрос

**Request:**
```json
{
  "query": "Что такое производная функции?",
  "subject": "mathematics",
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "answer": "Производная функции — это понятие математического анализа, которое показывает скорость изменения функции...",
  "sources": [
    {
      "textbook": "calculus",
      "page": 45,
      "subject": "mathematics",
      "distance": 0.3124,
      "relevance_score": 0.6876
    },
    {
      "textbook": "algebra",
      "page": 112,
      "subject": "mathematics",
      "distance": 0.4218,
      "relevance_score": 0.5782
    }
  ],
  "subject": "mathematics"
}
```

### POST `/textbooks/load`
Загрузить учебники в векторную базу

### GET `/textbooks/stats`
Статистика по загруженным учебникам

### DELETE `/textbooks/clear`
Очистить векторную базу

## Запуск

### Локальный запуск

```bash
# Загрузка учебников
python -c "from app.document_processor import document_processor; document_processor.load_all_textbooks()"

# Запуск сервера
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Или просто:
```bash
python app/main.py
```

### Через Docker Compose

Если Ollama запущена на хостовой машине, для контейнера используйте `host.docker.internal`:

```bash
OLLAMA_BASE_URL=http://host.docker.internal:11434 docker-compose up -d
```

Или задайте параметры в `.env`:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5-3b-instruct-q4km
RETRIEVAL_DISTANCE_THRESHOLD=1.2
RETRIEVAL_FETCH_MULTIPLIER=3
RETRIEVAL_MAX_CHUNKS_PER_TEXTBOOK=2
```


## Интеграция с EduFarm

### Из NestJS backend

```typescript
// backend/src/modules/rag/rag.service.ts
@Injectable()
export class RagService {
  private readonly ragApiUrl = 'http://rag-service:8000';

  constructor(private readonly httpService: HttpService) {}

  async askQuestion(query: string, subject: string, userId: string) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.ragApiUrl}/chat`, {
        query,
        subject,
        user_id: userId,
      })
    );
    return response.data;
  }
}
```

### Из Frontend (React)

```typescript
// src/hooks/useRagAssistant.ts
export const useRagAssistant = () => {
  const askQuestion = async (query: string, subject?: SubjectType) => {
    const response = await fetch('http://127.0.0.1:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, subject }),
    });
    return await response.json();
  };

  return { askQuestion };
};
```

## RAG Pipeline

```
1. Пользователь задает вопрос
         ↓
2. Поиск релевантных документов в ChromaDB
   (векторный поиск по эмбеддингам)
         ↓
3. Фильтрация по distance и мягкая диверсификация по учебникам
         ↓
4. Формирование контекста из top-N чанков
         ↓
5. Запрос к локальной LLM через Ollama с контекстом
         ↓
6. Возврат ответа с источниками, distance и relevance_score
```

## Мониторинг

### Prometheus метрики

```bash
curl http://127.0.0.1:8000/metrics
```

### Логи

Логи выводятся в stdout и собираются через Filebeat → ELK стек (как в основной платформе).

## Разработка

### Тесты

```bash
pytest tests/ -v
```

### Swagger документация

Откройте `http://127.0.0.1:8000/docs` для интерактивной API документации.

## Важные замечания

1. **Ollama** — перед запуском `/chat` убедитесь, что `ollama serve` запущен и модель из `OLLAMA_MODEL` доступна
2. **Первая загрузка** — после добавления учебников вызовите `/textbooks/load`
3. **Производительность** — для больших объемов документов рассмотрите асинхронную загрузку
4. **Безопасность** — в продакшене настройте CORS и аутентификацию между сервисами

## Лицензия

Учебный проект для диплома.
