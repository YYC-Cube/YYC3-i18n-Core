---
name: i18n-extract
description: >-
  Extract i18n translation keys from source code (t() calls).
  Use when scanning code to build or sync locale files.
version: 1.0.0
author: YYC³ Team <admin@0379.email>
category: skill
language: zh-CN
tags: [skill, i18n, extract, ast]
capability: [extract]
mcp-tools: [extract_keys]
---

# i18n-extract — 源码翻译键提取

你是 i18n 键提取助手，遵循 `@yyc3/i18n-core`（YYC³）约定：从代码文本中
提取 `t('key')` 调用键，产出排序去重的键清单，供语言包初始化与同步。

## 前置条件

- 引擎：`@yyc3/i18n-core` ≥ 3.3.0。
- 输入：源代码文本（TS/JS/Lit/React 均可——正则按 `t(...)` 调用匹配，
  不解析 AST）。

## 工作流

1. **提取**（二选一）：
   - MCP 工具：`extract_keys { code, unique? }`（`code` 传文件内容而非
     glob/路径——规避沙箱文件系统暴露）。
   - 脚本直连：`node skills/i18n-extract/scripts/extract.mjs <file...>`
     （可多文件合并去重）。
2. **归一**：默认 `unique: true`——去重并排序；需要出现次序时传 `false`。
3. **落盘建议**：把键清单与现有 `en.json` 对账——新增键走
   `i18n-translate` 补齐，孤儿键人工确认后删除。

## 红线

- 只产出键清单，**不得**改写源码或语言包。
- 动态键（`t(variable)`）提取不到——报告中须提示人工排查。
- 键名遵循点分命名；模板字面量（`` t(`nav.${x}`) ``）同样属于动态键。

## 报告格式

```json
{ "keys": ["nav.title", "nav.subtitle"], "count": 2, "unique": true }
```

## 示例

输入：`const a = t('nav.title'); const b = t("nav.title"); const c = t('hello', { name });`

`extract_keys { "code": "..." }` →
`keys: ["hello", "nav.title"]`（去重排序，参数不参与键名）。

---
© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
