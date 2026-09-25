# 📐 类型定义

> 全部类型随包发布，无需 `@types`。此处为核心类型速查。

## 语言与文本类型

```ts
// 内置 10 种语言
type Locale =
  | 'en'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja'
  | 'ko'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt-BR'
  | 'ar';

// RTL 语言子集（目前为阿拉伯语）
type RTLLocale = Extract<Locale, 'ar'>;

// 文本方向
type TextDirection = 'ltr' | 'rtl' | 'auto';

// 水平对齐（RTL 感知）
type HorizontalAlignment = 'left' | 'right';

// 可翻转的间距物理属性
type SpacingProperty =
  | 'marginLeft'
  | 'marginRight'
  | 'paddingLeft'
  | 'paddingRight';
```

## 翻译资源

```ts
// 嵌套键值结构，键名即命名空间路径
type TranslationMap = {
  [key: string]: string | TranslationMap;
};
```

## 引擎配置

```ts
interface I18nEngineConfig {
  locale?: Locale;                 // 初始语言
  fallbackLocale?: Locale;         // 回退语言
  cache?: {
    maxSize?: number;              // 默认 1000
    ttl?: number;                  // 默认 5 分钟（毫秒）
  };
  debug?: boolean;                 // 默认 false
  onError?: (error: Error, context: { key: string; locale: Locale }) => void;
  missingKeyHandler?: (key: string, locale: Locale) => string;
}
```

## 插值参数

```ts
// formatter 模块导出的参数类型
type TranslateParams = Record<string, string>;
```

## 语言检测结果

```ts
interface LocaleDetectionResult {
  locale: Locale;
  source: 'system' | 'storage' | 'env' | 'default';
}
```

## 缓存类型

```ts
interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;   // 毫秒
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  // …详见缓存系统页
}
```

## ICU 类型族

```ts
// AST 节点联合
type ICUNode =
  | ICULiteral          // 字面文本
  | ICUArgument         // {name} 参数
  | ICUPlural           // {n, plural, …}
  | ICUSelect           // {g, select, …}
  | ICUSelectOrdinal    // {n, selectordinal, …}
  | ICUNumber
  | ICUDate
  | ICUTime;

interface ICUParseResult {
  ast: ICUNode[];
  errors: ICUParseError[];
}

interface ICUCompileContext {
  locale: string;
  params: Record<string, string>;
}
```

完整字段见 `@yyc3/i18n-core` 包内 `dist` 类型声明。

## AI 类型族

```ts
type AIProviderType = 'openai' | 'ollama';

interface AIProviderConfig { /* apiKey/model/baseUrl 等 */ }

interface TranslationRequest {
  sourceText: string;
  sourceLocale: string;
  targetLocale: string;
  context?: string;
  glossary?: Record<string, string>;
  style?: 'formal' | 'informal' | 'technical';
}

interface TranslationResponse {
  translatedText: string;
  qualityScore: number;
  provider: AIProviderType;
  model: string;
  cached: boolean;
}
```

## MCP 类型族

```ts
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

type ToolHandler = (args: Record<string, unknown>) => Promise<MCPToolResult>;

// 另有：MCPServerConfig / MCPServerInfo / MCPServerCapabilities /
//       MCPMessage / MCPResource / MCPTransport
```

## 运行时校验

```ts
import { isSupportedLocale, SUPPORTED_LOCALES } from '@yyc3/i18n-core/browser';

isSupportedLocale('zh-CN'); // true（运行时守卫，配合 TS 收窄）
```

## 相关页

- [缓存系统](/api/cache) —— `CacheConfig` / `CacheStats` 行为细节
- [插件 API](/api/plugins) —— `I18nPlugin` / `I18nContext`
