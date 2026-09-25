# 🚀 Quick Start

> **Go from zero to production-ready i18n in 5 minutes** with `@yyc3/i18n-core` — zero runtime dependencies, 20.5 KB gzipped.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | >= 18 | LTS recommended |
| **TypeScript** | >= 5.3 (optional) | Types are shipped with the package |
| **Package manager** | npm / yarn / pnpm | pnpm recommended |

## Installation

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

## Your first translation in 30 seconds

In a browser project (Vite, webpack, Next.js, etc.) import from the **`/browser`** subpath — it excludes Node.js built-ins and bundles cleanly.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. Register a translation table for a locale (synchronous)
i18n.registerTranslation('en', {
  greeting: 'Hello, {name}!',
  messages: '{count, plural, one {You have # new message} other {You have # new messages}}',
});

// 2. Activate the locale (notifies all subscribers)
await i18n.setLocale('en');

// 3. Translate — interpolation is automatic
t('greeting', { name: 'YYC³' });
// => "Hello, YYC³!"

t('messages', { count: '3' });
// => "You have 3 new messages"
```

::: tip Import entry points
- Browser bundlers → `@yyc3/i18n-core/browser`
- Node.js / server-side → `@yyc3/i18n-core`
  :::

## Parameter interpolation

Wrap placeholders in curly braces. Pass values as the second argument of `t()`.

```ts
i18n.registerTranslation('en', {
  welcome: 'Welcome back, {name}. You have {count} items in your cart.',
});

t('welcome', { name: 'Alice', count: '2' });
// => "Welcome back, Alice. You have 2 items in your cart."
```

Interpolation parameters are HTML-escaped by default, which prevents XSS injection.

## Plurals with ICU MessageFormat

The framework ships a complete ICU compiler — plural rules are evaluated against the active locale, no manual branching needed.

```ts
i18n.registerTranslation('en', {
  apples: '{count, plural, one {# apple} other {# apples}}',
});

t('apples', { count: '1' }); // => "1 apple"
t('apples', { count: '5' }); // => "5 apples"
```

`select`, `selectordinal`, number, date and time formats are supported as well.

## Switching locale reactively

`setLocale` is asynchronous (it resolves any lazy resources) and emits a change event. Subscribe once and re-render your UI on every switch:

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('Active locale:', locale);
  renderApp(); // re-run your render logic
});

await i18n.setLocale('en');
await i18n.setLocale('fr');

// Unsubscribe later if needed
unsubscribe();
```

Other commonly used methods: `getLocale()`, `getTranslations(locale)`, `createNamespace(prefix)`, `setDebug(true)`, `getStats()` and `destroy()`.

## Creating an independent instance

The exported `i18n` is a ready-made singleton. For multiple isolated instances, construct the engine directly:

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'en',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('en', { hello: 'Hello' });
engine.t('hello'); // => "Hello"
```

## Resources

- [GitHub repository](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [NPM package](https://www.npmjs.com/package/@yyc3/i18n-core)
- [Changelog](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- API reference (see the **API Reference** entry in the top navigation)
