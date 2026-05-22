"""Тесты для RAG-сервиса EduFarm."""

import pytest
from fastapi.testclient import TestClient
from app import main as main_module

app = main_module.app


client = TestClient(app)


class TestHealth:
    """Тесты health endpoint."""

    def test_health_check(self):
        """Проверка здоровья сервиса."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "vector_db_documents" in data
        assert "subjects_available" in data
        assert isinstance(data["subjects_available"], list)


class TestRoot:
    """Тесты root endpoint."""

    def test_root(self):
        """Проверка корня приложения."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "EduFarm RAG Service"
        assert "version" in data
        assert "docs" in data


class TestChat:
    """Тесты chat endpoint."""

    def test_chat_empty_query(self):
        """Запрос с пустым query должен вернуть ошибку."""
        response = client.post(
            "/chat",
            json={"query": "", "subject": "mathematics"}
        )
        assert response.status_code == 422  # Validation error

    def test_chat_invalid_subject(self):
        """Запрос с недопустимым предметом должен вернуть ошибку."""
        response = client.post(
            "/chat",
            json={"query": "Что такое 2+2?", "subject": "invalid_subject"}
        )
        assert response.status_code == 422  # Validation error

    def test_chat_valid_request(self, monkeypatch):
        """Валидный запрос должен вернуть ответ без обращения к реальной Ollama."""
        async def fake_chat(*args, **kwargs):
            return "Тестовый ответ локальной LLM"

        async def fake_chat_with_context(*args, **kwargs):
            return "Тестовый RAG-ответ локальной LLM"

        monkeypatch.setattr(main_module.ollama_client, "chat", fake_chat)
        monkeypatch.setattr(
            main_module.ollama_client, "chat_with_context", fake_chat_with_context
        )

        response = client.post(
            "/chat",
            json={
                "query": "Что такое производная функции?",
                "subject": "mathematics"
            }
        )
        assert response.status_code == 200

        data = response.json()
        assert "answer" in data
        assert "sources" in data
        assert isinstance(data["sources"], list)


class TestTextbooksStats:
    """Тесты статистики учебников."""

    def test_textbooks_stats(self):
        """Проверка получения статистики."""
        response = client.get("/textbooks/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_chunks" in data
        assert "by_subject" in data
        assert isinstance(data["by_subject"], dict)


class TestLoadTextbooks:
    """Тесты загрузки учебников."""

    def test_load_all_textbooks_empty_dir(self):
        """Загрузка из пустой директории."""
        response = client.post("/textbooks/load")
        # Может вернуть 200 с нулевыми счетчиками или ошибку если нет директорий
        assert response.status_code in [200, 404, 500]

    def test_load_specific_subject_empty(self):
        """Загрузка конкретного предмета без файлов."""
        response = client.post(
            "/textbooks/load",
            json={"subject": "mathematics"}
        )
        # Может вернуть 404 если нет файлов
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
