# 🟢 Node.js 后端集成

> 根入口直连：服务端翻译、按请求语言协商与 MCP/AI 能力全开。

## 与浏览器端的区别

服务端从**根入口**导入，获得完整能力（AI 翻译、MCP 服务器、安全与基础设施模块）：

```ts
import { i18n, t } from '@yyc3/i18n-core';
```

无需担心 `node:` 内建模块问题——它们本来就是服务端的养分。

## 应用初始化

```ts
// src/i18n.ts
import { I18nEngine } from '@yyc3/i18n-core';
import { zhCN } from './locales/zh-CN';
import { en } from './locales/en';

export const engine = new I18nEngine({
  locale: 'zh-CN',
  fallbackLocale: 'en',
});

engine.registerTranslation('zh-CN', zhCN);
engine.registerTranslation('en', en);

await engine.setLocale('zh-CN');
```

## 按请求语言协商

服务端的核心模式：**每请求确定 locale → 翻译 → 响应**。用独立实例避免并发请求串语言：

```ts
import { I18nEngine } from '@yyc3/i18n-core';
import { detectSystemLocale } from '@yyc3/i18n-core';

// 语言包进程级共享，引擎按请求创建（构造轻量，缓存独立）
const bundles = new Map([
  ['zh-CN', zhCN],
  ['en', en],
]);

function createRequestEngine(locale: string): I18nEngine {
  const engine = new I18nEngine({ locale, fallbackLocale: 'en' });
  engine.registerTranslation(locale, bundles.get(locale)!);
  return engine;
}

// Express 示例
app.use((req, _res, next) => {
  const detected = detectSystemLocale(); // 环境变量/默认值多源检测
  const requested = req.headers['accept-language']?.split(',')[0];
  req.engine = createRequestEngine(requested ?? detected.locale);
  next();
});

app.get('/api/welcome', (req, res) => {
  res.json({ message: req.engine.t('welcome', { name: 'YYC³' }) });
});
```

## 语言检测工具

```ts
import {
  detectSystemLocale,
  normalizeLocale,
  isChineseLocale,
} from '@yyc3/i18n-core';

detectSystemLocale();
// => { locale: 'zh-CN', source: 'env' | 'storage' | 'system' | 'default' }

normalizeLocale('zh_cn');  // => 'zh-CN'（大小写/分隔符归一）
isChineseLocale('zh-TW');  // => true
```

## 输出错误信息本地化

```ts
app.use((err, req, res, _next) => {
  const t = req.engine.t.bind(req.engine);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: t('errors.internal'),   // 按请求语言返回
    },
  });
});
```

## 服务端专属能力

从根入口还可获得（浏览器端不可用）：

- [AI 翻译](/guide/ai-translation) —— `AIProviderManager` 批量补译任务
- [MCP 服务器](/guide/mcp-integration) —— stdio 承载 AI Agent 工具
- [安全模块](/guide/security) —— ReDoS 防护、密钥比较、限流退避
- [基础设施](/api/infrastructure) —— 结构化日志、安全随机数、JSON 文件工具

### 结构化日志示例

```ts
import { logger, setLogLevel } from '@yyc3/i18n-core';

setLogLevel(process.env.LOG_LEVEL ?? 'info');

logger.info('i18n engine ready', { locales: ['zh-CN', 'en'] });
```

## 下一步

- [MCP 协议集成](/guide/mcp-integration) —— 让 Agent 操作翻译资源
- [最佳实践](/guide/best-practices#project-structure) —— 项目结构建议
