import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiChatRequest {
  query: string;
  subject?: string;
  user_id?: string;
}

export interface AiChatResponse {
  answer: string;
  sources: Array<Record<string, unknown>>;
  subject?: string | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ragUrl: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.ragUrl = this.config.get<string>('RAG_SERVICE_URL', 'http://rag-service:8000');
    this.timeoutMs = Number(this.config.get<string>('RAG_TIMEOUT_MS', '120000'));
  }

  async chat(payload: AiChatRequest): Promise<AiChatResponse> {
    const url = `${this.ragUrl}/chat`;
    this.logger.log(`Proxy chat -> ${url} (subject=${payload.subject ?? 'none'})`);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.error(`RAG ${res.status}: ${text}`);
        throw new ServiceUnavailableException(`RAG service error: ${res.status}`);
      }

      return (await res.json()) as AiChatResponse;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new ServiceUnavailableException('RAG service timeout');
      }
      this.logger.error(`RAG request failed: ${err?.message ?? err}`);
      throw new ServiceUnavailableException('RAG service unavailable');
    } finally {
      clearTimeout(timer);
    }
  }

  async health(): Promise<unknown> {
    try {
      const res = await fetch(`${this.ragUrl}/health`, { method: 'GET' });
      if (!res.ok) return { status: 'down', code: res.status };
      return await res.json();
    } catch (err: any) {
      return { status: 'down', error: err?.message ?? String(err) };
    }
  }

  async stats(): Promise<unknown> {
    const res = await fetch(`${this.ragUrl}/textbooks/stats`);
    if (!res.ok) throw new ServiceUnavailableException('RAG stats unavailable');
    return await res.json();
  }
}
