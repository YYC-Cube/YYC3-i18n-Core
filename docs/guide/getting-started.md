# 🚀 快速开始

> **5 分钟上手 `@yyc3/i18n-core`** —— 从零到生产就绪的国际化方案，零运行时依赖，gzip 后仅 20.5 KB。

## 前置要求

| 要求 | 版本 | 说明 |
|------|------|------|
| **Node.js** | >= 18 | 推荐 LTS 版本 |
| **TypeScript** | >= 5.3（可选） | 类型定义随包提供 |
| **包管理器** | npm / yarn / pnpm | 推荐 pnpm |

## 安装

::: code-group

```bash [pnpm]
pnpm add @yyc3/i18n-core
```

```bash [npm]
npm install @yyc3/i18n-core
```

```bash [yarn]
yarn add @yyc3/i18n-core
```

:::

## 30 秒完成第一次翻译

在浏览器工程（Vite、webpack、Next.js 等）中，请从 **`/browser`** 子路径导入——该入口不包含 Node.js 内建模块，打包结果干净。

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. 注册某语言的翻译表（同步）
i18n.registerTranslation('zh-CN', {
  greeting: '你好，{name}！',
  messages: '你有 {count} 条新消息',
});

// 2. 激活语言（会通知所有订阅者）
await i18n.setLocale('zh-CN');

// 3. 翻译 —— 参数插值自动完成
t('greeting', { name: 'YYC³' });
// => "你好，YYC³！"

t('messages', { count: '3' });
// => "你有 3 条新消息"
```

::: tip 导入入口
- 浏览器打包器 → `@yyc3/i18n-core/browser`
- Node.js / 服务端 → `@yyc3/i18n-core`
  :::

## 参数插值

占位符用花括号包裹，值通过 `t()` 的第二个参数传入。

```ts
i18n.registerTranslation('zh-CN', {
  welcome: '欢迎回来，{name}！购物车中有 {count} 件商品。',
});

t('welcome', { name: '张三', count: '2' });
// => "欢迎回来，张三！购物车中有 2 件商品。"
```

插值参数默认会进行 HTML 转义，可防止 XSS 注入。

## ICU MessageFormat 复数规则

框架内置完整的 ICU 编译器。中文没有数量词形变化，使用 `other` 即可；而俄语、阿拉伯语等语言的 one/few/many 等规则会按当前语言自动求值，无需手写分支。

```ts
i18n.registerTranslation('en', {
  apples: '{count, plural, one {# apple} other {# apples}}',
});

t('apples', { count: '1' }); // => "1 apple"
t('apples', { count: '5' }); // => "5 apples"
```

同时支持 `select`、`selectordinal` 以及数字、日期、时间格式化。

## 响应式切换语言

`setLocale` 是异步的，并会发出语言变更事件。只需订阅一次，即可在每次切换后重新渲染界面：

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('当前语言：', locale);
  renderApp(); // 重新执行你的渲染逻辑
});

await i18n.setLocale('zh-CN');
await i18n.setLocale('en');

// 不再需要时取消订阅
unsubscribe();
```

其他常用方法：`getLocale()`、`getTranslations(locale)`、`createNamespace(prefix)`、`setDebug(true)`、`getStats()`、`destroy()`。

## 创建独立实例

导出的 `i18n` 是开箱即用的单例。如果需要多个互相隔离的实例，可以直接创建引擎：

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'zh-CN',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('zh-CN', { hello: '你好' });
engine.t('hello'); // => "你好"
```

## 资源

- [GitHub 仓库](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [NPM 包](https://www.npmjs.com/package/@yyc3/i18n-core)
- [更新日志](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- API 参考（见顶部导航的 **API 参考** 入口）
