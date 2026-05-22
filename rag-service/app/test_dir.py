import requests
import json

url = "http://127.0.0.1:11434/api/chat"
payload = {
    "model": "qwen2.5-3b-instruct-q4km:latest",
    "messages": [{"role": "user", "content": "Привет"}],
    "stream": False,
    "options": {
        "num_ctx": 2048  # Попробуем уменьшить контекст
    }
}

print("Отправка запроса...")
try:
    # Таймаут увеличен до 60 сек
    response = requests.post(url, json=payload, timeout=60)
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
except requests.exceptions.Timeout:
    print("ТАЙМАУТ: Сервер не ответил за 60 сек")
except Exception as e:
    print(f"ОШИБКА: {e}")