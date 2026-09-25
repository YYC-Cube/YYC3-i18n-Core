# 🧱 基础用法

> 引擎全方法速览：注册、切换、插值、订阅、命名空间与生命周期。

## 两种使用方式

### 方式一：全局单例（推荐大多数应用）

```ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 注册语言资源（同步）
i18n.registerTranslation('zh-CN', {
  greeting: '你好，{name}！',
});

// 激活语言（异步，通知所有订阅者）
await i18n.setLocale('zh-CN');

// 翻译
t('greeting', { name: '世界' }); // => "你好，世界！"
```

### 方式二：独立实例（多租户 / 隔离场景）

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'zh-CN',
  fallbackLocale: 'en',
});
```

## 引擎配置项

`I18nEngineConfig` 完整字段（全部可选）：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `locale` | `Locale` | 内置默认 | 初始语言 |
| `fallbackLocale` | `Locale` | — | 键缺失时的回退语言 |
| `cache.maxSize` | `number` | `1000` | LRU 缓存最大条目数 |
| `cache.ttl` | `number` | `300000` | 缓存过期时间（毫秒） |
| `debug` | `boolean` | `false` | 调试模式（输出日志、挂载 `__i18n_debug__`） |
| `onError` | `(error, context) => void` | — | 错误回调，context 含 `key` 与 `locale` |
| `missingKeyHandler` | `(key, locale) => string` | — | 缺失键兜底，返回值作为翻译结果 |

## 方法总览

| 方法 | 签名 | 说明 |
|------|------|------|
| `t` | `t(key, params?) => string` | 核心翻译方法，支持插值与 ICU |
| `setLocale` | `async setLocale(locale)` | 切换语言并广播事件 |
| `getLocale` | `getLocale() => Locale` | 读取当前语言 |
| `registerTranslation` | `registerTranslation(locale, map)` | 同步注册语言资源（覆盖同名键并清缓存） |
| `getTranslations` | `getTranslations(locale) => TranslationMap \| undefined` | 读取某语言已注册资源 |
| `subscribe` | `subscribe(cb) => unsubscribe` | 订阅语言变更，返回退订函数 |
| `batchTranslate` | `batchTranslate(keys, params?) => Record<string, string>` | 批量翻译 |
| `createNamespace` | `createNamespace(prefix)` | 创建命名空间翻译器 |
| `setDebug` | `setDebug(enabled)` | 运行时开关调试模式 |
| `getStats` | `getStats()` | 引擎统计（语言、缓存、插件、订阅数） |
| `destroy` | `async destroy()` | 销毁实例、清理缓存与调试挂载 |

## 插值与转义

占位符使用花括号 `{name}`，参数默认 HTML 转义，天然防 XSS：

```ts
i18n.registerTranslation('zh-CN', {
  welcome: '欢迎回来，{name}！购物车中有 {count} 件商品。',
});

t('welcome', { name: '张三', count: '2' });
// => "欢迎回来，张三！购物车中有 2 件商品。"
```

`<script>` 之类的值会被转义为无害文本，详见[安全防护](/guide/security)。

## 响应式切换

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('语言已切换：', locale);
  renderApp();
});

await i18n.setLocale('en');
await i18n.setLocale('zh-CN');

unsubscribe(); // 组件卸载时退订
```

## 缺失键策略

三级兜底，按优先级生效：

1. 插件 `onMissingKey`（见[插件系统](/guide/plugins)）
2. 引擎配置 `missingKeyHandler`
3. 返回键名本身（调试模式下输出警告日志）

```ts
const engine = new I18nEngine({
  missingKeyHandler: (key, locale) => `[缺译:${locale}]${key}`,
});
```

## 引擎统计

```ts
const stats = i18n.getStats();
console.log(stats);
// {
//   locale: 'zh-CN',
//   cache: { size, maxSize, hits, misses, hitRate, ... },
//   plugins: ['console-logger', ...],
//   subscriberCount: 2,
//   loadedLocales: ['zh-CN', 'en'],
// }
```

## 生命周期与销毁

SPA 中引擎常驻全局无需销毁；微前端 / 测试场景结束时显式清理：

```ts
await engine.destroy(); // 清空缓存、移除调试挂载、断开插件
```

## 下一步

- [命名空间管理](/guide/namespaces) —— 大型应用的键组织
- [ICU MessageFormat](/guide/icu-messageformat) —— 复数、选择与格式化
