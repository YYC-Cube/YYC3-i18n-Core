# 🚀 Быстрый старт

> **От нуля до готового к продакшену i18n за 5 минут** с `@yyc3/i18n-core` — ноль зависимостей в рантайме, 20,5 КБ в gzip.

## Требования

| Требование | Версия | Примечания |
|------------|--------|------------|
| **Node.js** | >= 18 | рекомендуется LTS |
| **TypeScript** | >= 5.3 (необязательно) | типы поставляются в пакете |
| **Менеджер пакетов** | npm / yarn / pnpm | рекомендуется pnpm |

## Установка

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

## Первый перевод за 30 секунд

В браузерном проекте (Vite, webpack, Next.js и т. д.) импортируйте из подпути **`/browser`** — в нём нет встроенных модулей Node.js, поэтому сборка остаётся чистой.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. Регистрируем таблицу переводов для языка (синхронно)
i18n.registerTranslation('ru', {
  greeting: 'Привет, {name}!',
  messages:
    '{count, plural, one {У вас # новое сообщение} few {У вас # новых сообщения} many {У вас # новых сообщений} other {У вас # нового сообщения}}',
});

// 2. Включаем язык (уведомляет всех подписчиков)
await i18n.setLocale('ru');

// 3. Переводим — подстановка выполняется автоматически
t('greeting', { name: 'YYC³' });
// => "Привет, YYC³!"

t('messages', { count: '3' });
// => "У вас 3 новых сообщения"
```

::: tip Точки входа
- Браузерные сборщики → `@yyc3/i18n-core/browser`
- Node.js / сервер → `@yyc3/i18n-core`
  :::

## Подстановка параметров

Оберните плейсхолдеры в фигурные скобки и передайте значения вторым аргументом в `t()`.

```ts
i18n.registerTranslation('ru', {
  welcome: 'С возвращением, {name}! В корзине {count} товара.',
});

t('welcome', { name: 'Алиса', count: '2' });
// => "С возвращением, Алиса! В корзине 2 товара."
```

Параметры по умолчанию экранируются как HTML, что защищает от XSS-инъекций.

## Множественное число в ICU MessageFormat

Фреймворк содержит полный компилятор ICU: правила склонения (one / few / many / other) применяются автоматически для русского языка.

```ts
i18n.registerTranslation('ru', {
  apples:
    '{count, plural, one {# яблоко} few {# яблока} many {# яблок} other {# яблока}}',
});

t('apples', { count: '1' }); // => "1 яблоко"  — one
t('apples', { count: '3' }); // => "3 яблока"  — few
t('apples', { count: '5' }); // => "5 яблок"   — many
```

Также поддерживаются `select`, `selectordinal`, форматы чисел, дат и времени.

## Реактивное переключение языка

`setLocale` асинхронен и генерирует событие изменения. Подпишитесь один раз, чтобы перерисовывать интерфейс при каждом переключении:

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('Активный язык:', locale);
  renderApp(); // повторно запускаем отрисовку
});

await i18n.setLocale('ru');
await i18n.setLocale('en');

// Позже можно отписаться
unsubscribe();
```

Другие часто используемые методы: `getLocale()`, `getTranslations(locale)`, `createNamespace(prefix)`, `setDebug(true)`, `getStats()` и `destroy()`.

## Создание независимого экземпляра

Экспортируемый `i18n` — это готовый синглтон. Для нескольких изолированных экземпляров создайте движок напрямую:

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'ru',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('ru', { hello: 'Привет' });
engine.t('hello'); // => "Привет"
```

## Ресурсы

- [Репозиторий на GitHub](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [Пакет NPM](https://www.npmjs.com/package/@yyc3/i18n-core)
- [Журнал изменений](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- Справочник API (пункт **Справочник API** в верхней навигации)
