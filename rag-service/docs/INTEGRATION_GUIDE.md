# Руководство по интеграции RAG-сервиса с EduFarm

## Обзор

RAG-сервис — это отдельный микросервис на FastAPI, который предоставляет интеллектуального ассистента для образовательной платформы EduFarm. Сервис использует локальную LLM через Ollama и векторную базу данных с учебниками.

## Архитектура взаимодействия

```
┌─────────────────────┐
│   EduFarm Frontend  │ (React)
│   (127.0.0.1:5173)  │
└──────────┬──────────┘
           │ HTTP/REST
           ▼
┌─────────────────────┐
│   EduFarm Backend   │ (NestJS)
│   (127.0.0.1:3001)  │
└──────────┬──────────┘
           │ HTTP/REST
           ▼
┌─────────────────────┐     ┌──────────────────┐
│   RAG Service       │────▶│   Ollama Local   │
│   (127.0.0.1:8000)  │◀────│      LLM         │
│                     │     └──────────────────┘
│   - ChromaDB        │
│   - PDF Processor   │
└─────────────────────┘
```

## Шаг 1: Настройка RAG-сервиса

### 1.1 Установка зависимостей

```bash
cd rag-service
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 1.2 Настройка переменных окружения

Создайте `.env` и укажите параметры локальной модели:

```bash
cp .env.example .env
```

Откройте `.env` и укажите:

```env
LLM_PROVIDER=ollama
EMBEDDING_FUNCTION=onnx_minilm_l6_v2
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-3b-instruct-q4km
CHROMA_RESET_ON_SCHEMA_ERROR=true
```

Перед запросами в `/chat` запустите Ollama и убедитесь, что модель доступна:

```bash
ollama serve
ollama list
ollama run qwen2.5-3b-instruct-q4km
```

### 1.3 Загрузка учебников

Поместите PDF файлы учебников в директории:

```
rag-service/data/textbooks/
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
│   └── ...
├── biology/
│   └── ...
└── chemistry/
    └── ...
```

Загрузите учебники в векторную базу:

```bash
# Вариант 1: Через API
curl -X POST http://127.0.0.1:8000/textbooks/load

# Вариант 2: Через Python скрипт
python -c "from app.document_processor import document_processor; document_processor.load_all_textbooks()"
```

Проверьте статистику:

```bash
curl http://127.0.0.1:8000/textbooks/stats
```

### 1.4 Запуск сервиса

```bash
# Локальный запуск
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Или через Docker
docker-compose up -d
```

Проверьте работоспособность:

```bash
curl http://127.0.0.1:8000/health
```

## Шаг 2: Интеграция в NestJS Backend

### 2.1 Создание модуля RAG

Создайте новый модуль в backend:

```bash
cd backend/src/modules
mkdir rag
```

### 2.2 RAG Service

**File: `backend/src/modules/rag/rag.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

export interface RagChatRequest {
  query: string;
  subject?: 'programming' | 'mathematics' | 'physics' | 'biology' | 'chemistry';
  userId?: string;
}

export interface RagChatResponse {
  answer: string;
  sources: Array<{
    textbook: string;
    page: number;
    subject: string;
  }>;
  subject?: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private readonly ragApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ragApiUrl = this.configService.get<string>('RAG_SERVICE_URL') || 'http://127.0.0.1:8000';
  }

  async askQuestion(request: RagChatRequest): Promise<RagChatResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<RagChatResponse>(
          `${this.ragApiUrl}/chat`,
          {
            query: request.query,
            subject: request.subject,
            user_id: request.userId,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 секунд
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Ошибка запроса к RAG сервису: ${error.message}`);
      throw new Error(`Failed to get response from RAG service: ${error.message}`);
    }
  }

  async getStats(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ragApiUrl}/textbooks/stats`),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`);
      throw new Error(`Failed to get stats from RAG service: ${error.message}`);
    }
  }
}
```

### 2.3 RAG Controller

**File: `backend/src/modules/rag/rag.controller.ts`**

```typescript
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RagService, RagChatRequest } from './rag.service';

@Controller('rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('chat')
  async chat(@Body() body: RagChatRequest, @Request() req) {
    // Добавляем userId из токена
    const request: RagChatRequest = {
      ...body,
      userId: req.user?.id,
    };

    return this.ragService.askQuestion(request);
  }

  @Get('stats')
  async stats() {
    return this.ragService.getStats();
  }
}
```

### 2.4 RAG Module

**File: `backend/src/modules/rag/rag.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';

@Module({
  imports: [HttpModule],
  providers: [RagService],
  controllers: [RagController],
  exports: [RagService],
})
export class RagModule {}
```

### 2.5 Регистрация модуля

**File: `backend/src/app.module.ts`**

Добавьте `RagModule` в список импортов главного модуля:

```typescript
import { Module } from '@nestjs/common';
// ... другие импорты
import { RagModule } from './modules/rag/rag.module';

@Module({
  imports: [
    // ... другие модули
    RagModule,
  ],
  // ...
})
export class AppModule {}
```

### 2.6 Настройка переменных окружения backend

**File: `backend/.env`** или `backend/.env.development`

```env
RAG_SERVICE_URL=http://127.0.0.1:8000
```

Для production (Kubernetes):

```env
RAG_SERVICE_URL=http://rag-service:8000
```

## Шаг 3: Интеграция во Frontend (React)

### 3.1 Создание хука

**File: `src/hooks/useRagAssistant.ts`**

```typescript
import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api-client';

export type SubjectType = 
  | 'programming'
  | 'mathematics'
  | 'physics'
  | 'biology'
  | 'chemistry';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    textbook: string;
    page: number;
    subject: string;
  }>;
}

export interface UseRagAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (query: string, subject?: SubjectType) => Promise<void>;
  clearChat: () => void;
}

export const useRagAssistant = (): UseRagAssistantReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (query: string, subject?: SubjectType) => {
    setIsLoading(true);
    setError(null);

    // Добавляем сообщение пользователя
    setMessages(prev => [...prev, { role: 'user', content: query }]);

    try {
      const response = await apiClient.post('/rag/chat', {
        query,
        subject,
      });

      const { answer, sources } = response.data;

      // Добавляем ответ ассистента
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          sources,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка получения ответа';
      setError(errorMessage);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Извините, произошла ошибка при обработке вашего вопроса.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};
```

### 3.2 Компонент чата

**File: `src/components/chat/RagChatWidget.tsx`**

```typescript
import React, { useState } from 'react';
import { useRagAssistant, SubjectType } from '../../hooks/useRagAssistant';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

const SUBJECTS: { value: SubjectType; label: string }[] = [
  { value: 'programming', label: 'Программирование' },
  { value: 'mathematics', label: 'Математика' },
  { value: 'physics', label: 'Физика' },
  { value: 'biology', label: 'Биология' },
  { value: 'chemistry', label: 'Химия' },
];

export const RagChatWidget: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | undefined>();
  const { messages, isLoading, sendMessage, clearChat } = useRagAssistant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    await sendMessage(query, selectedSubject);
    setQuery('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>🎓 Интеллектуальный ассистент EduFarm</span>
          <Button variant="ghost" size="sm" onClick={clearChat}>
            Очистить
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Выбор предмета */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {SUBJECTS.map(subject => (
            <Badge
              key={subject.value}
              variant={selectedSubject === subject.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedSubject(
                selectedSubject === subject.value ? undefined : subject.value
              )}
            >
              {subject.label}
            </Badge>
          ))}
        </div>

        {/* Сообщения */}
        <ScrollArea className="h-96 mb-4 p-4 border rounded-md">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Задайте вопрос по любому предмету!
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p>{msg.content}</p>
                    
                    {/* Источники */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t text-xs">
                        <p className="font-semibold mb-1">Источники:</p>
                        {msg.sources.map((source, i) => (
                          <p key={i} className="text-muted-foreground">
                            📖 {source.textbook}, стр. {source.page} ({source.subject})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="animate-pulse">Думаю...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Форма ввода */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Задайте вопрос..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            Отправить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
```

### 3.3 Добавление страницы чата

**File: `src/pages/RagChatPage.tsx`**

```typescript
import React from 'react';
import { RagChatWidget } from '../components/chat/RagChatWidget';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

export const RagChatPage: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
      <div className="container mx-auto py-8">
        <RagChatWidget />
      </div>
    </ProtectedRoute>
  );
};
```

### 3.4 Добавление маршрута

**File: `src/App.tsx`**

Добавьте маршрут для страницы чата:

```typescript
import { RagChatPage } from './pages/RagChatPage';

// В списке маршрутов:
<Route path="/chat" element={<RagChatPage />} />
```

## Шаг 4: Kubernetes Deployment (Production)

### 4.1 Deployment манифест

**File: `k8s/rag-deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rag-service
  namespace: edufarm
  labels:
    app: rag-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: rag-service
  template:
    metadata:
      labels:
        app: rag-service
    spec:
      containers:
      - name: rag-service
        image: your-registry/edufarm-rag-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: LLM_PROVIDER
          value: ollama
        - name: EMBEDDING_FUNCTION
          value: onnx_minilm_l6_v2
        - name: OLLAMA_BASE_URL
          value: http://ollama:11434
        - name: OLLAMA_MODEL
          value: qwen2.5-3b-instruct-q4km
        - name: CHROMA_DB_PATH
          value: /app/data/chroma_db
        - name: CHROMA_RESET_ON_SCHEMA_ERROR
          value: "true"
        volumeMounts:
        - name: chroma-data
          mountPath: /app/data/chroma_db
        - name: textbooks
          mountPath: /app/data/textbooks
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: chroma-data
        persistentVolumeClaim:
          claimName: rag-chroma-pvc
      - name: textbooks
        configMap:
          name: rag-textbooks
---
apiVersion: v1
kind: Service
metadata:
  name: rag-service
  namespace: edufarm
spec:
  selector:
    app: rag-service
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

### 4.2 Ollama service

В Kubernetes Ollama можно поднять отдельным сервисом `ollama:11434` или вынести на отдельный GPU-хост. Главное, чтобы `OLLAMA_BASE_URL` из deployment RAG-сервиса указывал на доступный Ollama endpoint.

## Проверка интеграции

### 1. Health check

```bash
curl http://127.0.0.1:8000/health
```

### 2. Тестовый запрос

```bash
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "Что такое производная?", "subject": "mathematics"}'
```

### 3. Из NestJS

```bash
curl -X POST http://127.0.0.1:3001/rag/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "Объясни законы Ньютона", "subject": "physics"}'
```

## Troubleshooting

### Ошибка: "Не удалось получить ответ от локальной модели Ollama"

Проверьте файл `.env` и доступность Ollama:
```bash
cat .env | grep OLLAMA
curl http://127.0.0.1:11434/api/tags
ollama list
```

Убедитесь, что `OLLAMA_BASE_URL` и `OLLAMA_MODEL` указаны корректно.

### Ошибка: `sqlite3.OperationalError: no such column: collections.topic`

Причина — локальная папка ChromaDB создана другой версией ChromaDB. Оставьте `CHROMA_RESET_ON_SCHEMA_ERROR=true`, перезапустите сервис и затем заново загрузите учебники.

### Ошибка: "Не найдено релевантных документов"

Загрузите учебники:
```bash
curl -X POST http://127.0.0.1:8000/textbooks/load
```

### Ошибка CORS

Настройте CORS в `app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://127.0.0.1:3001"],
    # ...
)
```

## Дополнительные ресурсы

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Ollama Documentation](https://github.com/ollama/ollama/tree/main/docs)
- [NestJS HttpModule](https://docs.nestjs.com/techniques/http-module)
