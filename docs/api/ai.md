# 🤖 AI 翻译 API

> `AIProviderManager`、提供者与质量评估器参考。服务端专用（根入口导出）。

## AIProviderManager

```ts
import { AIProviderManager } from '@yyc3/i18n-core';

const ai = new AIProviderManager({
  preferLocal: true,  // 优先本地提供者
  autoDetect: true,   // 自动探测可用提供者
});
```

### 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `register` | `register(provider: AIProvider)` | 注册提供者 |
| `translate` | `async translate(req: TranslationRequest) => TranslationResponse` | 单条翻译 |
| `batchTranslate` | `async batchTranslate(reqs: TranslationRequest[]) => TranslationResponse[]` | 批量翻译 |
| `autoDetect` | `async autoDetect() => AIProviderInfo[]` | 探测可用提供者 |

## 请求 / 响应

```ts
interface TranslationRequest {
  sourceText: string;
  sourceLocale: string;
  targetLocale: string;
  context?: string;                    // 业务上下文
  glossary?: Record<string, string>;   // 术语表
  style?: 'formal' | 'informal' | 'technical';
}

interface TranslationResponse {
  translatedText: string;
  qualityScore: number;   // 0-1
  provider: AIProviderType;
  model: string;
  cached: boolean;
}
```

## OpenAIProvider

```ts
import { OpenAIProvider } from '@yyc3/i18n-core';

const openai = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',        // 或 'gpt-3.5-turbo'
});

ai.register(openai);
```

## OllamaProvider

```ts
import { OllamaProvider } from '@yyc3/i18n-core';

const ollama = new OllamaProvider({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:7b',
});

ai.register(ollama);
```

`preferLocal: true` 时管理器优先路由 Ollama，失败回落云端提供者。

## QualityEstimator

```ts
import { QualityEstimator } from '@yyc3/i18n-core';

const qe = new QualityEstimator();

const result = qe.evaluate({
  sourceText: 'Hello World',
  translatedText: '你好世界',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
});

result.score;       // number，0-1
result.isReliable;  // boolean
result.issues;      // QEIssue[]（问题明细）
```

相关类型：`QEContext`（评估上下文）、`QERule`（评估规则）、`QESeverity`（严重级别）。

## 密钥与安全

- 密钥仅经环境变量注入，禁止硬编码入仓
- 对外呼建议叠加限流与退避：[`createFixedWindowRateLimiter`](/api/infrastructure) + `createRetryRunner`

## 相关页

- [AI 翻译集成](/guide/ai-translation) —— 端到端工作流
- [MCP 服务器 API](/api/mcp) —— Agent 侧工具化
