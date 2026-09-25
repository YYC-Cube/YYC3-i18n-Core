# 🤖 AI 翻译集成

> LLM 驱动的翻译层：OpenAI + Ollama 双引擎、质量评分、术语表与批量翻译。

## 架构

AI 层由三个角色组成，均在根入口导出（**服务端专用**，浏览器请勿引入）：

| 角色 | 类 | 职责 |
|------|-----|------|
| 管理器 | `AIProviderManager` | 注册/选择提供者，执行与批量翻译 |
| 提供者 | `OpenAIProvider` / `OllamaProvider` | 云端 GPT 与本地模型的适配实现 |
| 评估器 | `QualityEstimator` | 基于规则的译文质量评分 |

## 快速上手

```ts
import {
  AIProviderManager,
  OpenAIProvider,
} from '@yyc3/i18n-core';

const ai = new AIProviderManager({
  preferLocal: true,   // 优先本地模型（省成本、低延迟）
  autoDetect: true,    // 自动探测可用提供者
});

// 注册云端提供者（密钥走环境变量，勿硬编码）
ai.register(new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
}));

const result = await ai.translate({
  sourceText: 'Hello World',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
  context: 'Greeting message',   // 上下文提示
  style: 'formal',               // formal | informal | technical
});

console.log(result.translatedText); // => "你好世界"
console.log(result.qualityScore);   // 0-1 质量评分
console.log(result.provider);       // 'openai'
console.log(result.model);
console.log(result.cached);         // 是否命中缓存
```

## 本地模型（Ollama）

```ts
import { OllamaProvider } from '@yyc3/i18n-core';

ai.register(new OllamaProvider({
  baseUrl: 'http://localhost:11434',
  model: 'qwen2.5:7b', // 任意支持目标语言的模型
}));
```

`preferLocal: true` 时管理器优先路由到 Ollama，不可用再回落云端。

## 请求与响应契约

```ts
interface TranslationRequest {
  sourceText: string;
  sourceLocale: string;
  targetLocale: string;
  context?: string;                     // 业务上下文，提升译文准确性
  glossary?: Record<string, string>;    // 术语表：源词 → 译文
  style?: 'formal' | 'informal' | 'technical';
}

interface TranslationResponse {
  translatedText: string;
  qualityScore: number;      // 0-1
  provider: AIProviderType;
  model: string;
  cached: boolean;
}
```

## 批量翻译

```ts
const results = await ai.batchTranslate([
  { sourceText: 'Submit', sourceLocale: 'en', targetLocale: 'zh-CN' },
  { sourceText: 'Cancel', sourceLocale: 'en', targetLocale: 'zh-CN' },
  { sourceText: 'Save',   sourceLocale: 'en', targetLocale: 'zh-CN' },
]);
```

## 质量评估

`QualityEstimator` 基于规则对译文打分，可独立于翻译流程使用（如 CI 校验人工/AI 译文）：

```ts
import { QualityEstimator } from '@yyc3/i18n-core';

const qe = new QualityEstimator();

const result = qe.evaluate({
  sourceText: 'Hello World',
  translatedText: '你好世界',
  sourceLocale: 'en',
  targetLocale: 'zh-CN',
});

console.log(result.score);       // 0.92
console.log(result.isReliable);  // 是否达到可信阈值
console.log(result.issues);      // 具体问题列表（QEResult/QEIssue）
```

评估规则（`QERule`）与严重级别（`QESeverity`）类型均已导出，可扩展自定义校验。

## 实践建议

::: tip 人审阈值
以 `qualityScore < 0.8` 作为人工复核线：AI 译文先落草稿表，评分达标才合入正式语言包；`issues` 中的高严重级问题（`QESeverity`）强制人审。
:::

- **密钥安全**：只在服务端使用，经环境变量注入；参见[安全防护](/guide/security)的常量时间比较与限流设施
- **成本控制**：`preferLocal + autoDetect` 组合让批量任务优先走本地 Ollama
- **流水线衔接**：批量结果可直接经 `registerTranslation` 热注册，配合 [MissingKeyReporter](/guide/plugins) 输出的缺失键清单形成"发现缺失 → AI 补译 → 质量评分 → 人审合并"闭环

## 下一步

- [MCP 协议集成](/guide/mcp-integration) —— 让 AI Agent 直接操作翻译资源
- [最佳实践](/guide/best-practices#translation-workflow) —— 翻译管理流程
