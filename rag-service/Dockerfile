FROM python:3.11-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копирование зависимостей
COPY requirements.txt .

# Установка Python зависимостей
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода приложения
COPY app/ ./app/
COPY data/ ./data/

# Создание директорий для данных
RUN mkdir -p /app/data/chroma_db /app/data/textbooks

# Переменные окружения
ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8000

# Экспозиция порта
EXPOSE 8000

# Запуск приложения
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
