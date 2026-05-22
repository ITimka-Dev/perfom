"""Основной модуль RAG-сервиса EduFarm."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from loguru import logger
import httpx
import sentry_sdk

from app.config import settings
from app.ollama_client import ollama_client
from app.vector_store import vector_store
from app.document_processor import document_processor, SubjectType

from dotenv import load_dotenv

load_dotenv()

# Инициализация Sentry (опционально)
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения."""
    logger.info("RAG-сервис EduFarm запускается...")
    logger.info(f"Предметы: {settings.ALLOWED_SUBJECTS}")
    logger.info(f"Путь к базе данных: {settings.CHROMA_DB_PATH}")
    logger.info(f"LLM provider: {settings.LLM_PROVIDER}")
    logger.info(f"Ollama URL: {settings.OLLAMA_BASE_URL}")
    logger.info(f"Ollama model: {settings.OLLAMA_MODEL}")
    logger.info(f"Ollama num_ctx: {settings.OLLAMA_NUM_CTX}")

    # Лёгкая async-проверка доступности Ollama (без загрузки модели)
    try:
        async with httpx.AsyncClient(
            timeout=10.0,
            proxies={"all://host.docker.internal": None},
        ) as client:
            r = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            logger.info(f"✅ Ollama доступна: HTTP {r.status_code}")
    except Exception as e:
        logger.warning(
            f"⚠️ Ollama недоступна при старте: {e}. "
            "Убедитесь, что 'ollama serve' запущен до первого запроса."
        )

    yield

    logger.info("RAG-сервис EduFarm останавливается...")


app = FastAPI(
    title="EduFarm RAG Service",
    description=(
        "Интеллектуальный ассистент на основе локальной LLM через Ollama "
        "для образовательной платформы EduFarm"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",  # Frontend EduFarm
        "http://127.0.0.1:3001",  # Backend EduFarm
        "*",  # В продакшене замените на конкретные домены
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Pydantic модели ====================


class ChatRequest(BaseModel):
    """Запрос к чату."""

    query: str = Field(..., min_length=1, max_length=settings.MAX_QUERY_LENGTH)
    subject: Optional[SubjectType] = None
    user_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "query": "Что такое производная функции?",
                "subject": "mathematics",
                "user_id": "user_123",
            }
        }


class ChatResponse(BaseModel):
    """Ответ чата."""

    answer: str
    sources: list[dict] = []
    subject: Optional[str] = None


class LoadTextbooksRequest(BaseModel):
    """Запрос на загрузку учебников."""

    subject: Optional[SubjectType] = None


class LoadTextbooksResponse(BaseModel):
    """Ответ на загрузку учебников."""

    loaded: dict[str, int]
    total_chunks: int


class HealthResponse(BaseModel):
    """Статус здоровья сервиса."""

    status: str
    vector_db_documents: int
    subjects_available: list[str]


# ==================== Endpoints ====================


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Проверка здоровья сервиса."""
    return HealthResponse(
        status="healthy",
        vector_db_documents=vector_store.get_document_count(),
        subjects_available=settings.ALLOWED_SUBJECTS,
    )


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    """
    Получить ответ на вопрос ученика.

    RAG-пайплайн:
    1. Поиск релевантных документов в векторной базе
    2. Формирование контекста
    3. Запрос к локальной LLM через Ollama с контекстом
    4. Возврат ответа с источниками
    """
    logger.info(f"Запрос: {request.query[:100]}... (subject={request.subject})")

    try:
        # Шаг 1: Поиск релевантных документов
        documents, metadatas, distances = vector_store.query(
            query_text=request.query,
            n_results=settings.MAX_CONTEXT_DOCUMENTS,
            subject_filter=request.subject,
        )

        if not documents:
            logger.warning("Не найдено релевантных документов после фильтрации")
            answer = await ollama_client.chat(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Ты — образовательный ассистент EduFarm. "
                            "Отвечай сразу на вопрос без вводных фраз. "
                            "В базе знаний не найден релевантный контекст — "
                            "предупреди об этом одной фразой и дай краткий ответ."
                        ),
                    },
                    {"role": "user", "content": f'Ответь на вопрос ученика: "{request.query}"'},
                ]
            )
            return ChatResponse(
                answer=answer,
                sources=[],
                subject=request.subject,
            )

        # Шаг 2: Формирование контекста и запрос к локальной LLM
        answer = await ollama_client.chat_with_context(
            query=request.query,
            context_documents=documents,
            context_metadatas=metadatas,
        )

        # Шаг 3: Формирование источников
        sources = [
            {
                "textbook": meta.get("textbook", "Unknown"),
                "page": meta.get("page", 0),
                "subject": meta.get("subject", "Unknown"),
                "distance": round(distance, 4),
                "relevance_score": round(max(0.0, 1.0 - distance), 4),
            }
            for meta, distance in zip(metadatas, distances)
        ]

        logger.info(f"Ответ получен, источники: {len(sources)}")

        return ChatResponse(
            answer=answer,
            sources=sources,
            subject=request.subject,
        )

    except Exception as e:
        logger.error(f"Ошибка обработки запроса: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка обработки запроса: {str(e)}",
        )


@app.post("/textbooks/load", response_model=LoadTextbooksResponse, tags=["Textbooks"])
async def load_textbooks(request: Optional[LoadTextbooksRequest] = None):
    """
    Загрузить учебники в векторную базу.

    Если subject указан — загружает только этот предмет,
    иначе — все предметы из директории data/textbooks.
    """
    try:
        if request and request.subject:
            subject_dir = document_processor.textbooks_dir / request.subject
            pdf_files = list(subject_dir.glob("*.pdf")) if subject_dir.exists() else []

            if not pdf_files:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Нет PDF файлов для предмета {request.subject}",
                )

            total_chunks = 0
            loaded = {}

            for pdf_file in pdf_files:
                chunks_count = document_processor.load_textbook(
                    pdf_path=str(pdf_file),
                    subject=request.subject,
                    textbook_name=pdf_file.stem,
                )
                total_chunks += chunks_count
                loaded[pdf_file.name] = chunks_count

            return LoadTextbooksResponse(loaded=loaded, total_chunks=total_chunks)
        else:
            results = document_processor.load_all_textbooks()
            total = sum(results.values())
            return LoadTextbooksResponse(
                loaded={k: v for k, v in results.items()},
                total_chunks=total,
            )

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Ошибка загрузки учебников: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка загрузки учебников: {str(e)}",
        )


@app.get("/textbooks/stats", tags=["Textbooks"])
async def textbooks_stats():
    """Получить статистику по загруженным учебникам."""
    stats = {}
    total = 0

    for subject in settings.ALLOWED_SUBJECTS:
        count = vector_store.get_document_count(subject_filter=subject)
        stats[subject] = count
        total += count

    return {
        "total_chunks": total,
        "by_subject": stats,
    }


@app.delete("/textbooks/clear", tags=["Textbooks"])
async def clear_textbooks():
    """Очистить векторную базу (для тестов)."""
    vector_store.clear_collection()
    return {"status": "cleared"}


@app.get("/", tags=["Root"])
async def root():
    """Информация о сервисе."""
    return {
        "service": "EduFarm RAG Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )