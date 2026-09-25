---
layout: home

hero:
  name: '@yyc3/i18n-core'
  text: AIネイティブ i18nフレームワーク
  tagline: ゼロ依存 · AI翻訳 · MCPプロトコル · ICUコンパイラ · 10言語 · OWASP L4
  image:
    src: /Family-001.png
    alt: YYC³ファミリー
  actions:
    - theme: brand
      text: クイックスタート
      link: /ja/guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/YYC-Cube/YYC3-i18n-Core

features:
  - icon: 🤖
    title: AI翻訳のネイティブ統合
    details: OpenAI + Ollamaのデュアルエンジン、ワンコマンドの一括翻訳、品質スコアリング、コンテキスト認識。開発者の73%がすでにLLM翻訳を活用しています。
  - icon: 🔌
    title: MCPプロトコルサーバー
    details: 業界初のi18n MCP Server。7つのツールによりClaudeやCursorなどのAIエージェントが翻訳リソースを直接操作できます。
  - icon: 📦
    title: 実行時依存ゼロ
    details: 完全なゼロ依存、gzip後20.5KB、サプライチェーンリスクなし。Tree-shaking対応。
  - icon: 🌐
    title: ICU MessageFormat
    details: 複数数形/選択/序数/オフセット/数値/日付/時刻フォーマットを10言語すべてでカバーする完全なICUコンパイラ。
  - icon: 🔒
    title: OWASP L4セキュリティ
    details: ReDoS対策、タイミング攻撃に強い等時比較、レート制限、指数バックオフ。エンタープライズ水準のコンプライアンス。
  - icon: 🎨
    title: RTLのネイティブ対応
    details: アラビア語/ヘブライ語/ペルシア語のRTLレイアウトを自動処理。CSSプロパティの反転と方向検出を備えます。
  - icon: ⚡
    title: LRUキャッシュシステム
    details: O(1)のキャッシュヒットは0.1ms未満。TTL期限の設定、キャッシュ統計とウォームアップに対応。
  - icon: 🧩
    title: プラグインライフサイクル
    details: beforeTranslate / afterTranslate / onMissingKey / onLocaleChange / onError の完全なフックチェーン。
---
