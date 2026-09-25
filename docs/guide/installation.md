# 📦 安装与配置

> 支持全部主流包管理器，零运行时依赖，安装即用。

## 环境要求

| 要求 | 版本 | 说明 |
| ------ | ------ | ------ |
| **Node.js** | >= 18 | 推荐 LTS 版本（服务端/MCP/AI 功能） |
| **TypeScript** | >= 5.3（可选） | 类型定义随包附带，开箱即用 |
| **React**（可选） | >= 18 | 仅在使用 `@yyc3/i18n-react` 绑定时需要 |

## 安装

::: code-group

```bash [pnpm（推荐）]
pnpm add @yyc3/i18n-core
```

```bash [npm]
npm install @yyc3/i18n-core
```

```bash [yarn]
yarn add @yyc3/i18n-core
```

:::

### React 项目

React 绑定作为独立包发布，按需安装：

::: code-group

```bash [pnpm]
pnpm add @yyc3/i18n-react
```

```bash [npm]
npm install @yyc3/i18n-react
```

:::

`@yyc3/i18n-react` 以 peerDependencies 声明 `@yyc3/i18n-core >= 2.4.0` 与 `react >= 18`，安装时请确保两者就位。

## 双入口设计

`@yyc3/i18n-core` 提供两个入口，按运行环境选择：

| 入口 | 导入路径 | 适用环境 | 包含能力 |
|------|----------|----------|----------|
| 浏览器入口 | `@yyc3/i18n-core/browser` | Vite / webpack / Next.js 客户端 | 引擎、缓存、插件、ICU、RTL、格式化、语言检测 |
| 根入口 | `@yyc3/i18n-core` | Node.js / 服务端 / 脚本 | 上述全部 + AI 翻译、MCP 服务器、安全模块、基础设施 |

::: warning 浏览器端务必使用 /browser 子路径
根入口包含 MCP/AI/CLI 等依赖 `node:fs`、`node:path`、`node:crypto`、`node:timers` 的模块。浏览器打包器会将它们 externalize，导致构建失败。浏览器项目请始终：

```ts
// ✅ 浏览器端
import { i18n, t } from '@yyc3/i18n-core/browser';

// ❌ 浏览器端（打包失败）
import { i18n, t } from '@yyc3/i18n-core';
```

:::

## TypeScript 支持

类型定义随包发布，无需安装 `@types`：

```ts
import type {
  I18nEngineConfig,
  Locale,
  TranslationMap,
  TextDirection,
} from '@yyc3/i18n-core/browser';

const supported: Locale[] = ['zh-CN', 'en', 'ja', 'ko', 'ar'];
```

内置语言类型为 10 种：`en`、`zh-CN`、`zh-TW`、`ja`、`ko`、`fr`、`de`、`es`、`pt-BR`、`ar`。可用 `isSupportedLocale()` 在运行时校验：

```ts
import { isSupportedLocale, SUPPORTED_LOCALES } from '@yyc3/i18n-core/browser';

isSupportedLocale('zh-CN');      // true
console.log(SUPPORTED_LOCALES); // 全部 10 种内置语言
```

## 环境变量参考

服务端 AI 翻译能力通过环境变量提供密钥，**切勿硬编码**：

| 变量 | 用途 |
|------|------|
| `OPENAI_API_KEY` | OpenAI 翻译提供者鉴权 |
| `OLLAMA_BASE_URL` | Ollama 本地模型地址（默认 `http://localhost:11434`） |

## 下一步

- [快速开始](/guide/getting-started) —— 30 秒完成第一次翻译
- [基础用法](/guide/basic-usage) —— 引擎全方法与配置项详解
