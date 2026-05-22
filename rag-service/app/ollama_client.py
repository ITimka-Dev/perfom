"""Клиент локальной LLM через Ollama."""

import asyncio
import httpx
from loguru import logger

from app.config import settings

# Отключаем системный прокси для локальных адресов (решает проблему с V2Ray/Clash на Windows)
# host.docker.internal используется в Docker Desktop для доступа к хост-машине
NO_PROXY = {"all://127.0.0.1": None, "all://localhost": None, "all://host.docker.internal": None}


class OllamaClient:
    """Клиент для работы с локальной моделью Ollama."""

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.max_retries = 5
        self.retry_delay = 2.0  # базовая задержка между попытками (экспоненциально растёт)

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str:
        """
        Отправить запрос к локальной модели Ollama.

        Args:
            messages: Список сообщений с role/content для chat API Ollama
            temperature: Температура генерации
            max_tokens: Максимальное количество токенов в ответе

        Returns:
            Ответ от модели
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": (
                    temperature if temperature is not None else settings.OLLAMA_TEMPERATURE
                ),
                "num_ctx": settings.OLLAMA_NUM_CTX,
                "num_predict": max_tokens or settings.OLLAMA_NUM_PREDICT,
                # Штраф за повторение токенов — убирает зацикливание и повторы фраз
                "repeat_penalty": 1.3,
                # Окно для проверки повторений (токенов)
                "repeat_last_n": 128,
            },
        }

        last_error = None
        for attempt in range(self.max_retries):
            try:
                logger.debug(f"Попытка {attempt + 1}/{self.max_retries} подключения к Ollama")
                async with httpx.AsyncClient(
                    timeout=settings.OLLAMA_TIMEOUT_SECONDS,
                    proxies=NO_PROXY,
                ) as client:
                    response = await client.post(
                        f"{self.base_url}/api/chat",
                        json=payload,
                    )

                    if response.status_code == 503:
                        wait_time = self.retry_delay * (2 ** attempt)  # 2, 4, 8, 16, 32s
                        logger.warning(
                            f"Ollama 503 (занята/загружается). "
                            f"Попытка {attempt + 1}/{self.max_retries}, жду {wait_time}s"
                        )
                        await asyncio.sleep(wait_time)
                        continue

                    response.raise_for_status()
                    data = response.json()
                    answer = data.get("message", {}).get("content", "").strip()

                    if not answer:
                        logger.warning("Пустой ответ от Ollama")
                        return "Извините, я не смог сформировать ответ."

                    logger.info(f"Получен ответ от Ollama (длина: {len(answer)})")
                    return answer

            except httpx.HTTPStatusError as e:
                last_error = e
                logger.error(
                    f"Ollama вернула ошибку HTTP: {e.response.status_code} "
                    f"{e.response.text}"
                )
                raise Exception(f"Ollama HTTP error: {e.response.status_code}")

            except httpx.HTTPError as e:
                last_error = e
                wait_time = self.retry_delay * (2 ** attempt)
                logger.error(f"Ошибка запроса к Ollama (попытка {attempt + 1}): {e}")
                if attempt < self.max_retries - 1:
                    logger.info(f"Повторная попытка через {wait_time}s")
                    await asyncio.sleep(wait_time)
                    continue
                raise Exception(
                    "Не удалось получить ответ от локальной модели Ollama. "
                    "Проверьте, что Ollama запущена и модель загружена."
                ) from e

        raise Exception(
            f"Ollama не ответил после {self.max_retries} попыток. "
            f"Последняя ошибка: {last_error}"
        )

    async def chat_with_context(
        self,
        query: str,
        context_documents: list[str],
        context_metadatas: list[dict] | None = None,
        system_prompt: str = "",
    ) -> str:
        """
        Отправить запрос с контекстом из документов.

        Args:
            query: Запрос пользователя
            context_documents: Список релевантных документов из векторной БД
            context_metadatas: Метаданные найденных документов
            system_prompt: Системный промпт (опционально)

        Returns:
            Ответ от модели
        """
        context_text = "\n\n".join(
            [
                self._format_context_fragment(i, doc, context_metadatas)
                for i, doc in enumerate(context_documents)
            ]
        )

        default_system_prompt = (
            "Ты — образовательный ассистент EduFarm. Строго соблюдай правила:\n"
            "1. Отвечай СРАЗУ на вопрос — без вводных фраз типа 'Ответ:', "
            "'Конечно!', 'Важно отметить', 'Ответ учителя:'\n"
            "2. НЕ повторяй одну и ту же мысль несколько раз — каждое предложение "
            "должно добавлять новую информацию\n"
            "3. Используй контекст из учебников как основной источник\n"
            "4. Если в контексте нет ответа — скажи об этом одной фразой и дай "
            "краткое пояснение\n"
            "5. Не выдумывай факты и номера страниц\n"
            "6. Язык: русский, стиль: чёткий и понятный"
        )

        system_message = system_prompt or default_system_prompt

        # Запрос оборачивается в явную инструкцию с глаголом действия.
        # Это критично для малых моделей (3B): если user message заканчивается
        # на вопросительное слово или незавершённую фразу — модель её достраивает
        # вместо того чтобы отвечать. Обёртка "Ответь на вопрос: ..." закрывает
        # синтаксическую незавершённость и модель сразу переходит к ответу.
        wrapped_query = f'Ответь на вопрос ученика: "{query}"'

        user_message = (
            f"Контекст из учебников:\n{context_text}\n\n"
            f"{wrapped_query}"
        )

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ]

        return await self.chat(messages)

    def _format_context_fragment(
        self,
        index: int,
        document: str,
        context_metadatas: list[dict] | None = None,
    ) -> str:
        """Сформировать фрагмент контекста с учебником и страницей, если они есть."""
        if not context_metadatas or index >= len(context_metadatas):
            return f"Фрагмент {index + 1}:\n{document}"

        metadata = context_metadatas[index]
        textbook = metadata.get("textbook", "Unknown")
        page = metadata.get("page", 0)
        subject = metadata.get("subject", "Unknown")

        return (
            f"Фрагмент {index + 1} "
            f"(предмет: {subject}, учебник: {textbook}, страница: {page}):\n"
            f"{document}"
        )


# Глобальный инстанс клиента
ollama_client = OllamaClient()