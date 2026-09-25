# 🔌 插件系统

> 通过 `beforeTranslate / afterTranslate / onMissingKey / onLocaleChange / onError` 五个钩子定制翻译管线。

## 插件接口

```ts
import type { I18nPlugin } from '@yyc3/i18n-core/browser';

interface I18nPlugin {
  name: string;
  version?: string;

  // 翻译前：可改写键名与参数（如键名重映射）
  beforeTranslate?(key: string, params?: Record<string, string>): {
    key: string;
    params?: Record<string, string>;
  };

  // 翻译后：可改写结果（如大小写、 markup 注入）
  afterTranslate?(
    result: string,
    key: string,
    params?: Record<string, string>,
  ): string | undefined;

  // 语言切换事件
  onLocaleChange?(from: string, to: string): void;

  // 缺失键事件
  onMissingKey?(key: string, locale: string): void;

  // 翻译过程中的错误
  onError?(error: Error, context: { key: string; locale: string }): void;
}
```

所有钩子均为可选，按需实现。

## 注册插件

引擎实例的 `plugins` 属性是公开的 `PluginManager`：

```ts
import type { I18nPlugin } from '@yyc3/i18n-core/browser';

const uppercase: I18nPlugin = {
  name: 'uppercase-result',
  version: '1.0.0',
  afterTranslate(result) {
    return result.toUpperCase();
  },
};

i18n.plugins.register(uppercase);

// 查看已注册插件
i18n.plugins.getRegisteredPlugins(); // ['uppercase-result']
```

## 内置插件

### MissingKeyReporter —— 缺失键报告器

收集运行期所有缺失键，生成报告用于补译：

```ts
import { MissingKeyReporter } from '@yyc3/i18n-core/browser';

const reporter = new MissingKeyReporter({ maxEntries: 1000 });
i18n.plugins.register(reporter.createPlugin());

// 测试结束后导出
reporter.generateReport();   // 格式化文本报告
reporter.exportJSON();       // JSON（可写入文件 / 上传 CI 制品）
reporter.getMissingKeys();   // ['settings.profile.bio', ...]
reporter.getCount();
reporter.clear();
```

### PerformanceTracker —— 性能追踪器

```ts
import { PerformanceTracker } from '@yyc3/i18n-core/browser';

const tracker = new PerformanceTracker({
  slowThreshold: 10,   // 慢查询阈值（毫秒）
  maxSlowEntries: 50,
  samplingRate: 1,     // 1 = 全采样
});

i18n.plugins.register(tracker.createPlugin());

tracker.getMetrics();
tracker.getCacheHitRate();  // 0-100
tracker.getPercentile(99);  // P99 延迟（毫秒）
tracker.generateReport();
```

### createConsoleLogger —— 控制台日志

```ts
import { createConsoleLogger } from '@yyc3/i18n-core/browser';

i18n.plugins.register(
  createConsoleLogger({
    logTranslations: false,   // 记录每次翻译调用
    logLocaleChanges: true,   // 记录语言切换
    logMissingKeys: true,     // 记录缺失键
    logErrors: true,
  }),
);
```

## 执行顺序

`beforeTranslate` → 资源解析（含回退）→ `afterTranslate` → 插值/ICU 编译。
多个插件按注册顺序链式执行，前一个 `beforeTranslate` 的输出是后一个的输入。

::: tip 插件与缓存
缓存存储的是**未插值的原始模板**，`afterTranslate` 每次都会执行——适合放轻量装饰逻辑，避免在其中做昂贵计算。
:::

## 下一步

- [性能优化](/guide/performance) —— LRU 缓存调优
- [AI 翻译集成](/guide/ai-translation) —— 用插件钩子接入 AI 补译
