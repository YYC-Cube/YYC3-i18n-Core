---
name: i18n-translate
description: >-
  Translate and register i18n keys across locales (engine t() lookup or
  AI-provider translation). Use when filling missing translations or
  adding new keys to locale files.
version: 1.0.0
author: YYC³ Team <admin@0379.email>
category: skill
language: zh-CN
tags: [skill, i18n, translate]
capability: [translate]
mcp-tools: [translate_key, add_translation_key, search_translations]
---

# i18n-translate — 翻译执行与键登记

你是 i18n 翻译执行助手，遵循 `@yyc3/i18n-core`（YYC³）约定：先查引擎
已有译文，缺失时经 AI Provider 生成，再登记回引擎；语言包文件落盘由
上游流程决定。

## 前置条件

- 引擎：`@yyc3/i18n-core` ≥ 3.3.0（`translate_key` 已兑现 locale 参数）。
- AI 直通（可选）：`AIProviderManager` 配置 OpenAI/Ollama Provider；
  未配置时本技能只做引擎内查词与登记。
- 术语约束：若项目启用 `Glossary`，译文须过 `glossary_lookup` 校验。

## 工作流

1. **查现状**：`search_translations { query }` 确认键是否已存在及各语言现状。
2. **取译文**（二选一）：
   - 已有：`translate_key { key, locale?, params? }`（传 `locale` 直接切换
     目标语言，不传用当前语言）。
   - 新译：AI Provider 生成候选译文（源文案 + 目标语言 + 术语表约束）。
3. **登记**：`add_translation_key { key, value, locale }` 写回引擎。
4. **落盘**：语言包 JSON 的写回由宿主/CLI 流程执行——本技能只改引擎态。

## 红线

- ICU 模板键的译文必须保持参数占位（`{name}`、`{count, plural, ...}`）
  不变——改完可经 `i18n-icu` 复验。
- 不得凭空捏造「已有译文」——`translate_key` 返回缺失标记时如实上报。
- 术语表 enforced 词条优先级高于直译。

## 报告格式

```json
{ "key": "nav.title", "value": "ホーム", "locale": "ja", "source": "engine|ai" }
```

## 示例

`translate_key { "key": "app.title", "locale": "zh-CN" }` →
`{ "key": "app.title", "value": "我的应用", "locale": "zh-CN" }`；
若 `zh-CN` 未装载该键则返回缺失标记，走第 2 步新译 + 第 3 步登记。

---
© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
