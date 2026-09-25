# 🚀 クイックスタート

> **5分でi18nを本番投入**。`@yyc3/i18n-core` は実行時依存ゼロ、gzip後20.5KBです。

## 前提条件

| 要件 | バージョン | 備考 |
|------|-----------|------|
| **Node.js** | >= 18 | LTS推奨 |
| **TypeScript** | >= 5.3（任意） | 型定義は同梱 |
| **パッケージマネージャ** | npm / yarn / pnpm | pnpm推奨 |

## インストール

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

## 30秒で最初の翻訳

ブラウザ向けプロジェクト（Vite、webpack、Next.js など）では **`/browser`** サブパスからインポートしてください。Node.js 組み込みモジュールを含まないため、バンドルをクリーンに保てます。

```ts
// main.ts
import { i18n, t } from '@yyc3/i18n-core/browser';

// 1. 言語の翻訳マップを登録（同期）
i18n.registerTranslation('ja', {
  greeting: 'こんにちは、{name}さん！',
  messages: '{count}件の新着メッセージがあります',
});

// 2. 言語を有効化（購読者全員に通知）
await i18n.setLocale('ja');

// 3. 翻訳 — 補間は自動
t('greeting', { name: 'YYC³' });
// => "こんにちは、YYC³さん！"

t('messages', { count: '3' });
// => "3件の新着メッセージがあります"
```

::: tip インポート入口
- ブラウザ向けバンドラー → `@yyc3/i18n-core/browser`
- Node.js / サーバーサイド → `@yyc3/i18n-core`
  :::

## パラメータ補間

プレースホルダーは中括弧で囲みます。値は `t()` の第2引数に渡します。

```ts
i18n.registerTranslation('ja', {
  welcome: 'おかえりなさい、{name}さん。カートには{count}点の商品があります。',
});

t('welcome', { name: 'アリス', count: '2' });
// => "おかえりなさい、アリスさん。カートには2点の商品があります。"
```

補間パラメータは既定でHTMLエスケープされるため、XSSインジェクションを防止します。

## ICU MessageFormat による複数表現

ICUコンパイラを内蔵しています。日本語では数量による語形変化がないため `other` のみで十分です。

```ts
i18n.registerTranslation('ja', {
  apples: 'りんごが{count}個あります',
});

t('apples', { count: '1' }); // => "りんごが1個あります"
t('apples', { count: '5' }); // => "りんごが5個あります"
```

`plural`、`select`、`selectordinal`、数値・日付・時刻フォーマットにも対応しています。

## リアクティブな言語切り替え

`setLocale` は非同期で、言語変更イベントを発火します。一度購読すれば、切り替えのたびにUIを再描画できます。

```ts
const unsubscribe = i18n.subscribe((locale) => {
  console.log('現在の言語:', locale);
  renderApp(); // 描画ロジックを再実行
});

await i18n.setLocale('ja');
await i18n.setLocale('en');

// 不要になったら購読解除
unsubscribe();
```

その他の主なメソッド: `getLocale()`、`getTranslations(locale)`、`createNamespace(prefix)`、`setDebug(true)`、`getStats()`、`destroy()`。

## 独立したインスタンスの生成

エクスポートされる `i18n` はすぐに使えるシングルトンです。複数の独立したインスタンスが必要な場合は、エンジンを直接生成します。

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  locale: 'ja',
  fallbackLocale: 'en',
  cache: { maxSize: 500, ttl: 300_000 },
  debug: false,
});

engine.registerTranslation('ja', { hello: 'こんにちは' });
engine.t('hello'); // => "こんにちは"
```

## リソース

- [GitHubリポジトリ](https://github.com/YYC-Cube/YYC3-i18n-Core)
- [NPMパッケージ](https://www.npmjs.com/package/@yyc3/i18n-core)
- [更新履歴](https://github.com/YYC-Cube/YYC3-i18n-Core/blob/main/CHANGELOG.md)
- APIリファレンス（上部ナビゲーションの **APIリファレンス** をご覧ください）
