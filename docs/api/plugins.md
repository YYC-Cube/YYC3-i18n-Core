# 🔌 插件 API

> `PluginManager`、`I18nPlugin` 接口与三个内置插件的完整参考。

## PluginManager

引擎实例的 `plugins` 属性：

```ts
import type { PluginManager, I18nPlugin } from '@yyc3/i18n-core/browser';

i18n.plugins.register(plugin as I18nPlugin);
i18n.plugins.getRegisteredPlugins(); // string[]
```

## I18nPlugin 接口

```ts
interface I18nPlugin {
  name: string;                       // 必填，注册表唯一标识
  version?: string;

  beforeTranslate?(
    key: string,
    params?: Record<string, string>,
  ): { key: string; params?: Record<string, string> };

  afterTranslate?(
    result: string,
    key: string,
    params?: Record<string, string>,
  ): string | undefined;

  onLocaleChange?(from: string, to: string): void;
  onMissingKey?(key: string, locale: string): void;
  onError?(error: Error, context: { key: string; locale: string }): void;
}
```

执行时序与多插件链式规则见[插件系统](/guide/plugins)。

## MissingKeyReporter

```ts
import { MissingKeyReporter } from '@yyc3/i18n-core/browser';

const reporter = new MissingKeyReporter({ maxEntries: 1000 });
i18n.plugins.register(reporter.createPlugin());
```

| 方法 | 返回 | 说明 |
|------|------|------|
| `generateReport()` | `string` | 格式化文本报告 |
| `exportJSON()` | `string` | JSON 导出（CI 制品友好） |
| `getMissingKeys()` | `string[]` | 全部缺失键 |
| `getCount()` | `number` | 缺失总数 |
| `clear()` | `void` | 清空记录 |

配置项：`maxEntries`（记录上限，默认 1000，超出滚动丢弃最旧记录）。

## PerformanceTracker

```ts
import { PerformanceTracker } from '@yyc3/i18n-core/browser';

const tracker = new PerformanceTracker({
  slowThreshold: 10,   // 慢查询阈值 ms
  maxSlowEntries: 50,  // 慢查询记录上限
  samplingRate: 1,     // 0-1，生产建议 0.1
});

i18n.plugins.register(tracker.createPlugin());
```

| 方法 | 返回 | 说明 |
|------|------|------|
| `getMetrics()` | `PerformanceMetrics` | 完整指标对象 |
| `getCacheHitRate()` | `number` | 命中率 0-100 |
| `getPercentile(p)` | `number` | P50 / P95 / P99 延迟（ms） |
| `generateReport()` | `string` | 格式化报告 |
| `reset()` | `void` | 归零统计 |

## createConsoleLogger

```ts
import { createConsoleLogger } from '@yyc3/i18n-core/browser';

i18n.plugins.register(
  createConsoleLogger({
    logTranslations?: boolean,  // 默认 false
    logLocaleChanges?: boolean, // 默认 false
    logMissingKeys?: boolean,   // 默认 true
    logErrors?: boolean,        // 默认 true
  }),
);
```

## 相关页

- [插件系统](/guide/plugins) —— 概念与自定义示例
- [缓存系统](/api/cache) —— tracker 观测的缓存指标口径
