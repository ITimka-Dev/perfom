import os
import requests
from dotenv import load_dotenv

# Принудительно грузим .env (если используется)
load_dotenv()

url = os.getenv("OLLAMA_BASE_URL")
model = os.getenv("OLLAMA_MODEL")

print(f"🔍 URL из env: {url}")
print(f"🔍 Модель из env: {model}")

# Пробуем сделать тот же запрос, что делает сервис
test_payload = {
    "model": model,
    "messages": [{"role": "user", "content": "test"}],
    "stream": False
}

try:
    print(f"🚀 Отправка POST на {url}/api/chat ...")
    response = requests.post(f"{url}/api/chat", json=test_payload, timeout=180)
    print(f"✅ Статус: {response.status_code}")
    print(f"📄 Ответ: {response.text[:200]}")
except Exception as e:
    print(f"❌ ОШИБКА: {e}")