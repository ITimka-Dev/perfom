"""Модуль для обработки PDF документов."""

import os
import tempfile
import uuid
from pathlib import Path
from typing import Literal

import fitz  # PyMuPDF
from pdf2image import convert_from_path
from PIL import Image
import pytesseract
from loguru import logger

from app.config import settings
from app.vector_store import vector_store


# Установите poppler для Windows: https://github.com/oschwartz10612/poppler-windows/releases/
# После установки добавьте путь к bin в PATH или укажите poppler_path в convert_from_path

SubjectType = Literal[
    "programming",
    "mathematics",
    "physics",
    "biology",
    "chemistry",
]

# Порог для определения необходимости OCR (символов)
OCR_TEXT_THRESHOLD = 50
# DPI для конвертации PDF в изображение
OCR_DPI = 150
# Языки для OCR
OCR_LANGUAGES = "rus+eng"


class DocumentProcessor:
    """Обработка и загрузка PDF учебников."""

    def __init__(self):
        self.textbooks_dir = Path(settings.CHROMA_DB_PATH).parent / "textbooks"
        # Создаем директорию если не существует
        self.textbooks_dir.mkdir(parents=True, exist_ok=True)

    def extract_text_from_pdf(self, pdf_path: str) -> list[tuple[str, int]]:
        """
        Извлечь текст из PDF файла постранично.

        Сначала пытается извлечь текст напрямую через PyMuPDF.
        Если текста мало (< 50 символов) — запускает OCR через pytesseract.

        Args:
            pdf_path: Путь к PDF файлу

        Returns:
            Список кортежей (текст_страницы, номер_страницы)
        """
        pages = []
        
        # Открываем PDF документ
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        
        logger.info(f"Обработка PDF: {pdf_path}, страниц: {total_pages}")
        
        for page_num in range(total_pages):
            page = doc[page_num]
            
            # Попытка извлечь текст напрямую
            text = page.get_text("text").strip()
            
            # Если текста мало — используем OCR
            if len(text) < OCR_TEXT_THRESHOLD:
                logger.warning(f"Мало текста на странице {page_num + 1} ({len(text)} симв.), запускаю OCR...")
                
                # Конвертируем страницу в изображение с временным файлом
                with tempfile.TemporaryDirectory() as temp_dir:
                    # Конвертация PDF страницы в изображение (150 DPI)
                    images = convert_from_path(
                        pdf_path,
                        dpi=OCR_DPI,
                        first_page=page_num + 1,
                        last_page=page_num + 1,
                        output_folder=temp_dir,
                        fmt='png'
                    )
                    
                    if images:
                        image = images[0]
                        # Применяем OCR
                        ocr_text = pytesseract.image_to_string(image, lang=OCR_LANGUAGES).strip()
                        
                        if ocr_text:
                            text = ocr_text
                            logger.info(f"OCR распознал текст на странице {page_num + 1} ({len(text)} симв.)")
                        else:
                            logger.warning(f"OCR не смог распознать текст на странице {page_num + 1}")
            
            # Добавляем страницу если есть текст
            if text:
                pages.append((text, page_num + 1))  # Нумерация с 1
            
            logger.info(f"Обработка страницы {page_num + 1}/{total_pages}")
        
        doc.close()
        
        logger.info(f"Извлечено {len(pages)} страниц из {pdf_path}")
        return pages

    def chunk_text(
        self,
        text: str,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> list[str]:
        """
        Разбить текст на чанки.

        Args:
            text: Текст для разбивки
            chunk_size: Размер чанка в символах
            chunk_overlap: Перекрытие между чанками

        Returns:
            Список чанков
        """
        chunk_size = chunk_size or settings.CHUNK_SIZE
        chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]

            # Пытаемся разбить по границе предложения или абзаца
            if end < len(text):
                # Ищем последнюю точку, newline или пробел в пределах чанка
                last_break = max(
                    chunk.rfind("."),
                    chunk.rfind("\n"),
                    chunk.rfind(" "),
                )
                if last_break > chunk_size // 2:  # Если нашли разумную границу
                    chunk = chunk[: last_break + 1]
                    end = start + last_break + 1

            chunks.append(chunk.strip())
            start = end - chunk_overlap  # Двигаемся с перекрытием

        return chunks

    def load_textbook(
        self,
        pdf_path: str,
        subject: SubjectType,
        textbook_name: str,
    ) -> int:
        """
        Загрузить учебник в векторную базу.

        Args:
            pdf_path: Путь к PDF файлу
            subject: Предмет
            textbook_name: Название учебника

        Returns:
            Количество добавленных чанков
        """
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"Файл не найден: {pdf_path}")

        logger.info(f"Загрузка учебника: {textbook_name} ({subject})")

        # Извлекаем текст постранично
        pages = self.extract_text_from_pdf(str(pdf_path))

        documents = []
        metadatas = []
        ids = []

        # Обрабатываем каждую страницу
        for page_text, page_num in pages:
            # Разбиваем страницу на чанки
            chunks = self.chunk_text(page_text)

            for chunk in chunks:
                if len(chunk.strip()) < 50:  # Пропускаем слишком короткие чанки
                    continue

                doc_id = str(uuid.uuid4())
                documents.append(chunk)
                metadatas.append(
                    {
                        "subject": subject,
                        "textbook": textbook_name,
                        "page": page_num,
                        "chunk_size": len(chunk),
                    }
                )
                ids.append(doc_id)

        # Добавляем в векторную базу
        if documents:
            vector_store.add_documents(documents, metadatas, ids)
            logger.info(
                f"Учебник '{textbook_name}' загружен: {len(documents)} чанков"
            )
            return len(documents)
        else:
            logger.warning(f"Учебник '{textbook_name}' пуст или не содержит текста")
            return 0

    def load_all_textbooks(self) -> dict[SubjectType, int]:
        """
        Загрузить все учебники из директории data/textbooks.

        Ожидается структура:
        data/textbooks/
            programming/
                textbook1.pdf
                textbook2.pdf
                textbook3.pdf
            mathematics/
                ...
            physics/
                ...
            biology/
                ...
            chemistry/
                ...

        Returns:
            Словарь {предмет: количество чанков}
        """
        results = {}

        for subject in settings.ALLOWED_SUBJECTS:
            subject_dir = self.textbooks_dir / subject
            if not subject_dir.exists():
                logger.warning(f"Директория предмета не найдена: {subject_dir}")
                results[subject] = 0  # type: ignore
                continue

            pdf_files = list(subject_dir.glob("*.pdf"))
            if not pdf_files:
                logger.warning(f"Нет PDF файлов в {subject_dir}")
                results[subject] = 0  # type: ignore
                continue

            total_chunks = 0
            for pdf_file in pdf_files:
                try:
                    chunks_count = self.load_textbook(
                        pdf_path=str(pdf_file),
                        subject=subject,  # type: ignore
                        textbook_name=pdf_file.stem,
                    )
                    total_chunks += chunks_count
                except Exception as e:
                    logger.error(f"Ошибка загрузки {pdf_file}: {e}")

            results[subject] = total_chunks  # type: ignore
            logger.info(f"Предмет {subject}: загружено {total_chunks} чанков")

        return results


# Глобальный инстанс
document_processor = DocumentProcessor()
