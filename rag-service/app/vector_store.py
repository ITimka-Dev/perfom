"""Модуль для работы с векторной базой данных (ChromaDB)."""

from collections import defaultdict
from datetime import datetime
from pathlib import Path
import shutil
import sqlite3
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions
from loguru import logger

from app.config import settings


class VectorStore:
    """Управление векторной базой документов."""

    def __init__(self):
        self.db_path = settings.CHROMA_DB_PATH
        self.collection_name = settings.CHROMA_COLLECTION_NAME
        self.embedding_function = self._create_embedding_function()

        self._ensure_compatible_database()
        self.client = self._create_client()
        self.collection = self._get_or_create_collection()

        logger.info(f"Векторная база инициализирована: {self.db_path}")
        logger.info(f"Коллекция: {self.collection_name}")
        logger.info(f"Embedding function: {settings.EMBEDDING_FUNCTION}")

    def _create_client(self):
        """Создать persistent ChromaDB client."""
        return chromadb.PersistentClient(
            path=self.db_path,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True,
            ),
        )

    def _get_or_create_collection(self):
        """Получить или создать коллекцию с явной embedding-функцией."""
        return self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=self.embedding_function,
        )

    def _ensure_compatible_database(self) -> None:
        """Проверить локальную SQLite-схему ChromaDB до создания клиента."""
        sqlite_path = Path(self.db_path) / "chroma.sqlite3"
        if not sqlite_path.exists():
            return

        try:
            with sqlite3.connect(sqlite_path) as connection:
                rows = connection.execute("PRAGMA table_info(collections)").fetchall()
        except sqlite3.Error as error:
            self._handle_incompatible_database(
                f"не удалось прочитать схему ChromaDB: {error}"
            )
            return

        column_names = {row[1] for row in rows}
        if rows and "topic" not in column_names:
            self._handle_incompatible_database(
                "устаревшая схема ChromaDB: в таблице collections нет колонки topic"
            )

    def _handle_incompatible_database(self, reason: str) -> None:
        """Сделать backup/reset несовместимой базы или выбросить понятную ошибку."""
        db_path = Path(self.db_path)
        message = (
            f"Обнаружена несовместимая локальная ChromaDB ({reason}). "
            "Базу нужно пересоздать и заново загрузить учебники."
        )

        if not settings.CHROMA_RESET_ON_SCHEMA_ERROR:
            raise RuntimeError(
                f"{message} Либо удалите папку {db_path}, либо включите "
                "CHROMA_RESET_ON_SCHEMA_ERROR=true."
            )

        if not db_path.exists():
            return

        backup_path = self._build_backup_path(db_path)
        logger.warning(f"{message} Перемещаю старую базу в backup: {backup_path}")
        shutil.move(str(db_path), str(backup_path))
        db_path.mkdir(parents=True, exist_ok=True)

    def _build_backup_path(self, db_path: Path) -> Path:
        """Построить свободный путь backup-директории для старой ChromaDB."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = db_path.with_name(f"{db_path.name}_backup_{timestamp}")
        counter = 1

        while backup_path.exists():
            backup_path = db_path.with_name(
                f"{db_path.name}_backup_{timestamp}_{counter}"
            )
            counter += 1

        return backup_path

    def _create_embedding_function(self):
        """Создать явную локальную embedding-функцию для ChromaDB."""
        if settings.EMBEDDING_FUNCTION == "onnx_minilm_l6_v2":
            return embedding_functions.ONNXMiniLM_L6_V2()

        raise ValueError(
            "Неизвестная embedding-функция: "
            f"{settings.EMBEDDING_FUNCTION}. Поддерживается: onnx_minilm_l6_v2"
        )

    def add_documents(
        self,
        documents: list[str],
        metadatas: list[dict],
        ids: list[str],
    ) -> None:
        """
        Добавить документы в векторную базу.

        Args:
            documents: Тексты документов
            metadatas: Метаданные для каждого документа (subject, textbook, page, etc.)
            ids: Уникальные идентификаторы для каждого документа
        """
        if len(documents) != len(metadatas) or len(documents) != len(ids):
            raise ValueError("Длины documents, metadatas и ids должны совпадать")

        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids,
        )

        logger.info(f"Добавлено {len(documents)} документов в векторную базу")

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        subject_filter: str | None = None,
        distance_threshold: float | None = None,
        fetch_multiplier: int | None = None,
        max_chunks_per_textbook: int | None = None,
    ) -> tuple[list[str], list[dict], list[float]]:
        """
        Поиск релевантных документов.

        Args:
            query_text: Текст запроса
            n_results: Количество результатов после фильтрации и диверсификации
            subject_filter: Фильтр по предмету (опционально)
            distance_threshold: Максимальная cosine distance
            fetch_multiplier: Во сколько раз больше кандидатов получить из ChromaDB
            max_chunks_per_textbook: Мягкий лимит чанков из одного учебника

        Returns:
            Кортеж (документы, метаданные, distances)
        """
        where_clause = None
        if subject_filter:
            where_clause = {"subject": subject_filter}

        fetch_multiplier = fetch_multiplier or settings.RETRIEVAL_FETCH_MULTIPLIER
        requested_results = max(n_results, n_results * fetch_multiplier)

        results = self.collection.query(
            query_texts=[query_text],
            n_results=requested_results,
            where=where_clause,
            include=["documents", "metadatas", "distances"],
        )

        documents = results["documents"][0] if results["documents"] else []
        metadatas = results["metadatas"][0] if results["metadatas"] else []
        distances = results["distances"][0] if results["distances"] else []

        candidates = [
            {"document": doc, "metadata": meta, "distance": float(distance)}
            for doc, meta, distance in zip(documents, metadatas, distances)
        ]

        distance_threshold = (
            settings.RETRIEVAL_DISTANCE_THRESHOLD
            if distance_threshold is None
            else distance_threshold
        )
        filtered_candidates = self._filter_by_distance(candidates, distance_threshold)

        # Дедупликация по тексту — убираем одинаковые чанки до диверсификации
        deduplicated_candidates = self._deduplicate_by_text(filtered_candidates)

        selected_candidates = self._select_diverse_candidates(
            candidates=deduplicated_candidates,
            n_results=n_results,
            max_chunks_per_textbook=(
                settings.RETRIEVAL_MAX_CHUNKS_PER_TEXTBOOK
                if max_chunks_per_textbook is None
                else max_chunks_per_textbook
            ),
        )

        for i, candidate in enumerate(selected_candidates):
            meta = candidate["metadata"]
            logger.debug(
                f"Результат {i + 1}: subject={meta.get('subject')}, "
                f"textbook={meta.get('textbook')}, "
                f"distance={candidate['distance']:.4f}"
            )

        return (
            [candidate["document"] for candidate in selected_candidates],
            [candidate["metadata"] for candidate in selected_candidates],
            [candidate["distance"] for candidate in selected_candidates],
        )

    def _deduplicate_by_text(
        self,
        candidates: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Убрать кандидатов с одинаковым текстом чанка.

        ChromaDB может вернуть один и тот же чанк несколько раз если он
        попал в базу с разными ID (например, при повторной загрузке учебника).
        Оставляем только первое вхождение (с наименьшим distance, т.к. список
        уже отсортирован по релевантности).
        """
        seen_texts: set[str] = set()
        deduplicated = []

        for candidate in candidates:
            text = candidate["document"].strip()
            if text not in seen_texts:
                seen_texts.add(text)
                deduplicated.append(candidate)

        removed = len(candidates) - len(deduplicated)
        if removed > 0:
            logger.debug(f"Дедупликация: удалено {removed} дублирующихся чанков")

        return deduplicated

    def _filter_by_distance(
        self,
        candidates: list[dict[str, Any]],
        distance_threshold: float,
    ) -> list[dict[str, Any]]:
        """Оставить только кандидатов не дальше заданного cosine distance."""
        if distance_threshold <= 0:
            return candidates

        filtered = [
            candidate
            for candidate in candidates
            if candidate["distance"] <= distance_threshold
        ]

        logger.debug(
            f"Фильтр distance <= {distance_threshold}: "
            f"{len(filtered)}/{len(candidates)} кандидатов"
        )
        return filtered

    def _select_diverse_candidates(
        self,
        candidates: list[dict[str, Any]],
        n_results: int,
        max_chunks_per_textbook: int,
    ) -> list[dict[str, Any]]:
        """
        Выбрать top-N кандидатов, по возможности не забирая всё из одного учебника.

        Лимит по учебнику мягкий: если после диверсификации результатов меньше n_results,
        недостающие места дозаполняются лучшими оставшимися кандидатами.
        """
        if max_chunks_per_textbook <= 0:
            return candidates[:n_results]

        selected = []
        skipped = []
        textbook_counts: dict[str, int] = defaultdict(int)

        for candidate in candidates:
            textbook = candidate["metadata"].get("textbook", "Unknown")
            if textbook_counts[textbook] < max_chunks_per_textbook:
                selected.append(candidate)
                textbook_counts[textbook] += 1
            else:
                skipped.append(candidate)

            if len(selected) == n_results:
                return selected

        for candidate in skipped:
            selected.append(candidate)
            if len(selected) == n_results:
                break

        return selected

    def get_document_count(self, subject_filter: str | None = None) -> int:
        """Получить количество документов в базе (опционально с фильтром)."""
        if subject_filter:
            results = self.collection.get(
                where={"subject": subject_filter},
                include=[],
            )
            return len(results["ids"]) if results["ids"] else 0
        else:
            return self.collection.count()

    def clear_collection(self) -> None:
        """Очистить коллекцию (для тестов или перезагрузки)."""
        self.client.delete_collection(self.collection_name)
        self.collection = self.client.create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
            embedding_function=self.embedding_function,
        )
        logger.warning("Коллекция очищена")


# Глобальный инстанс
vector_store = VectorStore()