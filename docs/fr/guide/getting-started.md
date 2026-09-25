# 🚀 Démarrage rapide

> **Passez de zéro à une solution i18n prête pour la production en 5 minutes** avec `@yyc3/i18n-core` — zéro dépendance à l’exécution, 20,5 Ko gzippé.

## Prérequis

| Condition | Version | Remarques |
|-----------|---------|-----------|
| **Node.js** | >= 18 | version LTS recommandée |
| **TypeScript** | >= 5.3 (facultatif) | les types sont inclus |
| **Gestionnaire de paquets** | npm / yarn / pnpm | pnpm recommandé |

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

## Votre première traduction en 30 secondes

Dans un projet navigateur (Vite, webpack, Next.js, etc.), importez depuis le sous-chemin **`/browser`** : il exclut les modules natifs Node.js et se compile proprement.

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. Enregistrer les traductions d’une langue (synchrone)
i18n.registerTranslation('fr', {
  greeting: 'Bonjour, {name} !',
  messages: '{count, plural, one {Vous avez # nouveau message} other {Vous avez # nouveaux messages}}',
});

// 2. Activer la langue (notifie tous les abonnés)
await i18n.setLocale('fr');

// 3. Traduire — l’interpolation est automatique
t('greeting', { name: 'YYC³' });
// => "Bonjour, YYC³ !"

t('messages', { count: '3' });
// => "Vous avez 3 nouveaux messages"
```

::: tip Points d’entrée
- Projets navigateur → `@yyc3/i18n-core/browser`
- Node.js / serveur → `@yyc3/i18n-core`
  :::

## Interpolation des paramètres

Entourez les espaces réservés d’accolades et passez les valeurs en second argument de `t()`.

```ts
i18n.registerTranslation('fr', {
  welcome: 'Bon retour, {name}. Vous avez {count} articles dans votre panier.',
});

t('welcome', { name: 'Alice', count: '2' });
// => "Bon retour, Alice. Vous avez 2 articles dans votre panier."
```

Les paramètres sont échappés HTML par défaut, ce qui prévient les injections XSS.

## Pluriels avec ICU MessageFormat

Le framework intègre un compilateur ICU complet : les règles de pluriel sont évaluées selon la langue active, sans branchement manuel.

```ts
i18n.registerTranslation('fr', {
  apples: '{count, plural, one {# pomme} other {# pommes}}',
});

t('apples', { count: '1' }); // => "1 pomme"
t('apples', { count: '5' }); // => "5 pommes"
```

`select`, `selectordinal`, ainsi que les formats de nombre, de date et d’heure sont également pris en charge.

## Changement de langue réactif

`setLocale` est asynchrone et émet un événement de changement. Abonnez-vous une seule fois pour repeindre l’interface à chaque bascule :

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('Langue active :', locale);
  renderApp(); // relancer le rendu
});

await i18n.setLocale('fr');
await i18n.setLocale('en');

// Se désabonner plus tard si besoin
unsubscribe();
```

Autres méthodes utiles : `getLocale()`, `getTranslations(locale)`, `createNamespace(prefix)`, `setDebug(true)`, `getStats()` et `destroy()`.

## Créer une instance indépendante

L’export `i18n` est un singleton prêt à l’emploi. Pour plusieurs instances isolées, instanciez directement le moteur :

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'fr',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('fr', { hello: 'Bonjour' });
engine.t('hello'); // => "Bonjour"
```

## Ressources

- [Dépôt GitHub](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [Paquet NPM](https://www.npmjs.com/package/@yyc3/i18n-core)
- [Journal des modifications](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- Référence API (entrée **Référence API** dans la navigation supérieure)
