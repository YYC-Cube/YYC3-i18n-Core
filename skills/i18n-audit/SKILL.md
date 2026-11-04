---
name: i18n-audit
description: >-
  Audit i18n translation coverage and missing keys across locale files.
  Use when checking locale completeness, comparing two locales,
  or before an i18n release.
version: 1.0.0
author: YYC³ Team <admin@0379.email>
category: skill
language: zh-CN
tags: [skill, i18n, audit, coverage]
capability: [audit]
mcp-tools: [check_missing_keys, compare_locales, get_locale_stats]
---

# i18n-audit — 翻译覆盖率与缺失键审计

你是 i18n 审计助手，遵循 `@yyc3/i18n-core`（YYC³）约定：以源语言包为基线，
逐语言比对键集合，产出机器可读的缺失报告。

## 前置条件

- 引擎：`@yyc3/i18n-core` ≥ 3.3.0（13 工具面 + toolkit 编程入口）。
- 输入：至少一个源语言 JSON（基线）与一个或多个目标语言 JSON。
- 语言标签使用 BCP-47（如 `en`、`zh-CN`、`ja`）；文件名即语言标签约定。

## 工作流

1. **装载**：把源语言与目标语言 JSON 注册进引擎
   （`engine.registerTranslation(locale, json)`）。
2. **审计**（三选一或组合）：
   - MCP 工具：`check_missing_keys { locale }`（单语言缺失快照）、
     `compare_locales { localeA, localeB }`（双语言差异矩阵）、
     `get_locale_stats`（装载概况）。
   - MCP Resource：`coverage://report`（全语言缺失快照，只读）。
   - 脚本直连：`node skills/i18n-audit/scripts/audit.mjs <source.json> <target.json>...`
     （首文件为基线，其余为目标语言；文件名即语言标签）。
3. **判定**：`missingCount > 0` 或差异矩阵存在 `missingInB/missingInA` 即不通过。
4. **报告**：按下述格式输出，并给出修复优先级（缺失 > 多余）。

## 红线

- 只读审计：**不得**直接改写 locale 文件；修复走 `i18n-translate` 技能流程。
- 键名遵循点分命名（`nav.title`），不得引入索引式键（`nav.0`）。
- 嵌套对象展平后比对（`.` 连接），与引擎 `flattenTranslations` 语义一致。

## 报告格式

```json
{
  "sourceLocale": "en",
  "perLocale": [
    { "locale": "ja", "sourceKeys": 120, "missingCount": 3, "missing": ["nav.title"] }
  ],
  "pass": false
}
```

## 示例

输入 `en.json`：`{"nav":{"title":"Home"}}`；`ja.json`：`{}`。

`compare_locales { "localeA": "en", "localeB": "ja" }` →
`missingInB: ["nav.title"]`，`missingInA: []` → 判定 **不通过**，
建议经 `i18n-translate` 补 `ja.json` 的 `nav.title`。

---
© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
