"""Конфигурация RAG-сервиса."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Настройки приложения."""

    # Сервер
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # LLM provider
    LLM_PROVIDER: str = "ollama"

    # Embeddings
    EMBEDDING_FUNCTION: str = "onnx_minilm_l6_v2"

    # Ollama local LLM
    # host.docker.internal работает на Windows/macOS Docker Desktop
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    OLLAMA_MODEL: str = "qwen2.5-3b-instruct-q4km"
    OLLAMA_TEMPERATURE: float = 0.2
    OLLAMA_NUM_CTX: int = 4096       # было 1024 — слишком мало, модель обрезалась и бредила
    OLLAMA_NUM_PREDICT: int = 512    # было 700 — снижаем, модель заполняла токены повторами
    OLLAMA_TIMEOUT_SECONDS: float = 300.0

    # ChromaDB
    CHROMA_DB_PATH: str = "./data/chroma_db"
    CHROMA_COLLECTION_NAME: str = "edufarm_textbooks"
    CHROMA_RESET_ON_SCHEMA_ERROR: bool = True

    # Обработка документов
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    # Лимиты
    MAX_CONTEXT_DOCUMENTS: int = 3   # было 5 — меньше чанков, меньше дублей, меньше шума
    MAX_QUERY_LENGTH: int = 500

    # Retrieval quality
    RETRIEVAL_DISTANCE_THRESHOLD: float = 1.2
    RETRIEVAL_FETCH_MULTIPLIER: int = 3
    RETRIEVAL_MAX_CHUNKS_PER_TEXTBOOK: int = 2

    # Предметы
    ALLOWED_SUBJECTS: List[str] = [
        "programming",
        "mathematics",
        "physics",
        "biology",
        "chemistry",
    ]

    # Observability
    SENTRY_DSN: str = ""
    ENABLE_METRICS: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()