# 🚀 Schnellstart

> **In 5 Minuten von null zur produktionsreifen i18n-Lösung** mit `@yyc3/i18n-core` — keine Laufzeitabhängigkeiten, 20,5 KB gzippt.

## Voraussetzungen

| Anforderung | Version | Hinweise |
|-------------|---------|----------|
| **Node.js** | >= 18 | LTS empfohlen |
| **TypeScript** | >= 5.3 (optional) | Typen sind enthalten |
| **Paketmanager** | npm / yarn / pnpm | pnpm empfohlen |

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

## Erste Übersetzung in 30 Sekunden

Importiere in Browser-Projekten (Vite, webpack, Next.js usw.) über den Teilpfad **`/browser`** — er enthält keine Node.js-Built-ins und lässt sich sauber bündeln.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. Übersetzungstabelle einer Sprache registrieren (synchron)
i18n.registerTranslation('de', {
  greeting: 'Hallo, {name}!',
  messages: '{count, plural, one {Sie haben # neue Nachricht} other {Sie haben # neue Nachrichten}}',
});

// 2. Sprache aktivieren (alle Abonnenten werden benachrichtigt)
await i18n.setLocale('de');

// 3. Übersetzen — die Interpolation läuft automatisch
t('greeting', { name: 'YYC³' });
// => "Hallo, YYC³!"

t('messages', { count: '3' });
// => "Sie haben 3 neue Nachrichten"
```

::: tip Einstiegspunkte
- Browser-Bundler → `@yyc3/i18n-core/browser`
- Node.js / serverseitig → `@yyc3/i18n-core`
  :::

## Parameter-Interpolation

Setze Platzhalter in geschweifte Klammern und übergebe die Werte als zweites Argument an `t()`.

```ts
i18n.registerTranslation('de', {
  welcome: 'Willkommen zurück, {name}. Sie haben {count} Artikel im Warenkorb.',
});

t('welcome', { name: 'Alice', count: '2' });
// => "Willkommen zurück, Alice. Sie haben 2 Artikel im Warenkorb."
```

Interpolationsparameter werden standardmäßig HTML-kodiert, was XSS-Einschleusung verhindert.

## Plurale mit ICU MessageFormat

Das Framework enthält einen vollständigen ICU-Compiler: Pluralregeln werden anhand der aktiven Sprache ausgewählt — ganz ohne manuelle Verzweigungen.

```ts
i18n.registerTranslation('de', {
  apples: '{count, plural, one {# Apfel} other {# Äpfel}}',
});

t('apples', { count: '1' }); // => "1 Apfel"
t('apples', { count: '5' }); // => "5 Äpfel"
```

Ebenso werden `select`, `selectordinal` sowie Zahlen-, Datums- und Zeitformatierung unterstützt.

## Reaktiver Sprachwechsel

`setLocale` ist asynchron und löst ein Änderungsereignis aus. Abonniere einmal und rendere die Oberfläche bei jedem Wechsel neu:

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('Aktive Sprache:', locale);
  renderApp(); // Renderlogik erneut ausführen
});

await i18n.setLocale('de');
await i18n.setLocale('en');

// Abonnement später beenden
unsubscribe();
```

Weitere häufige Methoden: `getLocale()`, `getTranslations(locale)`, `createNamespace(prefix)`, `setDebug(true)`, `getStats()` und `destroy()`.

## Eine unabhängige Instanz erzeugen

Der Export `i18n` ist ein gebrauchsfertiges Singleton. Für mehrere isolierte Instanzen erzeuge die Engine direkt:

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'de',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('de', { hello: 'Hallo' });
engine.t('hello'); // => "Hallo"
```

## Ressourcen

- [GitHub-Repository](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [NPM-Paket](https://www.npmjs.com/package/@yyc3/i18n-core)
- [Änderungsprotokoll](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- API-Referenz (Eintrag **API-Referenz** in der oberen Navigation)
