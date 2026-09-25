# 🚀 البدء السريع

> **من الصفر إلى حل i18n جاهز للإنتاج خلال 5 دقائق** مع `@yyc3/i18n-core` — صفر تبعيات وقت التشغيل، و20.5 كيلوبايت مضغوطة.

## المتطلبات

| المتطلب | الإصدار | ملاحظات |
|---------|---------|---------|
| **Node.js** | >= 18 | يُنصح بإصدار LTS |
| **TypeScript** | >= 5.3 (اختياري) | الأنواع مرفقة مع الحزمة |
| **مدير الحزم** | npm / yarn / pnpm | يُنصح بـ pnpm |

## التثبيت

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

## ترجمتك الأولى خلال 30 ثانية

في مشاريع المتصفح (Vite وwebpack وNext.js وغيرها) استورد من المسار الفرعي **`/browser`** — فهو يستبعد وحدات Node.js المدمجة لتظل الحزمة نظيفة.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. سجّل جدول ترجمات للغة (متزامن)
i18n.registerTranslation('ar', {
  greeting: 'مرحبًا، {name}!',
  messages:
    '{count, plural, zero {لا رسائل جديدة} one {لديك رسالة جديدة} two {لديك رسالتان جديدتان} few {لديك # رسائل جديدة} many {لديك # رسالة جديدة} other {لديك # رسالة جديدة}}',
});

// 2. فعّل اللغة (يُخطَر جميع المشتركين)
await i18n.setLocale('ar');

// 3. ترجم — الاستبدال يتم تلقائيًا
t('greeting', { name: 'YYC³' });
// => "مرحبًا، YYC³!"

t('messages', { count: '3' });
// => "لديك 3 رسائل جديدة"
```

::: tip نقاط الاستيراد
- حِزم المتصفح → `@yyc3/i18n-core/browser`
- Node.js / الخادم → `@yyc3/i18n-core`
  :::

## استبدال المعاملات

ضع العناصر النائبة بين قوسين معقوفين ومرّر القيم كمعامل ثانٍ إلى `t()`.

```ts
i18n.registerTranslation('ar', {
  welcome: 'مرحبًا بعودتك، {name}! لديك {count} عناصر في سلتك.',
});

t('welcome', { name: 'أليس', count: '2' });
// => "مرحبًا بعودتك، أليس! لديك 2 عناصر في سلتك."
```

تُهرَّب معاملات الاستبدال كـ HTML افتراضيًا، مما يمنع حقن XSS.

## صيغ الجمع في ICU MessageFormat

يضم الإطار مُصرِّف ICU كاملًا: قواعد الجمع العربية بصيغها الست (zero / one / two / few / many / other) تُطبَّق تلقائيًا.

```ts
i18n.registerTranslation('ar', {
  apples:
    '{count, plural, one {تفاحة واحدة} two {تفاحتان} few {# تفاحات} many {# تفاحة} other {# تفاحة}}',
});

t('apples', { count: '0' });  // zero
t('apples', { count: '1' });  // => "تفاحة واحدة" — one
t('apples', { count: '2' });  // => "تفاحتان"      — two
t('apples', { count: '3' });  // => "3 تفاحات"      — few
t('apples', { count: '15' }); // => "15 تفاحة"      — many
```

يدعم الإطار أيضًا `select` و`selectordinal` وتنسيق الأرقام والتواريخ والأوقات.

## تبديل اللغة التفاعلي

`setLocale` غير متزامن ويُطلق حدث تغيير. اشترك مرة واحدة لإعادة رسم الواجهة عند كل تبديل:

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('اللغة النشطة:', locale);
  renderApp(); // أعد تشغيل منطق العرض
});

await i18n.setLocale('ar');
await i18n.setLocale('en');

// يمكن إلغاء الاشتراك لاحقًا
unsubscribe();
```

من الطرق الشائعة الأخرى: `getLocale()` و`getTranslations(locale)` و`createNamespace(prefix)` و`setDebug(true)` و`getStats()` و`destroy()`.

## إنشاء نسخة مستقلة

الكائن المُصدَّر `i18n` هو نسخة وحيدة جاهزة للاستخدام. لإنشاء عدة نسخ معزولة، أنشئ المحرك مباشرة:

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'ar',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('ar', { hello: 'مرحبًا' });
engine.t('hello'); // => "مرحبًا"
```

## الموارد

- [مستودع GitHub](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [حزمة NPM](https://www.npmjs.com/package/@yyc3/i18n-core)
- [سجل التغييرات](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- مرجع API (عبر عنصر **مرجع API** في شريط التنقل العلوي)
