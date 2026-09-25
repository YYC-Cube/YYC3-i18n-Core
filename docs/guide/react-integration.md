# ⚛️ React 集成

> 官方绑定 `@yyc3/i18n-react`：`useTranslation` Hook、`<Trans>` 组件与 Next.js App Router 中间件。

## 安装

::: code-group

```bash [pnpm]
pnpm add @yyc3/i18n-react @yyc3/i18n-core
```

```bash [npm]
npm install @yyc3/i18n-react @yyc3/i18n-core
```

:::

要求 `react >= 18`、`@yyc3/i18n-core >= 2.4.0`（peerDependencies）。

## Provider 与 Hook

```tsx
// i18n.ts —— 应用入口初始化
import { I18nEngine } from '@yyc3/i18n-core/browser';

export const engine = new I18nEngine({ locale: 'zh-CN', fallbackLocale: 'en' });

engine.registerTranslation('zh-CN', {
  greeting: '你好，{name}！',
  items: '{count, plural, other {# 个项目}}',
});
```

```tsx
// App.tsx
import { I18nProvider, useTranslation } from '@yyc3/i18n-react';
import { engine } from './i18n';

function Greeting() {
  const { t, locale, setLocale, ready } = useTranslation();

  if (!ready) return null;

  return (
    <div>
      <p>{t('greeting', { name: 'YYC³' })}</p>
      <p>{t('items', { count: '3' })}</p>
      <button onClick={() => setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')}>
        切换语言（当前：{locale}）
      </button>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider engine={engine}>
      <Greeting />
    </I18nProvider>
  );
}
```

`useTranslation()` 返回：

| 字段 | 类型 | 说明 |
|------|------|------|
| `t` | `(key, params?) => string` | 翻译函数（`useCallback` 稳定引用） |
| `locale` | `Locale` | 当前语言（随引擎切换自动重渲染） |
| `setLocale` | `(locale) => Promise<void>` | 切换语言 |
| `ready` | `boolean` | 引擎就绪标记 |
| `engine` | `I18nEngine` | 底层引擎实例（高级用法） |

## `<Trans>` 组件：译文嵌 JSX

译文含富文本标记时，用占位标签注入 React 组件，支持数字（`<0>`）与命名（`<link>`）两种形式：

```tsx
import { Trans } from '@yyc3/i18n-react';

// 语言包：'docs.read': '阅读 <link>文档</link> 了解 {version} 新特性'
<Trans
  id="docs.read"
  values={{ version: '2.0' }}
  components={{ link: <a href="/docs" /> }}
/>
// 渲染：阅读 <a href="/docs">文档</a> 了解 2.0 新特性
```

键缺失时渲染 `fallback`，未提供则渲染键名本身。

## Next.js App Router

子路径 `/next` 提供中间件与服务端工具：

### 语言检测中间件

```ts
// middleware.ts
import { createI18nMiddleware } from '@yyc3/i18n-react/next';

export const middleware = createI18nMiddleware({ defaultLocale: 'zh-CN' });
```

检测优先级：**URL 前缀**（`/en/about`）→ **cookie**（`yyc3-locale`）→ **Accept-Language**（含基础语言回退，如 `zh` → `zh-CN`）→ 默认语言。

### Server Components

```ts
// app/[locale]/layout.tsx
import { createServerEngine } from '@yyc3/i18n-react/next';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const engine = await createServerEngine(locale as Locale);
  return <I18nProvider engine={engine}>{children}</I18nProvider>;
}
```

`DEFAULT_LOCALES` 导出全部 10 种内置语言，可通过 `locales` 配置项裁剪。

## 下一步

- [基础用法](/guide/basic-usage) —— 引擎层完整 API
- [最佳实践](/guide/best-practices#performance-optimization) —— 渲染性能策略
