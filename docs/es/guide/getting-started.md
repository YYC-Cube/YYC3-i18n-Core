# 🚀 Inicio rápido

> **Pasa de cero a una solución i18n lista para producción en 5 minutos** con `@yyc3/i18n-core` — cero dependencias en tiempo de ejecución, 20,5 KB gzipped.

## Requisitos previos

| Requisito | Versión | Notas |
|-----------|---------|-------|
| **Node.js** | >= 18 | se recomienda LTS |
| **TypeScript** | >= 5.3 (opcional) | los tipos se incluyen en el paquete |
| **Gestor de paquetes** | npm / yarn / pnpm | se recomienda pnpm |

## Instalación

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

## Tu primera traducción en 30 segundos

En un proyecto de navegador (Vite, webpack, Next.js, etc.) importa desde la subruta **`/browser`**: excluye los módulos integrados de Node.js y se empaqueta sin problemas.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. Registra la tabla de traducciones de un idioma (síncrono)
i18n.registerTranslation('es', {
  greeting: '¡Hola, {name}!',
  messages: '{count, plural, one {Tienes # mensaje nuevo} other {Tienes # mensajes nuevos}}',
});

// 2. Activa el idioma (notifica a todos los suscriptores)
await i18n.setLocale('es');

// 3. Traduce — la interpolación es automática
t('greeting', { name: 'YYC³' });
// => "¡Hola, YYC³!"

t('messages', { count: '3' });
// => "Tienes 3 mensajes nuevos"
```

::: tip Puntos de entrada
- Empaquetadores de navegador → `@yyc3/i18n-core/browser`
- Node.js / servidor → `@yyc3/i18n-core`
  :::

## Interpolación de parámetros

Envuelve los marcadores entre llaves y pasa los valores como segundo argumento de `t()`.

```ts
i18n.registerTranslation('es', {
  welcome: 'Bienvenido de nuevo, {name}. Tienes {count} artículos en tu carrito.',
});

t('welcome', { name: 'Alice', count: '2' });
// => "Bienvenido de nuevo, Alice. Tienes 2 artículos en tu carrito."
```

Los parámetros de interpolación se escapan como HTML por defecto, lo que evita la inyección XSS.

## Plurales con ICU MessageFormat

El framework incluye un compilador ICU completo: las reglas de plural se evalúan según el idioma activo, sin bifurcaciones manuales.

```ts
i18n.registerTranslation('es', {
  apples: '{count, plural, one {# manzana} other {# manzanas}}',
});

t('apples', { count: '1' }); // => "1 manzana"
t('apples', { count: '5' }); // => "5 manzanas"
```

También admite `select`, `selectordinal` y formatos de número, fecha y hora.

## Cambio de idioma reactivo

`setLocale` es asíncrono y emite un evento de cambio. Suscríbete una vez y vuelve a renderizar la interfaz en cada cambio:

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('Idioma activo:', locale);
  renderApp(); // vuelve a ejecutar el renderizado
});

await i18n.setLocale('es');
await i18n.setLocale('en');

// Cancela la suscripción más adelante si hace falta
unsubscribe();
```

Otros métodos frecuentes: `getLocale()`, `getTranslations(locale)`, `createNamespace(prefix)`, `setDebug(true)`, `getStats()` y `destroy()`.

## Crear una instancia independiente

El objeto exportado `i18n` es un singleton listo para usar. Si necesitas varias instancias aisladas, crea el motor directamente:

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'es',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('es', { hello: 'Hola' });
engine.t('hello'); // => "Hola"
```

## Recursos

- [Repositorio de GitHub](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [Paquete en NPM](https://www.npmjs.com/package/@yyc3/i18n-core)
- [Registro de cambios](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- Referencia de API (entrada **Referencia de API** en la navegación superior)
